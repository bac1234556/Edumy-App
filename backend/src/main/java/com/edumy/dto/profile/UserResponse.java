package com.edumy.dto.profile;

import com.edumy.entity.Role;
import com.edumy.entity.User;

public record UserResponse(Long id, String email, String fullName, Role role, String avatarUrl, String bio) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getAvatarUrl(), user.getBio());
    }
}
