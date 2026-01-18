/// Boost Transaction Model
/// معاملة دعم الظهور
class BoostTransaction {
  final String id;
  final String merchantId;
  final String targetType; // 'product', 'store', 'media'
  final String targetId;
  final String
  boostType; // 'featured', 'category_top', 'search_top', 'home_banner'
  final int pointsSpent;
  final int durationDays;
  final DateTime startsAt;
  final DateTime expiresAt;
  final String status; // 'active', 'expired', 'cancelled'
  final DateTime createdAt;

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
    required this.createdAt,
  });

  factory BoostTransaction.fromJson(Map<String, dynamic> json) {
    return BoostTransaction(
      id: json['id'] as String,
      merchantId: json['merchant_id'] as String,
      targetType: json['target_type'] as String,
      targetId: json['target_id'] as String,
      boostType: json['boost_type'] as String,
      pointsSpent: json['points_spent'] as int,
      durationDays: json['duration_days'] as int,
      startsAt: DateTime.parse(json['starts_at'] as String),
      expiresAt: DateTime.parse(json['expires_at'] as String),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'merchant_id': merchantId,
      'target_type': targetType,
      'target_id': targetId,
      'boost_type': boostType,
      'points_spent': pointsSpent,
      'duration_days': durationDays,
      'starts_at': startsAt.toIso8601String(),
      'expires_at': expiresAt.toIso8601String(),
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }

  /// Check if boost is active
  bool get isActive => status == 'active' && expiresAt.isAfter(DateTime.now());

  /// Get remaining days
  int get remainingDays {
    if (!isActive) return 0;
    return expiresAt.difference(DateTime.now()).inDays;
  }

  /// Get remaining hours
  int get remainingHours {
    if (!isActive) return 0;
    return expiresAt.difference(DateTime.now()).inHours;
  }

  /// Get boost type display name in Arabic
  String get boostTypeDisplayAr {
    switch (boostType) {
      case 'featured':
        return 'مميز';
      case 'category_top':
        return 'أعلى الفئة';
      case 'search_top':
        return 'أعلى البحث';
      case 'home_banner':
        return 'بانر الرئيسية';
      case 'media_for_you':
        return 'لك (ميديا)';
      default:
        return boostType;
    }
  }

  /// Get target type display name in Arabic
  String get targetTypeDisplayAr {
    switch (targetType) {
      case 'product':
        return 'منتج';
      case 'store':
        return 'متجر';
      case 'media':
        return 'ميديا';
      default:
        return targetType;
    }
  }

  /// Get status display name in Arabic
  String get statusDisplayAr {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'expired':
        return 'منتهي';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }
}

/// Boost Pricing Info
/// معلومات تسعير الدعم
class BoostPricing {
  final int pointsPerDay;
  final int minDays;
  final int maxDays;

  BoostPricing({
    required this.pointsPerDay,
    required this.minDays,
    required this.maxDays,
  });

  factory BoostPricing.fromJson(Map<String, dynamic> json) {
    return BoostPricing(
      pointsPerDay: json['points_per_day'] as int,
      minDays: json['min_days'] as int,
      maxDays: json['max_days'] as int,
    );
  }

  /// Calculate total points for given days
  int calculateTotal(int days) => pointsPerDay * days;
}

/// All Boost Pricing Options
class BoostPricingOptions {
  final Map<String, BoostPricing> product;
  final Map<String, BoostPricing> store;
  final Map<String, BoostPricing> media;

  BoostPricingOptions({
    required this.product,
    required this.store,
    required this.media,
  });

  factory BoostPricingOptions.fromJson(Map<String, dynamic> json) {
    return BoostPricingOptions(
      product: (json['product'] as Map<String, dynamic>).map(
        (key, value) =>
            MapEntry(key, BoostPricing.fromJson(value as Map<String, dynamic>)),
      ),
      store: (json['store'] as Map<String, dynamic>).map(
        (key, value) =>
            MapEntry(key, BoostPricing.fromJson(value as Map<String, dynamic>)),
      ),
      media: (json['media'] as Map<String, dynamic>).map(
        (key, value) =>
            MapEntry(key, BoostPricing.fromJson(value as Map<String, dynamic>)),
      ),
    );
  }
}

/// Boost Purchase Request
class BoostPurchaseRequest {
  final String? productId;
  final String boostType;
  final int durationDays;

  BoostPurchaseRequest({
    this.productId,
    required this.boostType,
    required this.durationDays,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'boost_type': boostType,
      'duration_days': durationDays,
    };
    if (productId != null) {
      map['product_id'] = productId;
    }
    return map;
  }
}

/// Boost Cancel Result
class BoostCancelResult {
  final bool cancelled;
  final int refundPoints;
  final int remainingDays;

  BoostCancelResult({
    required this.cancelled,
    required this.refundPoints,
    required this.remainingDays,
  });

  factory BoostCancelResult.fromJson(Map<String, dynamic> json) {
    return BoostCancelResult(
      cancelled: json['cancelled'] as bool,
      refundPoints: json['refund_points'] as int,
      remainingDays: json['remaining_days'] as int,
    );
  }
}
