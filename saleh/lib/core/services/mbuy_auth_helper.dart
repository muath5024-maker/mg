import 'package:flutter/foundation.dart';
import '../../features/auth/data/mbuy_auth_service.dart';

/// Helper class to provide Supabase-like User object from MBUY Auth
class MbuyUser {
  final String id;
  final String? email;
  final String? fullName;
  final Map<String, dynamic> data;

  MbuyUser({
    required this.id,
    this.email,
    this.fullName,
    Map<String, dynamic>? data,
  }) : data = data ?? {};

  factory MbuyUser.fromMap(Map<String, dynamic> map) {
    return MbuyUser(
      id: map['id'] as String,
      email: map['email'] as String?,
      fullName: map['full_name'] as String?,
      data: map,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      ...data,
    };
  }
}

/// Helper class to check auth state similar to Supabase
class MbuyAuthHelper {
  /// Get current user (similar to supabaseClient.auth.currentUser)
  static Future<MbuyUser?> getCurrentUser() async {
    try {
      final userInfo = await MbuyAuthService.getCurrentUserInfo();
      if (userInfo == null) {
        return null;
      }
      return MbuyUser.fromMap(userInfo);
    } catch (e) {
      debugPrint('[MbuyAuthHelper] Error getting current user: $e');
      return null;
    }
  }

  /// Check if user is signed in
  static Future<bool> isSignedIn() async {
    return await MbuyAuthService.isLoggedIn();
  }

  /// Get current user ID (similar to supabaseClient.auth.currentUser?.id)
  /// This is a convenience method for backward compatibility
  static Future<String?> getCurrentUserId() async {
    return await MbuyAuthService.getUserId();
  }

  /// Get current user email
  static Future<String?> getCurrentUserEmail() async {
    return await MbuyAuthService.getUserEmail();
  }

  /// Check if user is authenticated (similar to supabaseClient.auth.currentUser != null)
  static Future<bool> hasCurrentUser() async {
    return await MbuyAuthService.isLoggedIn();
  }
}

