package com.edumy.dto.auth;

import com.edumy.entity.Role;
import com.edumy.entity.User;

public record UserProfile(Long id, String email, String fullName, Role role, String avatarUrl) {
    public static UserProfile from(User user) {
        return new UserProfile(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getAvatarUrl());
    }
}
