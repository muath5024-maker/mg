import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../features/auth/data/auth_controller.dart';
import '../../data/customer_providers.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// Product Detail Screen - Alibaba Style Design
///
/// Features:
/// • Image carousel with indicators
/// • Sticky tabs (نظرة عامة, تفاصيل, موصى بها)
/// • Fixed bottom bar (store icon, buy now, add to cart)
/// • Recommendations from same store + other stores
/// ═══════════════════════════════════════════════════════════════════════════

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailScreen> createState() =>
      _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  // Primary turquoise color from design
  static const Color _primaryTurquoise = Color(0xFF00BFA5);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _surfaceLight = Color(0xFFF5F5F5);

  int _currentImageIndex = 0;
  bool _isFavorite = false;
  bool _showTabs = false;
  int _selectedTabIndex = 0;

  final ScrollController _scrollController = ScrollController();
  final GlobalKey _overviewKey = GlobalKey();
  final GlobalKey _detailsKey = GlobalKey();
  final GlobalKey _recommendedKey = GlobalKey();

  // Mock Product Data - TODO: Replace with API
  late final _ProductData _product = _ProductData(
    id: widget.productId,
    name:
        'جهاز نقاط بيع بنظام أندرويد 14 بشاشة 8 بوصة مع واي فاي، ماكينة طباعة لطلبات المطاعم عبر الإنترنت وتوصيل الطعام',
    description: '''
جهاز نقاط بيع متطور يعمل بنظام أندرويد 14 مع شاشة لمس 8 بوصة عالية الدقة.

المميزات الرئيسية:
• نظام تشغيل أندرويد 14 سريع وموثوق
• شاشة لمس IPS 8 بوصة بدقة 1280×800
• طابعة حرارية مدمجة 58 مم
• واي فاي + بلوتوث + 4G/3G
• بطارية 3600 مللي أمبير قابلة للشحن
• كاميرا 5 ميجابكسل مع ماسح ضوئي
• معالج ثماني النواة

المحتويات:
- جهاز نقاط البيع
- محول طاقة 12V3A
- دليل المستخدم
    ''',
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800',
      'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800',
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800',
    ],
    minPrice: 190.88,
    maxPrice: 610.80,
    minOrder: 1,
    samplePrice: 610.80,
    rating: 5.0,
    reviewsCount: 13,
    soldCount: 1721,
    storeName: 'Shenzhen Zcs Technology Co., Ltd.',
    storeId: 's1',
    storeLogoUrl:
        'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    storeRating: 4.8,
    storeYears: 16,
    storeReviewsCount: 8127,
    storeResponseRate: 96.9,
    isVerified: true,
    category: 'الكترونيات',
    specifications: [
      _SpecificationData('المنتج', 'زكس زد 108 واي'),
      _SpecificationData('OS', 'أندرويد 14'),
      _SpecificationData('الذاكرة', '3 جيجابايت + 16 جيجابايت'),
      _SpecificationData('حجم الشاشة', '8 بوصة * 1280IPS'),
      _SpecificationData('تقنية الاتصال', 'واي فاي'),
      _SpecificationData('سعة البطارية', '3600mAh ، 7.6V'),
      _SpecificationData('CPU', 'ثماني النواة'),
      _SpecificationData('الطابعة', 'حرارية 58 مم'),
    ],
    colors: ['أسود'],
    screenSizes: ['8.0 بوصة'],
    processingTime: '7 أيام',
    customizationOptions: ['شعار مخصص', 'تغليف حسب الطلب', 'تخصيص الرسم'],
    certifications: ['CQC', 'FCC', 'CE'],
  );

  // Same store products
  final List<_RecommendedProduct> _sameStoreProducts = [
    _RecommendedProduct(
      'جهاز POS صغير',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      '267.23-286.32 ر.س',
      6,
    ),
    _RecommendedProduct(
      'تابلت أندرويد',
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
      '305.40-381.75 ر.س',
      30,
    ),
    _RecommendedProduct(
      'طابعة حرارية',
      'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400',
      '568.81-687.15 ر.س',
      1,
    ),
    _RecommendedProduct(
      'قارئ باركود',
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400',
      '568.81-687.15 ر.س',
      2,
    ),
  ];

  // Other stores products
  final List<_RecommendedProduct> _otherStoreProducts = [
    _RecommendedProduct(
      'جهاز POS محمول',
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
      '190.88-377.94 ر.س',
      0,
    ),
    _RecommendedProduct(
      'شاشة عرض للعميل',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      '572.63-763.50 ر.س',
      0,
    ),
    _RecommendedProduct(
      'درج نقود',
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
      '458.10-515.37 ر.س',
      0,
    ),
    _RecommendedProduct(
      'جهاز NFC',
      'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=400',
      '381.75-458.10 ر.س',
      0,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Show tabs when scrolled past image
    if (_scrollController.offset > 300 && !_showTabs) {
      setState(() => _showTabs = true);
    } else if (_scrollController.offset <= 300 && _showTabs) {
      setState(() => _showTabs = false);
    }
  }

  void _scrollToSection(GlobalKey key) {
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _backgroundLight,
      body: Stack(
        children: [
          // Main Content
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              // App Bar
              _buildSliverAppBar(),

              // Overview Section
              SliverToBoxAdapter(
                key: _overviewKey,
                child: _buildOverviewSection(),
              ),

              // Details Section
              SliverToBoxAdapter(
                key: _detailsKey,
                child: _buildDetailsSection(),
              ),

              // Reviews Section
              SliverToBoxAdapter(child: _buildReviewsSection()),

              // Supplier Section
              SliverToBoxAdapter(child: _buildSupplierSection()),

              // Recommended Section
              SliverToBoxAdapter(
                key: _recommendedKey,
                child: _buildRecommendedSection(),
              ),

              // Bottom Spacing
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),

          // Sticky Tabs (shown when scrolling)
          if (_showTabs) _buildStickyTabs(),
        ],
      ),

      // Fixed Bottom Bar
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 350,
      pinned: true,
      backgroundColor: _backgroundLight,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.9),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 8,
              ),
            ],
          ),
          child: const Icon(
            Icons.arrow_forward_ios,
            color: Colors.black,
            size: 18,
          ),
        ),
        onPressed: () => context.pop(),
      ),
      actions: [
        // Favorite
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? Colors.red : Colors.black,
              size: 20,
            ),
          ),
          onPressed: () async {
            // تحقق من تسجيل الدخول أولاً
            final isAuthenticated = ref
                .read(authControllerProvider)
                .isAuthenticated;
            if (!isAuthenticated) {
              // عرض رسالة وفتح صفحة تسجيل الدخول
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('الرجاء تسجيل الدخول لإضافة المنتج للمفضلة'),
                  duration: Duration(seconds: 2),
                ),
              );
              context.push('/login');
              return;
            }

            final notifier = ref.read(favoritesProvider.notifier);
            final success = _isFavorite
                ? await notifier.removeFromFavorites(_product.id)
                : await notifier.addToFavorites(_product.id);

            if (success) {
              setState(() => _isFavorite = !_isFavorite);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      _isFavorite
                          ? 'تمت الإضافة إلى المفضلة'
                          : 'تمت الإزالة من المفضلة',
                    ),
                    duration: const Duration(seconds: 2),
                    action: SnackBarAction(
                      label: 'عرض المفضلة',
                      onPressed: () => context.push('/favorites'),
                    ),
                  ),
                );
              }
            }
          },
        ),
        // Share
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Icon(Icons.share, color: Colors.black, size: 20),
          ),
          onPressed: () {},
        ),
        // Camera Search
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                ),
              ],
            ),
            child: const Icon(
              Icons.camera_alt_outlined,
              color: Colors.black,
              size: 20,
            ),
          ),
          onPressed: () {
            // Navigate to image search with current product image
            context.push(
              '/search/image',
              extra: {
                'imageUrl': _product.images.isNotEmpty
                    ? _product.images[0]
                    : '',
                'category': _product.category,
              },
            );
          },
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          children: [
            // Image Carousel
            PageView.builder(
              onPageChanged: (index) =>
                  setState(() => _currentImageIndex = index),
              itemCount: _product.images.length,
              itemBuilder: (context, index) {
                return Image.network(
                  _product.images[index],
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) => Container(
                    color: Colors.grey[200],
                    child: const Icon(Icons.image, size: 50),
                  ),
                );
              },
            ),
            // Image Indicators
            Positioned(
              bottom: 16,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_product.images.length, (index) {
                  return Container(
                    width: _currentImageIndex == index ? 20 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    decoration: BoxDecoration(
                      color: _currentImageIndex == index
                          ? _primaryTurquoise
                          : Colors.white.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStickyTabs() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        color: _backgroundLight,
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // App bar replacement
            SizedBox(
              height: 50,
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_forward_ios, size: 18),
                    onPressed: () => context.pop(),
                  ),
                  Expanded(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildTabButton('نظرة عامة', 0),
                        const SizedBox(width: 24),
                        _buildTabButton('تفاصيل', 1),
                        const SizedBox(width: 24),
                        _buildTabButton('موصى بها', 2),
                      ],
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Container(height: 1, color: Colors.grey[200]),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final isSelected = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedTabIndex = index);
        switch (index) {
          case 0:
            _scrollToSection(_overviewKey);
            break;
          case 1:
            _scrollToSection(_detailsKey);
            break;
          case 2:
            _scrollToSection(_recommendedKey);
            break;
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? Colors.black : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Container(
            height: 2,
            width: 40,
            color: isSelected ? _primaryTurquoise : Colors.transparent,
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewSection() {
    return Container(
      color: _backgroundLight,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${_product.minPrice}-${_product.maxPrice}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const Text(
                ' ر.س',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'الحد الأدنى للطلب: ${_product.minOrder} قطعة',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
          const SizedBox(height: 16),

          // Product Name
          Text(
            _product.name,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),

          // Rating & Sales
          Row(
            children: [
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 16),
                  const SizedBox(width: 2),
                  Text(
                    '${_product.rating}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  Text(
                    ' (${_product.reviewsCount})',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              Text('·', style: TextStyle(color: Colors.grey[400])),
              const SizedBox(width: 8),
              Text(
                'تم بيع ${_product.soldCount}',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Certifications
          Row(
            children: [
              Icon(Icons.verified_user, size: 14, color: Colors.red[400]),
              const SizedBox(width: 4),
              Text(
                'رقم 1 المنتجات الأكثر رواجاً في أجهزة المحمول',
                style: TextStyle(fontSize: 11, color: Colors.red[400]),
              ),
              const SizedBox(width: 8),
              ...(_product.certifications.take(3).map((cert) {
                return Container(
                  margin: const EdgeInsets.only(left: 4),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey[300]!),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(cert, style: const TextStyle(fontSize: 9)),
                );
              })),
            ],
          ),
          const SizedBox(height: 20),

          // Color Selection
          _buildSelectionSection('اللون', _product.colors),
          const SizedBox(height: 16),

          // Screen Size Selection
          _buildSelectionSection('حجم الشاشة', _product.screenSizes),
          const SizedBox(height: 20),

          // Payment Protection
          _buildPaymentProtectionSection(),
        ],
      ),
    );
  }

  Widget _buildSelectionSection(String title, List<String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '$title (${options.length})',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const Icon(Icons.chevron_left, size: 20),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: options.map((option) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(option, style: const TextStyle(fontSize: 12)),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildPaymentProtectionSection() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _surfaceLight,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'حماية الطلبات في Mbuy',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          // Payment Icons
          Row(
            children: [
              _buildPaymentIcon('assets/icons/mada.png', 'mada'),
              _buildPaymentIcon('assets/icons/visa.png', 'VISA'),
              _buildPaymentIcon('assets/icons/mastercard.png', 'MC'),
              _buildPaymentIcon('assets/icons/applepay.png', 'Pay'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.check_circle,
                color: _primaryTurquoise,
                size: 16,
              ),
              const SizedBox(width: 6),
              const Text('مدفوعات آمنة', style: TextStyle(fontSize: 12)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.security, color: _primaryTurquoise, size: 16),
              const SizedBox(width: 6),
              const Text(
                'حماية استرداد الأموال',
                style: TextStyle(fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentIcon(String asset, String fallbackText) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Text(
        fallbackText,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.grey[700],
        ),
      ),
    );
  }

  void _showFullSpecifications() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Header with close button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'جميع المواصفات',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            // Specifications List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _product.specifications.length,
                itemBuilder: (context, index) {
                  final spec = _product.specifications[index];
                  return Container(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      border: index < _product.specifications.length - 1
                          ? Border(bottom: BorderSide(color: Colors.grey[200]!))
                          : null,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 120,
                          child: Text(
                            spec.name,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            spec.value,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsSection() {
    return Container(
      color: _backgroundLight,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Specifications Header with arrow
          GestureDetector(
            onTap: _showFullSpecifications,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'المواصفات الأساسية',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Specifications Table
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[200]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: _product.specifications.asMap().entries.map((entry) {
                final index = entry.key;
                final spec = entry.value;
                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: index.isEven ? _surfaceLight : _backgroundLight,
                    border: index < _product.specifications.length - 1
                        ? Border(bottom: BorderSide(color: Colors.grey[200]!))
                        : null,
                  ),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 120,
                        child: Text(
                          spec.name,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          spec.value,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),

          // Processing Time
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'وقت المعالجة',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildProcessingTimeItem('7 أيام', '+1 قطعة'),
              _buildProcessingTimeItem('35 يومًا', '+101 قطعة'),
              _buildProcessingTimeItem('سيتم التفاوض عليه', '+5000 قطعة'),
            ],
          ),
          const SizedBox(height: 20),

          // Customization Options
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'خيارات التخصيص',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: _product.customizationOptions.map((option) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.check_circle_outline,
                      color: _primaryTurquoise,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(option, style: const TextStyle(fontSize: 13)),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildProcessingTimeItem(String time, String quantity) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(left: 8),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[200]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              time,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              quantity,
              style: TextStyle(fontSize: 11, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewsSection() {
    return Container(
      color: _backgroundLight,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'المراجعات',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),

          // Tabs
          Row(
            children: [
              _buildReviewTab(
                'مراجعات المنتج (${_product.reviewsCount})',
                true,
              ),
              const SizedBox(width: 16),
              _buildReviewTab(
                'تقييمات المتجر (${_product.storeReviewsCount})',
                false,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Rating
          Row(
            children: [
              ...List.generate(5, (index) {
                return const Icon(Icons.star, color: Colors.amber, size: 24);
              }),
              const SizedBox(width: 8),
              Text(
                '${_product.rating}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.amber,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Sample Review
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _surfaceLight,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ...List.generate(
                      5,
                      (i) =>
                          const Icon(Icons.star, color: Colors.amber, size: 14),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '· أغسطس 28, 2025',
                      style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Text('🇸🇦', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 4),
                    Text(
                      'G***e',
                      style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'High quality mobile pos, excellent service, and efficient technical t...',
                  style: TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  'المزيد',
                  style: TextStyle(fontSize: 11, color: _primaryTurquoise),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: () {},
              child: const Text(
                'عرض الكل',
                style: TextStyle(color: _primaryTurquoise),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewTab(String label, bool isSelected) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? _primaryTurquoise.withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? _primaryTurquoise : Colors.grey[300]!,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isSelected ? _primaryTurquoise : Colors.grey[600],
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSupplierSection() {
    return Container(
      color: _backgroundLight,
      margin: const EdgeInsets.only(top: 8),
      child: Column(
        children: [
          // Verified Badge
          if (_product.isVerified)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 8),
              color: _primaryTurquoise.withValues(alpha: 0.1),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.verified,
                    color: _primaryTurquoise,
                    size: 16,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Verified',
                    style: TextStyle(
                      color: _primaryTurquoise,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          // Store Info
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Store Logo
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    image: DecorationImage(
                      image: NetworkImage(_product.storeLogoUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Store Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _product.storeName,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '${_product.storeRating}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          const Icon(Icons.star, color: Colors.amber, size: 12),
                          Text(
                            ' · ${_product.storeYears} سنوات على Mbuy',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'مراجعات إيجابية بنسبة ${_product.storeResponseRate}%',
                        style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                // Arrow
                Icon(Icons.chevron_left, color: Colors.grey[400]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendedSection() {
    return Container(
      color: _backgroundLight,
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Same Store Products
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'الأكثر مبيعًا من هذا المتجر',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _sameStoreProducts.length,
              itemBuilder: (context, index) {
                return _buildRecommendedProductCard(
                  _sameStoreProducts[index],
                  showSold: true,
                );
              },
            ),
          ),
          const SizedBox(height: 24),

          // Buyers Also Chose
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'المشترون مثلك قد اختاروا أيضًا',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _otherStoreProducts.length,
              itemBuilder: (context, index) {
                return _buildRecommendedProductCard(
                  _otherStoreProducts[index],
                  showSold: false,
                );
              },
            ),
          ),
          const SizedBox(height: 24),

          // Similar Options - Vertical Layout
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'شاهد خيارات مماثلة',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              Icon(Icons.chevron_left, size: 20, color: Colors.grey[600]),
            ],
          ),
          const SizedBox(height: 12),
          // Vertical Grid Layout
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
            ),
            itemCount: _otherStoreProducts.length,
            itemBuilder: (context, index) {
              return _buildVerticalProductCard(_otherStoreProducts[index]);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendedProductCard(
    _RecommendedProduct product, {
    bool showSold = false,
  }) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(left: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(
                  image: NetworkImage(product.imageUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          // Price
          Text(
            product.price,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (showSold && product.soldCount > 0)
            Text(
              'تم بيع ${product.soldCount}',
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
        ],
      ),
    );
  }

  Widget _buildVerticalProductCard(_RecommendedProduct product) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Expanded(
            flex: 3,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12),
                ),
                image: DecorationImage(
                  image: NetworkImage(product.imageUrl),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          // Info
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),
                  Text(
                    product.price,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: _primaryTurquoise,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _backgroundLight,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Store Icon
            GestureDetector(
              onTap: () => context.push('/store/${_product.storeId}'),
              child: Container(
                padding: const EdgeInsets.all(10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.store_outlined, size: 22),
                    const SizedBox(height: 2),
                    Text(
                      'المتجر',
                      style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Add to Cart Button
            Expanded(
              child: OutlinedButton(
                onPressed: () async {
                  // تحقق من تسجيل الدخول أولاً
                  final isAuthenticated = ref
                      .read(authControllerProvider)
                      .isAuthenticated;
                  if (!isAuthenticated) {
                    // عرض رسالة وفتح صفحة تسجيل الدخول
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'الرجاء تسجيل الدخول لإضافة المنتج للسلة',
                        ),
                        duration: Duration(seconds: 2),
                      ),
                    );
                    context.push('/login');
                    return;
                  }

                  final notifier = ref.read(cartProvider.notifier);
                  final success = await notifier.addToCart(
                    _product.id,
                    quantity: 1,
                  );

                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          success
                              ? 'تمت الإضافة إلى السلة'
                              : 'فشل في الإضافة إلى السلة',
                        ),
                        duration: const Duration(seconds: 2),
                        action: success
                            ? SnackBarAction(
                                label: 'عرض السلة',
                                onPressed: () => context.push('/cart'),
                              )
                            : null,
                      ),
                    );
                  }
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black,
                  side: BorderSide(color: Colors.grey[300]!),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text('أضف للسلة', style: TextStyle(fontSize: 13)),
              ),
            ),
            const SizedBox(width: 8),

            // Buy Now Button
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to checkout with this product
                  context.push(
                    '/checkout',
                    extra: {'productId': _product.id, 'quantity': 1},
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryTurquoise,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text(
                  'شراء الآن',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
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
// Data Models
// ═══════════════════════════════════════════════════════════════════════════

class _ProductData {
  final String id;
  final String name;
  final String description;
  final List<String> images;
  final double minPrice;
  final double maxPrice;
  final int minOrder;
  final double samplePrice;
  final double rating;
  final int reviewsCount;
  final int soldCount;
  final String storeName;
  final String storeId;
  final String storeLogoUrl;
  final double storeRating;
  final int storeYears;
  final int storeReviewsCount;
  final double storeResponseRate;
  final bool isVerified;
  final String category;
  final List<_SpecificationData> specifications;
  final List<String> colors;
  final List<String> screenSizes;
  final String processingTime;
  final List<String> customizationOptions;
  final List<String> certifications;

  _ProductData({
    required this.id,
    required this.name,
    required this.description,
    required this.images,
    required this.minPrice,
    required this.maxPrice,
    required this.minOrder,
    required this.samplePrice,
    required this.rating,
    required this.reviewsCount,
    required this.soldCount,
    required this.storeName,
    required this.storeId,
    required this.storeLogoUrl,
    required this.storeRating,
    required this.storeYears,
    required this.storeReviewsCount,
    required this.storeResponseRate,
    required this.isVerified,
    required this.category,
    required this.specifications,
    required this.colors,
    required this.screenSizes,
    required this.processingTime,
    required this.customizationOptions,
    required this.certifications,
  });
}

class _SpecificationData {
  final String name;
  final String value;

  _SpecificationData(this.name, this.value);
}

class _RecommendedProduct {
  final String name;
  final String imageUrl;
  final String price;
  final int soldCount;

  _RecommendedProduct(this.name, this.imageUrl, this.price, this.soldCount);
}
