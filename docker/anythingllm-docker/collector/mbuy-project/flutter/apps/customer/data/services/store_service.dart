/// Store Service - خدمة المتاجر
///
/// تتضمن جميع عمليات المتاجر:
/// - بحث المتاجر
/// - جلب تفاصيل متجر
/// - منتجات المتجر
/// - المتاجر المميزة
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Store Service for handling all store-related API calls
class StoreService {
  final BaseApiClient _client;

  StoreService(this._client);

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

  /// Get store by ID
  Future<ApiResponse<Store>> getStore(String storeId) async {
    if (storeId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المتجر مطلوب');
    }

    return _client.get(
      '/api/public/stores/$storeId',
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

    return _client.get(
      '/api/public/stores/$storeId/products',
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

  /// Get featured stores
  Future<ApiResponse<List<Store>>> getFeaturedStores({int limit = 10}) async {
    return _client.get(
      '/api/public/stores/featured',
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

  /// Get all stores
  Future<ApiResponse<List<Store>>> getStores({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get(
      '/api/public/stores',
      queryParams: {
        'page': page.toString(),
        'limit': limit.clamp(1, 100).toString(),
      },
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
