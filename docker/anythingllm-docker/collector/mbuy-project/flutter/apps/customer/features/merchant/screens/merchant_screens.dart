import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

/// شاشة قريباً - تُستخدم للشاشات غير المكتملة
class MerchantComingSoonScreen extends ConsumerWidget {
  final String title;
  final IconData icon;

  const MerchantComingSoonScreen({
    super.key,
    required this.title,
    this.icon = Icons.construction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF121212)
          : const Color(0xFFF5F5F5),
      appBar: AppBar(
        title: Text(title),
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 50, color: AppTheme.primaryColor),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'هذه الميزة قيد التطوير',
              style: TextStyle(
                fontSize: 16,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'ستكون متاحة قريباً',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// شاشة المنتجات للتاجر
class MerchantProductsScreen extends MerchantComingSoonScreen {
  const MerchantProductsScreen({super.key})
    : super(title: 'المنتجات', icon: Icons.inventory_2_outlined);
}

/// شاشة الطلبات للتاجر
class MerchantOrdersScreen extends MerchantComingSoonScreen {
  const MerchantOrdersScreen({super.key})
    : super(title: 'الطلبات', icon: Icons.receipt_long_outlined);
}

/// شاشة إضافة منتج
class MerchantAddProductScreen extends MerchantComingSoonScreen {
  const MerchantAddProductScreen({super.key})
    : super(title: 'إضافة منتج', icon: Icons.add_circle_outline);
}

/// شاشة التقارير
class MerchantReportsScreen extends MerchantComingSoonScreen {
  const MerchantReportsScreen({super.key})
    : super(title: 'التقارير', icon: Icons.analytics_outlined);
}

/// شاشة التسويق
class MerchantMarketingScreen extends MerchantComingSoonScreen {
  const MerchantMarketingScreen({super.key})
    : super(title: 'التسويق', icon: Icons.campaign_outlined);
}

/// شاشة إعدادات التاجر
class MerchantSettingsScreen extends MerchantComingSoonScreen {
  const MerchantSettingsScreen({super.key})
    : super(title: 'الإعدادات', icon: Icons.settings_outlined);
}

/// شاشة المبيعات
class MerchantSalesScreen extends MerchantComingSoonScreen {
  const MerchantSalesScreen({super.key})
    : super(title: 'المبيعات', icon: Icons.shopping_bag_outlined);
}
