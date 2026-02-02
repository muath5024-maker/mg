import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب المنتجات
class ProductsTab extends StatelessWidget {
  const ProductsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('المنتجات'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => _showComingSoon(context, 'إضافة منتج'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSection(
            context,
            isDark,
            title: 'إدارة المنتجات',
            items: [
              _MenuItem(
                Icons.inventory_2_outlined,
                'جميع المنتجات',
                () => _showComingSoon(context, 'جميع المنتجات'),
              ),
              _MenuItem(
                Icons.add_box_outlined,
                'إضافة منتج',
                () => _showComingSoon(context, 'إضافة منتج'),
              ),
              _MenuItem(
                Icons.category_outlined,
                'التصنيفات',
                () => _showComingSoon(context, 'التصنيفات'),
              ),
              _MenuItem(
                Icons.local_offer_outlined,
                'العلامات',
                () => _showComingSoon(context, 'العلامات'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'المخزون',
            items: [
              _MenuItem(
                Icons.warehouse_outlined,
                'إدارة المخزون',
                () => _showComingSoon(context, 'إدارة المخزون'),
              ),
              _MenuItem(
                Icons.warning_amber_outlined,
                'تنبيهات النفاد',
                () => _showComingSoon(context, 'تنبيهات النفاد'),
              ),
              _MenuItem(
                Icons.sync_outlined,
                'مزامنة المخزون',
                () => _showComingSoon(context, 'مزامنة المخزون'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الاستيراد والتصدير',
            items: [
              _MenuItem(
                Icons.upload_file_outlined,
                'استيراد منتجات (Excel)',
                () => _showComingSoon(context, 'استيراد'),
              ),
              _MenuItem(
                Icons.download_outlined,
                'تصدير منتجات',
                () => _showComingSoon(context, 'تصدير'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'السجلات والإعدادات',
            items: [
              _MenuItem(
                Icons.history_outlined,
                'سجل التعديلات',
                () => _showComingSoon(context, 'سجل التعديلات'),
              ),
              _MenuItem(
                Icons.settings_outlined,
                'إعدادات المنتجات',
                () => _showComingSoon(context, 'إعدادات المنتجات'),
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
