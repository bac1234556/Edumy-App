package com.edumy.service;

import com.edumy.config.PaymentProperties;
import com.edumy.entity.Order;
import com.edumy.entity.PaymentMethod;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

import static org.junit.jupiter.api.Assertions.*;

public class VnpayGatewayTest {

    public static final String SECRET = "TESTSECRETKEYTESTSECRETKEY123456";

    private VnpayGateway gateway;
    private Order order;

    @BeforeEach
    void setUp() {
        PaymentProperties props = new PaymentProperties();
        props.setProvider("vnpay");
        props.getVnpay().setTmnCode("TESTTMN1");
        props.getVnpay().setHashSecret(SECRET);
        props.getVnpay().setReturnUrl("http://localhost:8080/api/v1/payments/vnpay/return");
        gateway = new VnpayGateway(props);
        order = Order.builder().id(1L).userId(2L).courseId(3L).amount(new BigDecimal("99000.00"))
                .paymentMethod(PaymentMethod.VNPAY).txnRef("EDU20261116100000123456").build();
    }

    /** Cài đặt độc lập của thuật toán ký VNPay để đối chiếu với VnpayGateway. */
    public static String expectedSignature(Map<String, String> params) throws Exception {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        sorted.remove("vnp_SecureHash");
        sorted.remove("vnp_SecureHashType");
        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> e : sorted.entrySet()) {
            if (e.getValue() == null || e.getValue().isEmpty()) continue;
            if (data.length() > 0) data.append('&');
            data.append(URLEncoder.encode(e.getKey(), StandardCharsets.US_ASCII))
                    .append('=').append(URLEncoder.encode(e.getValue(), StandardCharsets.US_ASCII));
        }
        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        StringBuilder hex = new StringBuilder();
        for (byte b : mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8))) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    public static Map<String, String> queryOf(String url) {
        Map<String, String> params = new HashMap<>();
        for (String pair : URI.create(url).getRawQuery().split("&")) {
            String[] kv = pair.split("=", 2);
            params.put(URLDecoder.decode(kv[0], StandardCharsets.UTF_8), URLDecoder.decode(kv[1], StandardCharsets.UTF_8));
        }
        return params;
    }

    @Test
    @DisplayName("URL thanh toán có đủ tham số VNPay 2.1.0, số tiền nhân 100 và nội dung không dấu")
    void paymentUrlContainsRequiredParameters() {
        String url = gateway.buildPaymentUrl(order, "203.0.113.5", "edumy://payment-result");
        assertTrue(url.startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?"));
        Map<String, String> p = queryOf(url);
        assertEquals("2.1.0", p.get("vnp_Version"));
        assertEquals("pay", p.get("vnp_Command"));
        assertEquals("TESTTMN1", p.get("vnp_TmnCode"));
        assertEquals("9900000", p.get("vnp_Amount"));
        assertEquals("VND", p.get("vnp_CurrCode"));
        assertEquals("EDU20261116100000123456", p.get("vnp_TxnRef"));
        assertEquals("Thanh toan khoa hoc 3", p.get("vnp_OrderInfo"));
        assertEquals("203.0.113.5", p.get("vnp_IpAddr"));
        assertEquals("other", p.get("vnp_OrderType"));
        assertTrue(p.get("vnp_CreateDate").matches("\\d{14}"));
        assertTrue(p.get("vnp_ExpireDate").compareTo(p.get("vnp_CreateDate")) > 0);
        assertEquals("http://localhost:8080/api/v1/payments/vnpay/return?app=edumy%3A%2F%2Fpayment-result", p.get("vnp_ReturnUrl"));
    }

    @Test
    @DisplayName("Chữ ký HMAC-SHA512 trong URL khớp cài đặt độc lập của thuật toán VNPay")
    void signatureMatchesIndependentImplementation() throws Exception {
        Map<String, String> p = queryOf(gateway.buildPaymentUrl(order, "203.0.113.5", "exp://192.168.1.5:8081/--/payment-result"));
        assertEquals(128, p.get("vnp_SecureHash").length());
        assertEquals(expectedSignature(p), p.get("vnp_SecureHash"));
    }

    @Test
    @DisplayName("Số tiền nhân 100 chính xác kể cả khi có phần thập phân")
    void amountIsMultipliedBy100() {
        order.setAmount(new BigDecimal("1999000.50"));
        assertEquals(199900050L, VnpayGateway.amountInSmallestUnit(order));
    }

    @Test
    @DisplayName("IPv6 hoặc thiếu IP được thay bằng 127.0.0.1 vì VNPay chỉ nhận IPv4")
    void ipv6FallsBackToLoopback() {
        assertEquals("127.0.0.1", queryOf(gateway.buildPaymentUrl(order, "0:0:0:0:0:0:0:1", null)).get("vnp_IpAddr"));
        assertEquals("127.0.0.1", queryOf(gateway.buildPaymentUrl(order, null, null)).get("vnp_IpAddr"));
        assertEquals("http://localhost:8080/api/v1/payments/vnpay/return",
                queryOf(gateway.buildPaymentUrl(order, "1.2.3.4", null)).get("vnp_ReturnUrl"));
    }

    @Test
    @DisplayName("verify: chữ ký đúng được chấp nhận, kể cả khi viết hoa hex và có SecureHashType")
    void verifyAcceptsValidSignature() throws Exception {
        Map<String, String> p = queryOf(gateway.buildPaymentUrl(order, "1.2.3.4", "edumy://payment-result"));
        assertTrue(gateway.verify(p));
        p.put("vnp_SecureHash", p.get("vnp_SecureHash").toUpperCase());
        p.put("vnp_SecureHashType", "HmacSHA512");
        assertTrue(gateway.verify(p));
    }

    @Test
    @DisplayName("verify: sửa bất kỳ tham số, thêm tham số vnp_, sai khóa hoặc thiếu chữ ký đều bị từ chối")
    void verifyRejectsTampering() {
        Map<String, String> original = queryOf(gateway.buildPaymentUrl(order, "1.2.3.4", "edumy://payment-result"));

        Map<String, String> amount = new HashMap<>(original);
        amount.put("vnp_Amount", "100");
        assertFalse(gateway.verify(amount));

        Map<String, String> added = new HashMap<>(original);
        added.put("vnp_Extra", "1");
        assertFalse(gateway.verify(added));

        Map<String, String> removed = new HashMap<>(original);
        removed.remove("vnp_OrderInfo");
        assertFalse(gateway.verify(removed));

        Map<String, String> noHash = new HashMap<>(original);
        noHash.remove("vnp_SecureHash");
        assertFalse(gateway.verify(noHash));

        Map<String, String> blank = new HashMap<>(original);
        blank.put("vnp_SecureHash", "");
        assertFalse(gateway.verify(blank));

        Map<String, String> wrongHash = new HashMap<>(original);
        wrongHash.put("vnp_SecureHash", "0".repeat(128));
        assertFalse(gateway.verify(wrongHash));
    }

    @Test
    @DisplayName("verify: tham số không bắt đầu bằng vnp_ (như app) không ảnh hưởng chữ ký")
    void verifyIgnoresNonVnpParameters() {
        Map<String, String> p = queryOf(gateway.buildPaymentUrl(order, "1.2.3.4", "edumy://payment-result"));
        p.put("app", "edumy://payment-result");
        assertTrue(gateway.verify(p));
    }

    @Test
    @DisplayName("Cấu hình: provider lạ hoặc thiếu khóa VNPay khiến ứng dụng không khởi động")
    void propertiesValidation() {
        PaymentProperties unknown = new PaymentProperties();
        unknown.setProvider("paypal");
        assertThrows(IllegalStateException.class, unknown::validate);

        PaymentProperties missing = new PaymentProperties();
        missing.setProvider("vnpay");
        assertThrows(IllegalStateException.class, missing::validate);

        PaymentProperties mock = new PaymentProperties();
        assertDoesNotThrow(mock::validate);
        assertFalse(mock.isVnpay());
        assertEquals("mock", mock.providerName());
    }

    @Test
    @DisplayName("Chỉ cho quay về app qua edumy:// hoặc exp://, chặn open redirect")
    void redirectAllowList() {
        PaymentProperties props = new PaymentProperties();
        assertTrue(props.isAllowedRedirect("edumy://payment-result"));
        assertTrue(props.isAllowedRedirect("exp://192.168.1.5:8081/--/payment-result"));
        assertFalse(props.isAllowedRedirect("https://evil.example/steal"));
        assertFalse(props.isAllowedRedirect("javascript:alert(1)"));
        assertFalse(props.isAllowedRedirect(null));
    }
}
