package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.dto.instructor.CloudinarySignatureResponse;
import com.edumy.service.CloudinarySignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/instructor/media")
@RequiredArgsConstructor
@Tag(name = "Instructor Media", description = "Quản lý tải tệp đa phương tiện")
public class MediaSignatureController {

    private final CloudinarySignService cloudinarySignService;

    @PostMapping("/signature")
    @Operation(summary = "Sinh chữ ký HMAC-SHA256 cho Cloudinary direct upload")
    public ResponseEntity<ApiResponse<CloudinarySignatureResponse>> getUploadSignature(
            @RequestParam(defaultValue = "edumy/courses") String folder) {
        CloudinarySignatureResponse response = cloudinarySignService.generateSignature(folder);
        return ResponseEntity.ok(ApiResponse.ok(response, "Khởi tạo chữ ký tải lên thành công"));
    }
}