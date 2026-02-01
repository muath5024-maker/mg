/// Store Repository - مستودع المتاجر
///
/// Handles all store-related data operations with caching
library;

import '../../models/models.dart';
import 'base_repository.dart';

/// Store Repository Interface
abstract class IStoreRepository {
  Future<Result<List<Store>>> searchStores({
    required String query,
    String? category,
    int page = 1,
    int limit = 20,
  });

  Future<Result<Store>> getStore(String storeId);

  Future<Result<List<Product>>> getStoreProducts(
    String storeId, {
    int page = 1,
    int limit = 20,
  });

  Future<Result<List<Store>>> getFeaturedStores({int limit = 10});

  void clearCache();
}

/// Store Repository Implementation with caching
class StoreRepository extends BaseRepository implements IStoreRepository {
  // Simple in-memory cache
  final Map<String, _CacheEntry<dynamic>> _cache = {};
  final Duration _cacheDuration;

  StoreRepository(
    super.api, {
    Duration cacheDuration = const Duration(minutes: 5),
  }) : _cacheDuration = cacheDuration;

  /// Get from cache or fetch
  Future<Result<T>> _getCachedOrFetch<T>(
    String key,
    Future<Result<T>> Function() fetcher,
  ) async {
    // Check cache
    final cached = _cache[key];
    if (cached != null && !cached.isExpired) {
      return Result.success(cached.data as T);
    }

    // Fetch from API
    final result = await fetcher();

    // Cache successful results
    if (result.isSuccess) {
      _cache[key] = _CacheEntry(result.data, _cacheDuration);
    }

    return result;
  }

  @override
  Future<Result<List<Store>>> searchStores({
    required String query,
    String? category,
    int page = 1,
    int limit = 20,
  }) async {
    // Don't cache search results
    final response = await api.stores.searchStores(
      query: query,
      category: category,
      page: page,
      limit: limit,
    );
    return toResult(response);
  }

  @override
  Future<Result<Store>> getStore(String storeId) async {
    final cacheKey = 'store_$storeId';
    return _getCachedOrFetch(
      cacheKey,
      () async {
        final response = await api.stores.getStore(storeId);
        return toResult(response);
      },
    );
  }

  @override
  Future<Result<List<Product>>> getStoreProducts(
    String storeId, {
    int page = 1,
    int limit = 20,
  }) async {
    final cacheKey = 'store_products_${storeId}_${page}_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () async {
        final response = await api.stores.getStoreProducts(
          storeId,
          page: page,
          limit: limit,
        );
        return toResult(response);
      },
    );
  }

  @override
  Future<Result<List<Store>>> getFeaturedStores({int limit = 10}) async {
    final cacheKey = 'featured_stores_$limit';
    return _getCachedOrFetch(
      cacheKey,
      () async {
        final response = await api.stores.getFeaturedStores(limit: limit);
        return toResult(response);
      },
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
