/// Product Service - خدمة المنتجات
///
/// تتضمن جميع عمليات المنتجات:
/// - جلب قائمة المنتجات
/// - جلب تفاصيل منتج
/// - العروض الخاطفة
/// - المنتجات الرائجة
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Product Service for handling all product-related API calls
class ProductService {
  final BaseApiClient _client;

  ProductService(this._client);

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

    return _client.get(
      '/api/public/products',
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

    return _client.get(
      '/api/public/products/$productId',
      parser: (data) => Product.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Get flash deals
  Future<ApiResponse<List<Product>>> getFlashDeals({int limit = 20}) async {
    return _client.get(
      '/api/public/products/flash-deals',
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
    return _client.get(
      '/api/public/products/trending',
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

  /// Get boosted products
  Future<ApiResponse<List<Product>>> getBoostedProducts({
    int limit = 10,
  }) async {
    return _client.get(
      '/api/public/boosted-products',
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
}
