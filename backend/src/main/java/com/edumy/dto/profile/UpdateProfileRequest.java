package com.edumy.dto.profile;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 2000) String bio,
        @Size(max = 255) @Pattern(regexp = "^(https?://[^\\s]+|/api/avatars/[a-f0-9-]+\\.png)?$") String avatarUrl) {}
