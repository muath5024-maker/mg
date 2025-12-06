import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/data/dummy_data.dart';
import '../../../../shared/widgets/product_card_compact.dart';
import 'product_details_screen.dart';

/// شاشة المفضلة
class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MbuyColors.background,
      appBar: AppBar(
        title: const Text('المفضلة'),
        backgroundColor: MbuyColors.cardBackground,
        elevation: 0,
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: DummyData.products.length,
        itemBuilder: (context, index) {
          final product = DummyData.products[index];
          return ProductCardCompact(
            product: product,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ProductDetailsScreen(
                    productId: product.id,
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
