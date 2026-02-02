import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب الطلبات
class OrdersTab extends StatelessWidget {
  const OrdersTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('الطلبات'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ملخص سريع
          _buildQuickStats(context, isDark),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'إدارة الطلبات',
            items: [
              _MenuItem(
                Icons.pending_actions_outlined,
                'طلبات جديدة',
                '5',
                Colors.orange,
                () => _showComingSoon(context, 'طلبات جديدة'),
              ),
              _MenuItem(
                Icons.local_shipping_outlined,
                'قيد التوصيل',
                '3',
                Colors.blue,
                () => _showComingSoon(context, 'قيد التوصيل'),
              ),
              _MenuItem(
                Icons.check_circle_outline,
                'مكتملة',
                '45',
                Colors.green,
                () => _showComingSoon(context, 'مكتملة'),
              ),
              _MenuItem(
                Icons.cancel_outlined,
                'ملغية',
                '2',
                Colors.red,
                () => _showComingSoon(context, 'ملغية'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الفواتير',
            items: [
              _MenuItem(
                Icons.receipt_long_outlined,
                'تخصيص الفاتورة',
                null,
                null,
                () => _showComingSoon(context, 'تخصيص الفاتورة'),
              ),
              _MenuItem(
                Icons.print_outlined,
                'طباعة الفواتير',
                null,
                null,
                () => _showComingSoon(context, 'طباعة'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'أخرى',
            items: [
              _MenuItem(
                Icons.delete_outline,
                'الطلبات المحذوفة',
                null,
                null,
                () => _showComingSoon(context, 'الطلبات المحذوفة'),
              ),
              _MenuItem(
                Icons.history_outlined,
                'سجل الطلبات',
                null,
                null,
                () => _showComingSoon(context, 'سجل الطلبات'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats(BuildContext context, bool isDark) {
    return Row(
      children: [
        Expanded(child: _buildStatCard(isDark, 'اليوم', '8', Icons.today)),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(isDark, 'الأسبوع', '34', Icons.date_range),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(isDark, 'الشهر', '156', Icons.calendar_month),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    bool isDark,
    String label,
    String value,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: AppTheme.primaryColor),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
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
                      color: (item.badgeColor ?? AppTheme.primaryColor)
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      item.icon,
                      size: 20,
                      color: item.badgeColor ?? AppTheme.primaryColor,
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
                      if (item.badge != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color:
                                item.badgeColor?.withValues(alpha: 0.1) ??
                                Colors.grey.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item.badge!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: item.badgeColor ?? AppTheme.textSecondary,
                            ),
                          ),
                        ),
                      const SizedBox(width: 8),
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
  final String? badge;
  final Color? badgeColor;
  final VoidCallback onTap;

  _MenuItem(this.icon, this.title, this.badge, this.badgeColor, this.onTap);
}
