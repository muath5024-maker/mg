import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/coming_soon_dialog.dart';
import '../constants/studio_colors.dart';

/// صفحة الاستوديو الرئيسية - استديو AI
/// تصميم مطابق لـ CapCut
class StudioMainPage extends ConsumerStatefulWidget {
  const StudioMainPage({super.key});

  @override
  ConsumerState<StudioMainPage> createState() => _StudioMainPageState();
}

class _StudioMainPageState extends ConsumerState<StudioMainPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  // أدوات الاستوديو
  final List<Map<String, dynamic>> _studioTools = [
    {'icon': Icons.auto_fix_high_rounded, 'label': 'التنميق', 'badge': null},
    {'icon': Icons.tune_rounded, 'label': 'التحسين التلقائي', 'badge': null},
    {
      'icon': Icons.photo_library_outlined,
      'label': 'أدوات الصور',
      'badge': null,
    },
    {'icon': Icons.campaign_outlined, 'label': 'أدوات التسويق', 'badge': null},
    {
      'icon': Icons.person_remove_outlined,
      'label': 'إزالة الخلفية',
      'badge': null,
    },
    {
      'icon': Icons.closed_caption_outlined,
      'label': 'الشرح التلقائي',
      'badge': null,
    },
    {'icon': Icons.speed_rounded, 'label': 'ضبط السرعة', 'badge': null},
    {
      'icon': Icons.people_outline_rounded,
      'label': 'أدوات أفاتار',
      'badge': null,
    },
    {'icon': Icons.graphic_eq_rounded, 'label': 'أدوات الصوت', 'badge': null},
    {
      'icon': Icons.speaker_notes_outlined,
      'label': 'أداة التلقين',
      'badge': null,
    },
    {
      'icon': Icons.dashboard_customize_outlined,
      'label': 'القوالب',
      'badge': 'جديد',
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? StudioColors.bgDark : Colors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              children: [
                // Header with search and plan badge
                _buildHeader(isDark),

                const SizedBox(height: 24),

                // Main Action Cards
                _buildMainActionCards(isDark),

                const SizedBox(height: 24),

                // Tools Grid
                _buildToolsGrid(isDark),

                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        children: [
          // Search Button
          GestureDetector(
            onTap: () => _showSearchSheet(),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isDark ? StudioColors.surfaceDark : Colors.grey[100],
                borderRadius: BorderRadius.circular(22),
              ),
              child: Icon(
                Icons.search_rounded,
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                size: 22,
              ),
            ),
          ),

          const Spacer(),

          // Plan Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00D4AA), Color(0xFF00B4D8)],
              ),
              borderRadius: BorderRadius.circular(25),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.diamond_outlined, color: Colors.white, size: 18),
                SizedBox(width: 6),
                Text(
                  'الخطة القياسية',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainActionCards(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // تعديل الصورة
          Expanded(
            child: _buildMainCard(
              icon: Icons.image_rounded,
              label: 'تعديل الصورة',
              isDark: isDark,
              onTap: () => _navigateToEditStudio(context),
              isSecondary: true,
            ),
          ),
          const SizedBox(width: 12),
          // فيديو جديد
          Expanded(
            child: _buildMainCard(
              icon: Icons.add_rounded,
              label: 'فيديو جديد',
              isDark: isDark,
              onTap: () => _showVideoEditorDialog(context),
              isSecondary: false,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainCard({
    required IconData icon,
    required String label,
    required bool isDark,
    required VoidCallback onTap,
    required bool isSecondary,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: isSecondary
              ? (isDark ? const Color(0xFF1E3A5F) : const Color(0xFFE8F4FC))
              : (isDark ? const Color(0xFF2D3748) : const Color(0xFF2D3748)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isSecondary
                    ? (isDark
                          ? Colors.white.withValues(alpha: 0.15)
                          : const Color(0xFF3B82F6).withValues(alpha: 0.15))
                    : Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSecondary
                    ? (isDark ? Colors.white : const Color(0xFF3B82F6))
                    : Colors.white,
                size: 26,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                color: isSecondary
                    ? (isDark ? Colors.white : const Color(0xFF1E3A5F))
                    : Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolsGrid(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 16,
          mainAxisSpacing: 20,
          childAspectRatio: 0.85,
        ),
        itemCount: _studioTools.length,
        itemBuilder: (context, index) {
          final tool = _studioTools[index];
          return _buildToolItem(
            icon: tool['icon'] as IconData,
            label: tool['label'] as String,
            badge: tool['badge'] as String?,
            isDark: isDark,
            onTap: () => _handleToolTap(tool['label'] as String),
          );
        },
      ),
    );
  }

  Widget _buildToolItem({
    required IconData icon,
    required String label,
    String? badge,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Icon Container
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: isDark ? StudioColors.surfaceDark : Colors.grey[100],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icon,
                  color: isDark ? Colors.grey[300] : Colors.grey[700],
                  size: 26,
                ),
              ),
              // Badge
              if (badge != null)
                Positioned(
                  top: -8,
                  left: -8,
                  right: -8,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00D4AA),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: isDark ? Colors.grey[300] : Colors.grey[800],
              fontSize: 12,
              fontWeight: FontWeight.w500,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _showSearchSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? StudioColors.surfaceDark : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
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
              TextField(
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'ابحث عن أدوات، قوالب...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  filled: true,
                  fillColor: isDark ? StudioColors.bgDark : Colors.grey[100],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              // Recent Searches
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'عمليات البحث الأخيرة',
                  style: TextStyle(
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildSearchChip('إزالة الخلفية', isDark),
                  _buildSearchChip('تحرير فيديو', isDark),
                  _buildSearchChip('قوالب انستقرام', isDark),
                ],
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchChip(String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? StudioColors.bgDark : Colors.grey[100],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.history_rounded,
            size: 16,
            color: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: isDark ? Colors.grey[300] : Colors.grey[700],
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  void _handleToolTap(String toolName) {
    switch (toolName) {
      case 'التنميق':
        _navigateToEditStudio(context);
        break;
      case 'التحسين التلقائي':
        _showComingSoon(context, 'التحسين التلقائي');
        break;
      case 'أدوات الصور':
        _showImageToolsSheet();
        break;
      case 'أدوات التسويق':
        _showMarketingToolsSheet();
        break;
      case 'إزالة الخلفية':
        _showBackgroundRemoverSheet();
        break;
      case 'الشرح التلقائي':
        _showComingSoon(context, 'الشرح التلقائي');
        break;
      case 'ضبط السرعة':
        _showComingSoon(context, 'ضبط السرعة');
        break;
      case 'أدوات أفاتار':
        _showAvatarToolsSheet();
        break;
      case 'أدوات الصوت':
        _showAudioToolsSheet();
        break;
      case 'أداة التلقين':
        _showComingSoon(context, 'أداة التلقين');
        break;
      case 'القوالب':
        _showTemplatesSheet();
        break;
      default:
        _showComingSoon(context, toolName);
    }
  }

  void _showTemplatesSheet() {
    _showCapcutStyleSheet(
      title: 'القوالب',
      items: [
        {
          'icon': Icons.shopping_bag_outlined,
          'title': 'قوالب المنتجات',
          'subtitle': 'قوالب جاهزة لعرض منتجاتك.',
        },
        {
          'icon': Icons.video_library_outlined,
          'title': 'قوالب الفيديو',
          'subtitle': 'قوالب فيديو احترافية جاهزة.',
        },
        {
          'icon': Icons.photo_size_select_actual_outlined,
          'title': 'قوالب السوشيال ميديا',
          'subtitle': 'قوالب لجميع منصات التواصل.',
        },
        {
          'icon': Icons.local_offer_outlined,
          'title': 'قوالب العروض',
          'subtitle': 'قوالب للعروض والتخفيضات.',
        },
      ],
    );
  }

  // ===================== أدوات التسويق =====================
  void _showMarketingToolsSheet() {
    _showCapcutStyleSheet(
      title: 'أدوات التسويق',
      items: [
        {
          'icon': Icons.smart_display_outlined,
          'title': 'الإعلانات الذكية',
          'subtitle': 'إنشاء إعلانات الفيديوهات المنتشرة.',
        },
        {
          'icon': Icons.image_search_outlined,
          'title': 'صور المنتج',
          'subtitle': 'أنشئ صور المنتج في ثوان.',
        },
        {
          'icon': Icons.note_add_outlined,
          'title': 'ملصق مدعوم بالذكاء الاصطناعي',
          'subtitle': 'أنشئ الملصقات بنقرة واحدة.',
        },
        {
          'icon': Icons.checkroom_outlined,
          'title': 'عارضة أزياء مدعومة بالذكاء الاصطناعي',
          'subtitle': 'استعرض ملابسك.',
        },
      ],
    );
  }

  // ===================== أدوات الصور =====================
  void _showImageToolsSheet() {
    _showCapcutStyleSheet(
      title: 'أدوات الصور',
      items: [
        {
          'icon': Icons.grid_view_rounded,
          'title': 'تجميع صور',
          'subtitle': 'أنشئ تجميعات صور بسهولة.',
        },
        {
          'icon': Icons.auto_awesome_outlined,
          'title': 'منسق الصور',
          'subtitle': 'اجعل صورتك مميزة بنقرة واحدة.',
        },
        {
          'icon': Icons.wb_sunny_outlined,
          'title': 'ضبط الإضاءة الذكي',
          'subtitle': 'حسّن صورك المظلمة بنقرة واحدة.',
        },
        {
          'icon': Icons.text_fields_outlined,
          'title': 'تحويل النص إلى صورة',
          'subtitle': 'إنشاء صور باستخدام الذكاء الاصطناعي.',
        },
        {
          'icon': Icons.open_in_full_outlined,
          'title': 'التوسيع المدعوم بالذكاء الاصطناعي',
          'subtitle': 'مدّد خلفية الصورة باستخدام الذكاء الاصطناعي.',
        },
      ],
    );
  }

  // ===================== أدوات أفاتار =====================
  void _showAvatarToolsSheet() {
    _showCapcutStyleSheet(
      title: 'أدوات أفاتار',
      items: [
        {
          'icon': Icons.face_retouching_natural_outlined,
          'title': 'صور أفاتار مدعومة بالذكاء الاصطناعي',
          'subtitle': 'عبّر عن شخصيتك بصور الأفاتار.',
        },
        {
          'icon': Icons.translate_outlined,
          'title': 'مترجم الفيديو',
          'subtitle': 'ترجمة مع مزامنة الشفاه.',
        },
        {
          'icon': Icons.checkroom_outlined,
          'title': 'عارضة أزياء مدعومة بالذكاء الاصطناعي',
          'subtitle': 'استعرض ملابسك.',
        },
        {
          'icon': Icons.animation_outlined,
          'title': 'مشهد حواري بالذكاء الاصطناعي',
          'subtitle': 'اجعل قصتك تنبض بالحياة.',
        },
      ],
    );
  }

  // ===================== أدوات الصوت =====================
  void _showAudioToolsSheet() {
    _showCapcutStyleSheet(
      title: 'أدوات الصوت',
      items: [
        {
          'icon': Icons.record_voice_over_outlined,
          'title': 'تحويل النص إلى كلام',
          'subtitle': 'حوّل النص إلى صوت طبيعي.',
        },
        {
          'icon': Icons.music_note_outlined,
          'title': 'الموسيقى الذكية',
          'subtitle': 'أضف موسيقى مناسبة تلقائياً.',
        },
        {
          'icon': Icons.graphic_eq_outlined,
          'title': 'تحسين الصوت',
          'subtitle': 'حسّن جودة الصوت بنقرة واحدة.',
        },
        {
          'icon': Icons.noise_aware_outlined,
          'title': 'إزالة الضوضاء',
          'subtitle': 'أزل الضوضاء من التسجيلات.',
        },
      ],
    );
  }

  // ===================== إزالة الخلفية =====================
  void _showBackgroundRemoverSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFFE8EDF2) : const Color(0xFFE8EDF2),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // صورة العرض
            Expanded(
              flex: 5,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(24),
                  ),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [const Color(0xFF3B82F6), const Color(0xFF8B5CF6)],
                  ),
                ),
                child: Stack(
                  children: [
                    // الصورة
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.person_outline_rounded,
                            size: 120,
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ],
                      ),
                    ),
                    // زر الإغلاق
                    Positioned(
                      top: 16,
                      left: 16,
                      child: GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.3),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // المحتوى
            Expanded(
              flex: 4,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Text(
                      'إزالة الخلفية بنقرة واحدة',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'أزل خلفيات الفيديوهات والصور أو غيرها على الفور',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      textAlign: TextAlign.center,
                    ),
                    const Spacer(),
                    // زر البدء
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _showComingSoon(context, 'إزالة الخلفية');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black87,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text(
                          'التالي',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // زر الإغلاق الدائري
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.close,
                          color: Colors.grey[700],
                          size: 24,
                        ),
                      ),
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

  // ===================== Bottom Sheet بتصميم CapCut =====================
  void _showCapcutStyleSheet({
    required String title,
    required List<Map<String, dynamic>> items,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFFE8EDF2) : const Color(0xFFE8EDF2),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 40),
            // العنوان
            Text(
              title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 24),
            // قائمة العناصر
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                        _showComingSoon(context, item['title'] as String);
                      },
                      child: Row(
                        textDirection: TextDirection.rtl,
                        children: [
                          // النص
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  item['title'] as String,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item['subtitle'] as String,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          // الأيقونة
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 10,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Icon(
                              item['icon'] as IconData,
                              size: 28,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            // زر الإغلاق
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.close, color: Colors.grey[700], size: 24),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  void _navigateToEditStudio(BuildContext context) {
    // استخدام Coming Soon بدلاً من التنقل لصفحة غير جاهزة
    _showComingSoon(context, 'محرر الصور');
  }

  void _showVideoEditorDialog(BuildContext context) {
    _showCapcutStyleSheet(
      title: 'فيديو جديد',
      items: [
        {
          'icon': Icons.video_camera_back_outlined,
          'title': 'تسجيل فيديو جديد',
          'subtitle': 'سجّل فيديو بالكاميرا.',
        },
        {
          'icon': Icons.photo_library_outlined,
          'title': 'اختيار من المعرض',
          'subtitle': 'اختر فيديو من جهازك.',
        },
        {
          'icon': Icons.movie_creation_outlined,
          'title': 'مشروع جديد فارغ',
          'subtitle': 'ابدأ مشروع فيديو من الصفر.',
        },
      ],
    );
  }

  void _showComingSoon(BuildContext context, String feature) {
    ComingSoonDialog.show(context, featureName: feature);
  }
}
