import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

/// Model for live stream data
class LiveStreamItem {
  final String streamId;
  final String userName;
  final String userAvatar;
  final String title;
  final int viewersCount;

  const LiveStreamItem({
    required this.streamId,
    required this.userName,
    required this.userAvatar,
    this.title = '',
    this.viewersCount = 0,
  });
}

/// شاشة البث المباشر القابلة للتمرير - Swipeable Live Stream Screen
class SwipeableLiveStreamScreen extends StatefulWidget {
  final List<LiveStreamItem> streams;
  final int initialIndex;

  const SwipeableLiveStreamScreen({
    super.key,
    required this.streams,
    this.initialIndex = 0,
  });

  @override
  State<SwipeableLiveStreamScreen> createState() =>
      _SwipeableLiveStreamScreenState();
}

class _SwipeableLiveStreamScreenState extends State<SwipeableLiveStreamScreen> {
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: widget.initialIndex);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    _pageController.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: widget.streams.length,
        itemBuilder: (context, index) {
          final stream = widget.streams[index];
          return LiveStreamPage(
            streamId: stream.streamId,
            userName: stream.userName,
            userAvatar: stream.userAvatar,
            title: stream.title,
            viewersCount: stream.viewersCount,
          );
        },
      ),
    );
  }
}

/// شاشة البث المباشر - Live Stream Screen
class LiveStreamScreen extends ConsumerStatefulWidget {
  final String streamId;
  final String userName;
  final String userAvatar;
  final String title;
  final int viewersCount;

  const LiveStreamScreen({
    super.key,
    required this.streamId,
    required this.userName,
    required this.userAvatar,
    this.title = '',
    this.viewersCount = 0,
  });

  @override
  ConsumerState<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends ConsumerState<LiveStreamScreen> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LiveStreamPage(
      streamId: widget.streamId,
      userName: widget.userName,
      userAvatar: widget.userAvatar,
      title: widget.title,
      viewersCount: widget.viewersCount,
    );
  }
}

/// Single live stream page widget for use in PageView
class LiveStreamPage extends ConsumerStatefulWidget {
  final String streamId;
  final String userName;
  final String userAvatar;
  final String title;
  final int viewersCount;

  const LiveStreamPage({
    super.key,
    required this.streamId,
    required this.userName,
    required this.userAvatar,
    this.title = '',
    this.viewersCount = 0,
  });

  @override
  ConsumerState<LiveStreamPage> createState() => _LiveStreamPageState();
}

class _LiveStreamPageState extends ConsumerState<LiveStreamPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();
  late AnimationController _pulseController;

  bool _isFollowing = false;
  bool _showChat = true;
  bool _showProducts = false;
  int _currentViewers = 0;

  // Mock chat messages
  final List<ChatMessage> _chatMessages = [];

  // Mock products
  final List<LiveProduct> _products = [
    LiveProduct(
      id: '1',
      name: 'فستان صيفي أنيق',
      imageUrl: 'https://picsum.photos/100?random=301',
      price: 199,
      originalPrice: 299,
    ),
    LiveProduct(
      id: '2',
      name: 'حقيبة يد فاخرة',
      imageUrl: 'https://picsum.photos/100?random=302',
      price: 450,
      originalPrice: 600,
    ),
    LiveProduct(
      id: '3',
      name: 'ساعة ذكية',
      imageUrl: 'https://picsum.photos/100?random=303',
      price: 899,
      originalPrice: 1200,
    ),
  ];

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _currentViewers = widget.viewersCount;
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    // Simulate incoming messages
    _simulateChat();
    // Simulate viewer count changes
    _simulateViewers();
  }

  void _simulateChat() {
    final messages = [
      ChatMessage(userName: 'أحمد', message: 'مرحباً! 👋', isHost: false),
      ChatMessage(userName: 'سارة', message: 'المنتجات رائعة!', isHost: false),
      ChatMessage(
        userName: widget.userName,
        message: 'أهلاً بالجميع في البث 🎉',
        isHost: true,
      ),
      ChatMessage(userName: 'محمد', message: 'ما سعر الفستان؟', isHost: false),
      ChatMessage(userName: 'نورة', message: '❤️❤️❤️', isHost: false),
    ];

    Future.delayed(const Duration(milliseconds: 500), () {
      for (int i = 0; i < messages.length; i++) {
        Future.delayed(Duration(seconds: i * 2), () {
          if (mounted) {
            setState(() => _chatMessages.add(messages[i]));
            _scrollToBottom();
          }
        });
      }
    });
  }

  void _simulateViewers() {
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() => _currentViewers += 3);
        _simulateViewers();
      }
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_chatScrollController.hasClients) {
        _chatScrollController.animateTo(
          _chatScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _chatController.dispose();
    _chatScrollController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_chatController.text.trim().isNotEmpty) {
      setState(() {
        _chatMessages.add(
          ChatMessage(
            userName: 'أنا',
            message: _chatController.text.trim(),
            isHost: false,
            isMe: true,
          ),
        );
      });
      _chatController.clear();
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // إلغاء التركيز من حقل النص عند الضغط في أي مكان
        FocusScope.of(context).unfocus();
      },
      onHorizontalDragEnd: (details) {
        // Swipe right to show host profile
        if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
          _showHostProfile();
        }
        // Swipe left to go back
        if (details.primaryVelocity != null &&
            details.primaryVelocity! < -200) {
          Navigator.pop(context);
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            // Live Video Background (Placeholder)
            _buildLiveVideo(),

            // Gradient Overlay
            _buildGradientOverlay(),

            // Top Bar
            _buildTopBar(),

            // Live Badge & Viewers
            _buildLiveBadge(),

            // Vertical Products at Bottom (only when showing products)
            if (_showProducts) _buildVerticalProducts(),

            // Chat Messages (only when showing chat)
            if (_showChat) _buildChatMessages(),

            // Bottom Input & Actions
            _buildBottomBar(),

            // Floating Hearts Animation
            _buildFloatingHearts(),
          ],
        ),
      ),
    );
  }

  Widget _buildVerticalProducts() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 70,
      child: SizedBox(
        height: 120,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: _products.length,
          itemBuilder: (context, index) {
            final product = _products[index];
            return Container(
              width: 200,
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E1E1E),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      product.imageUrl,
                      width: 70,
                      height: 90,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 70,
                        height: 90,
                        color: Colors.grey[800],
                        child: const Icon(
                          Icons.image,
                          color: Colors.white54,
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${product.price} ر.س',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          height: 28,
                          child: ElevatedButton(
                            onPressed: () {
                              // إضافة للسلة محلياً (بدون API)
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'تمت إضافة ${product.name} للسلة ✅',
                                  ),
                                  backgroundColor: AppColors.primary,
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: EdgeInsets.zero,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            child: const Text(
                              'أضف للسلة',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
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
      ),
    );
  }

  Widget _buildLiveVideo() {
    // Placeholder for live video stream
    return Container(
      decoration: BoxDecoration(
        image: DecorationImage(
          image: NetworkImage(widget.userAvatar),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(color: Colors.black.withValues(alpha: 0.3)),
    );
  }

  Widget _buildGradientOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.5),
            Colors.transparent,
            Colors.transparent,
            Colors.black.withValues(alpha: 0.7),
          ],
          stops: const [0.0, 0.15, 0.6, 1.0],
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
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              // Host Info
              Expanded(
                child: GestureDetector(
                  onTap: () => _showHostProfile(),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.4),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.primary,
                              width: 2,
                            ),
                          ),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundImage: NetworkImage(widget.userAvatar),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                widget.userName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (widget.title.isNotEmpty)
                                Text(
                                  widget.title,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () =>
                              setState(() => _isFollowing = !_isFollowing),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _isFollowing
                                  ? Colors.white24
                                  : AppColors.primary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              _isFollowing ? 'متابَع' : 'متابعة',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Close Button
              GestureDetector(
                onTap: () => _showExitDialog(),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 24),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLiveBadge() {
    return Positioned(
      top: 100,
      left: 12,
      child: Row(
        children: [
          // Live Badge
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(
                    alpha: 0.8 + (_pulseController.value * 0.2),
                  ),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.circle, color: Colors.white, size: 8),
                    SizedBox(width: 4),
                    Text(
                      'مباشر',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 8),
          // Viewers Count
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.visibility, color: Colors.white, size: 14),
                const SizedBox(width: 4),
                Text(
                  _formatCount(_currentViewers),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatMessages() {
    return Positioned(
      left: 12,
      right: 80,
      bottom: 80,
      child: SizedBox(
        height: 250,
        child: ShaderMask(
          shaderCallback: (Rect bounds) {
            return LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.white],
              stops: const [0.0, 0.3],
            ).createShader(bounds);
          },
          blendMode: BlendMode.dstIn,
          child: ListView.builder(
            controller: _chatScrollController,
            padding: const EdgeInsets.only(bottom: 8),
            itemCount: _chatMessages.length,
            itemBuilder: (context, index) =>
                _buildChatBubble(_chatMessages[index]),
          ),
        ),
      ),
    );
  }

  Widget _buildChatBubble(ChatMessage message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: message.isHost
              ? AppColors.primary.withValues(alpha: 0.3)
              : Colors.black.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: message.isHost
              ? Border.all(color: AppColors.primary, width: 1)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${message.userName}: ',
              style: TextStyle(
                color: message.isHost ? AppColors.primary : Colors.amber,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            Flexible(
              child: Text(
                message.message,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
              colors: [Colors.black.withValues(alpha: 0.9), Colors.transparent],
            ),
          ),
          child: Row(
            children: [
              // Chat Input
              Expanded(
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(23),
                  ),
                  child: TextField(
                    controller: _chatController,
                    style: const TextStyle(
                      color: Colors.black87,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    cursorColor: AppColors.primary,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      hintStyle: const TextStyle(
                        color: Colors.grey,
                        fontSize: 13,
                      ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      suffixIcon: IconButton(
                        icon: const Icon(
                          Icons.send,
                          color: AppColors.primary,
                          size: 22,
                        ),
                        onPressed: _sendMessage,
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Share Button
              _buildBottomActionButton(
                icon: Icons.share,
                onTap: () => _showShareSheet(),
              ),
              const SizedBox(width: 6),
              // Chat Toggle Button
              _buildBottomActionButton(
                icon: Icons.chat_bubble,
                isActive: _showChat,
                onTap: () {
                  setState(() {
                    _showChat = !_showChat;
                  });
                },
              ),
              const SizedBox(width: 6),
              // Products Toggle Button
              _buildBottomActionButton(
                icon: Icons.shopping_bag,
                isActive: _showProducts,
                onTap: () {
                  setState(() {
                    _showProducts = !_showProducts;
                  });
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomActionButton({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: isActive
              ? AppColors.primary
              : Colors.white.withValues(alpha: 0.2),
          shape: BoxShape.circle,
          border: isActive ? null : Border.all(color: Colors.white38),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildFloatingHearts() {
    // Placeholder for floating hearts animation
    return const SizedBox.shrink();
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}k';
    }
    return count.toString();
  }

  void _showHostProfile() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: NetworkImage(widget.userAvatar),
              ),
              const SizedBox(height: 12),
              Text(
                widget.userName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildStatItem('متابعين', '125k'),
                  _buildStatItem('متابَعين', '89'),
                  _buildStatItem('إعجابات', '2.5M'),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() => _isFollowing = !_isFollowing);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _isFollowing
                            ? Colors.white24
                            : AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        _isFollowing ? 'إلغاء المتابعة' : 'متابعة',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        context.push('/store/store_${widget.streamId}');
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'زيارة المتجر',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
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

  void _showExitDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'مغادرة البث؟',
          style: TextStyle(color: Colors.white),
          textAlign: TextAlign.center,
        ),
        content: const Text(
          'هل تريد مغادرة هذا البث المباشر؟',
          style: TextStyle(color: Colors.white70),
          textAlign: TextAlign.center,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'البقاء',
              style: TextStyle(color: AppColors.primary),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('مغادرة', style: TextStyle(color: Colors.red)),
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
                'شارك البث المباشر',
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
}

// Models
class ChatMessage {
  final String userName;
  final String message;
  final bool isHost;
  final bool isMe;

  ChatMessage({
    required this.userName,
    required this.message,
    this.isHost = false,
    this.isMe = false,
  });
}

class LiveProduct {
  final String id;
  final String name;
  final String imageUrl;
  final double price;
  final double originalPrice;

  LiveProduct({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.price,
    required this.originalPrice,
  });
}
