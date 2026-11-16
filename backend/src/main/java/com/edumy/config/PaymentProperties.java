package com.edumy.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * W10-D1 (Issue #95): cấu hình thanh toán. Mặc định {@code payment.provider=mock}.
 * Biến môi trường tương ứng: PAYMENT_PROVIDER, PAYMENT_VNPAY_TMNCODE, PAYMENT_VNPAY_HASHSECRET,
 * PAYMENT_VNPAY_RETURNURL, PAYMENT_VNPAY_PAYURL, PAYMENT_APPREDIRECT.
 */
@Component
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentProperties {

    public static final String MOCK = "mock";
    public static final String VNPAY = "vnpay";

    /** mock | vnpay */
    private String provider = MOCK;

    /** Deep link mở lại app khi người dùng không gửi returnUri. */
    private String appRedirect = "edumy://payment-result";

    /** Chỉ cho phép quay về app qua các scheme này (chống open redirect). */
    private List<String> allowedRedirectPrefixes = List.of("edumy://", "exp://", "exps://");

    private final Vnpay vnpay = new Vnpay();

    @Getter
    @Setter
    public static class Vnpay {
        private String tmnCode;
        private String hashSecret;
        private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        /** URL công khai của GET /api/v1/payments/vnpay/return trên backend. */
        private String returnUrl;
        private int expireMinutes = 15;
    }

    public boolean isVnpay() {
        return VNPAY.equalsIgnoreCase(provider);
    }

    public String providerName() {
        return provider == null ? MOCK : provider.toLowerCase(Locale.ROOT);
    }

    public boolean isAllowedRedirect(String uri) {
        return uri != null && allowedRedirectPrefixes.stream().anyMatch(uri::startsWith);
    }

    @PostConstruct
    public void validate() {
        if (!MOCK.equalsIgnoreCase(provider) && !VNPAY.equalsIgnoreCase(provider)) {
            throw new IllegalStateException("payment.provider chỉ nhận mock hoặc vnpay, hiện là: " + provider);
        }
        if (isVnpay() && (isBlank(vnpay.tmnCode) || isBlank(vnpay.hashSecret) || isBlank(vnpay.returnUrl))) {
            throw new IllegalStateException(
                    "payment.provider=vnpay cần payment.vnpay.tmn-code, payment.vnpay.hash-secret và payment.vnpay.return-url");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
