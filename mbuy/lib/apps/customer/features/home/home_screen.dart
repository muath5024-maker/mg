import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'widgets/home_banner_carousel.dart';
import 'widgets/featured_stores_section.dart';
import 'widgets/trending_products_section.dart';
import 'widgets/categories_grid.dart';
import 'widgets/flash_deals_section.dart';
import 'widgets/rectangular_cards.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final ScrollController? scrollController;

  const HomeScreen({super.key, this.scrollController});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();
    _scrollController = widget.scrollController ?? ScrollController();
  }

  @override
  void dispose() {
    if (widget.scrollController == null) {
      _scrollController.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.surfaceColor,
      child: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppTheme.primaryColor,
        child: SingleChildScrollView(
          controller: _scrollController,
          child: Column(
            children: [
              // Hero Banner (400px)
              const HomeBannerCarousel(),
              const SizedBox(height: 16),

              // Rectangular Cards (Horizontal Scroll)
              const RectangularCards(),
              const SizedBox(height: 24),

              // Categories Grid (Circles)
              const CategoriesGrid(),
              const SizedBox(height: 24),

              // Flash Deals
              const FlashDealsSection(),
              const SizedBox(height: 24),

              // Featured Stores
              const FeaturedStoresSection(),
              const SizedBox(height: 24),

              // Trending Products
              const TrendingProductsSection(),

              // Bottom Padding
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _onRefresh() async {
    // TODO: Refresh data from API
    await Future.delayed(const Duration(seconds: 1));
  }
}
