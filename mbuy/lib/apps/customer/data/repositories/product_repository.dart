/// Product Repository - مستودع المنتجات
///
/// Handles all product-related data operations with caching
library;

import '../../models/models.dart';
import '../customer_api_service.dart';
import 'base_repository.dart';

/// Product Repository Interface
abstract class IProductRepository {
  Future<Result<List<Product>>> getProducts({
    String? categoryId,
    int page = 1,
    int limit = 20,
  });

  Future<Result<Product>> getProduct(String productId);

  Future<Result<List<Product>>> searchProducts({
    required String query,
    String? categoryId,
    String? storeId,
    double? minPrice,
    double? maxPrice,
    String sortBy = 'relevance',
    bool? inStock,
    int page = 1,
    int limit = 20,
  });

  Future<Result<List<String>>> getSearchSuggestions(String query);

  Future<Result<List<String>>> getTrendingSearches();

  Future<Result<List<Product>>> getFlashDeals({int limit = 20});

  Future<Result<List<Product>>> getTrendingProducts({int limit = 20});

  Future<Result<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  });

  void clearCache();
}

/// Product Repository Implementation with caching
class ProductRepository extends BaseRepository implements IProductRepository {
  // Simple in-memory cache
  final Map<String, _CacheEntry<dynamic>> _cache = {};
  final Duration _cacheDuration;

  ProductRepository(
    super.api, {
    Duration cacheDuration = const Duration(minutes: 5),
  }) : _cacheDuration = cacheDuration;

  /// Get from cache or fetch
  Future<Result<T>> _getCachedOrFetch<T>(
    String key,
    Future<ApiResponse<T>> Function() fetcher,
  ) async {
    // Check cache
    final cached = _cache[key];
    if (cached != null && !cached.isExpired) {
      return Result.success(cached.data as T);
    }

    // Fetch from API
    final response = await fetcher();
    final result = toResult(response);

    // Cache successful results
    if (result.isSuccess) {
      _cache[key] = _CacheEntry(result.data, _cacheDuration);
    }

    return result;
  }

  @override
  Future<Result<List<Product>>> getProducts({
    String? categoryId,
    int page = 1,
    int limit = 20,
  }) async {
    final cacheKey = 'products_${categoryId ?? 'all'}_${page}_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () => api.products.getProducts(categoryId: categoryId, page: page, limit: limit),
    );
  }

  @override
  Future<Result<Product>> getProduct(String productId) async {
    final cacheKey = 'product_$productId';
    return _getCachedOrFetch(
      cacheKey,
      () => api.products.getProduct(productId),
    );
  }

  @override
  Future<Result<List<Product>>> searchProducts({
    required String query,
    String? categoryId,
    String? storeId,
    double? minPrice,
    double? maxPrice,
    String sortBy = 'relevance',
    bool? inStock,
    int page = 1,
    int limit = 20,
  }) async {
    // Don't cache search results
    final response = await api.search.searchProducts(
      query: query,
      categoryId: categoryId,
      storeId: storeId,
      minPrice: minPrice,
      maxPrice: maxPrice,
      sortBy: sortBy,
      inStock: inStock,
      page: page,
      limit: limit,
    );
    return toResult(response);
  }

  @override
  Future<Result<List<String>>> getSearchSuggestions(String query) async {
    final response = await api.search.getSearchSuggestions(query);
    return toResult(response);
  }

  @override
  Future<Result<List<String>>> getTrendingSearches() async {
    final cacheKey = 'trending_searches';
    return _getCachedOrFetch(
      cacheKey,
      () => api.search.getTrendingSearches(),
    );
  }

  @override
  Future<Result<List<Product>>> getFlashDeals({int limit = 20}) async {
    final cacheKey = 'flash_deals_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () => api.products.getFlashDeals(limit: limit),
    );
  }

  @override
  Future<Result<List<Product>>> getTrendingProducts({int limit = 20}) async {
    final cacheKey = 'trending_products_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () => api.products.getTrendingProducts(limit: limit),
    );
  }

  @override
  Future<Result<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  }) async {
    final cacheKey = 'category_products_${categoryId}_${page}_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () => api.categories.getProductsByCategory(categoryId, page: page, limit: limit),
    );
  }

  @override
  void clearCache() {
    _cache.clear();
  }
}

/// Cache entry with expiration
class _CacheEntry<T> {
  final T data;
  final DateTime expiresAt;

  _CacheEntry(this.data, Duration duration)
      : expiresAt = DateTime.now().add(duration);

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
