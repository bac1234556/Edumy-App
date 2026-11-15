package com.edumy.controller;

import com.edumy.common.ApiResponse;
import com.edumy.common.PageResponse;
import com.edumy.dto.qa.AnswerRequest;
import com.edumy.dto.qa.AnswerResponse;
import com.edumy.dto.qa.QuestionRequest;
import com.edumy.dto.qa.QuestionResponse;
import com.edumy.exception.UnauthorizedException;
import com.edumy.service.QuestionAnswerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Lesson Q&A API", description = "Câu hỏi, câu trả lời và chấp nhận câu trả lời trong bài học")
public class QuestionAnswerController {

    private final QuestionAnswerService questionAnswerService;

    @PostMapping({"/api/lessons/{id}/questions", "/api/v1/lessons/{id}/questions"})
    @Operation(summary = "Đặt câu hỏi cho bài học",
            description = "Chỉ người đã ghi danh khóa học chứa bài học mới được đặt câu hỏi.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo câu hỏi thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Chưa ghi danh khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy bài học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "ID bài học", example = "12") @PathVariable @Min(1) Long id,
            @Valid @RequestBody QuestionRequest request
    ) {
        ensureAuthenticated(userId);
        QuestionResponse response = questionAnswerService.createQuestion(id, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo câu hỏi thành công"));
    }

    @GetMapping({"/api/lessons/{id}/questions", "/api/v1/lessons/{id}/questions"})
    @Operation(summary = "Lấy câu hỏi và câu trả lời của bài học",
            description = "Danh sách mới nhất trước, phân trang. Chỉ học viên đã ghi danh hoặc giảng viên sở hữu khóa học được xem.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Danh sách câu hỏi",
                    content = @Content(schema = @Schema(implementation = QuestionResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Tham số phân trang không hợp lệ",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền xem khóa học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy bài học",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestions(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "ID bài học", example = "12") @PathVariable @Min(1) Long id,
            @Parameter(description = "Trang bắt đầu từ 0") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Số phần tử (1-50)") @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size
    ) {
        ensureAuthenticated(userId);
        PageResponse<QuestionResponse> response = questionAnswerService.getLessonQuestions(id, userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.ok(response, "Lấy danh sách câu hỏi thành công"));
    }

    @PostMapping({"/api/questions/{id}/answers", "/api/v1/questions/{id}/answers"})
    @Operation(summary = "Trả lời câu hỏi",
            description = "Chỉ học viên đã ghi danh khóa học hoặc giảng viên sở hữu khóa học được trả lời.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Tạo câu trả lời thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Nội dung không hợp lệ",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền trả lời",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy câu hỏi",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<AnswerResponse>> createAnswer(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "ID câu hỏi", example = "34") @PathVariable @Min(1) Long id,
            @Valid @RequestBody AnswerRequest request
    ) {
        ensureAuthenticated(userId);
        AnswerResponse response = questionAnswerService.createAnswer(id, userId, request.getContent());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response, "Tạo câu trả lời thành công"));
    }

    @PatchMapping({"/api/answers/{id}/accept", "/api/v1/answers/{id}/accept"})
    @Operation(summary = "Chấp nhận câu trả lời",
            description = "Chỉ giảng viên sở hữu khóa học hoặc người đặt câu hỏi được chấp nhận. " +
                    "Mỗi lần chấp nhận sẽ bỏ trạng thái của câu trả lời cũ; gọi lại cùng answer là idempotent.")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đã chấp nhận câu trả lời"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "ID không hợp lệ",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền chấp nhận",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy câu trả lời",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
    })
    public ResponseEntity<ApiResponse<AnswerResponse>> acceptAnswer(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "ID câu trả lời", example = "59") @PathVariable @Min(1) Long id
    ) {
        ensureAuthenticated(userId);
        return ResponseEntity.ok(ApiResponse.ok(questionAnswerService.acceptAnswer(id, userId),
                "Chấp nhận câu trả lời thành công"));
    }

    private void ensureAuthenticated(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException("Vui lòng đăng nhập");
        }
    }
}
