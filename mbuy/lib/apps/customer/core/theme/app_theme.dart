import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                    MBUY - Alibaba Style Theme                             ║
// ║                                                                           ║
// ║   نظام ألوان موحد مستوحى من تطبيق علي بابا                                ║
// ║   ألوان ناعمة، هادئة، ومريحة للعين                                         ║
// ║                                                                           ║
// ║   • Primary: Orange #FF6600 (برتقالي)                                     ║
// ║   • Background: White #F7F7F7 (أبيض ناعم)                                 ║
// ║   • Text: #333333 (أسود ناعم)                                             ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

class AppTheme {
  // ============================================================================
  // Primary Colors - Alibaba Orange Theme
  // ============================================================================
  static const Color primaryColor = Color(
    0xFFFF6600,
  ); // Alibaba Orange (refined)
  static const Color primaryLight = Color(0xFFFF8533); // Light Orange
  static const Color primaryDark = Color(0xFFE65C00); // Dark Orange
  static const Color accentColor = Color(0xFFFF4D4F); // Red for deals/sales
  static const Color secondaryColor = Color(0xFFFF4D4F); // Sale Red

  // ============================================================================
  // Background & Surface
  // ============================================================================
  static const Color backgroundColor = Color(
    0xFFF7F7F7,
  ); // Very Light Grey (softer)
  static const Color surfaceColor = Color(0xFFF0F0F0); // Light Grey
  static const Color cardColor = Color(0xFFFFFFFF); // Pure White for cards

  // ============================================================================
  // Text Colors - Softer and more eye-friendly
  // ============================================================================
  static const Color textPrimary = Color(0xFF333333); // Soft Black
  static const Color textPrimaryColor = Color(
    0xFF333333,
  ); // Alias for compatibility
  static const Color textSecondary = Color(0xFF666666); // Grey Text
  static const Color textSecondaryColor = Color(
    0xFF666666,
  ); // Alias for compatibility
  static const Color textHint = Color(0xFF999999); // Light Grey
  static const Color textHintColor = Color(
    0xFF999999,
  ); // Alias for compatibility
  static const Color textWhite = Color(0xFFFFFFFF); // White Text
  static const Color mutedSlate = Color(
    0xFF6B7280,
  ); // Muted grey for secondary text
  static const Color darkSlate = Color(0xFF334155); // Dark slate
  static const Color purpleColor = Color(
    0xFFFF6A00,
  ); // Using orange instead of purple
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color backgroundLight = Color(0xFFFAFAFA);

  // ============================================================================
  // Border & Divider - Very soft and subtle
  // ============================================================================
  static const Color borderColor = Color(0xFFE8E8E8); // Soft border
  static const Color dividerColor = Color(0xFFF0F0F0); // Very soft divider

  // ============================================================================
  // Status Colors - Alibaba-inspired
  // ============================================================================
  static const Color successColor = Color(0xFF52C41A); // Green (Alibaba green)
  static const Color warningColor = Color(0xFFFAAD14); // Amber
  static const Color errorColor = Color(0xFFFF4D4F); // Red
  static const Color infoColor = Color(0xFF1890FF); // Blue

  // ============================================================================
  // Price Colors
  // ============================================================================
  static const Color priceColor = Color(0xFFFF6600); // Orange for price
  static const Color salePriceColor = Color(0xFFFF4D4F); // Red for sale
  static const Color discountBadgeColor = Color(0xFFFF4D4F); // Red badge

  // ============================================================================
  // Rating
  // ============================================================================
  static const Color ratingStarColor = Color(0xFFFFB800); // Gold

  // ============================================================================
  // Navigation Bar Colors
  // ============================================================================
  static const Color navBarBackground = Color(0xFFFFFFFF);
  static const Color navBarSelected = Color(0xFFFF6600); // Orange when selected
  static const Color navBarUnselected = Color(0xFF999999);

  // ============================================================================
  // Badge Colors
  // ============================================================================
  static const Color badgeColor = Color(0xFFFF4D4F); // Red for notifications

  // ============================================================================
  // Gradients
  // ============================================================================
  static const LinearGradient metallicGradient = LinearGradient(
    colors: [primaryColor, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryColor, primaryDark],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFAFAFA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Soft Header Gradient (Alibaba-inspired)
  static const LinearGradient softHeaderGradient = LinearGradient(
    colors: [Color(0xFFFFEDE4), Color(0xFFFFD9C7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Merchant Header Gradient (warm peachy)
  static const LinearGradient merchantHeaderGradient = LinearGradient(
    colors: [Color(0xFFFFF5EE), Color(0xFFFFE8D9)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Header bar color (soft)
  static const Color softHeaderColor = Color(0xFFFF8C5A); // Soft orange
  static const Color headerTextOnSoft = Color(0xFF5D3A1A); // Brown text

  // ============================================================================
  // Dark Mode Colors - Softer dark theme
  // ============================================================================
  static const Color backgroundColorDark = Color(0xFF141414);
  static const Color surfaceColorDark = Color(0xFF1F1F1F);
  static const Color cardColorDark = Color(0xFF1F1F1F);
  static const Color textPrimaryColorDark = Color(0xFFFFFFFF);
  static const Color textSecondaryColorDark = Color(0xB3FFFFFF); // 70% white
  static const Color textHintColorDark = Color(0x8AFFFFFF); // 54% white
  static const Color borderColorDark = Color(0xFF303030);
  static const Color cardBorderDark = Color(0xFF303030);
  static const Color dividerColorDark = Color(0xFF303030);

  // ============================================================================
  // Helper Functions for Dark Mode
  // ============================================================================
  static Color textPrimary2(bool isDark) =>
      isDark ? textPrimaryColorDark : textPrimaryColor;

  static Color textSecondary2(bool isDark) =>
      isDark ? textSecondaryColorDark : textSecondaryColor;

  static Color textHint2(bool isDark) =>
      isDark ? textHintColorDark : textHintColor;

  static Color background(bool isDark) =>
      isDark ? backgroundColorDark : backgroundColor;

  static Color surface(bool isDark) => isDark ? surfaceColorDark : surfaceColor;

  static Color card(bool isDark) => isDark ? cardColorDark : cardColor;

  // ============================================================================
  // Dimensions
  // ============================================================================
  static const double borderRadiusSmall = 8.0;
  static const double borderRadiusMedium = 12.0;
  static const double borderRadiusLarge = 16.0;
  static const double borderRadiusXLarge = 24.0;
  static const double borderRadiusRound = 50.0;

  static const double spacingXSmall = 4.0;
  static const double spacingSmall = 8.0;
  static const double spacingMedium = 16.0;
  static const double spacingLarge = 24.0;
  static const double spacingXLarge = 32.0;

  // ============================================================================
  // Light Theme
  // ============================================================================
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,

      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        onPrimary: Colors.white,
        secondary: accentColor,
        onSecondary: Colors.white,
        tertiary: secondaryColor,
        surface: surfaceColor,
        onSurface: textPrimary,
        error: errorColor,
        onError: Colors.white,
      ),

      scaffoldBackgroundColor: backgroundColor,

      // AppBar - White Header with Orange accents
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        foregroundColor: textPrimary,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        iconTheme: const IconThemeData(color: textPrimary, size: 24),
      ),

      // Text Theme - Cairo for Arabic
      textTheme: TextTheme(
        displayLarge: GoogleFonts.cairo(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displayMedium: GoogleFonts.cairo(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        displaySmall: GoogleFonts.cairo(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: textPrimary,
        ),
        headlineLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineMedium: GoogleFonts.cairo(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        headlineSmall: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: textPrimary,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        titleSmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: textPrimary,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: textPrimary,
        ),
        bodySmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: textSecondary,
        ),
        labelLarge: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        labelMedium: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textSecondary,
        ),
        labelSmall: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textHint,
        ),
      ),

      // Elevated Button - Orange
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusLarge),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusLarge),
          ),
          side: const BorderSide(color: primaryColor, width: 1.5),
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: primaryColor, width: 1.5),
        ),
        hintStyle: GoogleFonts.cairo(color: textHint, fontSize: 14),
        labelStyle: GoogleFonts.cairo(color: textSecondary, fontSize: 14),
      ),

      // Card Theme
      cardTheme: CardThemeData(
        elevation: 0,
        color: cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
        ),
        margin: EdgeInsets.zero,
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: navBarBackground,
        elevation: 8,
        selectedItemColor: navBarSelected,
        unselectedItemColor: navBarUnselected,
        selectedLabelStyle: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.normal,
        ),
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),

      // Tab Bar
      tabBarTheme: TabBarThemeData(
        labelColor: primaryColor,
        unselectedLabelColor: textSecondary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.normal,
        ),
        indicator: const UnderlineTabIndicator(
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(color: textPrimary, size: 24),

      // Chip Theme
      chipTheme: ChipThemeData(
        backgroundColor: surfaceColor,
        selectedColor: primaryColor,
        labelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: textPrimary,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusRound),
        ),
      ),

      // Badge Theme
      badgeTheme: BadgeThemeData(
        backgroundColor: badgeColor,
        textColor: Colors.white,
        textStyle: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  // ============================================================================
  // Dark Theme
  // ============================================================================
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,

      colorScheme: ColorScheme.dark(
        primary: primaryColor,
        onPrimary: Colors.white,
        secondary: accentColor,
        onSecondary: Colors.white,
        tertiary: secondaryColor,
        surface: const Color(0xFF1E1E1E),
        onSurface: Colors.white,
        error: errorColor,
        onError: Colors.white,
        surfaceContainerHighest: const Color(0xFF2D2D2D),
      ),

      scaffoldBackgroundColor: const Color(0xFF121212),

      // AppBar - Dark Header
      appBarTheme: AppBarTheme(
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        backgroundColor: const Color(0xFF1E1E1E),
        surfaceTintColor: Colors.transparent,
        foregroundColor: Colors.white,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        iconTheme: const IconThemeData(color: Colors.white, size: 24),
      ),

      // Text Theme - Cairo for Arabic (Dark Mode)
      textTheme: TextTheme(
        displayLarge: GoogleFonts.cairo(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        displayMedium: GoogleFonts.cairo(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        displaySmall: GoogleFonts.cairo(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        headlineLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        headlineMedium: GoogleFonts.cairo(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        headlineSmall: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        titleSmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: Colors.white,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: Colors.white,
        ),
        bodySmall: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: Colors.white70,
        ),
        labelLarge: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        labelMedium: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white70,
        ),
        labelSmall: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: Colors.white54,
        ),
      ),

      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusLarge),
          ),
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Outlined Button
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryLight,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(borderRadiusLarge),
          ),
          side: const BorderSide(color: primaryLight, width: 1.5),
          textStyle: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF2D2D2D),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
          borderSide: const BorderSide(color: primaryColor, width: 1.5),
        ),
        hintStyle: GoogleFonts.cairo(color: Colors.white54, fontSize: 14),
        labelStyle: GoogleFonts.cairo(color: Colors.white70, fontSize: 14),
      ),

      // Card Theme
      cardTheme: CardThemeData(
        elevation: 0,
        color: const Color(0xFF1E1E1E),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusMedium),
        ),
        margin: EdgeInsets.zero,
      ),

      // Bottom Navigation Bar
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: const Color(0xFF1E1E1E),
        elevation: 8,
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.white54,
        selectedLabelStyle: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 10,
          fontWeight: FontWeight.normal,
        ),
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),

      // Tab Bar
      tabBarTheme: TabBarThemeData(
        labelColor: primaryColor,
        unselectedLabelColor: Colors.white54,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.cairo(
          fontSize: 14,
          fontWeight: FontWeight.normal,
        ),
        indicator: const UnderlineTabIndicator(
          borderSide: BorderSide(color: primaryColor, width: 2),
        ),
      ),

      // Divider
      dividerTheme: const DividerThemeData(
        color: Color(0xFF3D3D3D),
        thickness: 1,
        space: 1,
      ),

      // Icon Theme
      iconTheme: const IconThemeData(color: Colors.white, size: 24),

      // Chip Theme
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFF2D2D2D),
        selectedColor: primaryColor,
        labelStyle: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadiusRound),
        ),
      ),

      // Badge Theme
      badgeTheme: BadgeThemeData(
        backgroundColor: badgeColor,
        textColor: Colors.white,
        textStyle: GoogleFonts.cairo(fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }

  // ============================================================================
  // Dark Mode Colors (for manual usage)
  // ============================================================================
  static const Color darkBackground = Color(0xFF121212);
  static const Color darkSurface = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF1E1E1E);
  static const Color darkBorder = Color(0xFF3D3D3D);
  static const Color darkDivider = Color(0xFF3D3D3D);
  static const Color darkTextPrimary = Colors.white;
  static const Color darkTextSecondary = Colors.white70;
  static const Color darkTextHint = Colors.white54;

  // ============================================================================
  // Custom Styles
  // ============================================================================

  /// Price Style - Orange
  static TextStyle get priceStyle => GoogleFonts.cairo(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: priceColor,
  );

  /// Sale Price Style - Red
  static TextStyle get salePriceStyle => GoogleFonts.cairo(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: salePriceColor,
  );

  /// Original Price (Strikethrough)
  static TextStyle get originalPriceStyle => GoogleFonts.cairo(
    fontSize: 12,
    fontWeight: FontWeight.normal,
    color: textHint,
    decoration: TextDecoration.lineThrough,
  );

  /// Discount Badge
  static BoxDecoration get discountBadge => BoxDecoration(
    color: discountBadgeColor,
    borderRadius: BorderRadius.circular(borderRadiusSmall),
  );

  /// Sale Badge
  static BoxDecoration get saleBadge => BoxDecoration(
    color: salePriceColor,
    borderRadius: BorderRadius.circular(borderRadiusSmall),
  );

  /// Search Bar Decoration
  static BoxDecoration get searchBarDecoration => BoxDecoration(
    color: surfaceColor,
    borderRadius: BorderRadius.circular(borderRadiusMedium),
    border: Border.all(color: borderColor, width: 1),
  );

  /// Card Shadow
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 10,
      offset: const Offset(0, 2),
    ),
  ];

  /// Bottom Nav Shadow
  static List<BoxShadow> get bottomNavShadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.08),
      blurRadius: 10,
      offset: const Offset(0, -2),
    ),
  ];
}
