import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../data/boost_service.dart';

/// Provider للـ BoostService
final boostServiceProvider = Provider<BoostService>((ref) {
  final apiService = ref.read(apiServiceProvider);
  return BoostService(apiService);
});

/// حالة الـ Boosts النشطة
final activeBoostsProvider = FutureProvider<List<BoostTransaction>>((
  ref,
) async {
  final boostService = ref.read(boostServiceProvider);
  return boostService.getActiveBoosts();
});

/// حالة سجل الـ Boosts
final boostHistoryProvider = FutureProvider<List<BoostTransaction>>((
  ref,
) async {
  final boostService = ref.read(boostServiceProvider);
  return boostService.getBoostHistory();
});

/// حالة أسعار الـ Boost
final boostPricingProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final boostService = ref.read(boostServiceProvider);
  return boostService.getPricing();
});

/// حالة الـ Boost Controller
class BoostState {
  final bool isLoading;
  final String? error;

  BoostState({this.isLoading = false, this.error});

  BoostState copyWith({bool? isLoading, String? error}) {
    return BoostState(isLoading: isLoading ?? this.isLoading, error: error);
  }
}

/// Controller لإدارة عمليات الـ Boost
class BoostController extends Notifier<BoostState> {
  @override
  BoostState build() => BoostState();

  /// شراء boost للمنتج
  Future<BoostResult> purchaseProductBoost({
    required String productId,
    required String boostType,
    required int durationDays,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final boostService = ref.read(boostServiceProvider);
    final result = await boostService.purchaseProductBoost(
      productId: productId,
      boostType: boostType,
      durationDays: durationDays,
    );

    if (result.success) {
      ref.invalidate(activeBoostsProvider);
      state = state.copyWith(isLoading: false);
    } else {
      state = state.copyWith(isLoading: false, error: result.message);
    }

    return result;
  }

  /// شراء boost للمتجر
  Future<BoostResult> purchaseStoreBoost({
    required String boostType,
    required int durationDays,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    final boostService = ref.read(boostServiceProvider);
    final result = await boostService.purchaseStoreBoost(
      boostType: boostType,
      durationDays: durationDays,
    );

    if (result.success) {
      ref.invalidate(activeBoostsProvider);
      state = state.copyWith(isLoading: false);
    } else {
      state = state.copyWith(isLoading: false, error: result.message);
    }

    return result;
  }

  /// إلغاء boost
  Future<BoostResult> cancelBoost(String transactionId) async {
    state = state.copyWith(isLoading: true, error: null);

    final boostService = ref.read(boostServiceProvider);
    final result = await boostService.cancelBoost(transactionId);

    if (result.success) {
      ref.invalidate(activeBoostsProvider);
      state = state.copyWith(isLoading: false);
    } else {
      state = state.copyWith(isLoading: false, error: result.message);
    }

    return result;
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

/// Provider للـ BoostController
final boostControllerProvider = NotifierProvider<BoostController, BoostState>(
  () {
    return BoostController();
  },
);

/// تسعير المنتجات
const productBoostPricing = {
  'featured': {
    'points_per_day': 50,
    'min_days': 1,
    'max_days': 30,
    'name': 'منتج مميز',
    'description': 'يظهر منتجك في قسم المنتجات المميزة',
  },
  'category_top': {
    'points_per_day': 30,
    'min_days': 1,
    'max_days': 30,
    'name': 'أعلى الفئة',
    'description': 'يظهر منتجك في أعلى فئته',
  },
  'search_top': {
    'points_per_day': 40,
    'min_days': 1,
    'max_days': 30,
    'name': 'أعلى البحث',
    'description': 'يظهر منتجك في أعلى نتائج البحث',
  },
};

/// تسعير المتاجر
const storeBoostPricing = {
  'featured': {
    'points_per_day': 100,
    'min_days': 7,
    'max_days': 30,
    'name': 'متجر مميز',
    'description': 'يظهر متجرك في قسم المتاجر المميزة',
  },
  'home_banner': {
    'points_per_day': 200,
    'min_days': 7,
    'max_days': 30,
    'name': 'بانر الرئيسية',
    'description': 'بانر لمتجرك في الصفحة الرئيسية',
  },
};
