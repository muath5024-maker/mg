/// Dashboard Providers for Merchant App
///
/// Riverpod providers for dashboard and analytics - Riverpod 3.x style
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/merchant_repository.dart';
import 'repository_providers.dart';

/// Dashboard Stats Provider
final dashboardStatsProvider =
    FutureProvider.family<DashboardStats, DashboardParams>((ref, params) async {
      final repo = ref.watch(merchantRepositoryProvider);
      return repo.getDashboardStats(
        merchantId: params.merchantId,
        startDate: params.startDate,
        endDate: params.endDate,
      );
    });

/// Dashboard Parameters
class DashboardParams {
  final String merchantId;
  final DateTime? startDate;
  final DateTime? endDate;

  DashboardParams({required this.merchantId, this.startDate, this.endDate});

  /// Today's stats
  factory DashboardParams.today(String merchantId) {
    final now = DateTime.now();
    return DashboardParams(
      merchantId: merchantId,
      startDate: DateTime(now.year, now.month, now.day),
      endDate: DateTime(now.year, now.month, now.day, 23, 59, 59),
    );
  }

  /// This week's stats
  factory DashboardParams.thisWeek(String merchantId) {
    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    return DashboardParams(
      merchantId: merchantId,
      startDate: DateTime(weekStart.year, weekStart.month, weekStart.day),
      endDate: now,
    );
  }

  /// This month's stats
  factory DashboardParams.thisMonth(String merchantId) {
    final now = DateTime.now();
    return DashboardParams(
      merchantId: merchantId,
      startDate: DateTime(now.year, now.month, 1),
      endDate: now,
    );
  }

  /// Last 30 days
  factory DashboardParams.last30Days(String merchantId) {
    final now = DateTime.now();
    return DashboardParams(
      merchantId: merchantId,
      startDate: now.subtract(const Duration(days: 30)),
      endDate: now,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DashboardParams &&
          merchantId == other.merchantId &&
          startDate == other.startDate &&
          endDate == other.endDate;

  @override
  int get hashCode => Object.hash(merchantId, startDate, endDate);
}

/// Merchant Profile Provider
final merchantProfileProvider = FutureProvider.family<Merchant, String>((
  ref,
  merchantId,
) async {
  final repo = ref.watch(merchantRepositoryProvider);
  return repo.getMerchant(merchantId);
});

/// Profile Update Provider - simple mutation provider
final updateProfileProvider =
    FutureProvider.family<Merchant, UpdateProfileParams>((ref, params) async {
      final repo = ref.watch(merchantRepositoryProvider);
      return repo.updateProfile(
        merchantId: params.merchantId,
        name: params.name,
        email: params.email,
        phone: params.phone,
        logo: params.logo,
        coverImage: params.coverImage,
        description: params.description,
        address: params.address,
        city: params.city,
        state: params.state,
        country: params.country,
        postalCode: params.postalCode,
        latitude: params.latitude,
        longitude: params.longitude,
      );
    });

class UpdateProfileParams {
  final String merchantId;
  final String? name;
  final String? email;
  final String? phone;
  final String? logo;
  final String? coverImage;
  final String? description;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final double? latitude;
  final double? longitude;

  UpdateProfileParams({
    required this.merchantId,
    this.name,
    this.email,
    this.phone,
    this.logo,
    this.coverImage,
    this.description,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.latitude,
    this.longitude,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UpdateProfileParams && merchantId == other.merchantId;

  @override
  int get hashCode => merchantId.hashCode;
}

/// Update Settings Provider
final updateSettingsProvider =
    FutureProvider.family<void, UpdateSettingsParams>((ref, params) async {
      final repo = ref.watch(merchantRepositoryProvider);
      await repo.updateSettings(
        merchantId: params.merchantId,
        settings: params.settings,
      );
    });

class UpdateSettingsParams {
  final String merchantId;
  final Map<String, dynamic> settings;

  UpdateSettingsParams({required this.merchantId, required this.settings});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UpdateSettingsParams && merchantId == other.merchantId;

  @override
  int get hashCode => merchantId.hashCode;
}
