/// Order Providers
///
/// Riverpod providers for order-related state - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/order_repository.dart';
import 'repository_providers.dart';

/// Orders Provider
final ordersProvider = FutureProvider.family<OrdersResult, OrdersParams>((
  ref,
  params,
) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrders(
    customerId: params.customerId,
    status: params.status,
    first: params.first,
    after: params.after,
  );
});

/// Single Order Provider
final orderProvider = FutureProvider.family<Order, String>((ref, id) async {
  final repo = ref.watch(orderRepositoryProvider);
  return repo.getOrder(id);
});

/// Order Notifier for creating orders - Riverpod 3.x style
final orderNotifierProvider =
    AsyncNotifierProvider<OrderNotifier, CreateOrderResult?>(OrderNotifier.new);

class OrderNotifier extends AsyncNotifier<CreateOrderResult?> {
  OrderRepository get _repo => ref.watch(orderRepositoryProvider);

  @override
  Future<CreateOrderResult?> build() async => null;

  Future<CreateOrderResult?> createOrder({
    required String customerId,
    required String merchantId,
    required String addressId,
    required String paymentGateway,
    String? couponCode,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    try {
      final result = await _repo.createOrder(
        customerId: customerId,
        merchantId: merchantId,
        addressId: addressId,
        paymentGateway: paymentGateway,
        couponCode: couponCode,
        notes: notes,
      );
      state = AsyncValue.data(result);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  Future<bool> cancelOrder(String orderId, {String? reason}) async {
    try {
      return await _repo.cancelOrder(orderId: orderId, reason: reason);
    } catch (e) {
      return false;
    }
  }

  Future<CreateOrderResult?> reorder(String orderId) async {
    state = const AsyncValue.loading();
    try {
      final result = await _repo.reorder(orderId: orderId);
      state = AsyncValue.data(result);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}

/// Orders Parameters
class OrdersParams {
  final String customerId;
  final String? status;
  final int first;
  final String? after;

  OrdersParams({
    required this.customerId,
    this.status,
    this.first = 20,
    this.after,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrdersParams &&
          customerId == other.customerId &&
          status == other.status &&
          first == other.first &&
          after == other.after;

  @override
  int get hashCode => Object.hash(customerId, status, first, after);
}

/// Payment Notifier - Riverpod 3.x style
final paymentNotifierProvider =
    AsyncNotifierProvider<PaymentNotifier, PaymentInfo?>(PaymentNotifier.new);

class PaymentNotifier extends AsyncNotifier<PaymentInfo?> {
  OrderRepository get _repo => ref.watch(orderRepositoryProvider);

  @override
  Future<PaymentInfo?> build() async => null;

  Future<PaymentInfo?> initiatePayment({
    required String orderId,
    required String paymentMethod,
  }) async {
    state = const AsyncValue.loading();
    try {
      final payment = await _repo.initiatePayment(
        orderId: orderId,
        paymentMethod: paymentMethod,
      );
      state = AsyncValue.data(payment);
      return payment;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return null;
    }
  }

  Future<bool> verifyPayment({
    required String orderId,
    required String transactionId,
  }) async {
    try {
      return await _repo.verifyPayment(
        orderId: orderId,
        transactionId: transactionId,
      );
    } catch (e) {
      return false;
    }
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}
