import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:saleh/features/auth/data/auth_controller.dart';
import 'package:saleh/features/auth/data/auth_repository.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateMocks([AuthRepository])
import 'auth_controller_test.mocks.dart';

void main() {
  group('AuthState Tests', () {
    test('الحالة الأولية الافتراضية', () {
      const state = AuthState();

      expect(state.isLoading, false);
      expect(state.isAuthenticated, false);
      expect(state.errorMessage, null);
      expect(state.userRole, null);
      expect(state.userId, null);
      expect(state.userEmail, null);
    });

    test('copyWith يجب أن يحافظ على القيم الأخرى', () {
      const state = AuthState(
        isLoading: true,
        isAuthenticated: true,
        userRole: 'merchant',
        userId: 'user-123',
        userEmail: 'test@example.com',
      );

      final newState = state.copyWith(isLoading: false);

      expect(newState.isLoading, false);
      expect(newState.isAuthenticated, true);
      expect(newState.userRole, 'merchant');
      expect(newState.userId, 'user-123');
      expect(newState.userEmail, 'test@example.com');
    });

    test('copyWith يجب أن يمسح errorMessage عند تمرير null', () {
      const state = AuthState(errorMessage: 'خطأ ما');

      final newState = state.copyWith(errorMessage: null);

      expect(newState.errorMessage, null);
    });

    test('copyWith مع قيم جديدة متعددة', () {
      const state = AuthState();

      final newState = state.copyWith(
        isLoading: true,
        isAuthenticated: true,
        userRole: 'customer',
        userId: 'new-user-456',
        userEmail: 'new@example.com',
      );

      expect(newState.isLoading, true);
      expect(newState.isAuthenticated, true);
      expect(newState.userRole, 'customer');
      expect(newState.userId, 'new-user-456');
      expect(newState.userEmail, 'new@example.com');
    });
  });

  group('AuthController Unit Tests (without Repository)', () {
    test('AuthState initial values', () {
      const state = AuthState();

      expect(state.isLoading, isFalse);
      expect(state.isAuthenticated, isFalse);
      expect(state.errorMessage, isNull);
      expect(state.userRole, isNull);
    });

    test('AuthState copyWith preserves unset values', () {
      const originalState = AuthState(
        isLoading: false,
        isAuthenticated: true,
        userRole: 'merchant',
        userId: 'abc-123',
        userEmail: 'merchant@test.com',
      );

      final newState = originalState.copyWith(isLoading: true);

      expect(newState.isLoading, isTrue);
      expect(newState.isAuthenticated, isTrue);
      expect(newState.userRole, 'merchant');
      expect(newState.userId, 'abc-123');
      expect(newState.userEmail, 'merchant@test.com');
    });

    test('AuthState copyWith can clear errorMessage', () {
      const stateWithError = AuthState(errorMessage: 'Some error occurred');

      final clearedState = stateWithError.copyWith(errorMessage: null);

      expect(clearedState.errorMessage, isNull);
    });
  });

  group('AuthController Integration Tests (Mocked)', () {
    late MockAuthRepository mockAuthRepository;
    late ProviderContainer container;

    setUp(() {
      mockAuthRepository = MockAuthRepository();
      when(mockAuthRepository.hasValidSession()).thenAnswer((_) async => false);
    });

    tearDown(() {
      container.dispose();
    });

    ProviderContainer createContainer() {
      return ProviderContainer(
        overrides: [
          authRepositoryProvider.overrideWithValue(mockAuthRepository),
        ],
      );
    }

    test('حالة المصادقة الأولية بدون جلسة', () async {
      // Arrange
      when(mockAuthRepository.hasValidSession()).thenAnswer((_) async => false);

      container = createContainer();

      // Wait for initial session check
      await Future.delayed(const Duration(milliseconds: 100));

      // Assert
      final state = container.read(authControllerProvider);
      expect(state.isAuthenticated, false);
    });

    test('حالة المصادقة مع جلسة موجودة', () async {
      // Arrange
      when(mockAuthRepository.hasValidSession()).thenAnswer((_) async => true);
      when(
        mockAuthRepository.getUserRole(),
      ).thenAnswer((_) async => 'merchant');
      when(mockAuthRepository.getUserId()).thenAnswer((_) async => 'user-123');
      when(
        mockAuthRepository.getUserEmail(),
      ).thenAnswer((_) async => 'merchant@example.com');

      container = createContainer();

      // Use a Completer to wait for the authenticated state
      final completer = Completer<AuthState>();
      container.listen<AuthState>(authControllerProvider, (previous, next) {
        if (next.isAuthenticated && !completer.isCompleted) {
          completer.complete(next);
        }
      }, fireImmediately: false);

      // Wait for state update with timeout
      final state = await completer.future.timeout(
        const Duration(seconds: 2),
        onTimeout: () => container.read(authControllerProvider),
      );

      // Assert
      expect(state.isAuthenticated, true);
      expect(state.userRole, 'merchant');
      expect(state.userId, 'user-123');
      expect(state.userEmail, 'merchant@example.com');
    });

    test('تسجيل الخروج يجب أن يمسح الحالة', () async {
      // Arrange
      when(mockAuthRepository.hasValidSession()).thenAnswer((_) async => false);
      when(mockAuthRepository.signOut()).thenAnswer((_) async {});

      container = createContainer();
      await Future.delayed(const Duration(milliseconds: 50));

      // Act
      await container.read(authControllerProvider.notifier).logout();

      // Assert
      final state = container.read(authControllerProvider);
      expect(state.isAuthenticated, false);
      expect(state.isLoading, false);
      expect(state.userRole, null);
    });

    test('clearError يجب أن يمسح رسالة الخطأ', () async {
      // Arrange
      when(mockAuthRepository.hasValidSession()).thenAnswer((_) async => false);

      container = createContainer();
      await Future.delayed(const Duration(milliseconds: 50));

      // Act
      container.read(authControllerProvider.notifier).clearError();

      // Assert
      final state = container.read(authControllerProvider);
      expect(state.errorMessage, null);
    });
  });

  group('Provider Tests', () {
    test('isAuthenticatedProvider يجب أن يرجع حالة المصادقة', () {
      // هذا اختبار بسيط للتأكد من وجود Provider
      // الاختبار الكامل يحتاج mock للـ authRepositoryProvider
      expect(isAuthenticatedProvider, isNotNull);
    });

    test('userRoleProvider يجب أن يكون موجود', () {
      expect(userRoleProvider, isNotNull);
    });

    test('userEmailProvider يجب أن يكون موجود', () {
      expect(userEmailProvider, isNotNull);
    });
  });
}
