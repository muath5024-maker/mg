import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../features/auth/data/auth_controller.dart';

/// الشاشة الرئيسية للعميل
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final userEmail = authState.userEmail ?? 'عميل';
    final displayName = authState.displayName ?? 'زائر';

    return Scaffold(
      appBar: AppBar(
        title: const Text('MBUY'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // بطاقة الترحيب
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.shopping_bag,
                        size: 48,
                        color: Colors.blue,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'مرحباً بك $displayName',
                        style: Theme.of(context).textTheme.headlineSmall,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        userEmail,
                        style: Theme.of(context).textTheme.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // المميزات الرئيسية
              Text(
                'المتاجر المميزة',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              _buildFeatureCard(context, Icons.store, 'تصفح المتاجر'),
              const SizedBox(height: 12),
              _buildFeatureCard(context, Icons.shopping_cart, 'سلة التسوق'),
              const SizedBox(height: 12),
              _buildFeatureCard(context, Icons.favorite, 'المفضلة'),
              const SizedBox(height: 12),
              _buildFeatureCard(context, Icons.receipt, 'طلباتي'),
              const SizedBox(height: 24),
              // زر تسجيل الخروج
              ElevatedButton.icon(
                onPressed: () {
                  ref.read(authControllerProvider.notifier).logout();
                },
                icon: const Icon(Icons.logout),
                label: const Text('تسجيل الخروج'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureCard(BuildContext context, IconData icon, String title) {
    return Card(
      child: ListTile(
        leading: Icon(icon, color: Colors.blue),
        title: Text(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          // TODO: إضافة التنقل إلى الشاشات المختلفة
        },
      ),
    );
  }
}
