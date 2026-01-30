/// Auth Repository for Merchant App
///
/// Repository for merchant authentication
library;

import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/mutations.dart';
import 'merchant_repository.dart';

class AuthRepository {
  final _client = GraphQLConfig.getClientWithoutCache();

  /// Login merchant
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final result = await _client.safeMutate(
      mutation: AuthMutations.login,
      variables: {'email': email, 'password': password},
      parser: (data) => AuthResult.fromJson(data['merchantLogin']),
    );

    if (result.success && result.token != null) {
      await GraphQLConfig.setToken(result.token!);
      if (result.refreshToken != null) {
        await GraphQLConfig.setRefreshToken(result.refreshToken!);
      }
    }

    return result;
  }

  /// Refresh token
  Future<AuthResult> refreshToken() async {
    final currentRefreshToken = await GraphQLConfig.getRefreshToken();
    if (currentRefreshToken == null) {
      throw const GraphQLException.custom('No refresh token available');
    }

    final result = await _client.safeMutate(
      mutation: AuthMutations.refreshToken,
      variables: {'refreshToken': currentRefreshToken},
      parser: (data) => AuthResult.fromJson(data['refreshMerchantToken']),
    );

    if (result.success && result.token != null) {
      await GraphQLConfig.setToken(result.token!);
      if (result.refreshToken != null) {
        await GraphQLConfig.setRefreshToken(result.refreshToken!);
      }
    }

    return result;
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _client.safeMutate(
        mutation: AuthMutations.logout,
        parser: (data) => data['merchantLogout']['success'],
      );
    } catch (e) {
      // Ignore logout errors
    }

    await GraphQLConfig.removeToken();
    await GraphQLConfig.removeRefreshToken();
  }

  /// Check if authenticated
  Future<bool> isAuthenticated() async {
    final token = await GraphQLConfig.getToken();
    return token != null;
  }

  /// Update password
  Future<bool> updatePassword({
    required String merchantId,
    required String currentPassword,
    required String newPassword,
  }) async {
    return _client.safeMutate(
      mutation: AuthMutations.updatePassword,
      variables: {
        'merchantId': merchantId,
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
      parser: (data) => data['updateMerchantPassword']['success'] == true,
    );
  }
}

/// Auth Result Model
class AuthResult {
  final bool success;
  final String? token;
  final String? refreshToken;
  final Merchant? merchant;
  final String? error;

  AuthResult({
    required this.success,
    this.token,
    this.refreshToken,
    this.merchant,
    this.error,
  });

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      success: json['success'] == true,
      token: json['token'],
      refreshToken: json['refreshToken'],
      merchant: json['merchant'] != null
          ? Merchant.fromJson(json['merchant'])
          : null,
      error: json['error'],
    );
  }
}
