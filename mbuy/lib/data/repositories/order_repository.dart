/// Order Repository - GraphQL Implementation
///
/// Handles all order-related operations
library;

import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';
import '../../core/graphql/mutations.dart';

class OrderRepository {
  final GraphQLClient _client;

  OrderRepository({GraphQLClient? client})
    : _client = client ?? GraphQLConfig.client;

  /// Get customer orders
  Future<OrdersResult> getOrders({
    required String customerId,
    String? status,
    int first = 20,
    String? after,
  }) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(OrderQueries.getOrders),
        variables: {
          'customerId': customerId,
          'status': status,
          'first': first,
          'after': after,
        },
        fetchPolicy: FetchPolicy.networkOnly,
      ),
    );

    final data = result.data!['orders'];
    final edges = data['edges'] as List;

    return OrdersResult(
      orders: edges.map((e) => OrderSummary.fromJson(e['node'])).toList(),
      hasNextPage: data['pageInfo']['hasNextPage'],
      endCursor: data['pageInfo']['endCursor'],
    );
  }

  /// Get single order details
  Future<Order> getOrder(String id) async {
    final result = await _client.safeQuery(
      QueryOptions(
        document: gql(OrderQueries.getOrder),
        variables: {'id': id},
        fetchPolicy: FetchPolicy.networkOnly,
      ),
    );

    return Order.fromJson(result.data!['order']);
  }

  /// Create new order
  Future<CreateOrderResult> createOrder({
    required String customerId,
    required String merchantId,
    required String addressId,
    required String paymentGateway,
    String? couponCode,
    String? notes,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(OrderMutations.createOrder),
        variables: {
          'input': {
            'customerId': customerId,
            'merchantId': merchantId,
            'addressId': addressId,
            'paymentGateway': paymentGateway,
            'couponCode': couponCode,
            'notes': notes,
          },
        },
      ),
    );

    return CreateOrderResult.fromJson(result.data!['createOrder']);
  }

  /// Cancel order
  Future<bool> cancelOrder({required String orderId, String? reason}) async {
    try {
      await _client.safeMutate(
        MutationOptions(
          document: gql(OrderMutations.cancelOrder),
          variables: {'orderId': orderId, 'reason': reason},
        ),
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Reorder (create new order from previous order)
  Future<CreateOrderResult> reorder({required String orderId}) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(OrderMutations.reorder),
        variables: {'orderId': orderId},
      ),
    );

    return CreateOrderResult.fromJson(result.data!['reorder']);
  }

  /// Initiate payment for an order
  Future<PaymentInfo> initiatePayment({
    required String orderId,
    required String paymentMethod,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(PaymentMutations.initiatePayment),
        variables: {
          'input': {'orderId': orderId, 'gateway': paymentMethod},
        },
      ),
    );

    return PaymentInfo.fromJson(result.data!['initiatePayment']);
  }

  /// Verify payment completion
  Future<bool> verifyPayment({
    required String orderId,
    required String transactionId,
  }) async {
    try {
      final result = await _client.safeMutate(
        MutationOptions(
          document: gql(PaymentMutations.verifyPayment),
          variables: {'paymentId': orderId, 'transactionId': transactionId},
        ),
      );

      return result.data!['verifyPayment']['status'] == 'paid';
    } catch (e) {
      return false;
    }
  }
}

/// Orders Result with pagination
class OrdersResult {
  final List<OrderSummary> orders;
  final bool hasNextPage;
  final String? endCursor;

  OrdersResult({
    required this.orders,
    required this.hasNextPage,
    this.endCursor,
  });
}

/// Order Summary (for list view)
class OrderSummary {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final String currency;
  final int itemsCount;
  final DateTime createdAt;
  final OrderMerchant? merchant;

  OrderSummary({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.currency,
    required this.itemsCount,
    required this.createdAt,
    this.merchant,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      paymentStatus: json['paymentStatus'],
      totalAmount: (json['totalAmount'] as num).toDouble(),
      currency: json['currency'] ?? 'SAR',
      itemsCount: json['itemsCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      merchant: json['merchant'] != null
          ? OrderMerchant.fromJson(json['merchant'])
          : null,
    );
  }

  /// Get status display color
  String get statusColor {
    switch (status) {
      case 'pending':
      case 'pending_payment':
        return 'orange';
      case 'processing':
      case 'confirmed':
        return 'blue';
      case 'shipped':
        return 'purple';
      case 'delivered':
      case 'completed':
        return 'green';
      case 'cancelled':
      case 'refunded':
        return 'red';
      default:
        return 'grey';
    }
  }
}

/// Full Order Model
class Order {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double subtotalAmount;
  final double taxAmount;
  final double shippingAmount;
  final double discountAmount;
  final double totalAmount;
  final String currency;
  final String? notes;
  final String? trackingNumber;
  final OrderAddress? shippingAddress;
  final List<OrderItem> items;
  final OrderMerchant? merchant;
  final OrderPayment? payment;
  final DateTime createdAt;
  final DateTime updatedAt;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.subtotalAmount,
    required this.taxAmount,
    required this.shippingAmount,
    required this.discountAmount,
    required this.totalAmount,
    required this.currency,
    this.notes,
    this.trackingNumber,
    this.shippingAddress,
    required this.items,
    this.merchant,
    this.payment,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      paymentStatus: json['paymentStatus'],
      subtotalAmount: (json['subtotalAmount'] as num).toDouble(),
      taxAmount: (json['taxAmount'] as num?)?.toDouble() ?? 0,
      shippingAmount: (json['shippingAmount'] as num?)?.toDouble() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0,
      totalAmount: (json['totalAmount'] as num).toDouble(),
      currency: json['currency'] ?? 'SAR',
      notes: json['notes'],
      trackingNumber: json['trackingNumber'],
      shippingAddress: json['shippingAddress'] != null
          ? OrderAddress.fromJson(json['shippingAddress'])
          : null,
      items:
          (json['items'] as List?)
              ?.map((item) => OrderItem.fromJson(item))
              .toList() ??
          [],
      merchant: json['merchant'] != null
          ? OrderMerchant.fromJson(json['merchant'])
          : null,
      payment: json['payment'] != null
          ? OrderPayment.fromJson(json['payment'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  /// Check if order can be cancelled
  bool get canCancel =>
      ['pending', 'pending_payment', 'processing'].contains(status);

  /// Check if order can be tracked
  bool get canTrack => trackingNumber != null && trackingNumber!.isNotEmpty;
}

/// Order Item Model
class OrderItem {
  final String id;
  final String productId;
  final String productName;
  final String? variantName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? imageUrl;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.variantName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.imageUrl,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      productId: json['productId'],
      productName: json['productName'],
      variantName: json['variantName'],
      quantity: json['quantity'],
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      imageUrl: json['imageUrl'],
    );
  }
}

/// Order Address
class OrderAddress {
  final String street;
  final String city;
  final String? state;
  final String country;
  final String? postalCode;
  final String? phone;

  OrderAddress({
    required this.street,
    required this.city,
    this.state,
    required this.country,
    this.postalCode,
    this.phone,
  });

  factory OrderAddress.fromJson(Map<String, dynamic> json) {
    return OrderAddress(
      street: json['street'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
      postalCode: json['postalCode'],
      phone: json['phone'],
    );
  }

  String get fullAddress =>
      '$street, $city${state != null ? ', $state' : ''}, $country';
}

/// Order Merchant
class OrderMerchant {
  final String id;
  final String businessName;
  final String? logoUrl;
  final String? phone;
  final String? email;

  OrderMerchant({
    required this.id,
    required this.businessName,
    this.logoUrl,
    this.phone,
    this.email,
  });

  factory OrderMerchant.fromJson(Map<String, dynamic> json) {
    return OrderMerchant(
      id: json['id'],
      businessName: json['businessName'],
      logoUrl: json['logoUrl'],
      phone: json['phone'],
      email: json['email'],
    );
  }
}

/// Order Payment
class OrderPayment {
  final String id;
  final String gateway;
  final String status;
  final DateTime? paidAt;

  OrderPayment({
    required this.id,
    required this.gateway,
    required this.status,
    this.paidAt,
  });

  factory OrderPayment.fromJson(Map<String, dynamic> json) {
    return OrderPayment(
      id: json['id'],
      gateway: json['gateway'],
      status: json['status'],
      paidAt: json['paidAt'] != null ? DateTime.parse(json['paidAt']) : null,
    );
  }
}

/// Create Order Result
class CreateOrderResult {
  final String id;
  final String orderNumber;
  final String status;
  final double totalAmount;
  final PaymentInfo? payment;

  CreateOrderResult({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.totalAmount,
    this.payment,
  });

  factory CreateOrderResult.fromJson(Map<String, dynamic> json) {
    return CreateOrderResult(
      id: json['id'],
      orderNumber: json['orderNumber'],
      status: json['status'],
      totalAmount: (json['totalAmount'] as num).toDouble(),
      payment: json['payment'] != null
          ? PaymentInfo.fromJson(json['payment'])
          : null,
    );
  }
}

/// Payment Info
class PaymentInfo {
  final String id;
  final String gateway;
  final String? checkoutUrl;

  PaymentInfo({required this.id, required this.gateway, this.checkoutUrl});

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    return PaymentInfo(
      id: json['id'],
      gateway: json['gateway'],
      checkoutUrl: json['checkoutUrl'],
    );
  }
}
