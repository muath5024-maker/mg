/// Platform Category Model - نموذج فئة المنصة
///
/// Represents a platform-level category with subcategories support
library;

class PlatformCategory {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? imageUrl;
  final String? iconUrl;
  final String? parentId;
  final int sortOrder;
  final bool isActive;
  final int? productsCount;
  final List<PlatformCategory> children;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  PlatformCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.imageUrl,
    this.iconUrl,
    this.parentId,
    this.sortOrder = 0,
    this.isActive = true,
    this.productsCount,
    this.children = const [],
    this.createdAt,
    this.updatedAt,
  });

  /// Alias for iconUrl (backwards compatibility)
  String? get icon => iconUrl;

  /// Create PlatformCategory from JSON
  factory PlatformCategory.fromJson(Map<String, dynamic> json) {
    List<PlatformCategory> children = [];
    if (json['children'] != null && json['children'] is List) {
      children = (json['children'] as List)
          .map((e) => PlatformCategory.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    // Also check for subcategories key
    if (json['subcategories'] != null && json['subcategories'] is List) {
      children = (json['subcategories'] as List)
          .map((e) => PlatformCategory.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return PlatformCategory(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug:
          json['slug'] ??
          json['name']?.toString().toLowerCase().replaceAll(' ', '-') ??
          '',
      description: json['description'],
      imageUrl: json['image_url'] ?? json['imageUrl'],
      iconUrl: json['icon_url'] ?? json['icon'],
      parentId: json['parent_id']?.toString(),
      sortOrder: json['sort_order'] ?? json['order'] ?? 0,
      isActive: json['is_active'] ?? true,
      productsCount: json['products_count'],
      children: children,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'image_url': imageUrl,
      'icon_url': iconUrl,
      'parent_id': parentId,
      'sort_order': sortOrder,
      'is_active': isActive,
      'products_count': productsCount,
      'children': children.map((c) => c.toJson()).toList(),
    };
  }

  /// Check if this is a root category
  bool get isRoot => parentId == null;

  /// Check if category has children
  bool get hasChildren => children.isNotEmpty;

  /// Copy with modifications
  PlatformCategory copyWith({
    String? id,
    String? name,
    String? slug,
    String? description,
    String? imageUrl,
    String? iconUrl,
    String? parentId,
    int? sortOrder,
    bool? isActive,
    int? productsCount,
    List<PlatformCategory>? children,
  }) {
    return PlatformCategory(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      iconUrl: iconUrl ?? this.iconUrl,
      parentId: parentId ?? this.parentId,
      sortOrder: sortOrder ?? this.sortOrder,
      isActive: isActive ?? this.isActive,
      productsCount: productsCount ?? this.productsCount,
      children: children ?? this.children,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PlatformCategory &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'PlatformCategory($id: $name)';
}
