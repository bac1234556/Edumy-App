package com.edumy.service;

import com.edumy.dto.instructor.CloudinarySignatureResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

@Service
@Slf4j
public class CloudinarySignService {

    @Value("${cloudinary.cloud-name:edumy_demo}")
    private String cloudName;

    @Value("${cloudinary.api-key:123456789012345}")
    private String apiKey;

    @Value("${cloudinary.api-secret:sample_secret_key}")
    private String apiSecret;

    public CloudinarySignatureResponse generateSignature(String folder) {
        long timestamp = Instant.now().getEpochSecond();

        // 1. Sắp xếp tham số theo alphabet
        Map<String, Object> paramsToSign = new TreeMap<>();
        paramsToSign.put("folder", folder);
        paramsToSign.put("timestamp", timestamp);

        StringBuilder serialized = new StringBuilder();
        for (Map.Entry<String, Object> entry : paramsToSign.entrySet()) {
            if (serialized.length() > 0) {
                serialized.append("&");
            }
            serialized.append(entry.getKey()).append("=").append(entry.getValue());
        }

        // 2. Nối apiSecret vào cuối chuỗi
        String stringToSign = serialized.toString() + apiSecret;

        // 3. Ký bằng SHA-256
        String signature = sha256Hex(stringToSign);

        return CloudinarySignatureResponse.builder()
                .signature(signature)
                .timestamp(timestamp)
                .apiKey(apiKey)
                .cloudName(cloudName)
                .folder(folder)
                .build();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Lỗi khi tạo SHA-256 signature", e);
            throw new RuntimeException("Không thể tạo chữ ký số Cloudinary");
        }
    }
}