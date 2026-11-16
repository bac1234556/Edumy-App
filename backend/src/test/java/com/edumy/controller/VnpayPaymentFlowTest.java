package com.edumy.controller;

import com.edumy.entity.*;
import com.edumy.repository.*;
import com.edumy.service.VnpayGatewayTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "payment.provider=vnpay",
        "payment.vnpay.tmn-code=TESTTMN1",
        "payment.vnpay.hash-secret=" + VnpayGatewayTest.SECRET,
        "payment.vnpay.return-url=http://localhost:8080/api/v1/payments/vnpay/return"
})
public class VnpayPaymentFlowTest {

    private static final AtomicLong NEXT_USER = new AtomicLong(500_000);
    private static final String SANDBOX = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?";
    private static final String RETURN = "/api/v1/payments/vnpay/return";
    private static final String IPN = "/api/v1/payments/vnpay/ipn";

    @Autowired private MockMvc mockMvc;
    @Autowired private CourseRepository courseRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;

    private Long userId;
    private Long paidCourseId;
    private Long freeCourseId;

    @BeforeEach
    void setUp() {
        userId = NEXT_USER.incrementAndGet();
        paidCourseId = courseRepository.save(Course.builder().instructorId(1L).categoryId(1L).title("Khóa có phí")
                .price(new BigDecimal("99000.00")).status(CourseStatus.PUBLISHED).build()).getId();
        freeCourseId = courseRepository.save(Course.builder().instructorId(1L).categoryId(1L).title("Khóa miễn phí")
                .price(BigDecimal.ZERO).status(CourseStatus.PUBLISHED).build()).getId();
    }

    private RequestPostProcessor student(Long id) {
        return authentication(new UsernamePasswordAuthenticationToken(
                id, null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))));
    }

    private ResultActions checkout(Long courseId, String extraJson) throws Exception {
        return mockMvc.perform(post("/api/v1/orders/checkout").with(student(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"courseId\":" + courseId + extraJson + "}"));
    }

    /** Tạo đơn VNPay PENDING qua API và trả về đơn trong DB. */
    private Order pendingOrder() throws Exception {
        checkout(paidCourseId, "").andExpect(status().isCreated());
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).get(0);
    }

    private Map<String, String> signedResult(String txnRef, String amount, String responseCode) throws Exception {
        Map<String, String> p = new HashMap<>();
        p.put("vnp_TmnCode", "TESTTMN1");
        p.put("vnp_Amount", amount);
        p.put("vnp_BankCode", "NCB");
        p.put("vnp_CardType", "ATM");
        p.put("vnp_OrderInfo", "Thanh toan khoa hoc 1");
        p.put("vnp_PayDate", "20261116101500");
        p.put("vnp_ResponseCode", responseCode);
        p.put("vnp_TransactionNo", "14000000");
        p.put("vnp_TransactionStatus", responseCode);
        p.put("vnp_TxnRef", txnRef);
        p.put("vnp_SecureHash", VnpayGatewayTest.expectedSignature(p));
        return p;
    }

    private ResultActions callback(String url, Map<String, String> params, String... extra) throws Exception {
        MockHttpServletRequestBuilder request = get(url);
        params.forEach(request::param);
        for (int i = 0; i + 1 < extra.length; i += 2) request.param(extra[i], extra[i + 1]);
        return mockMvc.perform(request);
    }

    private boolean enrolled() {
        return enrollmentRepository.existsByUserIdAndCourseId(userId, paidCourseId);
    }

    // ---------- checkout ----------

    @Test
    @DisplayName("Checkout khóa có phí tạo đơn PENDING, trả paymentUrl đã ký và chưa ghi danh")
    void checkoutReturnsSignedPaymentUrlWithoutEnrolling() throws Exception {
        MvcResult result = checkout(paidCourseId, ",\"returnUri\":\"edumy://payment-result\"")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.paymentMethod").value("VNPAY"))
                .andExpect(jsonPath("$.data.paymentUrl", startsWith(SANDBOX)))
                .andExpect(jsonPath("$.data.enrollmentId").doesNotExist())
                .andReturn();

        Order order = orderRepository.findByUserIdOrderByCreatedAtDesc(userId).get(0);
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(PaymentMethod.VNPAY, order.getPaymentMethod());
        assertNull(order.getPaidAt());
        assertFalse(enrolled());

        String url = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(StandardCharsets.UTF_8), "$.data.paymentUrl");
        Map<String, String> params = VnpayGatewayTest.queryOf(url);
        assertEquals(order.getTxnRef(), params.get("vnp_TxnRef"));
        assertEquals("9900000", params.get("vnp_Amount"));
        assertEquals(VnpayGatewayTest.expectedSignature(params), params.get("vnp_SecureHash"));
        assertTrue(params.get("vnp_ReturnUrl").endsWith("?app=edumy%3A%2F%2Fpayment-result"));
    }

    @Test
    @DisplayName("Khi bật VNPay, gửi MOCK để qua mặt thanh toán bị từ chối 400")
    void mockMethodIsRejectedWhenVnpayEnabled() throws Exception {
        checkout(paidCourseId, ",\"paymentMethod\":\"MOCK\"")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
        assertTrue(orderRepository.findByUserIdOrderByCreatedAtDesc(userId).isEmpty());
        assertFalse(enrolled());
    }

    @Test
    @DisplayName("Địa chỉ quay về app ngoài edumy:// và exp:// bị từ chối")
    void foreignReturnUriIsRejected() throws Exception {
        checkout(paidCourseId, ",\"returnUri\":\"https://evil.example/steal\"").andExpect(status().isBadRequest());
        checkout(paidCourseId, ",\"returnUri\":\"exp://192.168.1.5:8081/--/payment-result\"").andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Khóa 0đ vẫn ghi danh trực tiếp, không qua VNPay")
    void freeCourseEnrollsDirectly() throws Exception {
        checkout(freeCourseId, "")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("FREE"))
                .andExpect(jsonPath("$.data.paymentUrl").doesNotExist());
        assertTrue(enrollmentRepository.existsByUserIdAndCourseId(userId, freeCourseId));
    }

    @Test
    @DisplayName("Endpoint cho biết cổng thanh toán đang bật")
    void providerEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/payments/provider").with(student(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.provider").value("vnpay"));
    }

    // ---------- Return URL ----------

    @Test
    @DisplayName("Return URL hợp lệ: đơn PAID, tạo Enrollment, chuyển hướng 302 về app")
    void returnUrlWithValidChecksumPaysAndEnrolls() throws Exception {
        Order order = pendingOrder();
        callback(RETURN, signedResult(order.getTxnRef(), "9900000", "00"), "app", "edumy://payment-result")
                .andExpect(status().isFound())
                .andExpect(header().string("Location",
                        "edumy://payment-result?status=PAID&txnRef=" + order.getTxnRef()));

        Order saved = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.PAID, saved.getStatus());
        assertNotNull(saved.getPaidAt());
        assertTrue(enrolled());
        assertEquals(saved.getId(), enrollmentRepository.findByUserIdAndCourseId(userId, paidCourseId).orElseThrow().getOrderId());
    }

    @Test
    @DisplayName("Return URL sai checksum bị từ chối: đơn vẫn PENDING, không ghi danh")
    void returnUrlWithWrongChecksumIsRejected() throws Exception {
        Order order = pendingOrder();
        Map<String, String> forged = signedResult(order.getTxnRef(), "9900000", "00");
        forged.put("vnp_Amount", "100");   // sửa số tiền sau khi ký
        callback(RETURN, forged, "app", "edumy://payment-result")
                .andExpect(status().isFound())
                .andExpect(header().string("Location", startsWith("edumy://payment-result?status=INVALID")));

        assertEquals(OrderStatus.PENDING, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertFalse(enrolled());

        Map<String, String> noHash = signedResult(order.getTxnRef(), "9900000", "00");
        noHash.remove("vnp_SecureHash");
        callback(RETURN, noHash).andExpect(header().string("Location", containsString("status=INVALID")));
        assertFalse(enrolled());
    }

    @Test
    @DisplayName("Return URL: thanh toán thất bại (mã 24) thì đơn FAILED và không ghi danh")
    void returnUrlWithFailureCode() throws Exception {
        Order order = pendingOrder();
        callback(RETURN, signedResult(order.getTxnRef(), "9900000", "24"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", containsString("status=FAILED")));
        assertEquals(OrderStatus.FAILED, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertFalse(enrolled());
    }

    @Test
    @DisplayName("Return URL gọi lại nhiều lần chỉ ghi danh một lần")
    void returnUrlIsIdempotent() throws Exception {
        Order order = pendingOrder();
        Map<String, String> params = signedResult(order.getTxnRef(), "9900000", "00");
        callback(RETURN, params).andExpect(header().string("Location", containsString("status=PAID")));
        callback(RETURN, params).andExpect(header().string("Location", containsString("status=PAID")));
        assertEquals(1, enrollmentRepository.findAll().stream()
                .filter(e -> e.getUserId().equals(userId) && e.getCourseId().equals(paidCourseId)).count());
    }

    @Test
    @DisplayName("Return URL chỉ chuyển về app qua scheme cho phép; scheme lạ dùng deep link mặc định")
    void returnUrlRedirectAllowList() throws Exception {
        Order order = pendingOrder();
        Map<String, String> params = signedResult(order.getTxnRef(), "9900000", "00");
        callback(RETURN, params, "app", "https://evil.example/steal")
                .andExpect(header().string("Location", startsWith("edumy://payment-result?")));
        callback(RETURN, params, "app", "exp://192.168.1.5:8081/--/payment-result")
                .andExpect(header().string("Location", startsWith("exp://192.168.1.5:8081/--/payment-result?status=PAID")));
    }

    // ---------- IPN ----------

    @Test
    @DisplayName("IPN hợp lệ trả RspCode 00 (không cần JWT), đơn PAID và có Enrollment; gọi lại trả 02")
    void ipnConfirmsOnceThenReportsAlreadyConfirmed() throws Exception {
        Order order = pendingOrder();
        Map<String, String> params = signedResult(order.getTxnRef(), "9900000", "00");
        callback(IPN, params).andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Confirm Success"));
        assertEquals(OrderStatus.PAID, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertTrue(enrolled());

        callback(IPN, params).andExpect(jsonPath("$.RspCode").value("02"));
    }

    @Test
    @DisplayName("IPN sai checksum trả 97 và không đổi đơn")
    void ipnWithWrongChecksum() throws Exception {
        Order order = pendingOrder();
        Map<String, String> forged = signedResult(order.getTxnRef(), "9900000", "00");
        forged.put("vnp_ResponseCode", "00");
        forged.put("vnp_TxnRef", order.getTxnRef());
        forged.put("vnp_SecureHash", "f".repeat(128));
        callback(IPN, forged).andExpect(jsonPath("$.RspCode").value("97"));
        assertEquals(OrderStatus.PENDING, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertFalse(enrolled());
    }

    @Test
    @DisplayName("IPN: mã đơn không tồn tại trả 01; sai số tiền trả 04 và không ghi danh")
    void ipnUnknownOrderAndWrongAmount() throws Exception {
        callback(IPN, signedResult("EDU00000000000000000000", "9900000", "00")).andExpect(jsonPath("$.RspCode").value("01"));

        Order order = pendingOrder();
        callback(IPN, signedResult(order.getTxnRef(), "9900001", "00")).andExpect(jsonPath("$.RspCode").value("04"));
        assertEquals(OrderStatus.PENDING, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertFalse(enrolled());
    }

    @Test
    @DisplayName("IPN báo thanh toán thất bại: xác nhận đã nhận (00) nhưng đơn FAILED")
    void ipnFailureMarksOrderFailed() throws Exception {
        Order order = pendingOrder();
        callback(IPN, signedResult(order.getTxnRef(), "9900000", "24")).andExpect(jsonPath("$.RspCode").value("00"));
        assertEquals(OrderStatus.FAILED, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertFalse(enrolled());
    }

    // ---------- order status ----------

    @Test
    @DisplayName("App xem trạng thái đơn: chủ đơn thấy PAID và enrollmentId, người khác 404, chưa đăng nhập 401")
    void orderStatusIsOwnerOnly() throws Exception {
        Order order = pendingOrder();
        mockMvc.perform(get("/api/v1/orders/" + order.getTxnRef()).with(student(userId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.enrollmentId").doesNotExist());

        callback(RETURN, signedResult(order.getTxnRef(), "9900000", "00")).andExpect(status().isFound());
        mockMvc.perform(get("/api/v1/orders/" + order.getTxnRef()).with(student(userId)))
                .andExpect(jsonPath("$.data.status").value("PAID"))
                .andExpect(jsonPath("$.data.courseTitle").value("Khóa có phí"))
                .andExpect(jsonPath("$.data.enrollmentId").isNumber());

        mockMvc.perform(get("/api/v1/orders/" + order.getTxnRef()).with(student(NEXT_USER.incrementAndGet())))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/orders/" + order.getTxnRef())).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Các endpoint thanh toán có trên Swagger")
    void documentedOnSwagger() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/payments/vnpay/return'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/payments/vnpay/ipn'].get").exists())
                .andExpect(jsonPath("$.paths['/api/v1/orders/{txnRef}'].get").exists());
    }
}
