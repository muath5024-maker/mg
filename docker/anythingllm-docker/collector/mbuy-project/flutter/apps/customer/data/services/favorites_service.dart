/// Favorites Service - خدمة المفضلة
///
/// تتضمن جميع عمليات المفضلة (تتطلب مصادقة):
/// - جلب المفضلة
/// - إضافة للمفضلة
/// - حذف من المفضلة
/// - تبديل المفضلة
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Favorites Service for handling all favorites-related API calls
class FavoritesService {
  final BaseApiClient _client;

  FavoritesService(this._client);

  /// Get favorites
  Future<ApiResponse<List<Product>>> getFavorites({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get(
      '/api/customer/favorites',
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

    return _client.post(
      '/api/customer/favorites',
      requiresAuth: true,
      body: {'product_id': productId},
    );
  }

  /// Remove from favorites
  Future<ApiResponse<void>> removeFromFavorites(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _client.delete(
      '/api/customer/favorites/$productId',
      requiresAuth: true,
    );
  }

  /// Toggle favorite
  Future<ApiResponse<bool>> toggleFavorite(String productId) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }

    return _client.post(
      '/api/customer/favorites/toggle',
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

    return _client.get(
      '/api/customer/favorites/check/$productId',
      requiresAuth: true,
      parser: (data) =>
          (data as Map<String, dynamic>)['is_favorite'] as bool? ?? false,
    );
  }

  /// Get favorites count
  Future<ApiResponse<int>> getFavoritesCount() async {
    return _client.get(
      '/api/customer/favorites/count',
      requiresAuth: true,
      parser: (data) => (data as Map<String, dynamic>)['count'] as int? ?? 0,
    );
  }
}
