import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../merchant/data/merchant_store_provider.dart';
import '../../data/boost_service.dart';
import '../../providers/boost_provider.dart';

/// شاشة ضاعف ظهورك - الشاشة الرئيسية
class BoostVisibilityScreen extends ConsumerStatefulWidget {
  final VoidCallback? onClose;

  const BoostVisibilityScreen({super.key, this.onClose});

  @override
  ConsumerState<BoostVisibilityScreen> createState() =>
      _BoostVisibilityScreenState();
}

class _BoostVisibilityScreenState extends ConsumerState<BoostVisibilityScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storeAsync = ref.watch(merchantStoreControllerProvider);
    final store = storeAsync.hasValue ? storeAsync.value : null;
    final activeBoostsAsync = ref.watch(activeBoostsProvider);

    // التحقق من وجود متجر
    if (store == null && !storeAsync.isLoading) {
      return _buildNoStoreScreen(context);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'ضاعف ظهورك ⚡',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: SvgPicture.asset(
            AppIcons.arrowBack,
            width: 20,
            height: 20,
            colorFilter: const ColorFilter.mode(
              Colors.black87,
              BlendMode.srcIn,
            ),
          ),
          onPressed: () {
            if (widget.onClose != null) {
              widget.onClose!();
            } else {
              context.pop();
            }
          },
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppTheme.primaryColor,
          tabs: const [
            Tab(text: 'دعم المنتجات'),
            Tab(text: 'دعم المتجر'),
            Tab(text: 'الدعم النشط'),
          ],
        ),
      ),
      body: Column(
        children: [
          // رصيد النقاط
          _buildPointsBalance(store?.pointsBalance ?? 0),

          // محتوى التبويبات
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _ProductBoostTab(store: store),
                _StoreBoostTab(store: store),
                _ActiveBoostsTab(activeBoostsAsync: activeBoostsAsync),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoStoreScreen(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          'ضاعف ظهورك ⚡',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: SvgPicture.asset(
            AppIcons.arrowBack,
            width: 20,
            height: 20,
            colorFilter: const ColorFilter.mode(
              Colors.black87,
              BlendMode.srcIn,
            ),
          ),
          onPressed: () {
            if (widget.onClose != null) {
              widget.onClose!();
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              AppIcons.store,
              width: 64,
              height: 64,
              colorFilter: const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
            ),
            const SizedBox(height: 16),
            const Text(
              'لا يوجد متجر',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'يرجى إنشاء متجر أولاً',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.push('/dashboard/store/create-store'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('إنشاء متجر'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPointsBalance(int points) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryColor.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.stars, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'رصيد النقاط',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  '$points نقطة',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/dashboard/points'),
            style: TextButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'شراء نقاط',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}

/// تبويب دعم المنتجات
class _ProductBoostTab extends ConsumerWidget {
  final dynamic store;

  const _ProductBoostTab({required this.store});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'اختر نوع الدعم لمنتجاتك',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'ضاعف ظهور منتجاتك واجذب المزيد من العملاء',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 20),

          // منتج مميز
          _BoostOptionCard(
            title: 'منتج مميز ⭐',
            description:
                'يظهر منتجك في قسم "المنتجات المميزة" في الصفحة الرئيسية',
            pointsPerDay: 50,
            icon: Icons.star,
            color: Colors.amber,
            onTap: () => _showProductSelector(context, ref, 'featured', 50),
          ),
          const SizedBox(height: 12),

          // أعلى الفئة
          _BoostOptionCard(
            title: 'أعلى الفئة 📂',
            description: 'يظهر منتجك في أعلى صفحة الفئة التي ينتمي إليها',
            pointsPerDay: 30,
            icon: Icons.category,
            color: Colors.blue,
            onTap: () => _showProductSelector(context, ref, 'category_top', 30),
          ),
          const SizedBox(height: 12),

          // أعلى البحث
          _BoostOptionCard(
            title: 'أعلى البحث 🔍',
            description:
                'يظهر منتجك في أعلى نتائج البحث عند البحث عن كلمات مشابهة',
            pointsPerDay: 40,
            icon: Icons.search,
            color: Colors.green,
            onTap: () => _showProductSelector(context, ref, 'search_top', 40),
          ),
        ],
      ),
    );
  }

  void _showProductSelector(
    BuildContext context,
    WidgetRef ref,
    String boostType,
    int pointsPerDay,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _ProductSelectorSheet(
        boostType: boostType,
        pointsPerDay: pointsPerDay,
        storeId: store?.id ?? '',
      ),
    );
  }
}

/// تبويب دعم المتجر
class _StoreBoostTab extends ConsumerWidget {
  final dynamic store;

  const _StoreBoostTab({required this.store});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'دعم ظهور متجرك',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'اجعل متجرك أكثر بروزاً للعملاء',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
          ),
          const SizedBox(height: 20),

          // متجر مميز
          _BoostOptionCard(
            title: 'متجر مميز 🏪',
            description:
                'يظهر متجرك في قسم "المتاجر المميزة" في الصفحة الرئيسية',
            pointsPerDay: 100,
            minDays: 7,
            icon: Icons.store,
            color: Colors.purple,
            onTap: () =>
                _showDurationSelector(context, ref, 'featured', 100, 7),
          ),
          const SizedBox(height: 12),

          // بانر الصفحة الرئيسية
          _BoostOptionCard(
            title: 'بانر الرئيسية 🖼️',
            description: 'بانر إعلاني لمتجرك في أعلى الصفحة الرئيسية',
            pointsPerDay: 200,
            minDays: 7,
            icon: Icons.view_carousel,
            color: Colors.orange,
            onTap: () =>
                _showDurationSelector(context, ref, 'home_banner', 200, 7),
          ),
        ],
      ),
    );
  }

  void _showDurationSelector(
    BuildContext context,
    WidgetRef ref,
    String boostType,
    int pointsPerDay,
    int minDays,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _DurationSelectorSheet(
        boostType: boostType,
        pointsPerDay: pointsPerDay,
        minDays: minDays,
        isStore: true,
      ),
    );
  }
}

/// تبويب الدعم النشط
class _ActiveBoostsTab extends StatelessWidget {
  final AsyncValue<List<BoostTransaction>> activeBoostsAsync;

  const _ActiveBoostsTab({required this.activeBoostsAsync});

  @override
  Widget build(BuildContext context) {
    return activeBoostsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('حدث خطأ: $error'),
          ],
        ),
      ),
      data: (boosts) {
        if (boosts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.rocket_launch_outlined,
                  size: 64,
                  color: Colors.grey[400],
                ),
                const SizedBox(height: 16),
                const Text(
                  'لا يوجد دعم نشط',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'ابدأ بدعم منتجاتك أو متجرك الآن',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: boosts.length,
          itemBuilder: (context, index) {
            final boost = boosts[index];
            return _ActiveBoostCard(boost: boost);
          },
        );
      },
    );
  }
}

/// بطاقة خيار الدعم
class _BoostOptionCard extends StatelessWidget {
  final String title;
  final String description;
  final int pointsPerDay;
  final int minDays;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _BoostOptionCard({
    required this.title,
    required this.description,
    required this.pointsPerDay,
    this.minDays = 1,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$pointsPerDay نقطة/يوم',
                            style: const TextStyle(
                              color: AppTheme.primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        if (minDays > 1) ...[
                          const SizedBox(width: 8),
                          Text(
                            'الحد الأدنى $minDays أيام',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}

/// بطاقة الدعم النشط
class _ActiveBoostCard extends ConsumerWidget {
  final BoostTransaction boost;

  const _ActiveBoostCard({required this.boost});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isProduct = boost.targetType == 'product';
    final daysLeft = boost.remainingDays;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: (isProduct ? Colors.blue : Colors.purple).withValues(
                      alpha: 0.1,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isProduct ? Icons.inventory_2 : Icons.store,
                    color: isProduct ? Colors.blue : Colors.purple,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        boost.boostTypeName,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        isProduct ? 'منتج' : 'متجر',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: daysLeft > 3
                        ? Colors.green.withValues(alpha: 0.1)
                        : Colors.orange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '$daysLeft يوم متبقي',
                    style: TextStyle(
                      color: daysLeft > 3 ? Colors.green : Colors.orange,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${boost.pointsSpent} نقطة',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
                Text(
                  'ينتهي: ${_formatDate(boost.expiresAt)}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

/// شاشة اختيار المنتج
class _ProductSelectorSheet extends ConsumerStatefulWidget {
  final String boostType;
  final int pointsPerDay;
  final String storeId;

  const _ProductSelectorSheet({
    required this.boostType,
    required this.pointsPerDay,
    required this.storeId,
  });

  @override
  ConsumerState<_ProductSelectorSheet> createState() =>
      _ProductSelectorSheetState();
}

class _ProductSelectorSheetState extends ConsumerState<_ProductSelectorSheet> {
  String? selectedProductId;
  int durationDays = 7;

  @override
  Widget build(BuildContext context) {
    final totalPoints = widget.pointsPerDay * durationDays;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'اختر المنتج والمدة',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),

          // TODO: قائمة المنتجات من API
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.inventory_2, color: Colors.grey),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'اختر منتجاً',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // اختيار المدة
          const Text(
            'مدة الدعم',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [3, 7, 14, 30].map((days) {
              final isSelected = durationDays == days;
              return ChoiceChip(
                label: Text('$days أيام'),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) setState(() => durationDays = days);
                },
                selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // الملخص
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('التكلفة الإجمالية'),
                Text(
                  '$totalPoints نقطة',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: selectedProductId != null ? _purchaseBoost : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'تفعيل الدعم',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _purchaseBoost() async {
    if (selectedProductId == null) return;

    final controller = ref.read(boostControllerProvider.notifier);
    final result = await controller.purchaseProductBoost(
      productId: selectedProductId!,
      boostType: widget.boostType,
      durationDays: durationDays,
    );

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: result.success ? Colors.green : Colors.red,
        ),
      );
    }
  }
}

/// شاشة اختيار المدة للمتجر
class _DurationSelectorSheet extends ConsumerStatefulWidget {
  final String boostType;
  final int pointsPerDay;
  final int minDays;
  final bool isStore;

  const _DurationSelectorSheet({
    required this.boostType,
    required this.pointsPerDay,
    required this.minDays,
    required this.isStore,
  });

  @override
  ConsumerState<_DurationSelectorSheet> createState() =>
      _DurationSelectorSheetState();
}

class _DurationSelectorSheetState
    extends ConsumerState<_DurationSelectorSheet> {
  late int durationDays;

  @override
  void initState() {
    super.initState();
    durationDays = widget.minDays;
  }

  @override
  Widget build(BuildContext context) {
    final totalPoints = widget.pointsPerDay * durationDays;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'اختر مدة الدعم',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),

          // اختيار المدة
          Wrap(
            spacing: 8,
            children: [7, 14, 21, 30].where((d) => d >= widget.minDays).map((
              days,
            ) {
              final isSelected = durationDays == days;
              return ChoiceChip(
                label: Text('$days يوم'),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) setState(() => durationDays = days);
                },
                selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: isSelected ? AppTheme.primaryColor : Colors.grey[600],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // الملخص
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('التكلفة الإجمالية'),
                Text(
                  '$totalPoints نقطة',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _purchaseBoost,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'تفعيل الدعم',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _purchaseBoost() async {
    final controller = ref.read(boostControllerProvider.notifier);
    final result = await controller.purchaseStoreBoost(
      boostType: widget.boostType,
      durationDays: durationDays,
    );

    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: result.success ? Colors.green : Colors.red,
        ),
      );
    }
  }
}
