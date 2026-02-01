/// Cart Repository - GraphQL Implementation
///
/// Handles all cart and wishlist operations
library;

import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';
import '../../core/graphql/mutations.dart';

class CartRepository {
  final GraphQLClient _client;

  CartRepository({GraphQLClient? client})
    : _client = client ?? GraphQLConfig.client;

  /// Get customer's cart
  Future<Cart> getCart({
    required String customerId,
    required String merchantId,
  }) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(CartQueries.getCart),
        variables: {'customerId': customerId, 'merchantId': merchantId},
        fetchPolicy: FetchPolicy.networkOnly,
      ),
    );

    return Cart.fromJson(result.data!['cart']);
  }

  /// Add item to cart
  Future<Cart> addToCart({
    required String customerId,
    required String merchantId,
    required String productId,
    String? variantId,
    required int quantity,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.addToCart),
        variables: {
          'input': {
            'customerId': customerId,
            'merchantId': merchantId,
            'productId': productId,
            'variantId': variantId,
            'quantity': quantity,
          },
        },
      ),
    );

    return Cart.fromJson(result.data!['addToCart']);
  }

  /// Update cart item quantity
  Future<Cart> updateCartItem({
    required String itemId,
    required int quantity,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.updateCartItem),
        variables: {'itemId': itemId, 'quantity': quantity},
      ),
    );

    return Cart.fromJson(result.data!['updateCartItem']);
  }

  /// Remove item from cart
  Future<Cart> removeFromCart({required String itemId}) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.removeFromCart),
        variables: {'itemId': itemId},
      ),
    );

    return Cart.fromJson(result.data!['removeFromCart']);
  }

  /// Clear entire cart
  Future<bool> clearCart({
    required String customerId,
    required String merchantId,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.clearCart),
        variables: {'customerId': customerId, 'merchantId': merchantId},
      ),
    );

    return result.data!['clearCart']['success'] ?? false;
  }

  /// Get wishlist
  Future<List<WishlistItem>> getWishlist({required String customerId}) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(CartQueries.getWishlist),
        variables: {'customerId': customerId},
      ),
    );

    final items = result.data!['wishlist'] as List;
    return items.map((item) => WishlistItem.fromJson(item)).toList();
  }

  /// Add to wishlist
  Future<WishlistItem> addToWishlist({
    required String customerId,
    required String productId,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.addToWishlist),
        variables: {'customerId': customerId, 'productId': productId},
      ),
    );

    return WishlistItem.fromJson(result.data!['addToWishlist']);
  }

  /// Remove from wishlist
  Future<bool> removeFromWishlist({
    required String customerId,
    required String productId,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(CartMutations.removeFromWishlist),
        variables: {'customerId': customerId, 'productId': productId},
      ),
    );

    return result.data!['removeFromWishlist']['success'] ?? false;
  }
}

/// Cart Model
class Cart {
  final String id;
  final String customerId;
  final String merchantId;
  final List<CartItem> items;
  final int totalItems;
  final double subtotal;
  final String currency;

  Cart({
    required this.id,
    required this.customerId,
    required this.merchantId,
    required this.items,
    required this.totalItems,
    required this.subtotal,
    required this.currency,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    return Cart(
      id: json['id'],
      customerId: json['customerId'],
      merchantId: json['merchantId'],
      items:
          (json['items'] as List?)
              ?.map((item) => CartItem.fromJson(item))
              .toList() ??
          [],
      totalItems: json['totalItems'] ?? 0,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'SAR',
    );
  }

  /// Check if cart is empty
  bool get isEmpty => items.isEmpty;

  /// Get total quantity
  int get totalQuantity => items.fold(0, (sum, item) => sum + item.quantity);
}

/// Cart Item Model
class CartItem {
  final String id;
  final String productId;
  final String? variantId;
  final int quantity;
  final double unitPrice;
  final CartItemProduct? product;
  final CartItemVariant? variant;

  CartItem({
    required this.id,
    required this.productId,
    this.variantId,
    required this.quantity,
    required this.unitPrice,
    this.product,
    this.variant,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['id'],
      productId: json['productId'],
      variantId: json['variantId'],
      quantity: json['quantity'],
      unitPrice: (json['unitPrice'] as num).toDouble(),
      product: json['product'] != null
          ? CartItemProduct.fromJson(json['product'])
          : null,
      variant: json['variant'] != null
          ? CartItemVariant.fromJson(json['variant'])
          : null,
    );
  }

  /// Get total price for this item
  double get totalPrice => unitPrice * quantity;

  /// Get display name
  String get displayName {
    if (variant != null && variant!.name.isNotEmpty) {
      return '${product?.name ?? ''} - ${variant!.name}';
    }
    return product?.name ?? '';
  }

  /// Get available stock
  int get availableStock =>
      variant?.stockQuantity ?? product?.stockQuantity ?? 0;
}

/// Cart Item Product (minimal)
class CartItemProduct {
  final String id;
  final String name;
  final String? nameAr;
  final List<String> images;
  final int stockQuantity;

  CartItemProduct({
    required this.id,
    required this.name,
    this.nameAr,
    required this.images,
    required this.stockQuantity,
  });

  factory CartItemProduct.fromJson(Map<String, dynamic> json) {
    return CartItemProduct(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      images: (json['images'] as List?)?.cast<String>() ?? [],
      stockQuantity: json['stockQuantity'] ?? 0,
    );
  }

  String? get primaryImage => images.isNotEmpty ? images.first : null;
}

/// Cart Item Variant (minimal)
class CartItemVariant {
  final String id;
  final String name;
  final int stockQuantity;

  CartItemVariant({
    required this.id,
    required this.name,
    required this.stockQuantity,
  });

  factory CartItemVariant.fromJson(Map<String, dynamic> json) {
    return CartItemVariant(
      id: json['id'],
      name: json['name'],
      stockQuantity: json['stockQuantity'] ?? 0,
    );
  }
}

/// Wishlist Item Model
class WishlistItem {
  final String id;
  final String productId;
  final WishlistProduct? product;
  final DateTime addedAt;

  WishlistItem({
    required this.id,
    required this.productId,
    this.product,
    required this.addedAt,
  });

  factory WishlistItem.fromJson(Map<String, dynamic> json) {
    return WishlistItem(
      id: json['id'],
      productId: json['productId'],
      product: json['product'] != null
          ? WishlistProduct.fromJson(json['product'])
          : null,
      addedAt: DateTime.parse(json['addedAt']),
    );
  }
}

/// Wishlist Product (minimal)
class WishlistProduct {
  final String id;
  final String name;
  final String? nameAr;
  final double price;
  final double? compareAtPrice;
  final List<String> images;
  final int stockQuantity;

  WishlistProduct({
    required this.id,
    required this.name,
    this.nameAr,
    required this.price,
    this.compareAtPrice,
    required this.images,
    required this.stockQuantity,
  });

  factory WishlistProduct.fromJson(Map<String, dynamic> json) {
    return WishlistProduct(
      id: json['id'],
      name: json['name'],
      nameAr: json['nameAr'],
      price: (json['price'] as num).toDouble(),
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      images: (json['images'] as List?)?.cast<String>() ?? [],
      stockQuantity: json['stockQuantity'] ?? 0,
    );
  }

  String? get primaryImage => images.isNotEmpty ? images.first : null;
  bool get inStock => stockQuantity > 0;
}
