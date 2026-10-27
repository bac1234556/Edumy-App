import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle
import os

def draw_phone_frame(ax, x, y, w, h, title, subtitle, module_badge, color_theme):
    # Outer phone shadow / bezel
    outer = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05,rounding_size=0.25",
                           facecolor='#0F172A', edgecolor='#334155', linewidth=2.5)
    ax.add_patch(outer)
    
    # Inner screen
    screen_pad = 0.12
    sw, sh = w - 2*screen_pad, h - 2*screen_pad
    screen = FancyBboxPatch((x + screen_pad, y + screen_pad), sw, sh,
                            boxstyle="round,pad=0.02,rounding_size=0.15",
                            facecolor='#1E293B', edgecolor='#475569', linewidth=1)
    ax.add_patch(screen)
    
    # Camera punch hole
    cam = Circle((x + w/2, y + h - screen_pad - 0.18), 0.08, facecolor='#000000', edgecolor='#334155')
    ax.add_patch(cam)
    
    # Screen header bar
    header_box = FancyBboxPatch((x + screen_pad + 0.05, y + h - screen_pad - 0.95), sw - 0.1, 0.65,
                                boxstyle="round,pad=0.02,rounding_size=0.08",
                                facecolor=color_theme['header_bg'], edgecolor=color_theme['border'], linewidth=1)
    ax.add_patch(header_box)
    ax.text(x + w/2, y + h - screen_pad - 0.65, title,
            color=color_theme['header_text'], fontsize=9, fontweight='bold', ha='center', va='center')
    
    # Module & screen caption below phone
    ax.text(x + w/2, y - 0.25, subtitle, color='#F8FAFC', fontsize=9.5, fontweight='bold', ha='center')
    ax.text(x + w/2, y - 0.52, module_badge, color=color_theme['tag_color'], fontsize=8, ha='center')
    
    return x + screen_pad + 0.1, y + screen_pad + 0.1, sw - 0.2, sh - 1.2

def generate_wireframes_overview():
    fig, ax = plt.subplots(figsize=(26, 17), dpi=150)
    ax.set_facecolor('#0B0F19')
    fig.patch.set_facecolor('#0B0F19')
    
    # Main Header
    ax.text(13, 16.4, "EDUMY ANDROID APP - MOBILE WIREFRAMES ARCHITECTURE",
            color='#F8FAFC', fontsize=22, fontweight='bold', ha='center', va='center')
    ax.text(13, 16.0, "Material Design (React Native Paper) UI Specs for 5 Modules (Member A, B, C, D, E)",
            color='#94A3B8', fontsize=12, ha='center', va='center')

    # Color themes for modules
    themes = {
        'A': {'header_bg': '#1E3A8A', 'border': '#3B82F6', 'header_text': '#BFDBFE', 'tag_color': '#60A5FA'},
        'B': {'header_bg': '#4C1D95', 'border': '#8B5CF6', 'header_text': '#DDD6FE', 'tag_color': '#A78BFA'},
        'C': {'header_bg': '#78350F', 'border': '#D97706', 'header_text': '#FDE68A', 'tag_color': '#FBBF24'},
        'D': {'header_bg': '#064E3B', 'border': '#10B981', 'header_text': '#A7F3D0', 'tag_color': '#34D399'},
        'E': {'header_bg': '#831843', 'border': '#EC4899', 'header_text': '#FBCFE8', 'tag_color': '#F472B6'},
    }

    # Grid layout: 2 rows of 5 screens = 10 key representative screens
    # Row 1 (y = 8.8): Screen 1..5
    # Row 2 (y = 1.3): Screen 6..10
    
    screens = [
        # Col 1: Member A
        {
            'col': 0, 'row': 0, 'theme': 'A',
            'title': 'Login Screen', 'sub': 'Screen A1: Auth Login', 'mod': 'Member A: Auth & Profile',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Logo
                ax.add_patch(FancyBboxPatch((cx + cw*0.3, cy + ch*0.75), cw*0.4, 0.5, facecolor='#2563EB', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.75 + 0.25, 'EDUMY', color='#FFFFFF', fontsize=9, fontweight='bold', ha='center', va='center'),
                # Input Email
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.58), cw - 0.2, 0.45, facecolor='#334155', edgecolor='#475569', boxstyle="round,pad=0.02,rounding_size=0.05")),
                ax.text(cx + 0.25, cy + ch*0.58 + 0.22, 'Email address...', color='#94A3B8', fontsize=7.5, va='center'),
                # Input Password
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.46), cw - 0.2, 0.45, facecolor='#334155', edgecolor='#475569', boxstyle="round,pad=0.02,rounding_size=0.05")),
                ax.text(cx + 0.25, cy + ch*0.46 + 0.22, '••••••••••••', color='#94A3B8', fontsize=7.5, va='center'),
                # Login button
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.32), cw - 0.2, 0.5, facecolor='#2563EB', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.32 + 0.25, 'ĐĂNG NHẬP (JWT)', color='#FFFFFF', fontsize=8, fontweight='bold', ha='center', va='center'),
                # Role switcher for demo
                ax.text(cx + cw/2, cy + ch*0.18, 'Chuyển nhanh role demo:', color='#94A3B8', fontsize=6.8, ha='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.06), cw - 0.2, 0.35, facecolor='#1E293B', edgecolor='#3B82F6', boxstyle="round,pad=0.02,rounding_size=0.04")),
                ax.text(cx + cw/2, cy + ch*0.06 + 0.17, 'Student | Instructor | Admin', color='#60A5FA', fontsize=6.8, ha='center', va='center'),
            ]
        },
        # Col 2: Member B
        {
            'col': 1, 'row': 0, 'theme': 'B',
            'title': 'Home Catalog', 'sub': 'Screen B1: Home Discovery', 'mod': 'Member B: Catalog & Discovery',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Search Bar
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.86), cw - 0.2, 0.4, facecolor='#334155', boxstyle="round,pad=0.02,rounding_size=0.05")),
                ax.text(cx + 0.25, cy + ch*0.86 + 0.2, '[Q]  Tìm kiếm khóa học...', color='#94A3B8', fontsize=7.2, va='center'),
                # Category chips
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.74), 0.65, 0.3, facecolor='#7C3AED', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.42, cy + ch*0.74 + 0.15, 'Tất cả', color='#FFFFFF', fontsize=6.5, ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.82, cy + ch*0.74), 0.7, 0.3, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 1.17, cy + ch*0.74 + 0.15, 'Lập trình', color='#94A3B8', fontsize=6.5, ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 1.58, cy + ch*0.74), 0.65, 0.3, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 1.9, cy + ch*0.74 + 0.15, 'Thiết kế', color='#94A3B8', fontsize=6.5, ha='center', va='center'),
                # Course Card 1
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.38), cw - 0.2, 1.45, facecolor='#1E293B', edgecolor='#475569', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.add_patch(FancyBboxPatch((cx + 0.15, cy + ch*0.38 + 0.65), cw - 0.3, 0.7, facecolor='#475569', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + cw/2, cy + ch*0.38 + 1.0, '[ Course Thumbnail ]', color='#CBD5E1', fontsize=7, ha='center', va='center'),
                ax.text(cx + 0.2, cy + ch*0.38 + 0.45, 'Lập trình React Native', color='#F8FAFC', fontsize=7.8, fontweight='bold'),
                ax.text(cx + 0.2, cy + ch*0.38 + 0.25, 'GV: Nguyễn Văn A • * 4.9 (120)', color='#94A3B8', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.38 + 0.08, '499.000 ₫', color='#38BDF8', fontsize=7.5, fontweight='bold'),
                # Course Card 2 (peek)
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.02), cw - 0.2, 1.2, facecolor='#1E293B', edgecolor='#475569', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.02 + 0.85, 'Spring Boot 3.4 Microservices', color='#F8FAFC', fontsize=7.5, fontweight='bold'),
            ]
        },
        # Col 3: Member B
        {
            'col': 2, 'row': 0, 'theme': 'B',
            'title': 'Course Detail', 'sub': 'Screen B3: Course Detail', 'mod': 'Member B: Catalog & Discovery',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Video Preview Box
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.68), cw - 0.2, 1.3, facecolor='#0284C7', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.68 + 0.65, '> Video Preview (Cloudinary)', color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center'),
                # Info
                ax.text(cx + 0.15, cy + ch*0.60, 'Lập trình Android Pro 2026', color='#F8FAFC', fontsize=8.2, fontweight='bold'),
                ax.text(cx + 0.15, cy + ch*0.53, '* 4.8 (85 đánh giá) • 1.200 học viên', color='#FBBF24', fontsize=6.8),
                ax.text(cx + 0.15, cy + ch*0.45, 'Giá: 599.000 ₫ (Tiết kiệm 30%)', color='#34D399', fontsize=7.2, fontweight='bold'),
                # Curriculum accordion header
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.30), cw - 0.2, 0.4, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.30 + 0.2, 'Chương 1: Giới thiệu (3 bài)', color='#E2E8F0', fontsize=7, fontweight='bold', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.18), cw - 0.2, 0.4, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.18 + 0.2, 'Chương 2: Cài đặt môi trường', color='#E2E8F0', fontsize=7, fontweight='bold', va='center'),
                # Buy CTA button
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.04), cw - 0.2, 0.48, facecolor='#10B981', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.04 + 0.24, 'ĐĂNG KÝ HỌC NGAY', color='#FFFFFF', fontsize=8, fontweight='bold', ha='center', va='center'),
            ]
        },
        # Col 4: Member C
        {
            'col': 3, 'row': 0, 'theme': 'C',
            'title': 'Instructor Studio', 'sub': 'Screen C1: My Courses', 'mod': 'Member C: Course Management',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Status filter tabs
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.88), 0.7, 0.32, facecolor='#D97706', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.45, cy + ch*0.88 + 0.16, 'Tất cả (5)', color='#FFFFFF', fontsize=6.5, ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.85, cy + ch*0.88), 0.7, 0.32, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 1.2, cy + ch*0.88 + 0.16, 'Đang chờ', color='#94A3B8', fontsize=6.5, ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 1.6, cy + ch*0.88), 0.65, 0.32, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 1.92, cy + ch*0.88 + 0.16, 'Bản nháp', color='#94A3B8', fontsize=6.5, ha='center', va='center'),
                # Course item 1
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.52), cw - 0.2, 1.25, facecolor='#1E293B', edgecolor='#D97706', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.52 + 0.95, 'Khóa học Flutter Master', color='#F8FAFC', fontsize=7.5, fontweight='bold'),
                ax.add_patch(FancyBboxPatch((cx + 0.2, cy + ch*0.52 + 0.62), 0.85, 0.24, facecolor='#065F46', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.62, cy + ch*0.52 + 0.74, 'PUBLISHED', color='#34D399', fontsize=6, fontweight='bold', ha='center', va='center'),
                ax.text(cx + 0.2, cy + ch*0.52 + 0.35, 'Học viên: 342 • Doanh thu: 15.2M', color='#CBD5E1', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.52 + 0.12, ' Sửa nội dung   |    Xem chi tiết', color='#60A5FA', fontsize=6.5),
                # Course item 2 (Pending)
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.14), cw - 0.2, 1.2, facecolor='#1E293B', edgecolor='#475569', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.14 + 0.9, 'Khóa học Docker & K8s', color='#F8FAFC', fontsize=7.5, fontweight='bold'),
                ax.add_patch(FancyBboxPatch((cx + 0.2, cy + ch*0.14 + 0.58), 0.8, 0.24, facecolor='#854D0E', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.6, cy + ch*0.14 + 0.7, 'PENDING', color='#FDE047', fontsize=6, fontweight='bold', ha='center', va='center'),
                ax.text(cx + 0.2, cy + ch*0.14 + 0.3, 'Chờ admin duyệt nội dung...', color='#94A3B8', fontsize=6.5),
                # FAB Add Course
                ax.add_patch(Circle((cx + cw - 0.45, cy + 0.45), 0.32, facecolor='#D97706', edgecolor='#FFFFFF', linewidth=1)),
                ax.text(cx + cw - 0.45, cy + 0.45, '+', color='#FFFFFF', fontsize=14, fontweight='bold', ha='center', va='center'),
            ]
        },
        # Col 5: Member C
        {
            'col': 4, 'row': 0, 'theme': 'C',
            'title': 'Curriculum Editor', 'sub': 'Screen C3: Upload Video', 'mod': 'Member C: Course Management',
            'draw': lambda ax, cx, cy, cw, ch: [
                ax.text(cx + 0.15, cy + ch*0.9, 'Giáo trình: React Native Pro', color='#FDE68A', fontsize=7.5, fontweight='bold'),
                # Section Box
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.48), cw - 0.2, 1.5, facecolor='#1E293B', edgecolor='#D97706', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.48 + 1.25, 'Chương 1: Khởi động dự án', color='#F8FAFC', fontsize=7.2, fontweight='bold'),
                # Lesson with progress
                ax.text(cx + 0.2, cy + ch*0.48 + 0.95, 'Bài 1: Giới thiệu Expo Router (12:40)', color='#94A3B8', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.48 + 0.65, 'Bài 2: Upload Video lên Cloudinary...', color='#38BDF8', fontsize=6.5),
                # Upload progress bar
                ax.add_patch(FancyBboxPatch((cx + 0.2, cy + ch*0.48 + 0.35), cw - 0.6, 0.15, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.02")),
                ax.add_patch(FancyBboxPatch((cx + 0.2, cy + ch*0.48 + 0.35), (cw - 0.6)*0.72, 0.15, facecolor='#10B981', boxstyle="round,pad=0.01,rounding_size=0.02")),
                ax.text(cx + cw - 0.4, cy + ch*0.48 + 0.15, '72% uploaded', color='#10B981', fontsize=6.2, ha='right'),
                # Add Lesson Button
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.3), cw - 0.2, 0.4, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + cw/2, cy + ch*0.3 + 0.2, '+ Thêm bài học mới', color='#93C5FD', fontsize=7, ha='center', va='center'),
                # Submit Review Button
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.06), cw - 0.2, 0.5, facecolor='#D97706', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.06 + 0.25, 'GỬI PHÊ DUYỆT KHÓA HỌC', color='#FFFFFF', fontsize=7.8, fontweight='bold', ha='center', va='center'),
            ]
        },
        # Col 1, Row 1: Member D
        {
            'col': 0, 'row': 1, 'theme': 'D',
            'title': 'Checkout Screen', 'sub': 'Screen D1: Mock Checkout', 'mod': 'Member D: Learning & Orders',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Order summary card
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.62), cw - 0.2, 1.4, facecolor='#1E293B', edgecolor='#10B981', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.62 + 1.15, 'Đơn hàng: #EDM-94812', color='#A7F3D0', fontsize=7.2, fontweight='bold'),
                ax.text(cx + 0.2, cy + ch*0.62 + 0.85, 'Khóa: Spring Boot 3 & Microservices', color='#F8FAFC', fontsize=6.8),
                ax.text(cx + 0.2, cy + ch*0.62 + 0.55, 'Giảng viên: Nguyễn Văn B', color='#94A3B8', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.62 + 0.25, 'Tổng thanh toán: 599.000 ₫', color='#34D399', fontsize=8, fontweight='bold'),
                # Payment method choice
                ax.text(cx + 0.15, cy + ch*0.5, 'Phương thức thanh toán:', color='#CBD5E1', fontsize=7),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.34), cw - 0.2, 0.42, facecolor='#064E3B', edgecolor='#10B981', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.34 + 0.21, '(o) Mock Checkout (Sandbox nhanh)', color='#A7F3D0', fontsize=6.8, va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.22), cw - 0.2, 0.42, facecolor='#1E293B', edgecolor='#475569', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.22 + 0.21, '( ) Cổng VNPay Sandbox', color='#94A3B8', fontsize=6.8, va='center'),
                # Confirm Button
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.04), cw - 0.2, 0.5, facecolor='#10B981', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.04 + 0.25, 'XÁC NHẬN THANH TOÁN', color='#FFFFFF', fontsize=7.8, fontweight='bold', ha='center', va='center'),
            ]
        },
        # Col 2, Row 1: Member D
        {
            'col': 1, 'row': 1, 'theme': 'D',
            'title': 'Video Player', 'sub': 'Screen D3: Course Player', 'mod': 'Member D: Learning & Orders',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Video Player frame
                ax.add_patch(FancyBboxPatch((cx + 0.05, cy + ch*0.62), cw - 0.1, 1.4, facecolor='#000000', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + cw/2, cy + ch*0.62 + 0.7, '> expo-video (Cloudinary Stream)', color='#38BDF8', fontsize=7, ha='center', va='center'),
                # Video controls bar
                ax.add_patch(FancyBboxPatch((cx + 0.15, cy + ch*0.62 + 0.12), cw - 0.3, 0.08, facecolor='#475569', boxstyle="round,pad=0.005,rounding_size=0.02")),
                ax.add_patch(FancyBboxPatch((cx + 0.15, cy + ch*0.62 + 0.12), (cw - 0.3)*0.6, 0.08, facecolor='#EF4444', boxstyle="round,pad=0.005,rounding_size=0.02")),
                # Lesson info
                ax.text(cx + 0.15, cy + ch*0.54, 'Bài 3: Cấu hình Redux Toolkit (18:20)', color='#F8FAFC', fontsize=7.2, fontweight='bold'),
                ax.text(cx + 0.15, cy + ch*0.47, 'Tiến độ: Đã học 65% • Tự đánh dấu xong khi ≥90%', color='#94A3B8', fontsize=6.2),
                # Tabs: Curriculum / Q&A
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.35), 0.95, 0.3, facecolor='#10B981', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.57, cy + ch*0.35 + 0.15, 'Danh sách bài', color='#FFFFFF', fontsize=6.5, ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 1.15, cy + ch*0.35), 0.95, 0.3, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 1.62, cy + ch*0.35 + 0.15, 'Hỏi đáp (Q&A)', color='#CBD5E1', fontsize=6.5, ha='center', va='center'),
                # Lesson list items
                ax.text(cx + 0.15, cy + ch*0.25, 'v Bài 1: Cài đặt thư viện (100%)', color='#34D399', fontsize=6.5),
                ax.text(cx + 0.15, cy + ch*0.16, 'v Bài 2: Tạo Slice & Store (100%)', color='#34D399', fontsize=6.5),
                ax.text(cx + 0.15, cy + ch*0.07, '> Bài 3: Kết nối API Axios (65%)', color='#60A5FA', fontsize=6.5),
            ]
        },
        # Col 3, Row 1: Member D
        {
            'col': 2, 'row': 1, 'theme': 'D',
            'title': 'Certificate PDF', 'sub': 'Screen D4: Completion Certificate', 'mod': 'Member D: Learning & Orders',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Certificate Graphic Box
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.42), cw - 0.2, 2.0, facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.5, boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.42 + 1.7, 'CERTIFICATE OF COMPLETION', color='#78350F', fontsize=7, fontweight='bold', ha='center'),
                ax.text(cx + cw/2, cy + ch*0.42 + 1.45, 'Trao tặng cho học viên:', color='#92400E', fontsize=6, ha='center'),
                ax.text(cx + cw/2, cy + ch*0.42 + 1.25, 'NGUYỄN VĂN AN', color='#1E3A8A', fontsize=8, fontweight='bold', ha='center'),
                ax.text(cx + cw/2, cy + ch*0.42 + 0.95, 'Khóa học: Lập trình Android Chuyên sâu', color='#78350F', fontsize=6, ha='center'),
                ax.text(cx + cw/2, cy + ch*0.42 + 0.65, 'Mã số: EDM-2026-X892', color='#B45309', fontsize=6.5, fontweight='bold', ha='center'),
                ax.text(cx + cw/2, cy + ch*0.42 + 0.35, '[ QR Code Tra cứu Xác thực ]', color='#6B7280', fontsize=6, ha='center'),
                # Action Buttons
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.22), cw - 0.2, 0.45, facecolor='#2563EB', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.22 + 0.22, '[DL] TẢI CHỨNG CHỈ (PDF)', color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.06), cw - 0.2, 0.42, facecolor='#334155', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + cw/2, cy + ch*0.06 + 0.21, ' Chia sẻ LinkedIn / Sao chép mã', color='#93C5FD', fontsize=6.8, ha='center', va='center'),
            ]
        },
        # Col 4, Row 1: Member E
        {
            'col': 3, 'row': 1, 'theme': 'E',
            'title': 'Admin Dashboard', 'sub': 'Screen E1: System Analytics', 'mod': 'Member E: Admin & Community',
            'draw': lambda ax, cx, cy, cw, ch: [
                # KPI Card 1
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.72), (cw - 0.3)/2, 0.75, facecolor='#831843', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.2, cy + ch*0.72 + 0.5, 'Tổng User', color='#FBCFE8', fontsize=6.2),
                ax.text(cx + 0.2, cy + ch*0.72 + 0.2, '1,420', color='#FFFFFF', fontsize=10, fontweight='bold'),
                # KPI Card 2
                ax.add_patch(FancyBboxPatch((cx + 0.15 + (cw - 0.3)/2, cy + ch*0.72), (cw - 0.3)/2, 0.75, facecolor='#4C1D95', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25 + (cw - 0.3)/2, cy + ch*0.72 + 0.5, 'Khóa học', color='#DDD6FE', fontsize=6.2),
                ax.text(cx + 0.25 + (cw - 0.3)/2, cy + ch*0.72 + 0.2, '86 active', color='#FFFFFF', fontsize=10, fontweight='bold'),
                # KPI Card 3
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.48), cw - 0.2, 0.75, facecolor='#064E3B', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.2, cy + ch*0.48 + 0.5, 'Doanh thu tháng này', color='#A7F3D0', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.48 + 0.2, '148.500.000 ₫ (+24%)', color='#34D399', fontsize=9.5, fontweight='bold'),
                # Admin Fast Actions
                ax.text(cx + 0.15, cy + ch*0.40, 'Tác vụ quản trị nhanh:', color='#E2E8F0', fontsize=6.8, fontweight='bold'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.26), cw - 0.2, 0.38, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.26 + 0.19, ' Hàng chờ duyệt khóa (4 chờ)', color='#F472B6', fontsize=6.8, va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.14), cw - 0.2, 0.38, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.14 + 0.19, ' Quản lý người dùng & Khóa nick', color='#93C5FD', fontsize=6.8, va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.02), cw - 0.2, 0.38, facecolor='#334155', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.25, cy + ch*0.02 + 0.19, ' Quản lý danh mục khóa học', color='#FDE047', fontsize=6.8, va='center'),
            ]
        },
        # Col 5, Row 1: Member E
        {
            'col': 4, 'row': 1, 'theme': 'E',
            'title': 'Review Queue', 'sub': 'Screen E2: Approve/Reject', 'mod': 'Member E: Admin & Community',
            'draw': lambda ax, cx, cy, cw, ch: [
                # Course under review item
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.58), cw - 0.2, 1.5, facecolor='#1E293B', edgecolor='#EC4899', boxstyle="round,pad=0.02,rounding_size=0.06")),
                ax.text(cx + 0.2, cy + ch*0.58 + 1.25, 'Kiểm duyệt: Docker & DevOps', color='#FBCFE8', fontsize=7.2, fontweight='bold'),
                ax.text(cx + 0.2, cy + ch*0.58 + 0.98, 'Giảng viên: Trần Văn C • Giá: 399K', color='#94A3B8', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.58 + 0.72, 'Số bài học: 18 video (Cloudinary ok)', color='#CBD5E1', fontsize=6.5),
                ax.text(cx + 0.2, cy + ch*0.58 + 0.42, '> Xem video thẩm định nội dung...', color='#38BDF8', fontsize=6.5),
                # Rejection reason input box
                ax.text(cx + 0.15, cy + ch*0.50, 'Lý do từ chối (nếu không đạt):', color='#FDA4AF', fontsize=6.5),
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.32), cw - 0.2, 0.5, facecolor='#334155', edgecolor='#F43F5E', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.2, cy + ch*0.32 + 0.25, 'Video bài 4 bị mất tiếng, vui lòng...', color='#94A3B8', fontsize=6.2, va='center'),
                # Action Buttons
                ax.add_patch(FancyBboxPatch((cx + 0.1, cy + ch*0.16), (cw - 0.3)/2, 0.45, facecolor='#10B981', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.1 + (cw - 0.3)/4, cy + ch*0.16 + 0.22, 'v DUYỆT', color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center'),
                ax.add_patch(FancyBboxPatch((cx + 0.15 + (cw - 0.3)/2, cy + ch*0.16), (cw - 0.3)/2, 0.45, facecolor='#EF4444', boxstyle="round,pad=0.01,rounding_size=0.04")),
                ax.text(cx + 0.15 + 3*(cw - 0.3)/4, cy + ch*0.16 + 0.22, 'X TỪ CHỐI', color='#FFFFFF', fontsize=7.5, fontweight='bold', ha='center', va='center'),
                # Notification trigger
                ax.text(cx + cw/2, cy + ch*0.05, ' Tự động sinh Notification báo giảng viên', color='#64748B', fontsize=6, ha='center'),
            ]
        },
    ]

    # Render all 10 phone screens
    base_x = 1.0
    gap_x = 4.8
    phone_w = 4.2
    phone_h = 6.4
    
    for s in screens:
        px = base_x + s['col'] * gap_x
        py = 8.6 if s['row'] == 0 else 1.2
        theme = themes[s['theme']]
        
        cx, cy, cw, ch = draw_phone_frame(ax, px, py, phone_w, phone_h, s['title'], s['sub'], s['mod'], theme)
        s['draw'](ax, cx, cy, cw, ch)

    ax.set_xlim(0, 25)
    ax.set_ylim(0, 17)
    ax.axis('off')

    plt.tight_layout()
    output_path = os.path.join(os.path.dirname(__file__), 'wireframes-overview.png')
    plt.savefig(output_path, dpi=150, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print(f"Generated wireframes overview successfully at: {output_path}")

if __name__ == '__main__':
    generate_wireframes_overview()
