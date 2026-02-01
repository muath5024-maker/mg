import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/services/remote_config_service.dart';
import 'apps/customer/customer_app.dart';
import 'shared/widgets/error_boundary.dart';

/// MBUY Customer Application
/// Clean Architecture - Customer-Only Marketplace
///
/// This is a dedicated customer shopping application
/// منفصل تماماً عن تطبيق التاجر
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // تهيئة معالج الأخطاء العام
  GlobalErrorHandler().initialize();

  // Lock orientation to portrait mode
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // تهيئة Firebase
  await Firebase.initializeApp();

  // تهيئة Remote Config
  await RemoteConfigService.instance.initialize();

  runApp(const ProviderScope(child: CustomerApp()));
}
