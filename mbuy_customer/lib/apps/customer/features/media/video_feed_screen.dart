import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:video_player/video_player.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/customer_providers.dart';

/// شاشة تغذية الفيديو القابلة للتمرير - Swipeable Video Feed
class VideoFeedScreen extends ConsumerStatefulWidget {
  final List<VideoFeedItem> videos;
  final int initialIndex;

  const VideoFeedScreen({
    super.key,
    required this.videos,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<VideoFeedScreen> createState() => _VideoFeedScreenState();
}

class _VideoFeedScreenState extends ConsumerState<VideoFeedScreen> {
  late PageController _pageController;
  int _currentIndex = 0;
  final Map<int, VideoPlayerController> _controllers = {};

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _initializeVideos();
  }

  void _initializeVideos() {
    // Pre-load current and adjacent videos
    _loadVideo(_currentIndex);
    if (_currentIndex > 0) _loadVideo(_currentIndex - 1);
    if (_currentIndex < widget.videos.length - 1) _loadVideo(_currentIndex + 1);
  }

  Future<void> _loadVideo(int index) async {
    if (_controllers.containsKey(index)) return;
    if (index < 0 || index >= widget.videos.length) return;

    final controller = VideoPlayerController.networkUrl(
      Uri.parse(widget.videos[index].videoUrl),
    );

    _controllers[index] = controller;

    try {
      await controller.initialize();
      controller.setLooping(true);
      if (index == _currentIndex && mounted) {
        controller.play();
        setState(() {});
      }
    } catch (e) {
      debugPrint('Error loading video $index: $e');
    }
  }

  void _onPageChanged(int index) {
    // Pause previous video
    _controllers[_currentIndex]?.pause();

    setState(() => _currentIndex = index);

    // Play current video
    _controllers[index]?.play();

    // Pre-load adjacent videos
    if (index > 0) _loadVideo(index - 1);
    if (index < widget.videos.length - 1) _loadVideo(index + 1);

    // Dispose far videos to save memory
    _disposeDistantVideos(index);
  }

  void _disposeDistantVideos(int currentIndex) {
    final keysToRemove = <int>[];
    for (final key in _controllers.keys) {
      if ((key - currentIndex).abs() > 2) {
        _controllers[key]?.dispose();
        keysToRemove.add(key);
      }
    }
    for (final key in keysToRemove) {
      _controllers.remove(key);
    }
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video PageView with horizontal swipe detection
          GestureDetector(
            onHorizontalDragEnd: (details) {
              // Swipe right to go to profile (velocity > 0 means swipe to right)
              if (details.primaryVelocity != null &&
                  details.primaryVelocity! > 200) {
                final video = widget.videos[_currentIndex];
                _showStoreConfirmation(video);
              }
              // Swipe left to go back (velocity < 0 means swipe to left)
              if (details.primaryVelocity != null &&
                  details.primaryVelocity! < -200) {
                Navigator.pop(context);
              }
            },
            behavior: HitTestBehavior.translucent,
            child: PageView.builder(
              controller: _pageController,
              scrollDirection: Axis.vertical,
              onPageChanged: _onPageChanged,
              itemCount: widget.videos.length,
              itemBuilder: (context, index) => _buildVideoPage(index),
            ),
          ),

          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            right: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 24),
              ),
            ),
          ),

          // 3-dot menu button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            child: GestureDetector(
              onTap: () => _showOptionsMenu(),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.more_vert,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),

          // Swipe hint indicator
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: Center(
              child: Container(
                width: 4,
                height: 60,
                margin: const EdgeInsets.only(left: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _isFollowing = false;

  void _showUserProfileSheet(VideoFeedItem video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setSheetState) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 45,
                  backgroundImage: NetworkImage(video.userAvatar),
                ),
                const SizedBox(height: 12),
                Text(
                  video.userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildProfileStat('متابعين', '125k'),
                    _buildProfileStat('متابَعين', '89'),
                    _buildProfileStat('إعجابات', '2.5M'),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          setSheetState(() {
                            _isFollowing = !_isFollowing;
                          });
                          setState(() {});
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isFollowing
                              ? Colors.grey[700]
                              : AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          _isFollowing ? 'إلغاء المتابعة' : 'متابعة',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          context.push('/store/store_${video.id}');
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white38),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'زيارة المتجر',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 12),
        ),
      ],
    );
  }

  void _showStoreConfirmation(VideoFeedItem video) {
    _showUserProfileSheet(video);
  }

  void _showOptionsMenu() {
    final video = widget.videos[_currentIndex];
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[700],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            _buildMenuOption(
              icon: Icons.info_outline,
              label: 'شرح المنتج',
              onTap: () {
                Navigator.pop(context);
                // Show product explanation
                _showProductExplanation(video);
              },
            ),
            _buildMenuOption(
              icon: Icons.visibility_off,
              label: 'إخفاء هذا النوع',
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('تم إخفاء هذا النوع من المحتوى'),
                  ),
                );
              },
            ),
            _buildMenuOption(
              icon: Icons.flag_outlined,
              label: 'إبلاغ',
              onTap: () {
                Navigator.pop(context);
                _showReportDialog();
              },
            ),
            _buildMenuOption(
              icon: Icons.lightbulb_outline,
              label: 'اقتراح',
              onTap: () {
                Navigator.pop(context);
                _showSuggestionDialog();
              },
            ),
            _buildMenuOption(
              icon: Icons.block,
              label: 'حظر الحساب',
              isDestructive: true,
              onTap: () {
                Navigator.pop(context);
                _showBlockConfirmation(video);
              },
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuOption({
    required IconData icon,
    required String label,
    bool isDestructive = false,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: isDestructive ? Colors.red : Colors.white),
      title: Text(
        label,
        style: TextStyle(
          color: isDestructive ? Colors.red : Colors.white,
          fontSize: 16,
        ),
      ),
      onTap: onTap,
    );
  }

  void _showProductExplanation(VideoFeedItem video) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.shopping_bag, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  video.productName ?? 'منتج مميز',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'وصف المنتج',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 8),
            const Text(
              'هذا المنتج يتميز بجودة عالية وتصميم أنيق يناسب جميع الأذواق.',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('السعر', style: TextStyle(color: Colors.white70)),
                Text(
                  '${video.productPrice ?? 0} ر.س',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final scaffoldMessenger = ScaffoldMessenger.of(context);
                  Navigator.pop(context);
                  // Add to cart using cartProvider
                  final success = await ref
                      .read(cartProvider.notifier)
                      .addToCart('product_${video.id}', quantity: 1);
                  if (mounted) {
                    scaffoldMessenger.showSnackBar(
                      SnackBar(
                        content: Text(
                          success ? 'تمت الإضافة للسلة ✅' : 'فشل إضافة المنتج',
                        ),
                        backgroundColor: success
                            ? AppColors.primary
                            : Colors.red,
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'إضافة للسلة',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showReportDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('إبلاغ', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildReportOption('محتوى غير لائق'),
            _buildReportOption('انتهاك حقوق الملكية'),
            _buildReportOption('احتيال أو خداع'),
            _buildReportOption('سلوك ضار'),
            _buildReportOption('سبب آخر'),
          ],
        ),
      ),
    );
  }

  Widget _buildReportOption(String label) {
    return ListTile(
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: () {
        Navigator.pop(context);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('شكراً على الإبلاغ')));
      },
    );
  }

  void _showSuggestionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('اقتراح', style: TextStyle(color: Colors.white)),
        content: TextField(
          maxLines: 3,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'اكتب اقتراحك هنا...',
            hintStyle: const TextStyle(color: Colors.white54),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.white24),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.white24),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.primary),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('شكراً على اقتراحك')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('إرسال', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showBlockConfirmation(VideoFeedItem video) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text('حظر الحساب', style: TextStyle(color: Colors.white)),
        content: Text(
          'هل تريد حظر ${video.userName}؟ لن ترى محتواه بعد الآن.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('تم حظر ${video.userName}')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('حظر', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPage(int index) {
    final video = widget.videos[index];
    final controller = _controllers[index];

    return Stack(
      fit: StackFit.expand,
      children: [
        // Video or Thumbnail
        GestureDetector(
          onTap: () {
            if (controller != null && controller.value.isInitialized) {
              if (controller.value.isPlaying) {
                controller.pause();
              } else {
                controller.play();
              }
              setState(() {});
            }
          },
          child: Container(
            color: Colors.black,
            child: controller != null && controller.value.isInitialized
                ? FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: controller.value.size.width,
                      height: controller.value.size.height,
                      child: VideoPlayer(controller),
                    ),
                  )
                : Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        video.thumbnailUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            Container(color: Colors.grey[900]),
                      ),
                      const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
          ),
        ),

        // Play/Pause indicator
        if (controller != null &&
            controller.value.isInitialized &&
            !controller.value.isPlaying)
          Center(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.play_arrow,
                color: Colors.white,
                size: 48,
              ),
            ),
          ),

        // Gradient overlay
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          height: 300,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black.withValues(alpha: 0.8),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),

        // Right side actions
        Positioned(right: 12, bottom: 120, child: _buildActions(video, index)),

        // Bottom info
        Positioned(
          left: 16,
          right: 80,
          bottom: 24,
          child: _buildVideoInfo(video),
        ),

        // Enhanced Progress bar with duration
        if (controller != null && controller.value.isInitialized)
          Positioned(
            left: 16,
            right: 16,
            bottom: 8,
            child: _buildEnhancedProgressBar(controller),
          ),
      ],
    );
  }

  Widget _buildEnhancedProgressBar(VideoPlayerController controller) {
    return ValueListenableBuilder(
      valueListenable: controller,
      builder: (context, VideoPlayerValue value, child) {
        final position = value.position;
        final duration = value.duration;
        final progress = duration.inMilliseconds > 0
            ? position.inMilliseconds / duration.inMilliseconds
            : 0.0;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Time display
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatDuration(position),
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
                Text(
                  _formatDuration(duration),
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
            const SizedBox(height: 4),
            // Slider
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 3,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                overlayShape: const RoundSliderOverlayShape(overlayRadius: 12),
                activeTrackColor: AppColors.primary,
                inactiveTrackColor: Colors.white24,
                thumbColor: AppColors.primary,
                overlayColor: AppColors.primary.withValues(alpha: 0.2),
              ),
              child: Slider(
                value: progress.clamp(0.0, 1.0),
                onChanged: (value) {
                  final newPosition = Duration(
                    milliseconds: (value * duration.inMilliseconds).round(),
                  );
                  controller.seekTo(newPosition);
                },
              ),
            ),
          ],
        );
      },
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  Widget _buildActions(VideoFeedItem video, int index) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // User Avatar
        GestureDetector(
          onTap: () {
            _showUserProfileSheet(video);
          },
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: ClipOval(
                  child: Image.network(
                    video.userAvatar,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.grey,
                      child: const Icon(Icons.person, color: Colors.white),
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -8,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.add, color: Colors.white, size: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Like
        _buildActionButton(
          icon: Icons.favorite,
          label: _formatCount(video.likesCount),
          isActive: video.isLiked,
          activeColor: Colors.red,
          onTap: () {
            setState(() {
              widget.videos[index] = video.copyWith(
                isLiked: !video.isLiked,
                likesCount: video.isLiked
                    ? video.likesCount - 1
                    : video.likesCount + 1,
              );
            });
          },
        ),
        const SizedBox(height: 20),

        // Comment
        _buildActionButton(
          icon: Icons.chat_bubble,
          label: _formatCount(video.commentsCount),
          onTap: () => _showCommentsSheet(video),
        ),
        const SizedBox(height: 20),

        // Share
        _buildActionButton(
          icon: Icons.share,
          label: 'مشاركة',
          onTap: () => _showShareSheet(),
        ),
        const SizedBox(height: 20),

        // Save
        _buildActionButton(
          icon: video.isSaved ? Icons.bookmark : Icons.bookmark_border,
          label: 'حفظ',
          isActive: video.isSaved,
          activeColor: AppColors.primary,
          onTap: () {
            setState(() {
              widget.videos[index] = video.copyWith(isSaved: !video.isSaved);
            });
          },
        ),
        const SizedBox(height: 20),

        // Shop
        if (video.hasProduct)
          _buildActionButton(
            icon: Icons.shopping_bag,
            label: 'تسوق',
            iconColor: AppColors.primary,
            onTap: () {
              // Navigate to product
            },
          ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    bool isActive = false,
    Color? activeColor,
    Color? iconColor,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(
            icon,
            color: isActive
                ? (activeColor ?? Colors.white)
                : (iconColor ?? Colors.white),
            size: 32,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoInfo(VideoFeedItem video) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Username
        Row(
          children: [
            Text(
              '@${video.userName}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (video.isVerified) ...[
              const SizedBox(width: 4),
              const Icon(Icons.verified, color: AppColors.primary, size: 16),
            ],
          ],
        ),
        const SizedBox(height: 8),

        // Title/Description
        Text(
          video.title,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),

        // Product tag if exists
        if (video.hasProduct) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.shopping_bag,
                  color: AppColors.primary,
                  size: 16,
                ),
                const SizedBox(width: 8),
                Text(
                  video.productName ?? 'منتج مميز',
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '${video.productPrice ?? 0} ر.س',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  void _showCommentsSheet(VideoFeedItem video) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CommentsSheet(video: video),
    );
  }

  void _showShareSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[700],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'مشاركة',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareOption(Icons.link, 'نسخ الرابط'),
                _buildShareOption(Icons.chat, 'واتساب'),
                _buildShareOption(Icons.telegram, 'تيليجرام'),
                _buildShareOption(Icons.more_horiz, 'المزيد'),
              ],
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.grey[800],
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

/// Comments Bottom Sheet
class _CommentsSheet extends StatefulWidget {
  final VideoFeedItem video;

  const _CommentsSheet({required this.video});

  @override
  State<_CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<_CommentsSheet> {
  final TextEditingController _controller = TextEditingController();

  final List<VideoComment> _comments = [
    VideoComment(
      userName: 'أحمد محمد',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      comment: 'فيديو رائع جداً! 🔥',
      likesCount: 234,
      timeAgo: 'منذ ساعة',
    ),
    VideoComment(
      userName: 'سارة أحمد',
      userAvatar: 'https://i.pravatar.cc/150?img=5',
      comment: 'كيف أقدر أشتري المنتج؟',
      likesCount: 45,
      timeAgo: 'منذ ٣ ساعات',
    ),
    VideoComment(
      userName: 'محمد علي',
      userAvatar: 'https://i.pravatar.cc/150?img=3',
      comment: 'المنتج وصل وجودته ممتازة 👍',
      likesCount: 89,
      timeAgo: 'منذ يوم',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[700],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Text(
                  '${widget.video.commentsCount} تعليق',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: const Icon(Icons.close, color: Colors.white70),
                ),
              ],
            ),
          ),

          const Divider(color: Colors.white10, height: 1),

          // Comments List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _comments.length,
              itemBuilder: (context, index) => _buildComment(_comments[index]),
            ),
          ),

          // Input
          Container(
            padding: EdgeInsets.fromLTRB(
              16,
              12,
              16,
              MediaQuery.of(context).padding.bottom + 12,
            ),
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border(top: BorderSide(color: Colors.grey[800]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'أضف تعليقاً...',
                      hintStyle: TextStyle(color: Colors.grey[600]),
                      filled: true,
                      fillColor: Colors.grey[900],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () {
                    if (_controller.text.trim().isNotEmpty) {
                      setState(() {
                        _comments.insert(
                          0,
                          VideoComment(
                            userName: 'أنا',
                            userAvatar: 'https://i.pravatar.cc/150?img=10',
                            comment: _controller.text.trim(),
                            likesCount: 0,
                            timeAgo: 'الآن',
                          ),
                        );
                        _controller.clear();
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComment(VideoComment comment) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: NetworkImage(comment.userAvatar),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      comment.userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      comment.timeAgo,
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  comment.comment,
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.favorite_border,
                      color: Colors.grey,
                      size: 16,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${comment.likesCount}',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'رد',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Models
class VideoFeedItem {
  final String id;
  final String videoUrl;
  final String thumbnailUrl;
  final String userName;
  final String userAvatar;
  final String title;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final bool isSaved;
  final bool isVerified;
  final bool hasProduct;
  final String? productName;
  final double? productPrice;

  VideoFeedItem({
    required this.id,
    required this.videoUrl,
    required this.thumbnailUrl,
    required this.userName,
    required this.userAvatar,
    required this.title,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLiked = false,
    this.isSaved = false,
    this.isVerified = false,
    this.hasProduct = false,
    this.productName,
    this.productPrice,
  });

  VideoFeedItem copyWith({
    String? id,
    String? videoUrl,
    String? thumbnailUrl,
    String? userName,
    String? userAvatar,
    String? title,
    int? likesCount,
    int? commentsCount,
    bool? isLiked,
    bool? isSaved,
    bool? isVerified,
    bool? hasProduct,
    String? productName,
    double? productPrice,
  }) {
    return VideoFeedItem(
      id: id ?? this.id,
      videoUrl: videoUrl ?? this.videoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
      title: title ?? this.title,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
      isVerified: isVerified ?? this.isVerified,
      hasProduct: hasProduct ?? this.hasProduct,
      productName: productName ?? this.productName,
      productPrice: productPrice ?? this.productPrice,
    );
  }
}

class VideoComment {
  final String userName;
  final String userAvatar;
  final String comment;
  final int likesCount;
  final String timeAgo;

  VideoComment({
    required this.userName,
    required this.userAvatar,
    required this.comment,
    required this.likesCount,
    required this.timeAgo,
  });
}
