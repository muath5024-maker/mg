import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../../providers/user_type_provider.dart';
import '../../../../providers/merchant_providers.dart';
import '../../../../features/auth/data/auth_controller.dart';
import '../../../../core/controllers/root_controller.dart';
import '../../core/theme/app_theme.dart';

/// صفحة Dashboard التاجر المتقدمة
class MerchantDashboard extends ConsumerWidget {
  const MerchantDashboard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statsAsync = ref.watch(merchantDashboardStatsProvider);
    final storeAsync = ref.watch(merchantStoreProvider);
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(merchantDashboardStatsProvider);
          ref.invalidate(merchantStoreProvider);
          await Future.delayed(const Duration(milliseconds: 500));
        },
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  const SizedBox(height: 16),
                  // الحساب الشخصي مع رابط المتجر
                  _buildProfileCard(context, ref, isDark, storeAsync),
                  const SizedBox(height: 16),
                  // شبكة الإحصائيات الرئيسية
                  _buildStatsGrid(context, ref, isDark, statsAsync),
                  const SizedBox(height: 16),
                  // شبكة الميزات والأدوات
                  _buildFeaturesGrid(context, ref, isDark),
                  const SizedBox(height: 24),
                  // قسم الإعدادات السريعة
                  _buildQuickSettings(context, ref, isDark),
                  // مسافة للـ navbar السفلي
                  SizedBox(height: 80 + bottomPadding),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// بطاقة الحساب الشخصي مع رابط المتجر
  Widget _buildProfileCard(
    BuildContext context,
    WidgetRef ref,
    bool isDark,
    AsyncValue<MerchantStoreData> storeAsync,
  ) {
    final authState = ref.watch(authControllerProvider);

    return storeAsync.when(
      data: (store) {
        final userName = store.businessName.isNotEmpty
            ? store.businessName
            : (authState.displayName ?? 'تاجر مباي');
        final isVerified = store.verified;
        final storeSlug = store.slug ?? 'my-shop';
        final storeUrl = 'mbuy.app/$storeSlug';

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppTheme.surfaceColorDark : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: AppTheme.cardShadow,
          ),
          child: Column(
            children: [
              // الصف الأول: الصورة والمعلومات
              Row(
                children: [
                  // صورة المستخدم
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: AppTheme.merchantHeaderGradient,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppTheme.primaryColor.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    ),
                    child: store.logoUrl != null
                        ? ClipOval(
                            child: Image.network(
                              store.logoUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(
                                    Icons.person,
                                    size: 28,
                                    color: AppTheme.primaryColor,
                                  ),
                            ),
                          )
                        : const Icon(
                            Icons.person,
                            size: 28,
                            color: AppTheme.primaryColor,
                          ),
                  ),
                  const SizedBox(width: 12),
                  // معلومات المستخدم
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              isVerified ? Icons.verified : Icons.pending,
                              size: 14,
                              color: isVerified
                                  ? AppTheme.successColor
                                  : AppTheme.warningColor,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isVerified ? 'متجر موثق' : 'قيد المراجعة',
                              style: TextStyle(
                                fontSize: 12,
                                color: isVerified
                                    ? AppTheme.successColor
                                    : AppTheme.warningColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // زر تعديل الملف الشخصي
                  IconButton(
                    onPressed: () =>
                        _showComingSoon(context, 'تعديل الملف الشخصي'),
                    icon: Icon(
                      Icons.edit_note_outlined,
                      color: isDark ? Colors.white70 : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // رابط المتجر
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: isDark ? Colors.black26 : AppTheme.surfaceColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.link, size: 16, color: AppTheme.primaryColor),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        storeUrl,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryColor,
                        ),
                        textDirection: TextDirection.ltr,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        Clipboard.setData(
                          ClipboardData(text: 'https://$storeUrl'),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('تم نسخ الرابط'),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.copy,
                          size: 16,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () {
                        SharePlus.instance.share(
                          ShareParams(
                            text: 'تسوق من متجري على مباي: https://$storeUrl',
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.share_outlined,
                          size: 16,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
      loading: () => _buildShimmerCard(isDark, height: 140),
      error: (error, stackTrace) =>
          _buildProfileCardFallback(context, ref, isDark),
    );
  }

  /// بطاقة الملف الشخصي البديلة
  Widget _buildProfileCardFallback(
    BuildContext context,
    WidgetRef ref,
    bool isDark,
  ) {
    final authState = ref.watch(authControllerProvider);
    final userName = authState.displayName ?? 'تاجر مباي';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, size: 30, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  userName,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.verified,
                      size: 14,
                      color: AppTheme.successColor,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'متجر موثق',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.successColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _showComingSoon(context, 'تعديل الملف الشخصي'),
            icon: Icon(
              Icons.edit_note_outlined,
              color: isDark ? Colors.white70 : AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  /// شبكة الإحصائيات الرئيسية
  Widget _buildStatsGrid(
    BuildContext context,
    WidgetRef ref,
    bool isDark,
    AsyncValue<MerchantDashboardStats> statsAsync,
  ) {
    return statsAsync.when(
      data: (stats) => Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context: context,
                  icon: Icons.account_balance_wallet_outlined,
                  value: _formatNumber(stats.walletBalance),
                  label: 'المحفظة (ر.س)',
                  onTap: () => _showComingSoon(context, 'المحفظة'),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context: context,
                  icon: Icons.shopping_cart_outlined,
                  value: stats.todayOrders.toString(),
                  label: 'طلبات اليوم',
                  onTap: () => context.push('/merchant/orders'),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context: context,
                  icon: Icons.trending_up,
                  value: _formatNumber(stats.totalSales),
                  label: 'إجمالي المبيعات',
                  onTap: () => context.push('/merchant/sales'),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context: context,
                  icon: Icons.people_outline,
                  value: stats.totalCustomers.toString(),
                  label: 'العملاء',
                  onTap: () => _showComingSoon(context, 'قائمة العملاء'),
                  isDark: isDark,
                ),
              ),
            ],
          ),
        ],
      ),
      loading: () => _buildStatsGridShimmer(isDark),
      error: (error, stackTrace) => _buildStatsGridFallback(context, isDark),
    );
  }

  /// تنسيق الأرقام
  String _formatNumber(double value) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }
    return value.toStringAsFixed(0);
  }

  /// شبكة الإحصائيات أثناء التحميل
  Widget _buildStatsGridShimmer(bool isDark) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildShimmerCard(isDark, height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _buildShimmerCard(isDark, height: 110)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildShimmerCard(isDark, height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _buildShimmerCard(isDark, height: 110)),
          ],
        ),
      ],
    );
  }

  /// شبكة الإحصائيات البديلة
  Widget _buildStatsGridFallback(BuildContext context, bool isDark) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context: context,
                icon: Icons.account_balance_wallet_outlined,
                value: '0',
                label: 'المحفظة (ر.س)',
                onTap: () => _showComingSoon(context, 'المحفظة'),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context: context,
                icon: Icons.shopping_cart_outlined,
                value: '0',
                label: 'طلبات اليوم',
                onTap: () => context.push('/merchant/orders'),
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                context: context,
                icon: Icons.trending_up,
                value: '0',
                label: 'إجمالي المبيعات',
                onTap: () => context.push('/merchant/sales'),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                context: context,
                icon: Icons.people_outline,
                value: '0',
                label: 'العملاء',
                onTap: () => _showComingSoon(context, 'قائمة العملاء'),
                isDark: isDark,
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// بطاقة التحميل (Shimmer)
  Widget _buildShimmerCard(bool isDark, {required double height}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppTheme.primaryColor.withValues(alpha: 0.5),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required BuildContext context,
    required IconData icon,
    required String value,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surfaceColorDark : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? Colors.white12 : AppTheme.borderColor,
            width: 0.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 20, color: AppTheme.primaryColor),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// شبكة الأدوات والميزات
  Widget _buildFeaturesGrid(BuildContext context, WidgetRef ref, bool isDark) {
    final features = [
      // الصف الأول
      {
        'icon': Icons.inventory_2_outlined,
        'label': 'المنتجات',
        'route': '/merchant/products-tab',
      },
      {
        'icon': Icons.receipt_long_outlined,
        'label': 'الطلبات',
        'route': '/merchant/orders-tab',
      },
      {
        'icon': Icons.campaign_outlined,
        'label': 'التسويق',
        'route': '/merchant/marketing-tab',
      },
      {
        'icon': Icons.store_outlined,
        'label': 'إدارة المتجر',
        'route': '/merchant/store-management',
      },
      // الصف الثاني
      {
        'icon': Icons.people_outline,
        'label': 'الفريق',
        'route': '/merchant/team',
      },
      {
        'icon': Icons.sync_alt_outlined,
        'label': 'المزامنة',
        'route': '/merchant/sync',
      },
      {
        'icon': Icons.auto_awesome_outlined,
        'label': 'الاستديو',
        'route': '/merchant/creative-studio',
      },
      {
        'icon': Icons.settings_outlined,
        'label': 'الإعدادات',
        'route': '/merchant/settings',
      },
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: features.map((f) {
        // 4 أيقونات في كل صف
        final double width = (MediaQuery.of(context).size.width - 32 - 30) / 4;
        return _buildFeatureItem(
          context: context,
          icon: f['icon'] as IconData,
          label: f['label'] as String,
          width: width,
          onTap: () {
            if (f['route'] != null) {
              context.push(f['route'] as String);
            } else {
              _showComingSoon(context, f['label'] as String);
            }
          },
          isDark: isDark,
        );
      }).toList(),
    );
  }

  Widget _buildFeatureItem({
    required BuildContext context,
    required IconData icon,
    required String label,
    required double width,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: width,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.surfaceColorDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 28,
              color: isDark ? Colors.white70 : AppTheme.textPrimary,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : AppTheme.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  /// الإعدادات السريعة (تبديل الحساب وتسجيل الخروج)
  Widget _buildQuickSettings(BuildContext context, WidgetRef ref, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          _buildSettingsTile(
            icon: Icons.swap_horiz,
            title: 'التبديل لحساب العميل',
            color: Colors.blue,
            onTap: () {
              ref.read(appUserTypeProvider.notifier).state =
                  AppUserType.customer;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم التبديل لحساب العميل')),
              );
            },
          ),
          const Divider(height: 1, indent: 56),
          _buildSettingsTile(
            icon: Icons.logout,
            title: 'تسجيل الخروج',
            color: Colors.red,
            onTap: () async {
              await ref.read(authControllerProvider.notifier).logout();
              ref.read(rootControllerProvider.notifier).reset();
              ref.read(appUserTypeProvider.notifier).state =
                  AppUserType.customer;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
      trailing: Icon(
        Icons.arrow_forward_ios,
        size: 14,
        color: color.withValues(alpha: 0.5),
      ),
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - ستكون متاحة قريباً'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }
}
