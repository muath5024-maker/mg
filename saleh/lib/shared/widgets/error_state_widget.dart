import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/constants/app_dimensions.dart';

/// Error State Widget - واجهة موحدة لعرض الأخطاء
/// مع زر إعادة المحاولة وتصميم احترافي
class ErrorStateWidget extends StatelessWidget {
  final String? title;
  final String? message;
  final IconData? icon;
  final VoidCallback? onRetry;
  final String? retryButtonText;

  const ErrorStateWidget({
    super.key,
    this.title,
    this.message,
    this.icon,
    this.onRetry,
    this.retryButtonText,
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
            // أيقونة الخطأ
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon ?? Icons.error_outline,
                size: 64,
                color: AppTheme.errorColor,
              ),
            ),
            const SizedBox(height: 24),

            // العنوان
            Text(
              title ?? 'حدث خطأ',
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
              message ?? 'عذراً، حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.',
              style: TextStyle(
                fontSize: AppDimensions.fontBody,
                color: AppTheme.textSecondary(isDark),
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),

            // زر إعادة المحاولة
            if (onRetry != null)
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: Text(retryButtonText ?? 'إعادة المحاولة'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.errorColor,
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

/// Error State صغير للاستخدام في القوائم
class CompactErrorStateWidget extends StatelessWidget {
  final String? message;
  final VoidCallback? onRetry;

  const CompactErrorStateWidget({
    super.key,
    this.message,
    this.onRetry,
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
            Icons.error_outline,
            size: 48,
            color: AppTheme.errorColor.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 12),
          Text(
            message ?? 'حدث خطأ أثناء التحميل',
            style: TextStyle(
              fontSize: AppDimensions.fontBody2,
              color: AppTheme.textSecondary(isDark),
            ),
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('إعادة المحاولة'),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.errorColor,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
