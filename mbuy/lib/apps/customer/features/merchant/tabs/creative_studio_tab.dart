import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب الاستديو الإبداعي
class CreativeStudioTab extends StatelessWidget {
  const CreativeStudioTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('الاستديو الإبداعي'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(left: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFEDE4), Color(0xFFFFD9C7)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.stars, size: 18, color: AppTheme.primaryColor),
                const SizedBox(width: 4),
                Text(
                  '450 نقطة',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // الأدوات السريعة
          _buildQuickTools(context, isDark),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'توليد الصور',
            items: [
              _StudioItem(
                Icons.auto_awesome,
                'توليد صور AI',
                '10 نقاط',
                Colors.purple,
                () => _showComingSoon(context, 'توليد صور'),
              ),
              _StudioItem(
                Icons.auto_fix_high,
                'إزالة الخلفية',
                '5 نقاط',
                Colors.blue,
                () => _showComingSoon(context, 'إزالة الخلفية'),
              ),
              _StudioItem(
                Icons.hd,
                'تحسين الجودة',
                '3 نقاط',
                Colors.green,
                () => _showComingSoon(context, 'تحسين الجودة'),
              ),
              _StudioItem(
                Icons.wallpaper,
                'توحيد خلفيات المنتجات',
                '5 نقاط',
                Colors.teal,
                () => _showComingSoon(context, 'توحيد خلفيات'),
              ),
              _StudioItem(
                Icons.brush,
                'لوجو',
                '20 نقاط',
                Colors.orange,
                () => _showComingSoon(context, 'لوجو'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الفيديو',
            items: [
              _StudioItem(
                Icons.movie_creation,
                'فيديو قصير',
                '25 نقاط',
                Colors.red,
                () => _showComingSoon(context, 'فيديو قصير'),
              ),
              _StudioItem(
                Icons.person_outline,
                'فيديو UGC',
                '50 نقاط',
                Colors.pink,
                () => _showComingSoon(context, 'UGC'),
              ),
              _StudioItem(
                Icons.animation,
                'موشن جرافيك',
                '30 نقاط',
                Colors.indigo,
                () => _showComingSoon(context, 'موشن جرافيك'),
              ),
              _StudioItem(
                Icons.video_chat,
                'فيديو حواري',
                '40 نقاط',
                Colors.blue,
                () => _showComingSoon(context, 'فيديو حواري'),
              ),
              _StudioItem(
                Icons.photo_library,
                'صور مع صوت',
                '15 نقاط',
                Colors.cyan,
                () => _showComingSoon(context, 'صور مع صوت'),
              ),
              _StudioItem(
                Icons.cut,
                'قص ودمج',
                '10 نقاط',
                Colors.grey,
                () => _showComingSoon(context, 'قص ودمج'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'الصوت',
            items: [
              _StudioItem(
                Icons.record_voice_over,
                'تحويل نص لصوت',
                '5 نقاط',
                Colors.deepPurple,
                () => _showComingSoon(context, 'نص لصوت'),
              ),
              _StudioItem(
                Icons.music_note,
                'موسيقى خلفية',
                '3 نقاط',
                Colors.pink,
                () => _showComingSoon(context, 'موسيقى'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'متقدم',
            items: [
              _StudioItem(
                Icons.campaign,
                'إعلان كامل',
                '100 نقاط',
                Colors.red,
                () => _showComingSoon(context, 'إعلان كامل'),
              ),
              _StudioItem(
                Icons.face,
                'أفاتار',
                '50 نقاط',
                Colors.blue,
                () => _showComingSoon(context, 'أفاتار'),
              ),
              _StudioItem(
                Icons.view_in_ar,
                '3D',
                '40 نقاط',
                Colors.purple,
                () => _showComingSoon(context, '3D'),
              ),
              _StudioItem(
                Icons.gif,
                'تحريك الصور',
                '15 نقاط',
                Colors.orange,
                () => _showComingSoon(context, 'تحريك الصور'),
              ),
              _StudioItem(
                Icons.video_library,
                'هوكات وفلوقات',
                '30 نقاط',
                Colors.green,
                () => _showComingSoon(context, 'هوكات'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'القوالب',
            items: [
              _StudioItem(
                Icons.dashboard,
                'قوالب جاهزة',
                'مجاني',
                Colors.teal,
                () => _showComingSoon(context, 'قوالب'),
              ),
              _StudioItem(
                Icons.share,
                'سوشيال ميديا',
                'مجاني',
                Colors.blue,
                () => _showComingSoon(context, 'قوالب سوشيال'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickTools(BuildContext context, bool isDark) {
    final tools = [
      {
        'icon': Icons.auto_fix_high,
        'label': 'إزالة خلفية',
        'color': Colors.blue,
      },
      {'icon': Icons.hd, 'label': 'تحسين جودة', 'color': Colors.green},
      {
        'icon': Icons.auto_awesome,
        'label': 'توليد صورة',
        'color': Colors.purple,
      },
      {
        'icon': Icons.movie_creation,
        'label': 'فيديو سريع',
        'color': Colors.red,
      },
    ];

    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tools.length,
        separatorBuilder: (context, index) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final tool = tools[index];
          return GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              _showComingSoon(context, tool['label'] as String);
            },
            child: Container(
              width: 85,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.surfaceColorDark : Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (tool['color'] as Color).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      tool['icon'] as IconData,
                      size: 24,
                      color: tool['color'] as Color,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    tool['label'] as String,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white70 : AppTheme.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    bool isDark, {
    required String title,
    required List<_StudioItem> items,
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
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: item.cost == 'مجاني'
                              ? Colors.green.withValues(alpha: 0.1)
                              : AppTheme.primaryColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          item.cost,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: item.cost == 'مجاني'
                                ? Colors.green
                                : AppTheme.primaryColor,
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

class _StudioItem {
  final IconData icon;
  final String title;
  final String cost;
  final Color color;
  final VoidCallback onTap;

  _StudioItem(this.icon, this.title, this.cost, this.color, this.onTap);
}
