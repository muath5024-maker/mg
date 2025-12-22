import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/exports.dart';

/// ============================================================================
/// Widget Catalog - كتالوج المكونات
/// ============================================================================
///
/// صفحة لعرض جميع المكونات المشتركة في التطبيق
/// تُستخدم للمطورين والمصممين لمراجعة المكونات المتاحة
///
/// للوصول إليها أثناء التطوير فقط

class WidgetCatalogScreen extends ConsumerStatefulWidget {
  const WidgetCatalogScreen({super.key});

  @override
  ConsumerState<WidgetCatalogScreen> createState() =>
      _WidgetCatalogScreenState();
}

class _WidgetCatalogScreenState extends ConsumerState<WidgetCatalogScreen> {
  int _selectedIndex = 0;

  final List<_CatalogSection> _sections = [
    _CatalogSection(
      title: 'الأزرار',
      icon: Icons.touch_app,
      builder: (context) => const _ButtonsSection(),
    ),
    _CatalogSection(
      title: 'البطاقات',
      icon: Icons.credit_card,
      builder: (context) => const _CardsSection(),
    ),
    _CatalogSection(
      title: 'حقول الإدخال',
      icon: Icons.text_fields,
      builder: (context) => const _InputsSection(),
    ),
    _CatalogSection(
      title: 'الحالات',
      icon: Icons.info_outline,
      builder: (context) => const _StatesSection(),
    ),
    _CatalogSection(
      title: 'التنقل',
      icon: Icons.navigation,
      builder: (context) => const _NavigationSection(),
    ),
    _CatalogSection(
      title: 'الأيقونات',
      icon: Icons.emoji_symbols,
      builder: (context) => const _IconsSection(),
    ),
    _CatalogSection(
      title: 'الأفاتار',
      icon: Icons.account_circle,
      builder: (context) => const _AvatarSection(),
    ),
    _CatalogSection(
      title: 'الشرائح',
      icon: Icons.label,
      builder: (context) => const _ChipsSection(),
    ),
    _CatalogSection(
      title: 'الحوارات',
      icon: Icons.message,
      builder: (context) => const _DialogsSection(),
    ),
    _CatalogSection(
      title: 'التحميل',
      icon: Icons.hourglass_empty,
      builder: (context) => const _SkeletonSection(),
    ),
    _CatalogSection(
      title: 'SVG أيقونات',
      icon: Icons.image,
      builder: (context) => const _SvgIconsSection(),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Widget Catalog'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Row(
        children: [
          // Sidebar
          Container(
            width: 200,
            color: AppTheme.surfaceColor,
            child: ListView.builder(
              itemCount: _sections.length,
              itemBuilder: (context, index) {
                final section = _sections[index];
                final isSelected = index == _selectedIndex;
                return ListTile(
                  leading: Icon(
                    section.icon,
                    color: isSelected
                        ? AppTheme.primaryColor
                        : AppTheme.textSecondaryColor,
                  ),
                  title: Text(
                    section.title,
                    style: TextStyle(
                      color: isSelected
                          ? AppTheme.primaryColor
                          : AppTheme.textPrimaryColor,
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                    ),
                  ),
                  selected: isSelected,
                  selectedTileColor: AppTheme.primaryColor.withValues(
                    alpha: 0.1,
                  ),
                  onTap: () => setState(() => _selectedIndex = index),
                );
              },
            ),
          ),
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: _sections[_selectedIndex].builder(context),
            ),
          ),
        ],
      ),
    );
  }
}

class _CatalogSection {
  final String title;
  final IconData icon;
  final Widget Function(BuildContext context) builder;

  _CatalogSection({
    required this.title,
    required this.icon,
    required this.builder,
  });
}

/// ============================================================================
/// Buttons Section - قسم الأزرار
/// ============================================================================
class _ButtonsSection extends StatelessWidget {
  const _ButtonsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('الأزرار الرئيسية'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            MbuyPrimaryButton(label: 'زر رئيسي', onPressed: () {}),
            const MbuyPrimaryButton(label: 'معطل', onPressed: null),
            const MbuyPrimaryButton(label: 'جاري التحميل', isLoading: true),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('أزرار MBUY'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            MbuyButton(
              text: 'Primary',
              type: MbuyButtonType.primary,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'Secondary',
              type: MbuyButtonType.secondary,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'Outline',
              type: MbuyButtonType.outline,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'Text',
              type: MbuyButtonType.text,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'مع أيقونة',
              type: MbuyButtonType.primary,
              icon: Icons.add,
              onPressed: () {},
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('أحجام الأزرار'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            MbuyButton(
              text: 'صغير',
              size: MbuyButtonSize.small,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'متوسط',
              size: MbuyButtonSize.medium,
              onPressed: () {},
            ),
            MbuyButton(
              text: 'كبير',
              size: MbuyButtonSize.large,
              onPressed: () {},
            ),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// Cards Section - قسم البطاقات
/// ============================================================================
class _CardsSection extends StatelessWidget {
  const _CardsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('بطاقات MBUY'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            SizedBox(
              width: 300,
              child: MbuyCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'بطاقة عادية',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text('هذا مثال على بطاقة MBUY'),
                  ],
                ),
              ),
            ),
            SizedBox(
              width: 300,
              child: MbuyCard.flat(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'بطاقة مسطحة',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text('بدون ظل'),
                  ],
                ),
              ),
            ),
            SizedBox(
              width: 300,
              child: MbuyCard.elevated(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'بطاقة مرتفعة',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Text('مع ظل مميز'),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('بطاقات زجاجية'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const SizedBox(
            width: 300,
            child: GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Glass Card',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'تأثير زجاجي شفاف',
                    style: TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// ============================================================================
/// Inputs Section - قسم حقول الإدخال
/// ============================================================================
class _InputsSection extends StatelessWidget {
  const _InputsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('حقول النص'),
        const SizedBox(height: 16),
        const SizedBox(
          width: 400,
          child: Column(
            children: [
              MbuyTextField(label: 'حقل عادي', hint: 'أدخل النص هنا'),
              SizedBox(height: 16),
              MbuyTextField(
                label: 'مع أيقونة',
                hint: 'البحث',
                prefixIcon: Icons.search,
              ),
              SizedBox(height: 16),
              MbuyTextField(
                label: 'كلمة المرور',
                hint: 'أدخل كلمة المرور',
                obscureText: true,
              ),
              SizedBox(height: 16),
              MbuyTextField(
                label: 'متعدد الأسطر',
                hint: 'أدخل وصفاً تفصيلياً',
                maxLines: 3,
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('القوائم المنسدلة'),
        const SizedBox(height: 16),
        SizedBox(
          width: 400,
          child: MbuyDropdown<String>(
            label: 'اختر التصنيف',
            hint: 'اختر...',
            value: null,
            items: const [
              DropdownMenuItem(value: 'cat1', child: Text('إلكترونيات')),
              DropdownMenuItem(value: 'cat2', child: Text('ملابس')),
              DropdownMenuItem(value: 'cat3', child: Text('أجهزة منزلية')),
            ],
            onChanged: (value) {},
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('المفاتيح'),
        const SizedBox(height: 16),
        Column(
          children: [
            Row(
              children: [
                MbuySwitch(value: true, onChanged: (value) {}),
                const SizedBox(width: 8),
                const Text('مفعل'),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                MbuySwitch(value: false, onChanged: (value) {}),
                const SizedBox(width: 8),
                const Text('معطل'),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// States Section - قسم الحالات
/// ============================================================================
class _StatesSection extends StatelessWidget {
  const _StatesSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('حالة التحميل'),
        const SizedBox(height: 16),
        Container(
          height: 150,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Center(child: MbuyLoadingIndicator()),
        ),
        const SizedBox(height: 32),
        _SectionTitle('حالة فارغة'),
        const SizedBox(height: 16),
        Container(
          height: 300,
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: MbuyEmptyState(
            icon: Icons.inbox_outlined,
            title: 'لا توجد منتجات',
            subtitle: 'أضف منتجات جديدة لتظهر هنا',
            buttonLabel: 'إضافة منتج',
            onButtonPressed: () {},
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('الشارات'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: const [
            MbuyBadge(label: '5'),
            MbuyBadge(label: 'جديد', backgroundColor: Colors.green),
            MbuyBadge(label: 'تخفيض', backgroundColor: Colors.red),
            MbuyBadge(label: 'مميز', backgroundColor: Colors.orange),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// Navigation Section - قسم التنقل
/// ============================================================================
class _NavigationSection extends StatelessWidget {
  const _NavigationSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('شريط التطبيق'),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: const ClipRRect(
            borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            child: MbuyAppBar(
              title: 'عنوان الصفحة',
              showBackButton: true,
              actions: [
                IconButton(icon: Icon(Icons.search), onPressed: null),
                IconButton(
                  icon: Icon(Icons.notifications_outlined),
                  onPressed: null,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('عناصر القائمة'),
        const SizedBox(height: 16),
        SizedBox(
          width: 400,
          child: Column(
            children: [
              MbuyListTile(
                leading: const Icon(Icons.person),
                title: 'الملف الشخصي',
                subtitle: 'إدارة معلوماتك',
                trailing: const Icon(Icons.chevron_left),
                onTap: () {},
              ),
              MbuyListTile(
                leading: const Icon(Icons.settings),
                title: 'الإعدادات',
                subtitle: 'تخصيص التطبيق',
                trailing: const Icon(Icons.chevron_left),
                onTap: () {},
              ),
              MbuyListTile(
                leading: const Icon(Icons.help_outline),
                title: 'المساعدة',
                trailing: const Icon(Icons.chevron_left),
                onTap: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// ============================================================================
/// Icons Section - قسم الأيقونات
/// ============================================================================
class _IconsSection extends StatelessWidget {
  const _IconsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('الألوان الأساسية'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _ColorSwatch('Primary', AppTheme.primaryColor),
            _ColorSwatch('Secondary', AppTheme.secondaryColor),
            _ColorSwatch('Success', AppTheme.successColor),
            _ColorSwatch('Warning', AppTheme.warningColor),
            _ColorSwatch('Error', AppTheme.errorColor),
            _ColorSwatch('Info', AppTheme.infoColor),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('ألوان الخلفية'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _ColorSwatch('Background', AppTheme.backgroundColor),
            _ColorSwatch('Surface', AppTheme.surfaceColor),
            _ColorSwatch('Border', AppTheme.borderColor),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('ألوان النص'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'نص رئيسي',
                style: TextStyle(
                  color: AppTheme.textPrimaryColor,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'نص ثانوي',
                style: TextStyle(
                  color: AppTheme.textSecondaryColor,
                  fontSize: 14,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'نص معطل',
                style: TextStyle(color: Colors.grey, fontSize: 14),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('الأبعاد'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _DimensionRow('spacing8', AppDimensions.spacing8),
              _DimensionRow('spacing12', AppDimensions.spacing12),
              _DimensionRow('spacing16', AppDimensions.spacing16),
              _DimensionRow('spacing24', AppDimensions.spacing24),
              _DimensionRow('spacing32', AppDimensions.spacing32),
              const Divider(),
              _DimensionRow('radiusS', AppDimensions.radiusS),
              _DimensionRow('radiusM', AppDimensions.radiusM),
              _DimensionRow('radiusL', AppDimensions.radiusL),
            ],
          ),
        ),
      ],
    );
  }
}

/// ============================================================================
/// Helper Widgets
/// ============================================================================

class _SectionTitle extends StatelessWidget {
  final String title;

  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: AppTheme.textPrimaryColor,
      ),
    );
  }
}

class _ColorSwatch extends StatelessWidget {
  final String name;
  final Color color;

  const _ColorSwatch(this.name, this.color);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.borderColor),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: const TextStyle(
            fontSize: 12,
            color: AppTheme.textSecondaryColor,
          ),
        ),
      ],
    );
  }
}

class _DimensionRow extends StatelessWidget {
  final String name;
  final double value;

  const _DimensionRow(this.name, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              name,
              style: const TextStyle(
                fontFamily: 'monospace',
                color: AppTheme.textSecondaryColor,
              ),
            ),
          ),
          Container(
            width: value,
            height: 20,
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
          ),
          const SizedBox(width: 8),
          Text(
            '${value.toInt()}px',
            style: const TextStyle(color: AppTheme.textSecondaryColor),
          ),
        ],
      ),
    );
  }
}

/// ============================================================================
/// Avatar Section - قسم الأفاتار
/// ============================================================================
class _AvatarSection extends StatelessWidget {
  const _AvatarSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('أفاتار المستخدم'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 24,
          runSpacing: 16,
          children: [
            Column(
              children: [
                MbuyAvatar(name: 'أحمد محمد', size: MbuyAvatarSize.small),
                const SizedBox(height: 8),
                const Text('صغير'),
              ],
            ),
            Column(
              children: [
                MbuyAvatar(name: 'سارة علي', size: MbuyAvatarSize.medium),
                const SizedBox(height: 8),
                const Text('متوسط'),
              ],
            ),
            Column(
              children: [
                MbuyAvatar(name: 'محمد خالد', size: MbuyAvatarSize.large),
                const SizedBox(height: 8),
                const Text('كبير'),
              ],
            ),
            Column(
              children: [
                MbuyAvatar(name: 'خالد أحمد', size: MbuyAvatarSize.xl),
                const SizedBox(height: 8),
                const Text('كبير جداً'),
              ],
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('أفاتار مع صورة'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 24,
          runSpacing: 16,
          children: [
            MbuyAvatar.image(
              imageUrl: 'https://i.pravatar.cc/150?img=1',
              size: MbuyAvatarSize.medium,
            ),
            MbuyAvatar.image(
              imageUrl: 'https://i.pravatar.cc/150?img=2',
              size: MbuyAvatarSize.medium,
            ),
            MbuyAvatar.image(
              imageUrl: 'https://i.pravatar.cc/150?img=3',
              size: MbuyAvatarSize.medium,
            ),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// Chips Section - قسم الشرائح
/// ============================================================================
class _ChipsSection extends StatelessWidget {
  const _ChipsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('شرائح الفلتر'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            MbuyChip.filter(label: 'إلكترونيات', selected: true, onTap: () {}),
            MbuyChip.filter(label: 'ملابس', selected: false, onTap: () {}),
            MbuyChip(label: 'أجهزة منزلية', selected: false, onTap: () {}),
            MbuyChip(label: 'رياضة', selected: true, onTap: () {}),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('شرائح مع أيقونة'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            MbuyChip(
              label: 'مفضل',
              icon: Icons.favorite,
              selected: true,
              onTap: () {},
            ),
            MbuyChip(
              label: 'جديد',
              icon: Icons.fiber_new,
              selected: false,
              onTap: () {},
            ),
            MbuyChip(
              label: 'تخفيض',
              icon: Icons.local_offer,
              selected: false,
              onTap: () {},
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('شرائح إدخال (قابلة للحذف)'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            MbuyChip.input(label: 'تقنية', onDeleted: () {}),
            MbuyChip.input(label: 'موضة', onDeleted: () {}),
            MbuyChip.input(label: 'صحة', onDeleted: () {}),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('الوسوم'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            MbuyTag.success('نجاح'),
            MbuyTag.error('خطأ'),
            MbuyTag.warning('تحذير'),
            MbuyTag.info('معلومات'),
            MbuyTag.primary('أساسي'),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// Dialogs Section - قسم الحوارات
/// ============================================================================
class _DialogsSection extends StatelessWidget {
  const _DialogsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('الحوارات'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            MbuyButton(
              text: 'حوار تأكيد',
              type: MbuyButtonType.primary,
              onPressed: () {
                MbuyDialog.showConfirm(
                  context,
                  title: 'تأكيد الحذف',
                  content: 'هل أنت متأكد من حذف هذا العنصر؟',
                  confirmText: 'حذف',
                  cancelText: 'إلغاء',
                );
              },
            ),
            MbuyButton(
              text: 'حوار حذف',
              type: MbuyButtonType.secondary,
              onPressed: () {
                MbuyDialog.showDelete(
                  context,
                  title: 'حذف العنصر',
                  content: 'سيتم حذف هذا العنصر نهائياً',
                );
              },
            ),
            MbuyButton(
              text: 'حوار عام',
              type: MbuyButtonType.outline,
              onPressed: () {
                MbuyDialog.show(
                  context,
                  title: 'معلومات',
                  content: 'تم حفظ التغييرات بنجاح!',
                  icon: Icons.check_circle,
                  iconColor: AppTheme.successColor,
                  confirmText: 'حسناً',
                );
              },
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('النوافذ السفلية'),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            MbuyButton(
              text: 'نافذة سفلية',
              type: MbuyButtonType.primary,
              onPressed: () {
                MbuyBottomSheet.show(
                  context,
                  title: 'اختر خياراً',
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ListTile(
                        leading: const Icon(Icons.camera_alt),
                        title: const Text('التقاط صورة'),
                        onTap: () => Navigator.pop(context),
                      ),
                      ListTile(
                        leading: const Icon(Icons.photo_library),
                        title: const Text('اختيار من المعرض'),
                        onTap: () => Navigator.pop(context),
                      ),
                      ListTile(
                        leading: const Icon(Icons.delete),
                        title: const Text('حذف الصورة'),
                        onTap: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ],
    );
  }
}

/// ============================================================================
/// Skeleton Section - قسم التحميل الهيكلي
/// ============================================================================
class _SkeletonSection extends StatelessWidget {
  const _SkeletonSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('التحميل الهيكلي'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              SkeletonBox(width: 200, height: 20),
              SizedBox(height: 12),
              SkeletonBox(width: double.infinity, height: 16),
              SizedBox(height: 8),
              SkeletonBox(width: 150, height: 16),
            ],
          ),
        ),
        const SizedBox(height: 32),
        _SectionTitle('بطاقة تحميل'),
        const SizedBox(height: 16),
        const SizedBox(width: 300, child: SkeletonCard()),
        const SizedBox(height: 32),
        _SectionTitle('قائمة تحميل'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Column(
            children: [
              SkeletonListTile(),
              SizedBox(height: 16),
              SkeletonListTile(),
              SizedBox(height: 16),
              SkeletonListTile(),
            ],
          ),
        ),
      ],
    );
  }
}

/// ============================================================================
/// SVG Icons Section - قسم أيقونات SVG
/// ============================================================================
class _SvgIconsSection extends StatelessWidget {
  const _SvgIconsSection();

  @override
  Widget build(BuildContext context) {
    final icons = [
      ('home', AppIcons.home),
      ('store', AppIcons.store),
      ('cart', AppIcons.cart),
      ('orders', AppIcons.orders),
      ('product', AppIcons.product),
      ('wallet', AppIcons.wallet),
      ('notifications', AppIcons.notifications),
      ('settings', AppIcons.settings),
      ('search', AppIcons.search),
      ('add', AppIcons.add),
      ('edit', AppIcons.edit),
      ('delete', AppIcons.delete),
      ('share', AppIcons.share),
      ('download', AppIcons.download),
      ('upload', AppIcons.upload),
      ('check', AppIcons.check),
      ('close', AppIcons.close),
      ('error', AppIcons.error),
      ('warning', AppIcons.warning),
      ('info', AppIcons.info),
      ('star', AppIcons.star),
      ('heart', AppIcons.heart),
      ('chat', AppIcons.chat),
      ('shipping', AppIcons.shipping),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionTitle('أيقونات SVG (AppIcons)'),
        const SizedBox(height: 8),
        Text(
          'استخدم: AppIcon(AppIcons.home)',
          style: TextStyle(
            color: AppTheme.textSecondaryColor,
            fontFamily: 'monospace',
          ),
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: icons.map((icon) {
            return Container(
              width: 80,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceColor,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.borderColor),
              ),
              child: Column(
                children: [
                  AppIcon(icon.$2, size: 28),
                  const SizedBox(height: 8),
                  Text(
                    icon.$1,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppTheme.textSecondaryColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 32),
        _SectionTitle('أحجام الأيقونات'),
        const SizedBox(height: 16),
        Row(
          children: [
            Column(
              children: [
                AppIcon(AppIcons.home, size: 16),
                const SizedBox(height: 4),
                const Text('16px'),
              ],
            ),
            const SizedBox(width: 24),
            Column(
              children: [
                AppIcon(AppIcons.home, size: 24),
                const SizedBox(height: 4),
                const Text('24px'),
              ],
            ),
            const SizedBox(width: 24),
            Column(
              children: [
                AppIcon(AppIcons.home, size: 32),
                const SizedBox(height: 4),
                const Text('32px'),
              ],
            ),
            const SizedBox(width: 24),
            Column(
              children: [
                AppIcon(AppIcons.home, size: 48),
                const SizedBox(height: 4),
                const Text('48px'),
              ],
            ),
          ],
        ),
        const SizedBox(height: 32),
        _SectionTitle('أيقونات ملونة'),
        const SizedBox(height: 16),
        Row(
          children: [
            AppIcon(AppIcons.heart, size: 32, color: AppTheme.errorColor),
            const SizedBox(width: 16),
            AppIcon(AppIcons.check, size: 32, color: AppTheme.successColor),
            const SizedBox(width: 16),
            AppIcon(AppIcons.warning, size: 32, color: AppTheme.warningColor),
            const SizedBox(width: 16),
            AppIcon(AppIcons.info, size: 32, color: AppTheme.infoColor),
          ],
        ),
      ],
    );
  }
}
