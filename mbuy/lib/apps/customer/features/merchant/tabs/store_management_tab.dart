import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب إدارة المتجر
class StoreManagementTab extends StatelessWidget {
  const StoreManagementTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('إدارة المتجر'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSection(
            context,
            isDark,
            title: 'معلومات المتجر',
            items: [
              _MenuItem(
                Icons.store_outlined,
                'بيانات المتجر',
                () => _showComingSoon(context, 'بيانات المتجر'),
              ),
              _MenuItem(
                Icons.palette_outlined,
                'مظهر المتجر',
                () => _showComingSoon(context, 'مظهر المتجر'),
              ),
              _MenuItem(
                Icons.verified_outlined,
                'توثيق المتجر',
                () => _showComingSoon(context, 'توثيق المتجر'),
              ),
              _MenuItem(
                Icons.workspace_premium_outlined,
                'باقة المتجر',
                () => _showComingSoon(context, 'باقة المتجر'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'التقارير والإحصائيات',
            items: [
              _MenuItem(
                Icons.analytics_outlined,
                'الإحصائيات',
                () => _showComingSoon(context, 'الإحصائيات'),
              ),
              _MenuItem(
                Icons.assessment_outlined,
                'التقارير',
                () => _showComingSoon(context, 'التقارير'),
              ),
              _MenuItem(
                Icons.star_outline,
                'التقييمات',
                () => _showComingSoon(context, 'التقييمات'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'المساعدة',
            items: [
              _MenuItem(
                Icons.tips_and_updates_outlined,
                'نصائح وتعليمات',
                () => _showComingSoon(context, 'نصائح وتعليمات'),
              ),
              _MenuItem(
                Icons.help_outline,
                'الدعم الفني',
                () => _showComingSoon(context, 'الدعم الفني'),
              ),
            ],
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
                  trailing: Icon(
                    Icons.chevron_right,
                    color: isDark ? Colors.white38 : AppTheme.textSecondary,
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
  final VoidCallback onTap;

  _MenuItem(this.icon, this.title, this.onTap);
}
