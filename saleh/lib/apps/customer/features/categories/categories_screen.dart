import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// MBUY Categories Screen - Alibaba Style Design
///
/// Features:
/// • Split-view layout with side navigation
/// • Subcategories grid (3 columns)
/// • Verified Suppliers section
/// • Product Ideas section
/// ═══════════════════════════════════════════════════════════════════════════

class CategoriesScreen extends ConsumerStatefulWidget {
  const CategoriesScreen({super.key});

  @override
  ConsumerState<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends ConsumerState<CategoriesScreen> {
  int _selectedCategoryIndex = 0;

  // Primary turquoise color from design
  static const Color _primaryTurquoise = Color(0xFF00BFA5);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _backgroundDark = Color(0xFF1A1A1A);
  static const Color _surfaceLight = Color(0xFFF5F5F5);
  static const Color _surfaceDark = Color(0xFF2D2D2D);

  // Main categories list
  final List<_CategoryItem> _mainCategories = [
    _CategoryItem('لك'),
    _CategoryItem('مميز'),
    _CategoryItem('عروض'),
    _CategoryItem('الكترونيات'),
    _CategoryItem('الجوالات'),
    _CategoryItem('الكمبيوتر وألعاب الفيديو'),
    _CategoryItem('الملابس وإكسسواراتها'),
    _CategoryItem('زينة وقطع السيارات'),
    _CategoryItem('المنزل والحديقة'),
    _CategoryItem('الجمال'),
    _CategoryItem('الصحة والرياضة'),
    _CategoryItem('الكشتة والرحلات'),
    _CategoryItem('الشنط والإكسسوارات'),
    _CategoryItem('الأطفال'),
    _CategoryItem('اللوازم الدراسية والمكتبية'),
    _CategoryItem('الإنارة والمصابيح'),
    _CategoryItem('المواد الخام'),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      body: SafeArea(
        child: Row(
          children: [
            // Side Categories Navigation
            _buildSideCategories(isDark),

            // Main Content Area
            Expanded(child: _buildMainContent(isDark)),
          ],
        ),
      ),
    );
  }

  /// Side navigation with main categories (Alibaba style)
  Widget _buildSideCategories(bool isDark) {
    return Container(
      width: 90,
      decoration: BoxDecoration(color: isDark ? _surfaceDark : _surfaceLight),
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 100),
        itemCount: _mainCategories.length,
        itemBuilder: (context, index) {
          final isSelected = index == _selectedCategoryIndex;
          final category = _mainCategories[index];

          return GestureDetector(
            onTap: () => setState(() => _selectedCategoryIndex = index),
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
  Widget _buildMainContent(bool isDark) {
    return Container(
      color: isDark ? _backgroundDark : _backgroundLight,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          // Subcategories Grid
          _buildSubcategoriesGrid(isDark),

          const SizedBox(height: 24),

          // Verified Suppliers Section
          _buildVerifiedSuppliersSection(isDark),

          const SizedBox(height: 24),

          // Product Ideas Section
          _buildProductIdeasSection(isDark),

          const SizedBox(height: 100),
        ],
      ),
    );
  }

  /// Subcategories grid (Alibaba style - 3 columns with product images)
  Widget _buildSubcategoriesGrid(bool isDark) {
    final subcategoriesMap = {
      'لك': [
        _SubcategoryItem(
          'مقترحات لك',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        ),
        _SubcategoryItem(
          'شوهد مؤخراً',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
        ),
        _SubcategoryItem(
          'المفضلة',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'مميز': [
        _SubcategoryItem(
          'الأكثر مبيعاً',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        ),
        _SubcategoryItem(
          'وصل حديثاً',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        ),
        _SubcategoryItem(
          'اختيارات المحررين',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'عروض': [
        _SubcategoryItem(
          'تخفيضات 50%',
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
        ),
        _SubcategoryItem(
          'عروض اليوم',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
        ),
        _SubcategoryItem(
          'تصفيات',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الكترونيات': [
        _SubcategoryItem(
          'سماعات',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        ),
        _SubcategoryItem(
          'شواحن',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        ),
        _SubcategoryItem(
          'كاميرات',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
        ),
        _SubcategoryItem(
          'حوامل الجوال',
          'https://images.unsplash.com/photo-1586953208270-767889fa9113?w=400',
        ),
        _SubcategoryItem(
          'مكبرات الصوت',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
        ),
        _SubcategoryItem(
          'ملحقات',
          'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الجوالات': [
        _SubcategoryItem(
          'آيفون',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
        ),
        _SubcategoryItem(
          'سامسونج',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
        ),
        _SubcategoryItem(
          'هواوي',
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
        ),
        _SubcategoryItem(
          'شاومي',
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
        ),
        _SubcategoryItem(
          'كفرات وحمايات',
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الكمبيوتر وألعاب الفيديو': [
        _SubcategoryItem(
          'لابتوب',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        ),
        _SubcategoryItem(
          'بلايستيشن',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
        ),
        _SubcategoryItem(
          'اكسبوكس',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400',
        ),
        _SubcategoryItem(
          'ملحقات قيمنق',
          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الملابس وإكسسواراتها': [
        _SubcategoryItem(
          'بلوزات',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        ),
        _SubcategoryItem(
          'فساتين',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        ),
        _SubcategoryItem(
          'بناطيل',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
        ),
        _SubcategoryItem(
          'ملابس رياضية',
          'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400',
        ),
        _SubcategoryItem(
          'كنزات شتوية',
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'زينة وقطع السيارات': [
        _SubcategoryItem(
          'إكسسوارات داخلية',
          'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
        ),
        _SubcategoryItem(
          'إكسسوارات خارجية',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
        ),
        _SubcategoryItem(
          'قطع غيار',
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
        ),
        _SubcategoryItem(
          'زيوت وسوائل',
          'https://images.unsplash.com/photo-1635784063388-1ff609e86a7b?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'المنزل والحديقة': [
        _SubcategoryItem(
          'أثاث',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        ),
        _SubcategoryItem(
          'ديكور',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
        ),
        _SubcategoryItem(
          'مطبخ',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
        ),
        _SubcategoryItem(
          'حديقة',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الجمال': [
        _SubcategoryItem(
          'عطور',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
        ),
        _SubcategoryItem(
          'مكياج',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
        ),
        _SubcategoryItem(
          'عناية بالبشرة',
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
        ),
        _SubcategoryItem(
          'عناية بالشعر',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الصحة والرياضة': [
        _SubcategoryItem(
          'أجهزة رياضية',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        ),
        _SubcategoryItem(
          'مكملات غذائية',
          'https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=400',
        ),
        _SubcategoryItem(
          'ملابس رياضية',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الكشتة والرحلات': [
        _SubcategoryItem(
          'خيام',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
        ),
        _SubcategoryItem(
          'أدوات التخييم',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400',
        ),
        _SubcategoryItem(
          'حقائب السفر',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الشنط والإكسسوارات': [
        _SubcategoryItem(
          'شنط يد',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
        ),
        _SubcategoryItem(
          'محافظ',
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
        ),
        _SubcategoryItem(
          'نظارات',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
        ),
        _SubcategoryItem(
          'ساعات',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الأطفال': [
        _SubcategoryItem(
          'ملابس أطفال',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
        ),
        _SubcategoryItem(
          'ألعاب',
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
        ),
        _SubcategoryItem(
          'مستلزمات الرضع',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'اللوازم الدراسية والمكتبية': [
        _SubcategoryItem(
          'حقائب مدرسية',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        ),
        _SubcategoryItem(
          'قرطاسية',
          'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400',
        ),
        _SubcategoryItem(
          'أدوات مكتبية',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'الإنارة والمصابيح': [
        _SubcategoryItem(
          'إضاءة داخلية',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        ),
        _SubcategoryItem(
          'إضاءة خارجية',
          'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400',
        ),
        _SubcategoryItem(
          'LED',
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
      'المواد الخام': [
        _SubcategoryItem(
          'أقمشة',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
        ),
        _SubcategoryItem(
          'جلود',
          'https://images.unsplash.com/photo-1531819571556-12f47a3d0f31?w=400',
        ),
        _SubcategoryItem(
          'خيوط',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        ),
        _SubcategoryItem('عرض الكل', '', isAllCard: true),
      ],
    };

    final selectedCategoryName = _mainCategories[_selectedCategoryIndex].name;
    final subcategories =
        subcategoriesMap[selectedCategoryName] ??
        [_SubcategoryItem('عرض الكل', '', isAllCard: true)];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 16,
        childAspectRatio: 0.75,
      ),
      itemCount: subcategories.length,
      itemBuilder: (context, index) {
        return _buildSubcategoryCard(subcategories[index], isDark);
      },
    );
  }

  /// Single subcategory card (Alibaba style)
  Widget _buildSubcategoryCard(_SubcategoryItem item, bool isDark) {
    return GestureDetector(
      onTap: () {
        if (item.isAllCard) {
          final categoryName = _mainCategories[_selectedCategoryIndex].name;
          context.push('/category/$categoryName/products');
        } else {
          context.push('/category/${item.name}/products');
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
  Widget _buildVerifiedSuppliersSection(bool isDark) {
    final selectedCategoryName = _mainCategories[_selectedCategoryIndex].name;

    // Category-specific suppliers
    final suppliersMap = {
      'لك': [
        _SupplierItem(
          'متجر المقترحات الذكية',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        ),
        _SupplierItem(
          'متجر التوصيات',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
        ),
      ],
      'مميز': [
        _SupplierItem(
          'متجر المنتجات المميزة',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
        ),
        _SupplierItem(
          'بيت الاختيارات',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        ),
      ],
      'عروض': [
        _SupplierItem(
          'متجر التخفيضات الكبرى',
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
        ),
        _SupplierItem(
          'سوق العروض',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
        ),
      ],
      'الكترونيات': [
        _SupplierItem(
          'متجر الإلكترونيات المتميز',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        ),
        _SupplierItem(
          'تك ستور',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
        ),
        _SupplierItem(
          'عالم الكاميرات',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
        ),
      ],
      'الجوالات': [
        _SupplierItem(
          'متجر الجوالات الأصلية',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
        ),
        _SupplierItem(
          'موبايل شوب',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
        ),
        _SupplierItem(
          'فون زون',
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400',
        ),
      ],
      'الكمبيوتر وألعاب الفيديو': [
        _SupplierItem(
          'قيمرز هب',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
        ),
        _SupplierItem(
          'كمبيوتر لاند',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
        ),
        _SupplierItem(
          'بلاي ستيشن ستور',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400',
        ),
      ],
      'الملابس وإكسسواراتها': [
        _SupplierItem(
          'بيت الأزياء العربية',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
        ),
        _SupplierItem(
          'فاشن هاوس',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        ),
        _SupplierItem(
          'ستايل مود',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
        ),
      ],
      'زينة وقطع السيارات': [
        _SupplierItem(
          'أوتو بارتس',
          'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
        ),
        _SupplierItem(
          'متجر السيارات',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
        ),
      ],
      'المنزل والحديقة': [
        _SupplierItem(
          'هوم سنتر',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        ),
        _SupplierItem(
          'بيت الديكور',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
        ),
      ],
      'الجمال': [
        _SupplierItem(
          'بيوتي لاند',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
        ),
        _SupplierItem(
          'عالم المكياج',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
        ),
      ],
      'الصحة والرياضة': [
        _SupplierItem(
          'سبورتس هب',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        ),
        _SupplierItem(
          'فيتنس زون',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
        ),
      ],
      'الكشتة والرحلات': [
        _SupplierItem(
          'أدفنشر ستور',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
        ),
        _SupplierItem(
          'كامبينج شوب',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400',
        ),
      ],
      'الشنط والإكسسوارات': [
        _SupplierItem(
          'باقز آند مور',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
        ),
        _SupplierItem(
          'أكسسوري هاوس',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        ),
      ],
      'الأطفال': [
        _SupplierItem(
          'كيدز وورلد',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
        ),
        _SupplierItem(
          'توي لاند',
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
        ),
      ],
      'اللوازم الدراسية والمكتبية': [
        _SupplierItem(
          'مكتبة العلم',
          'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400',
        ),
        _SupplierItem(
          'أوفيس سبلاي',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
        ),
      ],
      'الإنارة والمصابيح': [
        _SupplierItem(
          'لايت هاوس',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
        ),
        _SupplierItem(
          'إل إي دي ستور',
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
        ),
      ],
      'المواد الخام': [
        _SupplierItem(
          'فابريك سنتر',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
        ),
        _SupplierItem(
          'متجر الأقمشة',
          'https://images.unsplash.com/photo-1531819571556-12f47a3d0f31?w=400',
        ),
      ],
    };

    final suppliers =
        suppliersMap[selectedCategoryName] ??
        [
          _SupplierItem(
            'متجر عام',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
          ),
        ];

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
                  context.push('/category/$selectedCategoryName/suppliers'),
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
  Widget _buildProductIdeasSection(bool isDark) {
    final selectedCategoryName = _mainCategories[_selectedCategoryIndex].name;

    // Category-specific products
    final productsMap = {
      'لك': [
        _ProductItem(
          'منتج مقترح لك',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
          '99 ر.س',
          '149 ر.س',
        ),
        _ProductItem(
          'اختيار خاص',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
          '150 ر.س',
          '200 ر.س',
        ),
        _ProductItem(
          'الأكثر زيارة',
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
          '89 ر.س',
          '120 ر.س',
        ),
        _ProductItem(
          'توصية اليوم',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '199 ر.س',
          '250 ر.س',
        ),
      ],
      'مميز': [
        _ProductItem(
          'الأكثر مبيعاً',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '299 ر.س',
          '399 ر.س',
        ),
        _ProductItem(
          'منتج مميز',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
          '450 ر.س',
          '599 ر.س',
        ),
        _ProductItem(
          'اختيار المحررين',
          'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400',
          '180 ر.س',
          '250 ر.س',
        ),
        _ProductItem(
          'جديد ومميز',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
          '320 ر.س',
          '400 ر.س',
        ),
      ],
      'عروض': [
        _ProductItem(
          'خصم 50%',
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400',
          '99 ر.س',
          '199 ر.س',
        ),
        _ProductItem(
          'عرض محدود',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
          '149 ر.س',
          '299 ر.س',
        ),
        _ProductItem(
          'تصفية نهائية',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
          '79 ر.س',
          '159 ر.س',
        ),
        _ProductItem(
          'سعر خاص',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
          '199 ر.س',
          '350 ر.س',
        ),
      ],
      'الكترونيات': [
        _ProductItem(
          'سماعات بلوتوث',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
          '199 ر.س',
          '249 ر.س',
        ),
        _ProductItem(
          'شاحن سريع',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400',
          '89 ر.س',
          '120 ر.س',
        ),
        _ProductItem(
          'كاميرا ديجيتال',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
          '1200 ر.س',
          '1500 ر.س',
        ),
        _ProductItem(
          'مكبر صوت',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
          '350 ر.س',
          '450 ر.س',
        ),
      ],
      'الجوالات': [
        _ProductItem(
          'آيفون 15',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400',
          '3999 ر.س',
          '4500 ر.س',
        ),
        _ProductItem(
          'سامسونج S24',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
          '3500 ر.س',
          '4000 ر.س',
        ),
        _ProductItem(
          'كفر حماية',
          'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
          '49 ر.س',
          '79 ر.س',
        ),
        _ProductItem(
          'شاحن جوال',
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
          '79 ر.س',
          '99 ر.س',
        ),
      ],
      'الكمبيوتر وألعاب الفيديو': [
        _ProductItem(
          'لابتوب قيمنق',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
          '4500 ر.س',
          '5500 ر.س',
        ),
        _ProductItem(
          'بلايستيشن 5',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
          '2199 ر.س',
          '2500 ر.س',
        ),
        _ProductItem(
          'يد تحكم',
          'https://images.unsplash.com/photo-1593118247619-e2d6f056869e?w=400',
          '299 ر.س',
          '399 ر.س',
        ),
        _ProductItem(
          'ماوس قيمنق',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400',
          '199 ر.س',
          '280 ر.س',
        ),
      ],
      'الملابس وإكسسواراتها': [
        _ProductItem(
          'بلوزة أنيقة',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          '120 ر.س',
          '180 ر.س',
        ),
        _ProductItem(
          'فستان سهرة',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          '450 ر.س',
          '650 ر.س',
        ),
        _ProductItem(
          'بنطال جينز',
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
          '180 ر.س',
          '250 ر.س',
        ),
        _ProductItem(
          'جاكيت شتوي',
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
          '350 ر.س',
          '500 ر.س',
        ),
      ],
      'زينة وقطع السيارات': [
        _ProductItem(
          'حامل جوال للسيارة',
          'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400',
          '49 ر.س',
          '79 ر.س',
        ),
        _ProductItem(
          'معطر سيارة',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
          '29 ر.س',
          '45 ر.س',
        ),
        _ProductItem(
          'غطاء مقاعد',
          'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
          '199 ر.س',
          '299 ر.س',
        ),
        _ProductItem(
          'زيت محرك',
          'https://images.unsplash.com/photo-1635784063388-1ff609e86a7b?w=400',
          '120 ر.س',
          '150 ر.س',
        ),
      ],
      'المنزل والحديقة': [
        _ProductItem(
          'كنبة مودرن',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
          '2500 ر.س',
          '3500 ر.س',
        ),
        _ProductItem(
          'طقم ديكور',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400',
          '350 ر.س',
          '500 ر.س',
        ),
        _ProductItem(
          'أدوات مطبخ',
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
          '199 ر.س',
          '280 ر.س',
        ),
        _ProductItem(
          'أدوات حديقة',
          'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
          '89 ر.س',
          '130 ر.س',
        ),
      ],
      'الجمال': [
        _ProductItem(
          'عطر فاخر',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
          '450 ر.س',
          '650 ر.س',
        ),
        _ProductItem(
          'طقم مكياج',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400',
          '299 ر.س',
          '450 ر.س',
        ),
        _ProductItem(
          'كريم بشرة',
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
          '149 ر.س',
          '200 ر.س',
        ),
        _ProductItem(
          'سيروم شعر',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400',
          '89 ر.س',
          '130 ر.س',
        ),
      ],
      'الصحة والرياضة': [
        _ProductItem(
          'جهاز مشي',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
          '1800 ر.س',
          '2500 ر.س',
        ),
        _ProductItem(
          'بروتين',
          'https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=400',
          '180 ر.س',
          '250 ر.س',
        ),
        _ProductItem(
          'ملابس رياضية',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400',
          '150 ر.س',
          '220 ر.س',
        ),
        _ProductItem(
          'حذاء رياضي',
          'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400',
          '350 ر.س',
          '500 ر.س',
        ),
      ],
      'الكشتة والرحلات': [
        _ProductItem(
          'خيمة تخييم',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
          '450 ر.س',
          '650 ر.س',
        ),
        _ProductItem(
          'كشاف LED',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=400',
          '79 ر.س',
          '120 ر.س',
        ),
        _ProductItem(
          'حقيبة سفر',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          '350 ر.س',
          '500 ر.س',
        ),
        _ProductItem(
          'كرسي قابل للطي',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
          '120 ر.س',
          '180 ر.س',
        ),
      ],
      'الشنط والإكسسوارات': [
        _ProductItem(
          'شنطة يد',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
          '320 ر.س',
          '450 ر.س',
        ),
        _ProductItem(
          'محفظة جلد',
          'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
          '150 ر.س',
          '220 ر.س',
        ),
        _ProductItem(
          'نظارة شمسية',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
          '180 ر.س',
          '280 ر.س',
        ),
        _ProductItem(
          'ساعة ذكية',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
          '450 ر.س',
          '650 ر.س',
        ),
      ],
      'الأطفال': [
        _ProductItem(
          'طقم ملابس أطفال',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
          '120 ر.س',
          '180 ر.س',
        ),
        _ProductItem(
          'لعبة تعليمية',
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
          '89 ر.س',
          '130 ر.س',
        ),
        _ProductItem(
          'عربة أطفال',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
          '850 ر.س',
          '1200 ر.س',
        ),
        _ProductItem(
          'حفاضات',
          'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
          '79 ر.س',
          '99 ر.س',
        ),
      ],
      'اللوازم الدراسية والمكتبية': [
        _ProductItem(
          'حقيبة مدرسية',
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
          '150 ر.س',
          '220 ر.س',
        ),
        _ProductItem(
          'طقم أقلام',
          'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400',
          '49 ر.س',
          '79 ر.س',
        ),
        _ProductItem(
          'دفاتر ملونة',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
          '35 ر.س',
          '55 ر.س',
        ),
        _ProductItem(
          'منظم مكتب',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=400',
          '89 ر.س',
          '130 ر.س',
        ),
      ],
      'الإنارة والمصابيح': [
        _ProductItem(
          'ثريا مودرن',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
          '650 ر.س',
          '900 ر.س',
        ),
        _ProductItem(
          'إضاءة خارجية',
          'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400',
          '180 ر.س',
          '280 ر.س',
        ),
        _ProductItem(
          'شريط LED',
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
          '79 ر.س',
          '120 ر.س',
        ),
        _ProductItem(
          'مصباح مكتب',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
          '120 ر.س',
          '180 ر.س',
        ),
      ],
      'المواد الخام': [
        _ProductItem(
          'قماش قطني',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
          '45 ر.س',
          '70 ر.س',
        ),
        _ProductItem(
          'جلد طبيعي',
          'https://images.unsplash.com/photo-1531819571556-12f47a3d0f31?w=400',
          '180 ر.س',
          '250 ر.س',
        ),
        _ProductItem(
          'خيوط صوف',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
          '35 ر.س',
          '55 ر.س',
        ),
        _ProductItem(
          'قماش حرير',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
          '120 ر.س',
          '180 ر.س',
        ),
      ],
    };

    final products =
        productsMap[selectedCategoryName] ??
        [
          _ProductItem(
            'منتج',
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
            '100 ر.س',
            '150 ر.س',
          ),
        ];

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
                  context.push('/category/$selectedCategoryName/products'),
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

class _CategoryItem {
  final String name;
  _CategoryItem(this.name);
}

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
