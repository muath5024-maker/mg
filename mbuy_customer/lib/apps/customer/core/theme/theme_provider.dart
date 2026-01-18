/// Theme Provider - مزود الثيم
///
/// Manages app theme (Light/Dark mode) with persistence
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Theme mode enum
enum AppThemeMode {
  system,
  light,
  dark,
}

/// Theme state
class ThemeState {
  final AppThemeMode themeMode;
  final bool isLoaded;

  const ThemeState({
    this.themeMode = AppThemeMode.system,
    this.isLoaded = false,
  });

  ThemeState copyWith({
    AppThemeMode? themeMode,
    bool? isLoaded,
  }) {
    return ThemeState(
      themeMode: themeMode ?? this.themeMode,
      isLoaded: isLoaded ?? this.isLoaded,
    );
  }

  /// Get Flutter ThemeMode
  ThemeMode get flutterThemeMode {
    switch (themeMode) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }

  /// Check if dark mode
  bool isDarkMode(BuildContext context) {
    if (themeMode == AppThemeMode.system) {
      return MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    }
    return themeMode == AppThemeMode.dark;
  }
}

/// Theme notifier
class ThemeNotifier extends Notifier<ThemeState> {
  static const _themeKey = 'app_theme_mode';

  @override
  ThemeState build() {
    // Load saved theme on init
    _loadSavedTheme();
    return const ThemeState();
  }

  /// Load saved theme from preferences
  Future<void> _loadSavedTheme() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString(_themeKey);

      AppThemeMode themeMode = AppThemeMode.system;
      if (savedTheme != null) {
        themeMode = AppThemeMode.values.firstWhere(
          (e) => e.name == savedTheme,
          orElse: () => AppThemeMode.system,
        );
      }

      state = state.copyWith(themeMode: themeMode, isLoaded: true);
    } catch (_) {
      state = state.copyWith(isLoaded: true);
    }
  }

  /// Set theme mode
  Future<void> setThemeMode(AppThemeMode mode) async {
    state = state.copyWith(themeMode: mode);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, mode.name);
    } catch (_) {
      // Ignore save errors
    }
  }

  /// Toggle between light and dark
  Future<void> toggleTheme() async {
    final newMode = state.themeMode == AppThemeMode.dark
        ? AppThemeMode.light
        : AppThemeMode.dark;
    await setThemeMode(newMode);
  }

  /// Set to system default
  Future<void> useSystemTheme() async {
    await setThemeMode(AppThemeMode.system);
  }
}

/// Provider for theme
final themeProvider = NotifierProvider<ThemeNotifier, ThemeState>(
  ThemeNotifier.new,
);

/// Provider for current theme mode (for easy access)
final themeModeProvider = Provider<ThemeMode>((ref) {
  return ref.watch(themeProvider).flutterThemeMode;
});

/// Provider for checking if dark mode
final isDarkModeProvider = Provider.family<bool, BuildContext>((ref, context) {
  return ref.watch(themeProvider).isDarkMode(context);
});
