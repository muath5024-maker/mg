/// Auth Providers for Merchant App
///
/// Riverpod providers for authentication state - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/merchant_repository.dart';
import 'repository_providers.dart';

/// Auth Notifier for authentication operations - Riverpod 3.x style
final authNotifierProvider = NotifierProvider<AuthNotifier, MerchantAuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends Notifier<MerchantAuthState> {
  AuthRepository get _repo => ref.watch(authRepositoryProvider);

  @override
  MerchantAuthState build() {
    _checkAuth();
    return MerchantAuthState.initial();
  }

  Future<void> _checkAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final isAuth = await _repo.isAuthenticated();
      if (isAuth) {
        state = state.copyWith(isLoading: false, isAuthenticated: true);
      } else {
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: e.toString(),
      );
    }
  }

  Future<bool> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.login(email: email, password: password);
      if (result.success && result.merchant != null) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          merchant: result.merchant,
        );
        ref.read(currentMerchantProvider.notifier).set(result.merchant);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: result.error ?? 'Login failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _repo.logout();
    } catch (e) {
      // Ignore logout errors
    }
    state = MerchantAuthState.initial().copyWith(isLoading: false);
    ref.read(currentMerchantProvider.notifier).clear();
  }

  Future<bool> updatePassword({
    required String merchantId,
    required String currentPassword,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await _repo.updatePassword(
        merchantId: merchantId,
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      state = state.copyWith(isLoading: false);
      return success;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Merchant Auth State
class MerchantAuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Merchant? merchant;
  final String? error;

  MerchantAuthState({
    required this.isLoading,
    required this.isAuthenticated,
    this.merchant,
    this.error,
  });

  factory MerchantAuthState.initial() =>
      MerchantAuthState(isLoading: true, isAuthenticated: false);

  MerchantAuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Merchant? merchant,
    String? error,
  }) {
    return MerchantAuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      merchant: merchant ?? this.merchant,
      error: error,
    );
  }
}
