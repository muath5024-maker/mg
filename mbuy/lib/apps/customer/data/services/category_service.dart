/// Category Service - خدمة التصنيفات
///
/// تتضمن جميع عمليات التصنيفات:
/// - جلب التصنيفات
/// - تصنيفات المنصة
/// - منتجات التصنيف
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Category Service for handling all category-related API calls
class CategoryService {
  final BaseApiClient _client;

  CategoryService(this._client);

  /// Get all categories
  Future<ApiResponse<List<Category>>> getCategories() async {
    return _client.get(
      '/api/public/categories/all',
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
    return _client.get(
      '/api/public/platform-categories',
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

    return _client.get(
      '/api/public/categories/$categoryId/products',
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

  /// Get category by ID
  Future<ApiResponse<Category>> getCategory(String categoryId) async {
    if (categoryId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الفئة مطلوب');
    }

    return _client.get(
      '/api/public/categories/$categoryId',
      parser: (data) => Category.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Get stores by category
  Future<ApiResponse<List<Store>>> getStoresByCategory(
    String categorySlug, {
    int page = 1,
    int limit = 20,
  }) async {
    if (categorySlug.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الفئة مطلوب');
    }

    return _client.get(
      '/api/public/categories/$categorySlug/stores',
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
