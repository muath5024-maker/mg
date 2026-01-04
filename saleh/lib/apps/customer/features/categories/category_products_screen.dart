import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// Category Products Screen - صفحة عرض جميع منتجات الفئة
///
/// Features:
/// • Grid view of all products in the category
/// • Filter and sort options
/// • Category-specific products only
/// ═══════════════════════════════════════════════════════════════════════════

class CategoryProductsScreen extends ConsumerStatefulWidget {
  final String categoryName;

  const CategoryProductsScreen({super.key, required this.categoryName});

  @override
  ConsumerState<CategoryProductsScreen> createState() =>
      _CategoryProductsScreenState();
}

class _CategoryProductsScreenState
    extends ConsumerState<CategoryProductsScreen> {
  // Primary turquoise color from design
  static const Color _primaryTurquoise = Color(0xFF00BFA5);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _backgroundDark = Color(0xFF1A1A1A);
  static const Color _surfaceLight = Color(0xFFF5F5F5);
  static const Color _surfaceDark = Color(0xFF2D2D2D);

  String _selectedSort = 'الأكثر مبيعاً';
  final List<String> _sortOptions = [
    'الأكثر مبيعاً',
    'الأحدث',
    'السعر: من الأقل للأعلى',
    'السعر: من الأعلى للأقل',
    'التقييم',
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final products = _getProductsForCategory(widget.categoryName);

    return Scaffold(
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      body: CustomScrollView(
        slivers: [
          // Custom App Bar
          _buildSliverAppBar(isDark),

          // Filter & Sort Bar
          SliverToBoxAdapter(child: _buildFilterBar(isDark)),

          // Products Count
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                '${products.length} منتج',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                ),
              ),
            ),
          ),

          // Products Grid
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.65,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildProductCard(products[index], isDark),
                childCount: products.length,
              ),
            ),
          ),

          // Bottom Spacing
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(bool isDark) {
    return SliverAppBar(
      expandedHeight: 120,
      floating: true,
      pinned: true,
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      leading: IconButton(
        icon: Icon(
          Icons.arrow_back_ios,
          color: isDark ? Colors.white : Colors.black,
        ),
        onPressed: () => context.pop(),
      ),
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: true,
        title: Text(
          widget.categoryName,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                _primaryTurquoise.withValues(alpha: 0.2),
                isDark ? _backgroundDark : _backgroundLight,
              ],
            ),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.search, color: isDark ? Colors.white : Colors.black),
          onPressed: () {
            // TODO: Implement search
          },
        ),
        IconButton(
          icon: Icon(
            Icons.filter_list,
            color: isDark ? Colors.white : Colors.black,
          ),
          onPressed: () => _showFilterBottomSheet(isDark),
        ),
      ],
    );
  }

  Widget _buildFilterBar(bool isDark) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          // Sort Chip
          _buildFilterChip(
            icon: Icons.sort,
            label: _selectedSort,
            onTap: () => _showSortBottomSheet(isDark),
            isDark: isDark,
            isSelected: true,
          ),
          const SizedBox(width: 8),
          // Price Range
          _buildFilterChip(
            icon: Icons.attach_money,
            label: 'السعر',
            onTap: () {},
            isDark: isDark,
          ),
          const SizedBox(width: 8),
          // Rating
          _buildFilterChip(
            icon: Icons.star_outline,
            label: 'التقييم',
            onTap: () {},
            isDark: isDark,
          ),
          const SizedBox(width: 8),
          // Free Shipping
          _buildFilterChip(
            icon: Icons.local_shipping_outlined,
            label: 'شحن مجاني',
            onTap: () {},
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
    bool isSelected = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? _primaryTurquoise.withValues(alpha: 0.1)
              : (isDark ? _surfaceDark : _surfaceLight),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? _primaryTurquoise
                : (isDark ? Colors.grey[700]! : Colors.grey[300]!),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? _primaryTurquoise
                  : (isDark ? Colors.grey[400] : Colors.grey[600]),
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isSelected
                    ? _primaryTurquoise
                    : (isDark ? Colors.grey[300] : Colors.grey[700]),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 4),
              Icon(
                Icons.keyboard_arrow_down,
                size: 16,
                color: _primaryTurquoise,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(_ProductData product, bool isDark) {
    return GestureDetector(
      onTap: () => context.push('/product/${product.name}'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? _surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
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
                    product.imageUrl,
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
                  // Discount Badge
                  if (product.discount > 0)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '${product.discount}%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  // Wishlist Button
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.favorite_border,
                        size: 18,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                  // Free Shipping Badge
                  if (product.freeShipping)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: _primaryTurquoise,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'شحن مجاني',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
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
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Product Name
                    Text(
                      product.name,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    // Price
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          product.price,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                        if (product.oldPrice.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Text(
                            product.oldPrice,
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.grey[500],
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Rating & Sold
                    Row(
                      children: [
                        Icon(Icons.star, size: 12, color: Colors.amber[600]),
                        const SizedBox(width: 2),
                        Text(
                          product.rating.toString(),
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? Colors.grey[400] : Colors.grey[600],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${product.sold} مبيعات',
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.grey[500] : Colors.grey[500],
                          ),
                        ),
                      ],
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

  void _showSortBottomSheet(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? _surfaceDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ترتيب حسب',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black,
              ),
            ),
            const SizedBox(height: 16),
            ...List.generate(_sortOptions.length, (index) {
              final option = _sortOptions[index];
              final isSelected = option == _selectedSort;
              return ListTile(
                title: Text(
                  option,
                  style: TextStyle(
                    color: isSelected
                        ? _primaryTurquoise
                        : (isDark ? Colors.white : Colors.black),
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                ),
                trailing: isSelected
                    ? const Icon(Icons.check, color: _primaryTurquoise)
                    : null,
                onTap: () {
                  setState(() => _selectedSort = option);
                  Navigator.pop(context);
                },
              );
            }),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _showFilterBottomSheet(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? _surfaceDark : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'تصفية النتائج',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'إعادة تعيين',
                      style: TextStyle(color: _primaryTurquoise),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    // Price Range Section
                    _buildFilterSection(
                      'نطاق السعر',
                      isDark,
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'من',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'إلى',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Rating Section
                    _buildFilterSection(
                      'التقييم',
                      isDark,
                      child: Wrap(
                        spacing: 8,
                        children: List.generate(5, (index) {
                          final stars = 5 - index;
                          return FilterChip(
                            label: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('$stars'),
                                const SizedBox(width: 2),
                                const Icon(
                                  Icons.star,
                                  size: 14,
                                  color: Colors.amber,
                                ),
                                const Text(' فأكثر'),
                              ],
                            ),
                            selected: false,
                            onSelected: (selected) {},
                          );
                        }),
                      ),
                    ),
                  ],
                ),
              ),
              // Apply Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryTurquoise,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'تطبيق الفلتر',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterSection(
    String title,
    bool isDark, {
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        const SizedBox(height: 12),
        child,
      ],
    );
  }

  // Get products for specific category
  List<_ProductData> _getProductsForCategory(String categoryName) {
    final productsMap = {
      'لك': [
        _ProductData(
          'منتج مقترح لك',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
          '99 ر.س',
          '149 ر.س',
          4.5,
          120,
          33,
          true,
        ),
        _ProductData(
          'اختيار خاص',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
          '150 ر.س',
          '200 ر.س',
          4.7,
          85,
          25,
          false,
        ),
        _ProductData(
          'الأكثر زيارة',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
          '89 ر.س',
          '120 ر.س',
          4.3,
          200,
          25,
          true,
        ),
        _ProductData(
          'توصية اليوم',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '199 ر.س',
          '250 ر.س',
          4.8,
          150,
          20,
          false,
        ),
        _ProductData(
          'منتج شائع',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
          '250 ر.س',
          '300 ر.س',
          4.6,
          95,
          16,
          true,
        ),
        _ProductData(
          'اكتشاف جديد',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
          '180 ر.س',
          '220 ر.س',
          4.4,
          67,
          18,
          false,
        ),
      ],
      'مميز': [
        _ProductData(
          'الأكثر مبيعاً',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '299 ر.س',
          '399 ر.س',
          4.9,
          500,
          25,
          true,
        ),
        _ProductData(
          'منتج مميز',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
          '450 ر.س',
          '599 ر.س',
          4.8,
          320,
          25,
          false,
        ),
        _ProductData(
          'اختيار المحررين',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
          '180 ر.س',
          '250 ر.س',
          4.7,
          180,
          28,
          true,
        ),
        _ProductData(
          'جديد ومميز',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
          '320 ر.س',
          '400 ر.س',
          4.6,
          140,
          20,
          false,
        ),
      ],
      'عروض': [
        _ProductData(
          'خصم 50%',
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
          '99 ر.س',
          '199 ر.س',
          4.5,
          800,
          50,
          true,
        ),
        _ProductData(
          'عرض محدود',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
          '149 ر.س',
          '299 ر.س',
          4.6,
          450,
          50,
          true,
        ),
        _ProductData(
          'تصفية نهائية',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
          '79 ر.س',
          '159 ر.س',
          4.3,
          320,
          50,
          false,
        ),
        _ProductData(
          'سعر خاص',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '199 ر.س',
          '350 ر.س',
          4.7,
          250,
          43,
          true,
        ),
        _ProductData(
          'عرض اليوم',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
          '120 ر.س',
          '240 ر.س',
          4.4,
          180,
          50,
          false,
        ),
        _ProductData(
          'صفقة رائعة',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
          '89 ر.س',
          '150 ر.س',
          4.5,
          290,
          40,
          true,
        ),
      ],
      'الكترونيات': [
        _ProductData(
          'سماعات بلوتوث',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          '199 ر.س',
          '249 ر.س',
          4.6,
          320,
          20,
          true,
        ),
        _ProductData(
          'شاحن سريع',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
          '89 ر.س',
          '120 ر.س',
          4.4,
          450,
          25,
          false,
        ),
        _ProductData(
          'كاميرا ديجيتال',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
          '1200 ر.س',
          '1500 ر.س',
          4.8,
          85,
          20,
          true,
        ),
        _ProductData(
          'مكبر صوت',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
          '350 ر.س',
          '450 ر.س',
          4.5,
          190,
          22,
          false,
        ),
        _ProductData(
          'سماعات سلكية',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
          '79 ر.س',
          '99 ر.س',
          4.3,
          520,
          20,
          true,
        ),
        _ProductData(
          'باور بانك',
          'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
          '120 ر.س',
          '180 ر.س',
          4.6,
          380,
          33,
          false,
        ),
        _ProductData(
          'ميكروفون USB',
          'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
          '250 ر.س',
          '350 ر.س',
          4.7,
          120,
          28,
          true,
        ),
        _ProductData(
          'كيبل شحن',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          '35 ر.س',
          '55 ر.س',
          4.2,
          890,
          36,
          false,
        ),
      ],
      'الجوالات': [
        _ProductData(
          'آيفون 15',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
          '3999 ر.س',
          '4500 ر.س',
          4.9,
          250,
          11,
          true,
        ),
        _ProductData(
          'سامسونج S24',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
          '3500 ر.س',
          '4000 ر.س',
          4.8,
          180,
          12,
          true,
        ),
        _ProductData(
          'كفر حماية',
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
          '49 ر.س',
          '79 ر.س',
          4.4,
          620,
          38,
          false,
        ),
        _ProductData(
          'شاحن جوال',
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
          '79 ر.س',
          '99 ر.س',
          4.5,
          480,
          20,
          true,
        ),
        _ProductData(
          'سكرين حماية',
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
          '35 ر.س',
          '55 ر.س',
          4.3,
          720,
          36,
          false,
        ),
        _ProductData(
          'حامل جوال',
          'https://images.unsplash.com/photo-1586953208270-767889fa9113?w=400',
          '45 ر.س',
          '69 ر.س',
          4.4,
          350,
          34,
          true,
        ),
      ],
      'الكمبيوتر وألعاب الفيديو': [
        _ProductData(
          'لابتوب قيمنق',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          '4500 ر.س',
          '5500 ر.س',
          4.8,
          120,
          18,
          true,
        ),
        _ProductData(
          'بلايستيشن 5',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
          '2199 ر.س',
          '2500 ر.س',
          4.9,
          280,
          12,
          true,
        ),
        _ProductData(
          'يد تحكم',
          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400',
          '299 ر.س',
          '399 ر.س',
          4.6,
          450,
          25,
          false,
        ),
        _ProductData(
          'ماوس قيمنق',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400',
          '199 ر.س',
          '280 ر.س',
          4.5,
          380,
          28,
          true,
        ),
        _ProductData(
          'كيبورد ميكانيكي',
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
          '350 ر.س',
          '500 ر.س',
          4.7,
          220,
          30,
          false,
        ),
        _ProductData(
          'شاشة قيمنق',
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
          '1500 ر.س',
          '2000 ر.س',
          4.8,
          95,
          25,
          true,
        ),
      ],
      'الملابس وإكسسواراتها': [
        _ProductData(
          'بلوزة أنيقة',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          '120 ر.س',
          '180 ر.س',
          4.5,
          280,
          33,
          true,
        ),
        _ProductData(
          'فستان سهرة',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          '450 ر.س',
          '650 ر.س',
          4.7,
          150,
          30,
          false,
        ),
        _ProductData(
          'بنطال جينز',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
          '180 ر.س',
          '250 ر.س',
          4.4,
          420,
          28,
          true,
        ),
        _ProductData(
          'جاكيت شتوي',
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
          '350 ر.س',
          '500 ر.س',
          4.6,
          180,
          30,
          false,
        ),
        _ProductData(
          'تيشيرت قطن',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          '79 ر.س',
          '99 ر.س',
          4.3,
          650,
          20,
          true,
        ),
        _ProductData(
          'قميص رسمي',
          'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400',
          '150 ر.س',
          '200 ر.س',
          4.5,
          320,
          25,
          false,
        ),
      ],
      'زينة وقطع السيارات': [
        _ProductData(
          'حامل جوال للسيارة',
          'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
          '49 ر.س',
          '79 ر.س',
          4.4,
          580,
          38,
          true,
        ),
        _ProductData(
          'معطر سيارة',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
          '29 ر.س',
          '45 ر.س',
          4.2,
          890,
          35,
          false,
        ),
        _ProductData(
          'غطاء مقاعد',
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
          '199 ر.س',
          '299 ر.س',
          4.5,
          220,
          33,
          true,
        ),
        _ProductData(
          'زيت محرك',
          'https://images.unsplash.com/photo-1635784063388-1ff609e86a7b?w=400',
          '120 ر.س',
          '150 ر.س',
          4.7,
          380,
          20,
          false,
        ),
      ],
      'المنزل والحديقة': [
        _ProductData(
          'كنبة مودرن',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
          '2500 ر.س',
          '3500 ر.س',
          4.7,
          85,
          28,
          true,
        ),
        _ProductData(
          'طقم ديكور',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
          '350 ر.س',
          '500 ر.س',
          4.5,
          190,
          30,
          false,
        ),
        _ProductData(
          'أدوات مطبخ',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
          '199 ر.س',
          '280 ر.س',
          4.4,
          320,
          28,
          true,
        ),
        _ProductData(
          'أدوات حديقة',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          '89 ر.س',
          '130 ر.س',
          4.3,
          250,
          31,
          false,
        ),
      ],
      'الجمال': [
        _ProductData(
          'عطر فاخر',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
          '450 ر.س',
          '650 ر.س',
          4.8,
          280,
          30,
          true,
        ),
        _ProductData(
          'طقم مكياج',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
          '299 ر.س',
          '450 ر.س',
          4.6,
          420,
          33,
          false,
        ),
        _ProductData(
          'كريم بشرة',
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
          '149 ر.س',
          '200 ر.س',
          4.5,
          580,
          25,
          true,
        ),
        _ProductData(
          'سيروم شعر',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400',
          '89 ر.س',
          '130 ر.س',
          4.4,
          450,
          31,
          false,
        ),
      ],
      'الصحة والرياضة': [
        _ProductData(
          'جهاز مشي',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
          '1800 ر.س',
          '2500 ر.س',
          4.7,
          120,
          28,
          true,
        ),
        _ProductData(
          'بروتين',
          'https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=400',
          '180 ر.س',
          '250 ر.س',
          4.5,
          650,
          28,
          false,
        ),
        _ProductData(
          'ملابس رياضية',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
          '150 ر.س',
          '220 ر.س',
          4.4,
          380,
          31,
          true,
        ),
        _ProductData(
          'حذاء رياضي',
          'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400',
          '350 ر.س',
          '500 ر.س',
          4.6,
          290,
          30,
          false,
        ),
      ],
      'الكشتة والرحلات': [
        _ProductData(
          'خيمة تخييم',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
          '450 ر.س',
          '650 ر.س',
          4.6,
          180,
          30,
          true,
        ),
        _ProductData(
          'كشاف LED',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400',
          '79 ر.س',
          '120 ر.س',
          4.4,
          420,
          34,
          false,
        ),
        _ProductData(
          'حقيبة سفر',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          '350 ر.س',
          '500 ر.س',
          4.5,
          280,
          30,
          true,
        ),
        _ProductData(
          'كرسي قابل للطي',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
          '120 ر.س',
          '180 ر.س',
          4.3,
          350,
          33,
          false,
        ),
      ],
      'الشنط والإكسسوارات': [
        _ProductData(
          'شنطة يد',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
          '320 ر.س',
          '450 ر.س',
          4.6,
          250,
          28,
          true,
        ),
        _ProductData(
          'محفظة جلد',
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
          '150 ر.س',
          '220 ر.س',
          4.5,
          420,
          31,
          false,
        ),
        _ProductData(
          'نظارة شمسية',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
          '180 ر.س',
          '280 ر.س',
          4.4,
          380,
          35,
          true,
        ),
        _ProductData(
          'ساعة ذكية',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          '450 ر.س',
          '650 ر.س',
          4.7,
          190,
          30,
          false,
        ),
      ],
      'الأطفال': [
        _ProductData(
          'طقم ملابس أطفال',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
          '120 ر.س',
          '180 ر.س',
          4.5,
          320,
          33,
          true,
        ),
        _ProductData(
          'لعبة تعليمية',
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
          '89 ر.س',
          '130 ر.س',
          4.6,
          480,
          31,
          false,
        ),
        _ProductData(
          'عربة أطفال',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
          '850 ر.س',
          '1200 ر.س',
          4.7,
          150,
          29,
          true,
        ),
        _ProductData(
          'حفاضات',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
          '79 ر.س',
          '99 ر.س',
          4.4,
          890,
          20,
          false,
        ),
      ],
      'اللوازم الدراسية والمكتبية': [
        _ProductData(
          'حقيبة مدرسية',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          '150 ر.س',
          '220 ر.س',
          4.5,
          450,
          31,
          true,
        ),
        _ProductData(
          'طقم أقلام',
          'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400',
          '49 ر.س',
          '79 ر.س',
          4.3,
          680,
          38,
          false,
        ),
        _ProductData(
          'دفاتر ملونة',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
          '35 ر.س',
          '55 ر.س',
          4.2,
          520,
          36,
          true,
        ),
        _ProductData(
          'منظم مكتب',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
          '89 ر.س',
          '130 ر.س',
          4.4,
          280,
          31,
          false,
        ),
      ],
      'الإنارة والمصابيح': [
        _ProductData(
          'ثريا مودرن',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
          '650 ر.س',
          '900 ر.س',
          4.6,
          120,
          27,
          true,
        ),
        _ProductData(
          'إضاءة خارجية',
          'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400',
          '180 ر.س',
          '280 ر.س',
          4.4,
          220,
          35,
          false,
        ),
        _ProductData(
          'شريط LED',
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
          '79 ر.س',
          '120 ر.س',
          4.5,
          480,
          34,
          true,
        ),
        _ProductData(
          'مصباح مكتب',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
          '120 ر.س',
          '180 ر.س',
          4.3,
          350,
          33,
          false,
        ),
      ],
      'المواد الخام': [
        _ProductData(
          'قماش قطني',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
          '45 ر.س',
          '70 ر.س',
          4.4,
          280,
          35,
          true,
        ),
        _ProductData(
          'جلد طبيعي',
          'https://images.unsplash.com/photo-1531819571556-12f47a3d0f31?w=400',
          '180 ر.س',
          '250 ر.س',
          4.6,
          150,
          28,
          false,
        ),
        _ProductData(
          'خيوط صوف',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          '35 ر.س',
          '55 ر.س',
          4.3,
          420,
          36,
          true,
        ),
        _ProductData(
          'قماش حرير',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
          '120 ر.س',
          '180 ر.س',
          4.5,
          180,
          33,
          false,
        ),
      ],
    };

    return productsMap[categoryName] ?? [];
  }
}

// Product Data Model
class _ProductData {
  final String name;
  final String imageUrl;
  final String price;
  final String oldPrice;
  final double rating;
  final int sold;
  final int discount;
  final bool freeShipping;

  _ProductData(
    this.name,
    this.imageUrl,
    this.price,
    this.oldPrice,
    this.rating,
    this.sold,
    this.discount,
    this.freeShipping,
  );
}
