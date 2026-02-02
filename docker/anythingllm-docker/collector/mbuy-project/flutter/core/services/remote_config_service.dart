import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/foundation.dart';

/// Remote Config Service - إدارة الإعدادات عن بعد
///
/// يتيح تغيير الإعدادات من Firebase Console بدون تحديث التطبيق
///
/// الاستخدام:
/// ```dart
/// final config = RemoteConfigService.instance;
/// final welcomeText = config.getString(RemoteConfigKeys.welcomeText);
/// final primaryColor = config.getColor(RemoteConfigKeys.primaryColor);
/// final isBoostEnabled = config.getBool(RemoteConfigKeys.enableBoostFeature);
/// ```
class RemoteConfigService {
  static RemoteConfigService? _instance;
  static RemoteConfigService get instance =>
      _instance ??= RemoteConfigService._();

  final FirebaseRemoteConfig _remoteConfig = FirebaseRemoteConfig.instance;

  RemoteConfigService._();

  /// تهيئة Remote Config
  Future<void> initialize() async {
    try {
      // إعدادات التحديث
      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: kDebugMode
              ? const Duration(minutes: 5) // للتطوير: تحديث كل 5 دقائق
              : const Duration(hours: 1), // للإنتاج: تحديث كل ساعة
        ),
      );

      // القيم الافتراضية
      await _remoteConfig.setDefaults(_defaultValues);

      // جلب القيم من السيرفر
      await _remoteConfig.fetchAndActivate();

      debugPrint('[RemoteConfig] ✅ Initialized successfully');
    } catch (e) {
      debugPrint('[RemoteConfig] ❌ Error: $e');
      // في حال الفشل، استخدم القيم الافتراضية
    }
  }

  /// تحديث القيم يدوياً
  Future<bool> refresh() async {
    try {
      final updated = await _remoteConfig.fetchAndActivate();
      debugPrint('[RemoteConfig] Refreshed: $updated');
      return updated;
    } catch (e) {
      debugPrint('[RemoteConfig] Refresh error: $e');
      return false;
    }
  }

  // ============================================================================
  // Getters
  // ============================================================================

  /// الحصول على قيمة نصية
  String getString(String key) => _remoteConfig.getString(key);

  /// الحصول على قيمة رقمية
  int getInt(String key) => _remoteConfig.getInt(key);

  /// الحصول على قيمة عشرية
  double getDouble(String key) => _remoteConfig.getDouble(key);

  /// الحصول على قيمة منطقية
  bool getBool(String key) => _remoteConfig.getBool(key);

  /// الحصول على لون من hex string
  int getColor(String key) {
    final hex = getString(key).replaceAll('#', '');
    if (hex.isEmpty) return 0xFF00BCD4; // Default turquoise
    return int.parse('FF$hex', radix: 16);
  }

  // ============================================================================
  // القيم الافتراضية
  // ============================================================================

  static const Map<String, dynamic> _defaultValues = {
    // === النصوص ===
    RemoteConfigKeys.appName: 'MBUY',
    RemoteConfigKeys.welcomeText: 'أهلاً بك في MBUY',
    RemoteConfigKeys.loginButtonText: 'تسجيل الدخول',
    RemoteConfigKeys.registerButtonText: 'إنشاء حساب جديد',
    RemoteConfigKeys.noProductsText: 'لا توجد منتجات',
    RemoteConfigKeys.loadingText: 'جاري التحميل...',
    RemoteConfigKeys.errorText: 'حدث خطأ، حاول مرة أخرى',

    // === الألوان (Hex without #) ===
    RemoteConfigKeys.primaryColor: '00BCD4', // Turquoise
    RemoteConfigKeys.secondaryColor: '0A1628', // Dark Blue
    RemoteConfigKeys.accentColor: 'FF9800', // Orange
    RemoteConfigKeys.errorColor: 'F44336', // Red
    RemoteConfigKeys.successColor: '4CAF50', // Green
    // === Feature Flags ===
    RemoteConfigKeys.enableBoostFeature: true,
    RemoteConfigKeys.enableStudioFeature: true,
    RemoteConfigKeys.enableWalletFeature: false,
    RemoteConfigKeys.enableCouponsFeature: false,
    RemoteConfigKeys.enableLoyaltyFeature: false,
    RemoteConfigKeys.enableReferralFeature: false,
    RemoteConfigKeys.showAds: false,
    RemoteConfigKeys.maintenanceMode: false,

    // === الأرقام والحدود ===
    RemoteConfigKeys.minOrderAmount: 10,
    RemoteConfigKeys.maxProductImages: 10,
    RemoteConfigKeys.maxProductsPerStore: 1000,
    RemoteConfigKeys.freeBoostDays: 3,
    RemoteConfigKeys.pointsPerSar: 10,

    // === الروابط ===
    RemoteConfigKeys.supportWhatsapp: '966500000000',
    RemoteConfigKeys.termsUrl: 'https://mbuy.pro/terms',
    RemoteConfigKeys.privacyUrl: 'https://mbuy.pro/privacy',
    RemoteConfigKeys.helpUrl: 'https://mbuy.pro/help',

    // === رسائل خاصة ===
    RemoteConfigKeys.announcementText: '',
    RemoteConfigKeys.announcementEnabled: false,
    RemoteConfigKeys.maintenanceMessage: 'التطبيق تحت الصيانة، سنعود قريباً',
  };
}

// ============================================================================
// مفاتيح Remote Config
// ============================================================================

/// مفاتيح Remote Config - استخدمها بدلاً من النصوص مباشرة
class RemoteConfigKeys {
  RemoteConfigKeys._();

  // === النصوص ===
  static const String appName = 'app_name';
  static const String welcomeText = 'welcome_text';
  static const String loginButtonText = 'login_button_text';
  static const String registerButtonText = 'register_button_text';
  static const String noProductsText = 'no_products_text';
  static const String loadingText = 'loading_text';
  static const String errorText = 'error_text';

  // === الألوان ===
  static const String primaryColor = 'primary_color';
  static const String secondaryColor = 'secondary_color';
  static const String accentColor = 'accent_color';
  static const String errorColor = 'error_color';
  static const String successColor = 'success_color';

  // === Feature Flags ===
  static const String enableBoostFeature = 'enable_boost_feature';
  static const String enableStudioFeature = 'enable_studio_feature';
  static const String enableWalletFeature = 'enable_wallet_feature';
  static const String enableCouponsFeature = 'enable_coupons_feature';
  static const String enableLoyaltyFeature = 'enable_loyalty_feature';
  static const String enableReferralFeature = 'enable_referral_feature';
  static const String showAds = 'show_ads';
  static const String maintenanceMode = 'maintenance_mode';

  // === الأرقام والحدود ===
  static const String minOrderAmount = 'min_order_amount';
  static const String maxProductImages = 'max_product_images';
  static const String maxProductsPerStore = 'max_products_per_store';
  static const String freeBoostDays = 'free_boost_days';
  static const String pointsPerSar = 'points_per_sar';

  // === الروابط ===
  static const String supportWhatsapp = 'support_whatsapp';
  static const String termsUrl = 'terms_url';
  static const String privacyUrl = 'privacy_url';
  static const String helpUrl = 'help_url';

  // === رسائل خاصة ===
  static const String announcementText = 'announcement_text';
  static const String announcementEnabled = 'announcement_enabled';
  static const String maintenanceMessage = 'maintenance_message';
}
