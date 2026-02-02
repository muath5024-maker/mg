import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب التسويق
class MarketingTab extends StatelessWidget {
  const MarketingTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('التسويق'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // الأدوات المميزة (بالنقاط)
          _buildPremiumBanner(context, isDark),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'تحليل السوق',
            items: [
              _MenuItem(
                Icons.analytics_outlined,
                'محلل المبيعات',
                false,
                () => _showComingSoon(context, 'محلل المبيعات'),
              ),
              _MenuItem(
                Icons.people_alt_outlined,
                'سلوك العميل',
                false,
                () => _showComingSoon(context, 'سلوك العميل'),
              ),
              _MenuItem(
                Icons.compare_outlined,
                'تحليل المنافسين',
                true,
                () => _showComingSoon(context, 'تحليل المنافسين'),
              ),
              _MenuItem(
                Icons.schedule_outlined,
                'جدول زمني للمبيعات',
                false,
                () => _showComingSoon(context, 'جدول زمني'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الظهور والترويج',
            items: [
              _MenuItem(
                Icons.trending_up_outlined,
                'ظهور التفاعل بالمتجر',
                false,
                () => _showComingSoon(context, 'ظهور التفاعل'),
              ),
              _MenuItem(
                Icons.search_outlined,
                'تحسين محركات البحث (SEO)',
                true,
                () => _showComingSoon(context, 'SEO'),
              ),
              _MenuItem(
                Icons.web_outlined,
                'صفحة هبوط',
                true,
                () => _showComingSoon(context, 'صفحة هبوط'),
              ),
              _MenuItem(
                Icons.sell_outlined,
                'قنوات البيع',
                false,
                () => _showComingSoon(context, 'قنوات البيع'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'العروض والتذكيرات',
            items: [
              _MenuItem(
                Icons.flash_on_outlined,
                'عروض خاطفة',
                true,
                () => _showComingSoon(context, 'عروض خاطفة'),
              ),
              _MenuItem(
                Icons.price_change_outlined,
                'تعديل السعر تلقائي',
                true,
                () => _showComingSoon(context, 'تعديل السعر'),
              ),
              _MenuItem(
                Icons.notifications_active_outlined,
                'تذكيرات إعادة الشراء',
                false,
                () => _showComingSoon(context, 'تذكيرات'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الدعم الشخصي',
            items: [
              _MenuItem(
                Icons.support_agent_outlined,
                'مدير حساب شخصي',
                true,
                () => _showComingSoon(context, 'مدير حساب'),
              ),
              _MenuItem(
                Icons.headset_mic_outlined,
                'كول سنتر',
                true,
                () => _showComingSoon(context, 'كول سنتر'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumBanner(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor,
            AppTheme.primaryColor.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.diamond_outlined,
              color: Colors.white,
              size: 32,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أدوات التسويق المتقدمة',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'استخدم النقاط للوصول لأدوات تسويق احترافية',
                  style: TextStyle(fontSize: 12, color: Colors.white70),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.stars, size: 16, color: Colors.amber),
                SizedBox(width: 4),
                Text(
                  '250',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    bool isDark, {
    required String title,
    required List<_MenuItem> items,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : AppTheme.textPrimary,
              ),
            ),
          ),
          ...items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            return Column(
              children: [
                if (index > 0)
                  Divider(
                    height: 1,
                    indent: 56,
                    color: isDark ? Colors.white12 : AppTheme.borderColor,
                  ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      item.icon,
                      size: 20,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  title: Text(
                    item.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (item.isPremium)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.stars, size: 14, color: Colors.amber),
                              SizedBox(width: 4),
                              Text(
                                'نقاط',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (item.isPremium) const SizedBox(width: 8),
                      Icon(
                        Icons.chevron_right,
                        color: isDark ? Colors.white38 : AppTheme.textSecondary,
                      ),
                    ],
                  ),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    item.onTap();
                  },
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature - قريباً'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final bool isPremium;
  final VoidCallback onTap;

  _MenuItem(this.icon, this.title, this.isPremium, this.onTap);
}
