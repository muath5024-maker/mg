import 'dart:convert';

import '../../core/app_config.dart';
import '../../core/services/api_service.dart';

/// Merchant Repository - التعامل مع API التاجر
class MerchantRepository {
  final ApiService _apiService;

  MerchantRepository({ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  // ============================================================================
  // Helper method to parse response
  // ============================================================================

  Map<String, dynamic> _parseResponse(dynamic response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return body;
    } else {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      throw Exception(body['message'] ?? 'Request failed');
    }
  }

  // ============================================================================
  // Store Management
  // ============================================================================

  /// جلب معلومات المتجر
  Future<MerchantStoreData> getStore() async {
    final response = await _apiService.get(AppConfig.merchantStoreEndpoint);
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return MerchantStoreData.fromJson(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'فشل في جلب بيانات المتجر');
  }

  /// تحديث معلومات المتجر
  Future<MerchantStoreData> updateStore(Map<String, dynamic> updateData) async {
    final response = await _apiService.put(
      AppConfig.merchantStoreEndpoint,
      body: updateData,
    );
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return MerchantStoreData.fromJson(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'فشل في تحديث بيانات المتجر');
  }

  // ============================================================================
  // Products Management
  // ============================================================================

  /// جلب منتجات التاجر
  Future<List<MerchantProduct>> getProducts({int? limit, int? offset}) async {
    final queryParams = <String, String>{};
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();

    final response = await _apiService.get(
      AppConfig.merchantProductsEndpoint,
      queryParams: queryParams.isNotEmpty ? queryParams : null,
    );

    final data = _parseResponse(response);
    if (data['ok'] == true) {
      final List items = data['data'] ?? [];
      return items.map((e) => MerchantProduct.fromJson(e)).toList();
    }
    throw Exception(data['message'] ?? 'فشل في جلب المنتجات');
  }

  /// إنشاء منتج جديد
  Future<MerchantProduct> createProduct(
    Map<String, dynamic> productData,
  ) async {
    final response = await _apiService.post(
      AppConfig.merchantProductsEndpoint,
      body: productData,
    );
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return MerchantProduct.fromJson(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'فشل في إنشاء المنتج');
  }

  /// تحديث منتج
  Future<MerchantProduct> updateProduct(
    String productId,
    Map<String, dynamic> productData,
  ) async {
    final response = await _apiService.put(
      '${AppConfig.merchantProductsEndpoint}/$productId',
      body: productData,
    );
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return MerchantProduct.fromJson(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'فشل في تحديث المنتج');
  }

  /// حذف منتج
  Future<void> deleteProduct(String productId) async {
    final response = await _apiService.delete(
      '${AppConfig.merchantProductsEndpoint}/$productId',
    );
    final data = _parseResponse(response);
    if (data['ok'] != true) {
      throw Exception(data['message'] ?? 'فشل في حذف المنتج');
    }
  }

  // ============================================================================
  // Orders Management
  // ============================================================================

  /// جلب طلبات التاجر
  Future<List<MerchantOrder>> getOrders({String? status}) async {
    final queryParams = <String, String>{};
    if (status != null) queryParams['status'] = status;

    final response = await _apiService.get(
      AppConfig.merchantOrdersEndpoint,
      queryParams: queryParams.isNotEmpty ? queryParams : null,
    );

    final data = _parseResponse(response);
    if (data['ok'] == true) {
      final List items = data['data'] ?? [];
      return items.map((e) => MerchantOrder.fromJson(e)).toList();
    }
    throw Exception(data['message'] ?? 'فشل في جلب الطلبات');
  }

  /// تحديث حالة الطلب
  Future<MerchantOrder> updateOrderStatus(String orderId, String status) async {
    final response = await _apiService.put(
      '${AppConfig.merchantOrdersEndpoint}/$orderId/status',
      body: {'status': status},
    );
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return MerchantOrder.fromJson(data['data'] ?? {});
    }
    throw Exception(data['message'] ?? 'فشل في تحديث حالة الطلب');
  }

  // ============================================================================
  // Dashboard Stats
  // ============================================================================

  /// جلب إحصائيات لوحة التحكم
  Future<MerchantDashboardStats> getDashboardStats() async {
    try {
      // جلب البيانات من عدة endpoints
      final ordersResponse = await _apiService.get(
        AppConfig.merchantOrdersEndpoint,
      );
      final productsResponse = await _apiService.get(
        AppConfig.merchantProductsEndpoint,
      );
      final storeResponse = await _apiService.get(
        AppConfig.merchantStoreEndpoint,
      );

      final ordersData = _parseResponse(ordersResponse);
      final productsData = _parseResponse(productsResponse);
      final storeData = _parseResponse(storeResponse);

      final orders = (ordersData['data'] as List?) ?? [];
      final products = (productsData['data'] as List?) ?? [];
      final store = (storeData['data'] as Map<String, dynamic>?) ?? {};

      // حساب طلبات اليوم
      final todayOrders = orders.where((o) {
        final createdAt = DateTime.tryParse(o['created_at']?.toString() ?? '');
        if (createdAt == null) return false;
        final today = DateTime.now();
        return createdAt.year == today.year &&
            createdAt.month == today.month &&
            createdAt.day == today.day;
      }).length;

      // حساب إجمالي المبيعات
      final totalRevenue = orders.fold<double>(0.0, (sum, o) {
        return sum +
            (double.tryParse(o['total_amount']?.toString() ?? '0') ?? 0);
      });

      return MerchantDashboardStats(
        walletBalance:
            double.tryParse(store['total_revenue']?.toString() ?? '0') ?? 0,
        todayOrders: todayOrders,
        totalSales: totalRevenue,
        totalCustomers: store['total_orders'] ?? 0,
        totalProducts: products.length,
      );
    } catch (e) {
      // إرجاع قيم افتراضية في حالة الفشل
      return MerchantDashboardStats(
        walletBalance: 0,
        todayOrders: 0,
        totalSales: 0,
        totalCustomers: 0,
        totalProducts: 0,
      );
    }
  }

  // ============================================================================
  // Settings
  // ============================================================================

  /// جلب إعدادات التاجر
  Future<Map<String, dynamic>> getSettings() async {
    final response = await _apiService.get(AppConfig.merchantSettingsEndpoint);
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      return (data['data'] as Map<String, dynamic>?) ?? {};
    }
    throw Exception(data['message'] ?? 'فشل في جلب الإعدادات');
  }

  // ============================================================================
  // Employees
  // ============================================================================

  /// جلب موظفي التاجر
  Future<List<MerchantUser>> getUsers() async {
    final response = await _apiService.get(AppConfig.merchantUsersEndpoint);
    final data = _parseResponse(response);
    if (data['ok'] == true) {
      final List items = data['data'] ?? [];
      return items.map((e) => MerchantUser.fromJson(e)).toList();
    }
    throw Exception(data['message'] ?? 'فشل في جلب الموظفين');
  }
}

// ============================================================================
// Data Models
// ============================================================================

class MerchantStoreData {
  final String id;
  final String businessName;
  final String? businessNameAr;
  final String? slug;
  final String? description;
  final String? logoUrl;
  final String? bannerUrl;
  final String? phone;
  final String? email;
  final String status;
  final bool verified;
  final double rating;
  final int reviewCount;
  final int totalOrders;
  final double totalRevenue;

  MerchantStoreData({
    required this.id,
    required this.businessName,
    this.businessNameAr,
    this.slug,
    this.description,
    this.logoUrl,
    this.bannerUrl,
    this.phone,
    this.email,
    required this.status,
    required this.verified,
    required this.rating,
    required this.reviewCount,
    required this.totalOrders,
    required this.totalRevenue,
  });

  factory MerchantStoreData.fromJson(Map<String, dynamic> json) {
    return MerchantStoreData(
      id: json['id']?.toString() ?? '',
      businessName: json['business_name']?.toString() ?? '',
      businessNameAr: json['business_name_ar']?.toString(),
      slug: json['slug']?.toString(),
      description: json['description']?.toString(),
      logoUrl: json['logo_url']?.toString(),
      bannerUrl: json['banner_url']?.toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      status: json['status']?.toString() ?? 'pending',
      verified: json['verified'] == true,
      rating: double.tryParse(json['rating']?.toString() ?? '0') ?? 0,
      reviewCount: int.tryParse(json['review_count']?.toString() ?? '0') ?? 0,
      totalOrders: int.tryParse(json['total_orders']?.toString() ?? '0') ?? 0,
      totalRevenue:
          double.tryParse(json['total_revenue']?.toString() ?? '0') ?? 0,
    );
  }
}

class MerchantProduct {
  final String id;
  final String name;
  final String? description;
  final double price;
  final int stockQuantity;
  final String status;
  final String? thumbnailUrl;
  final DateTime? createdAt;

  MerchantProduct({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.stockQuantity,
    required this.status,
    this.thumbnailUrl,
    this.createdAt,
  });

  factory MerchantProduct.fromJson(Map<String, dynamic> json) {
    return MerchantProduct(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      stockQuantity:
          int.tryParse(json['stock_quantity']?.toString() ?? '0') ?? 0,
      status: json['status']?.toString() ?? 'draft',
      thumbnailUrl: json['thumbnail_url']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
    );
  }
}

class MerchantOrder {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final String? customerName;
  final String? customerPhone;
  final DateTime? createdAt;
  final List<Map<String, dynamic>> items;

  MerchantOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    this.customerName,
    this.customerPhone,
    this.createdAt,
    required this.items,
  });

  factory MerchantOrder.fromJson(Map<String, dynamic> json) {
    return MerchantOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? '',
      status: json['status']?.toString() ?? 'pending',
      paymentStatus: json['payment_status']?.toString() ?? 'pending',
      totalAmount:
          double.tryParse(json['total_amount']?.toString() ?? '0') ?? 0,
      customerName: json['customer_name']?.toString(),
      customerPhone: json['customer_phone']?.toString(),
      createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
      items:
          (json['order_items'] as List?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
    );
  }
}

class MerchantUser {
  final String id;
  final String? fullName;
  final String phone;
  final String? email;
  final String role;
  final String status;

  MerchantUser({
    required this.id,
    this.fullName,
    required this.phone,
    this.email,
    required this.role,
    required this.status,
  });

  factory MerchantUser.fromJson(Map<String, dynamic> json) {
    return MerchantUser(
      id: json['id']?.toString() ?? '',
      fullName: json['full_name']?.toString(),
      phone: json['phone']?.toString() ?? '',
      email: json['email']?.toString(),
      role: json['role']?.toString() ?? 'staff',
      status: json['status']?.toString() ?? 'active',
    );
  }
}

class MerchantDashboardStats {
  final double walletBalance;
  final int todayOrders;
  final double totalSales;
  final int totalCustomers;
  final int totalProducts;

  MerchantDashboardStats({
    required this.walletBalance,
    required this.todayOrders,
    required this.totalSales,
    required this.totalCustomers,
    required this.totalProducts,
  });
}
