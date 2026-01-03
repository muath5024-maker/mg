import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'core/theme/app_theme.dart';
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
    // Set status bar style
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MBUY',
      debugShowCheckedModeBanner: false,

      // Theme - Dark Brown Theme
      theme: AppTheme.lightTheme,
      
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
}
