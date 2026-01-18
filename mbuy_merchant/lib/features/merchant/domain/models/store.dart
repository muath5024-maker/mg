/// Store Model
/// يمثل بيانات متجر التاجر في النظام
class Store {
  final String id;
  final String?
  ownerId; // جعله اختياري لأن merchants table لا يحتوي على owner_id
  final String name;
  final String? description;
  final String? city;
  final String status;
  final bool isActive;
  final bool? isVerified;
  final double? rating;
  final int? followersCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final Map<String, dynamic>? settings;
  // حقول إضافية من merchants table
  final String? email;
  final String? phone;
  final String? logoUrl;
  // حقول النقاط والـ boost
  final int pointsBalance;
  final bool? isBoosted;
  final String? boostType;
  final DateTime? boostExpiresAt;

  Store({
    required this.id,
    this.ownerId,
    required this.name,
    this.description,
    this.city,
    required this.status,
    this.isActive = true,
    this.isVerified,
    this.rating,
    this.followersCount,
    this.createdAt,
    this.updatedAt,
    this.settings,
    this.email,
    this.phone,
    this.logoUrl,
    this.pointsBalance = 0,
    this.isBoosted,
    this.boostType,
    this.boostExpiresAt,
  });

  /// تحويل من JSON إلى Object
  factory Store.fromJson(Map<String, dynamic> json) {
    return Store(
      id: json['id'] as String,
      ownerId: json['owner_id'] as String?, // اختياري الآن
      name: json['name'] as String,
      description: json['description'] as String?,
      city: json['city'] as String?,
      status: json['status'] as String? ?? 'active',
      isActive: json['is_active'] as bool? ?? true,
      isVerified: json['is_verified'] as bool?,
      rating: json['rating'] != null
          ? (json['rating'] is int
                ? (json['rating'] as int).toDouble()
                : (json['rating'] as num).toDouble())
          : null,
      followersCount: json['followers_count'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      settings: json['store_settings'] as Map<String, dynamic>?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      logoUrl: json['logo_url'] as String?,
      pointsBalance: json['points_balance'] as int? ?? 0,
      isBoosted: json['is_boosted'] as bool?,
      boostType: json['boost_type'] as String?,
      boostExpiresAt: json['boost_expires_at'] != null
          ? DateTime.parse(json['boost_expires_at'] as String)
          : null,
    );
  }

  /// تحويل من Object إلى JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'owner_id': ownerId,
      'name': name,
      'description': description,
      'city': city,
      'status': status,
      'is_active': isActive,
      'is_verified': isVerified,
      'rating': rating,
      'followers_count': followersCount,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'store_settings': settings,
      'email': email,
      'phone': phone,
      'logo_url': logoUrl,
      'points_balance': pointsBalance,
      'is_boosted': isBoosted,
      'boost_type': boostType,
      'boost_expires_at': boostExpiresAt?.toIso8601String(),
    };
  }

  /// إنشاء نسخة معدلة من المتجر
  Store copyWith({
    String? id,
    String? ownerId,
    String? name,
    String? description,
    String? city,
    String? status,
    bool? isActive,
    bool? isVerified,
    double? rating,
    int? followersCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? settings,
    String? email,
    String? phone,
    String? logoUrl,
    int? pointsBalance,
    bool? isBoosted,
    String? boostType,
    DateTime? boostExpiresAt,
  }) {
    return Store(
      id: id ?? this.id,
      ownerId: ownerId ?? this.ownerId,
      name: name ?? this.name,
      description: description ?? this.description,
      city: city ?? this.city,
      status: status ?? this.status,
      isActive: isActive ?? this.isActive,
      isVerified: isVerified ?? this.isVerified,
      rating: rating ?? this.rating,
      followersCount: followersCount ?? this.followersCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      settings: settings ?? this.settings,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      logoUrl: logoUrl ?? this.logoUrl,
      pointsBalance: pointsBalance ?? this.pointsBalance,
      isBoosted: isBoosted ?? this.isBoosted,
      boostType: boostType ?? this.boostType,
      boostExpiresAt: boostExpiresAt ?? this.boostExpiresAt,
    );
  }

  @override
  String toString() {
    return 'Store(id: $id, name: $name, status: $status, isActive: $isActive)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is Store && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
