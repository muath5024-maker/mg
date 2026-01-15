import 'package:flutter/material.dart';

/// ألوان التطبيق الموحدة
/// MBUY App Colors - Single Source of Truth
class AppColors {
  AppColors._();

  // ===== الألوان الأساسية =====
  /// اللون الأساسي للتطبيق - Primary Brand Color
  static const Color primary = Color(0xFF00BFA5);

  /// اللون الثانوي
  static const Color secondary = Color(0xFF26A69A);

  /// لون التأكيد/النجاح
  static const Color accent = Color(0xFF00E5CC);

  // ===== ألوان الحالات =====
  /// لون النجاح
  static const Color success = Color(0xFF4CAF50);

  /// لون التحذير
  static const Color warning = Color(0xFFFFC107);

  /// لون الخطأ
  static const Color error = Color(0xFFE53935);

  /// لون المعلومات
  static const Color info = Color(0xFF2196F3);

  // ===== ألوان النص =====
  /// نص أساسي (داكن)
  static const Color textPrimary = Color(0xFF212121);

  /// نص ثانوي
  static const Color textSecondary = Color(0xFF757575);

  /// نص خفيف
  static const Color textHint = Color(0xFFBDBDBD);

  /// نص أبيض (للخلفيات الداكنة)
  static const Color textWhite = Colors.white;

  // ===== ألوان الخلفيات =====
  /// خلفية فاتحة
  static const Color backgroundLight = Color(0xFFFAFAFA);

  /// خلفية بيضاء
  static const Color backgroundWhite = Colors.white;

  /// خلفية داكنة
  static const Color backgroundDark = Color(0xFF121212);

  /// خلفية الكروت
  static const Color cardBackground = Colors.white;

  /// خلفية السطح
  static const Color surface = Color(0xFFF5F5F5);

  // ===== ألوان الحدود =====
  /// حد فاتح
  static const Color borderLight = Color(0xFFE0E0E0);

  /// حد عادي
  static const Color border = Color(0xFFBDBDBD);

  /// حد داكن
  static const Color borderDark = Color(0xFF9E9E9E);

  // ===== ألوان خاصة =====
  /// لون الذهب (للنقاط والمكافآت)
  static const Color gold = Color(0xFFFFD700);

  /// لون الخصم
  static const Color discount = Color(0xFFE53935);

  /// لون اللايف
  static const Color live = Color(0xFFE53935);

  /// لون الأونلاين/متصل
  static const Color online = Color(0xFF4CAF50);

  /// لون غير متصل
  static const Color offline = Color(0xFF9E9E9E);

  // ===== ألوان الشرائح (Chips/Tags) =====
  /// شريحة خفيفة
  static Color chipLight = primary.withValues(alpha: 0.1);

  /// شريحة عادية
  static Color chipNormal = primary.withValues(alpha: 0.2);

  // ===== التدرجات =====
  /// تدرج أساسي
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, secondary],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// تدرج داكن للأوفرلاي
  static LinearGradient darkOverlay = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Colors.black.withValues(alpha: 0.5),
      Colors.transparent,
      Colors.transparent,
      Colors.black.withValues(alpha: 0.7),
    ],
    stops: const [0.0, 0.15, 0.6, 1.0],
  );

  // ===== ألوان الشاشة المظلمة =====
  /// خلفية الشاشة المظلمة
  static const Color darkBackground = Color(0xFF1A1A1A);

  /// سطح الشاشة المظلمة
  static const Color darkSurface = Color(0xFF1E1E1E);

  /// كرت في الشاشة المظلمة
  static const Color darkCard = Color(0xFF2A2A2A);

  // ===== ألوان الميديا =====
  /// خلفية شفافة للميديا
  static Color mediaOverlay = Colors.black.withValues(alpha: 0.4);

  /// خلفية الشات في اللايف
  static Color chatBackground = Colors.black.withValues(alpha: 0.6);

  /// خلفية المنتجات في اللايف
  static Color productsBackground = Colors.black.withValues(alpha: 0.85);

  // ===== دوال مساعدة =====
  /// الحصول على لون مع شفافية
  static Color withOpacity(Color color, double opacity) {
    return color.withValues(alpha: opacity);
  }

  /// تحويل لون إلى MaterialColor
  static MaterialColor toMaterialColor(Color color) {
    final strengths = <double>[.05];
    final swatch = <int, Color>{};
    final r = color.r.toInt(), g = color.g.toInt(), b = color.b.toInt();

    for (var i = 1; i < 10; i++) {
      strengths.add(0.1 * i);
    }
    for (final strength in strengths) {
      final ds = 0.5 - strength;
      swatch[(strength * 1000).round()] = Color.fromRGBO(
        r + ((ds < 0 ? r : (255 - r)) * ds).round(),
        g + ((ds < 0 ? g : (255 - g)) * ds).round(),
        b + ((ds < 0 ? b : (255 - b)) * ds).round(),
        1,
      );
    }
    return MaterialColor(color.toARGB32(), swatch);
  }

  /// الحصول على MaterialColor الأساسي
  static MaterialColor get primaryMaterial => toMaterialColor(primary);
}
