import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class _LiveStreamScreenState extends ConsumerState<LiveStreamScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _chatScrollController = ScrollController();
  late AnimationController _pulseController;

  bool _isFollowing = false;
  bool _showChat = true;
  bool _showProducts = false;
  int _currentViewers = 0;
  int _likesCount = 0;

  static const Color _primaryColor = Color(0xFF00BFA5);

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

  void _sendLike() {
    setState(() => _likesCount++);
    // Show floating heart animation
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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

          // Right Side Actions
          _buildRightActions(),

          // Products Panel
          if (_showProducts) _buildProductsPanel(),

          // Chat Messages
          if (_showChat) _buildChatMessages(),

          // Bottom Input & Actions
          _buildBottomBar(),

          // Floating Hearts Animation
          _buildFloatingHearts(),
        ],
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
                            border: Border.all(color: _primaryColor, width: 2),
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
                                  : _primaryColor,
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

  Widget _buildRightActions() {
    return Positioned(
      right: 12,
      bottom: 150,
      child: Column(
        children: [
          // Products
          _buildActionButton(
            icon: Icons.shopping_bag,
            label: '${_products.length}',
            onTap: () => setState(() => _showProducts = !_showProducts),
            isActive: _showProducts,
          ),
          const SizedBox(height: 16),
          // Chat Toggle
          _buildActionButton(
            icon: _showChat ? Icons.chat_bubble : Icons.chat_bubble_outline,
            label: 'دردشة',
            onTap: () => setState(() => _showChat = !_showChat),
            isActive: _showChat,
          ),
          const SizedBox(height: 16),
          // Share
          _buildActionButton(
            icon: Icons.share,
            label: 'مشاركة',
            onTap: () => _showShareSheet(),
          ),
          const SizedBox(height: 16),
          // Gift
          _buildActionButton(
            icon: Icons.card_giftcard,
            label: 'هدية',
            onTap: () => _showGiftSheet(),
            color: Colors.amber,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
    Color? color,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isActive
                  ? _primaryColor.withValues(alpha: 0.3)
                  : Colors.black.withValues(alpha: 0.4),
              shape: BoxShape.circle,
              border: isActive
                  ? Border.all(color: _primaryColor, width: 2)
                  : null,
            ),
            child: Icon(
              icon,
              color: color ?? (isActive ? _primaryColor : Colors.white),
              size: 24,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsPanel() {
    return Positioned(
      left: 16,
      right: 80,
      bottom: 100,
      child: Container(
        constraints: const BoxConstraints(maxHeight: 280),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'المنتجات',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _showProducts = false),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close,
                      color: Colors.white70,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                physics: const BouncingScrollPhysics(),
                itemCount: _products.length,
                itemBuilder: (context, index) =>
                    _buildProductItem(_products[index]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductItem(LiveProduct product) {
    return GestureDetector(
      onTap: () {
        // Navigate to product
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                product.imageUrl,
                width: 55,
                height: 55,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  width: 55,
                  height: 55,
                  color: Colors.grey[800],
                  child: const Icon(Icons.image, color: Colors.white54),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '${product.price} ر.س',
                        style: const TextStyle(
                          color: _primaryColor,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${product.originalPrice}',
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 11,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: _primaryColor,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'شراء',
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
              ? _primaryColor.withValues(alpha: 0.3)
              : Colors.black.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: message.isHost
              ? Border.all(color: _primaryColor, width: 1)
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${message.userName}: ',
              style: TextStyle(
                color: message.isHost ? _primaryColor : Colors.amber,
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
          child: Row(
            children: [
              // Chat Input
              Expanded(
                child: Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: Colors.white24),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _chatController,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          decoration: const InputDecoration(
                            hintText: 'قل شيئاً...',
                            hintStyle: TextStyle(color: Colors.white54),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          Icons.send,
                          color: _primaryColor,
                          size: 22,
                        ),
                        onPressed: _sendMessage,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Like Button
              GestureDetector(
                onTap: _sendLike,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Colors.pink, Colors.red],
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.favorite,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
              ),
            ],
          ),
        ),
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
                            : _primaryColor,
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
                      onPressed: () {},
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
            child: const Text('البقاء', style: TextStyle(color: _primaryColor)),
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

  void _showGiftSheet() {
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
                'إرسال هدية',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildGiftItem('🌹', 'وردة', 10),
                  _buildGiftItem('💎', 'ماسة', 50),
                  _buildGiftItem('🎁', 'هدية', 100),
                  _buildGiftItem('👑', 'تاج', 500),
                  _buildGiftItem('🚀', 'صاروخ', 1000),
                ],
              ),
            ),
            // Balance
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.account_balance_wallet,
                    color: Colors.amber,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'رصيدك: ',
                    style: TextStyle(color: Colors.white70),
                  ),
                  const Text(
                    '250 عملة',
                    style: TextStyle(
                      color: Colors.amber,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 16),
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'شحن',
                      style: TextStyle(color: _primaryColor),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGiftItem(String emoji, String name, int price) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: GestureDetector(
        onTap: () {
          Navigator.pop(context);
          // Send gift animation
        },
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white24),
              ),
              child: Center(
                child: Text(emoji, style: const TextStyle(fontSize: 32)),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              name,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.monetization_on,
                  color: Colors.amber,
                  size: 14,
                ),
                const SizedBox(width: 2),
                Text(
                  '$price',
                  style: const TextStyle(color: Colors.amber, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
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
