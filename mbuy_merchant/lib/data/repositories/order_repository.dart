/// Order Repository for Merchant App
///
/// Repository for order management operations
library;

import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';
import '../../core/graphql/mutations.dart';

class OrderRepository {
  final _client = GraphQLConfig.getClientWithoutCache();

  /// Get orders with pagination
  Future<OrdersResult> getOrders({
    required String merchantId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    int first = 20,
    String? after,
  }) async {
    return _client.safeQuery(
      query: OrderQueries.getOrders,
      variables: {
        'merchantId': merchantId,
        if (status != null) 'status': status,
        if (startDate != null && endDate != null)
          'dateRange': {
            'startDate': startDate.toIso8601String(),
            'endDate': endDate.toIso8601String(),
          },
        'first': first,
        if (after != null) 'after': after,
      },
      parser: (data) => OrdersResult.fromJson(data['merchantOrders']),
    );
  }

  /// Get single order
  Future<Order> getOrder(String id) async {
    return _client.safeQuery(
      query: OrderQueries.getOrder,
      variables: {'id': id},
      parser: (data) => Order.fromJson(data['order']),
    );
  }

  /// Get order statistics
  Future<OrderStats> getOrderStats({
    required String merchantId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    return _client.safeQuery(
      query: OrderQueries.getOrderStats,
      variables: {
        'merchantId': merchantId,
        if (startDate != null && endDate != null)
          'dateRange': {
            'startDate': startDate.toIso8601String(),
            'endDate': endDate.toIso8601String(),
          },
      },
      parser: (data) => OrderStats.fromJson(data['orderStats']),
    );
  }

  /// Update order status
  Future<Order> updateOrderStatus({
    required String orderId,
    required String status,
    String? note,
  }) async {
    return _client.safeMutate(
      mutation: OrderMutations.updateOrderStatus,
      variables: {
        'orderId': orderId,
        'status': status,
        if (note != null) 'note': note,
      },
      parser: (data) => Order.fromJson(data['updateOrderStatus']),
    );
  }

  /// Assign delivery driver
  Future<bool> assignDelivery({
    required String orderId,
    required String driverId,
    String? estimatedTime,
  }) async {
    return _client.safeMutate(
      mutation: OrderMutations.assignDelivery,
      variables: {
        'orderId': orderId,
        'driverId': driverId,
        if (estimatedTime != null) 'estimatedTime': estimatedTime,
      },
      parser: (data) => data['assignDelivery']['success'] == true,
    );
  }

  /// Cancel order
  Future<CancelOrderResult> cancelOrder({
    required String orderId,
    required String reason,
  }) async {
    return _client.safeMutate(
      mutation: OrderMutations.cancelOrder,
      variables: {'orderId': orderId, 'reason': reason},
      parser: (data) => CancelOrderResult.fromJson(data['merchantCancelOrder']),
    );
  }

  /// Refund order
  Future<RefundResult> refundOrder({
    required String orderId,
    required double amount,
    required String reason,
  }) async {
    return _client.safeMutate(
      mutation: OrderMutations.refundOrder,
      variables: {'orderId': orderId, 'amount': amount, 'reason': reason},
      parser: (data) => RefundResult.fromJson(data['refundOrder']),
    );
  }

  /// Mark order as printed
  Future<bool> markOrderPrinted(String orderId) async {
    return _client.safeMutate(
      mutation: OrderMutations.markOrderPrinted,
      variables: {'orderId': orderId},
      parser: (data) => data['markOrderPrinted']['success'] == true,
    );
  }
}

/// Orders Result with pagination
class OrdersResult {
  final List<OrderSummary> orders;
  final bool hasNextPage;
  final String? endCursor;
  final int totalCount;

  OrdersResult({
    required this.orders,
    required this.hasNextPage,
    this.endCursor,
    required this.totalCount,
  });

  factory OrdersResult.fromJson(Map<String, dynamic> json) {
    return OrdersResult(
      orders:
          (json['edges'] as List?)
              ?.map((e) => OrderSummary.fromJson(e['node']))
              .toList() ??
          [],
      hasNextPage: json['pageInfo']?['hasNextPage'] ?? false,
      endCursor: json['pageInfo']?['endCursor'],
      totalCount: json['totalCount'] ?? 0,
    );
  }
}

/// Order Summary Model
class OrderSummary {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double subtotal;
  final double discount;
  final double deliveryFee;
  final double tax;
  final double total;
  final int itemCount;
  final CustomerInfo? customer;
  final AddressInfo? shippingAddress;
  final DeliverySlotInfo? deliverySlot;
  final DateTime createdAt;

  OrderSummary({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.subtotal,
    required this.discount,
    required this.deliveryFee,
    required this.tax,
    required this.total,
    required this.itemCount,
    this.customer,
    this.shippingAddress,
    this.deliverySlot,
    required this.createdAt,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      paymentStatus: json['paymentStatus'] ?? 'pending',
      paymentMethod: json['paymentMethod'] ?? 'cash',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      itemCount: json['itemCount'] ?? 0,
      customer: json['customer'] != null
          ? CustomerInfo.fromJson(json['customer'])
          : null,
      shippingAddress: json['shippingAddress'] != null
          ? AddressInfo.fromJson(json['shippingAddress'])
          : null,
      deliverySlot: json['deliverySlot'] != null
          ? DeliverySlotInfo.fromJson(json['deliverySlot'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

/// Full Order Model
class Order {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double subtotal;
  final double discount;
  final double deliveryFee;
  final double tax;
  final double total;
  final String? notes;
  final CustomerInfo? customer;
  final List<OrderItem> items;
  final AddressInfo? shippingAddress;
  final AddressInfo? billingAddress;
  final DeliverySlotInfo? deliverySlot;
  final List<StatusHistory> statusHistory;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.subtotal,
    required this.discount,
    required this.deliveryFee,
    required this.tax,
    required this.total,
    this.notes,
    this.customer,
    required this.items,
    this.shippingAddress,
    this.billingAddress,
    this.deliverySlot,
    required this.statusHistory,
    required this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      paymentStatus: json['paymentStatus'] ?? 'pending',
      paymentMethod: json['paymentMethod'] ?? 'cash',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      notes: json['notes'],
      customer: json['customer'] != null
          ? CustomerInfo.fromJson(json['customer'])
          : null,
      items:
          (json['items'] as List?)
              ?.map((e) => OrderItem.fromJson(e))
              .toList() ??
          [],
      shippingAddress: json['shippingAddress'] != null
          ? AddressInfo.fromJson(json['shippingAddress'])
          : null,
      billingAddress: json['billingAddress'] != null
          ? AddressInfo.fromJson(json['billingAddress'])
          : null,
      deliverySlot: json['deliverySlot'] != null
          ? DeliverySlotInfo.fromJson(json['deliverySlot'])
          : null,
      statusHistory:
          (json['statusHistory'] as List?)
              ?.map((e) => StatusHistory.fromJson(e))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}

/// Order Item Model
class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String? variantName;
  final String? sku;
  final int quantity;
  final double price;
  final double total;
  final String? image;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.variantName,
    this.sku,
    required this.quantity,
    required this.price,
    required this.total,
    this.image,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      productId: json['productId'],
      productName: json['productName'],
      variantName: json['variantName'],
      sku: json['sku'],
      quantity: json['quantity'] ?? 1,
      price: (json['price'] as num?)?.toDouble() ?? 0,
      total: (json['total'] as num?)?.toDouble() ?? 0,
      image: json['image'],
    );
  }
}

/// Customer Info Model
class CustomerInfo {
  final String id;
  final String name;
  final String? email;
  final String phone;

  CustomerInfo({
    required this.id,
    required this.name,
    this.email,
    required this.phone,
  });

  factory CustomerInfo.fromJson(Map<String, dynamic> json) {
    return CustomerInfo(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'] ?? '',
    );
  }
}

/// Address Info Model
class AddressInfo {
  final String? label;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String? state;
  final String? postalCode;
  final String? phone;
  final double? latitude;
  final double? longitude;

  AddressInfo({
    this.label,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    this.state,
    this.postalCode,
    this.phone,
    this.latitude,
    this.longitude,
  });

  factory AddressInfo.fromJson(Map<String, dynamic> json) {
    return AddressInfo(
      label: json['label'],
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'],
      city: json['city'] ?? '',
      state: json['state'],
      postalCode: json['postalCode'],
      phone: json['phone'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
    );
  }

  String get fullAddress {
    final parts = [addressLine1];
    if (addressLine2 != null) parts.add(addressLine2!);
    parts.add(city);
    if (state != null) parts.add(state!);
    return parts.join(', ');
  }
}

/// Delivery Slot Info Model
class DeliverySlotInfo {
  final String date;
  final String startTime;
  final String endTime;

  DeliverySlotInfo({
    required this.date,
    required this.startTime,
    required this.endTime,
  });

  factory DeliverySlotInfo.fromJson(Map<String, dynamic> json) {
    return DeliverySlotInfo(
      date: json['date'],
      startTime: json['startTime'],
      endTime: json['endTime'],
    );
  }

  String get formatted => '$date ($startTime - $endTime)';
}

/// Status History Model
class StatusHistory {
  final String status;
  final String? note;
  final DateTime createdAt;

  StatusHistory({required this.status, this.note, required this.createdAt});

  factory StatusHistory.fromJson(Map<String, dynamic> json) {
    return StatusHistory(
      status: json['status'],
      note: json['note'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

/// Order Statistics Model
class OrderStats {
  final int totalOrders;
  final int pendingOrders;
  final int processingOrders;
  final int shippedOrders;
  final int deliveredOrders;
  final int cancelledOrders;
  final double averageOrderValue;
  final double totalRevenue;

  OrderStats({
    required this.totalOrders,
    required this.pendingOrders,
    required this.processingOrders,
    required this.shippedOrders,
    required this.deliveredOrders,
    required this.cancelledOrders,
    required this.averageOrderValue,
    required this.totalRevenue,
  });

  factory OrderStats.fromJson(Map<String, dynamic> json) {
    return OrderStats(
      totalOrders: json['totalOrders'] ?? 0,
      pendingOrders: json['pendingOrders'] ?? 0,
      processingOrders: json['processingOrders'] ?? 0,
      shippedOrders: json['shippedOrders'] ?? 0,
      deliveredOrders: json['deliveredOrders'] ?? 0,
      cancelledOrders: json['cancelledOrders'] ?? 0,
      averageOrderValue: (json['averageOrderValue'] as num?)?.toDouble() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
    );
  }
}

/// Cancel Order Result
class CancelOrderResult {
  final bool success;
  final double? refundAmount;
  final String? error;

  CancelOrderResult({required this.success, this.refundAmount, this.error});

  factory CancelOrderResult.fromJson(Map<String, dynamic> json) {
    return CancelOrderResult(
      success: json['success'] == true,
      refundAmount: (json['refundAmount'] as num?)?.toDouble(),
      error: json['error'],
    );
  }
}

/// Refund Result
class RefundResult {
  final bool success;
  final String? refundId;
  final String? error;

  RefundResult({required this.success, this.refundId, this.error});

  factory RefundResult.fromJson(Map<String, dynamic> json) {
    return RefundResult(
      success: json['success'] == true,
      refundId: json['refundId'],
      error: json['error'],
    );
  }
}
