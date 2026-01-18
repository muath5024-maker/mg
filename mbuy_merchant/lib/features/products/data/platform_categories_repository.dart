import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../domain/models/platform_category.dart';

/// Platform Categories Repository
/// يتعامل مع API الخاص بفئات المنصة
class PlatformCategoriesRepository {
  final ApiService _apiService;

  PlatformCategoriesRepository(this._apiService);

  /// جلب جميع الفئات (هيكل شجري)
  /// المسار: GET /public/platform-categories
  Future<List<PlatformCategory>> getCategories({
    bool flat = false,
    bool featuredOnly = false,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (flat) queryParams['flat'] = 'true';
      if (featuredOnly) queryParams['featured'] = 'true';

      final response = await _apiService.get(
        '/public/platform-categories',
        queryParams: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true && data['data'] != null) {
          final List categoriesList = data['data'] as List;
          return categoriesList
              .map(
                (json) =>
                    PlatformCategory.fromJson(json as Map<String, dynamic>),
              )
              .toList();
        }
        return [];
      } else {
        throw Exception('فشل جلب الفئات (رمز ${response.statusCode})');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }

  /// جلب الفئات الفرعية لفئة معينة
  /// المسار: GET /public/platform-categories?parent_id={parentId}
  Future<List<PlatformCategory>> getSubcategories(String parentId) async {
    try {
      final response = await _apiService.get(
        '/public/platform-categories',
        queryParams: {'parent_id': parentId, 'flat': 'true'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true && data['data'] != null) {
          final List categoriesList = data['data'] as List;
          return categoriesList
              .map(
                (json) =>
                    PlatformCategory.fromJson(json as Map<String, dynamic>),
              )
              .toList();
        }
        return [];
      } else {
        throw Exception('فشل جلب الفئات الفرعية');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }

  /// جلب فئة محددة مع الفئات الفرعية
  /// المسار: GET /public/platform-categories/:slug
  Future<PlatformCategory?> getCategoryBySlug(String slug) async {
    try {
      final response = await _apiService.get(
        '/public/platform-categories/$slug',
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true && data['data'] != null) {
          return PlatformCategory.fromJson(
            data['data'] as Map<String, dynamic>,
          );
        }
        return null;
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('فشل جلب الفئة');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }

  /// جلب منتجات فئة معينة
  /// المسار: GET /public/platform-categories/:slug/products
  Future<CategoryProductsResponse> getCategoryProducts(
    String slug, {
    int limit = 20,
    int offset = 0,
    String sortBy = 'created_at',
    bool sortDesc = true,
    bool includeSubcategories = true,
  }) async {
    try {
      final response = await _apiService.get(
        '/public/platform-categories/$slug/products',
        queryParams: {
          'limit': limit.toString(),
          'offset': offset.toString(),
          'sort_by': sortBy,
          'desc': sortDesc.toString(),
          'include_sub': includeSubcategories.toString(),
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true) {
          return CategoryProductsResponse.fromJson(data);
        }
        return CategoryProductsResponse.empty();
      } else {
        throw Exception('فشل جلب المنتجات');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }

  /// جلب المنتجات المدعومة
  /// المسار: GET /public/boosted-products
  Future<List<Map<String, dynamic>>> getBoostedProducts({
    String boostType = 'featured',
    int limit = 20,
    String? categoryId,
  }) async {
    try {
      final queryParams = {'type': boostType, 'limit': limit.toString()};
      if (categoryId != null) {
        queryParams['category_id'] = categoryId;
      }

      final response = await _apiService.get(
        '/public/boosted-products',
        queryParams: queryParams,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true && data['data'] != null) {
          return (data['data'] as List<dynamic>)
              .map((e) => e as Map<String, dynamic>)
              .toList();
        }
        return [];
      } else {
        throw Exception('فشل جلب المنتجات المميزة');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }

  /// جلب المتاجر المدعومة
  /// المسار: GET /public/boosted-stores
  Future<List<Map<String, dynamic>>> getBoostedStores({
    String boostType = 'featured',
    int limit = 10,
  }) async {
    try {
      final response = await _apiService.get(
        '/public/boosted-stores',
        queryParams: {'type': boostType, 'limit': limit.toString()},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        if (data['ok'] == true && data['data'] != null) {
          return (data['data'] as List<dynamic>)
              .map((e) => e as Map<String, dynamic>)
              .toList();
        }
        return [];
      } else {
        throw Exception('فشل جلب المتاجر المميزة');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('خطأ في الاتصال بالخادم: $e');
    }
  }
}

/// Response for category products with pagination
class CategoryProductsResponse {
  final List<Map<String, dynamic>> products;
  final int total;
  final int limit;
  final int offset;
  final bool hasMore;

  CategoryProductsResponse({
    required this.products,
    required this.total,
    required this.limit,
    required this.offset,
    required this.hasMore,
  });

  factory CategoryProductsResponse.fromJson(Map<String, dynamic> json) {
    final pagination = json['pagination'] as Map<String, dynamic>? ?? {};
    return CategoryProductsResponse(
      products:
          (json['data'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      total: pagination['total'] as int? ?? 0,
      limit: pagination['limit'] as int? ?? 20,
      offset: pagination['offset'] as int? ?? 0,
      hasMore: pagination['hasMore'] as bool? ?? false,
    );
  }

  factory CategoryProductsResponse.empty() {
    return CategoryProductsResponse(
      products: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    );
  }
}

/// Provider للـ PlatformCategoriesRepository
final platformCategoriesRepositoryProvider =
    Provider<PlatformCategoriesRepository>((ref) {
      final apiService = ref.read(apiServiceProvider);
      return PlatformCategoriesRepository(apiService);
    });

/// Provider لجلب الفئات (cached)
final platformCategoriesProvider = FutureProvider<List<PlatformCategory>>((
  ref,
) async {
  final repository = ref.read(platformCategoriesRepositoryProvider);
  return repository.getCategories();
});

/// Provider لجلب الفئات المميزة فقط
final featuredCategoriesProvider = FutureProvider<List<PlatformCategory>>((
  ref,
) async {
  final repository = ref.read(platformCategoriesRepositoryProvider);
  return repository.getCategories(featuredOnly: true);
});

/// Provider للفئات الفرعية
final subcategoriesProvider =
    FutureProvider.family<List<PlatformCategory>, String>((
      ref,
      parentId,
    ) async {
      final repository = ref.read(platformCategoriesRepositoryProvider);
      return repository.getSubcategories(parentId);
    });

/// Provider لفئة محددة بالـ slug
final categoryBySlugProvider = FutureProvider.family<PlatformCategory?, String>(
  (ref, slug) async {
    final repository = ref.read(platformCategoriesRepositoryProvider);
    return repository.getCategoryBySlug(slug);
  },
);

/// Arguments for category products provider
class CategoryProductsArgs {
  final String slug;
  final int limit;
  final int offset;
  final String sortBy;
  final bool sortDesc;
  final bool includeSubcategories;

  const CategoryProductsArgs({
    required this.slug,
    this.limit = 20,
    this.offset = 0,
    this.sortBy = 'created_at',
    this.sortDesc = true,
    this.includeSubcategories = true,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CategoryProductsArgs &&
          runtimeType == other.runtimeType &&
          slug == other.slug &&
          limit == other.limit &&
          offset == other.offset &&
          sortBy == other.sortBy &&
          sortDesc == other.sortDesc &&
          includeSubcategories == other.includeSubcategories;

  @override
  int get hashCode =>
      slug.hashCode ^
      limit.hashCode ^
      offset.hashCode ^
      sortBy.hashCode ^
      sortDesc.hashCode ^
      includeSubcategories.hashCode;
}

/// Provider لجلب منتجات فئة محددة
final categoryProductsProvider =
    FutureProvider.family<CategoryProductsResponse, CategoryProductsArgs>((
      ref,
      args,
    ) async {
      final repository = ref.read(platformCategoriesRepositoryProvider);
      return repository.getCategoryProducts(
        args.slug,
        limit: args.limit,
        offset: args.offset,
        sortBy: args.sortBy,
        sortDesc: args.sortDesc,
        includeSubcategories: args.includeSubcategories,
      );
    });

/// Arguments for boosted products provider
class BoostedProductsArgs {
  final String boostType;
  final int limit;
  final String? categoryId;

  const BoostedProductsArgs({
    this.boostType = 'featured',
    this.limit = 20,
    this.categoryId,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BoostedProductsArgs &&
          runtimeType == other.runtimeType &&
          boostType == other.boostType &&
          limit == other.limit &&
          categoryId == other.categoryId;

  @override
  int get hashCode => boostType.hashCode ^ limit.hashCode ^ categoryId.hashCode;
}

/// Provider لجلب المنتجات المدعومة (featured, category_top, search_top)
final boostedProductsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, BoostedProductsArgs>((
      ref,
      args,
    ) async {
      final repository = ref.read(platformCategoriesRepositoryProvider);
      return repository.getBoostedProducts(
        boostType: args.boostType,
        limit: args.limit,
        categoryId: args.categoryId,
      );
    });

/// Provider للمنتجات المميزة في الصفحة الرئيسية
final featuredProductsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final repository = ref.read(platformCategoriesRepositoryProvider);
  return repository.getBoostedProducts(boostType: 'featured', limit: 10);
});

/// Provider للمتاجر المميزة
final featuredStoresProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final repository = ref.read(platformCategoriesRepositoryProvider);
  return repository.getBoostedStores(boostType: 'featured', limit: 10);
});

/// Provider لبانرات المتاجر (home_banner)
final homeBannerStoresProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final repository = ref.read(platformCategoriesRepositoryProvider);
  return repository.getBoostedStores(boostType: 'home_banner', limit: 5);
});
