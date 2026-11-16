package com.edumy.service;

/** Cho test ở package khác gọi bộ sinh mã (CertificateService.generateCode là package-private). */
public final class CertificateServiceTestAccess {
    private CertificateServiceTestAccess() {}

    public static String generate() {
        return CertificateService.generateCode();
    }
}
