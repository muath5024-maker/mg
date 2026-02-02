/// Cart Repository - مستودع السلة
///
/// Handles all cart-related data operations
library;

import '../../models/models.dart';
import 'base_repository.dart';

/// Cart Repository Interface
abstract class ICartRepository {
  Future<Result<Cart>> getCart();
  Future<Result<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  });
  Future<Result<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  });
  Future<Result<void>> removeFromCart(String itemId);
  Future<Result<void>> clearCart();
  Future<Result<int>> getCartCount();
}

/// Cart Repository Implementation
class CartRepository extends BaseRepository implements ICartRepository {
  Cart? _cachedCart;

  CartRepository(super.api);

  @override
  Future<Result<Cart>> getCart() async {
    final response = await api.cart.getCart();
    final result = toResult(response);

    if (result.isSuccess) {
      _cachedCart = result.data;
    }

    return result;
  }

  @override
  Future<Result<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  }) async {
    final response = await api.cart.addToCart(
      productId: productId,
      quantity: quantity,
    );

    // Invalidate cache
    _cachedCart = null;

    return toResult(response);
  }

  @override
  Future<Result<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  }) async {
    final response = await api.cart.updateCartItem(
      itemId: itemId,
      quantity: quantity,
    );

    // Invalidate cache
    _cachedCart = null;

    return toResult(response);
  }

  @override
  Future<Result<void>> removeFromCart(String itemId) async {
    final response = await api.cart.removeFromCart(itemId);

    // Invalidate cache
    _cachedCart = null;

    return toNullableResult(response);
  }

  @override
  Future<Result<void>> clearCart() async {
    final response = await api.cart.clearCart();

    // Invalidate cache
    _cachedCart = null;

    return toNullableResult(response);
  }

  @override
  Future<Result<int>> getCartCount() async {
    // Use cached cart if available
    if (_cachedCart != null) {
      return Result.success(_cachedCart!.items.length);
    }

    final response = await api.cart.getCartCount();
    return toResult(response);
  }

  /// Get cached cart (if available)
  Cart? get cachedCart => _cachedCart;

  /// Clear cache
  void clearCache() {
    _cachedCart = null;
  }
}
