import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, PathPatch
from matplotlib.path import Path
import os

def generate_erd():
    fig, ax = plt.subplots(figsize=(26, 17), dpi=150)
    ax.set_facecolor('#0F172A') # Dark slate background
    fig.patch.set_facecolor('#0F172A')
    
    # Title and Legend Header
    ax.text(13, 16.3, "EDUMY ONLINE LEARNING PLATFORM - ENTITY RELATIONSHIP DIAGRAM (ERD)", 
            color='#F8FAFC', fontsize=22, fontweight='bold', ha='center', va='center', fontfamily='sans-serif')
    ax.text(13, 15.9, "Architecture: 5 Modules Vertical Slice (Member A - E) | Database: MySQL 8 (Flyway Versioned)", 
            color='#94A3B8', fontsize=13, ha='center', va='center', fontfamily='sans-serif')

    # Color definitions
    colors = {
        'A': {'bg': '#1E3A8A', 'border': '#3B82F6', 'title': '#93C5FD', 'name': 'Member A: Auth & Users'},
        'B': {'bg': '#4C1D95', 'border': '#8B5CF6', 'title': '#C4B5FD', 'name': 'Member B: Catalog & Discovery'},
        'C': {'bg': '#78350F', 'border': '#D97706', 'title': '#FDE68A', 'name': 'Member C: Curriculum & Media'},
        'D': {'bg': '#064E3B', 'border': '#10B981', 'title': '#A7F3D0', 'name': 'Member D: Learning & Orders'},
        'E': {'bg': '#831843', 'border': '#EC4899', 'title': '#FBCFE8', 'name': 'Member E: Admin & Community'},
    }

    # Draw Legend
    legend_x = 2.0
    for key, c in colors.items():
        leg_box = FancyBboxPatch((legend_x, 15.3), 3.8, 0.4, boxstyle="round,pad=0.08,rounding_size=0.08",
                                 facecolor=c['bg'], edgecolor=c['border'], linewidth=1.5)
        ax.add_patch(leg_box)
        ax.text(legend_x + 1.9, 15.5, c['name'], color=c['title'], fontsize=10, fontweight='bold', ha='center', va='center')
        legend_x += 4.5

    # Tables specification: (id, x, y, width, height, module, title, columns)
    # Each column: (name, type, is_pk, is_fk)
    tables = [
        # Member A
        {
            'id': 'users', 'x': 1.0, 'y': 9.8, 'w': 3.6, 'h': 4.6, 'module': 'A',
            'title': 'users',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('email', 'VARCHAR(255) UK', False, False),
                ('password_hash', 'VARCHAR(255)', False, False),
                ('full_name', 'VARCHAR(150)', False, False),
                ('avatar_url', 'VARCHAR(500)', False, False),
                ('role', "ENUM('STUDENT','INSTRUCTOR','ADMIN')", False, False),
                ('status', "ENUM('ACTIVE','LOCKED')", False, False),
                ('bio', 'TEXT', False, False),
                ('created_at', 'DATETIME', False, False),
                ('updated_at', 'DATETIME', False, False),
            ]
        },
        # Member B
        {
            'id': 'categories', 'x': 5.8, 'y': 10.5, 'w': 3.4, 'h': 3.8, 'module': 'B',
            'title': 'categories',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('name', 'VARCHAR(100)', False, False),
                ('slug', 'VARCHAR(120) UK', False, False),
                ('icon', 'VARCHAR(100)', False, False),
                ('description', 'VARCHAR(500)', False, False),
                ('parent_id', 'BIGINT (FK)', False, True),
                ('created_at', 'DATETIME', False, False),
                ('updated_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'courses', 'x': 10.3, 'y': 9.2, 'w': 3.9, 'h': 5.2, 'module': 'B',
            'title': 'courses',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('instructor_id', 'BIGINT (FK)', False, True),
                ('category_id', 'BIGINT (FK)', False, True),
                ('title', 'VARCHAR(255)', False, False),
                ('subtitle', 'VARCHAR(300)', False, False),
                ('description', 'LONGTEXT', False, False),
                ('thumbnail_url', 'VARCHAR(500)', False, False),
                ('price', 'DECIMAL(12,2)', False, False),
                ('level', 'ENUM(BEGINNER,...)', False, False),
                ('status', 'ENUM(DRAFT,PENDING,...)', False, False),
                ('rejection_reason', 'TEXT', False, False),
                ('total_duration_sec', 'INT', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'wishlists', 'x': 10.3, 'y': 6.2, 'w': 3.4, 'h': 2.3, 'module': 'B',
            'title': 'wishlists',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('user_id', 'BIGINT (FK)', False, True),
                ('course_id', 'BIGINT (FK)', False, True),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'reviews', 'x': 5.8, 'y': 6.0, 'w': 3.4, 'h': 3.0, 'module': 'B',
            'title': 'reviews',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('user_id', 'BIGINT (FK)', False, True),
                ('course_id', 'BIGINT (FK)', False, True),
                ('rating', 'TINYINT (1-5)', False, False),
                ('comment', 'TEXT', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        # Member C
        {
            'id': 'sections', 'x': 15.3, 'y': 10.8, 'w': 3.5, 'h': 2.8, 'module': 'C',
            'title': 'sections',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('course_id', 'BIGINT (FK)', False, True),
                ('title', 'VARCHAR(255)', False, False),
                ('order_index', 'INT', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'lessons', 'x': 19.9, 'y': 9.8, 'w': 3.8, 'h': 3.8, 'module': 'C',
            'title': 'lessons',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('section_id', 'BIGINT (FK)', False, True),
                ('title', 'VARCHAR(255)', False, False),
                ('video_url', 'VARCHAR(500)', False, False),
                ('video_public_id', 'VARCHAR(255)', False, False),
                ('duration_seconds', 'INT', False, False),
                ('is_preview', 'BOOLEAN', False, False),
                ('order_index', 'INT', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        # Member D
        {
            'id': 'orders', 'x': 1.0, 'y': 4.2, 'w': 3.8, 'h': 4.2, 'module': 'D',
            'title': 'orders',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('order_code', 'VARCHAR(50) UK', False, False),
                ('user_id', 'BIGINT (FK)', False, True),
                ('course_id', 'BIGINT (FK)', False, True),
                ('total_amount', 'DECIMAL(12,2)', False, False),
                ('status', 'ENUM(PENDING,PAID,...)', False, False),
                ('payment_method', 'ENUM(MOCK,VNPAY)', False, False),
                ('paid_at', 'DATETIME', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'enrollments', 'x': 5.8, 'y': 1.0, 'w': 3.6, 'h': 3.8, 'module': 'D',
            'title': 'enrollments',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('user_id', 'BIGINT (FK)', False, True),
                ('course_id', 'BIGINT (FK)', False, True),
                ('order_id', 'BIGINT (FK, NULL)', False, True),
                ('status', 'ENUM(ACTIVE,COMPLETED)', False, False),
                ('enrolled_at', 'DATETIME', False, False),
                ('completed_at', 'DATETIME', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'lesson_progress', 'x': 10.3, 'y': 1.0, 'w': 3.9, 'h': 3.6, 'module': 'D',
            'title': 'lesson_progress',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('enrollment_id', 'BIGINT (FK)', False, True),
                ('lesson_id', 'BIGINT (FK)', False, True),
                ('is_completed', 'BOOLEAN (>=90%)', False, False),
                ('last_watched_sec', 'INT', False, False),
                ('completed_at', 'DATETIME', False, False),
                ('updated_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'certificates', 'x': 1.0, 'y': 0.8, 'w': 3.6, 'h': 2.8, 'module': 'D',
            'title': 'certificates',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('enrollment_id', 'BIGINT (FK, UK)', False, True),
                ('certificate_code', 'VARCHAR(100) UK', False, False),
                ('pdf_url', 'VARCHAR(500)', False, False),
                ('issued_at', 'DATETIME', False, False),
            ]
        },
        # Member E
        {
            'id': 'questions', 'x': 15.3, 'y': 5.6, 'w': 3.6, 'h': 3.4, 'module': 'E',
            'title': 'questions',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('lesson_id', 'BIGINT (FK)', False, True),
                ('user_id', 'BIGINT (FK)', False, True),
                ('title', 'VARCHAR(255)', False, False),
                ('content', 'TEXT', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'answers', 'x': 19.9, 'y': 5.2, 'w': 3.8, 'h': 3.6, 'module': 'E',
            'title': 'answers',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('question_id', 'BIGINT (FK)', False, True),
                ('user_id', 'BIGINT (FK)', False, True),
                ('content', 'TEXT', False, False),
                ('is_accepted_instructor', 'BOOLEAN', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
        {
            'id': 'notifications', 'x': 15.3, 'y': 1.2, 'w': 3.8, 'h': 3.4, 'module': 'E',
            'title': 'notifications',
            'cols': [
                ('id', 'BIGINT AUTO_INC', True, False),
                ('user_id', 'BIGINT (FK)', False, True),
                ('title', 'VARCHAR(255)', False, False),
                ('content', 'TEXT', False, False),
                ('type', 'VARCHAR(30)', False, False),
                ('reference_id', 'BIGINT', False, False),
                ('is_read', 'BOOLEAN', False, False),
                ('created_at', 'DATETIME', False, False),
            ]
        },
    ]

    table_map = {t['id']: t for t in tables}

    # Render each table
    for t in tables:
        mod_c = colors[t['module']]
        x, y, w, h = t['x'], t['y'], t['w'], t['h']
        
        # Table body box
        body_box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04,rounding_size=0.12",
                                  facecolor='#1E293B', edgecolor=mod_c['border'], linewidth=1.8)
        ax.add_patch(body_box)
        
        # Table Header box
        header_h = 0.65
        header_box = FancyBboxPatch((x, y + h - header_h), w, header_h, boxstyle="round,pad=0.04,rounding_size=0.12",
                                    facecolor=mod_c['bg'], edgecolor=mod_c['border'], linewidth=1.5)
        ax.add_patch(header_box)
        
        # Header Text
        ax.text(x + w / 2, y + h - header_h / 2, t['title'],
                color=mod_c['title'], fontsize=12, fontweight='bold', ha='center', va='center')
        
        # Column list
        col_y = y + h - header_h - 0.28
        for name, col_type, is_pk, is_fk in t['cols']:
            # Badges
            if is_pk:
                ax.text(x + 0.15, col_y, 'PK', color='#F59E0B', fontsize=8, fontweight='bold', va='center')
            elif is_fk:
                ax.text(x + 0.15, col_y, 'FK', color='#38BDF8', fontsize=8, fontweight='bold', va='center')
            else:
                ax.text(x + 0.15, col_y, '•', color='#64748B', fontsize=9, va='center')
                
            # Column name
            ax.text(x + 0.52, col_y, name, color='#F1F5F9', fontsize=8.8, fontweight='semibold' if (is_pk or is_fk) else 'normal', va='center')
            # Column type
            ax.text(x + w - 0.15, col_y, col_type, color='#94A3B8', fontsize=7.8, ha='right', va='center')
            
            col_y -= 0.32

    # Draw Relations / Connectors with clean arrows
    def draw_relation(src_id, dst_id, src_side='right', dst_side='left', color='#64748B', label=''):
        src = table_map[src_id]
        dst = table_map[dst_id]
        
        # Calculate coords
        if src_side == 'right':
            sx = src['x'] + src['w']
            sy = src['y'] + src['h'] / 2
        elif src_side == 'left':
            sx = src['x']
            sy = src['y'] + src['h'] / 2
        elif src_side == 'bottom':
            sx = src['x'] + src['w'] / 2
            sy = src['y']
        else: # top
            sx = src['x'] + src['w'] / 2
            sy = src['y'] + src['h']

        if dst_side == 'left':
            dx = dst['x']
            dy = dst['y'] + dst['h'] / 2
        elif dst_side == 'right':
            dx = dst['x'] + dst['w']
            dy = dst['y'] + dst['h'] / 2
        elif dst_side == 'bottom':
            dx = dst['x'] + dst['w'] / 2
            dy = dst['y']
        else: # top
            dx = dst['x'] + dst['w'] / 2
            dy = dst['y'] + dst['h']
            
        arrow = patches.FancyArrowPatch((sx, sy), (dx, dy),
                                        connectionstyle="arc3,rad=0.08",
                                        arrowstyle="-|>",
                                        color=color,
                                        mutation_scale=12,
                                        linewidth=1.4,
                                        alpha=0.75,
                                        linestyle='--')
        ax.add_patch(arrow)

    # Add key relationships
    draw_relation('users', 'courses', 'right', 'left', '#3B82F6')
    draw_relation('categories', 'courses', 'right', 'left', '#8B5CF6')
    draw_relation('courses', 'sections', 'right', 'left', '#D97706')
    draw_relation('sections', 'lessons', 'right', 'left', '#D97706')
    draw_relation('users', 'orders', 'bottom', 'top', '#3B82F6')
    draw_relation('courses', 'orders', 'left', 'right', '#10B981')
    draw_relation('orders', 'enrollments', 'bottom', 'top', '#10B981')
    draw_relation('enrollments', 'certificates', 'left', 'right', '#10B981')
    draw_relation('enrollments', 'lesson_progress', 'right', 'left', '#10B981')
    draw_relation('lessons', 'lesson_progress', 'bottom', 'top', '#D97706')
    draw_relation('lessons', 'questions', 'bottom', 'top', '#EC4899')
    draw_relation('questions', 'answers', 'right', 'left', '#EC4899')
    draw_relation('users', 'reviews', 'bottom', 'top', '#8B5CF6')
    draw_relation('courses', 'reviews', 'bottom', 'top', '#8B5CF6')
    draw_relation('users', 'notifications', 'bottom', 'top', '#EC4899')

    # Footer note
    ax.text(13, 0.25, "EDUMY DATABASE ARCHITECTURE | GENERATED FOR W7-T1 KICKOFF | DBDATAGRAM DBML AVAILABLE AT /docs/erd.dbml",
            color='#64748B', fontsize=10, ha='center', va='center', style='italic')

    ax.set_xlim(0, 25)
    ax.set_ylim(0, 17)
    ax.axis('off')

    plt.tight_layout()
    output_path = os.path.join(os.path.dirname(__file__), 'erd.png')
    plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated ERD successfully at: {output_path}")

if __name__ == '__main__':
    generate_erd()
