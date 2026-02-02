import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/merchant_repository.dart';

/// Re-export models for easy access
export '../data/repositories/merchant_repository.dart'
    show
        MerchantStoreData,
        MerchantProduct,
        MerchantOrder,
        MerchantUser,
        MerchantDashboardStats;

/// Provider for MerchantRepository
final merchantRepositoryProvider = Provider<MerchantRepository>((ref) {
  return MerchantRepository();
});

/// Provider for merchant store data
final merchantStoreProvider = FutureProvider.autoDispose<MerchantStoreData>((
  ref,
) async {
  final repository = ref.watch(merchantRepositoryProvider);
  return repository.getStore();
});

/// Provider for merchant products
final merchantProductsProvider =
    FutureProvider.autoDispose<List<MerchantProduct>>((ref) async {
      final repository = ref.watch(merchantRepositoryProvider);
      return repository.getProducts();
    });

/// Provider for merchant orders
final merchantOrdersProvider = FutureProvider.autoDispose
    .family<List<MerchantOrder>, String?>((ref, status) async {
      final repository = ref.watch(merchantRepositoryProvider);
      return repository.getOrders(status: status);
    });

/// Provider for dashboard statistics
final merchantDashboardStatsProvider =
    FutureProvider.autoDispose<MerchantDashboardStats>((ref) async {
      final repository = ref.watch(merchantRepositoryProvider);
      return repository.getDashboardStats();
    });

/// Provider for merchant users/employees
final merchantUsersProvider = FutureProvider.autoDispose<List<MerchantUser>>((
  ref,
) async {
  final repository = ref.watch(merchantRepositoryProvider);
  return repository.getUsers();
});
