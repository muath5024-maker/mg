/// Order Service - خدمة الطلبات
///
/// تتضمن جميع عمليات الطلبات والدفع (تتطلب مصادقة):
/// - التحقق من الدفع
/// - إنشاء طلب
/// - جلب الطلبات
/// - إلغاء طلب
/// - إدارة العناوين
library;

import '../api/api.dart';
import '../../models/models.dart';

/// Order Service for handling all order-related API calls
class OrderService {
  final BaseApiClient _client;

  OrderService(this._client);

  // =====================================================
  // CHECKOUT
  // =====================================================

  /// Validate checkout
  Future<ApiResponse<Map<String, dynamic>>> validateCheckout() async {
    return _client.post(
      '/api/customer/checkout/validate',
      requiresAuth: true,
      parser: (data) => data as Map<String, dynamic>,
    );
  }

  /// Create order
  Future<ApiResponse<Map<String, dynamic>>> createOrder({
    required ShippingAddress shippingAddress,
    String paymentMethod = 'cash',
    String? notes,
    String? couponCode,
  }) async {
    return _client.post(
      '/api/customer/checkout',
      requiresAuth: true,
      body: {
        'shipping_address': shippingAddress.toJson(),
        'payment_method': paymentMethod,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (couponCode != null && couponCode.isNotEmpty)
          'coupon_code': couponCode,
      },
      parser: (data) => data as Map<String, dynamic>,
    );
  }

  // =====================================================
  // ORDERS
  // =====================================================

  /// Get orders
  Future<ApiResponse<List<Order>>> getOrders({
    String? status,
    int page = 1,
    int limit = 20,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.clamp(1, 100).toString(),
    };
    if (status != null) queryParams['status'] = status;

    return _client.get(
      '/api/customer/checkout/orders',
      requiresAuth: true,
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => Order.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <Order>[];
      },
    );
  }

  /// Get order details
  Future<ApiResponse<Order>> getOrder(String orderId) async {
    if (orderId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الطلب مطلوب');
    }

    return _client.get(
      '/api/customer/checkout/orders/$orderId',
      requiresAuth: true,
      parser: (data) => Order.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Cancel order
  Future<ApiResponse<void>> cancelOrder(String orderId) async {
    if (orderId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف الطلب مطلوب');
    }

    return _client.post(
      '/api/customer/checkout/orders/$orderId/cancel',
      requiresAuth: true,
    );
  }

  // =====================================================
  // ADDRESSES
  // =====================================================

  /// Get saved addresses
  Future<ApiResponse<List<ShippingAddress>>> getAddresses() async {
    return _client.get(
      '/api/customer/addresses',
      requiresAuth: true,
      parser: (data) {
        if (data is List) {
          return data
              .map((e) => ShippingAddress.fromJson(e as Map<String, dynamic>))
              .toList();
        }
        return <ShippingAddress>[];
      },
    );
  }

  /// Save new address
  Future<ApiResponse<ShippingAddress>> saveAddress(
    ShippingAddress address,
  ) async {
    return _client.post(
      '/api/customer/addresses',
      requiresAuth: true,
      body: address.toJson(),
      parser: (data) => ShippingAddress.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Update address
  Future<ApiResponse<ShippingAddress>> updateAddress(
    String addressId,
    ShippingAddress address,
  ) async {
    if (addressId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنوان مطلوب');
    }

    return _client.put(
      '/api/customer/addresses/$addressId',
      requiresAuth: true,
      body: address.toJson(),
      parser: (data) => ShippingAddress.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Delete address
  Future<ApiResponse<void>> deleteAddress(String addressId) async {
    if (addressId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنوان مطلوب');
    }

    return _client.delete(
      '/api/customer/addresses/$addressId',
      requiresAuth: true,
    );
  }

  /// Set default address
  Future<ApiResponse<void>> setDefaultAddress(String addressId) async {
    if (addressId.isEmpty) {
      return ApiResponse.failure('VALIDATION_ERROR', 'معرف العنوان مطلوب');
    }

    return _client.put(
      '/api/customer/addresses/$addressId/default',
      requiresAuth: true,
    );
  }
}
