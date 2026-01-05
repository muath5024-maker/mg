import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

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

  static const Color _primaryColor = Color(0xFF00BFA5);

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
          // Video PageView
          PageView.builder(
            controller: _pageController,
            scrollDirection: Axis.vertical,
            onPageChanged: _onPageChanged,
            itemCount: widget.videos.length,
            itemBuilder: (context, index) => _buildVideoPage(index),
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
                        child: CircularProgressIndicator(color: _primaryColor),
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

        // Progress bar
        if (controller != null && controller.value.isInitialized)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: VideoProgressIndicator(
              controller,
              allowScrubbing: true,
              colors: const VideoProgressColors(
                playedColor: _primaryColor,
                bufferedColor: Colors.white30,
                backgroundColor: Colors.white10,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActions(VideoFeedItem video, int index) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // User Avatar
        GestureDetector(
          onTap: () {
            // Navigate to user profile
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
                      color: _primaryColor,
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
          activeColor: _primaryColor,
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
            iconColor: _primaryColor,
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
              const Icon(Icons.verified, color: _primaryColor, size: 16),
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
                const Icon(Icons.shopping_bag, color: _primaryColor, size: 16),
                const SizedBox(width: 8),
                Text(
                  video.productName ?? 'منتج مميز',
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '${video.productPrice ?? 0} ر.س',
                  style: const TextStyle(
                    color: _primaryColor,
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
  static const Color _primaryColor = Color(0xFF00BFA5);

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
                      color: _primaryColor,
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
