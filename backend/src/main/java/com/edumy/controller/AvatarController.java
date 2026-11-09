package com.edumy.controller;

import com.edumy.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.ImageIO;
import java.io.*;
import java.nio.file.*;
import java.util.*;

@RestController
public class AvatarController {
    private final Path directory;
    public AvatarController(@Value("${app.avatar-directory:./uploads/avatars}") String directory) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
    }

    @Operation(summary = "Upload PNG or JPEG avatar, at most 2 MB and 4096 pixels per side")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping(value = {"/api/users/me/avatar", "/api/v1/users/me/avatar"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 2 * 1024 * 1024) throw new IllegalArgumentException("Ảnh phải nhỏ hơn 2 MB");
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new IllegalArgumentException("Chọn ảnh PNG hoặc JPEG");
            var reader = readers.next();
            try {
                if (!Set.of("png", "jpeg").contains(reader.getFormatName().toLowerCase(Locale.ROOT)))
                    throw new IllegalArgumentException("Chọn ảnh PNG hoặc JPEG");
                reader.setInput(input);
                if (reader.getWidth(0) > 4096 || reader.getHeight(0) > 4096)
                    throw new IllegalArgumentException("Ảnh không được vượt quá 4096 pixel");
                var image = reader.read(0);
                Files.createDirectories(directory);
                String name = UUID.randomUUID() + ".png";
                ImageIO.write(image, "png", directory.resolve(name).toFile());
                return ApiResponse.ok(Map.of("avatarUrl", "/api/avatars/" + name));
            } finally { reader.dispose(); }
        }
    }

    @GetMapping(value = "/api/avatars/{name:[a-f0-9-]+\\.png}", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> image(@PathVariable String name) throws IOException {
        Path path = directory.resolve(name);
        if (!Files.isRegularFile(path)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().header("X-Content-Type-Options", "nosniff").body(Files.readAllBytes(path));
    }
}
