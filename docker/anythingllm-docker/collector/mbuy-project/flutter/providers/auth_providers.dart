/// Auth Providers
///
/// Riverpod providers for authentication state
library;

import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/auth_repository.dart';
import 'repository_providers.dart';

/// Auth Notifier for authentication operations - Riverpod 3.x style
final authNotifierProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

class AuthNotifier extends Notifier<AuthState> {
  AuthRepository get _repo => ref.watch(authRepositoryProvider);

  @override
  AuthState build() {
    _checkAuth();
    return AuthState.initial();
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

  Future<bool> login({required String phone, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.login(phone: phone, password: password);
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        customer: result.customer,
      );
      ref.read(currentCustomerProvider.notifier).set(result.customer);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register({
    required String fullName,
    required String phone,
    required String password,
    String? email,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.register(
        fullName: fullName,
        phone: phone,
        password: password,
        email: email,
      );
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        customer: result.customer,
      );
      ref.read(currentCustomerProvider.notifier).set(result.customer);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<OtpResult?> requestOtp(String phone) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repo.requestOtp(phone);
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }

  Future<bool> verifyOtp({required String phone, required String otp}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final success = await _repo.verifyOtp(phone: phone, otp: otp);
      state = state.copyWith(isLoading: false);
      return success;
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
    state = AuthState.initial();
    ref.read(currentCustomerProvider.notifier).clear();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Auth State
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final Customer? customer;
  final String? error;

  AuthState({
    required this.isLoading,
    required this.isAuthenticated,
    this.customer,
    this.error,
  });

  factory AuthState.initial() =>
      AuthState(isLoading: true, isAuthenticated: false);

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    Customer? customer,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      customer: customer ?? this.customer,
      error: error,
    );
  }
}
