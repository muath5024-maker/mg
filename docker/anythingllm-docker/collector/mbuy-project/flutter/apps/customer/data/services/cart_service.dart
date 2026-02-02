/// Cart Service - خدمة السلة
///
/// تتضمن جميع عمليات السلة (تتطلب مصادقة):
/// - جلب السلة
/// - إضافة للسلة
/// - تحديث الكمية
/// - حذف من السلة
/// - تفريغ السلة
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Cart Service for handling all cart-related API calls
class CartService {
  final BaseApiClient _client;

  CartService(this._client);

  /// Get cart
  Future<ApiResponse<Cart>> getCart() async {
    return _client.get(
      '/api/customer/cart',
      requiresAuth: true,
      parser: (data) => Cart.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Add item to cart
  Future<ApiResponse<CartItem>> addToCart({
    required String productId,
    int quantity = 1,
  }) async {
    if (productId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف المنتج مطلوب');
    }
    if (quantity < 1) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'الكمية يجب أن تكون 1 على الأقل',
      );
    }

    return _client.post(
      '/api/customer/cart',
      requiresAuth: true,
      body: {'product_id': productId, 'quantity': quantity},
      parser: (data) => CartItem.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Update cart item quantity
  Future<ApiResponse<CartItem>> updateCartItem({
    required String itemId,
    required int quantity,
  }) async {
    if (itemId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنصر مطلوب');
    }
    if (quantity < 0) {
      return ApiResponse.failure(
        'VALIDATION_ERROR',
        'الكمية لا يمكن أن تكون سالبة',
      );
    }

    return _client.put(
      '/api/customer/cart/$itemId',
      requiresAuth: true,
      body: {'quantity': quantity},
      parser: (data) => CartItem.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Remove item from cart
  Future<ApiResponse<void>> removeFromCart(String itemId) async {
    if (itemId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنصر مطلوب');
    }

    return _client.delete('/api/customer/cart/$itemId', requiresAuth: true);
  }

  /// Clear cart
  Future<ApiResponse<void>> clearCart() async {
    return _client.delete('/api/customer/cart', requiresAuth: true);
  }

  /// Get cart items count
  Future<ApiResponse<int>> getCartCount() async {
    return _client.get(
      '/api/customer/cart/count',
      requiresAuth: true,
      parser: (data) => (data as Map<String, dynamic>)['count'] as int? ?? 0,
    );
  }
}
