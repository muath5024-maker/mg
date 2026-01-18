import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// صفحة المتجر - تصميم مشابه لـ SHEIN
class StorePageScreen extends ConsumerStatefulWidget {
  final String storeId;

  const StorePageScreen({super.key, required this.storeId});

  @override
  ConsumerState<StorePageScreen> createState() => _StorePageScreenState();
}

class _StorePageScreenState extends ConsumerState<StorePageScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late TabController _contentTabController;
  late ScrollController _scrollController;
  bool _isFollowing = false;
  bool _isCollapsed = false;

  static const Color _primaryColor = Color(0xFF00BFA5);

  // بيانات المتجر (TODO: Replace with API)
  late final Store _store = Store(
    id: widget.storeId,
    name: 'AKNOTIC',
    description:
        'خزانة ملابس الرجل العصري تبدأ وتنتهي هنا. موديلات راقية مصممه للحياة الحضرية.',
    logoUrl: 'https://picsum.photos/100?random=110',
    coverUrl: 'https://picsum.photos/800/400?random=111',
    rating: 4.87,
    reviewsCount: 1700,
    followersCount: 165000,
    productsCount: 1700,
    soldCount: 99000,
    repeatBuyersCount: 40000,
    isVerified: true,
    isTrending: true,
    categories: [
      StoreCategory(
        name: 'ملابس منسوجة رجالية',
        imageUrl: 'https://picsum.photos/60?random=1',
      ),
      StoreCategory(
        name: 'معاطف وجاكيتات رجال',
        imageUrl: 'https://picsum.photos/60?random=2',
      ),
      StoreCategory(
        name: 'ملابس رجال',
        imageUrl: 'https://picsum.photos/60?random=3',
      ),
      StoreCategory(
        name: 'ملابس علوية',
        imageUrl: 'https://picsum.photos/60?random=4',
      ),
      StoreCategory(
        name: 'ملابس سفلى للرجل',
        imageUrl: 'https://picsum.photos/60?random=5',
      ),
    ],
    bannerImages: [
      'https://picsum.photos/400/500?random=20',
      'https://picsum.photos/400/500?random=21',
      'https://picsum.photos/400/500?random=22',
    ],
    joinedDate: DateTime(2024, 1, 15),
  );

  final List<StoreProduct> _products = List.generate(
    12,
    (index) => StoreProduct(
      id: 'p$index',
      name: 'AKNOTIC Business Casual كنزة...',
      imageUrl: 'https://picsum.photos/200/300?random=${120 + index}',
      price: 52.80 + (index * 10),
      originalPrice: 66.00 + (index * 10),
      soldCount: 80 + (index * 5),
      hasDiscount: index % 2 == 0,
      discountPercent: 20,
      isTrending: index % 3 == 0,
      badge: index % 4 == 0 ? '#5 الأفضل مبيعاً' : null,
    ),
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _contentTabController = TabController(length: 2, vsync: this);
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final isCollapsed = _scrollController.offset > 200;
    if (isCollapsed != _isCollapsed) {
      setState(() => _isCollapsed = isCollapsed);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _contentTabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? theme.scaffoldBackgroundColor
          : Colors.grey[100],
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // Header with Search
            SliverAppBar(
              backgroundColor: _primaryColor,
              pinned: true,
              expandedHeight: 0,
              automaticallyImplyLeading: false,
              leading: _isCollapsed
                  ? null
                  : IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.chevron_right,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      onPressed: () => context.pop(),
                    ),
              leadingWidth: _isCollapsed ? 0 : 56,
              titleSpacing: 0,
              title: _isCollapsed ? _buildCollapsedHeader(context) : null,
              actions: _isCollapsed
                  ? null
                  : [
                      // Search Button
                      IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.search,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        onPressed: () =>
                            context.push('/search?store=${_store.id}'),
                      ),
                      // Follow Button in Header
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: _buildFollowButtonSmall(),
                      ),
                    ],
            ),

            // Store Info Section
            if (!_isCollapsed)
              SliverToBoxAdapter(child: _buildStoreInfoSection()),

            // Discount Banner
            SliverToBoxAdapter(child: _buildDiscountBanner()),

            // Tab Bar
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: isDark ? Colors.white : Colors.black,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: _primaryColor,
                  indicatorWeight: 3,
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold),
                  tabs: const [
                    Tab(text: 'منتجات'),
                    Tab(text: 'عروض'),
                    Tab(text: 'مراجعات'),
                    Tab(text: 'محتوى'),
                  ],
                ),
                isDark: isDark,
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildProductsTab(),
            _buildOffersTab(),
            _buildReviewsTab(),
            _buildContentTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowButtonSmall() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _isFollowing
            ? Colors.white.withValues(alpha: 0.2)
            : Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: GestureDetector(
        onTap: () => setState(() => _isFollowing = !_isFollowing),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!_isFollowing)
              const Icon(Icons.add, size: 14, color: Colors.black),
            Text(
              _isFollowing ? 'متابَع' : 'متابع',
              style: TextStyle(
                color: _isFollowing ? Colors.white : Colors.black,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCollapsedHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          // Back Button
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.chevron_right,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Store Info
          Expanded(
            child: GestureDetector(
              onTap: () => _showStoreInfoSheet(),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundImage: NetworkImage(_store.logoUrl),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                _store.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(
                              Icons.chevron_left,
                              color: Colors.white70,
                              size: 16,
                            ),
                          ],
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${_store.rating}',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontSize: 11,
                              ),
                            ),
                            const Text(
                              ' ★ ',
                              style: TextStyle(
                                color: Colors.amber,
                                fontSize: 10,
                              ),
                            ),
                            Text(
                              '${_formatNumber(_store.followersCount)} متابعون',
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Search Icon
          GestureDetector(
            onTap: () => context.push('/search?store=${_store.id}'),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 8),
          // Follow Button
          _buildFollowButtonSmall(),
        ],
      ),
    );
  }

  Widget _buildStoreInfoSection() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => _showStoreInfoSheet(),
      child: Container(
        padding: const EdgeInsets.all(16),
        color: isDark ? theme.cardColor : Colors.white,
        child: Column(
          children: [
            Row(
              children: [
                // Follow Button
                _buildFollowButton(),
                const Spacer(),
                // Store Info
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        Text(
                          _store.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_left, size: 20),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          '${_store.rating} ★',
                          style: const TextStyle(
                            color: Colors.amber,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${_formatNumber(_store.followersCount)} متابعون',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                // Logo with Badge
                Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.grey[300]!, width: 1),
                      ),
                      child: CircleAvatar(
                        radius: 28,
                        backgroundImage: NetworkImage(_store.logoUrl),
                      ),
                    ),
                    if (_store.isTrending)
                      Positioned(
                        bottom: -2,
                        right: 0,
                        left: 0,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.orange,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'ترندات',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Stats Row
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  '+${_formatNumber(_store.repeatBuyersCount)} إعادة الشراء',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.person, color: Colors.orange, size: 14),
                const SizedBox(width: 16),
                Text(
                  '+${_formatNumber(_store.soldCount)} تم البيع مؤخراً',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                const SizedBox(width: 4),
                const Text('🔥', style: TextStyle(fontSize: 12)),
              ],
            ),
            const SizedBox(height: 12),
            // Trending Badge
            if (_store.isTrending)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Icon(
                      Icons.chevron_left,
                      size: 16,
                      color: Colors.grey,
                    ),
                    const Spacer(),
                    const Text(
                      'تم اختيار هذا المتجر كـ',
                      style: TextStyle(fontSize: 12),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      '「متجر الترندات」',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'ترندات',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFollowButton({bool small = false}) {
    return OutlinedButton(
      onPressed: () {
        setState(() => _isFollowing = !_isFollowing);
      },
      style: OutlinedButton.styleFrom(
        backgroundColor: _isFollowing ? Colors.grey[200] : Colors.white,
        side: BorderSide(color: _isFollowing ? Colors.grey : Colors.black),
        padding: EdgeInsets.symmetric(
          horizontal: small ? 12 : 16,
          vertical: small ? 4 : 8,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!_isFollowing) ...[
            const Icon(Icons.add, size: 16, color: Colors.black),
            const SizedBox(width: 4),
          ],
          Text(
            _isFollowing ? 'متابَع' : 'متابع',
            style: TextStyle(
              color: _isFollowing ? Colors.grey[700] : Colors.black,
              fontSize: small ? 12 : 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDiscountBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.white,
      child: Row(
        children: [
          const Icon(Icons.chevron_left, size: 16, color: Colors.grey),
          const Spacer(),
          const Text(
            'العربية: الحصول على خصم 20.00%',
            style: TextStyle(fontSize: 12),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.check, size: 14, color: _primaryColor),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.red.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Column(
              children: [
                const Text(
                  'خصم 20.00%',
                  style: TextStyle(
                    color: Colors.red,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'طلبات +0.00﷼',
                  style: TextStyle(color: Colors.grey[600], fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsTab() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // استخدام Column بسيط بدلاً من NestedScrollView لتجنب تعارض السكرول
    return Column(
      children: [
        // قسم الفئات (ثابت في الأعلى)
        _CategoriesHeader(categories: _store.categories, isDark: isDark),
        // Products Grid
        Expanded(child: _buildMasonryGrid()),
        // Bottom Discount Tabs
        Container(
          height: 40,
          color: isDark ? theme.cardColor : Colors.white,
          child: ListView(
            scrollDirection: Axis.horizontal,
            reverse: true,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            children: [
              _buildDiscountTab('خصم 20%', isSelected: true),
              _buildDiscountTab('خصم حتى 50%'),
              _buildDiscountTab('خصم 50%'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMasonryGrid() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(8),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.55,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            delegate: SliverChildBuilderDelegate(
              (context, index) =>
                  _buildProductCard(_products[index % _products.length], index),
              childCount: _products.length,
            ),
          ),
        ),
        // Follow Banner
        SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? theme.cardColor : Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (_store.isTrending)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'ترندات',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    const SizedBox(width: 8),
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(_store.logoUrl),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _store.name,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'تابعنا للحصول على الوافدين الجدد والعروض الترويجية',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.grey[400] : Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () =>
                        setState(() => _isFollowing = !_isFollowing),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? _primaryColor : Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(
                      _isFollowing
                          ? 'متابَع'
                          : '+ متابع\n${_formatNumber(_store.followersCount)} متابعون',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(StoreProduct product, int index) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () => context.push('/product/${product.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? theme.cardColor : Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(8),
                    ),
                    child: Image.network(product.imageUrl, fit: BoxFit.cover),
                  ),
                  // Badges
                  if (product.isTrending)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.orange,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'ترندات',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          if (product.badge != null)
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                product.badge!,
                                style: const TextStyle(fontSize: 8),
                              ),
                            ),
                        ],
                      ),
                    ),
                  // Sold Count
                  if (product.soldCount > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          '+${product.soldCount} تم البيع',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                          ),
                        ),
                      ),
                    ),
                  // Multiple Images Indicator
                  Positioned(
                    bottom: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: index % 3 == 0
                                  ? Colors.red
                                  : (index % 3 == 1
                                        ? Colors.grey
                                        : Colors.brown),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${(index % 5) + 2}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Add to Cart
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(color: Colors.black12, blurRadius: 4),
                        ],
                      ),
                      child: const Icon(Icons.add_shopping_cart, size: 16),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12),
                  ),
                  if (product.badge != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.chevron_left,
                            size: 12,
                            color: Colors.grey,
                          ),
                          Text(
                            product.badge!,
                            style: const TextStyle(
                              fontSize: 10,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      if (product.originalPrice != null)
                        Text(
                          '﷼${product.originalPrice!.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[500],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      const SizedBox(width: 4),
                      Text(
                        'تم بيع +${product.soldCount}',
                        style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Text(
                        '﷼${product.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: const Text(
                          'بعد الكوبون',
                          style: TextStyle(color: Colors.red, fontSize: 8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentTab() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // استخدام Column بسيط بدلاً من NestedScrollView لتجنب تعارض السكرول
    return SafeArea(
      top: false,
      child: Column(
        children: [
          // تبويبات المحتوى (فيديو / منشورات)
          Container(
            height: 48,
            color: isDark ? theme.cardColor : Colors.white,
            child: TabBar(
              controller: _contentTabController,
              labelColor: isDark ? Colors.white : Colors.black,
              unselectedLabelColor: Colors.grey,
              indicatorColor: _primaryColor,
              indicatorWeight: 2,
              tabs: const [
                Tab(text: 'فيديو'),
                Tab(text: 'منشورات'),
              ],
            ),
          ),
          // محتوى التبويبات
          Expanded(
            child: TabBarView(
              controller: _contentTabController,
              children: [_buildVideosContentList(), _buildPostsContentList()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideosContentList() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 200,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: isDark ? theme.cardColor : Colors.grey[200],
            image: DecorationImage(
              image: NetworkImage(
                'https://picsum.photos/400/200?random=${300 + index}',
              ),
              fit: BoxFit.cover,
            ),
          ),
          child: Stack(
            children: [
              Center(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(16),
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 40,
                  ),
                ),
              ),
              Positioned(
                bottom: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'فيديو جديد',
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPostsContentList() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: 8,
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? theme.cardColor : Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 8,
                    ),
                  ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(
                      'https://picsum.photos/50?random=${400 + index}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AKNOTIC Store',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          '${index + 1} ساعات',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                height: 150,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  image: DecorationImage(
                    image: NetworkImage(
                      'https://picsum.photos/400/300?random=${500 + index}',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'اكتشف أحدث المنتجات الخاصة بنا. جودة عالية وأسعار منافسة!',
                style: const TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.favorite_border, size: 18),
                  const SizedBox(width: 8),
                  Text('${200 + (index * 50)}'),
                  const Spacer(),
                  Icon(Icons.comment_outlined, size: 18),
                  const SizedBox(width: 8),
                  Text('${10 + (index * 5)}'),
                  const Spacer(),
                  Icon(Icons.share_outlined, size: 18),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDiscountTab(String text, {bool isSelected = false}) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isSelected
            ? Colors.red.withValues(alpha: 0.1)
            : (isDark
                  ? theme.cardColor.withValues(alpha: 0.5)
                  : Colors.grey[100]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isSelected ? Colors.red : Colors.transparent),
      ),
      child: Row(
        children: [
          Text(
            text,
            style: TextStyle(
              color: isSelected ? Colors.red : Colors.grey[700],
              fontSize: 12,
            ),
          ),
          if (isSelected)
            const Padding(
              padding: EdgeInsets.only(right: 4),
              child: Icon(Icons.local_offer, size: 14, color: Colors.red),
            ),
        ],
      ),
    );
  }

  Widget _buildOffersTab() {
    return SafeArea(
      top: false,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_offer, size: 80, color: Colors.grey[300]),
            const SizedBox(height: 16),
            Text(
              'لا توجد عروض حالياً',
              style: TextStyle(color: Colors.grey[600], fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewsTab() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SafeArea(
      top: false,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 10,
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? theme.cardColor : Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: isDark
                  ? null
                  : [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 8,
                      ),
                    ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  children: [
                    Text(
                      '${(index % 5) + 1} أيام',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                    const Spacer(),
                    Row(
                      children: List.generate(
                        5,
                        (i) => Icon(
                          Icons.star,
                          size: 14,
                          color: i < 4 + (index % 2)
                              ? Colors.amber
                              : Colors.grey[300],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'مستخدم${index + 1}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 8),
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(
                        'https://picsum.photos/50?random=${50 + index}',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'منتج ممتاز والجودة عالية جداً. التوصيل كان سريع والتغليف ممتاز.',
                  textAlign: TextAlign.right,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showStoreInfoSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        top: false,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.6,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(top: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[400],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Close Button & Store Info
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Spacer(),
                    Text(
                      _store.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundImage: NetworkImage(_store.logoUrl),
                        ),
                        if (_store.isTrending)
                          Positioned(
                            bottom: -2,
                            right: 0,
                            left: 0,
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.orange,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                                child: const Text(
                                  'ترندات',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 6,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              // Stats
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatItem(
                      _formatNumber(_store.followersCount),
                      'متابعون',
                    ),
                    Container(width: 1, height: 40, color: Colors.grey[200]),
                    _buildStatItem('${_store.productsCount}', 'المنتج'),
                    Container(width: 1, height: 40, color: Colors.grey[200]),
                    _buildStatItem('${_store.rating} ★', 'تقييم'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Data Labels
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'علامات البيانات',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          '+${_formatNumber(_store.repeatBuyersCount)} إعادة الشراء',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.person,
                          color: Colors.orange,
                          size: 14,
                        ),
                        const SizedBox(width: 24),
                        Text(
                          '+${_formatNumber(_store.soldCount)} تم البيع مؤخراً',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text('🔥', style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Divider(color: Colors.grey[200]),
              // About Store
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'حول هذا المتجر',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _store.description,
                      textAlign: TextAlign.right,
                      style: TextStyle(color: Colors.grey[600], height: 1.5),
                    ),
                    const SizedBox(height: 12),
                    // Partner Duration
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: _primaryColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _getPartnerDuration(_store.joinedDate),
                            style: TextStyle(
                              color: _primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.verified, color: _primaryColor, size: 16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Follow Button
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => _isFollowing = !_isFollowing);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: Text(
                      _isFollowing ? 'إلغاء المتابعة' : '+ متابع',
                      style: const TextStyle(color: Colors.white, fontSize: 16),
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

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(0)}K';
    }
    return number.toString();
  }

  String _getPartnerDuration(DateTime joinedDate) {
    final now = DateTime.now();
    final difference = now.difference(joinedDate);
    final days = difference.inDays;

    if (days < 30) {
      return 'شريك منذ $days يوم';
    } else if (days < 365) {
      final months = (days / 30).floor();
      return 'شريك منذ $months ${months == 1 ? 'شهر' : 'أشهر'}';
    } else {
      final years = (days / 365).floor();
      final remainingMonths = ((days % 365) / 30).floor();
      if (remainingMonths > 0) {
        return 'شريك منذ $years ${years == 1 ? 'سنة' : 'سنوات'} و $remainingMonths ${remainingMonths == 1 ? 'شهر' : 'أشهر'}';
      }
      return 'شريك منذ $years ${years == 1 ? 'سنة' : 'سنوات'}';
    }
  }
}

/// ويدجت بسيط لعرض فئات المتجر
class _CategoriesHeader extends StatelessWidget {
  final List<StoreCategory> categories;
  final bool isDark;

  const _CategoriesHeader({required this.categories, this.isDark = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 100,
      color: isDark ? theme.cardColor : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: 80,
            child: Column(
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    image: DecorationImage(
                      image: NetworkImage(category.imageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: Text(
                    category.name,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;
  final bool isDark;

  _TabBarDelegate(this._tabBar, {this.isDark = false});

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    final theme = Theme.of(context);
    return Container(
      color: isDark ? theme.scaffoldBackgroundColor : Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate oldDelegate) =>
      oldDelegate.isDark != isDark;
}

// Categories Delegate for sticky categories
class Store {
  final String id;
  final String name;
  final String description;
  final String logoUrl;
  final String coverUrl;
  final double rating;
  final int reviewsCount;
  final int followersCount;
  final int productsCount;
  final int soldCount;
  final int repeatBuyersCount;
  final bool isVerified;
  final bool isTrending;
  final List<StoreCategory> categories;
  final List<String> bannerImages;
  final DateTime joinedDate;

  Store({
    required this.id,
    required this.name,
    required this.description,
    required this.logoUrl,
    required this.coverUrl,
    required this.rating,
    required this.reviewsCount,
    required this.followersCount,
    required this.productsCount,
    required this.soldCount,
    required this.repeatBuyersCount,
    required this.isVerified,
    required this.isTrending,
    required this.categories,
    required this.bannerImages,
    required this.joinedDate,
  });
}

class StoreCategory {
  final String name;
  final String imageUrl;

  StoreCategory({required this.name, required this.imageUrl});
}

class StoreProduct {
  final String id;
  final String name;
  final String imageUrl;
  final double price;
  final double? originalPrice;
  final int soldCount;
  final bool hasDiscount;
  final int discountPercent;
  final bool isTrending;
  final String? badge;

  StoreProduct({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.price,
    this.originalPrice,
    required this.soldCount,
    required this.hasDiscount,
    required this.discountPercent,
    required this.isTrending,
    this.badge,
  });
}
