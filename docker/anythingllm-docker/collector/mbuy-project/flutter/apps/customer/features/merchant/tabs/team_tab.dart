import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

/// تبويب الفريق
class TeamTab extends StatelessWidget {
  const TeamTab({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? AppTheme.backgroundColorDark
          : AppTheme.surfaceColor,
      appBar: AppBar(
        title: const Text('الفريق'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => _showComingSoon(context, 'إضافة موظف'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ملخص الفريق
          _buildTeamSummary(context, isDark),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'إدارة الموظفين',
            items: [
              _MenuItem(
                Icons.people_outline,
                'جميع الموظفين',
                '3',
                () => _showComingSoon(context, 'الموظفين'),
              ),
              _MenuItem(
                Icons.person_add_alt_1_outlined,
                'توظيف جديد',
                null,
                () => _showComingSoon(context, 'توظيف'),
              ),
              _MenuItem(
                Icons.admin_panel_settings_outlined,
                'الصلاحيات',
                null,
                () => _showComingSoon(context, 'الصلاحيات'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'خدمات الدعم',
            items: [
              _MenuItem(
                Icons.support_agent_outlined,
                'مدير حساب شخصي',
                'مميز',
                () => _showComingSoon(context, 'مدير حساب'),
              ),
              _MenuItem(
                Icons.headset_mic_outlined,
                'كول سنتر',
                'مميز',
                () => _showComingSoon(context, 'كول سنتر'),
              ),
              _MenuItem(
                Icons.chat_outlined,
                'خدمة عملاء واتس',
                null,
                () => _showComingSoon(context, 'خدمة واتس'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildSection(
            context,
            isDark,
            title: 'التحليل والمحتوى',
            items: [
              _MenuItem(
                Icons.assessment_outlined,
                'محلل أداء',
                null,
                () => _showComingSoon(context, 'محلل أداء'),
              ),
              _MenuItem(
                Icons.edit_note_outlined,
                'مدير تسويق ومحتوى',
                'مميز',
                () => _showComingSoon(context, 'مدير تسويق'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTeamSummary(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.surfaceColorDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          _buildTeamStatCard(
            isDark,
            'الموظفين',
            '3',
            Icons.people,
            Colors.blue,
          ),
          const SizedBox(width: 12),
          _buildTeamStatCard(
            isDark,
            'نشط الآن',
            '2',
            Icons.circle,
            Colors.green,
          ),
          const SizedBox(width: 12),
          _buildTeamStatCard(
            isDark,
            'الحد الأقصى',
            '10',
            Icons.group_add,
            Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildTeamStatCard(
    bool isDark,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 24, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
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
                      if (item.badge != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: item.badge == 'مميز'
                                ? Colors.amber.withValues(alpha: 0.1)
                                : AppTheme.primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            item.badge!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: item.badge == 'مميز'
                                  ? Colors.amber
                                  : AppTheme.primaryColor,
                            ),
                          ),
                        ),
                      if (item.badge != null) const SizedBox(width: 8),
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
  final VoidCallback onTap;

  _MenuItem(this.icon, this.title, this.badge, this.onTap);
}
