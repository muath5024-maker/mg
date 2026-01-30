/// Order Providers for Merchant App
///
/// Riverpod providers for order management - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/order_repository.dart';
import 'repository_providers.dart';

/// Orders Provider with pagination
final ordersProvider = FutureProvider.family<OrdersResult, OrdersParams>((
  ref,
  params,
) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(
    merchantId: params.merchantId,
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
    first: params.first,
    after: params.after,
  );
});

/// Single Order Provider
final orderProvider = FutureProvider.family<Order, String>((ref, id) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrder(id);
});

/// Order Stats Provider
final orderStatsProvider = FutureProvider.family<OrderStats, OrderStatsParams>((
  ref,
  params,
) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrderStats(
    merchantId: params.merchantId,
    startDate: params.startDate,
    endDate: params.endDate,
  );
});

/// Orders Parameters
class OrdersParams {
  final String merchantId;
  final String? status;
  final DateTime? startDate;
  final DateTime? endDate;
  final int first;
  final String? after;

  OrdersParams({
    required this.merchantId,
    this.status,
    this.startDate,
    this.endDate,
    this.first = 20,
    this.after,
  });

  OrdersParams copyWith({
    String? merchantId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
    int? first,
    String? after,
  }) {
    return OrdersParams(
      merchantId: merchantId ?? this.merchantId,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      first: first ?? this.first,
      after: after ?? this.after,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrdersParams &&
          merchantId == other.merchantId &&
          status == other.status &&
          startDate == other.startDate &&
          endDate == other.endDate &&
          first == other.first &&
          after == other.after;

  @override
  int get hashCode =>
      Object.hash(merchantId, status, startDate, endDate, first, after);
}

/// Order Stats Parameters
class OrderStatsParams {
  final String merchantId;
  final DateTime? startDate;
  final DateTime? endDate;

  OrderStatsParams({required this.merchantId, this.startDate, this.endDate});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderStatsParams &&
          merchantId == other.merchantId &&
          startDate == other.startDate &&
          endDate == other.endDate;

  @override
  int get hashCode => Object.hash(merchantId, startDate, endDate);
}

/// Update Order Status Provider
final updateOrderStatusProvider =
    FutureProvider.family<Order, UpdateOrderStatusParams>((ref, params) async {
      final repo = ref.watch(orderRepositoryProvider);
      return repo.updateOrderStatus(
        orderId: params.orderId,
        status: params.status,
        note: params.note,
      );
    });

class UpdateOrderStatusParams {
  final String orderId;
  final String status;
  final String? note;

  UpdateOrderStatusParams({
    required this.orderId,
    required this.status,
    this.note,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UpdateOrderStatusParams && orderId == other.orderId;

  @override
  int get hashCode => orderId.hashCode;
}

/// Assign Delivery Provider
final assignDeliveryProvider =
    FutureProvider.family<bool, AssignDeliveryParams>((ref, params) async {
      final repo = ref.watch(orderRepositoryProvider);
      return repo.assignDelivery(
        orderId: params.orderId,
        driverId: params.driverId,
        estimatedTime: params.estimatedTime,
      );
    });

class AssignDeliveryParams {
  final String orderId;
  final String driverId;
  final String? estimatedTime;

  AssignDeliveryParams({
    required this.orderId,
    required this.driverId,
    this.estimatedTime,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AssignDeliveryParams && orderId == other.orderId;

  @override
  int get hashCode => orderId.hashCode;
}

/// Cancel Order Provider
final cancelOrderProvider =
    FutureProvider.family<CancelOrderResult, CancelOrderParams>((
      ref,
      params,
    ) async {
      final repo = ref.watch(orderRepositoryProvider);
      return repo.cancelOrder(orderId: params.orderId, reason: params.reason);
    });

class CancelOrderParams {
  final String orderId;
  final String reason;

  CancelOrderParams({required this.orderId, required this.reason});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CancelOrderParams && orderId == other.orderId;

  @override
  int get hashCode => orderId.hashCode;
}

/// Refund Order Provider
final refundOrderProvider =
    FutureProvider.family<RefundResult, RefundOrderParams>((ref, params) async {
      final repo = ref.watch(orderRepositoryProvider);
      return repo.refundOrder(
        orderId: params.orderId,
        amount: params.amount,
        reason: params.reason,
      );
    });

class RefundOrderParams {
  final String orderId;
  final double amount;
  final String reason;

  RefundOrderParams({
    required this.orderId,
    required this.amount,
    required this.reason,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RefundOrderParams && orderId == other.orderId;

  @override
  int get hashCode => orderId.hashCode;
}

/// Mark Order Printed Provider
final markOrderPrintedProvider = FutureProvider.family<bool, String>((
  ref,
  orderId,
) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.markOrderPrinted(orderId);
});

/// Pending Orders Count Provider (for badges)
final pendingOrdersCountProvider = FutureProvider.family<int, String>((
  ref,
  merchantId,
) async {
  final result = await ref.watch(
    orderStatsProvider(OrderStatsParams(merchantId: merchantId)).future,
  );
  return result.pendingOrders;
});
