import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    ⚠️ تحذير مهم - DESIGN UPDATED ⚠️                       ║
// ║                                                                           ║
// ║   تم تحديث التصميم ليدعم الوضع الفاتح والداكن                             ║
// ║   تاريخ التحديث: 1 يناير 2026                                             ║
// ║                                                                           ║
// ║   الألوان المعتمدة:                                                       ║
// ║   • Primary: Teal #00B4B4 (فيروزي - للهيدر)                               ║
// ║   • Buttons/Icons: White #FFFFFF (أبيض)                                   ║
// ║   • Accent: Gold #FFC107 (ذهبي)                                           ║
// ║                                                                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/// App Theme Configuration - Light & Dark Theme Support
/// Professional modern design with teal header and white accents
class AppTheme {
  // ============================================================================
  // Primary Color Palette
  // ============================================================================

  // === Primary Colors (Teal - فيروزي للهيدر) ===
  static const Color primaryColor = Color(0xFF00B4B4); // Teal - اللون الأساسي
  static const Color primaryLight = Color(0xFF4DD4D4); // Teal Light
  static const Color primaryDark = Color(0xFF008585); // Teal Dark

  // === Secondary Colors (Teal variations) ===
  static const Color secondaryColor = Color(0xFF00B4B4); // Teal
  static const Color secondaryLight = Color(0xFF4DD4D4);
  static const Color secondaryDark = Color(0xFF008585);

  // === Accent Colors (Gold - Premium) ===
  static const Color accentColor = Color(0xFFFFC107); // Gold/Star Yellow
  static const Color accentLight = Color(0xFFFFD54F);
  static const Color accentDark = Color(0xFFFFB300);

  // === Background & Surface (Light Theme) ===
  static const Color backgroundColor = Color(0xFFF5F7FA); // Light Grey
  static const Color surfaceColor = Color(0xFFFFFFFF); // White
  static const Color cardColor = Color(0xFFFFFFFF); // White

  // === Extended Light Palette ===
  static const Color surface100 = Color(0xFFF5F7FA); // Background
  static const Color surface200 = Color(0xFFEEF1F5); // Slightly darker
  static const Color surface300 = Color(0xFFE5E9EF); // Cards hover
  static const Color surface400 = Color(0xFFDCE1E8); // Borders
  static const Color surface500 = Color(0xFFCBD2DB); // Dividers
  static const Color surface600 = Color(0xFFB8C1CC); // Muted elements

  // === Text Colors (Light Theme) ===
  static const Color textPrimaryColor = Color(0xFF1A1A2E); // Dark Navy
  static const Color textSecondaryColor = Color(0xFF6B7280); // Grey
  static const Color textHintColor = Color(0xFF9CA3AF); // Light Grey

  // === Border & Divider ===
  static const Color borderColor = Color(0xFFE5E7EB); // Light Border
  static const Color dividerColor = Color(0xFFE5E7EB); // Light Divider

  // === Purple Colors (Accent for special elements) ===
  static const Color purpleColor = Color(0xFF9333EA);
  static const Color purpleLight = Color(0xFFA855F7);
  static const Color purpleDark = Color(0xFF7C3AED);

  // === Status Colors (Semantic) ===
  static const Color successColor = Color(0xFF10B981); // Green
  static const Color warningColor = Color(0xFFFFC107); // Gold
  static const Color errorColor = Color(0xFFEF4444); // Red
  static const Color infoColor = Color(0xFF0EA5E9); // Sky Blue

  // === Price Colors ===
  static const Color priceColor = Color(0xFF1A1A2E);
  static const Color salePriceColor = Color(0xFFEF4444);
  static const Color discountBadgeColor = Color(0xFFEF4444);

  // === Rating Colors ===
  static const Color ratingStarColor = Color(0xFFFFC107);
  static const Color ratingTextColor = Color(0xFF6B7280);

  // ============================================================================
  // Dark Mode Colors
  // ============================================================================
  static const Color backgroundColorDark = Color(0xFF102219);
  static const Color surfaceColorDark = Color(0xFF193326);
  static const Color cardColorDark = Color(0xFF1C3228);
  static const Color textPrimaryColorDark = Color(0xFFFFFFFF);
  static const Color textSecondaryColorDark = Color(0xFF92C9AD);
  static const Color textHintColorDark = Color(0xFF6B9B84);
  static const Color dividerColorDark = Color(0xFF2A4A3A);
  static const Color borderColorDark = Color(0xFF2A4A3A);

  // Slate colors (for compatibility)
  static const Color slate100 = surface100;
  static const Color slate200 = surface200;
  static const Color slate300 = surface300;
  static const Color slate400 = surface400;
  static const Color slate500 = surface500;
  static const Color slate600 = surface600;
  static const Color slate700 = Color(0xFF374151);
  static const Color darkSlate = textPrimaryColor;
  static const Color mutedSlate = textSecondaryColor;

  // Dark mode extended palette
  static const Color surfaceDarkAccent = Color(0xFF234137);
  static const Color iconBgDark = Color(0xFF234137);
  static const Color dividerDark = dividerColorDark;
  static const Color disabledDark = Color(0xFF4A7060);
  static const Color textMutedDark = textHintColorDark;
  static const Color iconPrimaryDark = Color(0xFFFFFFFF);
  static const Color iconSecondaryDark = textSecondaryColorDark;
  static const Color shadowDark = Color(0x40000000);
  static const Color overlayDark = Color(0x0DFFFFFF);
  static const Color cardSurfaceDark = cardColorDark;
  static const Color cardHoverDark = Color(0xFF234137);
  static const Color cardBorderDark = borderColorDark;
  static const Color backgroundLight = backgroundColor;

  // ============================================================================
  // App Store Theme Colors
  // ============================================================================
  static const Color appStorePrimary = primaryColor;
  static const Color appStoreBackground = backgroundColorDark;
  static const Color appStoreSurface = surfaceColorDark;
  static const Color appStoreCard = cardColorDark;
  static const Color appStoreTextPrimary = textPrimaryColorDark;
  static const Color appStoreTextSecondary = textSecondaryColorDark;
  static const Color appStoreTextMuted = textHintColorDark;
  static const Color appStoreBorder = borderColorDark;
  static const Color appStoreStar = accentColor;

  // === Badge Colors ===
  static const Color freeShippingColor = Color(0xFF10B981);
  static const Color fastDeliveryColor = Color(0xFF0EA5E9);
  static const Color verifiedSellerColor = Color(0xFF9333EA);

  // === Pro Badge Colors ===
  static const Color proBadgeColor = Color(0xFF00B4B4); // Teal for Pro
  static const Color proLabelColor = Color(0xFF4DD4D4); // Light Teal

  // ============================================================================
  // Gradients - Dark Green Theme
  // ============================================================================

  // Brand Identity Gradient (Dark Green → Neon Green)
  static const LinearGradient brandGradient = LinearGradient(
    colors: [
      Color(0xFF102219), // Dark Green
      Color(0xFF13EC80), // Neon Green
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Primary Gradient (Neon Green variations)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [
      Color(0xFF13EC80), // Neon Green
      Color(0xFF10B981), // Emerald
      Color(0xFF059669), // Darker Emerald
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Metallic Gradient for FAB
  static const LinearGradient metallicGradient = LinearGradient(
    colors: [
      Color(0xFF13EC80), // Neon Green
      Color(0xFF10B981), // Emerald
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Accent Gradient (Gold variations)
  static const LinearGradient accentGradient = LinearGradient(
    colors: [
      Color(0xFFFFC107), // Gold
      Color(0xFFFFB300), // Deep Gold
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Header Banner Gradient
  static const LinearGradient headerBannerGradient = LinearGradient(
    colors: [
      Color(0xFF193326), // Surface
      Color(0xFF102219), // Background
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Card Gradient (Dark Green surfaces)
  static const LinearGradient cardGradient = LinearGradient(
    colors: [
      Color(0xFF1C3228), // Card
      Color(0xFF193326), // Surface
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Card Gradient Deep
  static const LinearGradient cardGradientDeep = LinearGradient(
    colors: [
      Color(0xFF234137), // Lighter card
      Color(0xFF1C3228), // Card
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Recessed Input Gradient
  static const LinearGradient recessedMetalGradient = LinearGradient(
    colors: [
      Color(0xFF152A20), // Dark
      Color(0xFF193326), // Surface
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Subtle Overlay Gradient
  static const LinearGradient subtleGradient = LinearGradient(
    colors: [
      Color(0x1A13EC80), // Neon Green 10%
      Color(0x1A10B981), // Emerald 10%
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Sale/Promo Gradient
  static const LinearGradient saleGradient = LinearGradient(
    colors: [
      Color(0xFFEF4444), // Red
      Color(0xFFDC2626), // Deep Red
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // ============================================================================
  // Dimensions - Global Standards
  // ============================================================================

  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;
  static const double borderRadiusXLarge = 24.0;

  static const double cardElevation = 2.0;
  static const double buttonElevation = 4.0;

  static const double spacingXSmall = 4.0;
  static const double spacingSmall = 8.0;
  static const double spacingMedium = 16.0;
  static const double spacingLarge = 24.0;
  static const double spacingXLarge = 32.0;

  // ============================================================================
  // Light Theme - وضع فاتح مع هيدر فيروزي
  // ============================================================================

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      // Color Scheme - Light Theme
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        onPrimary: Colors.white,
        primaryContainer: Color(0xFFE0F7F7),
        onPrimaryContainer: primaryDark,
        secondary: secondaryColor,
        onSecondary: Colors.white,
        secondaryContainer: Color(0xFFE0F7F7),
        onSecondaryContainer: secondaryDark,
        tertiary: accentColor,
        onTertiary: Color(0xFF1A1A2E),
        tertiaryContainer: Color(0xFFFFF8E1),
        onTertiaryContainer: accentDark,
        surface: surfaceColor,
        onSurface: textPrimaryColor,
        surfaceContainerHighest: Color(0xFFF5F5F5),
        error: errorColor,
        onError: Colors.white,
        outline: borderColor,
        outlineVariant: dividerColor,
      ),

      // Scaffold - Light Background
      scaffoldBackgroundColor: backgroundColor,

      // AppBar - Teal Header (فيروزي)
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: primaryColor, // هيدر فيروزي
        surfaceTintColor: Colors.transparent,
        foregroundColor: Colors.white, // نص أبيض
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        iconTheme: const IconThemeData(color: Colors.white, size: 24), // أيقونات بيضاء
      ),

      // Text Theme - Cairo for Arabic
      textTheme: TextTheme(
        // Display - Headlines
        displayLarge: GoogleFonts.cairo(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimaryColor,
          height: 1.2,
        ),
        displayMedium: GoogleFonts.cairo(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimaryColor,
          height: 1.2,
        ),
        displaySmall: GoogleFonts.cairo(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimaryColor,
          height: 1.2,
        ),
        // Headlines
        headlineLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
        headlineMedium: GoogleFonts.cairo(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
        headlineSmall: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
        // Titles
        titleLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
        titleSmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
        // Body
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textPrimaryColor,
          height: 1.5,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textPrimaryColor,
          height: 1.5,
        ),
        bodySmall: GoogleFonts.cairo(
          fontSize: 13,
          fontWeight: FontWeight.normal,
          color: textSecondaryColor,
          height: 1.4,
        ),
        // Labels
        labelLarge: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
        labelMedium: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondaryColor,
        ),
        labelSmall: GoogleFonts.cairo(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: textSecondaryColor,
        ),
      ),

      // Elevated Button - Primary CTA with White Text
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white, // نص أبيض على الأزرار
          elevation: buttonElevation,
          shadowColor: primaryColor.withValues(alpha: 0.4),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusMedium),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined Button - Secondary CTA
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusMedium),
          ),
          side: const BorderSide(color: primaryColor, width: 1.5),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Input Decoration - Light Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF5F7FA),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: errorColor),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        hintStyle: GoogleFonts.cairo(color: textHintColor, fontSize: 14),
        labelStyle: GoogleFonts.cairo(color: textSecondaryColor, fontSize: 14),
        prefixIconColor: textSecondaryColor,
        suffixIconColor: textSecondaryColor,
      ),

      // Card Theme - Light Cards
      cardTheme: CardThemeData(
        elevation: cardElevation,
        shadowColor: Colors.black.withValues(alpha: 0.08),
        color: cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusLarge),
          side: const BorderSide(color: borderColor, width: 1),
        ),
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
      ),

      // Chip Theme - Filters & Tags
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFF5F7FA),
        selectedColor: primaryColor.withValues(alpha: 0.1),
        disabledColor: const Color(0xFFE5E7EB),
        labelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
        secondaryLabelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusSmall),
          side: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
      ),

      // Bottom Navigation - Main Nav
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColor,
        elevation: 8,
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondaryColor,
        selectedLabelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.normal,
        ),
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),

      // Navigation Bar (Material 3)
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceColor,
        elevation: 8,
        indicatorColor: primaryColor.withValues(alpha: 0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.cairo(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: primaryColor,
            );
          }
          return GoogleFonts.cairo(
            fontSize: 12,
            fontWeight: FontWeight.normal,
            color: textSecondaryColor,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primaryColor, size: 24);
          }
          return const IconThemeData(color: textSecondaryColor, size: 24);
        }),
      ),

      // Tab Bar
      tabBarTheme: const TabBarThemeData(
        labelColor: primaryColor,
        unselectedLabelColor: textSecondaryColor,
        indicatorSize: TabBarIndicatorSize.label,
        indicator: UnderlineTabIndicator(
          borderSide: BorderSide(color: primaryColor, width: 3),
        ),
      ),

      // Floating Action Button with Meta Gradient
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 6,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusLarge),
        ),
      ),

      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textPrimaryColor,
        contentTextStyle: GoogleFonts.cairo(color: Colors.white, fontSize: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusSmall),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      // Dialog
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceColor,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusLarge),
        ),
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryColor,
        ),
        contentTextStyle: GoogleFonts.cairo(
          fontSize: 14,
          color: textSecondaryColor,
        ),
      ),

      // Bottom Sheet
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surfaceColor,
        elevation: 8,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(borderRadiusXLarge),
          ),
        ),
        dragHandleColor: const Color(0xFFE5E7EB),
        dragHandleSize: const Size(40, 4),
      ),

      // Divider - Metallic Edge
      dividerTheme: const DividerThemeData(
        color: slate300, // Metallic edge color
        thickness: 1,
        space: 1,
      ),

      // List Tile
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimaryColor,
        ),
        subtitleTextStyle: GoogleFonts.cairo(
          fontSize: 12,
          color: textSecondaryColor,
        ),
        iconColor: textSecondaryColor,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(color: textSecondaryColor, size: 24),

      // Progress Indicator with Meta Blue
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryColor,
        linearTrackColor: Color(0xFFE4E6EB),
        circularTrackColor: Color(0xFFE4E6EB),
      ),

      // Badge Theme
      badgeTheme: BadgeThemeData(
        backgroundColor: accentColor,
        textColor: textPrimaryColor,
        textStyle: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.w600),
      ),

      // Splash & Highlight
      splashColor: primaryColor.withValues(alpha: 0.1),
      highlightColor: primaryColor.withValues(alpha: 0.05),
    );
  }

  // ============================================================================
  // Dark Theme
  // ============================================================================

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,

      // Color Scheme for Dark Mode
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        onPrimary: Colors.white,
        primaryContainer: primaryDark,
        onPrimaryContainer: Colors.white,
        secondary: secondaryColor,
        onSecondary: Colors.white,
        secondaryContainer: secondaryDark,
        onSecondaryContainer: Colors.white,
        tertiary: accentColor,
        onTertiary: Colors.white,
        tertiaryContainer: accentDark,
        onTertiaryContainer: Colors.white,
        surface: surfaceColorDark,
        onSurface: textPrimaryColorDark,
        surfaceContainerHighest: Color(0xFF3A3A3A),
        error: errorColor,
        onError: Colors.white,
        outline: borderColorDark,
        outlineVariant: dividerColorDark,
      ),

      // Scaffold
      scaffoldBackgroundColor: backgroundColorDark,

      // AppBar
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: surfaceColorDark,
        surfaceTintColor: Colors.transparent,
        foregroundColor: textPrimaryColorDark,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimaryColorDark,
        ),
        iconTheme: const IconThemeData(color: primaryColor, size: 24),
      ),

      // Text Theme
      textTheme:
          TextTheme(
            displayLarge: GoogleFonts.cairo(color: textPrimaryColorDark),
            displayMedium: GoogleFonts.cairo(color: textPrimaryColorDark),
            displaySmall: GoogleFonts.cairo(color: textPrimaryColorDark),
            headlineLarge: GoogleFonts.cairo(color: textPrimaryColorDark),
            headlineMedium: GoogleFonts.cairo(color: textPrimaryColorDark),
            headlineSmall: GoogleFonts.cairo(color: textPrimaryColorDark),
            titleLarge: GoogleFonts.cairo(color: textPrimaryColorDark),
            titleMedium: GoogleFonts.cairo(color: textPrimaryColorDark),
            titleSmall: GoogleFonts.cairo(color: textPrimaryColorDark),
            bodyLarge: GoogleFonts.cairo(color: textPrimaryColorDark),
            bodyMedium: GoogleFonts.cairo(color: textPrimaryColorDark),
            bodySmall: GoogleFonts.cairo(color: textSecondaryColorDark),
            labelLarge: GoogleFonts.cairo(color: textPrimaryColorDark),
            labelMedium: GoogleFonts.cairo(color: textSecondaryColorDark),
            labelSmall: GoogleFonts.cairo(color: textSecondaryColorDark),
          ).apply(
            bodyColor: textPrimaryColorDark,
            displayColor: textPrimaryColorDark,
          ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: buttonElevation,
          shadowColor: primaryColor.withValues(alpha: 0.4),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusMedium),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Input Decoration - Lighter inputs for readability
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1E2D3D), // نفس لون الكارت
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: borderColorDark),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: borderColorDark),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: errorColor),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        hintStyle: GoogleFonts.cairo(color: textHintColorDark, fontSize: 14),
        labelStyle: GoogleFonts.cairo(
          color: textSecondaryColorDark,
          fontSize: 14,
        ),
        prefixIconColor: textSecondaryColorDark,
        suffixIconColor: textSecondaryColorDark,
      ),

      // Card Theme - Light Cards on Dark Background
      cardTheme: CardThemeData(
        elevation: 2,
        shadowColor: Colors.black.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusLarge),
          side: const BorderSide(color: borderColorDark, width: 1),
        ),
        color: cardColorDark, // كروت أفتح من الخلفية
        surfaceTintColor: Colors.transparent,
        margin: EdgeInsets.zero,
      ),

      // Bottom Navigation Bar - Dark with clear icons
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceColorDark, // سطح داكن
        elevation: 8,
        selectedItemColor: primaryColor, // اللون الأساسي للعنصر المحدد
        unselectedItemColor: textSecondaryColorDark, // رمادي فاتح
      ),

      // Navigation Bar (M3) - Dark surface
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceColorDark, // سطح داكن
        elevation: 8,
        indicatorColor: primaryColor.withValues(alpha: 0.2),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final color = states.contains(WidgetState.selected)
              ? primaryColor
              : textSecondaryColorDark;
          return GoogleFonts.cairo(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: color,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final color = states.contains(WidgetState.selected)
              ? primaryColor
              : textSecondaryColorDark;
          return IconThemeData(color: color, size: 24);
        }),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: dividerColorDark,
        thickness: 1,
        space: 1,
      ),

      // Other components
      dialogTheme: DialogThemeData(backgroundColor: surfaceColorDark),
      bottomSheetTheme: BottomSheetThemeData(backgroundColor: surfaceColorDark),
      popupMenuTheme: PopupMenuThemeData(color: surfaceColorDark),
      snackBarTheme: SnackBarThemeData(backgroundColor: surfaceColorDark),
    );
  }

  // ============================================================================
  // Custom Widget Styles
  // ============================================================================

  /// Product Price Style
  static TextStyle get priceStyle => GoogleFonts.cairo(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: priceColor,
  );

  /// Sale Price Style
  static TextStyle get salePriceStyle => GoogleFonts.cairo(
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: salePriceColor,
  );

  /// Original Price (Strikethrough)
  static TextStyle get originalPriceStyle => GoogleFonts.cairo(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    color: textSecondaryColor,
    decoration: TextDecoration.lineThrough,
  );

  /// Discount Badge Style
  static BoxDecoration get discountBadgeDecoration => BoxDecoration(
    color: discountBadgeColor,
    borderRadius: BorderRadius.circular(borderRadiusSmall),
  );

  /// Rating Stars Style
  static const Color starActiveColor = ratingStarColor;
  static const Color starInactiveColor = Color(0xFFE5E7EB);

  /// Free Shipping Badge
  static BoxDecoration get freeShippingBadge => BoxDecoration(
    color: freeShippingColor.withValues(alpha: 0.1),
    borderRadius: BorderRadius.circular(borderRadiusSmall),
    border: Border.all(color: freeShippingColor),
  );

  /// Fast Delivery Badge
  static BoxDecoration get fastDeliveryBadge => BoxDecoration(
    color: fastDeliveryColor.withValues(alpha: 0.1),
    borderRadius: BorderRadius.circular(borderRadiusSmall),
    border: Border.all(color: fastDeliveryColor),
  );

  /// Product Card Shadow
  static List<BoxShadow> get productCardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 10,
      offset: const Offset(0, 4),
    ),
  ];

  /// Search Bar Decoration
  static BoxDecoration get searchBarDecoration => BoxDecoration(
    color: surfaceColor,
    borderRadius: BorderRadius.circular(borderRadiusMedium),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.05),
        blurRadius: 10,
        offset: const Offset(0, 2),
      ),
    ],
  );

  // ============================================================================
  // Metallic Card Decorations
  // ============================================================================

  /// Metallic Card Decoration with Gradient and Border
  static BoxDecoration get metallicCardDecoration => BoxDecoration(
    gradient: cardGradient,
    borderRadius: BorderRadius.circular(borderRadiusLarge),
    border: Border.all(
      color: borderColor, // Metallic edge
      width: 1,
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.05),
        blurRadius: 10,
        offset: const Offset(0, 2),
      ),
    ],
  );

  /// Deep Metallic Card Decoration (for elevated cards)
  static BoxDecoration get metallicCardDecorationDeep => BoxDecoration(
    gradient: cardGradientDeep,
    borderRadius: BorderRadius.circular(borderRadiusLarge),
    border: Border.all(color: borderColor, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.08),
        blurRadius: 12,
        offset: const Offset(0, 4),
      ),
    ],
  );

  /// Recessed Metal Input Decoration
  static BoxDecoration get recessedMetalDecoration => BoxDecoration(
    gradient: recessedMetalGradient,
    borderRadius: BorderRadius.circular(borderRadiusMedium),
    border: Border.all(color: slate300.withValues(alpha: 0.5), width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.03),
        blurRadius: 4,
        offset: const Offset(0, 1),
      ),
    ],
  );

  // ============================================================================
  // Helper Methods for Dark Mode (Theme-Aware Colors)
  // ============================================================================

  /// Get text primary color based on brightness
  static Color textPrimary(bool isDark) =>
      isDark ? textPrimaryColorDark : textPrimaryColor;

  /// Get text secondary color based on brightness
  static Color textSecondary(bool isDark) =>
      isDark ? textSecondaryColorDark : textSecondaryColor;

  /// Get text hint/muted color based on brightness
  static Color textHint(bool isDark) =>
      isDark ? textHintColorDark : textHintColor;

  /// Get background color based on brightness
  static Color background(bool isDark) =>
      isDark ? backgroundColorDark : backgroundColor;

  /// Get surface color based on brightness
  static Color surface(bool isDark) => isDark ? surfaceColorDark : surfaceColor;

  /// Get card color based on brightness
  static Color card(bool isDark) => isDark ? cardColorDark : cardColor;

  /// Get border color based on brightness
  static Color border(bool isDark) => isDark ? borderColorDark : borderColor;

  /// Get divider color based on brightness
  static Color divider(bool isDark) => isDark ? dividerColorDark : dividerColor;

  /// Get shadow color for cards
  static Color shadow(bool isDark) =>
      isDark ? shadowDark : Colors.black.withValues(alpha: 0.05);

  // ============================================================================
  // Active/Inactive Colors - Unified across all components
  // ============================================================================

  /// Active/Selected color - unified for all navigation and interactive elements
  static Color activeColor(bool isDark) =>
      isDark ? const Color(0xFF4ADE80) : primaryColor;

  /// Inactive/Unselected color with improved contrast for dark mode
  static Color inactiveColor(bool isDark) =>
      isDark ? const Color(0xFF8BA899) : Color(0xFF757575); // محسّن للتباين

  /// Icon inactive color with better visibility
  static Color iconInactive(bool isDark) =>
      isDark ? const Color(0xFF9DB5A8) : Color(0xFF9E9E9E);
}
