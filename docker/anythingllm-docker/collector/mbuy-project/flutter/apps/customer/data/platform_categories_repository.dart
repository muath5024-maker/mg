/// Platform Categories Repository
///
/// Handles platform category data operations with caching
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/platform_category.dart';
import '../models/product.dart';
import 'customer_api_service.dart';
import 'customer_providers.dart';

/// Platform Categories Repository
class PlatformCategoriesRepository {
  final CustomerApiService _api;

  List<PlatformCategory>? _cachedCategories;
  DateTime? _cacheTime;
  final Duration _cacheDuration;

  PlatformCategoriesRepository(
    this._api, {
    Duration cacheDuration = const Duration(minutes: 10),
  }) : _cacheDuration = cacheDuration;

  bool get _isCacheValid =>
      _cachedCategories != null &&
      _cacheTime != null &&
      DateTime.now().difference(_cacheTime!) < _cacheDuration;

  /// Get all platform categories
  Future<List<PlatformCategory>> getCategories() async {
    // Return cached data if valid
    if (_isCacheValid) {
      return _cachedCategories!;
    }

    // Fetch from API
    final response = await _api.categories.getPlatformCategories();

    if (response.ok && response.data != null) {
      _cachedCategories = response.data!;
      _cacheTime = DateTime.now();
      return _cachedCategories!;
    }

    throw Exception(response.error ?? 'فشل في تحميل الفئات');
  }

  /// Get category by slug
  Future<PlatformCategory?> getCategoryBySlug(String slug) async {
    final categories = await getCategories();
    return _findCategoryBySlug(categories, slug);
  }

  PlatformCategory? _findCategoryBySlug(
    List<PlatformCategory> categories,
    String slug,
  ) {
    for (final category in categories) {
      if (category.slug == slug) return category;
      if (category.children.isNotEmpty) {
        final found = _findCategoryBySlug(category.children, slug);
        if (found != null) return found;
      }
    }
    return null;
  }

  /// Get products by category slug
  Future<CategoryProductsResponse> getProductsByCategory(
    String categorySlug, {
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _api.search.searchProducts(
      query: '',
      platformCategoryId: categorySlug,
      page: page,
      limit: limit,
    );

    if (response.ok) {
      return CategoryProductsResponse(
        products: response.data ?? [],
        hasMore: response.hasMore,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
      );
    }

    throw Exception(response.error ?? 'فشل في تحميل المنتجات');
  }

  /// Clear cache
  void clearCache() {
    _cachedCategories = null;
    _cacheTime = null;
  }
}

/// Response for category products
class CategoryProductsResponse {
  final List<Product> products;
  final bool hasMore;
  final int currentPage;
  final int totalPages;
  final int total;

  CategoryProductsResponse({
    required this.products,
    this.hasMore = false,
    this.currentPage = 1,
    this.totalPages = 1,
    this.total = 0,
  });
}

/// Arguments for category products screen
class CategoryProductsArgs {
  final String categorySlug;
  final String? categoryName;
  final int limit;
  final int offset;
  final String sortBy;
  final bool sortDesc;
  final bool includeSubcategories;

  CategoryProductsArgs({
    required this.categorySlug,
    this.categoryName,
    this.limit = 20,
    this.offset = 0,
    this.sortBy = 'created_at',
    this.sortDesc = true,
    this.includeSubcategories = true,
  });

  // Override == and hashCode for proper caching in Riverpod
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CategoryProductsArgs &&
          runtimeType == other.runtimeType &&
          categorySlug == other.categorySlug &&
          limit == other.limit &&
          offset == other.offset &&
          sortBy == other.sortBy &&
          sortDesc == other.sortDesc &&
          includeSubcategories == other.includeSubcategories;

  @override
  int get hashCode =>
      categorySlug.hashCode ^
      limit.hashCode ^
      offset.hashCode ^
      sortBy.hashCode ^
      sortDesc.hashCode ^
      includeSubcategories.hashCode;
}

// =====================================================
// RIVERPOD PROVIDERS
// =====================================================

/// Platform Categories Repository Provider
final platformCategoriesRepositoryProvider =
    Provider<PlatformCategoriesRepository>((ref) {
      final api = ref.watch(customerApiProvider);
      return PlatformCategoriesRepository(api);
    });

/// Platform Categories Provider
final platformCategoriesProvider = FutureProvider<List<PlatformCategory>>((
  ref,
) async {
  final repository = ref.watch(platformCategoriesRepositoryProvider);
  return repository.getCategories();
});

/// Category by slug provider
final categoryBySlugProvider = FutureProvider.family<PlatformCategory?, String>(
  (ref, slug) async {
    final repository = ref.watch(platformCategoriesRepositoryProvider);
    return repository.getCategoryBySlug(slug);
  },
);

/// Category products provider
final categoryProductsProvider =
    FutureProvider.family<CategoryProductsResponse, CategoryProductsArgs>((
      ref,
      args,
    ) async {
      final repository = ref.watch(platformCategoriesRepositoryProvider);
      return repository.getProductsByCategory(args.categorySlug);
    });

/// Featured stores provider (from API)
final featuredStoresProvider = FutureProvider((ref) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.stores.getFeaturedStores();
  if (response.ok) {
    return response.data ?? [];
  }
  throw Exception(response.error ?? 'فشل في تحميل المتاجر المميزة');
});

/// Home banner stores provider
final homeBannerStoresProvider = FutureProvider((ref) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.stores.getFeaturedStores(limit: 5);
  if (response.ok) {
    return response.data ?? [];
  }
  return [];
});

/// Featured products provider
final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final api = ref.watch(customerApiProvider);
  final response = await api.products.getTrendingProducts(limit: 10);
  if (response.ok) {
    return response.data ?? [];
  }
  throw Exception(response.error ?? 'فشل في تحميل المنتجات المميزة');
});
