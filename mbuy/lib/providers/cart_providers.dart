/// Cart Providers
///
/// Riverpod providers for cart and wishlist state
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/cart_repository.dart';
import 'repository_providers.dart';

/// Cart Provider
final cartProvider = FutureProvider.family<Cart, CartParams>((
  ref,
  params,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  return repo.getCart(
    customerId: params.customerId,
    merchantId: params.merchantId,
  );
});

/// Cart Parameters
class CartParams {
  final String customerId;
  final String merchantId;

  CartParams({required this.customerId, required this.merchantId});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CartParams &&
          customerId == other.customerId &&
          merchantId == other.merchantId;

  @override
  int get hashCode => Object.hash(customerId, merchantId);
}

/// Add to Cart Provider - simple mutation provider
final addToCartProvider = FutureProvider.family<Cart, AddToCartParams>((
  ref,
  params,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  return repo.addToCart(
    customerId: params.customerId,
    merchantId: params.merchantId,
    productId: params.productId,
    variantId: params.variantId,
    quantity: params.quantity,
  );
});

class AddToCartParams {
  final String customerId;
  final String merchantId;
  final String productId;
  final String? variantId;
  final int quantity;

  AddToCartParams({
    required this.customerId,
    required this.merchantId,
    required this.productId,
    this.variantId,
    this.quantity = 1,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AddToCartParams &&
          customerId == other.customerId &&
          merchantId == other.merchantId &&
          productId == other.productId &&
          variantId == other.variantId &&
          quantity == other.quantity;

  @override
  int get hashCode =>
      Object.hash(customerId, merchantId, productId, variantId, quantity);
}

/// Update Cart Item Provider
final updateCartItemProvider =
    FutureProvider.family<Cart, UpdateCartItemParams>((ref, params) async {
      final repo = ref.watch(cartRepositoryProvider);
      return repo.updateCartItem(
        itemId: params.itemId,
        quantity: params.quantity,
      );
    });

class UpdateCartItemParams {
  final String itemId;
  final int quantity;

  UpdateCartItemParams({required this.itemId, required this.quantity});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UpdateCartItemParams &&
          itemId == other.itemId &&
          quantity == other.quantity;

  @override
  int get hashCode => Object.hash(itemId, quantity);
}

/// Remove from Cart Provider
final removeFromCartProvider = FutureProvider.family<Cart, String>((
  ref,
  itemId,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  return repo.removeFromCart(itemId: itemId);
});

/// Clear Cart Provider
final clearCartProvider = FutureProvider.family<void, CartParams>((
  ref,
  params,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  await repo.clearCart(
    customerId: params.customerId,
    merchantId: params.merchantId,
  );
});

/// Wishlist Provider
final wishlistProvider = FutureProvider.family<List<WishlistItem>, String>((
  ref,
  customerId,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  return repo.getWishlist(customerId: customerId);
});

/// Add to Wishlist Provider
final addToWishlistProvider = FutureProvider.family<void, WishlistParams>((
  ref,
  params,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  await repo.addToWishlist(
    customerId: params.customerId,
    productId: params.productId,
  );
});

/// Remove from Wishlist Provider
final removeFromWishlistProvider = FutureProvider.family<void, WishlistParams>((
  ref,
  params,
) async {
  final repo = ref.watch(cartRepositoryProvider);
  await repo.removeFromWishlist(
    customerId: params.customerId,
    productId: params.productId,
  );
});

class WishlistParams {
  final String customerId;
  final String productId;

  WishlistParams({required this.customerId, required this.productId});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WishlistParams &&
          customerId == other.customerId &&
          productId == other.productId;

  @override
  int get hashCode => Object.hash(customerId, productId);
}
