/// Repository Providers for Merchant App
///
/// Riverpod providers for all repositories - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/repositories.dart';

/// Auth Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Merchant Repository Provider
final merchantRepositoryProvider = Provider<MerchantRepository>((ref) {
  return MerchantRepository();
});

/// Product Repository Provider
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository();
});

/// Order Repository Provider
final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository();
});

/// Current Merchant Provider - Riverpod 3.x style
final currentMerchantProvider =
    NotifierProvider<CurrentMerchantNotifier, Merchant?>(
      CurrentMerchantNotifier.new,
    );

class CurrentMerchantNotifier extends Notifier<Merchant?> {
  @override
  Merchant? build() => null;

  void set(Merchant? merchant) {
    state = merchant;
  }

  void clear() {
    state = null;
  }
}

/// Auth State Provider
final authStateProvider = FutureProvider<bool>((ref) async {
  final authRepo = ref.watch(authRepositoryProvider);
  return authRepo.isAuthenticated();
});
