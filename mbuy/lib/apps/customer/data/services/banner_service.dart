/// Banner Service - خدمة البانرات
///
/// تتضمن جميع عمليات البانرات والمحتوى الترويجي:
/// - بانرات الصفحة الرئيسية
library;

import '../api/api.dart';

/// Banner Service for handling all banner-related API calls
class BannerService {
  final BaseApiClient _client;

  BannerService(this._client);

  /// Get home banners
  Future<ApiResponse<List<Map<String, dynamic>>>> getHomeBanners() async {
    return _client.get(
      '/api/public/banners',
      parser: (data) {
        if (data is List) {
          return data.map((e) => e as Map<String, dynamic>).toList();
        }
        return <Map<String, dynamic>>[];
      },
    );
  }

  /// Get promotional banners
  Future<ApiResponse<List<Map<String, dynamic>>>> getPromotionalBanners({
    String? position,
  }) async {
    final queryParams = <String, String>{};
    if (position != null) queryParams['position'] = position;

    return _client.get(
      '/api/public/banners/promotional',
      queryParams: queryParams.isNotEmpty ? queryParams : null,
      parser: (data) {
        if (data is List) {
          return data.map((e) => e as Map<String, dynamic>).toList();
        }
        return <Map<String, dynamic>>[];
      },
    );
  }
}
