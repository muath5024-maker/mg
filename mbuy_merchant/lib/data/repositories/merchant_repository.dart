/// Merchant Repository
///
/// Repository for merchant profile and dashboard operations
library;

import '../../core/graphql/graphql_config.dart';
import '../../core/graphql/queries.dart';
import '../../core/graphql/mutations.dart';

class MerchantRepository {
  final _client = GraphQLConfig.getClientWithoutCache();

  /// Get merchant profile
  Future<Merchant> getMerchant(String id) async {
    return _client.safeQuery(
      query: MerchantQueries.getMerchant,
      variables: {'id': id},
      parser: (data) => Merchant.fromJson(data['merchant']),
    );
  }

  /// Get dashboard statistics
  Future<DashboardStats> getDashboardStats({
    required String merchantId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    return _client.safeQuery(
      query: MerchantQueries.getDashboardStats,
      variables: {
        'merchantId': merchantId,
        if (startDate != null && endDate != null)
          'dateRange': {
            'startDate': startDate.toIso8601String(),
            'endDate': endDate.toIso8601String(),
          },
      },
      parser: (data) => DashboardStats.fromJson(data['merchantDashboard']),
    );
  }

  /// Update merchant profile
  Future<Merchant> updateProfile({
    required String merchantId,
    String? name,
    String? email,
    String? phone,
    String? logo,
    String? coverImage,
    String? description,
    String? address,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    double? latitude,
    double? longitude,
  }) async {
    return _client.safeMutate(
      mutation: ProfileMutations.updateProfile,
      variables: {
        'input': {
          'id': merchantId,
          if (name != null) 'name': name,
          if (email != null) 'email': email,
          if (phone != null) 'phone': phone,
          if (logo != null) 'logo': logo,
          if (coverImage != null) 'coverImage': coverImage,
          if (description != null) 'description': description,
          if (address != null) 'address': address,
          if (city != null) 'city': city,
          if (state != null) 'state': state,
          if (country != null) 'country': country,
          if (postalCode != null) 'postalCode': postalCode,
          if (latitude != null) 'latitude': latitude,
          if (longitude != null) 'longitude': longitude,
        },
      },
      parser: (data) => Merchant.fromJson(data['updateMerchant']),
    );
  }

  /// Update merchant settings
  Future<Map<String, dynamic>> updateSettings({
    required String merchantId,
    required Map<String, dynamic> settings,
  }) async {
    return _client.safeMutate(
      mutation: ProfileMutations.updateSettings,
      variables: {'merchantId': merchantId, 'settings': settings},
      parser: (data) => Map<String, dynamic>.from(
        data['updateMerchantSettings']['settings'] ?? {},
      ),
    );
  }

  /// Update working hours
  Future<Map<String, dynamic>> updateWorkingHours({
    required String merchantId,
    required Map<String, dynamic> workingHours,
  }) async {
    return _client.safeMutate(
      mutation: ProfileMutations.updateWorkingHours,
      variables: {'merchantId': merchantId, 'workingHours': workingHours},
      parser: (data) => Map<String, dynamic>.from(
        data['updateWorkingHours']['workingHours'] ?? {},
      ),
    );
  }
}

/// Merchant Model
class Merchant {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String? logo;
  final String? coverImage;
  final String? description;
  final String? businessType;
  final String? address;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final double rating;
  final int totalReviews;
  final bool isVerified;
  final bool isActive;
  final Map<String, dynamic>? settings;
  final Map<String, dynamic>? workingHours;
  final List<Map<String, dynamic>>? deliveryZones;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Merchant({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.logo,
    this.coverImage,
    this.description,
    this.businessType,
    this.address,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.latitude,
    this.longitude,
    this.rating = 0,
    this.totalReviews = 0,
    this.isVerified = false,
    this.isActive = true,
    this.settings,
    this.workingHours,
    this.deliveryZones,
    this.createdAt,
    this.updatedAt,
  });

  factory Merchant.fromJson(Map<String, dynamic> json) {
    return Merchant(
      id: json['id'],
      name: json['name'],
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      logo: json['logo'],
      coverImage: json['coverImage'],
      description: json['description'],
      businessType: json['businessType'],
      address: json['address'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
      postalCode: json['postalCode'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      totalReviews: json['totalReviews'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      isActive: json['isActive'] ?? true,
      settings: json['settings'] != null
          ? Map<String, dynamic>.from(json['settings'])
          : null,
      workingHours: json['workingHours'] != null
          ? Map<String, dynamic>.from(json['workingHours'])
          : null,
      deliveryZones: json['deliveryZones'] != null
          ? List<Map<String, dynamic>>.from(
              (json['deliveryZones'] as List).map(
                (e) => Map<String, dynamic>.from(e),
              ),
            )
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}

/// Dashboard Statistics Model
class DashboardStats {
  final int totalOrders;
  final int pendingOrders;
  final int completedOrders;
  final int cancelledOrders;
  final double totalRevenue;
  final double averageOrderValue;
  final int totalCustomers;
  final int newCustomers;
  final List<TopProduct> topProducts;
  final List<RevenueByDay> revenueByDay;

  DashboardStats({
    required this.totalOrders,
    required this.pendingOrders,
    required this.completedOrders,
    required this.cancelledOrders,
    required this.totalRevenue,
    required this.averageOrderValue,
    required this.totalCustomers,
    required this.newCustomers,
    required this.topProducts,
    required this.revenueByDay,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalOrders: json['totalOrders'] ?? 0,
      pendingOrders: json['pendingOrders'] ?? 0,
      completedOrders: json['completedOrders'] ?? 0,
      cancelledOrders: json['cancelledOrders'] ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0,
      averageOrderValue: (json['averageOrderValue'] as num?)?.toDouble() ?? 0,
      totalCustomers: json['totalCustomers'] ?? 0,
      newCustomers: json['newCustomers'] ?? 0,
      topProducts:
          (json['topProducts'] as List?)
              ?.map((e) => TopProduct.fromJson(e))
              .toList() ??
          [],
      revenueByDay:
          (json['revenueByDay'] as List?)
              ?.map((e) => RevenueByDay.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class TopProduct {
  final String id;
  final String name;
  final int totalSold;
  final double revenue;

  TopProduct({
    required this.id,
    required this.name,
    required this.totalSold,
    required this.revenue,
  });

  factory TopProduct.fromJson(Map<String, dynamic> json) {
    return TopProduct(
      id: json['id'],
      name: json['name'],
      totalSold: json['totalSold'] ?? 0,
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0,
    );
  }
}

class RevenueByDay {
  final String date;
  final double revenue;
  final int orders;

  RevenueByDay({
    required this.date,
    required this.revenue,
    required this.orders,
  });

  factory RevenueByDay.fromJson(Map<String, dynamic> json) {
    return RevenueByDay(
      date: json['date'],
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0,
      orders: json['orders'] ?? 0,
    );
  }
}
