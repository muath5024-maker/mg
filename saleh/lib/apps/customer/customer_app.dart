import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'routes/customer_router.dart';

/// تطبيق العميل - السوق للتسوق والشراء
/// منفصل تماماً عن تطبيق التاجر
class CustomerApp extends ConsumerStatefulWidget {
  const CustomerApp({super.key});

  @override
  ConsumerState<CustomerApp> createState() => _CustomerAppState();
}

class _CustomerAppState extends ConsumerState<CustomerApp> {
  late final router = CustomerRouter.createRouter(ref);

  @override
  void initState() {
    super.initState();
    // Set status bar style based on theme
    _updateSystemUI();
  }

  void _updateSystemUI() {
    final themeState = ref.read(themeProvider);
    final isDark = themeState.themeMode == AppThemeMode.dark;

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Watch theme changes
    final themeState = ref.watch(themeProvider);

    // Update system UI when theme changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateSystemUIForContext(context, themeState);
    });

    return MaterialApp.router(
      title: 'MBUY',
      debugShowCheckedModeBanner: false,

      // Theme - Light & Dark Mode Support
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeState.flutterThemeMode,

      // Arabic RTL Support
      locale: const Locale('ar'),
      builder: (context, child) {
        return Directionality(textDirection: TextDirection.rtl, child: child!);
      },

      // Router خاص بالعميل فقط
      routerConfig: router,

      // Localization
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('ar'), Locale('en')],
    );
  }

  void _updateSystemUIForContext(BuildContext context, ThemeState themeState) {
    final isDark = themeState.isDarkMode(context);

    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
        systemNavigationBarColor:
            isDark ? AppTheme.darkSurface : AppTheme.navBarBackground,
        systemNavigationBarIconBrightness:
            isDark ? Brightness.light : Brightness.dark,
      ),
    );
  }
}
