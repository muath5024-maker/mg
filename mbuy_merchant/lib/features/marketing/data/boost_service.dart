import '../../../core/services/api_service.dart';
import 'dart:convert';

/// أنواع دعم الظهور للمنتجات
enum ProductBoostType {
  featured, // ظهور في قسم المميز (50 نقطة/يوم)
  categoryTop, // ظهور في أعلى الفئة (30 نقطة/يوم)
  searchTop, // ظهور في أعلى نتائج البحث (40 نقطة/يوم)
}

/// أنواع دعم الظهور للمتاجر
enum StoreBoostType {
  featured, // متجر مميز (100 نقطة/يوم)
  homeBanner, // بانر في الصفحة الرئيسية (200 نقطة/يوم)
}

/// معلومات التسعير لكل نوع boost
class BoostPricing {
  final int pointsPerDay;
  final int minDays;
  final int maxDays;

  const BoostPricing({
    required this.pointsPerDay,
    required this.minDays,
    required this.maxDays,
  });

  factory BoostPricing.fromJson(Map<String, dynamic> json) {
    return BoostPricing(
      pointsPerDay: json['points_per_day'] ?? 0,
      minDays: json['min_days'] ?? 1,
      maxDays: json['max_days'] ?? 30,
    );
  }
}

/// معاملة boost نشطة
class BoostTransaction {
  final String id;
  final String merchantId;
  final String targetType; // 'product' أو 'store'
  final String targetId;
  final String boostType;
  final int pointsSpent;
  final int durationDays;
  final DateTime startsAt;
  final DateTime expiresAt;
  final String status;

  BoostTransaction({
    required this.id,
    required this.merchantId,
    required this.targetType,
    required this.targetId,
    required this.boostType,
    required this.pointsSpent,
    required this.durationDays,
    required this.startsAt,
    required this.expiresAt,
    required this.status,
  });

  factory BoostTransaction.fromJson(Map<String, dynamic> json) {
    return BoostTransaction(
      id: json['id'] ?? '',
      merchantId: json['merchant_id'] ?? '',
      targetType: json['target_type'] ?? '',
      targetId: json['target_id'] ?? '',
      boostType: json['boost_type'] ?? '',
      pointsSpent: json['points_spent'] ?? 0,
      durationDays: json['duration_days'] ?? 0,
      startsAt: DateTime.parse(
        json['starts_at'] ?? DateTime.now().toIso8601String(),
      ),
      expiresAt: DateTime.parse(
        json['expires_at'] ?? DateTime.now().toIso8601String(),
      ),
      status: json['status'] ?? 'unknown',
    );
  }

  /// الأيام المتبقية
  int get remainingDays {
    final now = DateTime.now();
    if (expiresAt.isBefore(now)) return 0;
    return expiresAt.difference(now).inDays;
  }

  /// هل منتهي؟
  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// اسم نوع الـ boost بالعربي
  String get boostTypeName {
    switch (boostType) {
      case 'featured':
        return targetType == 'product' ? 'منتج مميز' : 'متجر مميز';
      case 'category_top':
        return 'أعلى الفئة';
      case 'search_top':
        return 'أعلى البحث';
      case 'home_banner':
        return 'بانر الرئيسية';
      default:
        return boostType;
    }
  }
}

/// خدمة إدارة نظام Boost
class BoostService {
  final ApiService _apiService;

  BoostService(this._apiService);

  /// الحصول على أسعار الـ boost
  Future<Map<String, dynamic>?> getPricing() async {
    try {
      final response = await _apiService.get('/secure/boost/pricing');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['ok'] == true) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// الحصول على الـ boosts النشطة
  Future<List<BoostTransaction>> getActiveBoosts() async {
    try {
      final response = await _apiService.get('/secure/boost/active');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['ok'] == true && data['data'] != null) {
          return (data['data'] as List)
              .map((json) => BoostTransaction.fromJson(json))
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// الحصول على سجل الـ boost
  Future<List<BoostTransaction>> getBoostHistory() async {
    try {
      final response = await _apiService.get('/secure/boost/history');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['ok'] == true && data['data'] != null) {
          return (data['data'] as List)
              .map((json) => BoostTransaction.fromJson(json))
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// شراء boost للمنتج
  Future<BoostResult> purchaseProductBoost({
    required String productId,
    required String boostType,
    required int durationDays,
  }) async {
    try {
      final response = await _apiService.post(
        '/secure/boost/product',
        body: {
          'product_id': productId,
          'boost_type': boostType,
          'duration_days': durationDays,
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['ok'] == true) {
        return BoostResult(
          success: true,
          message: data['message'] ?? 'تم تفعيل دعم الظهور بنجاح',
          transaction: data['data'] != null
              ? BoostTransaction.fromJson(data['data'])
              : null,
        );
      }

      return BoostResult(
        success: false,
        error: data['error'] ?? 'UNKNOWN_ERROR',
        message: data['message'] ?? 'حدث خطأ غير معروف',
      );
    } catch (e) {
      return BoostResult(
        success: false,
        error: 'NETWORK_ERROR',
        message: 'حدث خطأ في الاتصال',
      );
    }
  }

  /// شراء boost للمتجر
  Future<BoostResult> purchaseStoreBoost({
    required String boostType,
    required int durationDays,
  }) async {
    try {
      final response = await _apiService.post(
        '/secure/boost/store',
        body: {'boost_type': boostType, 'duration_days': durationDays},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['ok'] == true) {
        return BoostResult(
          success: true,
          message: data['message'] ?? 'تم تفعيل دعم الظهور للمتجر بنجاح',
          transaction: data['data'] != null
              ? BoostTransaction.fromJson(data['data'])
              : null,
        );
      }

      return BoostResult(
        success: false,
        error: data['error'] ?? 'UNKNOWN_ERROR',
        message: data['message'] ?? 'حدث خطأ غير معروف',
      );
    } catch (e) {
      return BoostResult(
        success: false,
        error: 'NETWORK_ERROR',
        message: 'حدث خطأ في الاتصال',
      );
    }
  }

  /// إلغاء boost نشط
  Future<BoostResult> cancelBoost(String transactionId) async {
    try {
      final response = await _apiService.post(
        '/secure/boost/cancel',
        body: {'transaction_id': transactionId},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['ok'] == true) {
        return BoostResult(
          success: true,
          message: data['message'] ?? 'تم إلغاء الدعم',
        );
      }

      return BoostResult(
        success: false,
        error: data['error'] ?? 'UNKNOWN_ERROR',
        message: data['message'] ?? 'حدث خطأ في الإلغاء',
      );
    } catch (e) {
      return BoostResult(
        success: false,
        error: 'NETWORK_ERROR',
        message: 'حدث خطأ في الاتصال',
      );
    }
  }

  /// حساب التكلفة الكلية
  int calculateTotalPoints({
    required int pointsPerDay,
    required int durationDays,
  }) {
    return pointsPerDay * durationDays;
  }
}

/// نتيجة عملية Boost
class BoostResult {
  final bool success;
  final String? error;
  final String message;
  final BoostTransaction? transaction;

  BoostResult({
    required this.success,
    this.error,
    required this.message,
    this.transaction,
  });
}
