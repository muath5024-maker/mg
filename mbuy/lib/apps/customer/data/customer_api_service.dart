/// Customer API Service - Facade Pattern
///
/// يوفر واجهة موحدة للتوافق مع الكود القديم
/// بينما يستخدم الخدمات المنفصلة داخلياً
///
/// @deprecated استخدم الخدمات المنفصلة مباشرة:
/// - ProductService
/// - CartService
/// - FavoritesService
/// - OrderService
/// - StoreService
/// - CategoryService
/// - SearchService
/// - BannerService
library;

import 'api/api.dart';
import 'services/services.dart';
import '../models/models.dart';

// Re-export for backward compatibility
export 'api/api.dart';
export 'services/services.dart';

/// Customer API Service - Facade للتوافق العكسي
///
/// هذه الفئة موجودة للتوافق مع الكود القديم.
/// يُفضل استخدام الخدمات المنفصلة مباشرة.
class CustomerApiService {
  final BaseApiClient _client;

  // خدمات منفصلة
  late final ProductService products;
  late final CartService cart;
  late final FavoritesService favorites;
  late final OrderService orders;
  late final StoreService stores;
  late final CategoryService categories;
  late final SearchService search;
  late final BannerService banners;

  CustomerApiService({BaseApiClient? client})
    : _client = client ?? BaseApiClient() {
    // تهيئة الخدمات
    products = ProductService(_client);
    cart = CartService(_client);
    favorites = FavoritesService(_client);
    orders = OrderService(_client);
    stores = StoreService(_client);
    categories = CategoryService(_client);
    search = SearchService(_client);
    banners = BannerService(_client);
  }

  /// Set authentication tokens
  void setAuthToken(String? token, {String? refreshToken}) {
    _client.setAuthToken(token, refreshToken: refreshToken);
  }

  /// Clear authentication
  void clearAuth() {
    _client.clearAuth();
  }

  /// Check if authenticated
  bool get isAuthenticated => _client.isAuthenticated;

  /// Set token refresh callback
  set onTokenRefresh(Future<String?> Function()? callback) {
    _client.onTokenRefresh = callback;
  }

  /// Set auth failure callback
  set onAuthFailure(void Function()? callback) {
    _client.onAuthFailure = callback;
  }

  // =====================================================
  // PRODUCTS - استخدم products.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم products.getProducts() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getProducts({
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) => products.getProducts(categoryId: categoryId, page: page, limit: limit);

  @Deprecated('استخدم products.getProduct() بدلاً من ذلك')
  Future<ApiResponse<Product>> getProduct(String productId) =>
      products.getProduct(productId);

  @Deprecated('استخدم products.getFlashDeals() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getFlashDeals({int limit = 20}) =>
      products.getFlashDeals(limit: limit);

  @Deprecated('استخدم products.getTrendingProducts() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getTrendingProducts({int limit = 20}) =>
      products.getTrendingProducts(limit: limit);

  // =====================================================
  // SEARCH - استخدم search.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم search.searchProducts() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> searchProducts({
    required String query,
    String? categoryId,
    String? platformCategoryId,
    String? storeId,
    double? minPrice,
    double? maxPrice,
    String sortBy = 'relevance',
    bool? inStock,
    bool includeBoosted = true,
    int page = 1,
    int limit = 20,
  }) => search.searchProducts(
    query: query,
    categoryId: categoryId,
    platformCategoryId: platformCategoryId,
    storeId: storeId,
    minPrice: minPrice,
    maxPrice: maxPrice,
    sortBy: sortBy,
    inStock: inStock,
    includeBoosted: includeBoosted,
    page: page,
    limit: limit,
  );

  @Deprecated('استخدم search.getSearchSuggestions() بدلاً من ذلك')
  Future<ApiResponse<List<String>>> getSearchSuggestions(String query) =>
      search.getSearchSuggestions(query);

  @Deprecated('استخدم search.getTrendingSearches() بدلاً من ذلك')
  Future<ApiResponse<List<String>>> getTrendingSearches() =>
      search.getTrendingSearches();

  // =====================================================
  // CATEGORIES - استخدم categories.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم categories.getCategories() بدلاً من ذلك')
  Future<ApiResponse<List<Category>>> getCategories() =>
      categories.getCategories();

  @Deprecated('استخدم categories.getPlatformCategories() بدلاً من ذلك')
  Future<ApiResponse<List<PlatformCategory>>> getPlatformCategories() =>
      categories.getPlatformCategories();

  @Deprecated('استخدم categories.getProductsByCategory() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  }) => categories.getProductsByCategory(categoryId, page: page, limit: limit);

  // =====================================================
  // STORES - استخدم stores.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم stores.searchStores() بدلاً من ذلك')
  Future<ApiResponse<List<Store>>> searchStores({
    required String query,
    String? category,
    int page = 1,
    int limit = 20,
  }) => stores.searchStores(
    query: query,
    category: category,
    page: page,
    limit: limit,
  );

  @Deprecated('استخدم stores.getStore() بدلاً من ذلك')
  Future<ApiResponse<Store>> getStore(String storeId) =>
      stores.getStore(storeId);

  @Deprecated('استخدم stores.getStoreProducts() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getStoreProducts(
    String storeId, {
    int page = 1,
    int limit = 20,
  }) => stores.getStoreProducts(storeId, page: page, limit: limit);

  @Deprecated('استخدم stores.getFeaturedStores() بدلاً من ذلك')
  Future<ApiResponse<List<Store>>> getFeaturedStores({int limit = 10}) =>
      stores.getFeaturedStores(limit: limit);

  // =====================================================
  // CART - استخدم cart.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم cart.getCart() بدلاً من ذلك')
  Future<ApiResponse<Cart>> getCart() => cart.getCart();

  @Deprecated('استخدم cart.addToCart() بدلاً من ذلك')
  Future<ApiResponse<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  }) => cart.addToCart(productId: productId, quantity: quantity);

  @Deprecated('استخدم cart.updateCartItem() بدلاً من ذلك')
  Future<ApiResponse<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  }) => cart.updateCartItem(itemId: itemId, quantity: quantity);

  @Deprecated('استخدم cart.removeFromCart() بدلاً من ذلك')
  Future<ApiResponse<void>> removeFromCart(String itemId) =>
      cart.removeFromCart(itemId);

  @Deprecated('استخدم cart.clearCart() بدلاً من ذلك')
  Future<ApiResponse<void>> clearCart() => cart.clearCart();

  @Deprecated('استخدم cart.getCartCount() بدلاً من ذلك')
  Future<ApiResponse<int>> getCartCount() => cart.getCartCount();

  // =====================================================
  // FAVORITES - استخدم favorites.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم favorites.getFavorites() بدلاً من ذلك')
  Future<ApiResponse<List<Product>>> getFavorites({
    int page = 1,
    int limit = 20,
  }) => favorites.getFavorites(page: page, limit: limit);

  @Deprecated('استخدم favorites.addToFavorites() بدلاً من ذلك')
  Future<ApiResponse<void>> addToFavorites(String productId) =>
      favorites.addToFavorites(productId);

  @Deprecated('استخدم favorites.removeFromFavorites() بدلاً من ذلك')
  Future<ApiResponse<void>> removeFromFavorites(String productId) =>
      favorites.removeFromFavorites(productId);

  @Deprecated('استخدم favorites.toggleFavorite() بدلاً من ذلك')
  Future<ApiResponse<bool>> toggleFavorite(String productId) =>
      favorites.toggleFavorite(productId);

  @Deprecated('استخدم favorites.checkFavorite() بدلاً من ذلك')
  Future<ApiResponse<bool>> checkFavorite(String productId) =>
      favorites.checkFavorite(productId);

  @Deprecated('استخدم favorites.getFavoritesCount() بدلاً من ذلك')
  Future<ApiResponse<int>> getFavoritesCount() => favorites.getFavoritesCount();

  // =====================================================
  // ORDERS - استخدم orders.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم orders.validateCheckout() بدلاً من ذلك')
  Future<ApiResponse<Map<String, dynamic>>> validateCheckout() =>
      orders.validateCheckout();

  @Deprecated('استخدم orders.createOrder() بدلاً من ذلك')
  Future<ApiResponse<Map<String, dynamic>>> createOrder({
    required ShippingAddress shippingAddress,
    String paymentMethod = 'cash',
    String? notes,
    String? couponCode,
  }) => orders.createOrder(
    shippingAddress: shippingAddress,
    paymentMethod: paymentMethod,
    notes: notes,
    couponCode: couponCode,
  );

  @Deprecated('استخدم orders.getOrders() بدلاً من ذلك')
  Future<ApiResponse<List<Order>>> getOrders({
    String? status,
    int page = 1,
    int limit = 20,
  }) => orders.getOrders(status: status, page: page, limit: limit);

  @Deprecated('استخدم orders.getOrder() بدلاً من ذلك')
  Future<ApiResponse<Order>> getOrder(String orderId) =>
      orders.getOrder(orderId);

  @Deprecated('استخدم orders.cancelOrder() بدلاً من ذلك')
  Future<ApiResponse<void>> cancelOrder(String orderId) =>
      orders.cancelOrder(orderId);

  @Deprecated('استخدم orders.getAddresses() بدلاً من ذلك')
  Future<ApiResponse<List<ShippingAddress>>> getAddresses() =>
      orders.getAddresses();

  @Deprecated('استخدم orders.saveAddress() بدلاً من ذلك')
  Future<ApiResponse<ShippingAddress>> saveAddress(ShippingAddress address) =>
      orders.saveAddress(address);

  @Deprecated('استخدم orders.deleteAddress() بدلاً من ذلك')
  Future<ApiResponse<void>> deleteAddress(String addressId) =>
      orders.deleteAddress(addressId);

  // =====================================================
  // BANNERS - استخدم banners.xxx() مباشرة
  // =====================================================

  @Deprecated('استخدم banners.getHomeBanners() بدلاً من ذلك')
  Future<ApiResponse<List<Map<String, dynamic>>>> getHomeBanners() =>
      banners.getHomeBanners();

  /// Dispose resources
  void dispose() {
    _client.dispose();
  }
}
