import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../features/auth/data/auth_controller.dart';

/// صفحة الإعدادات - تصميم مشابه لـ SHEIN
class CustomerSettingsScreen extends ConsumerWidget {
  const CustomerSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final isGuest = !authState.isAuthenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('إعدادات'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_ios),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          // تسجيل الدخول / تسجيل
          _buildSettingItem(
            context: context,
            title: 'تسجيل الدخول/ تسجيل',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // دفتر العناوين
          _buildSettingItem(
            context: context,
            title: 'دفتر العناوين',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // خيارات الدفع
          _buildSettingItem(
            context: context,
            title: 'خيارات الدفع',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          const Divider(height: 1),
          const SizedBox(height: 8),

          // موقع
          _buildSettingItem(
            context: context,
            title: 'موقع',
            trailing: 'SA',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // عملة
          _buildSettingItem(
            context: context,
            title: 'عملة',
            trailing: 'SAR',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          const Divider(height: 1),
          const SizedBox(height: 8),

          // جهات الاتصال المفضلة
          _buildSettingItem(
            context: context,
            title: 'جهات الاتصال المفضلة',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // قائمة الاتصال المحظورة
          _buildSettingItem(
            context: context,
            title: 'قائمة الاتصال المحظورة',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // مسح ذاكرة التخزين المؤقت
          _buildSettingItem(
            context: context,
            title: 'مسح ذاكرة التخزين المؤقت',
            trailing: '0.0M',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم مسح ذاكرة التخزين المؤقت')),
              );
            },
            showArrow: true,
          ),

          const Divider(height: 1),
          const SizedBox(height: 8),

          // سياسة الخصوصية
          _buildSettingItem(
            context: context,
            title: 'سياسة الخصوصية وملفات تعريف الارتباط',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // الشروط والأحكام
          _buildSettingItem(
            context: context,
            title: 'الشروط والأحكام',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // التقييم والملاحظات
          _buildSettingItem(
            context: context,
            title: 'التقييم والملاحظات',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // التواصل معنا
          _buildSettingItem(
            context: context,
            title: 'التواصل معنا',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // اختيار الإعلان
          _buildSettingItem(
            context: context,
            title: 'اختيار الإعلان',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          // حول التطبيق
          _buildSettingItem(
            context: context,
            title: 'حول MBUY',
            onTap: () => _handleAuthRequired(context, isGuest),
            showArrow: true,
          ),

          const SizedBox(height: 24),

          // الإصدار
          Center(
            child: Text(
              'الإصدار v1.0.0',
              style: TextStyle(color: Colors.grey[500], fontSize: 14),
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSettingItem({
    required BuildContext context,
    required String title,
    String? trailing,
    required VoidCallback onTap,
    bool showArrow = false,
  }) {
    return ListTile(
      title: Text(
        title,
        style: const TextStyle(fontSize: 16),
        textAlign: TextAlign.end,
      ),
      leading: showArrow
          ? Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey[400])
          : null,
      trailing: trailing != null
          ? Text(
              trailing,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            )
          : null,
      onTap: onTap,
    );
  }

  void _handleAuthRequired(BuildContext context, bool isGuest) {
    if (isGuest) {
      context.push('/login');
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('قريبًا')));
    }
  }
}
