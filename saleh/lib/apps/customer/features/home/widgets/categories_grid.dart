import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Categories Grid - MBUY Style (Circles - 5 columns, 3 rows)
class CategoriesGrid extends ConsumerWidget {
  const CategoriesGrid({super.key});

  static const List<String> _categories = [
    // Row 1
    'ملابس خارجية',
    'ملابس علوية',
    'تيشيرتات',
    'ملابس سفلية',
    'جاكيتات',
    // Row 2
    'قمصان',
    'أطقم منسقة',
    'دينيم',
    'مقاسات كبيرة',
    'بدلات',
    // Row 3
    'بناطيل',
    'هوديز',
    'بولو',
    'منسوجة',
    'أزياء خاصة',
  ];

  static const List<String> _images = [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200',
    'https://images.unsplash.com/photo-1519722417352-7d6959729417?w=200',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200',
    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200',
    'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=200',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          childAspectRatio: 0.65,
          crossAxisSpacing: 4,
          mainAxisSpacing: 12,
        ),
        itemCount: _categories.length,
        itemBuilder: (_, i) {
          return GestureDetector(
            onTap: () {
              // TODO: Navigate to category
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
                      _images[i % _images.length],
                      fit: BoxFit.cover,
                      errorBuilder: (c, e, s) =>
                          Container(color: Colors.grey.shade300),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                // Category Name
                Flexible(
                  child: Text(
                    _categories[i],
                    style: TextStyle(fontSize: 10, color: Colors.grey.shade700),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
