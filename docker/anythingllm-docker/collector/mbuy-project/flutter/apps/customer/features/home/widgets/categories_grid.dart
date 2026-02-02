import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../data/platform_categories_repository.dart';
import '../../../models/platform_category.dart';

/// Categories Grid - MBUY Style (Circles - 5 columns, dynamic rows)
class CategoriesGrid extends ConsumerWidget {
  const CategoriesGrid({super.key});

  // Fallback images for categories without icons
  static const List<String> _fallbackImages = [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200',
    'https://images.unsplash.com/photo-1519722417352-7d6959729417?w=200',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=200',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(platformCategoriesProvider);

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(16),
      child: categoriesAsync.when(
        data: (categories) {
          // Get only parent categories (no parent_id) and limit to 15
          final mainCategories = categories
              .where((c) => c.parentId == null)
              .take(15)
              .toList();

          if (mainCategories.isEmpty) {
            return _buildEmptyState();
          }

          return GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 5,
              childAspectRatio: 0.65,
              crossAxisSpacing: 4,
              mainAxisSpacing: 12,
            ),
            itemCount: mainCategories.length,
            itemBuilder: (_, i) {
              return _buildCategoryItem(context, mainCategories[i], i);
            },
          );
        },
        loading: () => _buildLoadingGrid(),
        error: (error, stack) => _buildErrorState(ref),
      ),
    );
  }

  Widget _buildCategoryItem(
    BuildContext context,
    PlatformCategory category,
    int index,
  ) {
    // Use category icon or fallback image
    final imageUrl = category.icon?.isNotEmpty == true
        ? category.icon!
        : _fallbackImages[index % _fallbackImages.length];

    return GestureDetector(
      onTap: () {
        context.push('/category/${category.slug}/products');
      },
      child: Column(
        children: [
          // Circle Image
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.grey.shade200),
              color: Colors.grey.shade200,
            ),
            child: ClipOval(
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (c, e, s) => Container(
                  color: Colors.grey.shade300,
                  child: Icon(
                    Icons.category,
                    color: Colors.grey.shade500,
                    size: 24,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          // Category Name
          Flexible(
            child: Text(
              category.name,
              style: TextStyle(fontSize: 10, color: Colors.grey.shade700),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        childAspectRatio: 0.65,
        crossAxisSpacing: 4,
        mainAxisSpacing: 12,
      ),
      itemCount: 10,
      itemBuilder: (_, i) {
        return Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.grey.shade200,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              width: 40,
              height: 10,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.category_outlined, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 8),
          Text('لا توجد فئات', style: TextStyle(color: Colors.grey.shade600)),
        ],
      ),
    );
  }

  Widget _buildErrorState(WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
          const SizedBox(height: 8),
          Text(
            'خطأ في تحميل الفئات',
            style: TextStyle(color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.invalidate(platformCategoriesProvider),
            child: const Text('إعادة المحاولة'),
          ),
        ],
      ),
    );
  }
}
