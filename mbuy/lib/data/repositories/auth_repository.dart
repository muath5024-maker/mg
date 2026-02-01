/// Auth Repository - GraphQL Implementation
///
/// Handles authentication operations
library;

import 'package:graphql_flutter/graphql_flutter.dart';
import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/mutations.dart';

class AuthRepository {
  final GraphQLClient _client;

  AuthRepository({GraphQLClient? client})
    : _client = client ?? GraphQLConfig.client;

  /// Login customer
  Future<AuthResult> login({
    required String phone,
    required String password,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(AuthMutations.login),
        variables: {'phone': phone, 'password': password},
      ),
    );

    final data = result.data!['loginCustomer'];

    // Save token
    await GraphQLConfig.setAuthToken(data['token']);

    return AuthResult(
      token: data['token'],
      customer: Customer.fromJson(data['customer']),
    );
  }

  /// Register new customer
  Future<AuthResult> register({
    required String fullName,
    required String phone,
    required String password,
    String? email,
  }) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(AuthMutations.register),
        variables: {
          'input': {
            'fullName': fullName,
            'phone': phone,
            'password': password,
            'email': email,
          },
        },
      ),
    );

    final data = result.data!['registerCustomer'];

    // Save token
    await GraphQLConfig.setAuthToken(data['token']);

    return AuthResult(
      token: data['token'],
      customer: Customer.fromJson(data['customer']),
    );
  }

  /// Request OTP
  Future<OtpResult> requestOtp(String phone) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(AuthMutations.requestOtp),
        variables: {'phone': phone},
      ),
    );

    final data = result.data!['requestOtp'];
    return OtpResult(
      success: data['success'],
      message: data['message'],
      expiresIn: data['expiresIn'],
    );
  }

  /// Verify OTP
  Future<bool> verifyOtp({required String phone, required String otp}) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(AuthMutations.verifyOtp),
        variables: {'phone': phone, 'otp': otp},
      ),
    );

    return result.data!['verifyOtp']['success'] ?? false;
  }

  /// Refresh token
  Future<String> refreshToken(String token) async {
    final result = await _client.safeMutate(
      MutationOptions(
        document: gql(AuthMutations.refreshToken),
        variables: {'token': token},
      ),
    );

    final newToken = result.data!['refreshToken']['token'];
    await GraphQLConfig.setAuthToken(newToken);
    return newToken;
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _client.safeMutate(
        MutationOptions(document: gql(AuthMutations.logout)),
      );
    } finally {
      await GraphQLConfig.clearAuthToken();
    }
  }

  /// Check if authenticated
  Future<bool> isAuthenticated() async {
    return GraphQLConfig.isAuthenticated();
  }
}

/// Auth Result
class AuthResult {
  final String token;
  final Customer customer;

  AuthResult({required this.token, required this.customer});
}

/// OTP Result
class OtpResult {
  final bool success;
  final String? message;
  final int? expiresIn;

  OtpResult({required this.success, this.message, this.expiresIn});
}

/// Customer Model
class Customer {
  final String id;
  final String fullName;
  final String? email;
  final String phone;
  final String? avatarUrl;
  final bool isVerified;
  final List<CustomerAddress>? addresses;
  final DateTime? createdAt;

  Customer({
    required this.id,
    required this.fullName,
    this.email,
    required this.phone,
    this.avatarUrl,
    required this.isVerified,
    this.addresses,
    this.createdAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      fullName: json['fullName'],
      email: json['email'],
      phone: json['phone'],
      avatarUrl: json['avatarUrl'],
      isVerified: json['isVerified'] ?? false,
      addresses: (json['addresses'] as List?)
          ?.map((a) => CustomerAddress.fromJson(a))
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
    );
  }

  /// Get initials for avatar
  String get initials {
    final parts = fullName.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return fullName.isNotEmpty ? fullName[0].toUpperCase() : '?';
  }

  /// Get default address
  CustomerAddress? get defaultAddress {
    return addresses?.firstWhere(
      (a) => a.isDefault,
      orElse: () => addresses!.first,
    );
  }
}

/// Customer Address
class CustomerAddress {
  final String id;
  final String? label;
  final String street;
  final String city;
  final String? state;
  final String country;
  final String? postalCode;
  final String? phone;
  final bool isDefault;
  final double? lat;
  final double? lng;

  CustomerAddress({
    required this.id,
    this.label,
    required this.street,
    required this.city,
    this.state,
    required this.country,
    this.postalCode,
    this.phone,
    required this.isDefault,
    this.lat,
    this.lng,
  });

  factory CustomerAddress.fromJson(Map<String, dynamic> json) {
    return CustomerAddress(
      id: json['id'],
      label: json['label'],
      street: json['street'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
      postalCode: json['postalCode'],
      phone: json['phone'],
      isDefault: json['isDefault'] ?? false,
      lat: json['lat'] != null ? (json['lat'] as num).toDouble() : null,
      lng: json['lng'] != null ? (json['lng'] as num).toDouble() : null,
    );
  }

  String get fullAddress =>
      '$street, $city${state != null ? ', $state' : ''}, $country';
}
