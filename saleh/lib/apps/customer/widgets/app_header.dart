import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';

/// App Header - MBUY Style (Primary Color Header)
class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final int notificationCount;
  final VoidCallback? onSearchTap;
  final VoidCallback? onNotificationTap;
  final VoidCallback? onFavoriteTap;
  final VoidCallback? onAITap;

  const AppHeader({
    super.key,
    this.notificationCount = 0,
    this.onSearchTap,
    this.onNotificationTap,
    this.onFavoriteTap,
    this.onAITap,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.primaryColor,
      child: SafeArea(bottom: false, child: _buildTopRow(context)),
    );
  }

  /// Top Row: Logo, Search Bar, Icons
  Widget _buildTopRow(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        children: [
          // Logo
          const Text(
            'MBUY',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(width: 12),
          // Search Bar
          Expanded(
            child: GestureDetector(
              onTap: onSearchTap,
              child: Container(
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    Icon(Icons.search, color: Colors.grey.shade400, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'البحث',
                        style: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Icon(
                      Icons.camera_alt_outlined,
                      color: Colors.grey.shade500,
                      size: 18,
                    ),
                    const SizedBox(width: 12),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          // AI Assistant Icon
          GestureDetector(
            onTap: onAITap,
            child: const Icon(Icons.support_agent, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 16),
          // Bell Icon with Badge
          GestureDetector(
            onTap: onNotificationTap,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(
                  Icons.notifications_outlined,
                  color: Colors.white,
                  size: 24,
                ),
                if (notificationCount > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        notificationCount > 9 ? '9+' : '$notificationCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Heart Icon
          GestureDetector(
            onTap: onFavoriteTap,
            child: const Icon(Icons.favorite_outline, color: Colors.white, size: 24),
          ),
        ],
      ),
    );
  }
}
