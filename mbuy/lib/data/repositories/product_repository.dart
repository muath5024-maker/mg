/// Product Repository - GraphQL Implementation
///
/// Handles all product-related data operations
library;

import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';

class ProductRepository {
  final GraphQLClient _client;

  ProductRepository({GraphQLClient? client})
    : _client = client ?? GraphQLConfig.client;

  /// Get paginated products
  Future<ProductsResult> getProducts({
    required String merchantId,
    String? categoryId,
    String? search,
    int first = 20,
    String? after,
  }) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(ProductQueries.getProducts),
        variables: {
          'merchantId': merchantId,
          'categoryId': categoryId,
          'search': search,
          'first': first,
          'after': after,
        },
      ),
    );

    final data = result.data!['products'];
    final edges = data['edges'] as List;

    return ProductsResult(
      products: edges.map((e) => Product.fromJson(e['node'])).toList(),
      hasNextPage: data['pageInfo']['hasNextPage'],
      endCursor: data['pageInfo']['endCursor'],
      totalCount: data['totalCount'],
    );
  }

  /// Get single product by ID
  Future<Product> getProduct(String id) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(ProductQueries.getProduct),
        variables: {'id': id},
      ),
    );

    return Product.fromJson(result.data!['product']);
  }

  /// Get featured products
  Future<List<Product>> getFeaturedProducts({
    required String merchantId,
    int limit = 10,
  }) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(ProductQueries.getFeaturedProducts),
        variables: {'merchantId': merchantId, 'limit': limit},
      ),
    );

    final products = result.data!['featuredProducts'] as List;
    return products.map((p) => Product.fromJson(p)).toList();
  }

  /// Search products
  Future<List<Product>> searchProducts({
    required String query,
    String? merchantId,
    String? categoryId,
    double? minPrice,
    double? maxPrice,
    int first = 20,
  }) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(ProductQueries.searchProducts),
        variables: {
          'query': query,
          'merchantId': merchantId,
          'categoryId': categoryId,
          'minPrice': minPrice,
          'maxPrice': maxPrice,
          'first': first,
        },
      ),
    );

    final products = result.data!['searchProducts'] as List;
    return products.map((p) => Product.fromJson(p)).toList();
  }
}

/// Products Result with pagination info
class ProductsResult {
  final List<Product> products;
  final bool hasNextPage;
  final String? endCursor;
  final int totalCount;

  ProductsResult({
    required this.products,
    required this.hasNextPage,
    this.endCursor,
    required this.totalCount,
  });
}

/// Product Model
class Product {
  final String id;
  final String name;
  final String? nameAr;
  final String? description;
  final String? descriptionAr;
  final double price;
  final double? compareAtPrice;
  final String currency;
  final int stockQuantity;
  final String? sku;
  final List<String> images;
  final String status;
  final bool featured;
  final Category? category;
  final Merchant? merchant;
  final List<ProductVariant> variants;
  final double? avgRating;
  final int? reviewCount;
  final DateTime createdAt;

  Product({
    required this.id,
    required this.name,
    this.nameAr,
    this.description,
    this.descriptionAr,
    required this.price,
    this.compareAtPrice,
    required this.currency,
    required this.stockQuantity,
    this.sku,
    required this.images,
    required this.status,
    required this.featured,
    this.category,
    this.merchant,
    required this.variants,
    this.avgRating,
    this.reviewCount,
    required this.createdAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      description: json['description'],
      descriptionAr: json['descriptionAr'],
      price: (json['price'] as num).toDouble(),
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      currency: json['currency'] ?? 'SAR',
      stockQuantity: json['stockQuantity'] ?? 0,
      sku: json['sku'],
      images: (json['images'] as List?)?.cast<String>() ?? [],
      status: json['status'] ?? 'active',
      featured: json['featured'] ?? false,
      category: json['category'] != null
          ? Category.fromJson(json['category'])
          : null,
      merchant: json['merchant'] != null
          ? Merchant.fromJson(json['merchant'])
          : null,
      variants:
          (json['variants'] as List?)
              ?.map((v) => ProductVariant.fromJson(v))
              .toList() ??
          [],
      avgRating: json['avgRating'] != null
          ? (json['avgRating'] as num).toDouble()
          : null,
      reviewCount: json['reviewCount'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  /// Get display name based on locale
  String getDisplayName(String locale) {
    if (locale == 'ar' && nameAr != null && nameAr!.isNotEmpty) {
      return nameAr!;
    }
    return name;
  }

  /// Check if product has discount
  bool get hasDiscount => compareAtPrice != null && compareAtPrice! > price;

  /// Get discount percentage
  int get discountPercentage {
    if (!hasDiscount) return 0;
    return ((compareAtPrice! - price) / compareAtPrice! * 100).round();
  }

  /// Check if product is in stock
  bool get inStock => stockQuantity > 0;

  /// Get primary image
  String? get primaryImage => images.isNotEmpty ? images.first : null;
}

/// Product Variant Model
class ProductVariant {
  final String id;
  final String name;
  final double price;
  final double? compareAtPrice;
  final int stockQuantity;
  final String? sku;
  final Map<String, dynamic>? attributes;

  ProductVariant({
    required this.id,
    required this.name,
    required this.price,
    this.compareAtPrice,
    required this.stockQuantity,
    this.sku,
    this.attributes,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'],
      name: json['name'],
      price: (json['price'] as num).toDouble(),
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      stockQuantity: json['stockQuantity'] ?? 0,
      sku: json['sku'],
      attributes: json['attributes'],
    );
  }
}

/// Category Model
class Category {
  final String id;
  final String name;
  final String? nameAr;
  final String? parentId;

  Category({required this.id, required this.name, this.nameAr, this.parentId});

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      parentId: json['parentId'],
    );
  }
}

/// Merchant Model (minimal)
class Merchant {
  final String id;
  final String businessName;
  final String? logoUrl;
  final double? rating;

  Merchant({
    required this.id,
    required this.businessName,
    this.logoUrl,
    this.rating,
  });

  factory Merchant.fromJson(Map<String, dynamic> json) {
    return Merchant(
      id: json['id'],
      businessName: json['businessName'],
      logoUrl: json['logoUrl'],
      rating: json['rating'] != null
          ? (json['rating'] as num).toDouble()
          : null,
    );
  }
}
