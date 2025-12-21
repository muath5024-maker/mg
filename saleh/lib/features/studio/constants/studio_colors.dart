import 'package:flutter/material.dart';

/// ثوابت ألوان الاستوديو
/// تُستخدم في جميع صفحات الاستوديو لتوحيد التصميم
class StudioColors {
  StudioColors._();

  // الألوان الأساسية
  static const Color primaryColor = Color(0xFF2B6CEE);
  static const Color secondaryColor = Color(0xFF9333EA);
  static const Color accentPink = Color(0xFFEC4899);
  static const Color accentGreen = Color(0xFF10B981);
  static const Color accentOrange = Color(0xFFF97316);

  // ألوان الخلفية (الوضع الداكن)
  static const Color bgDark = Color(0xFF101622);
  static const Color surfaceDark = Color(0xFF1C2333);
  static const Color surfaceDarkAlt = Color(0xFF1C212E);
  static const Color surfaceLighter = Color(0xFF282E39);
  static const Color surfaceLight = Color(0xFF1C1F27);

  // ألوان الخلفية (الوضع الفاتح)
  static const Color bgLight = Color(0xFFF6F6F8);
  static const Color surfaceLightMode = Colors.white;

  // ألوان الحدود
  static const Color borderDark = Color(0xFF3B4354);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color borderSubtle = Color(0xFF334155);

  // ألوان النصوص
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);

  // ألوان التدرجات
  static const List<Color> primaryGradient = [
    Color(0xFF2B6CEE),
    Color(0xFF9333EA),
  ];

  static const List<Color> pinkOrangeGradient = [
    Color(0xFFEC4899),
    Color(0xFFF97316),
  ];

  static const List<Color> cyanPurpleGradient = [
    Color(0xFF0EA5E9),
    Color(0xFF8B5CF6),
  ];

  static const List<Color> bluePurpleGradient = [
    Color(0xFF3B82F6),
    Color(0xFF8B5CF6),
  ];

  static const List<Color> indigoPurpleGradient = [
    Color(0xFF6366F1),
    Color(0xFF8B5CF6),
  ];

  // دوال مساعدة
  static Color getBackgroundColor(bool isDark) => isDark ? bgDark : bgLight;

  static Color getSurfaceColor(bool isDark) =>
      isDark ? surfaceDark : surfaceLightMode;

  static Color getBorderColor(bool isDark) => isDark ? borderDark : borderLight;

  static Color getTextColor(bool isDark, {bool isSecondary = false}) {
    if (isSecondary) {
      return isDark ? textSecondary : const Color(0xFF6B7280);
    }
    return isDark ? textPrimary : const Color(0xFF1F2937);
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
