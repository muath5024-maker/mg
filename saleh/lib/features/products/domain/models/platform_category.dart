import 'package:flutter/material.dart';

/// Platform Category Model
/// فئات المنصة الرئيسية (تديرها الإدارة من mbuy-admin)
/// مختلفة عن product_categories (فئات المتجر الخاصة بكل تاجر)
class PlatformCategory {
  final String id;
  final String name;
  final String? nameEn;
  final String slug;
  final String? icon;
  final String? imageUrl;
  final String? parentId;
  final int order;
  final bool isFeatured;
  final Map<String, dynamic>? metadata;
  final List<PlatformCategory> children;

  PlatformCategory({
    required this.id,
    required this.name,
    this.nameEn,
    required this.slug,
    this.icon,
    this.imageUrl,
    this.parentId,
    this.order = 0,
    this.isFeatured = false,
    this.metadata,
    this.children = const [],
  });

  /// Get Icon from Material Icons name
  IconData get iconData {
    return _iconMap[icon] ?? Icons.category;
  }

  /// Map icon name to IconData
  static final Map<String, IconData> _iconMap = {
    'recommend': Icons.recommend,
    'star': Icons.star,
    'local_offer': Icons.local_offer,
    'devices': Icons.devices,
    'smartphone': Icons.smartphone,
    'sports_esports': Icons.sports_esports,
    'checkroom': Icons.checkroom,
    'directions_car': Icons.directions_car,
    'home': Icons.home,
    'spa': Icons.spa,
    'fitness_center': Icons.fitness_center,
    'hiking': Icons.hiking,
    'shopping_bag': Icons.shopping_bag,
    'child_care': Icons.child_care,
    'edit': Icons.edit,
    'lightbulb': Icons.lightbulb,
    'inventory_2': Icons.inventory_2,
    'category': Icons.category,
    'headphones': Icons.headphones,
    'charging_station': Icons.charging_station,
    'camera_alt': Icons.camera_alt,
    'phone_android': Icons.phone_android,
    'speaker': Icons.speaker,
    'laptop': Icons.laptop,
    'videogame_asset': Icons.videogame_asset,
    'chair': Icons.chair,
    'kitchen': Icons.kitchen,
    'yard': Icons.yard,
  };

  /// From JSON
  factory PlatformCategory.fromJson(Map<String, dynamic> json) {
    return PlatformCategory(
      id: json['id'] as String,
      name: json['name'] as String,
      nameEn: json['name_en'] as String?,
      slug: json['slug'] as String,
      icon: json['icon'] as String?,
      imageUrl: json['image_url'] as String?,
      parentId: json['parent_id'] as String?,
      order: json['order'] as int? ?? 0,
      isFeatured: json['is_featured'] as bool? ?? false,
      metadata: json['metadata'] as Map<String, dynamic>?,
      children:
          (json['children'] as List<dynamic>?)
              ?.map((e) => PlatformCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  /// To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'name_en': nameEn,
      'slug': slug,
      'icon': icon,
      'image_url': imageUrl,
      'parent_id': parentId,
      'order': order,
      'is_featured': isFeatured,
      'metadata': metadata,
      'children': children.map((c) => c.toJson()).toList(),
    };
  }

  /// Get localized name
  String getLocalizedName(String localeCode) {
    if (localeCode == 'en' && nameEn != null && nameEn!.isNotEmpty) {
      return nameEn!;
    }
    return name;
  }

  /// Check if has children
  bool get hasChildren => children.isNotEmpty;

  /// Check if is root category
  bool get isRoot => parentId == null;

  @override
  String toString() => 'PlatformCategory(id: $id, name: $name, slug: $slug)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PlatformCategory && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
