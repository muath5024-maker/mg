import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_dimensions.dart';
import '../../core/constants/app_icons.dart';
import '../../core/theme/app_theme.dart';

/// ============================================================================
/// Base Screen Widget - شاشة أساسية موحدة
/// ============================================================================
///
/// هذا الـ Widget يوفر قالب موحد لجميع الشاشات الفرعية في التطبيق
/// يقلل من تكرار الكود ويضمن تناسق التصميم
///
/// الميزات:
/// - AppBar موحد مع زر رجوع
/// - دعم حالة التحميل
/// - دعم حالة الخطأ
/// - دعم حالة البيانات الفارغة
/// - Pull to Refresh
/// - FAB اختياري

/// أنواع حالات الشاشة
enum ScreenState { loading, loaded, empty, error }

/// ============================================================================
/// Screen Helper Functions - دوال مساعدة للشاشات
/// ============================================================================

/// عرض SnackBar للخطأ
void showErrorSnackBar(
  BuildContext context,
  String message, {
  VoidCallback? onRetry,
}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: AppTheme.errorColor,
      behavior: SnackBarBehavior.floating,
      action: onRetry != null
          ? SnackBarAction(
              label: 'إعادة المحاولة',
              textColor: Colors.white,
              onPressed: onRetry,
            )
          : null,
    ),
  );
}

/// عرض SnackBar للنجاح
void showSuccessSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: AppTheme.successColor,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

/// عرض SnackBar للتحذير
void showWarningSnackBar(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: AppTheme.warningColor,
      behavior: SnackBarBehavior.floating,
    ),
  );
}

/// عرض Dialog للتأكيد
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmText = 'تأكيد',
  String cancelText = 'إلغاء',
  bool isDangerous = false,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(cancelText),
        ),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          style: isDangerous
              ? TextButton.styleFrom(foregroundColor: AppTheme.errorColor)
              : null,
          child: Text(confirmText),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// ============================================================================
/// Screen Mixin - للشاشات Stateful
/// ============================================================================

/// Mixin يوفر وظائف مشتركة للشاشات (يعمل مع State عادي)
mixin ScreenHelperMixin<T extends StatefulWidget> on State<T> {
  /// عرض SnackBar للخطأ
  void showError(String message, {VoidCallback? onRetry}) {
    if (!mounted) return;
    showErrorSnackBar(context, message, onRetry: onRetry);
  }

  /// عرض SnackBar للنجاح
  void showSuccess(String message) {
    if (!mounted) return;
    showSuccessSnackBar(context, message);
  }

  /// عرض SnackBar للتحذير
  void showWarning(String message) {
    if (!mounted) return;
    showWarningSnackBar(context, message);
  }

  /// عرض Dialog للتأكيد
  Future<bool> confirmAction({
    required String title,
    required String message,
    String confirmText = 'تأكيد',
    String cancelText = 'إلغاء',
    bool isDangerous = false,
  }) async {
    return showConfirmDialog(
      context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      isDangerous: isDangerous,
    );
  }
}

/// Mixin للشاشات مع Riverpod
mixin ConsumerScreenMixin<T extends ConsumerStatefulWidget>
    on ConsumerState<T> {
  /// عرض SnackBar للخطأ
  void showError(String message, {VoidCallback? onRetry}) {
    if (!mounted) return;
    showErrorSnackBar(context, message, onRetry: onRetry);
  }

  /// عرض SnackBar للنجاح
  void showSuccess(String message) {
    if (!mounted) return;
    showSuccessSnackBar(context, message);
  }

  /// عرض SnackBar للتحذير
  void showWarning(String message) {
    if (!mounted) return;
    showWarningSnackBar(context, message);
  }

  /// عرض Dialog للتأكيد
  Future<bool> confirmAction({
    required String title,
    required String message,
    String confirmText = 'تأكيد',
    String cancelText = 'إلغاء',
    bool isDangerous = false,
  }) async {
    return showConfirmDialog(
      context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      isDangerous: isDangerous,
    );
  }
}

/// ============================================================================
/// Base Screen - StatelessWidget
/// ============================================================================

/// شاشة أساسية موحدة
class BaseScreen extends StatelessWidget {
  /// عنوان الشاشة
  final String title;

  /// محتوى الشاشة الرئيسي
  final Widget body;

  /// حالة الشاشة الحالية
  final ScreenState state;

  /// رسالة الخطأ (إذا كانت الحالة error)
  final String? errorMessage;

  /// دالة إعادة المحاولة
  final VoidCallback? onRetry;

  /// دالة التحديث (Pull to Refresh)
  final Future<void> Function()? onRefresh;

  /// عنوان الحالة الفارغة
  final String? emptyTitle;

  /// وصف الحالة الفارغة
  final String? emptySubtitle;

  /// زر إجراء في الحالة الفارغة
  final Widget? emptyAction;

  /// أزرار في AppBar
  final List<Widget>? actions;

  /// FAB
  final Widget? floatingActionButton;

  /// موقع FAB
  final FloatingActionButtonLocation? floatingActionButtonLocation;

  /// شريط سفلي
  final Widget? bottomNavigationBar;

  /// لون الخلفية
  final Color? backgroundColor;

  /// إظهار AppBar
  final bool showAppBar;

  /// إظهار زر الرجوع
  final bool showBackButton;

  /// عرض العنوان في المنتصف
  final bool centerTitle;

  /// Padding للمحتوى
  final EdgeInsetsGeometry? padding;

  const BaseScreen({
    super.key,
    required this.title,
    required this.body,
    this.state = ScreenState.loaded,
    this.errorMessage,
    this.onRetry,
    this.onRefresh,
    this.emptyTitle,
    this.emptySubtitle,
    this.emptyAction,
    this.actions,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.bottomNavigationBar,
    this.backgroundColor,
    this.showAppBar = true,
    this.showBackButton = true,
    this.centerTitle = true,
    this.padding,
    this.useSafeArea = true,
    this.safeAreaTop = true,
    this.safeAreaBottom = true,
  });

  /// Whether to wrap body in SafeArea
  final bool useSafeArea;

  /// Whether to respect top safe area (status bar)
  final bool safeAreaTop;

  /// Whether to respect bottom safe area (navigation bar)
  final bool safeAreaBottom;

  @override
  Widget build(BuildContext context) {
    Widget bodyContent = _buildBody(context);

    // Wrap with SafeArea if enabled and no AppBar (AppBar handles top safe area)
    if (useSafeArea) {
      bodyContent = SafeArea(
        top: !showAppBar && safeAreaTop, // AppBar handles top safe area
        bottom: safeAreaBottom,
        child: bodyContent,
      );
    }

    return Scaffold(
      backgroundColor: backgroundColor ?? AppTheme.backgroundColor,
      appBar: showAppBar ? _buildAppBar(context) : null,
      body: bodyContent,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      bottomNavigationBar: bottomNavigationBar,
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    return AppBar(
      backgroundColor: AppTheme.surfaceColor,
      foregroundColor: AppTheme.textPrimaryColor,
      elevation: 0,
      scrolledUnderElevation: 1,
      surfaceTintColor: Colors.transparent,
      centerTitle: centerTitle,
      toolbarHeight: AppDimensions.appBarHeight,
      automaticallyImplyLeading: false,
      leading: showBackButton
          ? IconButton(
              icon: SvgPicture.asset(
                AppIcons.arrowBack,
                width: AppDimensions.iconM,
                height: AppDimensions.iconM,
                colorFilter: const ColorFilter.mode(
                  AppTheme.primaryColor,
                  BlendMode.srcIn,
                ),
              ),
              onPressed: () => context.pop(),
            )
          : null,
      title: Text(
        title,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: AppDimensions.fontHeadline,
          color: AppTheme.textPrimaryColor,
        ),
      ),
      actions: actions,
    );
  }

  Widget _buildBody(BuildContext context) {
    Widget content;

    switch (state) {
      case ScreenState.loading:
        content = const _LoadingState();
        break;
      case ScreenState.error:
        content = _ErrorState(
          message: errorMessage ?? 'حدث خطأ غير متوقع',
          onRetry: onRetry,
        );
        break;
      case ScreenState.empty:
        content = _EmptyState(
          iconPath: AppIcons.inbox,
          title: emptyTitle ?? 'لا توجد بيانات',
          subtitle: emptySubtitle,
          action: emptyAction,
        );
        break;
      case ScreenState.loaded:
        content = padding != null
            ? Padding(padding: padding!, child: body)
            : body;
        break;
    }

    if (onRefresh != null && state == ScreenState.loaded) {
      return RefreshIndicator(
        onRefresh: onRefresh!,
        color: AppTheme.primaryColor,
        child: content,
      );
    }

    return content;
  }
}

/// حالة التحميل
class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppTheme.primaryColor),
          SizedBox(height: AppDimensions.spacing16),
          Text(
            'جاري التحميل...',
            style: TextStyle(
              color: AppTheme.textSecondaryColor,
              fontSize: AppDimensions.fontBody,
            ),
          ),
        ],
      ),
    );
  }
}

/// حالة الخطأ
class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const _ErrorState({required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.spacing24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppDimensions.spacing20),
              decoration: BoxDecoration(
                color: Colors.red.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: SvgPicture.asset(
                AppIcons.error,
                width: AppDimensions.iconDisplay,
                height: AppDimensions.iconDisplay,
                colorFilter: const ColorFilter.mode(
                  Colors.red,
                  BlendMode.srcIn,
                ),
              ),
            ),
            const SizedBox(height: AppDimensions.spacing16),
            const Text(
              'حدث خطأ!',
              style: TextStyle(
                fontSize: AppDimensions.fontTitle,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimaryColor,
              ),
            ),
            const SizedBox(height: AppDimensions.spacing8),
            Text(
              message,
              style: const TextStyle(
                fontSize: AppDimensions.fontBody,
                color: AppTheme.textSecondaryColor,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: AppDimensions.spacing24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: SvgPicture.asset(
                  AppIcons.refresh,
                  width: 20,
                  height: 20,
                  colorFilter: const ColorFilter.mode(
                    Colors.white,
                    BlendMode.srcIn,
                  ),
                ),
                label: const Text('إعادة المحاولة'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppDimensions.spacing24,
                    vertical: AppDimensions.spacing12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: AppDimensions.borderRadiusM,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// حالة البيانات الفارغة
class _EmptyState extends StatelessWidget {
  final String iconPath;
  final String title;
  final String? subtitle;
  final Widget? action;

  const _EmptyState({
    required this.iconPath,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.spacing24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppDimensions.spacing20),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: SvgPicture.asset(
                iconPath,
                width: AppDimensions.iconDisplay,
                height: AppDimensions.iconDisplay,
                colorFilter: const ColorFilter.mode(
                  AppTheme.primaryColor,
                  BlendMode.srcIn,
                ),
              ),
            ),
            const SizedBox(height: AppDimensions.spacing16),
            Text(
              title,
              style: const TextStyle(
                fontSize: AppDimensions.fontTitle,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimaryColor,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: AppDimensions.spacing8),
              Text(
                subtitle!,
                style: const TextStyle(
                  fontSize: AppDimensions.fontBody,
                  color: AppTheme.textSecondaryColor,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: AppDimensions.spacing24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// شاشة فرعية بسيطة مع هيدر
class SubPageScreen extends StatelessWidget {
  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Color? backgroundColor;

  const SubPageScreen({
    super.key,
    required this.title,
    required this.body,
    this.actions,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor ?? AppTheme.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(child: body),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppDimensions.spacing16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              padding: const EdgeInsets.all(AppDimensions.spacing8),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withValues(alpha: 0.1),
                borderRadius: AppDimensions.borderRadiusS,
              ),
              child: SvgPicture.asset(
                AppIcons.arrowBack,
                width: AppDimensions.iconS,
                height: AppDimensions.iconS,
                colorFilter: const ColorFilter.mode(
                  AppTheme.primaryColor,
                  BlendMode.srcIn,
                ),
              ),
            ),
          ),
          const Spacer(),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: AppDimensions.fontHeadline,
              color: AppTheme.textPrimaryColor,
            ),
          ),
          const Spacer(),
          if (actions != null && actions!.isNotEmpty)
            Row(children: actions!)
          else
            const SizedBox(
              width: AppDimensions.iconM + AppDimensions.spacing16,
            ),
        ],
      ),
    );
  }
}

/// شاشة قيد التطوير
class ComingSoonScreen extends StatelessWidget {
  final String title;
  final String? description;
  final IconData? icon;

  const ComingSoonScreen({
    super.key,
    required this.title,
    this.description,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SubPageScreen(
      title: title,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppDimensions.spacing24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(AppDimensions.spacing24),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  AppIcons.tools,
                  width: AppDimensions.iconDisplay,
                  height: AppDimensions.iconDisplay,
                  colorFilter: ColorFilter.mode(
                    AppTheme.accentColor,
                    BlendMode.srcIn,
                  ),
                ),
              ),
              const SizedBox(height: AppDimensions.spacing24),
              Text(
                title,
                style: const TextStyle(
                  fontSize: AppDimensions.fontHeadline,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppDimensions.spacing12),
              Text(
                description ?? 'هذه الصفحة قيد التطوير\nسيتم إطلاقها قريباً',
                style: const TextStyle(
                  fontSize: AppDimensions.fontBody,
                  color: AppTheme.textSecondaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppDimensions.spacing32),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppDimensions.spacing16,
                  vertical: AppDimensions.spacing8,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withValues(alpha: 0.1),
                  borderRadius: AppDimensions.borderRadiusM,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset(
                      AppIcons.time,
                      width: AppDimensions.iconS,
                      height: AppDimensions.iconS,
                      colorFilter: const ColorFilter.mode(
                        AppTheme.accentColor,
                        BlendMode.srcIn,
                      ),
                    ),
                    const SizedBox(width: AppDimensions.spacing8),
                    const Text(
                      'قريباً',
                      style: TextStyle(
                        fontSize: AppDimensions.fontCaption,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.accentColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ============================================================================
/// Base List Screen - شاشة قائمة أساسية مع Pagination
/// ============================================================================
///
/// شاشة مخصصة لعرض قوائم مع:
/// - Pull to refresh
/// - Infinite scrolling (pagination)
/// - حالة فارغة
/// - حالة تحميل أولي
/// - حالة تحميل المزيد
///
/// الاستخدام:
/// ```dart
/// class ProductsScreen extends BaseListScreen<Product> {
///   @override
///   String get screenTitle => 'المنتجات';
///
///   @override
///   Widget buildListItem(BuildContext context, Product item, int index) {
///     return ProductCard(product: item);
///   }
///
///   @override
///   Future<List<Product>> loadItems({int page = 1}) async {
///     return await productRepository.getProducts(page: page);
///   }
/// }
/// ```

abstract class BaseListScreen<T> extends StatefulWidget {
  const BaseListScreen({super.key});
}

abstract class BaseListScreenState<W extends BaseListScreen<T>, T>
    extends State<W>
    with ScreenHelperMixin<W> {
  final ScrollController scrollController = ScrollController();
  final List<T> items = [];

  bool isLoading = true;
  bool isLoadingMore = false;
  bool hasMoreItems = true;
  int currentPage = 1;
  String? errorMessage;

  /// عنوان الشاشة
  String get screenTitle;

  /// هل نعرض زر الرجوع؟
  bool get showBackButton => true;

  /// أزرار إضافية في AppBar
  List<Widget>? get actions => null;

  /// زر FAB (إذا وجد)
  Widget? get floatingActionButton => null;

  /// لون الخلفية
  Color? get backgroundColor => AppTheme.backgroundColor;

  @override
  void initState() {
    super.initState();
    scrollController.addListener(_onScroll);
    _loadInitialData();
  }

  @override
  void dispose() {
    scrollController.dispose();
    super.dispose();
  }

  /// تحميل العناصر
  Future<List<T>> loadItems({int page = 1});

  /// بناء عنصر القائمة
  Widget buildListItem(BuildContext context, T item, int index);

  /// عنوان الحالة الفارغة
  String get emptyStateTitle => 'لا توجد عناصر';

  /// وصف الحالة الفارغة
  String? get emptyStateSubtitle => null;

  /// أيقونة الحالة الفارغة
  IconData get emptyStateIcon => Icons.inbox_outlined;

  /// هل نستخدم Separator بين العناصر؟
  bool get useSeparator => false;

  /// Padding للقائمة
  EdgeInsetsGeometry get listPadding => AppDimensions.screenPadding;

  void _onScroll() {
    if (scrollController.position.pixels >=
            scrollController.position.maxScrollExtent - 200 &&
        !isLoadingMore &&
        hasMoreItems) {
      _loadMoreItems();
    }
  }

  Future<void> _loadInitialData() async {
    currentPage = 1;
    items.clear();
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    await _fetchItems();
  }

  Future<void> _loadMoreItems() async {
    if (isLoadingMore || !hasMoreItems) return;
    currentPage++;
    await _fetchItems(isLoadingMore: true);
  }

  Future<void> _fetchItems({bool isLoadingMore = false}) async {
    if (isLoadingMore) {
      setState(() => this.isLoadingMore = true);
    }

    try {
      final newItems = await loadItems(page: currentPage);
      setState(() {
        items.addAll(newItems);
        hasMoreItems = newItems.isNotEmpty;
        this.isLoadingMore = false;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        this.isLoadingMore = false;
        isLoading = false;
        if (items.isEmpty) {
          errorMessage = e.toString();
        }
      });
      showError(e.toString());
    }
  }

  Future<void> onRefresh() async {
    await _loadInitialData();
  }

  @override
  Widget build(BuildContext context) {
    return BaseScreen(
      title: screenTitle,
      showBackButton: showBackButton,
      actions: actions,
      floatingActionButton: floatingActionButton,
      backgroundColor: backgroundColor,
      state: _getScreenState(),
      errorMessage: errorMessage,
      onRetry: _loadInitialData,
      onRefresh: onRefresh,
      emptyTitle: emptyStateTitle,
      emptySubtitle: emptyStateSubtitle,
      body: _buildList(),
    );
  }

  ScreenState _getScreenState() {
    if (isLoading) return ScreenState.loading;
    if (errorMessage != null && items.isEmpty) return ScreenState.error;
    if (items.isEmpty) return ScreenState.empty;
    return ScreenState.loaded;
  }

  Widget _buildList() {
    return ListView.separated(
      controller: scrollController,
      padding: listPadding,
      itemCount: items.length + (isLoadingMore ? 1 : 0),
      separatorBuilder: (context, index) => useSeparator
          ? const Divider()
          : const SizedBox(height: AppDimensions.spacing12),
      itemBuilder: (context, index) {
        if (index == items.length) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(AppDimensions.spacing16),
              child: CircularProgressIndicator(color: AppTheme.primaryColor),
            ),
          );
        }
        return buildListItem(context, items[index], index);
      },
    );
  }
}

/// ============================================================================
/// Base Form Screen - شاشة نموذج أساسية
/// ============================================================================
///
/// شاشة مخصصة للنماذج مع:
/// - Form validation
/// - حفظ التغييرات
/// - تحذير عند الخروج بدون حفظ
/// - حالة الإرسال

abstract class BaseFormScreen extends StatefulWidget {
  const BaseFormScreen({super.key});
}

abstract class BaseFormScreenState<T extends BaseFormScreen> extends State<T>
    with ScreenHelperMixin<T> {
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();

  bool isSubmitting = false;
  bool hasUnsavedChanges = false;

  /// عنوان الشاشة
  String get screenTitle;

  /// نص زر الإرسال
  String get submitButtonText => 'حفظ';

  /// هل نعرض زر الرجوع؟
  bool get showBackButton => true;

  /// بناء حقول النموذج
  Widget buildForm(BuildContext context);

  /// إرسال النموذج
  Future<void> onSubmit();

  /// هل النموذج صالح؟
  bool get isValid => formKey.currentState?.validate() ?? false;

  void markAsChanged() {
    if (!hasUnsavedChanges) {
      setState(() => hasUnsavedChanges = true);
    }
  }

  Future<void> _handleSubmit() async {
    if (!isValid) return;

    setState(() => isSubmitting = true);

    try {
      await onSubmit();
      hasUnsavedChanges = false;
    } catch (e) {
      showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => isSubmitting = false);
      }
    }
  }

  Future<bool> _onWillPop() async {
    if (!hasUnsavedChanges) return true;

    return await confirmAction(
      title: 'تغييرات غير محفوظة',
      message: 'هل تريد الخروج بدون حفظ التغييرات؟',
      confirmText: 'خروج',
      cancelText: 'البقاء',
      isDangerous: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !hasUnsavedChanges,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop) {
          final shouldPop = await _onWillPop();
          if (shouldPop && context.mounted) {
            Navigator.of(context).pop();
          }
        }
      },
      child: BaseScreen(
        title: screenTitle,
        showBackButton: showBackButton,
        body: SingleChildScrollView(
          padding: AppDimensions.screenPadding,
          child: Form(
            key: formKey,
            onChanged: markAsChanged,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                buildForm(context),
                const SizedBox(height: AppDimensions.spacing24),
                ElevatedButton(
                  onPressed: isSubmitting ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: AppDimensions.spacing16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppDimensions.borderRadiusM,
                    ),
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          submitButtonText,
                          style: const TextStyle(
                            fontSize: AppDimensions.fontBody,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// ============================================================================
/// Base Details Screen - شاشة تفاصيل أساسية
/// ============================================================================
///
/// شاشة مخصصة لعرض تفاصيل عنصر واحد مع:
/// - تحميل البيانات
/// - أزرار الإجراءات
/// - حالة التحميل

abstract class BaseDetailsScreen<T> extends StatefulWidget {
  const BaseDetailsScreen({super.key});
}

abstract class BaseDetailsScreenState<W extends BaseDetailsScreen<T>, T>
    extends State<W>
    with ScreenHelperMixin<W> {
  T? item;
  bool isLoading = true;
  String? errorMessage;

  /// عنوان الشاشة
  String get screenTitle;

  /// هل نعرض زر الرجوع؟
  bool get showBackButton => true;

  /// أزرار إضافية في AppBar
  List<Widget>? get actions => null;

  @override
  void initState() {
    super.initState();
    _loadItem();
  }

  /// تحميل العنصر
  Future<T> loadItem();

  /// بناء تفاصيل العنصر
  Widget buildDetails(BuildContext context, T item);

  /// أزرار الإجراءات
  List<Widget> buildActionButtons(T item) => [];

  Future<void> _loadItem() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      item = await loadItem();
      setState(() => isLoading = false);
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<void> onRefresh() async {
    await _loadItem();
  }

  @override
  Widget build(BuildContext context) {
    return BaseScreen(
      title: screenTitle,
      showBackButton: showBackButton,
      actions: actions,
      state: _getScreenState(),
      errorMessage: errorMessage,
      onRetry: _loadItem,
      onRefresh: onRefresh,
      body: _buildBody(),
    );
  }

  ScreenState _getScreenState() {
    if (isLoading) return ScreenState.loading;
    if (errorMessage != null) return ScreenState.error;
    if (item == null) return ScreenState.empty;
    return ScreenState.loaded;
  }

  Widget _buildBody() {
    if (item == null) {
      return const Center(child: Text('لم يتم العثور على العنصر'));
    }

    return SingleChildScrollView(
      padding: AppDimensions.screenPadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          buildDetails(context, item as T),
          if (buildActionButtons(item as T).isNotEmpty) ...[
            const SizedBox(height: AppDimensions.spacing24),
            ...buildActionButtons(item as T),
          ],
        ],
      ),
    );
  }
}
