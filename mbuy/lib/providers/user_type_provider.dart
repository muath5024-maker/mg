import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

/// أنواع المستخدمين في التطبيق
enum AppUserType {
  /// عميل عادي - يتصفح ويشتري فقط
  customer,

  /// تاجر - يتصفح ويشتري + لديه لوحة تحكم لمتجره
  merchant,
}

/// Provider لتحديد نوع المستخدم الحالي
/// يتم تحديثه بعد تسجيل الدخول بناءً على بيانات المستخدم من الـ Backend
final appUserTypeProvider = StateProvider<AppUserType>((ref) {
  // افتراضياً: عميل
  // سيتم تحديثه بعد تسجيل الدخول
  return AppUserType.customer;
});

/// Provider للتحقق هل المستخدم تاجر
final isMerchantProvider = Provider<bool>((ref) {
  return ref.watch(appUserTypeProvider) == AppUserType.merchant;
});

/// Provider للتحقق هل المستخدم عميل
final isCustomerProvider = Provider<bool>((ref) {
  return ref.watch(appUserTypeProvider) == AppUserType.customer;
});
