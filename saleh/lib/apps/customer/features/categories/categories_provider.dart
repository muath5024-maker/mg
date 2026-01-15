import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../features/products/data/platform_categories_repository.dart';
import '../../../../features/products/domain/models/platform_category.dart';

/// Categories Screen State
class CategoriesState {
  final List<PlatformCategory> categories;
  final int selectedIndex;
  final bool isLoading;
  final String? error;

  const CategoriesState({
    this.categories = const [],
    this.selectedIndex = 0,
    this.isLoading = true,
    this.error,
  });

  CategoriesState copyWith({
    List<PlatformCategory>? categories,
    int? selectedIndex,
    bool? isLoading,
    String? error,
  }) {
    return CategoriesState(
      categories: categories ?? this.categories,
      selectedIndex: selectedIndex ?? this.selectedIndex,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Get currently selected category
  PlatformCategory? get selectedCategory {
    if (categories.isEmpty || selectedIndex >= categories.length) return null;
    return categories[selectedIndex];
  }

  /// Get subcategories of selected category
  List<PlatformCategory> get selectedSubcategories {
    return selectedCategory?.children ?? [];
  }
}

/// Categories Screen Notifier (Riverpod 3.x compatible)
class CategoriesNotifier extends Notifier<CategoriesState> {
  @override
  CategoriesState build() {
    // Load categories on init
    Future.microtask(() => loadCategories());
    return const CategoriesState();
  }

  PlatformCategoriesRepository get _repository =>
      ref.read(platformCategoriesRepositoryProvider);

  /// Load categories from API
  Future<void> loadCategories() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final categories = await _repository.getCategories();
      state = state.copyWith(
        categories: categories,
        isLoading: false,
        selectedIndex: 0,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Select category by index
  void selectCategory(int index) {
    if (index >= 0 && index < state.categories.length) {
      state = state.copyWith(selectedIndex: index);
    }
  }

  /// Refresh categories
  Future<void> refresh() async {
    await loadCategories();
  }
}

/// Provider for CategoriesNotifier
final categoriesScreenProvider =
    NotifierProvider<CategoriesNotifier, CategoriesState>(
      CategoriesNotifier.new,
    );
