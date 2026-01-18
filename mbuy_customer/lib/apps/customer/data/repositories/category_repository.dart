/// Category Repository - مستودع الفئات
///
/// Handles all category-related data operations with caching
library;

import '../../models/models.dart';
import 'base_repository.dart';

/// Category Repository Interface
abstract class ICategoryRepository {
  Future<Result<List<Category>>> getCategories();
  Future<Result<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  });
  void clearCache();
}

/// Category Repository Implementation with caching
class CategoryRepository extends BaseRepository implements ICategoryRepository {
  List<Category>? _cachedCategories;
  DateTime? _cacheTime;
  final Duration _cacheDuration;

  CategoryRepository(
    super.api, {
    Duration cacheDuration = const Duration(minutes: 10),
  }) : _cacheDuration = cacheDuration;

  bool get _isCacheValid =>
      _cachedCategories != null &&
      _cacheTime != null &&
      DateTime.now().difference(_cacheTime!) < _cacheDuration;

  @override
  Future<Result<List<Category>>> getCategories() async {
    // Return cached data if valid
    if (_isCacheValid) {
      return Result.success(_cachedCategories!);
    }

    // Fetch from API
    final response = await api.getCategories();
    final result = toResult(response);

    // Cache successful results
    if (result.isSuccess) {
      _cachedCategories = result.data;
      _cacheTime = DateTime.now();
    }

    return result;
  }

  @override
  Future<Result<List<Product>>> getProductsByCategory(
    String categoryId, {
    int page = 1,
    int limit = 20,
  }) async {
    final response = await api.getProductsByCategory(
      categoryId,
      page: page,
      limit: limit,
    );
    return toResult(response);
  }

  @override
  void clearCache() {
    _cachedCategories = null;
    _cacheTime = null;
  }

  /// Get cached categories (if available)
  List<Category>? get cachedCategories => _cachedCategories;
}
