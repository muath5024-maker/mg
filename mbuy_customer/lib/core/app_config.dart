/// MBUY Customer Application Configuration
/// إعدادات تطبيق العميل للتسوق
class AppConfig {
  // ============================================================================
  // API Configuration
  // ============================================================================

  /// Cloudflare Worker Base URL
  static const String apiBaseUrl =
      'https://misty-mode-b68b.baharista1.workers.dev';

  // ============================================================================
  // App Metadata
  // ============================================================================

  static const String appName = 'MBUY';
  static const String appVersion = '1.0.0';

  // ============================================================================
  // Storage Keys
  // ============================================================================

  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String userTypeKey = 'user_type';
  static const String customerIdKey = 'customer_id';

  // ============================================================================
  // Auth API Endpoints (Custom JWT from Worker)
  // ============================================================================

  /// Login - POST /auth/login
  static const String loginEndpoint = '/auth/login';

  /// Register - POST /auth/register
  static const String registerEndpoint = '/auth/register';

  /// Refresh Token - POST /auth/refresh
  static const String refreshEndpoint = '/auth/refresh';

  /// Logout - POST /auth/logout
  static const String logoutEndpoint = '/auth/logout';

  /// Get Current User - GET /auth/me
  static const String meEndpoint = '/auth/me';

  /// Forgot Password - POST /auth/forgot-password
  static const String forgotPasswordEndpoint = '/auth/forgot-password';

  // ============================================================================
  // Public API Endpoints (No auth required)
  // ============================================================================

  /// Public Products - /api/public/products
  static const String publicProductsEndpoint = '/api/public/products';

  /// Public Stores - /api/public/stores
  static const String publicStoresEndpoint = '/api/public/stores';

  /// Featured Stores - /api/public/stores/featured
  static const String featuredStoresEndpoint = '/api/public/stores/featured';

  /// Public Categories - /api/public/categories/all
  static const String publicCategoriesEndpoint = '/api/public/categories/all';

  /// Flash Deals - /api/public/products/flash-deals
  static const String flashDealsEndpoint = '/api/public/products/flash-deals';

  /// Trending Products - /api/public/products/trending
  static const String trendingProductsEndpoint =
      '/api/public/products/trending';

  /// Platform Categories - /api/public/platform-categories
  static const String platformCategoriesEndpoint =
      '/api/public/platform-categories';

  /// Boosted Products - /api/public/boosted-products
  static const String boostedProductsEndpoint = '/api/public/boosted-products';

  /// Search Products - /api/public/search/products
  static const String searchProductsEndpoint = '/api/public/search/products';

  /// Search Stores - /api/public/search/stores
  static const String searchStoresEndpoint = '/api/public/search/stores';

  /// Search Suggestions - /api/public/search/suggestions
  static const String searchSuggestionsEndpoint =
      '/api/public/search/suggestions';

  // ============================================================================
  // Customer API Endpoints (Protected - requires JWT)
  // ============================================================================

  /// Cart - /api/customer/cart
  static const String cartEndpoint = '/api/customer/cart';

  /// Cart Count - /api/customer/cart/count
  static const String cartCountEndpoint = '/api/customer/cart/count';

  /// Favorites - /api/customer/favorites
  static const String favoritesEndpoint = '/api/customer/favorites';

  /// Favorites Count - /api/customer/favorites/count
  static const String favoritesCountEndpoint = '/api/customer/favorites/count';

  /// Customer Orders - /api/customer/orders
  static const String ordersEndpoint = '/api/customer/orders';

  /// Checkout Validate - /api/customer/checkout/validate
  static const String checkoutValidateEndpoint =
      '/api/customer/checkout/validate';

  /// Checkout - /api/customer/checkout
  static const String checkoutEndpoint = '/api/customer/checkout';

  /// Addresses - /api/customer/addresses
  static const String addressesEndpoint = '/api/customer/addresses';
}
