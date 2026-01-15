/// Customer Providers - مزودي البيانات للعميل
///
/// Riverpod providers for the customer app with Repository Pattern
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import '../models/models.dart';
import 'customer_api_service.dart';
import 'repositories/repositories.dart';

// =====================================================
// CONFIGURATION PROVIDER
// =====================================================

/// Current environment (change this to switch environments)
const _currentEnv = String.fromEnvironment('ENV', defaultValue: 'production');

/// App configuration based on environment
final appConfigProvider = Provider<AppConfig>((ref) {
  switch (_currentEnv) {
    case 'development':
      return AppConfig.development;
    case 'staging':
      return AppConfig.staging;
    default:
      return AppConfig.production;
  }
});

// =====================================================
// API SERVICE PROVIDER
// =====================================================

/// Provider for the API service
final customerApiProvider = Provider<CustomerApiService>((ref) {
  final config = ref.watch(appConfigProvider);
  final api = CustomerApiService(config: config);

  // Dispose when no longer used
  ref.onDispose(() => api.dispose());

  return api;
});

// =====================================================
// REPOSITORY PROVIDERS
// =====================================================

/// Product Repository Provider
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  final api = ref.watch(customerApiProvider);
  return ProductRepository(api);
});

/// Cart Repository Provider
final cartRepositoryProvider = Provider<CartRepository>((ref) {
  final api = ref.watch(customerApiProvider);
  return CartRepository(api);
});

/// Store Repository Provider
final storeRepositoryProvider = Provider<StoreRepository>((ref) {
  final api = ref.watch(customerApiProvider);
  return StoreRepository(api);
});

/// Category Repository Provider
final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  final api = ref.watch(customerApiProvider);
  return CategoryRepository(api);
});

// =====================================================
// ASYNC VALUE EXTENSIONS
// =====================================================

/// Extension for easier AsyncValue handling
extension AsyncValueX<T> on AsyncValue<T> {
  /// Get data or null
  T? get dataOrNull => whenOrNull(data: (data) => data);
}

// =====================================================
// PRODUCTS PROVIDERS
// =====================================================

/// Products list state
class ProductsState {
  final List<Product> products;
  final bool isLoading;
  final String? error;
  final int page;
  final bool hasMore;

  const ProductsState({
    this.products = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
  });

  ProductsState copyWith({
    List<Product>? products,
    bool? isLoading,
    String? error,
    int? page,
    bool? hasMore,
  }) {
    return ProductsState(
      products: products ?? this.products,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
    );
  }

  /// Check if initial loading
  bool get isInitialLoading => isLoading && products.isEmpty;

  /// Check if loading more
  bool get isLoadingMore => isLoading && products.isNotEmpty;

  /// Check if has error
  bool get hasError => error != null;

  /// Check if empty
  bool get isEmpty => products.isEmpty && !isLoading && error == null;
}

/// Products notifier using Repository
class ProductsNotifier extends Notifier<ProductsState> {
  late final ProductRepository _repository;
  String? _categoryId;

  @override
  ProductsState build() {
    _repository = ref.watch(productRepositoryProvider);
    return const ProductsState();
  }

  /// Initialize with category
  void init({String? categoryId}) {
    _categoryId = categoryId;
    loadProducts();
  }

  Future<void> loadProducts() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getProducts(
      categoryId: _categoryId,
      page: 1,
      limit: 20,
    );

    result.fold(
      onSuccess: (products) {
        state = state.copyWith(
          products: products,
          isLoading: false,
          page: 1,
          hasMore: products.length >= 20,
        );
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false, error: message);
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    final result = await _repository.getProducts(
      categoryId: _categoryId,
      page: state.page + 1,
      limit: 20,
    );

    result.fold(
      onSuccess: (products) {
        state = state.copyWith(
          products: [...state.products, ...products],
          isLoading: false,
          page: state.page + 1,
          hasMore: products.length >= 20,
        );
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false);
      },
    );
  }

  Future<void> refresh() async {
    state = const ProductsState();
    await loadProducts();
  }
}

/// Provider for products list
final productsProvider = NotifierProvider<ProductsNotifier, ProductsState>(
  ProductsNotifier.new,
);

/// Products by category notifier (using StateNotifier for family support)
class ProductsByCategoryNotifier extends StateNotifier<ProductsState> {
  final ProductRepository _repository;
  final String? _categoryId;

  ProductsByCategoryNotifier(this._repository, this._categoryId)
    : super(const ProductsState()) {
    loadProducts();
  }

  Future<void> loadProducts() async {
    if (state.isLoading) return;

    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getProducts(
      categoryId: _categoryId,
      page: 1,
      limit: 20,
    );

    result.fold(
      onSuccess: (products) {
        state = state.copyWith(
          products: products,
          isLoading: false,
          page: 1,
          hasMore: products.length >= 20,
        );
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false, error: message);
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    final result = await _repository.getProducts(
      categoryId: _categoryId,
      page: state.page + 1,
      limit: 20,
    );

    result.fold(
      onSuccess: (products) {
        state = state.copyWith(
          products: [...state.products, ...products],
          isLoading: false,
          page: state.page + 1,
          hasMore: products.length >= 20,
        );
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false);
      },
    );
  }

  Future<void> refresh() async {
    state = const ProductsState();
    await loadProducts();
  }
}

/// Provider for products by category
final productsByCategoryProvider =
    StateNotifierProvider.family<
      ProductsByCategoryNotifier,
      ProductsState,
      String?
    >((ref, categoryId) {
      final repository = ref.watch(productRepositoryProvider);
      return ProductsByCategoryNotifier(repository, categoryId);
    });

/// Provider for single product
final productProvider = FutureProvider.family<Product?, String>((
  ref,
  productId,
) async {
  final repository = ref.watch(productRepositoryProvider);
  final result = await repository.getProduct(productId);
  return result.dataOrNull;
});

/// Provider for flash deals
final flashDealsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  final result = await repository.getFlashDeals(limit: 20);
  return result.dataOrNull ?? [];
});

/// Provider for trending products
final trendingProductsProvider = FutureProvider<List<Product>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  final result = await repository.getTrendingProducts(limit: 20);
  return result.dataOrNull ?? [];
});

// =====================================================
// CATEGORIES PROVIDERS
// =====================================================

/// Provider for categories list
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final repository = ref.watch(categoryRepositoryProvider);
  final result = await repository.getCategories();
  return result.dataOrNull ?? [];
});

// =====================================================
// STORES PROVIDERS
// =====================================================

/// Provider for featured stores
final featuredStoresProvider = FutureProvider<List<Store>>((ref) async {
  final repository = ref.watch(storeRepositoryProvider);
  final result = await repository.getFeaturedStores(limit: 10);
  return result.dataOrNull ?? [];
});

/// Provider for single store
final storeProvider = FutureProvider.family<Store?, String>((
  ref,
  storeId,
) async {
  final repository = ref.watch(storeRepositoryProvider);
  final result = await repository.getStore(storeId);
  return result.dataOrNull;
});

/// Provider for store products
final storeProductsProvider = FutureProvider.family<List<Product>, String>((
  ref,
  storeId,
) async {
  final repository = ref.watch(storeRepositoryProvider);
  final result = await repository.getStoreProducts(storeId);
  return result.dataOrNull ?? [];
});

// =====================================================
// SEARCH PROVIDERS
// =====================================================

/// Search state
class SearchState {
  final String query;
  final List<Product> results;
  final List<String> suggestions;
  final bool isLoading;
  final String? error;

  const SearchState({
    this.query = '',
    this.results = const [],
    this.suggestions = const [],
    this.isLoading = false,
    this.error,
  });

  SearchState copyWith({
    String? query,
    List<Product>? results,
    List<String>? suggestions,
    bool? isLoading,
    String? error,
  }) {
    return SearchState(
      query: query ?? this.query,
      results: results ?? this.results,
      suggestions: suggestions ?? this.suggestions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  bool get hasResults => results.isNotEmpty;
  bool get isEmpty => results.isEmpty && !isLoading && query.isNotEmpty;
}

/// Search notifier
class SearchNotifier extends Notifier<SearchState> {
  late final ProductRepository _repository;

  @override
  SearchState build() {
    _repository = ref.watch(productRepositoryProvider);
    return const SearchState();
  }

  Future<void> search(String query) async {
    if (query.isEmpty) {
      state = const SearchState();
      return;
    }

    state = state.copyWith(query: query, isLoading: true, error: null);

    final result = await _repository.searchProducts(query: query);

    result.fold(
      onSuccess: (products) {
        state = state.copyWith(results: products, isLoading: false);
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false, error: message);
      },
    );
  }

  Future<void> loadSuggestions(String query) async {
    if (query.length < 2) {
      state = state.copyWith(suggestions: []);
      return;
    }

    final result = await _repository.getSearchSuggestions(query);

    if (result.isSuccess) {
      state = state.copyWith(suggestions: result.data);
    }
  }

  void clear() {
    state = const SearchState();
  }
}

/// Provider for search
final searchProvider = NotifierProvider<SearchNotifier, SearchState>(
  SearchNotifier.new,
);

/// Provider for trending searches
final trendingSearchesProvider = FutureProvider<List<String>>((ref) async {
  final repository = ref.watch(productRepositoryProvider);
  final result = await repository.getTrendingSearches();
  return result.dataOrNull ?? [];
});

// =====================================================
// CART PROVIDERS
// =====================================================

/// Cart state
class CartState {
  final Cart? cart;
  final bool isLoading;
  final String? error;
  final bool isUpdating;

  const CartState({
    this.cart,
    this.isLoading = false,
    this.error,
    this.isUpdating = false,
  });

  CartState copyWith({
    Cart? cart,
    bool? isLoading,
    String? error,
    bool? isUpdating,
  }) {
    return CartState(
      cart: cart ?? this.cart,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isUpdating: isUpdating ?? this.isUpdating,
    );
  }

  int get itemsCount => cart?.totalItems ?? 0;
  double get subtotal => cart?.subtotal ?? 0;
  bool get isEmpty => cart?.isEmpty ?? true;
  bool get isInitialLoading => isLoading && cart == null;
}

/// Cart notifier
class CartNotifier extends Notifier<CartState> {
  late final CartRepository _repository;

  @override
  CartState build() {
    _repository = ref.watch(cartRepositoryProvider);
    return const CartState();
  }

  Future<void> loadCart() async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.getCart();

    result.fold(
      onSuccess: (cart) {
        state = state.copyWith(cart: cart, isLoading: false);
      },
      onFailure: (message, code) {
        state = state.copyWith(isLoading: false, error: message);
      },
    );
  }

  Future<bool> addToCart(String productId, {int quantity = 1}) async {
    state = state.copyWith(isUpdating: true, error: null);

    final result = await _repository.addToCart(
      productId: productId,
      quantity: quantity,
    );

    if (result.isSuccess) {
      await loadCart();
      return true;
    } else {
      state = state.copyWith(isUpdating: false, error: result.errorMessage);
      return false;
    }
  }

  Future<bool> updateQuantity(String itemId, int quantity) async {
    state = state.copyWith(isUpdating: true, error: null);

    final result = await _repository.updateCartItem(
      itemId: itemId,
      quantity: quantity,
    );

    if (result.isSuccess) {
      await loadCart();
      return true;
    } else {
      state = state.copyWith(isUpdating: false, error: result.errorMessage);
      return false;
    }
  }

  Future<bool> removeItem(String itemId) async {
    state = state.copyWith(isUpdating: true, error: null);

    final result = await _repository.removeFromCart(itemId);

    if (result.isSuccess) {
      await loadCart();
      return true;
    } else {
      state = state.copyWith(isUpdating: false, error: result.errorMessage);
      return false;
    }
  }

  Future<bool> clearCart() async {
    state = state.copyWith(isUpdating: true, error: null);

    final result = await _repository.clearCart();

    if (result.isSuccess) {
      state = state.copyWith(cart: null, isUpdating: false);
      return true;
    } else {
      state = state.copyWith(isUpdating: false, error: result.errorMessage);
      return false;
    }
  }

  /// Alias for addToCart for backward compatibility
  Future<bool> addItem(String productId, int quantity) async {
    return addToCart(productId, quantity: quantity);
  }
}

/// Provider for cart
final cartProvider = NotifierProvider<CartNotifier, CartState>(
  CartNotifier.new,
);

/// Provider for cart count (lightweight)
final cartCountProvider = FutureProvider<int>((ref) async {
  final repository = ref.watch(cartRepositoryProvider);
  final result = await repository.getCartCount();
  return result.dataOrNull ?? 0;
});

// =====================================================
// FAVORITES PROVIDERS
// =====================================================

/// Favorites state
class FavoritesState {
  final List<Product> favorites;
  final Set<String> favoriteIds;
  final bool isLoading;
  final String? error;

  const FavoritesState({
    this.favorites = const [],
    this.favoriteIds = const {},
    this.isLoading = false,
    this.error,
  });

  FavoritesState copyWith({
    List<Product>? favorites,
    Set<String>? favoriteIds,
    bool? isLoading,
    String? error,
  }) {
    return FavoritesState(
      favorites: favorites ?? this.favorites,
      favoriteIds: favoriteIds ?? this.favoriteIds,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  bool isFavorite(String productId) => favoriteIds.contains(productId);
}

/// Favorites notifier
class FavoritesNotifier extends Notifier<FavoritesState> {
  late final CustomerApiService _api;

  @override
  FavoritesState build() {
    _api = ref.watch(customerApiProvider);
    return const FavoritesState();
  }

  Future<void> loadFavorites() async {
    state = state.copyWith(isLoading: true, error: null);

    final response = await _api.getFavorites();

    if (response.ok && response.data != null) {
      final ids = response.data!.map((p) => p.id).toSet();
      state = state.copyWith(
        favorites: response.data!,
        favoriteIds: ids,
        isLoading: false,
      );
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
    }
  }

  Future<bool> toggleFavorite(String productId) async {
    final response = await _api.toggleFavorite(productId);

    if (response.ok && response.data != null) {
      final isFavorite = response.data!;
      final newIds = Set<String>.from(state.favoriteIds);

      if (isFavorite) {
        newIds.add(productId);
      } else {
        newIds.remove(productId);
      }

      state = state.copyWith(favoriteIds: newIds);
      await loadFavorites();
      return true;
    }
    return false;
  }

  Future<bool> addToFavorites(String productId) async {
    final response = await _api.addToFavorites(productId);

    if (response.ok) {
      final newIds = Set<String>.from(state.favoriteIds)..add(productId);
      state = state.copyWith(favoriteIds: newIds);
      await loadFavorites();
      return true;
    }
    return false;
  }

  Future<bool> removeFromFavorites(String productId) async {
    final response = await _api.removeFromFavorites(productId);

    if (response.ok) {
      final newIds = Set<String>.from(state.favoriteIds)..remove(productId);
      final newList = state.favorites.where((p) => p.id != productId).toList();
      state = state.copyWith(favoriteIds: newIds, favorites: newList);
      return true;
    }
    return false;
  }

  /// Clear all favorites
  Future<void> clearFavorites() async {
    final ids = List<String>.from(state.favoriteIds);
    for (final id in ids) {
      await removeFromFavorites(id);
    }
    state = const FavoritesState();
  }
}

/// Provider for favorites
final favoritesProvider = NotifierProvider<FavoritesNotifier, FavoritesState>(
  FavoritesNotifier.new,
);

/// Provider for checking if a product is favorite
final isFavoriteProvider = Provider.family<bool, String>((ref, productId) {
  final favoritesState = ref.watch(favoritesProvider);
  return favoritesState.isFavorite(productId);
});

// =====================================================
// ORDERS PROVIDERS
// =====================================================

/// Orders state
class OrdersState {
  final List<Order> orders;
  final bool isLoading;
  final String? error;
  final int page;
  final bool hasMore;
  final String? statusFilter;

  const OrdersState({
    this.orders = const [],
    this.isLoading = false,
    this.error,
    this.page = 1,
    this.hasMore = true,
    this.statusFilter,
  });

  OrdersState copyWith({
    List<Order>? orders,
    bool? isLoading,
    String? error,
    int? page,
    bool? hasMore,
    String? statusFilter,
  }) {
    return OrdersState(
      orders: orders ?? this.orders,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      page: page ?? this.page,
      hasMore: hasMore ?? this.hasMore,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }
}

/// Orders notifier
class OrdersNotifier extends Notifier<OrdersState> {
  late final CustomerApiService _api;

  @override
  OrdersState build() {
    _api = ref.watch(customerApiProvider);
    return const OrdersState();
  }

  Future<void> loadOrders({String? status}) async {
    state = state.copyWith(isLoading: true, error: null, statusFilter: status);

    final response = await _api.getOrders(status: status, page: 1, limit: 20);

    if (response.ok && response.data != null) {
      state = state.copyWith(
        orders: response.data!,
        isLoading: false,
        page: 1,
        hasMore: response.data!.length >= 20,
      );
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);

    final response = await _api.getOrders(
      status: state.statusFilter,
      page: state.page + 1,
      limit: 20,
    );

    if (response.ok && response.data != null) {
      state = state.copyWith(
        orders: [...state.orders, ...response.data!],
        isLoading: false,
        page: state.page + 1,
        hasMore: response.data!.length >= 20,
      );
    } else {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    final response = await _api.cancelOrder(orderId);

    if (response.ok) {
      final updatedOrders = state.orders.map((order) {
        if (order.id == orderId) {
          return order.copyWith(status: OrderStatus.cancelled);
        }
        return order;
      }).toList();

      state = state.copyWith(orders: updatedOrders);
      return true;
    }
    return false;
  }

  Future<void> refresh() async {
    state = OrdersState(statusFilter: state.statusFilter);
    await loadOrders(status: state.statusFilter);
  }
}

/// Provider for orders
final ordersProvider = NotifierProvider<OrdersNotifier, OrdersState>(
  OrdersNotifier.new,
);

/// Provider for single order
final orderProvider = FutureProvider.family<Order?, String>((
  ref,
  orderId,
) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.getOrder(orderId);
  return response.ok ? response.data : null;
});

// =====================================================
// CHECKOUT PROVIDERS
// =====================================================

/// Checkout state
class CheckoutState {
  final bool isValidating;
  final bool isPlacingOrder;
  final bool isLoading;
  final Map<String, dynamic>? validationResult;
  final ShippingAddress? selectedAddress;
  final List<ShippingAddress> addresses;
  final String paymentMethod;
  final String? error;
  final Map<String, dynamic>? orderResult;

  const CheckoutState({
    this.isValidating = false,
    this.isPlacingOrder = false,
    this.isLoading = false,
    this.validationResult,
    this.selectedAddress,
    this.addresses = const [],
    this.paymentMethod = 'cash',
    this.error,
    this.orderResult,
  });

  CheckoutState copyWith({
    bool? isValidating,
    bool? isPlacingOrder,
    bool? isLoading,
    Map<String, dynamic>? validationResult,
    ShippingAddress? selectedAddress,
    List<ShippingAddress>? addresses,
    String? paymentMethod,
    String? error,
    Map<String, dynamic>? orderResult,
  }) {
    return CheckoutState(
      isValidating: isValidating ?? this.isValidating,
      isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
      isLoading: isLoading ?? this.isLoading,
      validationResult: validationResult ?? this.validationResult,
      selectedAddress: selectedAddress ?? this.selectedAddress,
      addresses: addresses ?? this.addresses,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      error: error,
      orderResult: orderResult ?? this.orderResult,
    );
  }

  bool get isValid => validationResult?['is_valid'] ?? false;
  List<dynamic> get validationErrors =>
      validationResult?['validation_errors'] ?? [];
}

/// Checkout notifier
class CheckoutNotifier extends Notifier<CheckoutState> {
  late final CustomerApiService _api;

  @override
  CheckoutState build() {
    _api = ref.watch(customerApiProvider);
    return const CheckoutState();
  }

  Future<void> loadAddresses() async {
    state = state.copyWith(isLoading: true, error: null);

    final response = await _api.getAddresses();

    if (response.ok && response.data != null) {
      state = state.copyWith(addresses: response.data!, isLoading: false);
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
    }
  }

  Future<bool> validateCheckout() async {
    state = state.copyWith(isValidating: true, error: null);

    final response = await _api.validateCheckout();

    if (response.ok && response.data != null) {
      state = state.copyWith(
        isValidating: false,
        validationResult: response.data!,
      );
      return response.data!['is_valid'] ?? false;
    } else {
      state = state.copyWith(isValidating: false, error: response.error);
      return false;
    }
  }

  void setAddress(ShippingAddress address) {
    state = state.copyWith(selectedAddress: address);
  }

  void setPaymentMethod(String method) {
    state = state.copyWith(paymentMethod: method);
  }

  /// إضافة عنوان محلياً (بدون API)
  void addLocalAddress(ShippingAddress address) {
    final updatedAddresses = [...state.addresses, address];
    state = state.copyWith(addresses: updatedAddresses);
  }

  Future<String?> placeOrder({
    required String? addressId,
    required String paymentMethod,
    String? notes,
    String? couponCode,
  }) async {
    final address = state.addresses.firstWhere(
      (a) => a.id == addressId,
      orElse: () => state.addresses.first,
    );

    state = state.copyWith(
      isPlacingOrder: true,
      error: null,
      selectedAddress: address,
      paymentMethod: paymentMethod,
    );

    final response = await _api.createOrder(
      shippingAddress: address,
      paymentMethod: paymentMethod,
      notes: notes,
      couponCode: couponCode,
    );

    if (response.ok && response.data != null) {
      state = state.copyWith(
        isPlacingOrder: false,
        orderResult: response.data!,
      );
      return response.data!['order_number'] as String?;
    } else {
      state = state.copyWith(isPlacingOrder: false, error: response.error);
      return null;
    }
  }

  void reset() {
    state = const CheckoutState();
  }
}

/// Provider for checkout
final checkoutProvider = NotifierProvider<CheckoutNotifier, CheckoutState>(
  CheckoutNotifier.new,
);

/// Provider for saved addresses
final addressesProvider = FutureProvider<List<ShippingAddress>>((ref) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.getAddresses();
  return response.ok ? response.data ?? [] : [];
});

// =====================================================
// HOME DATA PROVIDERS
// =====================================================

/// Provider for home banners
final homeBannersProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.getHomeBanners();
  return response.ok ? response.data ?? [] : [];
});
