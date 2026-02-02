/// Search Service - خدمة البحث
///
/// تتضمن جميع عمليات البحث:
/// - بحث المنتجات مع الفلاتر
/// - اقتراحات البحث
/// - عمليات البحث الرائجة
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Search Service for handling all search-related API calls
class SearchService {
  final BaseApiClient _client;

  SearchService(this._client);

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

    return _client.get(
      '/api/public/search/products',
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

  /// Get search suggestions
  Future<ApiResponse<List<String>>> getSearchSuggestions(String query) async {
    if (query.trim().isEmpty) {
      return ApiResponse.success([]);
    }

    return _client.get(
      '/api/public/search/suggestions',
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
    return _client.get(
      '/api/public/search/trending',
      parser: (data) {
        if (data is List) {
          return data.map((e) => (e['query'] ?? e).toString()).toList();
        }
        return <String>[];
      },
    );
  }

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

    return _client.get(
      '/api/public/search/stores',
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
}
