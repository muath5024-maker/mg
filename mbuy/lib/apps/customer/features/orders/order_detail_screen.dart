import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../data/data.dart';
import '../../models/models.dart';
import '../../core/theme/app_theme.dart';

/// شاشة تفاصيل الطلب
class OrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    // تحميل الطلبات إذا لم تكن محملة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final state = ref.read(ordersProvider);
      if (state.orders.isEmpty && !state.isLoading) {
        ref.read(ordersProvider.notifier).loadOrders();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final ordersState = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل الطلب'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios),
          onPressed: () => context.pop(),
        ),
      ),
      body: _buildBody(ordersState),
    );
  }

  Widget _buildBody(OrdersState ordersState) {
    if (ordersState.isLoading && ordersState.orders.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (ordersState.error != null && ordersState.orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('حدث خطأ: ${ordersState.error}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => ref.read(ordersProvider.notifier).loadOrders(),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    // البحث عن الطلب
    final order = ordersState.orders.firstWhere(
      (o) => o.id == widget.orderId,
      orElse: () => ordersState.orders.isNotEmpty
          ? ordersState.orders.first
          : _createEmptyOrder(),
    );

    if (order.id.isEmpty) {
      return const Center(child: Text('الطلب غير موجود'));
    }

    return _buildOrderDetails(order);
  }

  Order _createEmptyOrder() {
    return Order(
      id: '',
      orderNumber: '',
      customerId: '',
      storeId: '',
      totalAmount: 0,
    );
  }

  Widget _buildOrderDetails(Order order) {
    return SingleChildScrollView(
      child: Column(
        children: [
          // حالة الطلب
          _buildStatusCard(order),

          // تتبع الطلب
          _buildTrackingTimeline(order),

          // تفاصيل المنتجات
          _buildProductsList(order),

          // ملخص الطلب
          _buildOrderSummary(order),

          // معلومات التوصيل
          _buildDeliveryInfo(order),

          // أزرار الإجراءات
          _buildActionButtons(order),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStatusCard(Order order) {
    final statusInfo = _getStatusInfo(order.status);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [statusInfo.color, statusInfo.color.withValues(alpha: 0.7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(statusInfo.icon, size: 48, color: Colors.white),
          const SizedBox(height: 12),
          Text(
            statusInfo.text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'طلب رقم #${order.orderNumber}',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackingTimeline(Order order) {
    final steps = [
      _TimelineStep(
        title: 'تم استلام الطلب',
        subtitle: 'تم تأكيد طلبك بنجاح',
        isCompleted: true,
        isActive: order.status == OrderStatus.pending,
      ),
      _TimelineStep(
        title: 'جاري التجهيز',
        subtitle: 'يتم تحضير طلبك',
        isCompleted: order.status.index >= OrderStatus.processing.index,
        isActive: order.status == OrderStatus.processing,
      ),
      _TimelineStep(
        title: 'في الطريق',
        subtitle: 'طلبك في الطريق إليك',
        isCompleted: order.status.index >= OrderStatus.shipped.index,
        isActive: order.status == OrderStatus.shipped,
      ),
      _TimelineStep(
        title: 'تم التوصيل',
        subtitle: 'تم توصيل طلبك بنجاح',
        isCompleted: order.status == OrderStatus.delivered,
        isActive: order.status == OrderStatus.delivered,
      ),
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'تتبع الطلب',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ...steps.asMap().entries.map((entry) {
            final index = entry.key;
            final step = entry.value;
            final isLast = index == steps.length - 1;
            return _buildTimelineItem(step, isLast);
          }),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(_TimelineStep step, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: step.isCompleted
                    ? AppTheme.primaryColor
                    : Colors.grey[300],
                border: step.isActive
                    ? Border.all(color: AppTheme.primaryColor, width: 3)
                    : null,
              ),
              child: step.isCompleted
                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                  : null,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 40,
                color: step.isCompleted
                    ? AppTheme.primaryColor
                    : Colors.grey[300],
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  step.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: step.isCompleted || step.isActive
                        ? Colors.black
                        : Colors.grey,
                  ),
                ),
                Text(
                  step.subtitle,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductsList(Order order) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'المنتجات',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              Text(
                '${order.items.length} منتج',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          const Divider(height: 24),
          ...order.items.map((item) => _buildProductItem(item)),
        ],
      ),
    );
  }

  Widget _buildProductItem(OrderItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              item.imageUrl ?? 'https://via.placeholder.com/60',
              width: 60,
              height: 60,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 60,
                height: 60,
                color: Colors.grey[200],
                child: const Icon(Icons.image, color: Colors.grey),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'الكمية: ${item.quantity}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ],
            ),
          ),
          Text(
            '${item.price.toStringAsFixed(0)} ر.س',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderSummary(Order order) {
    final subtotal = order.items.fold<double>(
      0,
      (sum, item) => sum + (item.price * item.quantity),
    );
    final shipping = 25.0;
    final discount = order.totalAmount < subtotal + shipping
        ? (subtotal + shipping) - order.totalAmount
        : 0.0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ملخص الطلب',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const Divider(height: 24),
          _buildSummaryRow(
            'المجموع الفرعي',
            '${subtotal.toStringAsFixed(0)} ر.س',
          ),
          _buildSummaryRow('الشحن', '${shipping.toStringAsFixed(0)} ر.س'),
          if (discount > 0)
            _buildSummaryRow(
              'الخصم',
              '-${discount.toStringAsFixed(0)} ر.س',
              isDiscount: true,
            ),
          const Divider(height: 16),
          _buildSummaryRow(
            'الإجمالي',
            '${order.totalAmount.toStringAsFixed(0)} ر.س',
            isBold: true,
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(
    String label,
    String value, {
    bool isBold = false,
    bool isDiscount = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isBold ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              fontSize: isBold ? 16 : 14,
              color: isDiscount ? Colors.green : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryInfo(Order order) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'معلومات التوصيل',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const Divider(height: 24),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.location_on, color: AppTheme.primaryColor),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'عنوان التوصيل',
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'الرياض، حي النخيل، شارع الملك فهد',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(Order order) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          if (order.status == OrderStatus.delivered) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _reorder(order),
                icon: const Icon(Icons.replay),
                label: const Text('إعادة الطلب'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  // Rate order
                  _showRatingDialog(order);
                },
                icon: const Icon(Icons.star_outline),
                label: const Text('تقييم الطلب'),
              ),
            ),
          ] else if (order.status == OrderStatus.pending ||
              order.status == OrderStatus.processing) ...[
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showCancelDialog(order),
                icon: const Icon(Icons.cancel_outlined),
                label: const Text('إلغاء الطلب'),
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
              ),
            ),
          ],
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                // Contact support
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('جاري فتح الدعم الفني...')),
                );
              },
              icon: const Icon(Icons.support_agent),
              label: const Text('تواصل مع الدعم'),
            ),
          ),
        ],
      ),
    );
  }

  void _reorder(Order order) async {
    final cartNotifier = ref.read(cartProvider.notifier);

    // إضافة جميع منتجات الطلب للسلة
    for (final item in order.items) {
      await cartNotifier.addToCart(item.productId, quantity: item.quantity);
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('تمت إضافة المنتجات للسلة ✅'),
          action: SnackBarAction(
            label: 'الذهاب للسلة',
            onPressed: () => context.push('/cart'),
          ),
        ),
      );
    }
  }

  void _showCancelDialog(Order order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إلغاء الطلب'),
        content: Text('هل أنت متأكد من إلغاء الطلب #${order.orderNumber}؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('تراجع'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(ordersProvider.notifier).cancelOrder(order.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم إلغاء الطلب بنجاح')),
                );
                context.pop();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('إلغاء الطلب'),
          ),
        ],
      ),
    );
  }

  void _showRatingDialog(Order order) {
    int rating = 0;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('تقييم الطلب'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('كيف كانت تجربتك مع هذا الطلب؟'),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 36,
                    ),
                    onPressed: () {
                      setDialogState(() => rating = index + 1);
                    },
                  );
                }),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: rating > 0
                  ? () {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('شكراً لتقييمك! ⭐')),
                      );
                    }
                  : null,
              child: const Text('إرسال'),
            ),
          ],
        ),
      ),
    );
  }

  _StatusInfo _getStatusInfo(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return _StatusInfo(
          text: 'قيد الانتظار',
          icon: Icons.hourglass_empty,
          color: Colors.orange,
        );
      case OrderStatus.confirmed:
        return _StatusInfo(
          text: 'تم التأكيد',
          icon: Icons.check,
          color: Colors.blue,
        );
      case OrderStatus.processing:
        return _StatusInfo(
          text: 'جاري التجهيز',
          icon: Icons.inventory_2,
          color: Colors.blue,
        );
      case OrderStatus.shipped:
      case OrderStatus.shipping:
        return _StatusInfo(
          text: 'تم الشحن',
          icon: Icons.local_shipping,
          color: AppTheme.primaryColor,
        );
      case OrderStatus.outForDelivery:
        return _StatusInfo(
          text: 'في الطريق',
          icon: Icons.delivery_dining,
          color: AppTheme.primaryColor,
        );
      case OrderStatus.delivered:
        return _StatusInfo(
          text: 'تم التوصيل',
          icon: Icons.check_circle,
          color: Colors.green,
        );
      case OrderStatus.cancelled:
        return _StatusInfo(text: 'ملغي', icon: Icons.cancel, color: Colors.red);
      case OrderStatus.refunded:
        return _StatusInfo(
          text: 'مسترد',
          icon: Icons.replay,
          color: Colors.purple,
        );
      case OrderStatus.failed:
        return _StatusInfo(
          text: 'فشل',
          icon: Icons.error,
          color: Colors.red[900]!,
        );
    }
  }
}

class _StatusInfo {
  final String text;
  final IconData icon;
  final Color color;

  _StatusInfo({required this.text, required this.icon, required this.color});
}

class _TimelineStep {
  final String title;
  final String subtitle;
  final bool isCompleted;
  final bool isActive;

  _TimelineStep({
    required this.title,
    required this.subtitle,
    required this.isCompleted,
    required this.isActive,
  });
}
