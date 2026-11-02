package com.edumy.service;

import com.edumy.common.SlugUtil;
import com.edumy.dto.admin.CategoryRequest;
import com.edumy.dto.admin.CategoryResponse;
import com.edumy.entity.Category;
import com.edumy.exception.ConflictException;
import com.edumy.exception.ResourceNotFoundException;
import com.edumy.repository.CategoryRepository;
import com.edumy.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categories.stream()
                .map(cat -> {
                    long count = courseRepository.countByCategoryId(cat.getId());
                    return CategoryResponse.from(cat, count);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));
        long count = courseRepository.countByCategoryId(category.getId());
        return CategoryResponse.from(category, count);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : SlugUtil.toSlug(request.getName());

        if (slug.isBlank()) {
            throw new IllegalArgumentException("Không thể tạo slug từ tên danh mục");
        }

        if (categoryRepository.existsBySlug(slug)) {
            throw new ConflictException("Slug danh mục '" + slug + "' đã tồn tại");
        }

        if (request.getParentId() != null) {
            if (!categoryRepository.existsById(request.getParentId())) {
                throw new ResourceNotFoundException("Không tìm thấy danh mục cha với ID: " + request.getParentId());
            }
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .slug(slug)
                .icon(request.getIcon())
                .description(request.getDescription())
                .parentId(request.getParentId())
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Admin created category id={}, name='{}', slug='{}'", saved.getId(), saved.getName(), saved.getSlug());
        return CategoryResponse.from(saved, 0);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new ConflictException("Danh mục cha không thể là chính nó");
            }
            if (!categoryRepository.existsById(request.getParentId())) {
                throw new ResourceNotFoundException("Không tìm thấy danh mục cha với ID: " + request.getParentId());
            }
        }

        String targetSlug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? SlugUtil.toSlug(request.getSlug())
                : category.getSlug();

        if (categoryRepository.existsBySlugAndIdNot(targetSlug, id)) {
            throw new ConflictException("Slug danh mục '" + targetSlug + "' đã được sử dụng bởi danh mục khác");
        }

        category.setName(request.getName().trim());
        category.setSlug(targetSlug);
        category.setIcon(request.getIcon());
        category.setDescription(request.getDescription());
        category.setParentId(request.getParentId());

        Category updated = categoryRepository.save(category);
        long count = courseRepository.countByCategoryId(updated.getId());
        log.info("Admin updated category id={}, name='{}'", updated.getId(), updated.getName());
        return CategoryResponse.from(updated, count);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục với ID: " + id));

        // Ràng buộc 1: Không cho xóa category đang có khóa học (Trả về 409 Conflict)
        if (courseRepository.existsByCategoryId(id)) {
            long count = courseRepository.countByCategoryId(id);
            throw new ConflictException("Không thể xóa danh mục đang có " + count + " khóa học liên kết");
        }

        // Ràng buộc 2: Không cho xóa category đang có danh mục con (Trả về 409 Conflict)
        if (categoryRepository.existsByParentId(id)) {
            throw new ConflictException("Không thể xóa danh mục đang có danh mục con phụ thuộc");
        }

        categoryRepository.delete(category);
        log.info("Admin deleted category id={}, name='{}'", id, category.getName());
    }
}
