import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../constants/studio_colors.dart';

/// صفحة استديو التوليد - توليد الصور والفيديو بالذكاء الاصطناعي
class GenerationStudioPage extends ConsumerStatefulWidget {
  const GenerationStudioPage({super.key});

  @override
  ConsumerState<GenerationStudioPage> createState() =>
      _GenerationStudioPageState();
}

class _GenerationStudioPageState extends ConsumerState<GenerationStudioPage>
    with SingleTickerProviderStateMixin {
  int _selectedMediaType = 0; // 0 = صورة, 1 = فيديو
  int _selectedStyleIndex = 1; // ثلاثي الأبعاد selected by default
  int _selectedAspectRatio = 1; // 9:16 selected by default
  final TextEditingController _promptController = TextEditingController();
  bool _isGenerating = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  final List<_ArtStyle> _artStyles = [
    const _ArtStyle(name: 'بدون', icon: Icons.block, imageUrl: null),
    const _ArtStyle(
      name: 'ثلاثي الأبعاد',
      icon: null,
      imageUrl: 'https://picsum.photos/200?random=1',
    ),
    const _ArtStyle(
      name: 'أنمي',
      icon: null,
      imageUrl: 'https://picsum.photos/200?random=2',
    ),
    const _ArtStyle(
      name: 'سايبربانك',
      icon: null,
      imageUrl: 'https://picsum.photos/200?random=3',
    ),
    const _ArtStyle(
      name: 'زيتي',
      icon: null,
      imageUrl: 'https://picsum.photos/200?random=4',
    ),
  ];

  final List<_AspectRatioOption> _aspectRatios = const [
    _AspectRatioOption(label: '1:1', icon: Icons.square_outlined),
    _AspectRatioOption(label: '9:16', icon: Icons.crop_portrait),
    _AspectRatioOption(label: '16:9', icon: Icons.crop_landscape),
    _AspectRatioOption(label: '4:3', icon: Icons.crop_7_5),
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _promptController.dispose();
    super.dispose();
  }

  void _selectMediaType(int index) {
    HapticFeedback.lightImpact();
    setState(() => _selectedMediaType = index);
  }

  void _selectStyle(int index) {
    HapticFeedback.lightImpact();
    setState(() => _selectedStyleIndex = index);
  }

  void _selectAspectRatio(int index) {
    HapticFeedback.lightImpact();
    setState(() => _selectedAspectRatio = index);
  }

  Future<void> _generateArtwork() async {
    if (_promptController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('الرجاء إدخال وصف للعمل الفني'),
          backgroundColor: Colors.orange,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      );
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _isGenerating = true);

    // محاكاة التوليد
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    setState(() => _isGenerating = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('تم توليد العمل الفني بنجاح!'),
        backgroundColor: StudioColors.primaryColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = StudioColors.getBackgroundColor(isDark);
    final surfaceColor = StudioColors.getSurfaceColor(isDark);

    return Scaffold(
      backgroundColor: bgColor,
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Stack(
              children: [
                // Main Content
                CustomScrollView(
                  slivers: [
                    // Top App Bar
                    SliverAppBar(
                      pinned: true,
                      backgroundColor: bgColor.withValues(alpha: 0.8),
                      surfaceTintColor: Colors.transparent,
                      leading: IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          Navigator.pop(context);
                        },
                      ),
                      title: const Text(
                        'استديو التوليد',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      actions: [
                        IconButton(
                          icon: Icon(
                            Icons.history,
                            color: isDark ? Colors.grey[300] : Colors.grey[600],
                          ),
                          onPressed: () => HapticFeedback.lightImpact(),
                        ),
                        IconButton(
                          icon: Icon(
                            Icons.settings,
                            color: isDark ? Colors.grey[300] : Colors.grey[600],
                          ),
                          onPressed: () => HapticFeedback.lightImpact(),
                        ),
                      ],
                    ),

                    // Content
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Media Type Toggle
                            _buildMediaTypeToggle(isDark, surfaceColor),
                            const SizedBox(height: 24),

                            // Prompt Input Area
                            _buildPromptInput(isDark, surfaceColor),
                            const SizedBox(height: 24),

                            // Art Styles Carousel
                            _buildArtStylesSection(isDark),
                            const SizedBox(height: 24),

                            // Parameters Section
                            _buildParametersSection(isDark, surfaceColor),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Floating Bottom Bar
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: _buildGenerateButton(isDark, bgColor),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMediaTypeToggle(bool isDark, Color surfaceColor) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? surfaceColor : Colors.grey[200],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _buildMediaTypeButton(
            index: 0,
            icon: Icons.image,
            label: 'صورة',
            isDark: isDark,
          ),
          _buildMediaTypeButton(
            index: 1,
            icon: Icons.videocam,
            label: 'فيديو',
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildMediaTypeButton({
    required int index,
    required IconData icon,
    required String label,
    required bool isDark,
  }) {
    final isSelected = _selectedMediaType == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => _selectMediaType(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? StudioColors.primaryColor : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: StudioColors.primaryColor.withValues(alpha: 0.3),
                      blurRadius: 8,
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.grey[400] : Colors.grey[500]),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? Colors.grey[400] : Colors.grey[500]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPromptInput(bool isDark, Color surfaceColor) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            StudioColors.primaryColor.withValues(alpha: 0.2),
            StudioColors.secondaryColor.withValues(alpha: 0.2),
          ],
        ),
      ),
      padding: const EdgeInsets.all(2),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'الوصف',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: StudioColors.primaryColor,
                    letterSpacing: 1,
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    // TODO: تحسين تلقائي
                  },
                  child: Row(
                    children: [
                      Icon(
                        Icons.auto_fix_high,
                        size: 16,
                        color: StudioColors.secondaryColor,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'تحسين تلقائي',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: StudioColors.secondaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _promptController,
              maxLines: 5,
              minLines: 4,
              decoration: InputDecoration(
                hintText:
                    'صف خيالك هنا... مثل: مدينة مستقبلية في السحب، ساعة ذهبية، تفاصيل دقيقة...',
                hintStyle: TextStyle(
                  color: isDark ? Colors.grey[500] : Colors.grey[400],
                  fontSize: 14,
                ),
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              style: TextStyle(
                fontSize: 14,
                color: isDark ? Colors.white : Colors.grey[900],
                height: 1.5,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  onPressed: () => HapticFeedback.lightImpact(),
                  icon: Icon(
                    Icons.add_photo_alternate,
                    color: isDark ? Colors.grey[400] : Colors.grey[500],
                  ),
                ),
                IconButton(
                  onPressed: () => HapticFeedback.lightImpact(),
                  icon: Icon(
                    Icons.mic,
                    color: isDark ? Colors.grey[400] : Colors.grey[500],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildArtStylesSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'الأنماط الفنية',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () => HapticFeedback.lightImpact(),
              child: Text(
                'عرض الكل',
                style: TextStyle(
                  fontSize: 12,
                  color: StudioColors.primaryColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 130,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _artStyles.length,
            itemBuilder: (context, index) {
              final style = _artStyles[index];
              final isSelected = index == _selectedStyleIndex;
              return GestureDetector(
                onTap: () => _selectStyle(index),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 88,
                  margin: EdgeInsets.only(
                    left: index < _artStyles.length - 1 ? 12 : 0,
                  ),
                  child: Column(
                    children: [
                      Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected
                                ? StudioColors.primaryColor
                                : Colors.transparent,
                            width: 2,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: StudioColors.primaryColor.withValues(
                                      alpha: 0.4,
                                    ),
                                    blurRadius: 12,
                                  ),
                                ]
                              : null,
                          color: style.imageUrl == null
                              ? (isDark
                                    ? Colors.white.withValues(alpha: 0.1)
                                    : Colors.grey[200])
                              : null,
                          image: style.imageUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(style.imageUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: Stack(
                          children: [
                            if (style.icon != null)
                              Center(
                                child: Icon(
                                  style.icon,
                                  size: 32,
                                  color: isDark
                                      ? Colors.grey[400]
                                      : Colors.grey[500],
                                ),
                              ),
                            if (isSelected)
                              Positioned(
                                top: 6,
                                right: 6,
                                child: Container(
                                  width: 16,
                                  height: 16,
                                  decoration: BoxDecoration(
                                    color: StudioColors.primaryColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 1,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.check,
                                    size: 10,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        style.name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: isSelected
                              ? StudioColors.primaryColor
                              : (isDark ? Colors.grey[300] : Colors.grey[600]),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildParametersSection(bool isDark, Color surfaceColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الإعدادات',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        // Aspect Ratio
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'نسبة العرض إلى الارتفاع',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.grey[400] : Colors.grey[500],
                ),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: List.generate(_aspectRatios.length, (index) {
                    final ratio = _aspectRatios[index];
                    final isSelected = index == _selectedAspectRatio;
                    return GestureDetector(
                      onTap: () => _selectAspectRatio(index),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: EdgeInsets.only(
                          left: index < _aspectRatios.length - 1 ? 8 : 0,
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? StudioColors.primaryColor.withValues(alpha: 0.1)
                              : (isDark
                                    ? Colors.white.withValues(alpha: 0.05)
                                    : Colors.grey[100]),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isSelected
                                ? StudioColors.primaryColor
                                : Colors.transparent,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              ratio.icon,
                              size: 18,
                              color: isSelected
                                  ? StudioColors.primaryColor
                                  : (isDark
                                        ? Colors.grey[200]
                                        : Colors.grey[700]),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              ratio.label,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.w500,
                                color: isSelected
                                    ? StudioColors.primaryColor
                                    : (isDark
                                          ? Colors.grey[200]
                                          : Colors.grey[700]),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Advanced Toggles
        Row(
          children: [
            Expanded(
              child: _buildAdvancedToggle(
                icon: Icons.do_not_disturb_on,
                label: 'الاستبعاد',
                color: Colors.orange,
                isDark: isDark,
                surfaceColor: surfaceColor,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildAdvancedToggle(
                icon: Icons.tune,
                label: 'متقدم',
                color: Colors.blue,
                isDark: isDark,
                surfaceColor: surfaceColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAdvancedToggle({
    required IconData icon,
    required String label,
    required Color color,
    required bool isDark,
    required Color surfaceColor,
  }) {
    return GestureDetector(
      onTap: () => HapticFeedback.lightImpact(),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.grey[200] : Colors.grey[700],
                ),
              ),
            ),
            Icon(Icons.chevron_left, size: 18, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildGenerateButton(bool isDark, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [bgColor, bgColor, bgColor.withValues(alpha: 0.0)],
          stops: const [0.0, 0.7, 1.0],
        ),
      ),
      child: GestureDetector(
        onTap: _isGenerating ? null : _generateArtwork,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 56,
          decoration: BoxDecoration(
            color: _isGenerating
                ? StudioColors.primaryColor.withValues(alpha: 0.7)
                : StudioColors.primaryColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: StudioColors.primaryColor.withValues(alpha: 0.4),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              Center(
                child: _isGenerating
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.auto_awesome,
                            color: Colors.white,
                            size: 24,
                          ),
                          SizedBox(width: 8),
                          Text(
                            'توليد العمل الفني',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
              ),
              if (!_isGenerating)
                Positioned(
                  left: 16,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        '2 ⚡',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// نمط فني
class _ArtStyle {
  final String name;
  final IconData? icon;
  final String? imageUrl;

  const _ArtStyle({required this.name, this.icon, this.imageUrl});
}

/// خيار نسبة العرض إلى الارتفاع
class _AspectRatioOption {
  final String label;
  final IconData icon;

  const _AspectRatioOption({required this.label, required this.icon});
}
