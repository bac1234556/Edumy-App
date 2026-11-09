-- Local/demo fixtures only; enabled by the demo Spring profile. Never enable in production.
INSERT INTO users (email,password_hash,full_name,role,status) SELECT 'student@edumy.com', '$2a$12$avGlOhhv7Wbbuj8ZO1JjV.Nw.eji7nCGs0EWtyxj1zAj8naWSP416', 'Demo student', 'STUDENT', 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='student@edumy.com');
INSERT INTO users (email,password_hash,full_name,role,status) SELECT 'instructor@edumy.com', '$2a$12$avGlOhhv7Wbbuj8ZO1JjV.Nw.eji7nCGs0EWtyxj1zAj8naWSP416', 'Demo instructor', 'INSTRUCTOR', 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='instructor@edumy.com');
INSERT INTO users (email,password_hash,full_name,role,status) SELECT 'admin@edumy.com', '$2a$12$avGlOhhv7Wbbuj8ZO1JjV.Nw.eji7nCGs0EWtyxj1zAj8naWSP416', 'Demo admin', 'ADMIN', 'ACTIVE' WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@edumy.com');
SET @instructor = (SELECT id FROM users WHERE email='instructor@edumy.com');
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Java cơ bản','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='lap-trinh-cntt';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Spring Boot REST API','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='lap-trinh-cntt';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'React Native nhập môn','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='lap-trinh-cntt';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Thiết kế Figma','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='thiet-ke-do-hoa';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Photoshop cơ bản','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='thiet-ke-do-hoa';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Khởi nghiệp thực tế','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='kinh-doanh-khoi-nghiep';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Digital Marketing','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='marketing-truyen-thong';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Tiếng Anh giao tiếp','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='ngoai-ngu';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Quản lý thời gian','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='phat-trien-ban-than';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
INSERT INTO courses (instructor_id,category_id,title,subtitle,description,thumbnail_url,price,level,status,total_duration_seconds)
SELECT @instructor,id,'Kỹ năng thuyết trình','Khóa học mẫu W8','Nội dung học tập mẫu dành cho môi trường demo.', 'https://res.cloudinary.com/demo/image/upload/sample.jpg',99000,'BEGINNER','PUBLISHED',120 FROM categories WHERE slug='phat-trien-ban-than';
SET @course = LAST_INSERT_ID();
INSERT INTO sections(course_id,title,order_index) VALUES (@course,'Bắt đầu học',1);
SET @section = LAST_INSERT_ID();
INSERT INTO lessons(section_id,title,video_url,duration_seconds,is_preview,order_index) VALUES
(@section,'Giới thiệu','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'1',1),
(@section,'Bài thực hành','https://res.cloudinary.com/demo/video/upload/dog.mp4',60,b'0',2);
