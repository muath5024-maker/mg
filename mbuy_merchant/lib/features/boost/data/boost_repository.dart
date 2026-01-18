import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../domain/models/boost_transaction.dart';
import '../../../core/config/api_config.dart';

/// Boost Repository
/// مستودع دعم الظهور
class BoostRepository {
  final String baseUrl;
  final String? authToken;

  BoostRepository({required this.baseUrl, this.authToken});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  /// Get boost pricing options
  Future<BoostPricingOptions> getPricing() async {
    final response = await http.get(
      Uri.parse('$baseUrl/merchant/boost/pricing'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      throw Exception('فشل جلب أسعار الدعم');
    }

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل جلب أسعار الدعم');
    }

    return BoostPricingOptions.fromJson(data['data']);
  }

  /// Get active boosts for merchant
  Future<List<BoostTransaction>> getActiveBoosts() async {
    final response = await http.get(
      Uri.parse('$baseUrl/merchant/boost/active'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      throw Exception('فشل جلب الدعم النشط');
    }

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل جلب الدعم النشط');
    }

    final list = data['data'] as List<dynamic>;
    return list
        .map((e) => BoostTransaction.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get boost history
  Future<List<BoostTransaction>> getBoostHistory({
    int limit = 20,
    int offset = 0,
  }) async {
    final response = await http.get(
      Uri.parse('$baseUrl/merchant/boost/history?limit=$limit&offset=$offset'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      throw Exception('فشل جلب سجل الدعم');
    }

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل جلب سجل الدعم');
    }

    final list = data['data'] as List<dynamic>;
    return list
        .map((e) => BoostTransaction.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Purchase product boost
  Future<BoostTransaction> purchaseProductBoost({
    required String productId,
    required String boostType,
    required int durationDays,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/merchant/boost/product'),
      headers: _headers,
      body: jsonEncode({
        'product_id': productId,
        'boost_type': boostType,
        'duration_days': durationDays,
      }),
    );

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل شراء الدعم');
    }

    return BoostTransaction.fromJson(data['data']);
  }

  /// Purchase store boost
  Future<BoostTransaction> purchaseStoreBoost({
    required String boostType,
    required int durationDays,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/merchant/boost/store'),
      headers: _headers,
      body: jsonEncode({
        'boost_type': boostType,
        'duration_days': durationDays,
      }),
    );

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل شراء الدعم');
    }

    return BoostTransaction.fromJson(data['data']);
  }

  /// Cancel boost
  Future<BoostCancelResult> cancelBoost(String boostId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/merchant/boost/cancel'),
      headers: _headers,
      body: jsonEncode({'boost_id': boostId}),
    );

    final data = jsonDecode(response.body);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل إلغاء الدعم');
    }

    return BoostCancelResult.fromJson(data['data']);
  }
}

// ========================================
// Providers
// ========================================

/// Repository provider
final boostRepositoryProvider = Provider<BoostRepository>((ref) {
  // TODO: Get auth token from auth provider
  return BoostRepository(
    baseUrl: ApiConfig.workerUrl,
    authToken: null, // Will be set from auth state
  );
});

/// Boost pricing provider
final boostPricingProvider = FutureProvider<BoostPricingOptions>((ref) async {
  final repository = ref.read(boostRepositoryProvider);
  return repository.getPricing();
});

/// Active boosts provider
final activeBoostsProvider = FutureProvider<List<BoostTransaction>>((
  ref,
) async {
  final repository = ref.read(boostRepositoryProvider);
  return repository.getActiveBoosts();
});

/// Boost history provider
final boostHistoryProvider = FutureProvider.family<List<BoostTransaction>, int>(
  (ref, page) async {
    final repository = ref.read(boostRepositoryProvider);
    return repository.getBoostHistory(limit: 20, offset: (page - 1) * 20);
  },
);

/// Check if product has active boost
final productBoostProvider = FutureProvider.family<BoostTransaction?, String>((
  ref,
  productId,
) async {
  final boosts = await ref.watch(activeBoostsProvider.future);
  return boosts
      .where(
        (b) =>
            b.targetType == 'product' && b.targetId == productId && b.isActive,
      )
      .firstOrNull;
});

/// Check if store has active boost
final storeBoostProvider = FutureProvider<BoostTransaction?>((ref) async {
  final boosts = await ref.watch(activeBoostsProvider.future);
  return boosts.where((b) => b.targetType == 'store' && b.isActive).firstOrNull;
});
