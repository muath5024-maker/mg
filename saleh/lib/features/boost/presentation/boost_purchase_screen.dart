import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/boost_repository.dart';
import '../domain/models/boost_transaction.dart';

/// Boost Purchase Screen
/// شاشة شراء دعم الظهور
class BoostPurchaseScreen extends ConsumerStatefulWidget {
  final String? productId;
  final String? productName;
  final String targetType; // 'product' or 'store'

  const BoostPurchaseScreen({
    super.key,
    this.productId,
    this.productName,
    required this.targetType,
  });

  @override
  ConsumerState<BoostPurchaseScreen> createState() =>
      _BoostPurchaseScreenState();
}

class _BoostPurchaseScreenState extends ConsumerState<BoostPurchaseScreen> {
  String? _selectedBoostType;
  int _selectedDays = 7;
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final pricingAsync = ref.watch(boostPricingProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B1220),
        title: Text(
          widget.targetType == 'product'
              ? 'دعم ظهور المنتج'
              : 'دعم ظهور المتجر',
          style: const TextStyle(color: Colors.white),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: pricingAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text(
                'خطأ في تحميل الأسعار',
                style: TextStyle(color: Colors.grey[400]),
              ),
              TextButton(
                onPressed: () => ref.invalidate(boostPricingProvider),
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
        data: (pricing) => _buildContent(pricing),
      ),
    );
  }

  Widget _buildContent(BoostPricingOptions pricing) {
    final boostOptions = widget.targetType == 'product'
        ? pricing.product
        : pricing.store;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Target info
          if (widget.productName != null) ...[
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.inventory_2, color: Colors.blue, size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'المنتج',
                          style: TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                        Text(
                          widget.productName!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Boost type selection
          const Text(
            'اختر نوع الدعم',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),

          ...boostOptions.entries.map((entry) {
            final type = entry.key;
            final price = entry.value;
            final isSelected = _selectedBoostType == type;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => setState(() {
                  _selectedBoostType = type;
                  _selectedDays = price.minDays;
                }),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.blue.withValues(alpha: 0.2)
                        : Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? Colors.blue : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _getBoostTypeIcon(type),
                        color: isSelected ? Colors.blue : Colors.grey,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _getBoostTypeName(type),
                              style: TextStyle(
                                color: isSelected
                                    ? Colors.white
                                    : Colors.grey[300],
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              _getBoostTypeDescription(type),
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${price.pointsPerDay}',
                            style: TextStyle(
                              color: isSelected ? Colors.blue : Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'نقطة/يوم',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),

          if (_selectedBoostType != null) ...[
            const SizedBox(height: 24),

            // Duration selection
            const Text(
              'اختر المدة',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            _buildDurationSelector(boostOptions[_selectedBoostType]!),

            const SizedBox(height: 24),

            // Summary
            _buildSummary(boostOptions[_selectedBoostType]!),

            const SizedBox(height: 24),

            // Error message
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Colors.red, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Purchase button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _purchaseBoost,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'شراء الدعم',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDurationSelector(BoostPricing pricing) {
    final durations = [
      1,
      3,
      7,
      14,
      30,
    ].where((d) => d >= pricing.minDays && d <= pricing.maxDays).toList();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: durations.map((days) {
        final isSelected = _selectedDays == days;
        return InkWell(
          onTap: () => setState(() => _selectedDays = days),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected
                  ? Colors.blue.withValues(alpha: 0.2)
                  : Colors.white.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? Colors.blue : Colors.transparent,
                width: 2,
              ),
            ),
            child: Text(
              '$days ${days == 1 ? 'يوم' : 'أيام'}',
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey[400],
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSummary(BoostPricing pricing) {
    final totalPoints = pricing.calculateTotal(_selectedDays);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('نوع الدعم', style: TextStyle(color: Colors.grey)),
              Text(
                _getBoostTypeName(_selectedBoostType!),
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('المدة', style: TextStyle(color: Colors.grey)),
              Text(
                '$_selectedDays يوم',
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
          const Divider(color: Colors.blue, height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'الإجمالي',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Row(
                children: [
                  Text(
                    '$totalPoints',
                    style: const TextStyle(
                      color: Colors.blue,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Text('نقطة', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
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
      case 'media_for_you':
        return Icons.play_circle;
      default:
        return Icons.rocket_launch;
    }
  }

  String _getBoostTypeName(String type) {
    switch (type) {
      case 'featured':
        return 'ظهور مميز';
      case 'category_top':
        return 'أعلى الفئة';
      case 'search_top':
        return 'أعلى البحث';
      case 'home_banner':
        return 'بانر الرئيسية';
      case 'media_for_you':
        return 'لك (ميديا)';
      default:
        return type;
    }
  }

  String _getBoostTypeDescription(String type) {
    switch (type) {
      case 'featured':
        return 'يظهر في قسم المميز في الصفحة الرئيسية';
      case 'category_top':
        return 'يظهر في أعلى نتائج الفئة';
      case 'search_top':
        return 'يظهر في أعلى نتائج البحث';
      case 'home_banner':
        return 'بانر كبير في الصفحة الرئيسية';
      case 'media_for_you':
        return 'يظهر في قسم لك للميديا';
      default:
        return '';
    }
  }

  Future<void> _purchaseBoost() async {
    if (_selectedBoostType == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final repository = ref.read(boostRepositoryProvider);

      BoostTransaction result;
      if (widget.targetType == 'product' && widget.productId != null) {
        result = await repository.purchaseProductBoost(
          productId: widget.productId!,
          boostType: _selectedBoostType!,
          durationDays: _selectedDays,
        );
      } else {
        result = await repository.purchaseStoreBoost(
          boostType: _selectedBoostType!,
          durationDays: _selectedDays,
        );
      }

      // Invalidate providers to refresh data
      ref.invalidate(activeBoostsProvider);
      ref.invalidate(boostHistoryProvider);

      if (mounted) {
        // Show success dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF1A2332),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 28),
                SizedBox(width: 8),
                Text('تم بنجاح', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: Text(
              'تم تفعيل دعم الظهور لمدة $_selectedDays يوم',
              style: TextStyle(color: Colors.grey[300]),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  Navigator.of(context).pop(result);
                },
                child: const Text('حسناً'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
