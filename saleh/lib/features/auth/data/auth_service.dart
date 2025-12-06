import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../../../core/services/api_service.dart';
import 'mbuy_auth_service.dart';
import '../../../core/services/mbuy_auth_helper.dart';

class AuthService {
  /// تسجيل مستخدم جديد
  ///
  /// يقوم بـ:
  /// 1. إنشاء حساب في Supabase Auth
  /// 2. إنشاء row في user_profiles مع الدور المحدد
  /// 3. إذا كان تاجر: إنشاء متجر تلقائياً عبر API
  ///
  /// Parameters:
  /// - email: البريد الإلكتروني
  /// - password: كلمة المرور
  /// - displayName: الاسم المعروض
  /// - role: دور المستخدم ('customer' أو 'merchant')
  /// - storeName: اسم المتجر (مطلوب للتاجر)
  /// - city: المدينة (مطلوب للتاجر)
  ///
  /// Returns: User object من Supabase
  /// Throws: Exception في حالة الفشل
  static Future<User> signUp({
    required String email,
    required String password,
    required String displayName,
    String role = 'customer',
    String? storeName,
    String? city,
  }) async {
    try {
      debugPrint('📝 محاولة تسجيل مستخدم جديد: $email');

      // 1. إنشاء حساب في Supabase Auth
      final response = await supabaseClient.auth.signUp(
        email: email,
        password: password,
        data: {'display_name': displayName},
      );

      if (response.user == null) {
        debugPrint('❌ فشل إنشاء الحساب: لا يوجد مستخدم');
        throw Exception('فشل إنشاء الحساب');
      }

      final user = response.user!;
      debugPrint('✅ تم إنشاء حساب المستخدم: ${user.email}');

      // التحقق من وجود Session بعد التسجيل
      if (response.session == null) {
        debugPrint(
          '⚠️ لا توجد جلسة بعد التسجيل - قد يتطلب تأكيد البريد الإلكتروني',
        );
        // إذا لم تكن هناك جلسة، جرب تسجيل الدخول مباشرة
        try {
          final signInResponse = await supabaseClient.auth.signInWithPassword(
            email: email,
            password: password,
          );
          if (signInResponse.session != null) {
            debugPrint('✅ تم تسجيل الدخول تلقائياً بعد التسجيل');
          }
        } catch (e) {
          debugPrint('⚠️ فشل تسجيل الدخول التلقائي: $e');
          // لا نرمي خطأ هنا - المستخدم يمكنه تسجيل الدخول لاحقاً
        }
      } else {
        debugPrint('✅ تم إنشاء جلسة تلقائياً بعد التسجيل');
      }

      // 2. إنشاء user_profile + wallet عبر Worker API (دفعة واحدة)
      try {
        final response = await ApiService.post(
          '/secure/auth/initialize-user',
          data: {'role': role, 'display_name': displayName},
        );

        if (response['ok'] == true) {
          debugPrint('✅ تم إنشاء user_profile + wallet بدور: $role');
        } else {
          debugPrint(
            '⚠️ تحذير: فشل إنشاء user_profile/wallet: ${response['error']}',
          );
        }
      } catch (e) {
        // إذا فشل الإدراج، ربما السجل موجود مسبقاً
        debugPrint('⚠️ تحذير: فشل إنشاء user_profile/wallet عبر Worker: $e');
      }

      // 4. إذا كان تاجر: إنشاء متجر تلقائياً عبر Worker API
      if (role == 'merchant' && storeName != null) {
        try {
          debugPrint('🏪 جاري إنشاء متجر للتاجر...');

          // استخدام Worker API الجديد (لا نرسل user_id - يتم جلبها من JWT)
          final result = await ApiService.post(
            '/secure/merchant/store',
            data: {
              'name': storeName,
              'city': city ?? '',
              'description': '',
              'visibility': 'public',
              'status': 'active',
              // لا نرسل user_id - يتم جلبها من JWT في Backend
            },
          );

          if (result['ok'] == true) {
            debugPrint('✅ تم إنشاء المتجر بنجاح!');
            debugPrint('✅ حصل التاجر على 100 نقطة ترحيبية');
          } else {
            debugPrint('⚠️ فشل إنشاء المتجر: ${result['error'] ?? result['message']}');
            // لا نرمي خطأ هنا - يمكن للتاجر إنشاء المتجر لاحقاً
          }
        } catch (e) {
          debugPrint('⚠️ تحذير: فشل إنشاء المتجر: $e');
          // لا نرمي خطأ هنا - يمكن للتاجر إنشاء المتجر لاحقاً
        }
      }

      return user;
    } catch (e) {
      throw Exception('خطأ في التسجيل: ${e.toString()}');
    }
  }

  /// تسجيل دخول
  ///
  /// Parameters:
  /// - email: البريد الإلكتروني
  /// - password: كلمة المرور
  ///
  /// Returns: Session object من Supabase
  /// Throws: Exception في حالة الفشل
  static Future<Session> signIn({
    required String email,
    required String password,
  }) async {
    try {
      debugPrint('🔐 محاولة تسجيل الدخول: $email');
      debugPrint('🔐 كلمة المرور: ${password.length} أحرف');

      final response = await supabaseClient.auth.signInWithPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );

      debugPrint(
        '📊 Response: user=${response.user?.id}, session=${response.session != null}',
      );
      debugPrint('📊 User email: ${response.user?.email}');
      debugPrint(
        '📊 User confirmed: ${response.user?.emailConfirmedAt != null}',
      );

      if (response.session == null) {
        debugPrint('❌ فشل تسجيل الدخول: لا توجد جلسة');
        debugPrint('❌ User ID: ${response.user?.id}');
        debugPrint('❌ Email confirmed: ${response.user?.emailConfirmedAt}');

        // إذا كان المستخدم موجود لكن بدون Session، قد يكون Email غير مؤكد
        if (response.user != null && response.user!.emailConfirmedAt == null) {
          throw Exception(
            'يرجى تأكيد البريد الإلكتروني أولاً. تحقق من بريدك الوارد.',
          );
        }

        throw Exception(
          'فشل تسجيل الدخول - لا توجد جلسة. يرجى المحاولة مرة أخرى.',
        );
      }

      debugPrint('✅ تم تسجيل الدخول بنجاح: ${response.user?.email}');
      debugPrint(
        '📱 Session ID: ${response.session!.accessToken.substring(0, 20)}...',
      );
      debugPrint('📱 Session expires at: ${response.session!.expiresAt}');

      return response.session!;
    } on AuthException catch (e) {
      debugPrint('❌ خطأ في المصادقة: ${e.message}');
      debugPrint('❌ Error code: ${e.statusCode}');

      // معالجة أنواع الأخطاء المختلفة
      final errorMessage = e.message.toLowerCase();

      if (errorMessage.contains('invalid login credentials') ||
          errorMessage.contains('invalid credentials') ||
          errorMessage.contains('wrong password')) {
        throw Exception('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (errorMessage.contains('email not confirmed') ||
          errorMessage.contains('email not verified') ||
          errorMessage.contains('confirmation')) {
        throw Exception(
          'يرجى تأكيد البريد الإلكتروني أولاً. تحقق من بريدك الوارد.',
        );
      } else if (errorMessage.contains('too many requests') ||
          errorMessage.contains('rate limit')) {
        throw Exception(
          'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.',
        );
      } else if (errorMessage.contains('user not found')) {
        throw Exception('البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد.');
      } else {
        throw Exception('خطأ في تسجيل الدخول: ${e.message}');
      }
    } catch (e) {
      debugPrint('❌ خطأ غير متوقع: $e');
      debugPrint('❌ Error type: ${e.runtimeType}');

      // إرجاع رسالة واضحة
      if (e.toString().contains('Exception')) {
        rethrow; // إذا كان Exception مخصص، أرجعه كما هو
      }
      throw Exception('خطأ في تسجيل الدخول: ${e.toString()}');
    }
  }

  /// تسجيل خروج
  ///
  /// Throws: Exception في حالة الفشل
  static Future<void> signOut() async {
    try {
      // Logout from MBUY Auth
      try {
        await MbuyAuthService.logout();
        debugPrint('[AuthService] ✅ MBUY Auth logout successful');
      } catch (e) {
        debugPrint('[AuthService] ⚠️ MBUY Auth logout error: $e');
      }

      // Logout from Supabase Auth (for backward compatibility)
      try {
        await supabaseClient.auth.signOut();
        debugPrint('[AuthService] ✅ Supabase Auth logout successful');
      } catch (e) {
        debugPrint('[AuthService] ⚠️ Supabase Auth logout error: $e');
      }
    } catch (e) {
      throw Exception('خطأ في تسجيل الخروج: ${e.toString()}');
    }
  }

  /// جلب المستخدم الحالي
  ///
  /// Returns: User object إذا كان المستخدم مسجل، null إذا لم يكن مسجل
  /// Uses MBUY Auth first, falls back to Supabase Auth
  static Future<User?> getCurrentUser() async {
    // Try MBUY Auth first
    try {
      final mbuyUser = await MbuyAuthHelper.getCurrentUser();
      if (mbuyUser != null) {
        // Convert MbuyUser to Supabase User-like object
        // For now, return null and let Supabase handle it
        // This maintains backward compatibility
        debugPrint('[AuthService] MBUY Auth user found: ${mbuyUser.email}');
      }
    } catch (e) {
      debugPrint('[AuthService] MBUY Auth error: $e');
    }

    // Fallback to Supabase Auth for backward compatibility
    return supabaseClient.auth.currentUser;
  }

  /// التحقق من حالة تسجيل الدخول
  ///
  /// Returns: true إذا كان المستخدم مسجل، false إذا لم يكن
  static Future<bool> isSignedIn() async {
    // Check MBUY Auth first
    final mbuyLoggedIn = await MbuyAuthService.isLoggedIn();
    if (mbuyLoggedIn) {
      return true;
    }

    // Fallback to Supabase Auth
    final user = await getCurrentUser();
    return user != null;
  }
}
