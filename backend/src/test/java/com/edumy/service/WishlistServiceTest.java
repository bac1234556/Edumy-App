package com.edumy.service;

import com.edumy.dto.course.CourseSummaryResponse;
import com.edumy.entity.*;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import com.edumy.repository.UserRepository;
import com.edumy.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class WishlistServiceTest {

    private static final AtomicLong NEXT_USER_ID = new AtomicLong(888_000);

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Long userId;
    private Course publishedCourse;
    private Course draftCourse;

    @BeforeEach
    void setUp() {
        userId = NEXT_USER_ID.incrementAndGet();

        userRepository.save(User.builder()
                .id(userId)
                .email("user." + userId + "@edumy.vn")
                .fullName("Người dùng Wishlist Service Test")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .passwordHash("$2a$10$hashedpassword")
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Kiểm thử phần mềm")
                .slug("kiem-thu-phan-mem-" + userId)
                .build());

        publishedCourse = courseRepository.save(Course.builder()
                .instructorId(userId)
                .categoryId(category.getId())
                .title("Khóa học Đã Xuất Bản")
                .subtitle("Phụ đề khóa học hợp lệ")
                .price(new BigDecimal("299000.00"))
                .level(CourseLevel.INTERMEDIATE)
                .status(CourseStatus.PUBLISHED)
                .avgRating(4.5)
                .ratingCount(10)
                .build());

        draftCourse = courseRepository.save(Course.builder()
                .instructorId(userId)
                .categoryId(category.getId())
                .title("Khóa học Bản Nháp")
                .price(BigDecimal.ZERO)
                .level(CourseLevel.BEGINNER)
                .status(CourseStatus.DRAFT)
                .build());
    }

    @Test
    @DisplayName("Thêm vào wishlist thành công và trả về wishlisted: true")
    void testAddToWishlistSuccess() {
        Map<String, Object> response = wishlistService.addToWishlist(userId, publishedCourse.getId());

        assertNotNull(response);
        assertEquals(publishedCourse.getId(), response.get("courseId"));
        assertEquals(true, response.get("wishlisted"));
        assertTrue(wishlistRepository.existsByUserIdAndCourseId(userId, publishedCourse.getId()));
    }

    @Test
    @DisplayName("Chống trùng: Thêm khóa học nhiều lần không tạo bản ghi duplicate trong DB (idempotent)")
    void testAddToWishlistAntiDuplicate() {
        wishlistService.addToWishlist(userId, publishedCourse.getId());
        wishlistService.addToWishlist(userId, publishedCourse.getId());
        wishlistService.addToWishlist(userId, publishedCourse.getId());

        List<Wishlist> all = wishlistRepository.findByUserId(userId);
        assertEquals(1, all.size(), "Bắt buộc chỉ tồn tại duy nhất 1 bản ghi trong wishlist!");
    }

    @Test
    @DisplayName("Thêm khóa học không tồn tại ném ngoại lệ ResourceNotFoundException")
    void testAddToWishlistNonExistentCourse() {
        assertThrows(ResourceNotFoundException.class, () ->
                wishlistService.addToWishlist(userId, 999_999_999L)
        );
    }

    @Test
    @DisplayName("Xóa khóa học khỏi wishlist thành công và trả về wishlisted: false")
    void testRemoveFromWishlistSuccess() {
        wishlistService.addToWishlist(userId, publishedCourse.getId());
        assertTrue(wishlistRepository.existsByUserIdAndCourseId(userId, publishedCourse.getId()));

        Map<String, Object> removeResponse = wishlistService.removeFromWishlist(userId, publishedCourse.getId());
        assertNotNull(removeResponse);
        assertEquals(publishedCourse.getId(), removeResponse.get("courseId"));
        assertEquals(false, removeResponse.get("wishlisted"));
        assertFalse(wishlistRepository.existsByUserIdAndCourseId(userId, publishedCourse.getId()));
    }

    @Test
    @DisplayName("Xóa khóa học chưa từng thêm không gây lỗi (idempotent delete)")
    void testRemoveFromWishlistNotPresent() {
        Map<String, Object> removeResponse = wishlistService.removeFromWishlist(userId, publishedCourse.getId());
        assertNotNull(removeResponse);
        assertEquals(false, removeResponse.get("wishlisted"));
    }

    @Test
    @DisplayName("Lấy danh sách wishlist: Chỉ trả về khóa học PUBLISHED, loại trừ DRAFT")
    void testGetMyWishlistOnlyPublished() {
        // Thêm cả 2 khóa: 1 PUBLISHED, 1 DRAFT
        wishlistRepository.save(Wishlist.builder().userId(userId).courseId(publishedCourse.getId()).build());
        wishlistRepository.save(Wishlist.builder().userId(userId).courseId(draftCourse.getId()).build());

        List<CourseSummaryResponse> wishlistItems = wishlistService.getMyWishlist(userId);

        assertEquals(1, wishlistItems.size(), "Chỉ được trả về khóa học đã PUBLISHED");
        assertEquals(publishedCourse.getId(), wishlistItems.get(0).getId());
        assertEquals("Khóa học Đã Xuất Bản", wishlistItems.get(0).getTitle());
        assertEquals(4.5, wishlistItems.get(0).getAverageRating());
    }

    @Test
    @DisplayName("Lấy danh sách ID các khóa học đã wishlist của user")
    void testGetMyWishlistCourseIds() {
        wishlistService.addToWishlist(userId, publishedCourse.getId());

        List<Long> ids = wishlistService.getMyWishlistCourseIds(userId);
        assertNotNull(ids);
        assertEquals(1, ids.size());
        assertTrue(ids.contains(publishedCourse.getId()));
    }

    @Test
    @DisplayName("Người dùng chưa có wishlist trả về danh sách rỗng")
    void testGetMyWishlistEmpty() {
        List<CourseSummaryResponse> items = wishlistService.getMyWishlist(userId);
        assertNotNull(items);
        assertTrue(items.isEmpty());

        List<Long> ids = wishlistService.getMyWishlistCourseIds(userId);
        assertNotNull(ids);
        assertTrue(ids.isEmpty());
    }
}
