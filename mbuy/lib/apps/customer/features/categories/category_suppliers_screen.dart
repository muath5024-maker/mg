import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// ═══════════════════════════════════════════════════════════════════════════
/// Category Suppliers Screen - صفحة عرض جميع موردي الفئة
///
/// Features:
/// • List view of all verified suppliers in the category
/// • Supplier details and ratings
/// • Category-specific suppliers only
/// ═══════════════════════════════════════════════════════════════════════════

class CategorySuppliersScreen extends ConsumerStatefulWidget {
  final String categoryName;

  const CategorySuppliersScreen({super.key, required this.categoryName});

  @override
  ConsumerState<CategorySuppliersScreen> createState() =>
      _CategorySuppliersScreenState();
}

class _CategorySuppliersScreenState
    extends ConsumerState<CategorySuppliersScreen> {
  // Primary turquoise color from design
  static const Color _primaryTurquoise = Color(0xFF00BFA5);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _backgroundDark = Color(0xFF1A1A1A);
  static const Color _surfaceLight = Color(0xFFF5F5F5);
  static const Color _surfaceDark = Color(0xFF2D2D2D);

  String _selectedFilter = 'الكل';
  final List<String> _filterOptions = [
    'الكل',
    'موثق',
    'الأعلى تقييماً',
    'الأكثر مبيعاً',
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final suppliers = _getSuppliersForCategory(widget.categoryName);

    return Scaffold(
      backgroundColor: isDark ? _backgroundDark : _backgroundLight,
      body: CustomScrollView(
        slivers: [
          // Custom App Bar
          _buildSliverAppBar(isDark),

          // Filter Chips
          SliverToBoxAdapter(child: _buildFilterChips(isDark)),

          // Suppliers Count
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.store,
                    size: 18,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${suppliers.length} متجر في ${widget.categoryName}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Suppliers List
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) =>
                    _buildSupplierCard(suppliers[index], isDark),
                childCount: suppliers.length,
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
      expandedHeight: 140,
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
        title: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified, size: 16, color: _primaryTurquoise),
                const SizedBox(width: 4),
                Text(
                  'موردون موثقون',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
            Text(
              widget.categoryName,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
          ],
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                _primaryTurquoise.withValues(alpha: 0.15),
                isDark ? _backgroundDark : _backgroundLight,
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                top: 40,
                left: 20,
                child: Icon(
                  Icons.store_outlined,
                  size: 60,
                  color: _primaryTurquoise.withValues(alpha: 0.1),
                ),
              ),
              Positioned(
                top: 60,
                right: 30,
                child: Icon(
                  Icons.verified_outlined,
                  size: 40,
                  color: _primaryTurquoise.withValues(alpha: 0.1),
                ),
              ),
            ],
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
      ],
    );
  }

  Widget _buildFilterChips(bool isDark) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _filterOptions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final filter = _filterOptions[index];
          final isSelected = filter == _selectedFilter;
          return GestureDetector(
            onTap: () => setState(() => _selectedFilter = filter),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? _primaryTurquoise
                    : (isDark ? _surfaceDark : _surfaceLight),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? _primaryTurquoise
                      : (isDark ? Colors.grey[700]! : Colors.grey[300]!),
                ),
              ),
              child: Text(
                filter,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? Colors.grey[300] : Colors.grey[700]),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSupplierCard(_SupplierData supplier, bool isDark) {
    return GestureDetector(
      onTap: () => context.push('/store/${supplier.id}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: isDark ? _surfaceDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
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
          children: [
            // Cover Image with Store Info Overlay
            Stack(
              children: [
                // Cover Image
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    image: DecorationImage(
                      image: NetworkImage(supplier.coverImage),
                      fit: BoxFit.cover,
                    ),
                  ),
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
                // Verified Badge
                if (supplier.isVerified)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _primaryTurquoise,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, color: Colors.white, size: 12),
                          SizedBox(width: 4),
                          Text(
                            'موثق',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                // Store Logo
                Positioned(
                  bottom: -30,
                  right: 16,
                  child: Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? _backgroundDark : Colors.white,
                        width: 3,
                      ),
                      image: DecorationImage(
                        image: NetworkImage(supplier.logoImage),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
                // Store Name on Cover
                Positioned(
                  bottom: 8,
                  left: 16,
                  right: 90,
                  child: Text(
                    supplier.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            // Store Details
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 40, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Description
                  Text(
                    supplier.description,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  // Stats Row
                  Row(
                    children: [
                      // Rating
                      _buildStatItem(
                        Icons.star,
                        '${supplier.rating}',
                        Colors.amber,
                        isDark,
                      ),
                      const SizedBox(width: 16),
                      // Products Count
                      _buildStatItem(
                        Icons.inventory_2_outlined,
                        '${supplier.productsCount} منتج',
                        _primaryTurquoise,
                        isDark,
                      ),
                      const SizedBox(width: 16),
                      // Followers
                      _buildStatItem(
                        Icons.people_outline,
                        '${supplier.followers} متابع',
                        Colors.blue,
                        isDark,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Tags
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: supplier.tags.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[800] : Colors.grey[100],
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          tag,
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark ? Colors.grey[400] : Colors.grey[600],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () =>
                              context.push('/store/${supplier.id}'),
                          icon: const Icon(Icons.store, size: 16),
                          label: const Text('زيارة المتجر'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: _primaryTurquoise,
                            side: const BorderSide(color: _primaryTurquoise),
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('متابعة'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryTurquoise,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
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

  Widget _buildStatItem(IconData icon, String value, Color color, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.grey[300] : Colors.grey[700],
          ),
        ),
      ],
    );
  }

  // Get suppliers for specific category
  List<_SupplierData> _getSuppliersForCategory(String categoryName) {
    final suppliersMap = {
      'لك': [
        _SupplierData(
          '1',
          'متجر المقترحات الذكية',
          'نوفر لك أفضل المنتجات المناسبة لاهتماماتك',
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.8,
          150,
          1200,
          true,
          ['مقترحات', 'ذكاء اصطناعي'],
        ),
        _SupplierData(
          '2',
          'متجر التوصيات',
          'توصيات مخصصة بناءً على ذوقك',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          85,
          650,
          true,
          ['توصيات', 'مخصص'],
        ),
      ],
      'مميز': [
        _SupplierData(
          '3',
          'متجر المنتجات المميزة',
          'فقط الأفضل والأكثر تميزاً',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.9,
          200,
          2500,
          true,
          ['مميز', 'أفضل المنتجات'],
        ),
        _SupplierData(
          '4',
          'بيت الاختيارات',
          'اختيارات المحررين والمؤثرين',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.7,
          120,
          1800,
          true,
          ['اختيارات', 'مؤثرين'],
        ),
      ],
      'عروض': [
        _SupplierData(
          '5',
          'متجر التخفيضات الكبرى',
          'أفضل العروض والتخفيضات على مدار العام',
          'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.5,
          500,
          5000,
          true,
          ['تخفيضات', 'عروض'],
        ),
        _SupplierData(
          '6',
          'سوق العروض',
          'عروض يومية حصرية',
          'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.4,
          350,
          3200,
          true,
          ['يومية', 'حصرية'],
        ),
      ],
      'الكترونيات': [
        _SupplierData(
          '7',
          'متجر الإلكترونيات المتميز',
          'أحدث الأجهزة الإلكترونية بأفضل الأسعار',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.7,
          320,
          4500,
          true,
          ['إلكترونيات', 'أجهزة'],
        ),
        _SupplierData(
          '8',
          'تك ستور',
          'كل ما تحتاجه من التقنية',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          250,
          3200,
          true,
          ['تقنية', 'سماعات'],
        ),
        _SupplierData(
          '9',
          'عالم الكاميرات',
          'متخصصون في الكاميرات وملحقاتها',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.8,
          180,
          2100,
          true,
          ['كاميرات', 'تصوير'],
        ),
        _SupplierData(
          '10',
          'صوتيات برو',
          'سماعات ومكبرات صوت احترافية',
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.5,
          150,
          1800,
          true,
          ['صوتيات', 'سماعات'],
        ),
      ],
      'الجوالات': [
        _SupplierData(
          '11',
          'متجر الجوالات الأصلية',
          'جوالات أصلية مع ضمان رسمي',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.9,
          200,
          5500,
          true,
          ['جوالات', 'أصلية'],
        ),
        _SupplierData(
          '12',
          'موبايل شوب',
          'أحدث الجوالات بأسعار منافسة',
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.7,
          180,
          4200,
          true,
          ['موبايل', 'هواتف'],
        ),
        _SupplierData(
          '13',
          'فون زون',
          'ملحقات وإكسسوارات الجوالات',
          'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.5,
          450,
          3800,
          true,
          ['إكسسوارات', 'كفرات'],
        ),
      ],
      'الكمبيوتر وألعاب الفيديو': [
        _SupplierData(
          '14',
          'قيمرز هب',
          'كل ما يحتاجه اللاعب المحترف',
          'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.8,
          280,
          4200,
          true,
          ['قيمنق', 'ألعاب'],
        ),
        _SupplierData(
          '15',
          'كمبيوتر لاند',
          'لابتوبات وكمبيوترات بأفضل المواصفات',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.7,
          150,
          2800,
          true,
          ['لابتوب', 'كمبيوتر'],
        ),
        _SupplierData(
          '16',
          'بلاي ستيشن ستور',
          'بلايستيشن واكسبوكس وملحقاتها',
          'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.6,
          320,
          3500,
          true,
          ['بلايستيشن', 'اكسبوكس'],
        ),
      ],
      'الملابس وإكسسواراتها': [
        _SupplierData(
          '17',
          'بيت الأزياء العربية',
          'أناقة عربية بلمسة عصرية',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.7,
          450,
          6500,
          true,
          ['أزياء', 'عربية'],
        ),
        _SupplierData(
          '18',
          'فاشن هاوس',
          'أحدث صيحات الموضة العالمية',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          380,
          5200,
          true,
          ['موضة', 'عالمية'],
        ),
        _SupplierData(
          '19',
          'ستايل مود',
          'ملابس عصرية للجميع',
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.5,
          520,
          4800,
          true,
          ['عصرية', 'أنيقة'],
        ),
      ],
      'زينة وقطع السيارات': [
        _SupplierData(
          '20',
          'أوتو بارتس',
          'قطع غيار أصلية لجميع السيارات',
          'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.6,
          280,
          3200,
          true,
          ['قطع غيار', 'سيارات'],
        ),
        _SupplierData(
          '21',
          'متجر السيارات',
          'إكسسوارات وزينة السيارات',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.5,
          350,
          2800,
          true,
          ['إكسسوارات', 'زينة'],
        ),
      ],
      'المنزل والحديقة': [
        _SupplierData(
          '22',
          'هوم سنتر',
          'كل ما يحتاجه منزلك',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.7,
          420,
          5500,
          true,
          ['منزل', 'أثاث'],
        ),
        _SupplierData(
          '23',
          'بيت الديكور',
          'ديكورات عصرية وكلاسيكية',
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          280,
          3800,
          true,
          ['ديكور', 'تصميم'],
        ),
      ],
      'الجمال': [
        _SupplierData(
          '24',
          'بيوتي لاند',
          'منتجات تجميل عالمية',
          'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.8,
          380,
          4500,
          true,
          ['تجميل', 'عالمية'],
        ),
        _SupplierData(
          '25',
          'عالم المكياج',
          'مكياج احترافي بأفضل الأسعار',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          520,
          6200,
          true,
          ['مكياج', 'احترافي'],
        ),
      ],
      'الصحة والرياضة': [
        _SupplierData(
          '26',
          'سبورتس هب',
          'معدات رياضية احترافية',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.7,
          220,
          3200,
          true,
          ['رياضة', 'معدات'],
        ),
        _SupplierData(
          '27',
          'فيتنس زون',
          'كل ما تحتاجه للياقتك',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          180,
          2500,
          true,
          ['لياقة', 'صحة'],
        ),
      ],
      'الكشتة والرحلات': [
        _SupplierData(
          '28',
          'أدفنشر ستور',
          'معدات التخييم والمغامرات',
          'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.6,
          150,
          2200,
          true,
          ['تخييم', 'مغامرات'],
        ),
        _SupplierData(
          '29',
          'كامبينج شوب',
          'كل ما تحتاجه للرحلات',
          'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.5,
          120,
          1800,
          true,
          ['رحلات', 'كشتة'],
        ),
      ],
      'الشنط والإكسسوارات': [
        _SupplierData(
          '30',
          'باقز آند مور',
          'شنط عالمية أصلية',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.7,
          280,
          3500,
          true,
          ['شنط', 'أصلية'],
        ),
        _SupplierData(
          '31',
          'أكسسوري هاوس',
          'إكسسوارات فاخرة',
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.6,
          420,
          4200,
          true,
          ['إكسسوارات', 'فاخرة'],
        ),
      ],
      'الأطفال': [
        _SupplierData(
          '32',
          'كيدز وورلد',
          'عالم متكامل للأطفال',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.8,
          350,
          4800,
          true,
          ['أطفال', 'ألعاب'],
        ),
        _SupplierData(
          '33',
          'توي لاند',
          'ألعاب آمنة وممتعة',
          'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.7,
          280,
          3500,
          true,
          ['ألعاب', 'آمنة'],
        ),
      ],
      'اللوازم الدراسية والمكتبية': [
        _SupplierData(
          '34',
          'مكتبة العلم',
          'كل اللوازم المدرسية والمكتبية',
          'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.5,
          420,
          3200,
          true,
          ['مدرسية', 'قرطاسية'],
        ),
        _SupplierData(
          '35',
          'أوفيس سبلاي',
          'مستلزمات المكاتب الحديثة',
          'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.4,
          180,
          2100,
          true,
          ['مكتبية', 'حديثة'],
        ),
      ],
      'الإنارة والمصابيح': [
        _SupplierData(
          '36',
          'لايت هاوس',
          'إضاءة عصرية لكل مكان',
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.6,
          150,
          2200,
          true,
          ['إضاءة', 'عصرية'],
        ),
        _SupplierData(
          '37',
          'إل إي دي ستور',
          'أحدث تقنيات الإضاءة LED',
          'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.5,
          120,
          1800,
          true,
          ['LED', 'موفرة'],
        ),
      ],
      'المواد الخام': [
        _SupplierData(
          '38',
          'فابريك سنتر',
          'أقمشة متنوعة بالجملة',
          'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
          'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
          4.5,
          180,
          1500,
          true,
          ['أقمشة', 'جملة'],
        ),
        _SupplierData(
          '39',
          'متجر الأقمشة',
          'جلود وخيوط بأنواعها',
          'https://images.unsplash.com/photo-1531819571556-12f47a3d0f31?w=800',
          'https://images.unsplash.com/photo-1549924231-f129b911e442?w=200',
          4.4,
          120,
          980,
          true,
          ['جلود', 'خيوط'],
        ),
      ],
    };

    return suppliersMap[categoryName] ?? [];
  }
}

// Supplier Data Model
class _SupplierData {
  final String id;
  final String name;
  final String description;
  final String coverImage;
  final String logoImage;
  final double rating;
  final int productsCount;
  final int followers;
  final bool isVerified;
  final List<String> tags;

  _SupplierData(
    this.id,
    this.name,
    this.description,
    this.coverImage,
    this.logoImage,
    this.rating,
    this.productsCount,
    this.followers,
    this.isVerified,
    this.tags,
  );
}
