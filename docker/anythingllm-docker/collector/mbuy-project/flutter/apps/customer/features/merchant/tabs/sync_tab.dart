import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب المزامنة والنشر
class SyncTab extends StatelessWidget {
  const SyncTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('المزامنة والنشر'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // حالة المزامنة
          _buildSyncStatus(context, isDark),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'منصات التجارة الإلكترونية',
            items: [
              _PlatformItem(
                'Amazon',
                'assets/icons/amazon.png',
                Icons.shopping_bag,
                Colors.orange,
                true,
                () => _showComingSoon(context, 'Amazon'),
              ),
              _PlatformItem(
                'Noon',
                'assets/icons/noon.png',
                Icons.shopping_cart,
                Colors.yellow,
                false,
                () => _showComingSoon(context, 'Noon'),
              ),
              _PlatformItem(
                'Alibaba',
                'assets/icons/alibaba.png',
                Icons.store,
                Colors.orange,
                false,
                () => _showComingSoon(context, 'Alibaba'),
              ),
              _PlatformItem(
                'AliExpress',
                'assets/icons/aliexpress.png',
                Icons.local_shipping,
                Colors.red,
                false,
                () => _showComingSoon(context, 'AliExpress'),
              ),
              _PlatformItem(
                'Shopify',
                'assets/icons/shopify.png',
                Icons.storefront,
                Colors.green,
                false,
                () => _showComingSoon(context, 'Shopify'),
              ),
              _PlatformItem(
                'مخازن',
                'assets/icons/makhazin.png',
                Icons.warehouse,
                Colors.blue,
                false,
                () => _showComingSoon(context, 'مخازن'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'السوشيال ميديا',
            items: [
              _PlatformItem(
                'Instagram Shop',
                null,
                Icons.camera_alt,
                Colors.pink,
                false,
                () => _showComingSoon(context, 'Instagram'),
              ),
              _PlatformItem(
                'TikTok Shop',
                null,
                Icons.music_note,
                Colors.black,
                false,
                () => _showComingSoon(context, 'TikTok'),
              ),
              _PlatformItem(
                'Snapchat Shop',
                null,
                Icons.photo_camera_front,
                Colors.yellow,
                false,
                () => _showComingSoon(context, 'Snapchat'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'البحث والإعلانات',
            items: [
              _PlatformItem(
                'Google Shopping',
                null,
                Icons.search,
                Colors.blue,
                false,
                () => _showComingSoon(context, 'Google'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'نشر المحتوى',
            items: [
              _PlatformItem(
                'نشر في جميع المنصات',
                null,
                Icons.share,
                AppTheme.primaryColor,
                false,
                () => _showComingSoon(context, 'نشر شامل'),
              ),
              _PlatformItem(
                'نشر في السوشيال ميديا',
                null,
                Icons.group,
                Colors.purple,
                false,
                () => _showComingSoon(context, 'نشر سوشيال'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSyncStatus(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.sync, size: 28, color: Colors.green),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'المخزون موحد',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppTheme.textPrimary,
                  ),
                ),
                const Text(
                  'آخر مزامنة: منذ 5 دقائق',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => _showComingSoon(context, 'مزامنة'),
            child: const Text('مزامنة الآن'),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    bool isDark, {
    required String title,
    required List<_PlatformItem> items,
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
                      color: item.color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(item.icon, size: 20, color: item.color),
                  ),
                  title: Text(
                    item.name,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (item.isConnected)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.check_circle,
                                size: 14,
                                color: Colors.green,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'متصل',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'ربط',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.primaryColor,
                            ),
                          ),
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

class _PlatformItem {
  final String name;
  final String? iconAsset;
  final IconData icon;
  final Color color;
  final bool isConnected;
  final VoidCallback onTap;

  _PlatformItem(
    this.name,
    this.iconAsset,
    this.icon,
    this.color,
    this.isConnected,
    this.onTap,
  );
}
