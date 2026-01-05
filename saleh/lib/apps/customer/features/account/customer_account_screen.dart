import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/controllers/root_controller.dart';
import '../../../../features/auth/data/auth_controller.dart';

/// صفحة حسابي للعميل - تصميم MBUY
class CustomerAccountScreen extends ConsumerWidget {
  const CustomerAccountScreen({super.key});

  static const Color _primaryColor = Color(0xFF00BFA5);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final isGuest = !authState.isAuthenticated;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF1A1A1A)
          : const Color(0xFFF9FAFB),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Profile Section
            SliverToBoxAdapter(
              child: _buildProfileSection(
                context,
                ref,
                isDark,
                isGuest,
                authState,
              ),
            ),

            // Stats Section (Coupons, Points, Wallet, Cards)
            SliverToBoxAdapter(
              child: _buildStatsSection(context, isDark, isGuest),
            ),

            // Orders Section
            SliverToBoxAdapter(
              child: _buildOrdersSection(context, isDark, isGuest),
            ),

            // Promo Banner
            SliverToBoxAdapter(child: _buildPromoBanner(context)),

            // Additional Services
            SliverToBoxAdapter(
              child: _buildServicesSection(context, isDark, isGuest),
            ),

            // Recommended Products Title
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Text(
                  'موصى به لك',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF1F2937),
                  ),
                ),
              ),
            ),

            // Recommended Products Grid
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.58,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) => _buildProductCard(context, isDark, index),
                  childCount: 4,
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileSection(
    BuildContext context,
    WidgetRef ref,
    bool isDark,
    bool isGuest,
    AuthState authState,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: isDark ? const Color(0xFF242424) : Colors.white,
      child: Row(
        children: [
          // زر تبديل الحساب
          GestureDetector(
            onTap: () =>
                _showAccountSwitcher(context, ref, isDark, isGuest, authState),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark ? Colors.grey[800] : Colors.grey[200],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.keyboard_arrow_down,
                color: isDark ? Colors.white : Colors.black87,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 12),
          // User Info
          Expanded(
            child: GestureDetector(
              onTap: () {
                if (isGuest) {
                  context.push('/login');
                }
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isGuest
                        ? 'تسجيل الدخول / التسجيل'
                        : (authState.displayName ?? 'مستخدم MBUY'),
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isGuest
                        ? 'سجل دخولك للاستفادة من المزايا'
                        : 'عضو MBUY VIP • منذ 2023',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark
                          ? Colors.grey[400]
                          : const Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Avatar with VIP badge
          GestureDetector(
            onTap: () {
              if (isGuest) {
                context.push('/login');
              }
            },
            child: Stack(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: _primaryColor, width: 2),
                  ),
                  child: CircleAvatar(
                    radius: 38,
                    backgroundColor: Colors.grey[300],
                    backgroundImage: isGuest
                        ? null
                        : const NetworkImage(
                            'https://picsum.photos/100?random=user',
                          ),
                    child: isGuest
                        ? Icon(Icons.person, size: 40, color: Colors.grey[600])
                        : null,
                  ),
                ),
                if (!isGuest)
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: _primaryColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF242424)
                              : Colors.white,
                          width: 2,
                        ),
                      ),
                      child: const Text(
                        'VIP',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showAccountSwitcher(
    BuildContext context,
    WidgetRef ref,
    bool isDark,
    bool isGuest,
    AuthState authState,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12),
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // الحساب الحالي (العميل)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  // علامة التحديد
                  Container(
                    width: 24,
                    height: 24,
                    decoration: const BoxDecoration(
                      color: _primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        isGuest
                            ? 'ضيف'
                            : (authState.displayName ?? 'مستخدم MBUY'),
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                      Text(
                        'حساب العميل',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: _primaryColor, width: 2),
                    ),
                    child: ClipOval(
                      child: isGuest
                          ? Container(
                              color: Colors.grey[300],
                              child: Icon(
                                Icons.person,
                                size: 30,
                                color: Colors.grey[600],
                              ),
                            )
                          : Image.network(
                              'https://picsum.photos/100?random=user',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  Container(
                                    color: Colors.grey[300],
                                    child: Icon(
                                      Icons.person,
                                      size: 30,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                            ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            Divider(color: isDark ? Colors.grey[800] : Colors.grey[200]),

            // التبديل لحساب التاجر
            ListTile(
              leading: const Icon(Icons.more_horiz),
              title: const Text(
                'التبديل لحساب التاجر',
                textAlign: TextAlign.right,
              ),
              trailing: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[800] : Colors.grey[200],
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.store, size: 20),
              ),
              onTap: () {
                Navigator.pop(context);
                ref.read(rootControllerProvider.notifier).switchToMerchantApp();
              },
            ),

            // تسجيل الدخول أو الخروج
            if (isGuest)
              ListTile(
                leading: const Icon(Icons.more_horiz),
                title: const Text('تسجيل الدخول', textAlign: TextAlign.right),
                trailing: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.grey[800] : Colors.grey[200],
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.login, size: 20),
                ),
                onTap: () {
                  Navigator.pop(context);
                  context.push('/login');
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.more_horiz),
                title: const Text('تسجيل الخروج', textAlign: TextAlign.right),
                trailing: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.red.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.logout, size: 20, color: Colors.red),
                ),
                onTap: () {
                  Navigator.pop(context);
                  ref.read(rootControllerProvider.notifier).reset();
                },
              ),

            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSection(BuildContext context, bool isDark, bool isGuest) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF242424) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildStatItem(context, '12', 'قسائم', isDark, isGuest),
          _buildDivider(isDark),
          _buildStatItem(context, '350', 'نقاط', isDark, isGuest),
          _buildDivider(isDark),
          _buildStatItem(
            context,
            '\$0.00',
            'المحفظة',
            isDark,
            isGuest,
            isLtr: true,
          ),
          _buildDivider(isDark),
          _buildStatItem(context, '0', 'بطاقات', isDark, isGuest),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String value,
    String label,
    bool isDark,
    bool isGuest, {
    bool isLtr = false,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: () => _handleAuthRequired(context, isGuest, null),
        child: Column(
          children: [
            Text(
              isGuest ? '-' : value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF1F2937),
              ),
              textDirection: isLtr ? TextDirection.ltr : null,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.grey[400] : const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Container(
      width: 1,
      height: 32,
      color: isDark ? Colors.grey[700] : Colors.grey[200],
    );
  }

  Widget _buildOrdersSection(BuildContext context, bool isDark, bool isGuest) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF242424) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => _handleAuthRequired(context, isGuest, '/orders'),
                child: Row(
                  children: [
                    Text(
                      'عرض الكل',
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark
                            ? Colors.grey[400]
                            : const Color(0xFF6B7280),
                      ),
                    ),
                    Icon(
                      Icons.chevron_left,
                      size: 18,
                      color: isDark
                          ? Colors.grey[400]
                          : const Color(0xFF6B7280),
                    ),
                  ],
                ),
              ),
              Text(
                'طلباتي',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildOrderItem(
                context,
                Icons.account_balance_wallet_outlined,
                'غير مدفوع',
                isDark,
                isGuest,
              ),
              _buildOrderItem(
                context,
                Icons.inventory_2_outlined,
                'قيد التجهيز',
                isDark,
                isGuest,
                badge: '1',
              ),
              _buildOrderItem(
                context,
                Icons.local_shipping_outlined,
                'مشحون',
                isDark,
                isGuest,
              ),
              _buildOrderItem(
                context,
                Icons.rate_review_outlined,
                'مراجعة',
                isDark,
                isGuest,
                badge: '3',
              ),
              _buildOrderItem(
                context,
                Icons.assignment_return_outlined,
                'المرتجعات',
                isDark,
                isGuest,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOrderItem(
    BuildContext context,
    IconData icon,
    String label,
    bool isDark,
    bool isGuest, {
    String? badge,
  }) {
    return GestureDetector(
      onTap: () => _handleAuthRequired(context, isGuest, '/orders'),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  icon,
                  size: 30,
                  color: isDark ? Colors.white : const Color(0xFF1F2937),
                ),
              ),
              if (badge != null && !isGuest)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: _primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? const Color(0xFF242424) : Colors.white,
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white : const Color(0xFF1F2937),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoBanner(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 96,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: const LinearGradient(
          colors: [Color(0xFF0D9488), _primaryColor],
          begin: Alignment.centerRight,
          end: Alignment.centerLeft,
        ),
      ),
      child: Stack(
        children: [
          // Decorative circle
          Positioned(
            left: -16,
            top: -16,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                // Shop Now Button
                ElevatedButton(
                  onPressed: () => context.go('/'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: _primaryColor,
                    elevation: 2,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  child: const Text(
                    'تسوق الآن',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
                const Spacer(),
                // Text
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'موسم جديد',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'تخفيضات الصيف',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      'خصم يصل إلى 50%',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesSection(
    BuildContext context,
    bool isDark,
    bool isGuest,
  ) {
    final services = [
      {'icon': Icons.support_agent, 'label': 'الدعم'},
      {'icon': Icons.location_on_outlined, 'label': 'العناوين'},
      {'icon': Icons.lightbulb_outline, 'label': 'اقتراحات'},
      {'icon': Icons.card_giftcard, 'label': 'بطاقات الهدايا'},
      {'icon': Icons.history, 'label': 'شوهد مؤخراً'},
      {'icon': Icons.mail_outline, 'label': 'الاستبيان'},
      {'icon': Icons.translate, 'label': 'اللغة'},
      {
        'icon': Icons.settings_outlined,
        'label': 'الإعدادات',
        'route': '/settings',
      },
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF242424) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            'خدمات إضافية',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF1F2937),
            ),
          ),
          const SizedBox(height: 20),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              childAspectRatio: 1,
              crossAxisSpacing: 8,
              mainAxisSpacing: 16,
            ),
            itemCount: services.length,
            itemBuilder: (context, index) {
              final service = services[index];
              return _buildServiceItem(
                context,
                service['icon'] as IconData,
                service['label'] as String,
                isDark,
                isGuest,
                route: service['route'] as String?,
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildServiceItem(
    BuildContext context,
    IconData icon,
    String label,
    bool isDark,
    bool isGuest, {
    String? route,
  }) {
    return GestureDetector(
      onTap: () {
        if (route != null) {
          context.push(route);
        } else {
          _handleAuthRequired(context, isGuest, null);
        }
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 28,
            color: isDark ? Colors.grey[400] : const Color(0xFF6B7280),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? Colors.white : const Color(0xFF1F2937),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, bool isDark, int index) {
    final products = [
      {
        'image': 'https://picsum.photos/200/300?random=1',
        'title': 'فستان صيفي مزهر بياقة V وكشكش',
        'price': '\$19.99',
        'oldPrice': '\$24.99',
        'badge': '-20%',
        'badgeColor': Colors.black.withValues(alpha: 0.6),
      },
      {
        'image': 'https://picsum.photos/200/300?random=2',
        'title': 'سترة بليزر بيج كاجوال واسعة',
        'price': '\$35.00',
        'oldPrice': null,
        'badge': null,
        'badgeColor': null,
      },
      {
        'image': 'https://picsum.photos/200/300?random=3',
        'title': 'شورت جينز أزرق بخصر عالي وحزام',
        'price': '\$12.50',
        'oldPrice': null,
        'badge': 'رائج',
        'badgeColor': _primaryColor,
      },
      {
        'image': 'https://picsum.photos/200/300?random=4',
        'title': 'حذاء رياضي كلاسيكي أبيض',
        'price': '\$42.00',
        'oldPrice': '\$55.00',
        'badge': null,
        'badgeColor': null,
      },
    ];

    final product = products[index];

    return GestureDetector(
      onTap: () => context.push('/product/sample-$index'),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 4,
              child: Stack(
                children: [
                  Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.grey[800] : Colors.grey[100],
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8),
                      ),
                      image: DecorationImage(
                        image: NetworkImage(product['image'] as String),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  // Badge
                  if (product['badge'] != null)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: product['badgeColor'] as Color,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          product['badge'] as String,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  // Add to Cart Button
                  Positioned(
                    bottom: 8,
                    left: 8,
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: (isDark ? const Color(0xFF242424) : Colors.white)
                            .withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.add_shopping_cart,
                        size: 18,
                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product['title'] as String,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white : const Color(0xFF1F2937),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Text(
                          product['price'] as String,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: _primaryColor,
                          ),
                          textDirection: TextDirection.ltr,
                        ),
                        if (product['oldPrice'] != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            product['oldPrice'] as String,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? Colors.grey[400]
                                  : const Color(0xFF6B7280),
                              decoration: TextDecoration.lineThrough,
                            ),
                            textDirection: TextDirection.ltr,
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleAuthRequired(BuildContext context, bool isGuest, String? route) {
    if (isGuest) {
      context.push('/login');
    } else if (route != null) {
      context.push(route);
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('قريبًا')));
    }
  }
}
