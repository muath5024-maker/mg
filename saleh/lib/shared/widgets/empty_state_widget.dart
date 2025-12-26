import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/app_dimensions.dart';

/// Empty State Widget - واجهة موحدة لعرض الحالة الفارغة
/// مع رسوم توضيحية وزر إجراء اختياري
class EmptyStateWidget extends StatelessWidget {
  final String? title;
  final String? message;
  final IconData? icon;
  final Widget? illustration;
  final VoidCallback? onAction;
  final String? actionButtonText;
  final IconData? actionIcon;

  const EmptyStateWidget({
    super.key,
    this.title,
    this.message,
    this.icon,
    this.illustration,
    this.onAction,
    this.actionButtonText,
    this.actionIcon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: Padding(
        padding: AppDimensions.paddingXL,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // الرسم التوضيحي أو الأيقونة
            if (illustration != null)
              SizedBox(
                width: 200,
                height: 200,
                child: illustration,
              )
            else
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon ?? Icons.inbox_outlined,
                  size: 64,
                  color: AppTheme.primaryColor.withValues(alpha: 0.5),
                ),
              ),
            const SizedBox(height: 24),

            // العنوان
            Text(
              title ?? 'لا توجد بيانات',
              style: TextStyle(
                fontSize: AppDimensions.fontDisplay3,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary(isDark),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),

            // الرسالة
            Text(
              message ?? 'لم يتم العثور على أي عناصر حتى الآن',
              style: TextStyle(
                fontSize: AppDimensions.fontBody,
                color: AppTheme.textSecondary(isDark),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // زر الإجراء
            if (onAction != null)
              ElevatedButton.icon(
                onPressed: onAction,
                icon: Icon(actionIcon ?? Icons.add),
                label: Text(actionButtonText ?? 'إضافة جديد'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppDimensions.borderRadiusM,
                  ),
                  elevation: 2,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Empty State صغير للاستخدام في القوائم
class CompactEmptyStateWidget extends StatelessWidget {
  final String? message;
  final IconData? icon;

  const CompactEmptyStateWidget({
    super.key,
    this.message,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: AppDimensions.paddingL,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon ?? Icons.inbox_outlined,
            size: 48,
            color: AppTheme.textSecondary(isDark).withValues(alpha: 0.5),
          ),
          const SizedBox(height: 12),
          Text(
            message ?? 'لا توجد عناصر',
            style: TextStyle(
              fontSize: AppDimensions.fontBody2,
              color: AppTheme.textSecondary(isDark),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Empty State مخصصة لأنواع محددة
class EmptyProductsWidget extends StatelessWidget {
  final VoidCallback? onAddProduct;

  const EmptyProductsWidget({super.key, this.onAddProduct});

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.inventory_2_outlined,
      title: 'لا توجد منتجات',
      message: 'ابدأ بإضافة منتجاتك الأولى لعرضها في المتجر',
      actionButtonText: 'إضافة منتج',
      actionIcon: Icons.add_box,
      onAction: onAddProduct,
    );
  }
}

class EmptyOrdersWidget extends StatelessWidget {
  const EmptyOrdersWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const EmptyStateWidget(
      icon: Icons.receipt_long_outlined,
      title: 'لا توجد طلبات',
      message: 'لم تستلم أي طلبات بعد. سيتم عرض طلباتك هنا.',
    );
  }
}

class EmptyNotificationsWidget extends StatelessWidget {
  const EmptyNotificationsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return const EmptyStateWidget(
      icon: Icons.notifications_none,
      title: 'لا توجد إشعارات',
      message: 'لم تتلقَ أي إشعارات بعد. سنبقيك على اطلاع!',
    );
  }
}

class EmptySearchWidget extends StatelessWidget {
  final String? searchQuery;

  const EmptySearchWidget({super.key, this.searchQuery});

  @override
  Widget build(BuildContext context) {
    return EmptyStateWidget(
      icon: Icons.search_off,
      title: 'لا توجد نتائج',
      message: searchQuery != null
          ? 'لم نعثر على نتائج لـ "$searchQuery"'
          : 'جرب البحث بكلمات مختلفة',
    );
  }
}
