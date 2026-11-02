package com.edumy.service;

import com.edumy.common.PageResponse;
import com.edumy.dto.admin.UserResponse;
import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(String keyword, Role role, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("fullName")), pattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), pattern);
                predicates.add(cb.or(nameLike, emailLike));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        return PageResponse.from(userPage.map(UserResponse::from));
    }
}
