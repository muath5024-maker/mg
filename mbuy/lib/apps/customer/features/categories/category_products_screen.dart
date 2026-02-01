import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/platform_categories_repository.dart';
import '../../models/platform_category.dart';
import '../../models/product.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// Category Products Screen - صفحة عرض جميع منتجات الفئة
///
/// Features:
/// • Grid view of all products in the category
/// • Filter and sort options
/// • Real data from API
/// • Pagination support
/// ═══════════════════════════════════════════════════════════════════════════

class CategoryProductsScreen extends ConsumerStatefulWidget {
  final String categorySlug;

  const CategoryProductsScreen({super.key, required this.categorySlug});

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

  String _selectedSort = 'الأحدث';
  String _sortBy = 'created_at';
  bool _sortDesc = true;
  int _currentOffset = 0;
  final int _pageSize = 20;
  bool _includeSubcategories = true;

  final List<Map<String, dynamic>> _sortOptions = [
    {'label': 'الأحدث', 'sort_by': 'created_at', 'desc': true},
    {'label': 'الأقدم', 'sort_by': 'created_at', 'desc': false},
    {'label': 'السعر: من الأقل للأعلى', 'sort_by': 'price', 'desc': false},
    {'label': 'السعر: من الأعلى للأقل', 'sort_by': 'price', 'desc': true},
    {'label': 'المدعوم أولاً', 'sort_by': 'boost', 'desc': true},
  ];

  CategoryProductsArgs get _currentArgs => CategoryProductsArgs(
    categorySlug: widget.categorySlug,
    limit: _pageSize,
    offset: _currentOffset,
    sortBy: _sortBy,
    sortDesc: _sortDesc,
    includeSubcategories: _includeSubcategories,
  );

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final categoryAsync = ref.watch(
      categoryBySlugProvider(widget.categorySlug),
    );
    final productsAsync = ref.watch(categoryProductsProvider(_currentArgs));

    return Scaffold(
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      body: categoryAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => _buildErrorView(isDark, err.toString()),
        data: (category) {
          if (category == null) {
            return _buildErrorView(isDark, 'الفئة غير موجودة');
          }
          return productsAsync.when(
            loading: () => CustomScrollView(
              slivers: [
                _buildSliverAppBar(isDark, category),
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
              ],
            ),
            error: (err, _) => CustomScrollView(
              slivers: [
                _buildSliverAppBar(isDark, category),
                SliverFillRemaining(
                  child: _buildErrorView(isDark, err.toString()),
                ),
              ],
            ),
            data: (response) => _buildContent(isDark, category, response),
          );
        },
      ),
    );
  }

  Widget _buildErrorView(bool isDark, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            'خطأ',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: TextStyle(
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              ref.invalidate(categoryProductsProvider(_currentArgs));
            },
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
    bool isDark,
    PlatformCategory category,
    CategoryProductsResponse response,
  ) {
    return CustomScrollView(
      slivers: [
        // Custom App Bar
        _buildSliverAppBar(isDark, category),

        // Filter & Sort Bar
        SliverToBoxAdapter(child: _buildFilterBar(isDark)),

        // Products Count
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${response.total} منتج',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                ),
                // Include subcategories toggle
                Row(
                  children: [
                    Text(
                      'الفئات الفرعية',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.grey[400] : Colors.grey[600],
                      ),
                    ),
                    Transform.scale(
                      scale: 0.7,
                      child: Switch(
                        value: _includeSubcategories,
                        onChanged: (value) {
                          setState(() {
                            _includeSubcategories = value;
                            _currentOffset = 0;
                          });
                        },
                        activeTrackColor: _primaryTurquoise.withValues(
                          alpha: 0.5,
                        ),
                        thumbColor: WidgetStateProperty.resolveWith((states) {
                          if (states.contains(WidgetState.selected)) {
                            return _primaryTurquoise;
                          }
                          return null;
                        }),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // Products Grid
        if (response.products.isEmpty)
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.inventory_2_outlined,
                    size: 64,
                    color: isDark ? Colors.grey[700] : Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد منتجات في هذه الفئة',
                    style: TextStyle(
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          )
        else
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
                (context, index) =>
                    _buildProductCard(response.products[index], isDark),
                childCount: response.products.length,
              ),
            ),
          ),

        // Pagination
        if (response.hasMore)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _currentOffset += _pageSize;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryTurquoise,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('عرض المزيد'),
                ),
              ),
            ),
          ),

        // Bottom Spacing
        const SliverToBoxAdapter(child: SizedBox(height: 100)),
      ],
    );
  }

  Widget _buildSliverAppBar(bool isDark, PlatformCategory category) {
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
          category.name,
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
            context.push('/search');
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

  Widget _buildProductCard(Product product, bool isDark) {
    final name = product.name;
    final price = product.price;
    final originalPrice = product.originalPrice;
    final images = product.images;
    final imageUrl = images.isNotEmpty
        ? images[0]
        : (product.mainImageUrl ?? '');
    final boostType = product.boostType;
    final productId = product.id;
    final storeName = product.storeName ?? '';

    // Calculate discount
    final hasDiscount = originalPrice != null && originalPrice > price;
    final discountPercent = hasDiscount
        ? ((originalPrice - price) / originalPrice * 100).round()
        : 0;

    return GestureDetector(
      onTap: () => context.push('/product/$productId'),
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
                  imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stack) => Container(
                            color: isDark ? Colors.grey[800] : Colors.grey[100],
                            child: Icon(
                              Icons.image_outlined,
                              color: Colors.grey[400],
                              size: 40,
                            ),
                          ),
                        )
                      : Container(
                          color: isDark ? Colors.grey[800] : Colors.grey[100],
                          child: Icon(
                            Icons.image_outlined,
                            color: Colors.grey[400],
                            size: 40,
                          ),
                        ),
                  // Discount Badge
                  if (discountPercent > 0)
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
                          '$discountPercent%',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  // Boosted Badge
                  if (boostType != null)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.amber,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.star, size: 10, color: Colors.white),
                            SizedBox(width: 2),
                            Text(
                              'مميز',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Wishlist Button
                  if (boostType == null)
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
                      name,
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
                          '${price.toStringAsFixed(0)} ر.س',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                        ),
                        if (hasDiscount) ...[
                          const SizedBox(width: 6),
                          Text(
                            '${originalPrice.toStringAsFixed(0)} ر.س',
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
                    // Store name
                    if (storeName.isNotEmpty)
                      Text(
                        storeName,
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? Colors.grey[500] : Colors.grey[500],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
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
              final isSelected = option['label'] == _selectedSort;
              return ListTile(
                title: Text(
                  option['label'] as String,
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
                  setState(() {
                    _selectedSort = option['label'] as String;
                    _sortBy = option['sort_by'] as String;
                    _sortDesc = option['desc'] as bool;
                    _currentOffset = 0; // Reset to first page
                  });
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
}
