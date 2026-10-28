package com.edumy.dto.admin;

import com.edumy.entity.Role;
import com.edumy.entity.User;
import com.edumy.entity.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin người dùng dành cho quản trị viên")
public class UserResponse {

    @Schema(description = "ID người dùng", example = "1")
    private Long id;

    @Schema(description = "Địa chỉ email", example = "admin@edumy.vn")
    private String email;

    @Schema(description = "Họ và tên", example = "Quản trị viên Edumy")
    private String fullName;

    @Schema(description = "Ảnh đại diện URL", example = "https://res.cloudinary.com/.../avatar.jpg")
    private String avatarUrl;

    @Schema(description = "Vai trò", example = "ADMIN")
    private Role role;

    @Schema(description = "Trạng thái tài khoản", example = "ACTIVE")
    private UserStatus status;

    @Schema(description = "Tiểu sử giới thiệu")
    private String bio;

    @Schema(description = "Thời gian tạo tài khoản")
    private LocalDateTime createdAt;

    @Schema(description = "Thời gian cập nhật gần nhất")
    private LocalDateTime updatedAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
