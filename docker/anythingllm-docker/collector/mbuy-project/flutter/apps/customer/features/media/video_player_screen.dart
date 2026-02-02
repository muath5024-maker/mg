import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

/// شاشة مشغل الفيديو - تصميم TikTok/Reels Style
class VideoPlayerScreen extends ConsumerStatefulWidget {
  final String videoUrl;
  final String title;
  final String userName;
  final String userAvatar;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;

  const VideoPlayerScreen({
    super.key,
    required this.videoUrl,
    required this.title,
    required this.userName,
    required this.userAvatar,
    required this.likesCount,
    required this.commentsCount,
    required this.sharesCount,
  });

  @override
  ConsumerState<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends ConsumerState<VideoPlayerScreen> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  bool _isPlaying = true;
  bool _showControls = true;
  bool _isLiked = false;
  bool _isFollowing = false;
  double _currentPosition = 0;
  double _totalDuration = 1;

  static const Color _primaryColor = Color(0xFF00BFA5);

  @override
  void initState() {
    super.initState();
    // إخفاء شريط الحالة للتجربة الكاملة
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _initializeVideo();
    // إخفاء عناصر التحكم بعد 3 ثواني
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showControls = false);
    });
  }

  Future<void> _initializeVideo() async {
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    try {
      await _controller.initialize();
      _controller.setLooping(true);
      _controller.addListener(_videoListener);
      if (mounted) {
        setState(() {
          _isInitialized = true;
          _totalDuration = _controller.value.duration.inMilliseconds.toDouble();
        });
        _controller.play();
      }
    } catch (e) {
      debugPrint('Error initializing video: $e');
    }
  }

  void _videoListener() {
    if (mounted) {
      setState(() {
        _currentPosition = _controller.value.position.inMilliseconds.toDouble();
        _isPlaying = _controller.value.isPlaying;
      });
    }
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _controller.removeListener(_videoListener);
    _controller.dispose();
    super.dispose();
  }

  void _togglePlayPause() {
    if (_controller.value.isPlaying) {
      _controller.pause();
    } else {
      _controller.play();
    }
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
    if (_showControls) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _showControls) setState(() => _showControls = false);
      });
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: _toggleControls,
        onDoubleTap: () {
          setState(() => _isLiked = true);
          // إظهار قلب متحرك
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Video Player
            _buildVideoPlayer(),

            // Gradient Overlay
            _buildGradientOverlay(),

            // Top Bar
            if (_showControls) _buildTopBar(),

            // Center Play/Pause
            if (_showControls) _buildCenterControls(),

            // Right Side Actions
            _buildRightActions(),

            // Bottom Content
            _buildBottomContent(),

            // Progress Bar
            if (_showControls) _buildProgressBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildVideoPlayer() {
    if (!_isInitialized) {
      return const Center(
        child: CircularProgressIndicator(color: _primaryColor),
      );
    }

    return Center(
      child: AspectRatio(
        aspectRatio: _controller.value.aspectRatio,
        child: VideoPlayer(_controller),
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.4),
            Colors.transparent,
            Colors.transparent,
            Colors.black.withValues(alpha: 0.6),
          ],
          stops: const [0.0, 0.2, 0.6, 1.0],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(
                  Icons.arrow_back,
                  color: Colors.white,
                  size: 28,
                ),
                onPressed: () => Navigator.pop(context),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.search, color: Colors.white, size: 28),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(
                  Icons.more_vert,
                  color: Colors.white,
                  size: 28,
                ),
                onPressed: () => _showOptionsSheet(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCenterControls() {
    return Center(
      child: GestureDetector(
        onTap: _togglePlayPause,
        child: AnimatedOpacity(
          opacity: _showControls ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 200),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              _isPlaying ? Icons.pause : Icons.play_arrow,
              color: Colors.white,
              size: 50,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRightActions() {
    return Positioned(
      right: 12,
      bottom: 120,
      child: Column(
        children: [
          // User Avatar + Follow
          _buildUserAvatar(),
          const SizedBox(height: 20),
          // Like
          _buildActionButton(
            icon: _isLiked ? Icons.favorite : Icons.favorite_border,
            label: _formatCount(widget.likesCount + (_isLiked ? 1 : 0)),
            color: _isLiked ? Colors.red : Colors.white,
            onTap: () => setState(() => _isLiked = !_isLiked),
          ),
          const SizedBox(height: 16),
          // Comment
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: _formatCount(widget.commentsCount),
            onTap: () => _showCommentsSheet(),
          ),
          const SizedBox(height: 16),
          // Share
          _buildActionButton(
            icon: Icons.share,
            label: _formatCount(widget.sharesCount),
            onTap: () => _showShareSheet(),
          ),
          const SizedBox(height: 16),
          // Save
          _buildActionButton(
            icon: Icons.bookmark_border,
            label: 'حفظ',
            onTap: () {},
          ),
          const SizedBox(height: 16),
          // Shop
          _buildActionButton(
            icon: Icons.shopping_bag_outlined,
            label: 'تسوق',
            color: _primaryColor,
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildUserAvatar() {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: CircleAvatar(
                radius: 24,
                backgroundImage: NetworkImage(widget.userAvatar),
              ),
            ),
            if (!_isFollowing)
              Positioned(
                bottom: -8,
                left: 0,
                right: 0,
                child: Center(
                  child: GestureDetector(
                    onTap: () => setState(() => _isFollowing = true),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: _primaryColor,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 14,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    Color? color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, color: color ?? Colors.white, size: 30),
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

  Widget _buildBottomContent() {
    return Positioned(
      left: 12,
      right: 80,
      bottom: 30,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Username
          Row(
            children: [
              Text(
                '@${widget.userName}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(width: 8),
              if (_isFollowing)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white54),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'متابَع',
                    style: TextStyle(color: Colors.white54, fontSize: 10),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          // Title
          Text(
            widget.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              height: 1.3,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          // Product Tag (Optional)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.network(
                      'https://picsum.photos/100?random=200',
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'منتج مميز',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '99 ر.س',
                        style: TextStyle(
                          color: Colors.amber,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _primaryColor,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text(
                    'عرض',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
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

  Widget _buildProgressBar() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Text(
                _formatDuration(
                  Duration(milliseconds: _currentPosition.toInt()),
                ),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 3,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 6,
                    ),
                    overlayShape: const RoundSliderOverlayShape(
                      overlayRadius: 12,
                    ),
                    activeTrackColor: _primaryColor,
                    inactiveTrackColor: Colors.white30,
                    thumbColor: _primaryColor,
                    overlayColor: _primaryColor.withValues(alpha: 0.2),
                  ),
                  child: Slider(
                    value: _currentPosition.clamp(0, _totalDuration),
                    max: _totalDuration,
                    onChanged: (value) {
                      _controller.seekTo(Duration(milliseconds: value.toInt()));
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _formatDuration(Duration(milliseconds: _totalDuration.toInt())),
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k';
    }
    return count.toString();
  }

  void _showCommentsSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Color(0xFF1A1A1A),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[600],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Text(
                      '${widget.commentsCount} تعليق',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
              const Divider(color: Colors.white12),
              // Comments List
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: 10,
                  itemBuilder: (context, index) => _buildCommentItem(index),
                ),
              ),
              // Comment Input
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Color(0xFF252525),
                  border: Border(top: BorderSide(color: Colors.white12)),
                ),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 18,
                        backgroundImage: NetworkImage(
                          'https://picsum.photos/50?random=999',
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          style: const TextStyle(color: Colors.white),
                          decoration: InputDecoration(
                            hintText: 'أضف تعليق...',
                            hintStyle: TextStyle(color: Colors.grey[500]),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(20),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Colors.white10,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.send, color: _primaryColor),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCommentItem(int index) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: NetworkImage(
              'https://picsum.photos/50?random=${index + 50}',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'مستخدم_$index',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'منذ ${index + 1} ساعة',
                      style: TextStyle(color: Colors.grey[600], fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'تعليق رائع على هذا الفيديو! 👏',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.favorite_border,
                      size: 16,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${(index + 1) * 12}',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      'رد',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
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

  void _showShareSheet() {
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
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'مشاركة',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildShareOption(Icons.link, 'نسخ الرابط'),
                  _buildShareOption(Icons.message, 'رسالة'),
                  _buildShareOption(Icons.share, 'واتساب', color: Colors.green),
                  _buildShareOption(
                    Icons.telegram,
                    'تيليجرام',
                    color: Colors.blue,
                  ),
                  _buildShareOption(
                    Icons.facebook,
                    'فيسبوك',
                    color: Colors.blue[800]!,
                  ),
                  _buildShareOption(
                    Icons.camera_alt,
                    'انستقرام',
                    color: Colors.pink,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildShareOption(IconData icon, String label, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: color?.withValues(alpha: 0.2) ?? Colors.white10,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color ?? Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  void _showOptionsSheet() {
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
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            _buildOptionItem(Icons.bookmark_border, 'حفظ الفيديو'),
            _buildOptionItem(Icons.download, 'تحميل'),
            _buildOptionItem(Icons.report_outlined, 'إبلاغ'),
            _buildOptionItem(Icons.block, 'حظر المستخدم'),
            _buildOptionItem(Icons.visibility_off, 'غير مهتم'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionItem(IconData icon, String label) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      onTap: () => Navigator.pop(context),
    );
  }
}
