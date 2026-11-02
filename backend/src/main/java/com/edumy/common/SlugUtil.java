package com.edumy.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtil {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s+]");
    private static final Pattern MULTI_HYPHEN = Pattern.compile("-+");

    private SlugUtil() {}

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // Thay thế ký tự tiếng Việt đặc thù đ/Đ
        String result = input.replace("đ", "d").replace("Đ", "d");

        // Chuẩn hóa NFD để tách các dấu thanh
        result = Normalizer.normalize(result, Normalizer.Form.NFD);
        result = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(result).replaceAll("");

        // Thay thế khoảng trắng và ký tự đặc biệt bằng dấu gạch ngang
        result = WHITESPACE.matcher(result).replaceAll("-");
        result = NON_LATIN.matcher(result).replaceAll("");
        result = MULTI_HYPHEN.matcher(result).replaceAll("-");

        // Xóa dấu gạch ngang ở đầu và cuối
        result = result.replaceAll("^-+|-+$", "");

        return result.toLowerCase(Locale.ROOT);
    }
}
