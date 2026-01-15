import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/boost_repository.dart';
import '../domain/models/boost_transaction.dart';

/// My Boosts Screen
/// شاشة عرض الدعم النشط والسجل
class MyBoostsScreen extends ConsumerWidget {
  const MyBoostsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFF0B1220),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0B1220),
          title: const Text(
            'دعم الظهور',
            style: TextStyle(color: Colors.white),
          ),
          iconTheme: const IconThemeData(color: Colors.white),
          bottom: const TabBar(
            indicatorColor: Colors.blue,
            labelColor: Colors.blue,
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'النشط'),
              Tab(text: 'السجل'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [_ActiveBoostsTab(), _BoostHistoryTab()],
        ),
      ),
    );
  }
}

/// Active Boosts Tab
class _ActiveBoostsTab extends ConsumerWidget {
  const _ActiveBoostsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final boostsAsync = ref.watch(activeBoostsProvider);

    return boostsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text(
              'خطأ في تحميل البيانات',
              style: TextStyle(color: Colors.grey[400]),
            ),
            TextButton(
              onPressed: () => ref.invalidate(activeBoostsProvider),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
      data: (boosts) {
        if (boosts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.rocket_launch_outlined,
                  color: Colors.grey[600],
                  size: 64,
                ),
                const SizedBox(height: 16),
                Text(
                  'لا يوجد دعم نشط',
                  style: TextStyle(color: Colors.grey[400], fontSize: 18),
                ),
                const SizedBox(height: 8),
                Text(
                  'قم بتفعيل دعم الظهور لزيادة مبيعاتك',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(activeBoostsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: boosts.length,
            itemBuilder: (context, index) {
              return _BoostCard(boost: boosts[index], showCancelButton: true);
            },
          ),
        );
      },
    );
  }
}

/// Boost History Tab
class _BoostHistoryTab extends ConsumerWidget {
  const _BoostHistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(boostHistoryProvider(1));

    return historyAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text(
              'خطأ في تحميل السجل',
              style: TextStyle(color: Colors.grey[400]),
            ),
            TextButton(
              onPressed: () => ref.invalidate(boostHistoryProvider(1)),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
      data: (boosts) {
        if (boosts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.history, color: Colors.grey[600], size: 64),
                const SizedBox(height: 16),
                Text(
                  'لا يوجد سجل',
                  style: TextStyle(color: Colors.grey[400], fontSize: 18),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(boostHistoryProvider(1)),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: boosts.length,
            itemBuilder: (context, index) {
              return _BoostCard(boost: boosts[index], showCancelButton: false);
            },
          ),
        );
      },
    );
  }
}

/// Boost Card Widget
class _BoostCard extends ConsumerWidget {
  final BoostTransaction boost;
  final bool showCancelButton;

  const _BoostCard({required this.boost, required this.showCancelButton});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: boost.isActive
              ? Colors.green.withValues(alpha: 0.3)
              : Colors.grey.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: _getBoostTypeColor(
                    boost.boostType,
                  ).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getBoostTypeIcon(boost.boostType),
                  color: _getBoostTypeColor(boost.boostType),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      boost.boostTypeDisplayAr,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      boost.targetTypeDisplayAr,
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ),
              _StatusBadge(status: boost.status, isActive: boost.isActive),
            ],
          ),

          const SizedBox(height: 16),

          // Details
          Row(
            children: [
              _DetailItem(
                icon: Icons.monetization_on,
                label: 'النقاط',
                value: '${boost.pointsSpent}',
              ),
              _DetailItem(
                icon: Icons.calendar_today,
                label: 'المدة',
                value: '${boost.durationDays} يوم',
              ),
              if (boost.isActive)
                _DetailItem(
                  icon: Icons.timer,
                  label: 'المتبقي',
                  value: '${boost.remainingDays} يوم',
                  valueColor: boost.remainingDays <= 3 ? Colors.orange : null,
                ),
            ],
          ),

          // Cancel button
          if (showCancelButton && boost.isActive) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showCancelDialog(context, ref),
                icon: const Icon(Icons.cancel_outlined, size: 18),
                label: const Text('إلغاء الدعم'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showCancelDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A2332),
        title: const Text('إلغاء الدعم', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'هل أنت متأكد من إلغاء دعم الظهور؟',
              style: TextStyle(color: Colors.grey[300]),
            ),
            const SizedBox(height: 12),
            Text(
              'سيتم استرداد 50% من النقاط المتبقية.',
              style: TextStyle(color: Colors.orange[300], fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _cancelBoost(context, ref);
            },
            child: const Text(
              'تأكيد الإلغاء',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelBoost(BuildContext context, WidgetRef ref) async {
    try {
      final repository = ref.read(boostRepositoryProvider);
      final result = await repository.cancelBoost(boost.id);

      ref.invalidate(activeBoostsProvider);
      ref.invalidate(boostHistoryProvider);

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result.refundPoints > 0
                  ? 'تم إلغاء الدعم واسترداد ${result.refundPoints} نقطة'
                  : 'تم إلغاء الدعم',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  IconData _getBoostTypeIcon(String type) {
    switch (type) {
      case 'featured':
        return Icons.star;
      case 'category_top':
        return Icons.category;
      case 'search_top':
        return Icons.search;
      case 'home_banner':
        return Icons.home;
      default:
        return Icons.rocket_launch;
    }
  }

  Color _getBoostTypeColor(String type) {
    switch (type) {
      case 'featured':
        return Colors.amber;
      case 'category_top':
        return Colors.blue;
      case 'search_top':
        return Colors.purple;
      case 'home_banner':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}

/// Status Badge
class _StatusBadge extends StatelessWidget {
  final String status;
  final bool isActive;

  const _StatusBadge({required this.status, required this.isActive});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    String text;

    if (isActive) {
      bgColor = Colors.green.withValues(alpha: 0.2);
      textColor = Colors.green;
      text = 'نشط';
    } else if (status == 'expired') {
      bgColor = Colors.grey.withValues(alpha: 0.2);
      textColor = Colors.grey;
      text = 'منتهي';
    } else {
      bgColor = Colors.red.withValues(alpha: 0.2);
      textColor = Colors.red;
      text = 'ملغي';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// Detail Item
class _DetailItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailItem({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[600], size: 16),
          const SizedBox(width: 4),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(color: Colors.grey[600], fontSize: 10),
              ),
              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
