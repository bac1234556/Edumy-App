package com.edumy.repository;

import com.edumy.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {
    Optional<Certificate> findByCode(String code);
    Optional<Certificate> findByEnrollmentId(Long enrollmentId);
}
