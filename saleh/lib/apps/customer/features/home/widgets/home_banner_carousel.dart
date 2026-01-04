import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';

class HomeBannerCarousel extends ConsumerStatefulWidget {
  const HomeBannerCarousel({super.key});

  @override
  ConsumerState<HomeBannerCarousel> createState() => _HomeBannerCarouselState();
}

class _HomeBannerCarouselState extends ConsumerState<HomeBannerCarousel> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Banners data
  final List<Map<String, String>> _banners = [
    {
      'image':
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'brand': 'ESTAVOR',
      'title': 'خصم يصل إلى 50%',
    },
    {
      'image':
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
      'brand': 'FASHION',
      'title': 'تشكيلة صيف 2026',
    },
    {
      'image':
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
      'brand': 'PREMIUM',
      'title': 'شحن مجاني',
    },
  ];

  @override
  void initState() {
    super.initState();
    _startAutoScroll();
  }

  void _startAutoScroll() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted) {
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
              return Stack(
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
