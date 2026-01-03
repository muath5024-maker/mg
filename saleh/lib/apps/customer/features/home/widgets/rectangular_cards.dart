import 'package:flutter/material.dart';

/// Rectangular Cards - MBUY Style (Horizontal Scroll)
class RectangularCards extends StatelessWidget {
  const RectangularCards({super.key});

  @override
  Widget build(BuildContext context) {
    final cards = [
      {
        'image': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
        'title': 'علامات تجارية',
        'subtitle': 'ESTAVOR',
      },
      {
        'image': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300',
        'title': 'الجديد',
        'subtitle': null,
      },
      {
        'image': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300',
        'title': 'خريف وشتاء',
        'subtitle': null,
      },
      {
        'image': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
        'title': 'مقاسات كبيرة',
        'subtitle': null,
      },
      {
        'image': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300',
        'title': 'التخفيضات',
        'subtitle': null,
      },
    ];

    return SizedBox(
      height: 170,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: cards.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final card = cards[i];
          return SizedBox(
            width: 100,
            child: Column(
              children: [
                // Image Container
                Container(
                  height: 130,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: Colors.grey.shade300,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      card['image']!,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      errorBuilder: (_, e, s) => Container(color: Colors.grey.shade300),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                // Title
                Text(
                  card['title']!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                // Subtitle (if exists)
                if (card['subtitle'] != null)
                  Text(
                    card['subtitle']!,
                    style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
