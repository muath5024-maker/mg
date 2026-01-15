import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'categories_provider.dart';
import '../../../../features/products/domain/models/platform_category.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// MBUY Categories Screen - Alibaba Style Design
///
/// Features:
/// • Split-view layout with side navigation
/// • Subcategories grid (3 columns)
/// • Verified Suppliers section
/// • Product Ideas section
/// • Real data from API
/// ═══════════════════════════════════════════════════════════════════════════

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  // Primary turquoise color from design
  static const Color _primaryTurquoise = Color(0xFF00BFA5);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _backgroundDark = Color(0xFF1A1A1A);
  static const Color _surfaceLight = Color(0xFFF5F5F5);
  static const Color _surfaceDark = Color(0xFF2D2D2D);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final state = ref.watch(categoriesScreenProvider);

    if (state.isLoading) {
      return Scaffold(
        backgroundColor: isDark ? _backgroundDark : _backgroundLight,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (state.error != null) {
      return Scaffold(
        backgroundColor: isDark ? _backgroundDark : _backgroundLight,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
              const SizedBox(height: 16),
              Text(
                'خطأ في تحميل الفئات',
                style: TextStyle(color: isDark ? Colors.white : Colors.black),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () =>
                    ref.read(categoriesScreenProvider.notifier).refresh(),
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      body: SafeArea(
        child: Row(
          children: [
            // Side Categories Navigation
            _buildSideCategories(isDark, state),

            // Main Content Area
            Expanded(child: _buildMainContent(isDark, state)),
          ],
        ),
      ),
    );
  }

  /// Side navigation with main categories (Alibaba style)
  Widget _buildSideCategories(bool isDark, CategoriesState state) {
    return Container(
      width: 90,
      decoration: BoxDecoration(color: isDark ? _surfaceDark : _surfaceLight),
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 100),
        itemCount: state.categories.length,
        itemBuilder: (context, index) {
          final isSelected = index == state.selectedIndex;
          final category = state.categories[index];

          return GestureDetector(
            onTap: () => ref
                .read(categoriesScreenProvider.notifier)
                .selectCategory(index),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
              decoration: BoxDecoration(
                color: isSelected
                    ? (isDark ? _backgroundDark : _backgroundLight)
                    : Colors.transparent,
                border: Border(
                  right: BorderSide(
                    color: isSelected ? _primaryTurquoise : Colors.transparent,
                    width: 3,
                  ),
                ),
              ),
              child: Text(
                category.name,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected
                      ? (isDark ? Colors.white : Colors.black)
                      : (isDark ? Colors.grey[400] : Colors.grey[600]),
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          );
        },
      ),
    );
  }

  /// Main scrollable content area (Alibaba style)
  Widget _buildMainContent(bool isDark, CategoriesState state) {
    return Container(
      color: isDark ? _backgroundDark : _backgroundLight,
      child: RefreshIndicator(
        onRefresh: () => ref.read(categoriesScreenProvider.notifier).refresh(),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          children: [
            // Subcategories Grid
            _buildSubcategoriesGrid(isDark, state),

            const SizedBox(height: 24),

            // Verified Suppliers Section
            _buildVerifiedSuppliersSection(isDark, state),

            const SizedBox(height: 24),

            // Product Ideas Section
            _buildProductIdeasSection(isDark, state),

            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  /// Subcategories grid (Alibaba style - 3 columns with product images)
  Widget _buildSubcategoriesGrid(bool isDark, CategoriesState state) {
    final selectedCategory = state.selectedCategory;
    if (selectedCategory == null) {
      return const SizedBox.shrink();
    }

    // Use real subcategories from API, or fallback to mock if empty
    final subcategories = selectedCategory.children;

    // If no subcategories from API, show "View All" card only
    if (subcategories.isEmpty) {
      return _buildViewAllCard(isDark, selectedCategory);
    }

    // Add "View All" card at the end
    final itemCount = subcategories.length + 1;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 16,
        childAspectRatio: 0.75,
      ),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        if (index == subcategories.length) {
          // Last item is "View All"
          return _buildSubcategoryCard(
            _SubcategoryItem('عرض الكل', '', isAllCard: true),
            isDark,
            selectedCategory,
          );
        }

        final subcat = subcategories[index];
        return _buildSubcategoryCard(
          _SubcategoryItem(
            subcat.name,
            subcat.imageUrl ?? _getDefaultImageForCategory(subcat.slug),
          ),
          isDark,
          selectedCategory,
          subcategorySlug: subcat.slug,
        );
      },
    );
  }

  Widget _buildViewAllCard(bool isDark, PlatformCategory category) {
    return GestureDetector(
      onTap: () => context.push('/category/${category.slug}/products'),
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[850] : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.grid_view_rounded,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
              size: 32,
            ),
            const SizedBox(height: 8),
            Text(
              'عرض الكل',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.grey[300] : Colors.grey[700],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Get default image URL for category based on slug
  String _getDefaultImageForCategory(String slug) {
    const defaultImages = {
      'headphones':
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'chargers':
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
      'cameras':
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
      'phone-holders':
          'https://images.unsplash.com/photo-1586953208270-767889fa9113?w=400',
      'speakers':
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      'iphone':
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
      'samsung':
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
      'huawei':
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
      'xiaomi':
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
      'cases-protectors':
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
      'laptops':
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      'playstation':
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
      'xbox':
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400',
      'gaming-accessories':
          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400',
      'blouses':
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      'dresses':
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      'pants':
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      'sportswear':
          'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400',
      'furniture':
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
      'decor':
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
      'kitchen':
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      'garden':
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
      'perfumes':
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
      'makeup':
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
      'skincare':
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
      'haircare':
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400',
    };
    return defaultImages[slug] ??
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400';
  }

  /// Single subcategory card (Alibaba style)
  Widget _buildSubcategoryCard(
    _SubcategoryItem item,
    bool isDark,
    PlatformCategory parentCategory, {
    String? subcategorySlug,
  }) {
    return GestureDetector(
      onTap: () {
        if (item.isAllCard) {
          context.push('/category/${parentCategory.slug}/products');
        } else {
          context.push(
            '/category/${subcategorySlug ?? parentCategory.slug}/products',
          );
        }
      },
      child: Column(
        children: [
          // Image container (square aspect ratio like Alibaba)
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[850] : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
                  width: 0.5,
                ),
              ),
              clipBehavior: Clip.antiAlias,
              child: item.isAllCard
                  ? Center(
                      child: Icon(
                        Icons.grid_view_rounded,
                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                        size: 32,
                      ),
                    )
                  : Image.network(
                      item.imageUrl,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stack) => Icon(
                        Icons.image_outlined,
                        color: Colors.grey[400],
                        size: 32,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 6),
          // Label
          Text(
            item.name,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.grey[300] : Colors.grey[700],
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  /// Verified Suppliers Section (Alibaba style) - Category specific
  Widget _buildVerifiedSuppliersSection(bool isDark, CategoriesState state) {
    final selectedCategory = state.selectedCategory;
    if (selectedCategory == null) return const SizedBox.shrink();

    // TODO: Load suppliers from API when available
    // For now, show placeholder based on category
    final suppliers = _getMockSuppliersForCategory(selectedCategory.slug);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.verified, color: _primaryTurquoise, size: 18),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'موردون موثقون',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
            ),
            GestureDetector(
              onTap: () =>
                  context.push('/category/${selectedCategory.slug}/suppliers'),
              child: Text(
                'عرض الكل',
                style: TextStyle(
                  fontSize: 12,
                  color: _primaryTurquoise,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 140,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: suppliers.length,
            itemBuilder: (context, index) {
              final supplier = suppliers[index];
              return _buildSupplierCard(
                supplier.name,
                supplier.imageUrl,
                isDark,
              );
            },
          ),
        ),
      ],
    );
  }

  /// Get mock suppliers for category (temporary until API is ready)
  List<_SupplierItem> _getMockSuppliersForCategory(String slug) {
    const defaultImage =
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400';
    return [
      _SupplierItem('متجر موثق 1', defaultImage),
      _SupplierItem('متجر موثق 2', defaultImage),
      _SupplierItem('متجر موثق 3', defaultImage),
    ];
  }

  /// Single supplier card
  Widget _buildSupplierCard(String name, String imageUrl, bool isDark) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(left: 12),
      decoration: BoxDecoration(
        color: isDark ? _surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stack) => Container(
                color: isDark ? Colors.grey[800] : Colors.grey[100],
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.7),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            right: 8,
            left: 8,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _primaryTurquoise,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, color: Colors.white, size: 10),
                          SizedBox(width: 2),
                          Text(
                            'موثق',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Product Ideas Section (Alibaba style) - Category specific
  Widget _buildProductIdeasSection(bool isDark, CategoriesState state) {
    final selectedCategory = state.selectedCategory;
    if (selectedCategory == null) return const SizedBox.shrink();

    // TODO: Load products from API when available
    // For now, show placeholder products
    final products = _getMockProductsForCategory(selectedCategory.slug);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'أفكار ملهمة للمنتجات',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
            ),
            GestureDetector(
              onTap: () =>
                  context.push('/category/${selectedCategory.slug}/products'),
              child: Text(
                'عرض الكل',
                style: TextStyle(
                  fontSize: 12,
                  color: _primaryTurquoise,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.65,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            return _buildProductCard(products[index], isDark);
          },
        ),
      ],
    );
  }

  /// Get mock products for category (temporary until API is ready)
  List<_ProductItem> _getMockProductsForCategory(String slug) {
    const defaultImage =
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400';
    return [
      _ProductItem('منتج 1', defaultImage, '99 ر.س', '149 ر.س'),
      _ProductItem('منتج 2', defaultImage, '150 ر.س', '200 ر.س'),
      _ProductItem('منتج 3', defaultImage, '89 ر.س', '120 ر.س'),
      _ProductItem('منتج 4', defaultImage, '199 ر.س', '250 ر.س'),
    ];
  }

  /// Product card (Alibaba style)
  Widget _buildProductCard(_ProductItem item, bool isDark) {
    return GestureDetector(
      onTap: () {
        context.push('/product/${item.name}');
      },
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? _surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              flex: 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    item.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stack) => Container(
                      color: isDark ? Colors.grey[800] : Colors.grey[100],
                      child: Icon(
                        Icons.image_outlined,
                        color: Colors.grey[400],
                        size: 40,
                      ),
                    ),
                  ),
                  // Camera search icon (like Alibaba)
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(
                        Icons.camera_alt_outlined,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Product Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Price
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          item.price,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          item.oldPrice,
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[500],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ),
                    // Min order
                    Text(
                      'الحد الأدنى للطلب: 1 قطعة',
                      style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Data Classes
// ═══════════════════════════════════════════════════════════════════════════

class _SupplierItem {
  final String name;
  final String imageUrl;
  _SupplierItem(this.name, this.imageUrl);
}

class _SubcategoryItem {
  final String name;
  final String imageUrl;
  final bool isAllCard;
  _SubcategoryItem(this.name, this.imageUrl, {this.isAllCard = false});
}

class _ProductItem {
  final String name;
  final String imageUrl;
  final String price;
  final String oldPrice;
  _ProductItem(this.name, this.imageUrl, this.price, this.oldPrice);
}
