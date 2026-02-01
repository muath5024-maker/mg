import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

/// App Header للتاجر - شريط علوي متقدم لإدارة المتجر
class MerchantAppHeader extends ConsumerWidget implements PreferredSizeWidget {
  const MerchantAppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Container(
      color: AppTheme.primaryColor,
      padding: EdgeInsets.only(top: topPadding, left: 12, right: 12, bottom: 8),
      child: Row(
        children: [
          // الجانب الأيمن - متجري
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              // التوجيه لصفحة المتجر (تحتاج توفير ID المتجر لاحقاً)
              context.push('/store/my-store');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.storefront_outlined,
                    size: 16,
                    color: Colors.white,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'متجري',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // مساحة مرنة في المنتصف
          const Spacer(),
          // الجانب الأيسر - الأزرار السريعة
          _buildHeaderButton(
            context,
            Icons.add_circle_outline,
            () => context.push('/merchant/add-product'),
            'إضافة منتج',
          ),
          _buildHeaderButton(
            context,
            Icons.bolt_outlined,
            () => _showComingSoon(context, 'الاختصارات'),
            'الاختصارات',
          ),
          _buildHeaderButton(
            context,
            Icons.notifications_outlined,
            () => _showComingSoon(context, 'الإشعارات'),
            'الإشعارات',
          ),
          _buildHeaderButton(
            context,
            Icons.smart_toy_outlined,
            () => _showComingSoon(context, 'مساعد AI'),
            'مساعد AI',
          ),
          _buildHeaderButton(
            context,
            Icons.search,
            () => context.push('/search'),
            'البحث',
          ),
          const SizedBox(width: 8),
          // اسم التطبيق
          const Text(
            'mbuy',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderButton(
    BuildContext context,
    IconData icon,
    VoidCallback onTap,
    String tooltip,
  ) {
    return Tooltip(
      message: tooltip,
      preferBelow: true,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
      ),
    );
  }

  void _showComingSoon(BuildContext context, String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('ميزة $title ستكون متاحة قريباً'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppTheme.primaryColor,
      ),
    );
  }
}
