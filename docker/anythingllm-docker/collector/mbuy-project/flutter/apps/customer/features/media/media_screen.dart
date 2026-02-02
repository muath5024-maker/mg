import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import 'live_stream_screen.dart';
import 'video_feed_screen.dart';
import 'post_detail_screen.dart';

/// صفحة الميديا - تصميم Pinterest/SHEIN Style
class MediaScreen extends ConsumerStatefulWidget {
  const MediaScreen({super.key});

  @override
  ConsumerState<MediaScreen> createState() => _MediaScreenState();
}

class _MediaScreenState extends ConsumerState<MediaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late ScrollController _scrollController;

  final List<String> _tabs = ['لك', 'فيديوهات', 'منشورات', 'المتجر'];

  // Mock Live Users Data
  final List<LiveUser> _liveUsers = [
    LiveUser(
      id: '1',
      name: 'MakeupTips',
      imageUrl: 'https://picsum.photos/100?random=80',
      isLive: true,
    ),
    LiveUser(
      id: '2',
      name: 'SummerVibes',
      imageUrl: 'https://picsum.photos/100?random=81',
      isLive: true,
    ),
    LiveUser(
      id: '3',
      name: 'SneakerHead',
      imageUrl: 'https://picsum.photos/100?random=82',
      isLive: false,
    ),
    LiveUser(
      id: '4',
      name: 'HomeDecor',
      imageUrl: 'https://picsum.photos/100?random=83',
      isLive: false,
    ),
    LiveUser(
      id: '5',
      name: 'TechReview',
      imageUrl: 'https://picsum.photos/100?random=84',
      isLive: false,
    ),
    LiveUser(
      id: '6',
      name: 'FashionQueen',
      imageUrl: 'https://picsum.photos/100?random=85',
      isLive: false,
    ),
  ];

  // Mock Posts Data (Pinterest Style)
  final List<MediaPost> _posts = [
    MediaPost(
      id: '1',
      imageUrl: 'https://picsum.photos/400/600?random=90',
      title: 'تنسيقات الصيف الجديدة ☀️👗',
      userName: 'Sarah.J',
      userAvatar: 'https://picsum.photos/50?random=91',
      likesCount: 1200,
      isVideo: true,
      hasShopButton: false,
    ),
    MediaPost(
      id: '2',
      imageUrl: 'https://picsum.photos/400/400?random=92',
      title: 'أحذية رياضية مريحة للمشي 👟',
      userName: 'KicksDaily',
      userAvatar: 'https://picsum.photos/50?random=93',
      likesCount: 856,
      isVideo: false,
      hasShopButton: false,
    ),
    MediaPost(
      id: '3',
      imageUrl: 'https://picsum.photos/400/550?random=94',
      title: 'أناقة الشتاء 🧥✨',
      userName: 'StyleIcon',
      userAvatar: 'https://picsum.photos/50?random=95',
      likesCount: 3400,
      isVideo: false,
      hasShopButton: true,
    ),
    MediaPost(
      id: '4',
      imageUrl: 'https://picsum.photos/400/500?random=96',
      title: 'روتين العناية بالبشرة المفضل لدي 🧖‍♀️',
      userName: 'GlowUp',
      userAvatar: 'https://picsum.photos/50?random=97',
      likesCount: 245,
      isVideo: false,
      hasShopButton: false,
    ),
    MediaPost(
      id: '5',
      imageUrl: 'https://picsum.photos/400/450?random=98',
      title: 'تجديد ديكور المنزل بأقل التكاليف 🏡',
      userName: 'DecorDad',
      userAvatar: 'https://picsum.photos/50?random=99',
      likesCount: 99,
      isVideo: false,
      hasShopButton: false,
    ),
    MediaPost(
      id: '6',
      imageUrl: 'https://picsum.photos/400/700?random=100',
      title: 'أفضل منتجات العناية بالشعر 💇‍♀️',
      userName: 'HairCare',
      userAvatar: 'https://picsum.photos/50?random=101',
      likesCount: 1500,
      isVideo: true,
      hasShopButton: true,
    ),
    MediaPost(
      id: '7',
      imageUrl: 'https://picsum.photos/400/380?random=102',
      title: 'مجموعة ساعات فاخرة ⌚',
      userName: 'WatchLover',
      userAvatar: 'https://picsum.photos/50?random=103',
      likesCount: 678,
      isVideo: false,
      hasShopButton: false,
    ),
    MediaPost(
      id: '8',
      imageUrl: 'https://picsum.photos/400/520?random=104',
      title: 'أحدث موديلات الحقائب 👜',
      userName: 'BagStyle',
      userAvatar: 'https://picsum.photos/50?random=105',
      likesCount: 2100,
      isVideo: false,
      hasShopButton: true,
    ),
  ];

  // Mock Video Data (TikTok/Reels Style)
  final List<VideoPost> _videos = [
    VideoPost(
      id: '1',
      thumbnailUrl: 'https://picsum.photos/400/700?random=110',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'أفضل طريقة لتنسيق الملابس',
      userName: 'FashionGuru',
      userAvatar: 'https://picsum.photos/50?random=111',
      viewsCount: 125000,
      likesCount: 8500,
      duration: '0:45',
    ),
    VideoPost(
      id: '2',
      thumbnailUrl: 'https://picsum.photos/400/700?random=112',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'مراجعة أحدث الهواتف 📱',
      userName: 'TechMaster',
      userAvatar: 'https://picsum.photos/50?random=113',
      viewsCount: 89000,
      likesCount: 5200,
      duration: '1:20',
    ),
    VideoPost(
      id: '3',
      thumbnailUrl: 'https://picsum.photos/400/700?random=114',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'روتين الصباح الكامل ☀️',
      userName: 'DailyRoutine',
      userAvatar: 'https://picsum.photos/50?random=115',
      viewsCount: 234000,
      likesCount: 15000,
      duration: '2:10',
    ),
    VideoPost(
      id: '4',
      thumbnailUrl: 'https://picsum.photos/400/700?random=116',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'وصفة كيكة الشوكولاتة 🍫',
      userName: 'ChefAhmad',
      userAvatar: 'https://picsum.photos/50?random=117',
      viewsCount: 567000,
      likesCount: 42000,
      duration: '3:05',
    ),
    VideoPost(
      id: '5',
      thumbnailUrl: 'https://picsum.photos/400/700?random=118',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'تمارين منزلية سهلة 💪',
      userName: 'FitLife',
      userAvatar: 'https://picsum.photos/50?random=119',
      viewsCount: 345000,
      likesCount: 28000,
      duration: '4:30',
    ),
    VideoPost(
      id: '6',
      thumbnailUrl: 'https://picsum.photos/400/700?random=120',
      videoUrl:
          'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
      title: 'جولة في المتجر الجديد 🛍️',
      userName: 'ShopTour',
      userAvatar: 'https://picsum.photos/50?random=121',
      viewsCount: 78000,
      likesCount: 3500,
      duration: '1:55',
    ),
  ];

  // Mock Twitter-Style Posts
  final List<TweetPost> _tweets = [
    TweetPost(
      id: '1',
      userName: 'أحمد التقني',
      userHandle: '@tech_ahmad',
      userAvatar: 'https://picsum.photos/50?random=130',
      content:
          'وصلني المنتج اليوم وجودته ممتازة جداً! شكراً @MBUY على السرعة في التوصيل 📦✨',
      imageUrl: 'https://picsum.photos/600/400?random=131',
      timestamp: 'منذ ساعتين',
      likesCount: 234,
      commentsCount: 45,
      retweetsCount: 12,
      isVerified: true,
    ),
    TweetPost(
      id: '2',
      userName: 'سارة الموضة',
      userHandle: '@sarah_fashion',
      userAvatar: 'https://picsum.photos/50?random=132',
      content:
          'تشكيلة الصيف الجديدة وصلت! 👗 كل القطع روعة والأسعار مناسبة جداً',
      imageUrl: null,
      timestamp: 'منذ 4 ساعات',
      likesCount: 567,
      commentsCount: 89,
      retweetsCount: 34,
      isVerified: false,
    ),
    TweetPost(
      id: '3',
      userName: 'متجر الإلكترونيات',
      userHandle: '@electronics_store',
      userAvatar: 'https://picsum.photos/50?random=133',
      content:
          '🔥 عرض خاص! خصم 30% على جميع السماعات اللاسلكية\n\nالعرض ساري حتى نهاية الأسبوع\n\n#تخفيضات #MBUY',
      imageUrl: 'https://picsum.photos/600/400?random=134',
      timestamp: 'منذ 6 ساعات',
      likesCount: 1200,
      commentsCount: 156,
      retweetsCount: 89,
      isVerified: true,
    ),
    TweetPost(
      id: '4',
      userName: 'محمد العمري',
      userHandle: '@mohammed_omari',
      userAvatar: 'https://picsum.photos/50?random=135',
      content:
          'تجربتي مع التسوق من التطبيق كانت سهلة جداً 👍 الدفع آمن والتوصيل سريع',
      imageUrl: null,
      timestamp: 'منذ 8 ساعات',
      likesCount: 89,
      commentsCount: 12,
      retweetsCount: 5,
      isVerified: false,
    ),
    TweetPost(
      id: '5',
      userName: 'بيت الجمال',
      userHandle: '@beauty_house',
      userAvatar: 'https://picsum.photos/50?random=136',
      content:
          'منتجات العناية بالبشرة الأكثر مبيعاً هذا الشهر 💄\n\nكل المنتجات أصلية 100%',
      imageUrl: 'https://picsum.photos/600/400?random=137',
      timestamp: 'منذ 10 ساعات',
      likesCount: 456,
      commentsCount: 67,
      retweetsCount: 23,
      isVerified: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _scrollController = ScrollController();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SafeArea(
      top: false,
      child: Column(
        children: [
          // Tabs
          _buildTabBar(isDark),
          // Content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildForYouTab(isDark),
                _buildVideosTab(isDark),
                _buildPostsTab(isDark),
                _buildStoreTab(isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isDark) {
    return Container(
      color: isDark ? const Color(0xFF131B1A) : Colors.white,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: AppColors.primary,
        unselectedLabelColor: isDark ? Colors.grey[400] : Colors.grey[600],
        labelStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.bold,
        ),
        indicatorColor: AppColors.primary,
        indicatorWeight: 3,
        indicatorSize: TabBarIndicatorSize.label,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
      ),
    );
  }

  Widget _buildForYouTab(bool isDark) {
    // Create mixed feed items
    final mixedFeed = _createMixedFeed();

    return CustomScrollView(
      controller: _scrollController,
      slivers: [
        // Live Now Section
        SliverToBoxAdapter(child: _buildLiveNowSection(isDark)),
        // Mixed Posts & Videos Grid
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          sliver: SliverMasonryGrid.count(
            crossAxisCount: 2,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childCount: mixedFeed.length,
            itemBuilder: (context, index) {
              final item = mixedFeed[index];
              if (item is MediaPost) {
                return _buildMixedPostCard(item, isDark);
              } else if (item is VideoPost) {
                return _buildMixedVideoCard(item, isDark, index);
              }
              return const SizedBox.shrink();
            },
          ),
        ),
        const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
      ],
    );
  }

  List<dynamic> _createMixedFeed() {
    final mixed = <dynamic>[];
    int postIndex = 0;
    int videoIndex = 0;

    // Pattern: 4 videos then 1 post (like Posts tab layout)
    while (postIndex < _posts.length || videoIndex < _videos.length) {
      // Add 4 videos
      for (int i = 0; i < 4 && videoIndex < _videos.length; i++) {
        mixed.add(_videos[videoIndex++]);
      }
      // Add 1 post below the 4 videos
      if (postIndex < _posts.length) {
        mixed.add(_posts[postIndex++]);
      }
    }
    return mixed;
  }

  Widget _buildMixedPostCard(MediaPost post, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isDark ? const Color(0xFF131B1A) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image - قابل للضغط للانتقال للتفاصيل
          GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => PostDetailScreen(
                    postId: post.id,
                    userName: post.userName,
                    userAvatar: post.userAvatar,
                    content: post.title,
                    imageUrl: post.imageUrl,
                    likesCount: post.likesCount,
                    commentsCount: 45,
                    sharesCount: 12,
                    timeAgo: 'منذ ساعتين',
                    isVerified: true,
                  ),
                ),
              );
            },
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  child: Image.network(
                    post.imageUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 150,
                      color: Colors.grey[300],
                      child: const Icon(Icons.image, color: Colors.grey),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  style: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    // Avatar - قابل للضغط لعرض الملف الشخصي
                    SizedBox(
                      width: 36,
                      height: 36,
                      child: IconButton(
                        padding: EdgeInsets.zero,
                        onPressed: () {
                          _showUserProfileSheet(
                            userName: post.userName,
                            userAvatar: post.userAvatar,
                            storeId: 'store_${post.id}',
                          );
                        },
                        icon: CircleAvatar(
                          radius: 14,
                          backgroundImage: NetworkImage(post.userAvatar),
                        ),
                      ),
                    ),
                    // Username - قابل للضغط لعرض الملف الشخصي
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          _showUserProfileSheet(
                            userName: post.userName,
                            userAvatar: post.userAvatar,
                            storeId: 'store_${post.id}',
                          );
                        },
                        child: Text(
                          post.userName,
                          style: TextStyle(
                            color: isDark ? Colors.white70 : Colors.grey[700],
                            fontSize: 11,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    Icon(Icons.favorite, color: Colors.red[300], size: 14),
                    const SizedBox(width: 4),
                    Text(
                      _formatCount(post.likesCount),
                      style: TextStyle(color: Colors.grey[600], fontSize: 11),
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

  Widget _buildMixedVideoCard(VideoPost video, bool isDark, int feedIndex) {
    return GestureDetector(
      onTap: () {
        // Create video feed items for swipeable view
        final videoFeedItems = _videos
            .map(
              (v) => VideoFeedItem(
                id: v.id,
                videoUrl: v.videoUrl,
                thumbnailUrl: v.thumbnailUrl,
                userName: v.userName,
                userAvatar: v.userAvatar,
                title: v.title,
                likesCount: v.likesCount,
                commentsCount: 234,
                hasProduct: true,
                productName: 'منتج مميز',
                productPrice: 199,
              ),
            )
            .toList();

        final videoIndex = _videos.indexWhere((v) => v.id == video.id);

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoFeedScreen(
              videos: videoFeedItems,
              initialIndex: videoIndex >= 0 ? videoIndex : 0,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: isDark ? const Color(0xFF131B1A) : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 9 / 16,
                child: Image.network(
                  video.thumbnailUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: Colors.grey[800],
                    child: const Icon(
                      Icons.video_library,
                      color: Colors.white54,
                      size: 40,
                    ),
                  ),
                ),
              ),
            ),
            // Gradient overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.8),
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),

            // Duration
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  video.duration,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
            // Bottom info
            Positioned(
              left: 10,
              right: 10,
              bottom: 10,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () {
                          _showUserProfileSheet(
                            userName: video.userName,
                            userAvatar: video.userAvatar,
                            storeId: 'store_${video.id}',
                          );
                        },
                        child: CircleAvatar(
                          radius: 12,
                          backgroundImage: NetworkImage(video.userAvatar),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          video.userName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    video.title,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(
                        Icons.favorite,
                        color: Colors.white70,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(video.likesCount),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.visibility,
                        color: Colors.white70,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formatCount(video.viewsCount),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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

  bool _isFollowingProfile = false;

  // Show user profile sheet when clicking on avatar
  void _showUserProfileSheet({
    required String userName,
    required String userAvatar,
    required String storeId,
  }) {
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
                  backgroundImage: NetworkImage(userAvatar),
                ),
                const SizedBox(height: 12),
                Text(
                  userName,
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
                    _buildProfileStatItem('متابعين', '125k'),
                    _buildProfileStatItem('متابَعين', '89'),
                    _buildProfileStatItem('إعجابات', '2.5M'),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          setSheetState(() {
                            _isFollowingProfile = !_isFollowingProfile;
                          });
                          setState(() {});
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isFollowingProfile
                              ? Colors.grey[700]
                              : AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          _isFollowingProfile ? 'إلغاء المتابعة' : 'متابعة',
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
                          context.push('/store/$storeId');
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

  Widget _buildProfileStatItem(String label, String value) {
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

  Widget _buildLiveNowSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.only(top: 12, bottom: 8),
      color: isDark ? const Color(0xFF131B1A) : Colors.white,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () {},
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    'عرض الكل',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Text(
                  'مباشر الآن',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Live Users List
          SizedBox(
            height: 95,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              reverse: true,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: _liveUsers.length,
              itemBuilder: (context, index) =>
                  _buildLiveUserItem(_liveUsers[index], isDark),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveUserItem(LiveUser user, bool isDark) {
    return GestureDetector(
      onTap: () {
        if (user.isLive) {
          // Create swipeable list of all live streams
          final liveStreams = _liveUsers
              .where((u) => u.isLive)
              .map(
                (u) => LiveStreamItem(
                  streamId: u.id,
                  userName: u.name,
                  userAvatar: u.imageUrl,
                  title: 'بث مباشر من ${u.name}',
                  viewersCount: 1234,
                ),
              )
              .toList();

          final currentIndex = liveStreams.indexWhere(
            (s) => s.streamId == user.id,
          );

          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SwipeableLiveStreamScreen(
                streams: liveStreams,
                initialIndex: currentIndex >= 0 ? currentIndex : 0,
              ),
            ),
          );
        }
      },
      child: Container(
        width: 72,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Avatar with gradient border
            Container(
              width: 64,
              height: 64,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: user.isLive
                    ? const LinearGradient(
                        colors: [
                          Color(0xFF67E8F9),
                          AppColors.primary,
                          Color(0xFF0D9488),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: user.isLive
                    ? null
                    : (isDark ? Colors.white10 : Colors.grey[200]),
                border: user.isLive
                    ? null
                    : Border.all(
                        color: isDark ? Colors.white10 : Colors.grey[300]!,
                        width: 1,
                      ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? const Color(0xFF131B1A) : Colors.white,
                    width: 2,
                  ),
                ),
                child: ClipOval(
                  child: Image.network(
                    user.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: Colors.grey[300],
                      child: const Icon(
                        Icons.person,
                        color: Colors.grey,
                        size: 24,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // Live Badge or Name
            if (user.isLive) ...[
              Transform.translate(
                offset: const Offset(0, -8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? const Color(0xFF131B1A) : Colors.white,
                      width: 1.5,
                    ),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ] else ...[
              const SizedBox(height: 4),
            ],
            Text(
              user.name,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.grey[300] : Colors.grey[700],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Videos Tab (TikTok/Reels Style) ====================
  Widget _buildVideosTab(bool isDark) {
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.56,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _videos.length,
      itemBuilder: (context, index) => _buildVideoCard(_videos[index], isDark),
    );
  }

  Widget _buildVideoCard(VideoPost video, bool isDark) {
    return GestureDetector(
      onTap: () {
        // Create video feed items for swipeable view
        final videoFeedItems = _videos
            .map(
              (v) => VideoFeedItem(
                id: v.id,
                videoUrl: v.videoUrl,
                thumbnailUrl: v.thumbnailUrl,
                userName: v.userName,
                userAvatar: v.userAvatar,
                title: v.title,
                likesCount: v.likesCount,
                commentsCount: 234,
                hasProduct: true,
                productName: 'منتج مميز',
                productPrice: 199,
              ),
            )
            .toList();

        final videoIndex = _videos.indexWhere((v) => v.id == video.id);

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoFeedScreen(
              videos: videoFeedItems,
              initialIndex: videoIndex >= 0 ? videoIndex : 0,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: isDark ? const Color(0xFF131B1A) : Colors.white,
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                video.thumbnailUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey[800],
                  child: const Icon(
                    Icons.video_library,
                    color: Colors.white54,
                    size: 40,
                  ),
                ),
              ),
            ),
            // Gradient Overlay
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.8),
                  ],
                  stops: const [0.5, 1.0],
                ),
              ),
            ),
            // Play Button
            Center(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 32,
                ),
              ),
            ),
            // Duration Badge
            Positioned(
              top: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  video.duration,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
            // Views Count
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.play_arrow, color: Colors.white, size: 12),
                    const SizedBox(width: 2),
                    Text(
                      _formatCount(video.viewsCount),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom Info
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      video.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    // User Info
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 10,
                          backgroundImage: NetworkImage(video.userAvatar),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            video.userName,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        // Likes
                        Row(
                          children: [
                            const Icon(
                              Icons.favorite,
                              color: Colors.redAccent,
                              size: 14,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              _formatCount(video.likesCount),
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Posts Tab (Twitter/X Style) ====================
  Widget _buildPostsTab(bool isDark) {
    return ListView.separated(
      padding: const EdgeInsets.only(top: 8),
      itemCount: _tweets.length,
      separatorBuilder: (context, index) =>
          Divider(height: 1, color: isDark ? Colors.white10 : Colors.grey[200]),
      itemBuilder: (context, index) => _buildTweetCard(_tweets[index], isDark),
    );
  }

  Widget _buildTweetCard(TweetPost tweet, bool isDark) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PostDetailScreen(
              postId: tweet.id,
              userName: tweet.userName,
              userAvatar: tweet.userAvatar,
              content: tweet.content,
              imageUrl: tweet.imageUrl,
              likesCount: tweet.likesCount,
              commentsCount: tweet.commentsCount,
              sharesCount: tweet.retweetsCount,
              timeAgo: tweet.timestamp,
              isVerified: tweet.isVerified,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        color: isDark ? const Color(0xFF131B1A) : Colors.white,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            CircleAvatar(
              radius: 22,
              backgroundImage: NetworkImage(tweet.userAvatar),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // User Info Row
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          tweet.userName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isDark ? Colors.white : Colors.black,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (tweet.isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.verified,
                          color: AppColors.primary,
                          size: 16,
                        ),
                      ],
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          tweet.userHandle,
                          style: TextStyle(
                            color: isDark ? Colors.grey[500] : Colors.grey[600],
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        ' · ${tweet.timestamp}',
                        style: TextStyle(
                          color: isDark ? Colors.grey[500] : Colors.grey[600],
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Content Text
                  Text(
                    tweet.content,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? Colors.white : Colors.black87,
                      height: 1.4,
                    ),
                  ),
                  // Image (if exists)
                  if (tweet.imageUrl != null) ...[
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        tweet.imageUrl!,
                        width: double.infinity,
                        height: 180,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 180,
                          color: Colors.grey[300],
                          child: const Icon(Icons.image, color: Colors.grey),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  // Actions Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Comments
                      _buildTweetAction(
                        icon: Icons.chat_bubble_outline,
                        count: tweet.commentsCount,
                        isDark: isDark,
                      ),
                      // Retweets
                      _buildTweetAction(
                        icon: Icons.repeat,
                        count: tweet.retweetsCount,
                        isDark: isDark,
                        color: Colors.green,
                      ),
                      // Likes
                      _buildTweetAction(
                        icon: Icons.favorite_border,
                        count: tweet.likesCount,
                        isDark: isDark,
                        color: Colors.redAccent,
                      ),
                      // Share
                      _buildTweetAction(
                        icon: Icons.share_outlined,
                        isDark: isDark,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTweetAction({
    required IconData icon,
    int? count,
    required bool isDark,
    Color? color,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: color ?? (isDark ? Colors.grey[500] : Colors.grey[600]),
        ),
        if (count != null) ...[
          const SizedBox(width: 4),
          Text(
            _formatCount(count),
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.grey[500] : Colors.grey[600],
            ),
          ),
        ],
      ],
    );
  }

  // ==================== Store Tab ====================
  Widget _buildStoreTab(bool isDark) {
    // Reusing the mixed feed logic but focused on "Store" items (products)
    // For now, filtering to posts that represent products (hasShopButton is true)
    final storeItems = _posts.where((p) => p.hasShopButton).toList();

    if (storeItems.isEmpty) {
      return _buildEmptyState(
        isDark,
        Icons.storefront,
        'لا توجد منتجات حالياً',
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: storeItems.length,
      itemBuilder: (context, index) {
        return _buildMixedPostCard(storeItems[index], isDark);
      },
    );
  }

  Widget _buildEmptyState(bool isDark, IconData icon, String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: isDark ? Colors.grey[700] : Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(
              color: isDark ? Colors.grey[500] : Colors.grey[600],
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Models ====================
class LiveUser {
  final String id;
  final String name;
  final String imageUrl;
  final bool isLive;

  LiveUser({
    required this.id,
    required this.name,
    required this.imageUrl,
    required this.isLive,
  });
}

class MediaPost {
  final String id;
  final String imageUrl;
  final String title;
  final String userName;
  final String userAvatar;
  final int likesCount;
  final bool isVideo;
  final bool hasShopButton;

  MediaPost({
    required this.id,
    required this.imageUrl,
    required this.title,
    required this.userName,
    required this.userAvatar,
    required this.likesCount,
    required this.isVideo,
    required this.hasShopButton,
  });
}

class VideoPost {
  final String id;
  final String thumbnailUrl;
  final String videoUrl;
  final String title;
  final String userName;
  final String userAvatar;
  final int viewsCount;
  final int likesCount;
  final String duration;

  VideoPost({
    required this.id,
    required this.thumbnailUrl,
    required this.videoUrl,
    required this.title,
    required this.userName,
    required this.userAvatar,
    required this.viewsCount,
    required this.likesCount,
    required this.duration,
  });
}

class TweetPost {
  final String id;
  final String userName;
  final String userHandle;
  final String userAvatar;
  final String content;
  final String? imageUrl;
  final String timestamp;
  final int likesCount;
  final int commentsCount;
  final int retweetsCount;
  final bool isVerified;

  TweetPost({
    required this.id,
    required this.userName,
    required this.userHandle,
    required this.userAvatar,
    required this.content,
    this.imageUrl,
    required this.timestamp,
    required this.likesCount,
    required this.commentsCount,
    required this.retweetsCount,
    required this.isVerified,
  });
}
