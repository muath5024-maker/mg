/// Product Providers for Merchant App
///
/// Riverpod providers for product management - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/product_repository.dart';
import 'repository_providers.dart';

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
    status: params.status,
    first: params.first,
    after: params.after,
  );
});

/// Single Product Provider
final productProvider = FutureProvider.family<Product, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.getProduct(id);
});

/// Product Stats Provider - returns low stock products count as stats
final productStatsProvider = FutureProvider.family<int, String>((
  ref,
  merchantId,
) async {
  final repo = ref.watch(productRepositoryProvider);
  final lowStock = await repo.getLowStockProducts(
    merchantId: merchantId,
    threshold: 10,
  );
  return lowStock.length;
});

/// Low Stock Products Provider
final lowStockProductsProvider =
    FutureProvider.family<List<Product>, LowStockParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.getLowStockProducts(
        merchantId: params.merchantId,
        threshold: params.threshold,
      );
    });

/// Products Parameters
class ProductsParams {
  final String merchantId;
  final String? categoryId;
  final String? search;
  final String? status;
  final int first;
  final String? after;

  ProductsParams({
    required this.merchantId,
    this.categoryId,
    this.search,
    this.status,
    this.first = 20,
    this.after,
  });

  ProductsParams copyWith({
    String? merchantId,
    String? categoryId,
    String? search,
    String? status,
    int? first,
    String? after,
  }) {
    return ProductsParams(
      merchantId: merchantId ?? this.merchantId,
      categoryId: categoryId ?? this.categoryId,
      search: search ?? this.search,
      status: status ?? this.status,
      first: first ?? this.first,
      after: after ?? this.after,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProductsParams &&
          merchantId == other.merchantId &&
          categoryId == other.categoryId &&
          search == other.search &&
          status == other.status &&
          first == other.first &&
          after == other.after;

  @override
  int get hashCode =>
      Object.hash(merchantId, categoryId, search, status, first, after);
}

/// Low Stock Parameters
class LowStockParams {
  final String merchantId;
  final int threshold;

  LowStockParams({required this.merchantId, this.threshold = 10});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is LowStockParams &&
          merchantId == other.merchantId &&
          threshold == other.threshold;

  @override
  int get hashCode => Object.hash(merchantId, threshold);
}

/// Create Product Provider
final createProductProvider =
    FutureProvider.family<Product, CreateProductParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.createProduct(
        merchantId: params.merchantId,
        name: params.name,
        nameAr: params.nameAr,
        description: params.description,
        descriptionAr: params.descriptionAr,
        sku: params.sku,
        barcode: params.barcode,
        price: params.price,
        compareAtPrice: params.compareAtPrice,
        costPrice: params.costPrice,
        stockQuantity: params.stockQuantity,
        lowStockThreshold: params.lowStockThreshold,
        categoryId: params.categoryId,
        images: params.images,
        isFeatured: params.isFeatured,
        status: params.status,
      );
    });

class CreateProductParams {
  final String merchantId;
  final String name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final String sku;
  final String? barcode;
  final double price;
  final double? compareAtPrice;
  final double? costPrice;
  final int stockQuantity;
  final int? lowStockThreshold;
  final String? categoryId;
  final List<String>? images;
  final bool isFeatured;
  final String status;

  CreateProductParams({
    required this.merchantId,
    required this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    required this.sku,
    this.barcode,
    required this.price,
    this.compareAtPrice,
    this.costPrice,
    required this.stockQuantity,
    this.lowStockThreshold,
    this.categoryId,
    this.images,
    this.isFeatured = false,
    this.status = 'draft',
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CreateProductParams && sku == other.sku;

  @override
  int get hashCode => sku.hashCode;
}

/// Update Product Provider
final updateProductProvider =
    FutureProvider.family<Product, UpdateProductParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.updateProduct(
        id: params.id,
        name: params.name,
        nameAr: params.nameAr,
        description: params.description,
        descriptionAr: params.descriptionAr,
        sku: params.sku,
        barcode: params.barcode,
        price: params.price,
        compareAtPrice: params.compareAtPrice,
        costPrice: params.costPrice,
        stockQuantity: params.stockQuantity,
        lowStockThreshold: params.lowStockThreshold,
        categoryId: params.categoryId,
        images: params.images,
        isFeatured: params.isFeatured,
        status: params.status,
      );
    });

class UpdateProductParams {
  final String id;
  final String? name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final String? sku;
  final String? barcode;
  final double? price;
  final double? compareAtPrice;
  final double? costPrice;
  final int? stockQuantity;
  final int? lowStockThreshold;
  final String? categoryId;
  final List<String>? images;
  final bool? isFeatured;
  final String? status;

  UpdateProductParams({
    required this.id,
    this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    this.sku,
    this.barcode,
    this.price,
    this.compareAtPrice,
    this.costPrice,
    this.stockQuantity,
    this.lowStockThreshold,
    this.categoryId,
    this.images,
    this.isFeatured,
    this.status,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is UpdateProductParams && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Delete Product Provider
final deleteProductProvider = FutureProvider.family<bool, String>((
  ref,
  productId,
) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.deleteProduct(productId);
});

/// Update Stock Provider
final updateStockProvider = FutureProvider.family<int, UpdateStockParams>((
  ref,
  params,
) async {
  final repo = ref.watch(productRepositoryProvider);
  return repo.updateStock(
    productId: params.productId,
    variantId: params.variantId,
    quantity: params.quantity,
    reason: params.reason,
  );
});

class UpdateStockParams {
  final String productId;
  final String? variantId;
  final int quantity;
  final String? reason;

  UpdateStockParams({
    required this.productId,
    this.variantId,
    required this.quantity,
    this.reason,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UpdateStockParams && productId == other.productId;

  @override
  int get hashCode => productId.hashCode;
}

/// Toggle Featured Provider - using updateProduct
final toggleFeaturedProvider =
    FutureProvider.family<Product, ToggleFeaturedParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.updateProduct(
        id: params.productId,
        isFeatured: params.isFeatured,
      );
    });

class ToggleFeaturedParams {
  final String productId;
  final bool isFeatured;

  ToggleFeaturedParams({required this.productId, required this.isFeatured});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ToggleFeaturedParams && productId == other.productId;

  @override
  int get hashCode => productId.hashCode;
}

/// Bulk Update Status Provider
final bulkUpdateStatusProvider =
    FutureProvider.family<int, BulkUpdateStatusParams>((ref, params) async {
      final repo = ref.watch(productRepositoryProvider);
      return repo.bulkUpdateStatus(
        ids: params.productIds,
        status: params.status,
      );
    });

class BulkUpdateStatusParams {
  final List<String> productIds;
  final String status;

  BulkUpdateStatusParams({required this.productIds, required this.status});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BulkUpdateStatusParams &&
          productIds.length == other.productIds.length;

  @override
  int get hashCode => productIds.hashCode;
}

/// Low Stock Count Provider (for badges)
final lowStockCountProvider = FutureProvider.family<int, String>((
  ref,
  merchantId,
) async {
  final products = await ref.watch(
    lowStockProductsProvider(LowStockParams(merchantId: merchantId)).future,
  );
  return products.length;
});
