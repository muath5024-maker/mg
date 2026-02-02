import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/main/customer_main_screen.dart';
import '../features/product/product_detail_screen.dart';
import '../features/store/store_page_screen.dart';
import '../features/search/search_screen.dart';
import '../features/checkout/checkout_screen.dart';
import '../features/orders/orders_screen.dart';
import '../features/favorites/favorites_screen.dart';
import '../features/cart/cart_screen.dart';
import '../features/categories/category_products_screen.dart';
import '../features/categories/category_suppliers_screen.dart';
import '../features/settings/customer_settings_screen.dart';
import '../features/orders/order_detail_screen.dart';
import '../features/merchant/screens/merchant_screens.dart';
import '../features/merchant/tabs/store_management_tab.dart';
import '../features/merchant/tabs/products_tab.dart';
import '../features/merchant/tabs/orders_tab.dart';
import '../features/merchant/tabs/marketing_tab.dart';
import '../features/merchant/tabs/team_tab.dart';
import '../features/merchant/tabs/sync_tab.dart';
import '../features/merchant/tabs/creative_studio_tab.dart';
import '../../../shared/screens/login_screen.dart';
import '../../../features/auth/presentation/screens/register_screen.dart';
import '../../../features/auth/data/auth_controller.dart';

/// Customer Router - التنقل داخل تطبيق العميل
///
/// يدعم Deep Linking للمسارات التالية:
/// - mbuy://product/{id} - صفحة المنتج
/// - mbuy://store/{id} - صفحة المتجر
/// - mbuy://order/{id} - تفاصيل الطلب
/// - mbuy://category/{name} - منتجات الفئة
class CustomerRouter {
  /// المسارات المحمية التي تتطلب تسجيل الدخول
  static const List<String> _protectedRoutes = [
    '/checkout',
    '/orders',
    '/order',
    '/favorites',
    '/cart',
    '/settings',
  ];

  /// التحقق من أن المسار محمي
  static bool _isProtectedRoute(String location) {
    return _protectedRoutes.any((route) => location.startsWith(route));
  }

  static GoRouter createRouter(WidgetRef ref) {
    return GoRouter(
      initialLocation: '/',
      debugLogDiagnostics: true,

      // Route Guard - حماية المسارات
      redirect: (context, state) {
        final isAuthenticated = ref
            .read(authControllerProvider)
            .isAuthenticated;
        final isLoggingIn = state.matchedLocation == '/login';
        final isProtected = _isProtectedRoute(state.matchedLocation);

        // إذا كان المسار محمي والمستخدم غير مسجل دخول
        if (isProtected && !isAuthenticated) {
          // حفظ المسار الأصلي للعودة إليه بعد تسجيل الدخول
          return '/login?redirect=${Uri.encodeComponent(state.matchedLocation)}';
        }

        // إذا كان مسجل دخول وفي صفحة تسجيل الدخول
        if (isLoggingIn && isAuthenticated) {
          // العودة للصفحة المطلوبة أو الرئيسية
          final redirect = state.uri.queryParameters['redirect'];
          return redirect != null ? Uri.decodeComponent(redirect) : '/';
        }

        return null; // لا يوجد توجيه
      },

      routes: [
        // الصفحة الرئيسية (Bottom Navigation)
        GoRoute(
          path: '/',
          name: 'customer-home',
          builder: (context, state) => const CustomerMainScreen(),
        ),

        // تفاصيل المنتج
        GoRoute(
          path: '/product/:id',
          name: 'product-detail',
          builder: (context, state) {
            final productId = state.pathParameters['id'] ?? '';
            return ProductDetailScreen(productId: productId);
          },
        ),

        // صفحة المتجر
        GoRoute(
          path: '/store/:id',
          name: 'store-page',
          builder: (context, state) {
            final storeId = state.pathParameters['id'] ?? '';
            return StorePageScreen(storeId: storeId);
          },
        ),

        // منتجات الفئة (عرض الكل)
        GoRoute(
          path: '/category/:slug/products',
          name: 'category-products',
          builder: (context, state) {
            final categorySlug = state.pathParameters['slug'] ?? '';
            return CategoryProductsScreen(categorySlug: categorySlug);
          },
        ),

        // موردون الفئة (عرض الكل)
        GoRoute(
          path: '/category/:slug/suppliers',
          name: 'category-suppliers',
          builder: (context, state) {
            final categoryName = state.pathParameters['slug'] ?? '';
            return CategorySuppliersScreen(categoryName: categoryName);
          },
        ),

        // البحث
        GoRoute(
          path: '/search',
          name: 'search',
          builder: (context, state) {
            final storeId = state.uri.queryParameters['store'];
            return SearchScreen(storeId: storeId);
          },
        ),

        // المفضلة
        GoRoute(
          path: '/favorites',
          name: 'favorites',
          builder: (context, state) => const FavoritesScreen(),
        ),

        // السلة
        GoRoute(
          path: '/cart',
          name: 'cart',
          builder: (context, state) => Scaffold(
            appBar: AppBar(
              title: const Text('سلة التسوق'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios),
                onPressed: () => context.pop(),
              ),
            ),
            body: const CartScreen(),
          ),
        ),

        // طلباتي
        GoRoute(
          path: '/orders',
          name: 'orders',
          builder: (context, state) => const OrdersScreen(),
        ),

        // تفاصيل الطلب
        GoRoute(
          path: '/order/:id',
          name: 'order-detail',
          builder: (context, state) {
            final orderId = state.pathParameters['id'] ?? '';
            return OrderDetailScreen(orderId: orderId);
          },
        ),

        // Checkout
        GoRoute(
          path: '/checkout',
          name: 'checkout',
          builder: (context, state) => const CheckoutScreen(),
        ),

        // المساعد الشخصي
        GoRoute(
          path: '/ai-assistant',
          name: 'ai-assistant',
          builder: (context, state) => Scaffold(
            appBar: AppBar(
              title: const Text('المساعد الشخصي'),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios),
                onPressed: () => context.pop(),
              ),
            ),
            body: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.smart_toy, size: 80, color: Color(0xFF00BFA5)),
                  SizedBox(height: 24),
                  Text(
                    'المساعد الذكي',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'قريبًا - مساعدك الشخصي للتسوق',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
        ),

        // تسجيل الدخول
        GoRoute(
          path: '/login',
          name: 'customer-login',
          builder: (context, state) => const LoginScreen(),
        ),

        // إنشاء حساب جديد
        GoRoute(
          path: '/register',
          name: 'customer-register',
          builder: (context, state) => const RegisterScreen(),
        ),

        // الإعدادات
        GoRoute(
          path: '/settings',
          name: 'customer-settings',
          builder: (context, state) => const CustomerSettingsScreen(),
        ),

        // ===== Merchant Routes =====
        // منتجات التاجر
        GoRoute(
          path: '/merchant/products',
          name: 'merchant-products',
          builder: (context, state) => const MerchantProductsScreen(),
        ),

        // طلبات التاجر
        GoRoute(
          path: '/merchant/orders',
          name: 'merchant-orders',
          builder: (context, state) => const MerchantOrdersScreen(),
        ),

        // إضافة منتج
        GoRoute(
          path: '/merchant/add-product',
          name: 'merchant-add-product',
          builder: (context, state) => const MerchantAddProductScreen(),
        ),

        // التقارير
        GoRoute(
          path: '/merchant/reports',
          name: 'merchant-reports',
          builder: (context, state) => const MerchantReportsScreen(),
        ),

        // التسويق
        GoRoute(
          path: '/merchant/marketing',
          name: 'merchant-marketing',
          builder: (context, state) => const MerchantMarketingScreen(),
        ),

        // إعدادات التاجر
        GoRoute(
          path: '/merchant/settings',
          name: 'merchant-settings',
          builder: (context, state) => const MerchantSettingsScreen(),
        ),

        // المبيعات
        GoRoute(
          path: '/merchant/sales',
          name: 'merchant-sales',
          builder: (context, state) => const MerchantSalesScreen(),
        ),

        // ===== Merchant Tabs Routes =====
        // إدارة المتجر
        GoRoute(
          path: '/merchant/store-management',
          name: 'merchant-store-management',
          builder: (context, state) => const StoreManagementTab(),
        ),

        // تبويب المنتجات
        GoRoute(
          path: '/merchant/products-tab',
          name: 'merchant-products-tab',
          builder: (context, state) => const ProductsTab(),
        ),

        // تبويب الطلبات
        GoRoute(
          path: '/merchant/orders-tab',
          name: 'merchant-orders-tab',
          builder: (context, state) => const OrdersTab(),
        ),

        // تبويب التسويق
        GoRoute(
          path: '/merchant/marketing-tab',
          name: 'merchant-marketing-tab',
          builder: (context, state) => const MarketingTab(),
        ),

        // تبويب الفريق
        GoRoute(
          path: '/merchant/team',
          name: 'merchant-team',
          builder: (context, state) => const TeamTab(),
        ),

        // تبويب المزامنة
        GoRoute(
          path: '/merchant/sync',
          name: 'merchant-sync',
          builder: (context, state) => const SyncTab(),
        ),

        // تبويب الاستديو الإبداعي
        GoRoute(
          path: '/merchant/creative-studio',
          name: 'merchant-creative-studio',
          builder: (context, state) => const CreativeStudioTab(),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'الصفحة غير موجودة',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                state.uri.toString(),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/'),
                child: const Text('العودة للرئيسية'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
