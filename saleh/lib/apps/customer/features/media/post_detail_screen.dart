import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// شاشة تفاصيل المنشور - Post Detail Screen
class PostDetailScreen extends ConsumerStatefulWidget {
  final String postId;
  final String userName;
  final String userAvatar;
  final String content;
  final String? imageUrl;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final String timeAgo;
  final bool isVerified;
  final bool isLiked;
  final bool isBookmarked;

  const PostDetailScreen({
    super.key,
    required this.postId,
    required this.userName,
    required this.userAvatar,
    required this.content,
    this.imageUrl,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.timeAgo = '',
    this.isVerified = false,
    this.isLiked = false,
    this.isBookmarked = false,
  });

  @override
  ConsumerState<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends ConsumerState<PostDetailScreen> {
  final TextEditingController _replyController = TextEditingController();
  final FocusNode _replyFocusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();

  static const Color _primaryColor = Color(0xFF00BFA5);

  bool _isLiked = false;
  bool _isBookmarked = false;
  int _likesCount = 0;
  String? _replyingTo;

  // Mock replies
  final List<PostReply> _replies = [
    PostReply(
      id: '1',
      userName: 'أحمد محمد',
      userAvatar: 'https://i.pravatar.cc/150?img=1',
      content: 'منشور رائع! شكراً على المشاركة 👏',
      likesCount: 45,
      timeAgo: 'منذ ساعة',
      isVerified: true,
      replies: [
        PostReply(
          id: '1-1',
          userName: 'سارة أحمد',
          userAvatar: 'https://i.pravatar.cc/150?img=5',
          content: 'أوافقك الرأي!',
          likesCount: 12,
          timeAgo: 'منذ ٣٠ دقيقة',
        ),
      ],
    ),
    PostReply(
      id: '2',
      userName: 'محمد علي',
      userAvatar: 'https://i.pravatar.cc/150?img=3',
      content: 'كيف أقدر أطلب المنتج؟ 🤔',
      likesCount: 23,
      timeAgo: 'منذ ٣ ساعات',
    ),
    PostReply(
      id: '3',
      userName: 'نورة الخالد',
      userAvatar: 'https://i.pravatar.cc/150?img=9',
      content: 'المنتج جودته ممتازة، أنصح فيه بقوة! ⭐⭐⭐⭐⭐',
      likesCount: 89,
      timeAgo: 'منذ ٥ ساعات',
      isVerified: true,
    ),
    PostReply(
      id: '4',
      userName: 'خالد العمري',
      userAvatar: 'https://i.pravatar.cc/150?img=7',
      content: 'تم الطلب، شكراً على التوصية 🙏',
      likesCount: 15,
      timeAgo: 'منذ يوم',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _isLiked = widget.isLiked;
    _isBookmarked = widget.isBookmarked;
    _likesCount = widget.likesCount;
  }

  @override
  void dispose() {
    _replyController.dispose();
    _replyFocusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0A0F0E) : Colors.grey[50],
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0A0F0E) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back_ios,
            color: isDark ? Colors.white : Colors.black,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'المنشور',
          style: TextStyle(
            color: isDark ? Colors.white : Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(
              Icons.more_vert,
              color: isDark ? Colors.white : Colors.black,
            ),
            onPressed: () => _showOptionsSheet(context, isDark),
          ),
        ],
      ),
      body: Column(
        children: [
          // Post and replies
          Expanded(
            child: SingleChildScrollView(
              controller: _scrollController,
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  // Original Post
                  _buildOriginalPost(isDark),

                  // Divider
                  Container(
                    height: 8,
                    color: isDark ? const Color(0xFF131B1A) : Colors.grey[100],
                  ),

                  // Replies header
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Text(
                          'الردود',
                          style: TextStyle(
                            color: isDark ? Colors.white : Colors.black,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${_replies.length}',
                            style: const TextStyle(
                              color: _primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Replies List
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _replies.length,
                    itemBuilder: (context, index) =>
                        _buildReplyItem(_replies[index], isDark),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Reply Input
          _buildReplyInput(isDark),
        ],
      ),
    );
  }

  Widget _buildOriginalPost(bool isDark) {
    return Container(
      color: isDark ? const Color(0xFF0A0F0E) : Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User info row
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  // Navigate to profile
                },
                child: CircleAvatar(
                  radius: 24,
                  backgroundImage: NetworkImage(widget.userAvatar),
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
                          widget.userName,
                          style: TextStyle(
                            color: isDark ? Colors.white : Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        if (widget.isVerified) ...[
                          const SizedBox(width: 4),
                          const Icon(
                            Icons.verified,
                            color: _primaryColor,
                            size: 16,
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.timeAgo,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ),
              // Follow button
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: _primaryColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'متابعة',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Content
          Text(
            widget.content,
            style: TextStyle(
              color: isDark ? Colors.white : Colors.black87,
              fontSize: 16,
              height: 1.5,
            ),
          ),

          // Image if exists
          if (widget.imageUrl != null) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                widget.imageUrl!,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: Colors.grey[300],
                  child: const Icon(Icons.image, size: 48, color: Colors.grey),
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Stats row
          Row(
            children: [
              Text(
                '$_likesCount إعجاب',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(width: 16),
              Text(
                '${widget.commentsCount} رد',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
              const SizedBox(width: 16),
              Text(
                '${widget.sharesCount} مشاركة',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Divider
          Divider(color: isDark ? Colors.white10 : Colors.grey[200]),

          // Actions row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildActionButton(
                icon: _isLiked ? Icons.favorite : Icons.favorite_border,
                label: 'إعجاب',
                isActive: _isLiked,
                activeColor: Colors.red,
                isDark: isDark,
                onTap: () {
                  setState(() {
                    _isLiked = !_isLiked;
                    _likesCount += _isLiked ? 1 : -1;
                  });
                },
              ),
              _buildActionButton(
                icon: Icons.chat_bubble_outline,
                label: 'رد',
                isDark: isDark,
                onTap: () {
                  _replyFocusNode.requestFocus();
                },
              ),
              _buildActionButton(
                icon: Icons.repeat,
                label: 'إعادة نشر',
                isDark: isDark,
                onTap: () {},
              ),
              _buildActionButton(
                icon: _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                label: 'حفظ',
                isActive: _isBookmarked,
                activeColor: _primaryColor,
                isDark: isDark,
                onTap: () {
                  setState(() => _isBookmarked = !_isBookmarked);
                },
              ),
              _buildActionButton(
                icon: Icons.share_outlined,
                label: 'مشاركة',
                isDark: isDark,
                onTap: () => _showShareSheet(context, isDark),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required bool isDark,
    bool isActive = false,
    Color? activeColor,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isActive
                  ? activeColor
                  : (isDark ? Colors.white70 : Colors.grey[600]),
              size: 22,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: isActive
                    ? activeColor
                    : (isDark ? Colors.white70 : Colors.grey[600]),
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReplyItem(PostReply reply, bool isDark, {int depth = 0}) {
    return Container(
      margin: EdgeInsets.only(left: depth * 40.0, right: 16, bottom: 8),
      padding: EdgeInsets.only(left: depth > 0 ? 0 : 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Reply content
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131B1A) : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: depth > 0
                  ? Border(
                      right: BorderSide(
                        color: _primaryColor.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    )
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundImage: NetworkImage(reply.userAvatar),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                reply.userName,
                                style: TextStyle(
                                  color: isDark ? Colors.white : Colors.black,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              if (reply.isVerified) ...[
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.verified,
                                  color: _primaryColor,
                                  size: 14,
                                ),
                              ],
                            ],
                          ),
                          Text(
                            reply.timeAgo,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.more_horiz,
                        color: Colors.grey[600],
                        size: 18,
                      ),
                      onPressed: () {},
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Reply text
                Text(
                  reply.content,
                  style: TextStyle(
                    color: isDark ? Colors.white70 : Colors.black87,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),

                const SizedBox(height: 12),

                // Actions
                Row(
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          reply.isLiked = !reply.isLiked;
                        });
                      },
                      child: Row(
                        children: [
                          Icon(
                            reply.isLiked
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: reply.isLiked
                                ? Colors.red
                                : Colors.grey[600],
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${reply.likesCount}',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 24),
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _replyingTo = reply.userName;
                        });
                        _replyFocusNode.requestFocus();
                      },
                      child: Row(
                        children: [
                          Icon(Icons.reply, color: Colors.grey[600], size: 18),
                          const SizedBox(width: 4),
                          Text(
                            'رد',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Nested replies
          if (reply.replies.isNotEmpty)
            ...reply.replies.map(
              (nestedReply) => Padding(
                padding: const EdgeInsets.only(top: 8),
                child: _buildReplyItem(nestedReply, isDark, depth: depth + 1),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildReplyInput(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        MediaQuery.of(context).padding.bottom + 12,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131B1A) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Replying to indicator
          if (_replyingTo != null)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _primaryColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Text(
                    'الرد على @$_replyingTo',
                    style: const TextStyle(color: _primaryColor, fontSize: 12),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() => _replyingTo = null),
                    child: const Icon(
                      Icons.close,
                      color: _primaryColor,
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),

          // Input row
          Row(
            children: [
              const CircleAvatar(
                radius: 18,
                backgroundImage: NetworkImage(
                  'https://i.pravatar.cc/150?img=10',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _replyController,
                  focusNode: _replyFocusNode,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    hintText: _replyingTo != null
                        ? 'اكتب ردك على @$_replyingTo...'
                        : 'اكتب ردك...',
                    hintStyle: TextStyle(color: Colors.grey[600]),
                    filled: true,
                    fillColor: isDark
                        ? Colors.white.withValues(alpha: 0.05)
                        : Colors.grey[100],
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                  maxLines: null,
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _sendReply,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: const BoxDecoration(
                    color: _primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.send, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _sendReply() {
    if (_replyController.text.trim().isEmpty) return;

    setState(() {
      _replies.insert(
        0,
        PostReply(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          userName: 'أنا',
          userAvatar: 'https://i.pravatar.cc/150?img=10',
          content: _replyController.text.trim(),
          likesCount: 0,
          timeAgo: 'الآن',
        ),
      );
      _replyController.clear();
      _replyingTo = null;
    });

    // Scroll to top to show new reply
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  void _showOptionsSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            _buildOptionItem(
              icon: Icons.person_add_outlined,
              label: 'متابعة ${widget.userName}',
              isDark: isDark,
              onTap: () => Navigator.pop(context),
            ),
            _buildOptionItem(
              icon: Icons.block_outlined,
              label: 'حظر ${widget.userName}',
              isDark: isDark,
              isDestructive: true,
              onTap: () => Navigator.pop(context),
            ),
            _buildOptionItem(
              icon: Icons.flag_outlined,
              label: 'الإبلاغ عن المنشور',
              isDark: isDark,
              isDestructive: true,
              onTap: () => Navigator.pop(context),
            ),
            _buildOptionItem(
              icon: Icons.link_outlined,
              label: 'نسخ الرابط',
              isDark: isDark,
              onTap: () => Navigator.pop(context),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
          ],
        ),
      ),
    );
  }

  void _showShareSheet(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[400],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'مشاركة',
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareOption(Icons.link, 'نسخ الرابط', isDark),
                _buildShareOption(Icons.chat, 'واتساب', isDark),
                _buildShareOption(Icons.telegram, 'تيليجرام', isDark),
                _buildShareOption(Icons.more_horiz, 'المزيد', isDark),
              ],
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionItem({
    required IconData icon,
    required String label,
    required bool isDark,
    bool isDestructive = false,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isDestructive
            ? Colors.red
            : (isDark ? Colors.white70 : Colors.black54),
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isDestructive
              ? Colors.red
              : (isDark ? Colors.white : Colors.black),
        ),
      ),
      onTap: onTap,
    );
  }

  Widget _buildShareOption(IconData icon, String label, bool isDark) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: isDark ? Colors.grey[800] : Colors.grey[100],
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: isDark ? Colors.white : Colors.black54,
            size: 24,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            color: isDark ? Colors.white70 : Colors.black54,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}

// Models
class PostReply {
  final String id;
  final String userName;
  final String userAvatar;
  final String content;
  int likesCount;
  final String timeAgo;
  final bool isVerified;
  bool isLiked;
  final List<PostReply> replies;

  PostReply({
    required this.id,
    required this.userName,
    required this.userAvatar,
    required this.content,
    required this.likesCount,
    required this.timeAgo,
    this.isVerified = false,
    this.isLiked = false,
    this.replies = const [],
  });
}
