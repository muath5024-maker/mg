/// Customer API Service - خدمة API للعميل
///
/// Handles all API communication for the customer app
/// with proper error handling, timeouts, and retry logic
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/models.dart';

// =====================================================
// CUSTOM EXCEPTIONS
// =====================================================

/// Base exception for API errors
sealed class ApiException implements Exception {
  final String message;
  final String code;
  final int? statusCode;

  const ApiException(this.message, this.code, [this.statusCode]);

  @override
  String toString() => 'ApiException($code): $message';
}

/// Network connection error
class NetworkException extends ApiException {
  const NetworkException([String message = 'لا يوجد اتصال بالإنترنت'])
    : super(message, 'NETWORK_ERROR');
}

/// Request timeout error
class TimeoutException extends ApiException {
  const TimeoutException([String message = 'انتهت مهلة الطلب'])
    : super(message, 'TIMEOUT_ERROR');
}

/// Server error (5xx)
class ServerException extends ApiException {
  const ServerException([String message = 'خطأ في الخادم', int? statusCode])
    : super(message, 'SERVER_ERROR', statusCode);
}

/// Authentication error (401)
class UnauthorizedException extends ApiException {
  const UnauthorizedException([String message = 'يرجى تسجيل الدخول'])
    : super(message, 'UNAUTHORIZED', 401);
}

/// Forbidden error (403)
class ForbiddenException extends ApiException {
  const ForbiddenException([String message = 'ليس لديك صلاحية'])
    : super(message, 'FORBIDDEN', 403);
}

/// Not found error (404)
class NotFoundException extends ApiException {
  const NotFoundException([String message = 'البيانات غير موجودة'])
    : super(message, 'NOT_FOUND', 404);
}

/// Validation error (400)
class ValidationException extends ApiException {
  final Map<String, dynamic>? errors;

  const ValidationException([String message = 'بيانات غير صحيحة', this.errors])
    : super(message, 'VALIDATION_ERROR', 400);
}

/// JSON parsing error
class ParseException extends ApiException {
  const ParseException([String message = 'خطأ في معالجة البيانات'])
    : super(message, 'PARSE_ERROR');
}

// =====================================================
// API RESPONSE WRAPPER
// =====================================================

/// API Response wrapper with typed data
class ApiResponse<T> {
  final bool ok;
  final T? data;
  final String? error;
  final String? errorCode;
  final String? message;
  final Map<String, dynamic>? pagination;

  const ApiResponse({
    required this.ok,
    this.data,
    this.error,
    this.errorCode,
    this.message,
    this.pagination,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? parser,
  ) {
    return ApiResponse(
      ok: json['ok'] ?? false,
      data: parser != null && json['data'] != null
          ? parser(json['data'])
          : json['data'] as T?,
      error: json['error']?.toString(),
      errorCode: json['error_code']?.toString(),
      message: json['message']?.toString(),
      pagination: json['pagination'] as Map<String, dynamic>?,
    );
  }

  factory ApiResponse.success(T data, {Map<String, dynamic>? pagination}) {
    return ApiResponse(ok: true, data: data, pagination: pagination);
  }

  factory ApiResponse.failure(String errorCode, [String? message]) {
    return ApiResponse(
      ok: false,
      errorCode: errorCode,
      error: message ?? errorCode,
    );
  }

  /// Check if response has more pages
  bool get hasMore => pagination?['has_more'] ?? false;

  /// Get current page
  int get currentPage => pagination?['page'] ?? 1;

  /// Get total pages
  int get totalPages => pagination?['total_pages'] ?? 1;
}

// =====================================================
// APP CONFIGURATION
// =====================================================

/// App environment configuration
class AppConfig {
  final String baseUrl;
  final Duration timeout;
  final int maxRetries;
  final bool enableLogging;

  const AppConfig({
    required this.baseUrl,
    this.timeout = const Duration(seconds: 30),
    this.maxRetries = 3,
    this.enableLogging = false,
  });

  /// Development environment
  static const development = AppConfig(
    baseUrl: 'http://localhost:8787',
    timeout: Duration(seconds: 60),
    maxRetries: 1,
    enableLogging: true,
  );

  /// Staging environment
  static const staging = AppConfig(
    baseUrl: 'https://misty-mode-b68b.baharista1.workers.dev',
    timeout: Duration(seconds: 30),
    maxRetries: 2,
    enableLogging: true,
  );

  /// Production environment
  static const production = AppConfig(
    baseUrl: 'https://misty-mode-b68b.baharista1.workers.dev',
    timeout: Duration(seconds: 30),
    maxRetries: 3,
    enableLogging: false,
  );
}

// =====================================================
// CUSTOMER API SERVICE
// =====================================================

/// Customer API Service with proper error handling
class CustomerApiService {
  final AppConfig config;
  final http.Client _client;
  String? _authToken;
  String? _refreshToken;

  /// Callback when token needs refresh
  Future<String?> Function()? onTokenRefresh;

  /// Callback when authentication fails completely
  void Function()? onAuthFailure;

  CustomerApiService({AppConfig? config, http.Client? client})
    : config = config ?? AppConfig.production,
      _client = client ?? http.Client();

  /// Set authentication tokens
  void setAuthToken(String? token, {String? refreshToken}) {
    _authToken = token;
    _refreshToken = refreshToken;
  }

  /// Clear authentication
  void clearAuth() {
    _authToken = null;
    _refreshToken = null;
  }

  /// Check if authenticated
  bool get isAuthenticated => _authToken != null;

  /// Get default headers
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (_authToken != null) 'Authorization': 'Bearer $_authToken',
  };

  /// Log messages in debug mode
  void _log(String message) {
    if (config.enableLogging) {
      // ignore: avoid_print
      print('[CustomerAPI] $message');
    }
  }

  // =====================================================
  // HTTP METHODS WITH ERROR HANDLING
  // =====================================================

  /// Execute HTTP request with retry logic and error handling
  Future<ApiResponse<T>> _request<T>({
    required String method,
    required String path,
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
    int retryCount = 0,
  }) async {
    // Validate auth requirement
    if (requiresAuth && !isAuthenticated) {
      return ApiResponse.failure('UNAUTHORIZED', 'يرجى تسجيل الدخول أولاً');
    }

    final uri = Uri.parse('${config.baseUrl}$path').replace(
      queryParameters: queryParams?.isNotEmpty == true ? queryParams : null,
    );

    _log('$method $uri');

    try {
      final http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await _client
              .get(uri, headers: _headers)
              .timeout(config.timeout);
          break;
        case 'POST':
          response = await _client
              .post(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(config.timeout);
          break;
        case 'PUT':
          response = await _client
              .put(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(config.timeout);
          break;
        case 'PATCH':
          response = await _client
              .patch(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(config.timeout);
          break;
        case 'DELETE':
          response = await _client
              .delete(uri, headers: _headers)
              .timeout(config.timeout);
          break;
        default:
          throw ArgumentError('Unsupported HTTP method: $method');
      }

      return _handleResponse(response, parser);
    } on SocketException {
      _log('Network error');
      return ApiResponse.failure('NETWORK_ERROR', 'لا يوجد اتصال بالإنترنت');
    } on TimeoutException {
      _log('Timeout error');
      // Retry on timeout
      if (retryCount < config.maxRetries) {
        _log('Retrying... (${retryCount + 1}/${config.maxRetries})');
        return _request(
          method: method,
          path: path,
          queryParams: queryParams,
          body: body,
          parser: parser,
          requiresAuth: requiresAuth,
          retryCount: retryCount + 1,
        );
      }
      return ApiResponse.failure(
        'TIMEOUT_ERROR',
        'انتهت مهلة الطلب، حاول مرة أخرى',
      );
    } on FormatException catch (e) {
      _log('Parse error: $e');
      return ApiResponse.failure('PARSE_ERROR', 'خطأ في معالجة البيانات');
    } catch (e) {
      _log('Unknown error: $e');
      return ApiResponse.failure('UNKNOWN_ERROR', 'حدث خطأ غير متوقع');
    }
  }

  /// Handle HTTP response and parse JSON
  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? parser,
  ) async {
    _log('Response ${response.statusCode}: ${response.body.length} bytes');

    // Handle different status codes
    switch (response.statusCode) {
      case 200:
      case 201:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.fromJson(json, parser);
        } on FormatException {
          return ApiResponse.failure('PARSE_ERROR', 'خطأ في معالجة البيانات');
        }

      case 204:
        return ApiResponse.success(null as T);

      case 400:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.failure(
            'VALIDATION_ERROR',
            json['message']?.toString() ?? 'بيانات غير صحيحة',
          );
        } catch (_) {
          return ApiResponse.failure('VALIDATION_ERROR', 'بيانات غير صحيحة');
        }

      case 401:
        // Try to refresh token
        if (_refreshToken != null && onTokenRefresh != null) {
          final newToken = await onTokenRefresh!();
          if (newToken != null) {
            _authToken = newToken;
            // Retry the request with new token
            // Note: This would need the original request info
          }
        }
        onAuthFailure?.call();
        return ApiResponse.failure('UNAUTHORIZED', 'يرجى تسجيل الدخول');

      case 403:
        return ApiResponse.failure('FORBIDDEN', 'ليس لديك صلاحية للوصول');

      case 404:
        return ApiResponse.failure('NOT_FOUND', 'البيانات غير موجودة');

      case 422:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.failure(
            'VALIDATION_ERROR',
            json['message']?.toString() ?? 'بيانات غير صالحة',
          );
        } catch (_) {
          return ApiResponse.failure('VALIDATION_ERROR', 'بيانات غير صالحة');
        }

      case 429:
        return ApiResponse.failure(
          'RATE_LIMIT',
          'الكثير من الطلبات، حاول لاحقاً',
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return ApiResponse.failure(
          'SERVER_ERROR',
          'خطأ في الخادم، حاول لاحقاً',
        );

      default:
        return ApiResponse.failure(
          'HTTP_ERROR',
          'خطأ غير متوقع (${response.statusCode})',
        );
    }
  }

  // =====================================================
  // PRODUCTS & SEARCH
  // =====================================================

  /// Search products with filters
  ///
  /// [query] - Search query (required, min 2 characters)
  /// [categoryId] - Filter by category
  /// [platformCategoryId] - Filter by platform category
  /// [storeId] - Filter by store
  /// [minPrice] / [maxPrice] - Price range
  /// [sortBy] - Sort order: relevance, price_asc, price_desc, newest
  /// [inStock] - Filter only in-stock items
  /// [includeBoosted] - Include boosted products first (default true)
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
  }) async {
    // Input validation
    if (query.trim().length < 2) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'البحث يجب أن يكون حرفين على الأقل',
      );
    }
    if (minPrice != null && minPrice < 0) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'السعر لا يمكن أن يكون سالباً',
      );
    }
    if (maxPrice != null && minPrice != null && maxPrice < minPrice) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى',
      );
    }

    final queryParams = <String, String>{
      'q': query.trim(),
      'page': page.toString(),
      'limit': limit.clamp(1, 100).toString(),
      'sort_by': sortBy,
      'include_boosted': includeBoosted.toString(),
    };

    if (categoryId != null) queryParams['category_id'] = categoryId;
    if (platformCategoryId != null) {
      queryParams['platform_category_id'] = platformCategoryId;
    }
    if (storeId != null) queryParams['store_id'] = storeId;
    if (minPrice != null) queryParams['min_price'] = minPrice.toString();
    if (maxPrice != null) queryParams['max_price'] = maxPrice.toString();
    if (inStock != null) queryParams['in_stock'] = inStock.toString();

    return _request(
      method: 'GET',
      path: '/api/public/search/products',
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  /// Get public products list
  Future<ApiResponse<List<Product>>> getProducts({
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.clamp(1, 100).toString(),
    };
    if (categoryId != null) queryParams['category_id'] = categoryId;

    return _request(
      method: 'GET',
      path: '/api/public/products',
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  /// Get single product by ID
  Future<ApiResponse<Product>> getProduct(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/public/products/$productId',
      parser: (data) => Product.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Get search suggestions
  Future<ApiResponse<List<String>>> getSearchSuggestions(String query) async {
    if (query.trim().isEmpty) {
      return ApiResponse.success([]);
    }

    return _request(
      method: 'GET',
      path: '/api/public/search/suggestions',
      queryParams: {'q': query.trim()},
      parser: (data) {
        if (data is List) {
          return data.map((e) => (e['text'] ?? e).toString()).toList();
        }
        return <String>[];
      },
    );
  }

  /// Get trending searches
  Future<ApiResponse<List<String>>> getTrendingSearches() async {
    return _request(
      method: 'GET',
      path: '/api/public/search/trending',
      parser: (data) {
        if (data is List) {
          return data.map((e) => (e['query'] ?? e).toString()).toList();
        }
        return <String>[];
      },
    );
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  /// Get all categories
  Future<ApiResponse<List<Category>>> getCategories() async {
    return _request(
      method: 'GET',
      path: '/api/public/categories/all',
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Category.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Category>[];
      },
    );
  }

  /// Get platform categories (with subcategories)
  Future<ApiResponse<List<PlatformCategory>>> getPlatformCategories() async {
    return _request(
      method: 'GET',
      path: '/api/public/platform-categories',
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => PlatformCategory.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <PlatformCategory>[];
      },
    );
  }

  /// Get products by category
  Future<ApiResponse<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  }) async {
    if (categoryId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الفئة مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/public/categories/$categoryId/products',
      queryParams: {
        'page': page.toString(),
        'limit': limit.clamp(1, 100).toString(),
      },
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  // =====================================================
  // STORES
  // =====================================================

  /// Search stores
  Future<ApiResponse<List<Store>>> searchStores({
    required String query,
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    if (query.trim().length < 2) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'البحث يجب أن يكون حرفين على الأقل',
      );
    }

    final queryParams = <String, String>{
      'q': query.trim(),
      'page': page.toString(),
      'limit': limit.clamp(1, 100).toString(),
    };
    if (category != null) queryParams['category'] = category;

    return _request(
      method: 'GET',
      path: '/api/public/search/stores',
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Store.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Store>[];
      },
    );
  }

  /// Get store by ID
  Future<ApiResponse<Store>> getStore(String storeId) async {
    if (storeId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المتجر مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/public/stores/$storeId',
      parser: (data) => Store.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Get store products
  Future<ApiResponse<List<Product>>> getStoreProducts(
    String storeId, {
    int page = 1,
    int limit = 20,
  }) async {
    if (storeId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المتجر مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/public/stores/$storeId/products',
      queryParams: {
        'page': page.toString(),
        'limit': limit.clamp(1, 100).toString(),
      },
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  // =====================================================
  // CART (Requires Auth)
  // =====================================================

  /// Get cart
  Future<ApiResponse<Cart>> getCart() async {
    return _request(
      method: 'GET',
      path: '/api/customer/cart',
      requiresAuth: true,
      parser: (data) => Cart.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Add item to cart
  Future<ApiResponse<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  }) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }
    if (quantity < 1) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'الكمية يجب أن تكون 1 على الأقل',
      );
    }

    return _request(
      method: 'POST',
      path: '/api/customer/cart',
      requiresAuth: true,
      body: {'product_id': productId, 'quantity': quantity},
      parser: (data) => CartItem.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Update cart item quantity
  Future<ApiResponse<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  }) async {
    if (itemId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنصر مطلوب');
    }
    if (quantity < 0) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'الكمية لا يمكن أن تكون سالبة',
      );
    }

    return _request(
      method: 'PUT',
      path: '/api/customer/cart/$itemId',
      requiresAuth: true,
      body: {'quantity': quantity},
      parser: (data) => CartItem.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Remove item from cart
  Future<ApiResponse<void>> removeFromCart(String itemId) async {
    if (itemId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنصر مطلوب');
    }

    return _request(
      method: 'DELETE',
      path: '/api/customer/cart/$itemId',
      requiresAuth: true,
    );
  }

  /// Clear cart
  Future<ApiResponse<void>> clearCart() async {
    return _request(
      method: 'DELETE',
      path: '/api/customer/cart',
      requiresAuth: true,
    );
  }

  /// Get cart items count
  Future<ApiResponse<int>> getCartCount() async {
    return _request(
      method: 'GET',
      path: '/api/customer/cart/count',
      requiresAuth: true,
      parser: (data) => (data as Map<String, dynamic>)['count'] as int? ?? 0,
    );
  }

  // =====================================================
  // FAVORITES (Requires Auth)
  // =====================================================

  /// Get favorites
  Future<ApiResponse<List<Product>>> getFavorites({
    int page = 1,
    int limit = 20,
  }) async {
    return _request(
      method: 'GET',
      path: '/api/customer/favorites',
      requiresAuth: true,
      queryParams: {
        'page': page.toString(),
        'limit': limit.clamp(1, 100).toString(),
      },
      parser: (data) {
        if (data is List) {
          return data.map((e) {
            final product =
                (e as Map<String, dynamic>)['products'] ?? e['product'] ?? e;
            return Product.fromJson(product as Map<String, dynamic>);
          }).toList();
        }
        return <Product>[];
      },
    );
  }

  /// Add to favorites
  Future<ApiResponse<void>> addToFavorites(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _request(
      method: 'POST',
      path: '/api/customer/favorites',
      requiresAuth: true,
      body: {'product_id': productId},
    );
  }

  /// Remove from favorites
  Future<ApiResponse<void>> removeFromFavorites(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _request(
      method: 'DELETE',
      path: '/api/customer/favorites/$productId',
      requiresAuth: true,
    );
  }

  /// Toggle favorite
  Future<ApiResponse<bool>> toggleFavorite(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _request(
      method: 'POST',
      path: '/api/customer/favorites/toggle',
      requiresAuth: true,
      body: {'product_id': productId},
      parser: (data) =>
          (data as Map<String, dynamic>)['is_favorite'] as bool? ?? false,
    );
  }

  /// Check if product is in favorites
  Future<ApiResponse<bool>> checkFavorite(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/customer/favorites/check/$productId',
      requiresAuth: true,
      parser: (data) =>
          (data as Map<String, dynamic>)['is_favorite'] as bool? ?? false,
    );
  }

  /// Get favorites count
  Future<ApiResponse<int>> getFavoritesCount() async {
    return _request(
      method: 'GET',
      path: '/api/customer/favorites/count',
      requiresAuth: true,
      parser: (data) => (data as Map<String, dynamic>)['count'] as int? ?? 0,
    );
  }

  // =====================================================
  // CHECKOUT & ORDERS (Requires Auth)
  // =====================================================

  /// Validate checkout
  Future<ApiResponse<Map<String, dynamic>>> validateCheckout() async {
    return _request(
      method: 'POST',
      path: '/api/customer/checkout/validate',
      requiresAuth: true,
      parser: (data) => data as Map<String, dynamic>,
    );
  }

  /// Create order
  Future<ApiResponse<Map<String, dynamic>>> createOrder({
    required ShippingAddress shippingAddress,
    String paymentMethod = 'cash',
    String? notes,
    String? couponCode,
  }) async {
    return _request(
      method: 'POST',
      path: '/api/customer/checkout',
      requiresAuth: true,
      body: {
        'shipping_address': shippingAddress.toJson(),
        'payment_method': paymentMethod,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (couponCode != null && couponCode.isNotEmpty)
          'coupon_code': couponCode,
      },
      parser: (data) => data as Map<String, dynamic>,
    );
  }

  /// Get orders
  Future<ApiResponse<List<Order>>> getOrders({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.clamp(1, 100).toString(),
    };
    if (status != null) queryParams['status'] = status;

    return _request(
      method: 'GET',
      path: '/api/customer/checkout/orders',
      requiresAuth: true,
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Order.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Order>[];
      },
    );
  }

  /// Get order details
  Future<ApiResponse<Order>> getOrder(String orderId) async {
    if (orderId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الطلب مطلوب');
    }

    return _request(
      method: 'GET',
      path: '/api/customer/checkout/orders/$orderId',
      requiresAuth: true,
      parser: (data) => Order.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Cancel order
  Future<ApiResponse<void>> cancelOrder(String orderId) async {
    if (orderId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الطلب مطلوب');
    }

    return _request(
      method: 'POST',
      path: '/api/customer/checkout/orders/$orderId/cancel',
      requiresAuth: true,
    );
  }

  /// Get saved addresses
  Future<ApiResponse<List<ShippingAddress>>> getAddresses() async {
    return _request(
      method: 'GET',
      path: '/api/customer/addresses',
      requiresAuth: true,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => ShippingAddress.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <ShippingAddress>[];
      },
    );
  }

  /// Save new address
  Future<ApiResponse<ShippingAddress>> saveAddress(
    ShippingAddress address,
  ) async {
    return _request(
      method: 'POST',
      path: '/api/customer/addresses',
      requiresAuth: true,
      body: address.toJson(),
      parser: (data) => ShippingAddress.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Delete address
  Future<ApiResponse<void>> deleteAddress(String addressId) async {
    if (addressId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنوان مطلوب');
    }

    return _request(
      method: 'DELETE',
      path: '/api/customer/addresses/$addressId',
      requiresAuth: true,
    );
  }

  // =====================================================
  // BANNERS & HOME DATA
  // =====================================================

  /// Get home banners
  Future<ApiResponse<List<Map<String, dynamic>>>> getHomeBanners() async {
    return _request(
      method: 'GET',
      path: '/api/public/banners',
      parser: (data) {
        if (data is List) {
          return data.map((e) => e as Map<String, dynamic>).toList();
        }
        return <Map<String, dynamic>>[];
      },
    );
  }

  /// Get featured stores
  Future<ApiResponse<List<Store>>> getFeaturedStores({int limit = 10}) async {
    return _request(
      method: 'GET',
      path: '/api/public/stores/featured',
      queryParams: {'limit': limit.toString()},
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Store.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Store>[];
      },
    );
  }

  /// Get flash deals
  Future<ApiResponse<List<Product>>> getFlashDeals({int limit = 20}) async {
    return _request(
      method: 'GET',
      path: '/api/public/products/flash-deals',
      queryParams: {'limit': limit.toString()},
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  /// Get trending products
  Future<ApiResponse<List<Product>>> getTrendingProducts({
    int limit = 20,
  }) async {
    return _request(
      method: 'GET',
      path: '/api/public/products/trending',
      queryParams: {'limit': limit.toString()},
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Product.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Product>[];
      },
    );
  }

  /// Dispose resources
  void dispose() {
    _client.close();
  }
}
