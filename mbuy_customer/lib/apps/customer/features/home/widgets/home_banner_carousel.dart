import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/platform_categories_repository.dart';

class HomeBannerCarousel extends ConsumerStatefulWidget {
  const HomeBannerCarousel({super.key});

  @override
  ConsumerState<HomeBannerCarousel> createState() => _HomeBannerCarouselState();
}

class _HomeBannerCarouselState extends ConsumerState<HomeBannerCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Default banners (fallback)
  static const List<Map<String, String>> _defaultBanners = [
    {
      'image':
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'brand': 'ESTAVOR',
      'title': 'خصم يصل إلى 50%',
      'storeId': '',
    },
    {
      'image':
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
      'brand': 'FASHION',
      'title': 'تشكيلة صيف 2026',
      'storeId': '',
    },
    {
      'image':
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      'brand': 'PREMIUM',
      'title': 'شحن مجاني',
      'storeId': '',
    },
  ];

  List<Map<String, String>> _banners = _defaultBanners;

  @override
  void initState() {
    super.initState();
    _startAutoScroll();
  }

  void _startAutoScroll() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _banners.isNotEmpty) {
        final nextPage = (_currentPage + 1) % _banners.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
        _startAutoScroll();
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Watch for home banner stores
    final bannerStoresAsync = ref.watch(homeBannerStoresProvider);

    // Convert boosted stores to banner format
    bannerStoresAsync.whenData((stores) {
      if (stores.isNotEmpty) {
        final boostedBanners = stores.map((store) {
          final storeId = store['id'] as String? ?? '';
          final storeName = store['business_name'] as String? ?? 'متجر';
          final logoUrl = store['logo_url'] as String? ?? '';
          // Use a placeholder banner image or the logo
          final bannerImage = logoUrl.isNotEmpty
              ? logoUrl
              : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800';

          return {
            'image': bannerImage,
            'brand': storeName.toUpperCase(),
            'title': 'تسوق الآن',
            'storeId': storeId,
          };
        }).toList();

        // Merge boosted stores with default banners
        if (mounted) {
          setState(() {
            _banners = [...boostedBanners, ..._defaultBanners].take(5).toList();
          });
        }
      }
    });

    return SizedBox(
      height: 400,
      child: Stack(
        children: [
          // PageView for banners
          PageView.builder(
            controller: _pageController,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemCount: _banners.length,
            itemBuilder: (_, i) {
              final banner = _banners[i];
              return GestureDetector(
                onTap: () {
                  final storeId = banner['storeId'];
                  if (storeId != null && storeId.isNotEmpty) {
                    context.push('/store/$storeId');
                  }
                },
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Background Image
                    Image.network(
                      banner['image']!,
                      fit: BoxFit.cover,
                      errorBuilder: (c, e, s) =>
                          Container(color: Colors.grey.shade300),
                    ),
                    // Gradient Overlay
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.1),
                            Colors.black.withValues(alpha: 0.4),
                          ],
                        ),
                      ),
                    ),
                    // Sponsored Badge (for boosted stores)
                    if (banner['storeId']?.isNotEmpty == true)
                      Positioned(
                        top: 60,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, size: 14, color: Colors.white),
                              SizedBox(width: 4),
                              Text(
                                'إعلان مميز',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    // Content
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Brand Name
                          Text(
                            banner['brand']!,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w300,
                              letterSpacing: 8,
                              shadows: [
                                Shadow(color: Colors.black54, blurRadius: 4),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Main Title
                          Text(
                            banner['title']!,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              shadows: [
                                Shadow(color: Colors.black54, blurRadius: 4),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Shop Now Button
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 32,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.white30),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'تسوق الآن',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(width: 8),
                                Icon(
                                  Icons.arrow_back_ios,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          // Pagination Dots
          Positioned(
            bottom: 16,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_banners.length, (i) {
                return Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _currentPage == i ? Colors.white : Colors.white54,
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}
