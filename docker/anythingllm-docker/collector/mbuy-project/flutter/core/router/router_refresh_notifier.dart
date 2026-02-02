import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/data/auth_controller.dart';

/// A [ChangeNotifier] that notifies listeners when the router should refresh.
class RouterRefreshNotifier extends ChangeNotifier {
  final Ref ref;

  RouterRefreshNotifier(this.ref) {
    ref.listen<AuthState>(
      authControllerProvider,
      (previous, next) => notifyListeners(),
    );
  }
}
