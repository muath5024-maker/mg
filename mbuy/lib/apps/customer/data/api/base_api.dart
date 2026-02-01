/// Base API Client - العميل الأساسي للـ HTTP
///
/// يوفر:
/// - معالجة HTTP requests (GET, POST, PUT, DELETE)
/// - معالجة الأخطاء والـ retry logic
/// - إدارة التوثيق (Bearer tokens)
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../../../../core/app_config.dart';
import 'api_response.dart';

// =====================================================
// BASE API CLIENT
// =====================================================

/// Base API client with error handling and retry logic
class BaseApiClient {
  final http.Client _client;
  String? _authToken;
  String? _refreshToken;

  /// Enable logging for debug mode
  final bool enableLogging;

  /// Request timeout duration
  final Duration timeout;

  /// Maximum retry attempts
  final int maxRetries;

  /// Callback when token needs refresh
  Future<String?> Function()? onTokenRefresh;

  /// Callback when authentication fails completely
  void Function()? onAuthFailure;

  BaseApiClient({
    http.Client? client,
    this.enableLogging = false,
    this.timeout = const Duration(seconds: 30),
    this.maxRetries = 3,
  }) : _client = client ?? http.Client();

  /// Set authentication tokens
  void setAuthToken(String? token, {String? refreshToken}) {
    _authToken = token;
    _refreshToken = refreshToken;
  }

  /// Clear authentication
  void clearAuth() {
    _authToken = null;
    _refreshToken = null;
  }

  /// Check if authenticated
  bool get isAuthenticated => _authToken != null;

  /// Get refresh token
  String? get refreshToken => _refreshToken;

  /// Get default headers
  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (_authToken != null) 'Authorization': 'Bearer $_authToken',
  };

  /// Log messages in debug mode
  void _log(String message) {
    if (enableLogging) {
      // ignore: avoid_print
      print('[API] $message');
    }
  }

  // =====================================================
  // HTTP METHODS
  // =====================================================

  /// Execute HTTP request with retry logic and error handling
  Future<ApiResponse<T>> request<T>({
    required String method,
    required String path,
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
    int retryCount = 0,
  }) async {
    // Validate auth requirement
    if (requiresAuth && !isAuthenticated) {
      return ApiResponse.failure('UNAUTHORIZED', 'يرجى تسجيل الدخول أولاً');
    }

    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path').replace(
      queryParameters: queryParams?.isNotEmpty == true ? queryParams : null,
    );

    _log('$method $uri');

    try {
      final http.Response response;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await _client.get(uri, headers: _headers).timeout(timeout);
          break;
        case 'POST':
          response = await _client
              .post(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(timeout);
          break;
        case 'PUT':
          response = await _client
              .put(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(timeout);
          break;
        case 'PATCH':
          response = await _client
              .patch(
                uri,
                headers: _headers,
                body: body != null ? jsonEncode(body) : null,
              )
              .timeout(timeout);
          break;
        case 'DELETE':
          response = await _client
              .delete(uri, headers: _headers)
              .timeout(timeout);
          break;
        default:
          throw ArgumentError('Unsupported HTTP method: $method');
      }

      return _handleResponse(response, parser);
    } on SocketException {
      _log('Network error');
      return ApiResponse.failure('NETWORK_ERROR', 'لا يوجد اتصال بالإنترنت');
    } on TimeoutException {
      _log('Timeout error');
      // Retry on timeout
      if (retryCount < maxRetries) {
        _log('Retrying... (${retryCount + 1}/$maxRetries)');
        return request(
          method: method,
          path: path,
          queryParams: queryParams,
          body: body,
          parser: parser,
          requiresAuth: requiresAuth,
          retryCount: retryCount + 1,
        );
      }
      return ApiResponse.failure(
        'TIMEOUT_ERROR',
        'انتهت مهلة الطلب، حاول مرة أخرى',
      );
    } on FormatException catch (e) {
      _log('Parse error: $e');
      return ApiResponse.failure('PARSE_ERROR', 'خطأ في معالجة البيانات');
    } catch (e) {
      _log('Unknown error: $e');
      return ApiResponse.failure('UNKNOWN_ERROR', 'حدث خطأ غير متوقع');
    }
  }

  /// Handle HTTP response and parse JSON
  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response,
    T Function(dynamic)? parser,
  ) async {
    _log('Response ${response.statusCode}: ${response.body.length} bytes');

    // Handle different status codes
    switch (response.statusCode) {
      case 200:
      case 201:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.fromJson(json, parser);
        } on FormatException {
          return ApiResponse.failure('PARSE_ERROR', 'خطأ في معالجة البيانات');
        }

      case 204:
        return ApiResponse.success(null as T);

      case 400:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.failure(
            'VALIDATION_ERROR',
            json['message']?.toString() ?? 'بيانات غير صحيحة',
          );
        } catch (_) {
          return ApiResponse.failure('VALIDATION_ERROR', 'بيانات غير صحيحة');
        }

      case 401:
        // Try to refresh token
        if (_refreshToken != null && onTokenRefresh != null) {
          final newToken = await onTokenRefresh!();
          if (newToken != null) {
            _authToken = newToken;
          }
        }
        onAuthFailure?.call();
        return ApiResponse.failure('UNAUTHORIZED', 'يرجى تسجيل الدخول');

      case 403:
        return ApiResponse.failure('FORBIDDEN', 'ليس لديك صلاحية للوصول');

      case 404:
        return ApiResponse.failure('NOT_FOUND', 'البيانات غير موجودة');

      case 422:
        try {
          final json = jsonDecode(response.body) as Map<String, dynamic>;
          return ApiResponse.failure(
            'VALIDATION_ERROR',
            json['message']?.toString() ?? 'بيانات غير صالحة',
          );
        } catch (_) {
          return ApiResponse.failure('VALIDATION_ERROR', 'بيانات غير صالحة');
        }

      case 429:
        return ApiResponse.failure(
          'RATE_LIMIT',
          'الكثير من الطلبات، حاول لاحقاً',
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return ApiResponse.failure(
          'SERVER_ERROR',
          'خطأ في الخادم، حاول لاحقاً',
        );

      default:
        return ApiResponse.failure(
          'HTTP_ERROR',
          'خطأ غير متوقع (${response.statusCode})',
        );
    }
  }

  // =====================================================
  // CONVENIENCE METHODS
  // =====================================================

  /// GET request
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, String>? queryParams,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
  }) {
    return request(
      method: 'GET',
      path: path,
      queryParams: queryParams,
      parser: parser,
      requiresAuth: requiresAuth,
    );
  }

  /// POST request
  Future<ApiResponse<T>> post<T>(
    String path, {
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
  }) {
    return request(
      method: 'POST',
      path: path,
      body: body,
      parser: parser,
      requiresAuth: requiresAuth,
    );
  }

  /// PUT request
  Future<ApiResponse<T>> put<T>(
    String path, {
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
  }) {
    return request(
      method: 'PUT',
      path: path,
      body: body,
      parser: parser,
      requiresAuth: requiresAuth,
    );
  }

  /// DELETE request
  Future<ApiResponse<T>> delete<T>(
    String path, {
    T Function(dynamic)? parser,
    bool requiresAuth = false,
  }) {
    return request(
      method: 'DELETE',
      path: path,
      parser: parser,
      requiresAuth: requiresAuth,
    );
  }

  /// Dispose resources
  void dispose() {
    _client.close();
  }
}
