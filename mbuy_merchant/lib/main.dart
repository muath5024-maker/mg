import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/services/remote_config_service.dart';
import 'apps/merchant/merchant_app.dart';
import 'shared/widgets/error_boundary.dart';

/// MBUY Merchant Application
/// تطبيق التاجر - لوحة تحكم إدارة المتجر
///
/// Clean Architecture - Worker-Only Backend
/// This app communicates exclusively with Cloudflare Worker
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // تهيئة معالج الأخطاء العام
  GlobalErrorHandler().initialize();

  // Lock orientation to portrait mode
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // تهيئة Firebase مع معالجة الأخطاء
  try {
    await Firebase.initializeApp();
    debugPrint('[Main] ✅ Firebase initialized successfully');
  } catch (e) {
    debugPrint('[Main] ❌ Firebase initialization failed: $e');
    // استمر في تشغيل التطبيق حتى لو فشل Firebase
  }

  // تهيئة Remote Config مع معالجة الأخطاء
  try {
    await RemoteConfigService.instance.initialize();
    debugPrint('[Main] ✅ RemoteConfig initialized successfully');
  } catch (e) {
    debugPrint('[Main] ❌ RemoteConfig initialization failed: $e');
    // استمر في تشغيل التطبيق حتى لو فشل RemoteConfig
  }

  runApp(const ProviderScope(child: MerchantApp()));
}
