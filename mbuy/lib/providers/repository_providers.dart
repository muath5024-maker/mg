/// Repository Providers
///
/// Riverpod providers for all repositories
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/repositories.dart';

// Re-export Customer for convenience
export '../data/repositories/auth_repository.dart' show Customer;

/// Auth Repository Provider
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

/// Product Repository Provider
final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository();
});

/// Cart Repository Provider
final cartRepositoryProvider = Provider<CartRepository>((ref) {
  return CartRepository();
});

/// Order Repository Provider
final orderRepositoryProvider = Provider<OrderRepository>((ref) {
  return OrderRepository();
});

/// Current Customer Provider - Riverpod 3.x style
final currentCustomerProvider =
    NotifierProvider<CurrentCustomerNotifier, Customer?>(
      CurrentCustomerNotifier.new,
    );

class CurrentCustomerNotifier extends Notifier<Customer?> {
  @override
  Customer? build() => null;

  void set(Customer? customer) {
    state = customer;
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
