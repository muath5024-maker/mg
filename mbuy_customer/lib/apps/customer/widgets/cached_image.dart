/// Cached Image Widget - مكون الصور المخزنة مؤقتاً
///
/// Wrapper around CachedNetworkImage with consistent styling
library;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// Cached network image with placeholder and error handling
class AppCachedImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Widget? errorWidget;
  final Color? backgroundColor;

  const AppCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _buildPlaceholder();
    }

    Widget image = CachedNetworkImage(
      imageUrl: imageUrl!,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => placeholder ?? _buildShimmer(),
      errorWidget: (context, url, error) => errorWidget ?? _buildErrorWidget(),
      fadeInDuration: const Duration(milliseconds: 300),
      fadeOutDuration: const Duration(milliseconds: 300),
    );

    if (borderRadius != null) {
      image = ClipRRect(
        borderRadius: borderRadius!,
        child: image,
      );
    }

    return image;
  }

  Widget _buildPlaceholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.surfaceColor,
        borderRadius: borderRadius,
      ),
      child: const Center(
        child: Icon(
          Icons.image_outlined,
          color: AppTheme.textHint,
          size: 32,
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: borderRadius,
      ),
      child: const _ShimmerPlaceholder(),
    );
  }

  Widget _buildErrorWidget() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.surfaceColor,
        borderRadius: borderRadius,
      ),
      child: const Center(
        child: Icon(
          Icons.broken_image_outlined,
          color: AppTheme.textHint,
          size: 32,
        ),
      ),
    );
  }
}

/// Product image with aspect ratio
class ProductImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double aspectRatio;
  final BorderRadius? borderRadius;

  const ProductImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.aspectRatio = 1.0,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: AppCachedImage(
        imageUrl: imageUrl,
        width: width,
        fit: BoxFit.cover,
        borderRadius: borderRadius ?? BorderRadius.circular(8),
      ),
    );
  }
}

/// Store/Brand logo image (circular)
class LogoImage extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final Color? borderColor;
  final double borderWidth;

  const LogoImage({
    super.key,
    required this.imageUrl,
    this.size = 48,
    this.borderColor,
    this.borderWidth = 0,
  });

  @override
  Widget build(BuildContext context) {
    Widget image = AppCachedImage(
      imageUrl: imageUrl,
      width: size,
      height: size,
      fit: BoxFit.cover,
      borderRadius: BorderRadius.circular(size / 2),
      errorWidget: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.store,
          color: AppTheme.textHint,
          size: size * 0.5,
        ),
      ),
    );

    if (borderWidth > 0) {
      image = Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: borderColor ?? AppTheme.borderColor,
            width: borderWidth,
          ),
        ),
        child: image,
      );
    }

    return image;
  }
}

/// Banner/Hero image
class BannerImage extends StatelessWidget {
  final String? imageUrl;
  final double? height;
  final BorderRadius? borderRadius;
  final Widget? overlay;

  const BannerImage({
    super.key,
    required this.imageUrl,
    this.height = 180,
    this.borderRadius,
    this.overlay,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AppCachedImage(
          imageUrl: imageUrl,
          width: double.infinity,
          height: height,
          fit: BoxFit.cover,
          borderRadius: borderRadius ?? BorderRadius.circular(12),
        ),
        if (overlay != null)
          Positioned.fill(
            child: ClipRRect(
              borderRadius: borderRadius ?? BorderRadius.circular(12),
              child: overlay!,
            ),
          ),
      ],
    );
  }
}

/// Avatar image for users
class AvatarImage extends StatelessWidget {
  final String? imageUrl;
  final double size;
  final String? name;

  const AvatarImage({
    super.key,
    this.imageUrl,
    this.size = 40,
    this.name,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipOval(
        child: AppCachedImage(
          imageUrl: imageUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
        ),
      );
    }

    // Show initials if no image
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: name != null && name!.isNotEmpty
            ? Text(
                _getInitials(name!),
                style: TextStyle(
                  color: AppTheme.primaryColor,
                  fontSize: size * 0.4,
                  fontWeight: FontWeight.w600,
                ),
              )
            : Icon(
                Icons.person,
                color: AppTheme.primaryColor,
                size: size * 0.5,
              ),
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0].substring(0, parts[0].length.clamp(0, 2)).toUpperCase();
  }
}

/// Shimmer placeholder animation
class _ShimmerPlaceholder extends StatefulWidget {
  const _ShimmerPlaceholder();

  @override
  State<_ShimmerPlaceholder> createState() => _ShimmerPlaceholderState();
}

class _ShimmerPlaceholderState extends State<_ShimmerPlaceholder>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(-1 + _controller.value * 2, 0),
              end: Alignment(_controller.value * 2, 0),
              colors: [
                Colors.grey.shade200,
                Colors.grey.shade100,
                Colors.grey.shade200,
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Image gallery widget
class ImageGallery extends StatefulWidget {
  final List<String> images;
  final double height;
  final BorderRadius? borderRadius;
  final bool showIndicator;

  const ImageGallery({
    super.key,
    required this.images,
    this.height = 300,
    this.borderRadius,
    this.showIndicator = true,
  });

  @override
  State<ImageGallery> createState() => _ImageGalleryState();
}

class _ImageGalleryState extends State<ImageGallery> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return AppCachedImage(
        imageUrl: null,
        height: widget.height,
        borderRadius: widget.borderRadius,
      );
    }

    return Stack(
      children: [
        SizedBox(
          height: widget.height,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemBuilder: (context, index) {
              return AppCachedImage(
                imageUrl: widget.images[index],
                height: widget.height,
                fit: BoxFit.cover,
                borderRadius: widget.borderRadius,
              );
            },
          ),
        ),
        if (widget.showIndicator && widget.images.length > 1)
          Positioned(
            bottom: 12,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                widget.images.length,
                (index) => Container(
                  width: _currentIndex == index ? 20 : 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    color: _currentIndex == index
                        ? AppTheme.primaryColor
                        : Colors.white.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
