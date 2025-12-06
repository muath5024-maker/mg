import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../features/auth/presentation/screens/auth_screen.dart';
import '../core/supabase_client.dart';
import '../core/app_config.dart';
import '../core/theme/theme_provider.dart';
import '../core/firebase_service.dart';
import '../core/session/store_session.dart';
import '../shared/widgets/mbuy_loader.dart';
import '../features/customer/presentation/screens/customer_shell.dart';
import '../features/merchant/presentation/screens/merchant_home_screen.dart';
import 'services/api_service.dart';
import 'services/mbuy_auth_helper.dart';
import '../features/auth/data/mbuy_auth_service.dart';

class RootWidget extends StatefulWidget {
  final ThemeProvider themeProvider;

  const RootWidget({super.key, required this.themeProvider});

  @override
  State<RootWidget> createState() => _RootWidgetState();
}

class _RootWidgetState extends State<RootWidget> {
  User? _user;
  String? _userRole; // 'customer' أو 'merchant'
  bool _isLoading = true;
  bool _isGuestMode = false; // وضع الضيف
  late AppModeProvider _appModeProvider;

  @override
  void initState() {
    super.initState();
    _appModeProvider = AppModeProvider();
    _checkAuthState();

    // الاستماع لتغييرات حالة Auth
    supabaseClient.auth.onAuthStateChange.listen((data) {
      final AuthChangeEvent event = data.event;
      debugPrint('🔐 Auth State Changed: ${event.name}');
      if (event == AuthChangeEvent.signedIn ||
          event == AuthChangeEvent.signedOut ||
          event == AuthChangeEvent.tokenRefreshed ||
          event == AuthChangeEvent.initialSession) {
        debugPrint('🔄 إعادة فحص حالة المصادقة...');
        _checkAuthState();
      }
    });

    // الاستماع لتغييرات AppMode
    _appModeProvider.addListener(_onAppModeChanged);
  }

  @override
  void dispose() {
    _appModeProvider.removeListener(_onAppModeChanged);
    _appModeProvider.dispose();
    super.dispose();
  }

  void _onAppModeChanged() {
    setState(() {
      // إعادة بناء الشاشة عند تغيير AppMode
    });
  }

  Future<void> _checkAuthState() async {
    setState(() {
      _isLoading = true;
    });

    // جلب المستخدم الحالي من MBUY Auth أولاً
    User? user;
    bool isMbuyAuth = false;

    try {
      final mbuyLoggedIn = await MbuyAuthService.isLoggedIn();
      if (mbuyLoggedIn) {
        isMbuyAuth = true;
        debugPrint('🔍 [MBUY Auth] User is logged in');
        
        // Try to get user info from MBUY Auth
        final mbuyUser = await MbuyAuthHelper.getCurrentUser();
        if (mbuyUser != null) {
          debugPrint('🔍 [MBUY Auth] User found: ${mbuyUser.email}');
          // For now, we'll still use Supabase User structure
          // but we know the user is authenticated via MBUY Auth
        }
      }
    } catch (e) {
      debugPrint('⚠️ [MBUY Auth] Error checking auth state: $e');
    }

    // Fallback to Supabase Auth for backward compatibility
    if (!isMbuyAuth) {
      final session = supabaseClient.auth.currentSession;
      user = session?.user;

      debugPrint(
        '🔍 [Supabase Auth] فحص حالة المصادقة: user=${user?.email}, session=${session != null}',
      );
      debugPrint('🔍 Session expires at: ${session?.expiresAt}');
      debugPrint('🔍 User ID: ${user?.id}');
      debugPrint('🔍 Email confirmed: ${user?.emailConfirmedAt != null}');

      // التحقق من انتهاء الجلسة
      if (session != null && session.expiresAt != null) {
        final expiresAt = DateTime.fromMillisecondsSinceEpoch(
          session.expiresAt! * 1000,
        );
        final now = DateTime.now();
        if (expiresAt.isBefore(now)) {
          debugPrint('⚠️ الجلسة منتهية - محاولة تحديث...');
          try {
            await supabaseClient.auth.refreshSession();
            debugPrint('✅ تم تحديث الجلسة بنجاح');
          } catch (e) {
            debugPrint('❌ فشل تحديث الجلسة: $e');
          }
        }
      }
    } else {
      // For MBUY Auth, get user ID from storage
      final userId = await MbuyAuthService.getUserId();
      final userEmail = await MbuyAuthService.getUserEmail();
      debugPrint('🔍 [MBUY Auth] User ID: $userId, Email: $userEmail');
      
      // Create a mock User object for compatibility
      // We'll use the user ID to fetch from user_profiles
      if (userId != null) {
        // We'll handle this in the user_profiles query below
      }
    }

    // Get user from user_profiles (works for both MBUY and Supabase Auth)
    final userId = isMbuyAuth 
        ? await MbuyAuthService.getUserId()
        : user?.id;

    if (userId != null) {
      // تعيين User ID في Analytics
      await FirebaseService.setUserId(userId);

      // جلب role من user_profiles
      try {
        final response = await supabaseClient
            .from('user_profiles')
            .select('role, display_name')
            .eq('id', userId)
            .maybeSingle();

        if (response != null) {
          final role = response['role'] as String? ?? 'customer';

          debugPrint('✅ تم جلب role: $role');
          debugPrint('✅ User ID: $userId');
          debugPrint('✅ Display Name: ${response['display_name']}');

          setState(() {
            // Keep user object for backward compatibility
            // If MBUY Auth, user will be null but userId is available
            _user = user;
            _userRole = role;
            // تحديد AppMode بناءً على role
            if (role == 'merchant') {
              debugPrint('🛒 تم تفعيل وضع التاجر');
              _appModeProvider.setMerchantMode();
              // جلب store_id للتاجر مباشرة بعد تسجيل الدخول
              _loadMerchantStoreId();
            } else {
              debugPrint('🛍️ تم تفعيل وضع العميل');
              _appModeProvider.setCustomerMode();
            }
          });
        } else {
          // إذا لم يوجد سجل في user_profiles، أنشئه عبر Worker API
          try {
            final userEmail = isMbuyAuth 
                ? await MbuyAuthService.getUserEmail()
                : user?.email;
            
            await ApiService.post(
              '/secure/auth/initialize-user',
              data: {
                'role': 'customer',
                'display_name': userEmail?.split('@')[0] ?? 'مستخدم',
              },
            );
            debugPrint('✅ تم إنشاء user_profile + wallet عبر Worker API');
          } catch (e) {
            debugPrint('⚠️ فشل إنشاء user_profile/wallet: $e');
          }

          setState(() {
            _user = user; // May be null for MBUY Auth
            _userRole = 'customer';
            _appModeProvider.setCustomerMode();
          });
        }
      } catch (e) {
        debugPrint('⚠️ خطأ في جلب بيانات المستخدم: $e');
        // في حالة الخطأ، افترض customer
        setState(() {
          _user = user; // May be null for MBUY Auth
          _userRole = 'customer';
          _appModeProvider.setCustomerMode();
        });
      }
    } else {
      setState(() {
        _user = null;
        _userRole = null;
      });
    }

    setState(() {
      _isLoading = false;
    });
  }

  /// جلب store_id للتاجر بعد تسجيل الدخول
  Future<void> _loadMerchantStoreId() async {
    try {
      final storeSession = context.read<StoreSession>();
      
      // جلب معلومات المستخدم الحالي
      // Try MBUY Auth first
      String? userId;
      String? userEmail;
      
      final mbuyLoggedIn = await MbuyAuthService.isLoggedIn();
      if (mbuyLoggedIn) {
        userId = await MbuyAuthService.getUserId();
        userEmail = await MbuyAuthService.getUserEmail();
      } else {
        // Fallback to Supabase Auth
        final user = supabaseClient.auth.currentUser;
        userId = user?.id;
        userEmail = user?.email;
      }
      
      debugPrint('🔍 [StoreSession] بدء جلب معلومات المتجر...');
      debugPrint('🔍 [StoreSession] User ID من Flutter: $userId');
      debugPrint('🔍 [StoreSession] User Email: ${userEmail ?? "N/A"}');
      debugPrint('🔍 [StoreSession] Timestamp: ${DateTime.now().toIso8601String()}');
      
      // إذا كان store_id محفوظاً بالفعل، لا حاجة لإعادة الجلب
      if (storeSession.hasStore) {
        debugPrint('✅ [StoreSession] Store ID موجود بالفعل: ${storeSession.storeId}');
        return;
      }

      debugPrint('🔄 [StoreSession] جاري جلب معلومات المتجر عبر Worker API...');
      
      // جلب المتجر عبر Worker API
      final result = await ApiService.get('/secure/merchant/store');
      
      debugPrint('📥 [StoreSession] استجابة API: ok=${result['ok']}, hasData=${result['data'] != null}, error=${result['error']}');

      if (result['ok'] == true && result['data'] != null) {
        final store = result['data'] as Map<String, dynamic>;
        final storeId = store['id'] as String?;
        final ownerId = store['owner_id'] as String?;
        final storeName = store['name'] as String?;
        
        debugPrint('📦 [StoreSession] بيانات المتجر: storeId=$storeId, storeName=$storeName, ownerId=$ownerId, userId=$userId, userIdMatches=${ownerId == userId}');
        
        if (storeId != null && storeId.isNotEmpty) {
          storeSession.setStoreId(storeId);
          debugPrint('✅ [StoreSession] تم حفظ Store ID بعد تسجيل الدخول: $storeId');
          debugPrint('✅ [StoreSession] Store Name: ${storeName ?? "N/A"}');
          debugPrint('✅ [StoreSession] Owner ID من DB: $ownerId');
          debugPrint('✅ [StoreSession] User ID من Flutter: $userId');
          if (ownerId != null && userId != null) {
            debugPrint('${ownerId == userId ? "✅" : "⚠️"} [StoreSession] تطابق User ID: ${ownerId == userId}');
          }
        } else {
          debugPrint('⚠️ [StoreSession] المتجر موجود لكن بدون ID');
          storeSession.clear();
        }
      } else {
        // إذا كانت الاستجابة ok لكن data = null، يعني لم يتم العثور على متجر
        // Edge Function ستحاول إنشاء متجر تلقائياً إذا كان المستخدم تاجر
        debugPrint('⚠️ [StoreSession] لم يتم العثور على متجر لهذا الحساب');
        debugPrint('⚠️ [StoreSession] Response: $result');
        debugPrint('ℹ️ [StoreSession] إذا كان المستخدم تاجر، سيتم إنشاء متجر تلقائياً في المرة القادمة');
        storeSession.clear();
      }
    } catch (e, stackTrace) {
      debugPrint('❌ [StoreSession] خطأ في جلب Store ID بعد تسجيل الدخول: $e');
      debugPrint('❌ [StoreSession] Stack trace: $stackTrace');
      // في حالة الخطأ، لا ننظف الـ session الموجود
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: const Center(child: MbuyLoader()),
      );
    }

    // إذا المستخدم غير مسجل وليس في وضع الضيف → عرض شاشة Auth
    if (_user == null && !_isGuestMode) {
      return Scaffold(
        body: Stack(
          children: [
            const AuthScreen(),
            // زر تخطي عائم في أعلى اليمين
            SafeArea(
              child: Positioned(
                top: 8,
                right: 8,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextButton.icon(
                    onPressed: () {
                      setState(() {
                        _isGuestMode = true;
                        _appModeProvider.setCustomerMode();
                      });
                    },
                    icon: const Icon(
                      Icons.arrow_forward,
                      color: Colors.black87,
                    ),
                    label: const Text(
                      'تخطي',
                      style: TextStyle(
                        color: Colors.black87,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    // إذا المستخدم مسجل أو في وضع الضيف → عرض الشاشة المناسبة بناءً على AppMode
    // يمكن للتاجر التبديل إلى وضع العميل (كمشاهد)
    if (_appModeProvider.mode == AppMode.merchant && _user != null) {
      return MerchantHomeScreen(appModeProvider: _appModeProvider);
    } else {
      return CustomerShell(
        appModeProvider: _appModeProvider,
        userRole: _userRole,
        themeProvider: widget.themeProvider,
      );
    }
  }
}
