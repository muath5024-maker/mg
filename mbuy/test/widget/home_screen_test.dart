/// Home Screen Widget Tests
///
/// اختبارات لشاشة الرئيسية
library;

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mbuy/apps/customer/features/home/home_screen.dart';

// Mock HttpOverrides to avoid network calls during tests
class TestHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)
      ..badCertificateCallback =
          (X509Certificate cert, String host, int port) => true;
  }
}

// Helper to wrap widget with necessary providers
Widget createHomeScreen() {
  return ProviderScope(child: MaterialApp(home: const HomeScreen()));
}

void main() {
  setUpAll(() {
    HttpOverrides.global = TestHttpOverrides();
  });

  group('HomeScreen', () {
    testWidgets('should render search bar', (tester) async {
      await tester.pumpWidget(createHomeScreen());

      // Find search field
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('ابحث عن المنتجات...'), findsOneWidget);
    });

    testWidgets('should render categories section', (tester) async {
      await tester.pumpWidget(createHomeScreen());

      expect(find.text('التصنيفات'), findsOneWidget);
    });

    testWidgets('should render flash deals section', (tester) async {
      await tester.pumpWidget(createHomeScreen());

      expect(find.text('عروض خاطفة'), findsOneWidget);
    });
  });
}
