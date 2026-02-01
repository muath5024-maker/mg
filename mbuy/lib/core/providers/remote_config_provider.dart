import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/remote_config_service.dart';

/// App Remote Config Provider - يوفر قيم Remote Config للتطبيق
///
/// الاستخدام:
/// ```dart
/// final config = ref.watch(appRemoteConfigProvider);
/// Text(config.welcomeText);
/// if (config.isBoostEnabled) { ... }
/// ```
final appRemoteConfigProvider = Provider<AppRemoteConfig>((ref) {
  return AppRemoteConfig();
});

/// App Remote Config - قيم الإعدادات عن بعد
///
/// يوفر واجهة سهلة للوصول لقيم Remote Config مع Type Safety
class AppRemoteConfig {
  final _config = RemoteConfigService.instance;

  // ============================================================================
  // النصوص
  // ============================================================================

  String get appName => _config.getString(RemoteConfigKeys.appName);
  String get welcomeText => _config.getString(RemoteConfigKeys.welcomeText);
  String get loginButtonText =>
      _config.getString(RemoteConfigKeys.loginButtonText);
  String get registerButtonText =>
      _config.getString(RemoteConfigKeys.registerButtonText);
  String get noProductsText =>
      _config.getString(RemoteConfigKeys.noProductsText);
  String get loadingText => _config.getString(RemoteConfigKeys.loadingText);
  String get errorText => _config.getString(RemoteConfigKeys.errorText);
  String get maintenanceMessage =>
      _config.getString(RemoteConfigKeys.maintenanceMessage);
  String get announcementText =>
      _config.getString(RemoteConfigKeys.announcementText);

  // ============================================================================
  // الألوان
  // ============================================================================

  Color get primaryColor =>
      Color(_config.getColor(RemoteConfigKeys.primaryColor));
  Color get secondaryColor =>
      Color(_config.getColor(RemoteConfigKeys.secondaryColor));
  Color get accentColor =>
      Color(_config.getColor(RemoteConfigKeys.accentColor));
  Color get errorColor => Color(_config.getColor(RemoteConfigKeys.errorColor));
  Color get successColor =>
      Color(_config.getColor(RemoteConfigKeys.successColor));

  // ============================================================================
  // Feature Flags
  // ============================================================================

  bool get isBoostEnabled =>
      _config.getBool(RemoteConfigKeys.enableBoostFeature);
  bool get isStudioEnabled =>
      _config.getBool(RemoteConfigKeys.enableStudioFeature);
  bool get isWalletEnabled =>
      _config.getBool(RemoteConfigKeys.enableWalletFeature);
  bool get isCouponsEnabled =>
      _config.getBool(RemoteConfigKeys.enableCouponsFeature);
  bool get isLoyaltyEnabled =>
      _config.getBool(RemoteConfigKeys.enableLoyaltyFeature);
  bool get isReferralEnabled =>
      _config.getBool(RemoteConfigKeys.enableReferralFeature);
  bool get showAds => _config.getBool(RemoteConfigKeys.showAds);
  bool get isMaintenanceMode =>
      _config.getBool(RemoteConfigKeys.maintenanceMode);
  bool get isAnnouncementEnabled =>
      _config.getBool(RemoteConfigKeys.announcementEnabled);

  // ============================================================================
  // الأرقام والحدود
  // ============================================================================

  int get minOrderAmount => _config.getInt(RemoteConfigKeys.minOrderAmount);
  int get maxProductImages => _config.getInt(RemoteConfigKeys.maxProductImages);
  int get maxProductsPerStore =>
      _config.getInt(RemoteConfigKeys.maxProductsPerStore);
  int get freeBoostDays => _config.getInt(RemoteConfigKeys.freeBoostDays);
  int get pointsPerSar => _config.getInt(RemoteConfigKeys.pointsPerSar);

  // ============================================================================
  // الروابط
  // ============================================================================

  String get supportWhatsapp =>
      _config.getString(RemoteConfigKeys.supportWhatsapp);
  String get termsUrl => _config.getString(RemoteConfigKeys.termsUrl);
  String get privacyUrl => _config.getString(RemoteConfigKeys.privacyUrl);
  String get helpUrl => _config.getString(RemoteConfigKeys.helpUrl);

  // ============================================================================
  // تحديث
  // ============================================================================

  /// تحديث القيم من السيرفر
  Future<bool> refresh() => _config.refresh();
}

/// Feature Flag Widget - يعرض المحتوى فقط إذا كانت الميزة مفعلة
///
/// ```dart
/// FeatureFlag(
///   feature: (config) => config.isBoostEnabled,
///   child: BoostButton(),
///   fallback: SizedBox.shrink(), // اختياري
/// )
/// ```
class FeatureFlag extends ConsumerWidget {
  final bool Function(AppRemoteConfig config) feature;
  final Widget child;
  final Widget? fallback;

  const FeatureFlag({
    super.key,
    required this.feature,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appRemoteConfigProvider);

    if (feature(config)) {
      return child;
    }

    return fallback ?? const SizedBox.shrink();
  }
}

/// Maintenance Mode Widget - يعرض شاشة الصيانة إذا كانت مفعلة
///
/// ```dart
/// MaintenanceWrapper(
///   child: MyApp(),
/// )
/// ```
class MaintenanceWrapper extends ConsumerWidget {
  final Widget child;

  const MaintenanceWrapper({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appRemoteConfigProvider);

    if (config.isMaintenanceMode) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: const Color(0xFF0A1628),
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.build_circle_outlined,
                    size: 80,
                    color: Colors.orange,
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    '🔧 صيانة',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    config.maintenanceMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return child;
  }
}

/// Announcement Banner - بانر الإعلانات
///
/// ```dart
/// AnnouncementBanner() // يظهر فقط إذا كان announcement_enabled = true
/// ```
class AnnouncementBanner extends ConsumerWidget {
  const AnnouncementBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appRemoteConfigProvider);

    if (!config.isAnnouncementEnabled || config.announcementText.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: config.accentColor,
      child: Row(
        children: [
          const Icon(Icons.campaign, color: Colors.white, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              config.announcementText,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
