import 'package:flutter/material.dart';

/// ثوابت ألوان الاستوديو - تصميم فاتح مع هيدر فيروزي
/// تُستخدم في جميع صفحات الاستوديو لتوحيد التصميم
class StudioColors {
  StudioColors._();

  // الألوان الأساسية (فيروزي + أبيض)
  static const Color primaryColor = Color(0xFF00B4B4); // Teal/فيروزي
  static const Color secondaryColor = Color(0xFF00A3A3); // Darker Teal
  static const Color accentPink = Color(0xFFEC4899);
  static const Color accentGreen = Color(0xFF00B4B4); // Teal
  static const Color accentOrange = Color(0xFFFFC107); // Gold
  static const Color iconOnPrimary = Colors.white; // أيقونات بيضاء على الأزرار

  // ألوان الخلفية (الوضع الفاتح - Light Theme)
  static const Color bgDark = Color(0xFFF5F7FA); // Light grey background
  static const Color surfaceDark = Colors.white; // White surface
  static const Color surfaceDarkAlt = Color(0xFFF0F4F8);
  static const Color surfaceLighter = Color(0xFFF8FAFC);
  static const Color surfaceLight = Color(0xFFF5F7FA);

  // ألوان الخلفية (الوضع الفاتح)
  static const Color bgLight = Color(0xFFF5F7FA);
  static const Color surfaceLightMode = Colors.white;

  // ألوان الحدود
  static const Color borderDark = Color(0xFFE5E7EB);
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderSubtle = Color(0xFFE2E8F0);

  // ألوان النصوص
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);

  // ألوان التدرجات (محدثة - فيروزي)
  static const List<Color> primaryGradient = [
    Color(0xFF00B4B4),
    Color(0xFF00A3A3),
  ];

  static const List<Color> pinkOrangeGradient = [
    Color(0xFFEC4899),
    Color(0xFFFFC107),
  ];

  static const List<Color> cyanPurpleGradient = [
    Color(0xFF0EA5E9),
    Color(0xFF00B4B4),
  ];

  static const List<Color> bluePurpleGradient = [
    Color(0xFF00B4B4),
    Color(0xFF00A3A3),
  ];

  static const List<Color> indigoPurpleGradient = [
    Color(0xFF00A3A3),
    Color(0xFF008888),
  ];

  // دوال مساعدة
  static Color getBackgroundColor(bool isDark) => bgLight;

  static Color getSurfaceColor(bool isDark) => surfaceLightMode;

  static Color getBorderColor(bool isDark) => borderLight;

  static Color getTextColor(bool isDark, {bool isSecondary = false}) {
    if (isSecondary) {
      return textSecondary;
    }
    return textPrimary;
  }
}

/// ثوابت الأبعاد للاستوديو
class StudioDimensions {
  StudioDimensions._();

  // الحشو والهوامش
  static const double paddingXS = 4.0;
  static const double paddingS = 8.0;
  static const double paddingM = 12.0;
  static const double paddingL = 16.0;
  static const double paddingXL = 20.0;
  static const double paddingXXL = 24.0;

  // الزوايا المستديرة
  static const double radiusS = 8.0;
  static const double radiusM = 12.0;
  static const double radiusL = 16.0;
  static const double radiusXL = 20.0;

  // أحجام الأيقونات
  static const double iconS = 18.0;
  static const double iconM = 20.0;
  static const double iconL = 24.0;
  static const double iconXL = 32.0;

  // ارتفاعات الأزرار
  static const double buttonHeight = 48.0;
  static const double buttonHeightL = 56.0;

  // أحجام الخطوط
  static const double fontXS = 10.0;
  static const double fontS = 12.0;
  static const double fontM = 14.0;
  static const double fontL = 16.0;
  static const double fontXL = 18.0;
  static const double fontXXL = 20.0;
  static const double fontDisplay = 28.0;
}

/// أنماط النصوص للاستوديو
class StudioTextStyles {
  StudioTextStyles._();

  static const TextStyle headline = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    height: 1.2,
    color: StudioColors.textPrimary,
  );

  static const TextStyle title = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: StudioColors.textPrimary,
  );

  static const TextStyle subtitle = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: StudioColors.textPrimary,
  );

  static const TextStyle body = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: StudioColors.textPrimary,
  );

  static const TextStyle bodySecondary = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: StudioColors.textSecondary,
  );

  static const TextStyle caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: StudioColors.textSecondary,
  );

  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  );
}
