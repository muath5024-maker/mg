/// Product Providers
///
/// Riverpod providers for product-related state
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/product_repository.dart';
import 'repository_providers.dart';

/// Featured Products Provider
final featuredProductsProvider = FutureProvider.family<List<Product>, String>((
  ref,
  merchantId,
) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getFeaturedProducts(merchantId: merchantId);
});

/// Products Provider with pagination
final productsProvider = FutureProvider.family<ProductsResult, ProductsParams>((
  ref,
  params,
) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProducts(
    merchantId: params.merchantId,
    categoryId: params.categoryId,
    search: params.search,
    first: params.first,
    after: params.after,
  );
});

/// Single Product Provider
final productProvider = FutureProvider.family<Product, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProduct(id);
});

/// Search Products Provider
final searchProductsProvider =
    FutureProvider.family<List<Product>, SearchParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.searchProducts(
        query: params.query,
        merchantId: params.merchantId,
        categoryId: params.categoryId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        first: params.first,
      );
    });

/// Products Parameters
class ProductsParams {
  final String merchantId;
  final String? categoryId;
  final String? search;
  final int first;
  final String? after;

  ProductsParams({
    required this.merchantId,
    this.categoryId,
    this.search,
    this.first = 20,
    this.after,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductsParams &&
          merchantId == other.merchantId &&
          categoryId == other.categoryId &&
          search == other.search &&
          first == other.first &&
          after == other.after;

  @override
  int get hashCode => Object.hash(merchantId, categoryId, search, first, after);
}

/// Search Parameters
class SearchParams {
  final String query;
  final String? merchantId;
  final String? categoryId;
  final double? minPrice;
  final double? maxPrice;
  final int first;

  SearchParams({
    required this.query,
    this.merchantId,
    this.categoryId,
    this.minPrice,
    this.maxPrice,
    this.first = 20,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SearchParams &&
          query == other.query &&
          merchantId == other.merchantId &&
          categoryId == other.categoryId &&
          minPrice == other.minPrice &&
          maxPrice == other.maxPrice &&
          first == other.first;

  @override
  int get hashCode =>
      Object.hash(query, merchantId, categoryId, minPrice, maxPrice, first);
}
