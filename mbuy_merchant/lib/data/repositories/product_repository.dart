/// Product Repository for Merchant App
///
/// Repository for product CRUD operations
library;

import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';
import '../../core/graphql/mutations.dart';

class ProductRepository {
  final _client = GraphQLConfig.getClientWithoutCache();

  /// Get products with pagination
  Future<ProductsResult> getProducts({
    required String merchantId,
    String? categoryId,
    String? status,
    String? search,
    int first = 20,
    String? after,
  }) async {
    return _client.safeQuery(
      query: ProductQueries.getProducts,
      variables: {
        'merchantId': merchantId,
        if (categoryId != null) 'categoryId': categoryId,
        if (status != null) 'status': status,
        if (search != null) 'search': search,
        'first': first,
        if (after != null) 'after': after,
      },
      parser: (data) => ProductsResult.fromJson(data['merchantProducts']),
    );
  }

  /// Get single product
  Future<Product> getProduct(String id) async {
    return _client.safeQuery(
      query: ProductQueries.getProduct,
      variables: {'id': id},
      parser: (data) => Product.fromJson(data['product']),
    );
  }

  /// Get low stock products
  Future<List<Product>> getLowStockProducts({
    required String merchantId,
    int? threshold,
  }) async {
    return _client.safeQuery(
      query: ProductQueries.getLowStockProducts,
      variables: {
        'merchantId': merchantId,
        if (threshold != null) 'threshold': threshold,
      },
      parser: (data) => (data['lowStockProducts'] as List)
          .map((e) => Product.fromJson(e))
          .toList(),
    );
  }

  /// Create product
  Future<Product> createProduct({
    required String merchantId,
    required String name,
    String? nameAr,
    String? description,
    String? descriptionAr,
    required String sku,
    String? barcode,
    required double price,
    double? compareAtPrice,
    double? costPrice,
    required int stockQuantity,
    int? lowStockThreshold,
    String? categoryId,
    List<String>? images,
    bool isFeatured = false,
    String status = 'draft',
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.createProduct,
      variables: {
        'input': {
          'merchantId': merchantId,
          'name': name,
          if (nameAr != null) 'nameAr': nameAr,
          if (description != null) 'description': description,
          if (descriptionAr != null) 'descriptionAr': descriptionAr,
          'sku': sku,
          if (barcode != null) 'barcode': barcode,
          'price': price,
          if (compareAtPrice != null) 'compareAtPrice': compareAtPrice,
          if (costPrice != null) 'costPrice': costPrice,
          'stockQuantity': stockQuantity,
          if (lowStockThreshold != null) 'lowStockThreshold': lowStockThreshold,
          if (categoryId != null) 'categoryId': categoryId,
          if (images != null) 'images': images,
          'isFeatured': isFeatured,
          'status': status,
        },
      },
      parser: (data) => Product.fromJson(data['createProduct']),
    );
  }

  /// Update product
  Future<Product> updateProduct({
    required String id,
    String? name,
    String? nameAr,
    String? description,
    String? descriptionAr,
    String? sku,
    String? barcode,
    double? price,
    double? compareAtPrice,
    double? costPrice,
    int? stockQuantity,
    int? lowStockThreshold,
    String? categoryId,
    List<String>? images,
    bool? isFeatured,
    String? status,
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.updateProduct,
      variables: {
        'id': id,
        'input': {
          if (name != null) 'name': name,
          if (nameAr != null) 'nameAr': nameAr,
          if (description != null) 'description': description,
          if (descriptionAr != null) 'descriptionAr': descriptionAr,
          if (sku != null) 'sku': sku,
          if (barcode != null) 'barcode': barcode,
          if (price != null) 'price': price,
          if (compareAtPrice != null) 'compareAtPrice': compareAtPrice,
          if (costPrice != null) 'costPrice': costPrice,
          if (stockQuantity != null) 'stockQuantity': stockQuantity,
          if (lowStockThreshold != null) 'lowStockThreshold': lowStockThreshold,
          if (categoryId != null) 'categoryId': categoryId,
          if (images != null) 'images': images,
          if (isFeatured != null) 'isFeatured': isFeatured,
          if (status != null) 'status': status,
        },
      },
      parser: (data) => Product.fromJson(data['updateProduct']),
    );
  }

  /// Delete product
  Future<bool> deleteProduct(String id) async {
    return _client.safeMutate(
      mutation: ProductMutations.deleteProduct,
      variables: {'id': id},
      parser: (data) => data['deleteProduct']['success'] == true,
    );
  }

  /// Bulk update product status
  Future<int> bulkUpdateStatus({
    required List<String> ids,
    required String status,
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.bulkUpdateProductStatus,
      variables: {'ids': ids, 'status': status},
      parser: (data) => data['bulkUpdateProductStatus']['updatedCount'] ?? 0,
    );
  }

  /// Update stock
  Future<int> updateStock({
    required String productId,
    String? variantId,
    required int quantity,
    String? reason,
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.updateStock,
      variables: {
        'productId': productId,
        if (variantId != null) 'variantId': variantId,
        'quantity': quantity,
        if (reason != null) 'reason': reason,
      },
      parser: (data) => data['updateProductStock']['newQuantity'] ?? 0,
    );
  }

  /// Create variant
  Future<ProductVariant> createVariant({
    required String productId,
    required String name,
    required String sku,
    required double price,
    required int stockQuantity,
    Map<String, dynamic>? attributes,
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.createVariant,
      variables: {
        'productId': productId,
        'input': {
          'name': name,
          'sku': sku,
          'price': price,
          'stockQuantity': stockQuantity,
          if (attributes != null) 'attributes': attributes,
        },
      },
      parser: (data) => ProductVariant.fromJson(data['createProductVariant']),
    );
  }

  /// Update variant
  Future<ProductVariant> updateVariant({
    required String id,
    String? name,
    String? sku,
    double? price,
    int? stockQuantity,
    Map<String, dynamic>? attributes,
  }) async {
    return _client.safeMutate(
      mutation: ProductMutations.updateVariant,
      variables: {
        'id': id,
        'input': {
          if (name != null) 'name': name,
          if (sku != null) 'sku': sku,
          if (price != null) 'price': price,
          if (stockQuantity != null) 'stockQuantity': stockQuantity,
          if (attributes != null) 'attributes': attributes,
        },
      },
      parser: (data) => ProductVariant.fromJson(data['updateProductVariant']),
    );
  }

  /// Delete variant
  Future<bool> deleteVariant(String id) async {
    return _client.safeMutate(
      mutation: ProductMutations.deleteVariant,
      variables: {'id': id},
      parser: (data) => data['deleteProductVariant']['success'] == true,
    );
  }
}

/// Products Result with pagination
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

  factory ProductsResult.fromJson(Map<String, dynamic> json) {
    return ProductsResult(
      products:
          (json['edges'] as List?)
              ?.map((e) => Product.fromJson(e['node']))
              .toList() ??
          [],
      hasNextPage: json['pageInfo']?['hasNextPage'] ?? false,
      endCursor: json['pageInfo']?['endCursor'],
      totalCount: json['totalCount'] ?? 0,
    );
  }
}

/// Product Model
class Product {
  final String id;
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
  final String status;
  final bool isFeatured;
  final List<String> images;
  final String? categoryId;
  final Category? category;
  final List<ProductVariant> variants;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Product({
    required this.id,
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
    required this.status,
    this.isFeatured = false,
    required this.images,
    this.categoryId,
    this.category,
    this.variants = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      description: json['description'],
      descriptionAr: json['descriptionAr'],
      sku: json['sku'] ?? '',
      barcode: json['barcode'],
      price: (json['price'] as num?)?.toDouble() ?? 0,
      compareAtPrice: (json['compareAtPrice'] as num?)?.toDouble(),
      costPrice: (json['costPrice'] as num?)?.toDouble(),
      stockQuantity: json['stockQuantity'] ?? 0,
      lowStockThreshold: json['lowStockThreshold'],
      status: json['status'] ?? 'draft',
      isFeatured: json['isFeatured'] ?? false,
      images: List<String>.from(json['images'] ?? []),
      categoryId: json['categoryId'],
      category: json['category'] != null
          ? Category.fromJson(json['category'])
          : null,
      variants:
          (json['variants'] as List?)
              ?.map((e) => ProductVariant.fromJson(e))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  bool get isLowStock =>
      lowStockThreshold != null && stockQuantity <= lowStockThreshold!;

  bool get hasDiscount => compareAtPrice != null && compareAtPrice! > price;

  double get discountPercentage =>
      hasDiscount ? ((compareAtPrice! - price) / compareAtPrice! * 100) : 0;

  double get profit => costPrice != null ? price - costPrice! : 0;

  double get profitMargin =>
      costPrice != null && costPrice! > 0 ? (profit / price * 100) : 0;
}

/// Product Variant Model
class ProductVariant {
  final String id;
  final String name;
  final String sku;
  final double price;
  final int stockQuantity;
  final Map<String, dynamic>? attributes;

  ProductVariant({
    required this.id,
    required this.name,
    required this.sku,
    required this.price,
    required this.stockQuantity,
    this.attributes,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      id: json['id'],
      name: json['name'],
      sku: json['sku'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      stockQuantity: json['stockQuantity'] ?? 0,
      attributes: json['attributes'] != null
          ? Map<String, dynamic>.from(json['attributes'])
          : null,
    );
  }
}

/// Category Model
class Category {
  final String id;
  final String name;
  final String? nameAr;
  final String? description;
  final String? image;
  final String? parentId;
  final int sortOrder;
  final bool isActive;
  final int productCount;
  final List<Category>? children;

  Category({
    required this.id,
    required this.name,
    this.nameAr,
    this.description,
    this.image,
    this.parentId,
    this.sortOrder = 0,
    this.isActive = true,
    this.productCount = 0,
    this.children,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      description: json['description'],
      image: json['image'],
      parentId: json['parentId'],
      sortOrder: json['sortOrder'] ?? 0,
      isActive: json['isActive'] ?? true,
      productCount: json['productCount'] ?? 0,
      children: json['children'] != null
          ? (json['children'] as List).map((e) => Category.fromJson(e)).toList()
          : null,
    );
  }
}
