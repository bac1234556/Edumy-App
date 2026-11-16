package com.edumy.service;

import com.edumy.config.PaymentProperties;
import com.edumy.entity.Order;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;

/**
 * Tạo URL thanh toán VNPay (API 2.1.0) và xác minh chữ ký HMAC-SHA512 của Return URL / IPN.
 * Quy tắc ký: sắp xếp tham số theo tên, bỏ tham số rỗng, ghép {@code tên=giá trị} (giá trị URL-encode US-ASCII)
 * bằng '&', rồi HMAC-SHA512 với HashSecret, xuất hex.
 */
@Component
@RequiredArgsConstructor
public class VnpayGateway {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNP_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final String SECURE_HASH = "vnp_SecureHash";
    private static final String SECURE_HASH_TYPE = "vnp_SecureHashType";

    private final PaymentProperties properties;

    public String buildPaymentUrl(Order order, String clientIp, String appRedirect) {
        PaymentProperties.Vnpay config = properties.getVnpay();
        ZonedDateTime now = ZonedDateTime.now(VIETNAM);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountInSmallestUnit(order)));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", order.getTxnRef());
        // VNPay yêu cầu nội dung tiếng Việt không dấu, không ký tự đặc biệt.
        params.put("vnp_OrderInfo", "Thanh toan khoa hoc " + order.getCourseId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrlFor(appRedirect));
        params.put("vnp_IpAddr", normalizeIp(clientIp));
        params.put("vnp_CreateDate", now.format(VNP_TIME));
        params.put("vnp_ExpireDate", now.plusMinutes(config.getExpireMinutes()).format(VNP_TIME));

        String query = joinEncoded(params);
        return config.getPayUrl() + "?" + query + "&" + SECURE_HASH + "=" + sign(query);
    }

    /** Kiểm tra checksum của các tham số vnp_* nhận về (Return URL hoặc IPN). */
    public boolean verify(Map<String, String> params) {
        String received = params.get(SECURE_HASH);
        if (received == null || received.isBlank()) {
            return false;
        }
        Map<String, String> signed = new TreeMap<>();
        params.forEach((key, value) -> {
            if (key.startsWith("vnp_") && !SECURE_HASH.equals(key) && !SECURE_HASH_TYPE.equals(key)) {
                signed.put(key, value);
            }
        });
        byte[] expected = sign(joinEncoded(signed)).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = received.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, actual);
    }

    /** VNPay nhận số tiền nhân 100 (không có phần thập phân). */
    public static long amountInSmallestUnit(Order order) {
        return order.getAmount().movePointRight(2).longValueExact();
    }

    String returnUrlFor(String appRedirect) {
        String base = properties.getVnpay().getReturnUrl();
        if (appRedirect == null || appRedirect.isBlank()) {
            return base;
        }
        return base + (base.contains("?") ? "&" : "?") + "app=" + URLEncoder.encode(appRedirect, StandardCharsets.UTF_8);
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(properties.getVnpay().getHashSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Không tạo được chữ ký HMAC-SHA512", e);
        }
    }

    private static String joinEncoded(Map<String, String> sortedParams) {
        StringBuilder out = new StringBuilder();
        sortedParams.forEach((key, value) -> {
            if (value == null || value.isEmpty()) {
                return;
            }
            if (out.length() > 0) {
                out.append('&');
            }
            out.append(URLEncoder.encode(key, StandardCharsets.US_ASCII))
                    .append('=')
                    .append(URLEncoder.encode(value, StandardCharsets.US_ASCII));
        });
        return out.toString();
    }

    private static String normalizeIp(String ip) {
        if (ip == null || ip.isBlank() || ip.contains(":")) {
            return "127.0.0.1";
        }
        return ip;
    }
}
