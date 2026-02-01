/// API Exceptions - استثناءات API المخصصة
///
/// جميع الاستثناءات المستخدمة في طبقة الـ API
library;

// =====================================================
// CUSTOM EXCEPTIONS
// =====================================================

/// Base exception for API errors
sealed class ApiException implements Exception {
  final String message;
  final String code;
  final int? statusCode;

  const ApiException(this.message, this.code, [this.statusCode]);

  @override
  String toString() => 'ApiException($code): $message';
}

/// Network connection error
class NetworkException extends ApiException {
  const NetworkException([String message = 'لا يوجد اتصال بالإنترنت'])
    : super(message, 'NETWORK_ERROR');
}

/// Request timeout error
class TimeoutException extends ApiException {
  const TimeoutException([String message = 'انتهت مهلة الطلب'])
    : super(message, 'TIMEOUT_ERROR');
}

/// Server error (5xx)
class ServerException extends ApiException {
  const ServerException([String message = 'خطأ في الخادم', int? statusCode])
    : super(message, 'SERVER_ERROR', statusCode);
}

/// Authentication error (401)
class UnauthorizedException extends ApiException {
  const UnauthorizedException([String message = 'يرجى تسجيل الدخول'])
    : super(message, 'UNAUTHORIZED', 401);
}

/// Forbidden error (403)
class ForbiddenException extends ApiException {
  const ForbiddenException([String message = 'ليس لديك صلاحية'])
    : super(message, 'FORBIDDEN', 403);
}

/// Not found error (404)
class NotFoundException extends ApiException {
  const NotFoundException([String message = 'البيانات غير موجودة'])
    : super(message, 'NOT_FOUND', 404);
}

/// Validation error (400)
class ValidationException extends ApiException {
  final Map<String, dynamic>? errors;

  const ValidationException([String message = 'بيانات غير صحيحة', this.errors])
    : super(message, 'VALIDATION_ERROR', 400);
}

/// JSON parsing error
class ParseException extends ApiException {
  const ParseException([String message = 'خطأ في معالجة البيانات'])
    : super(message, 'PARSE_ERROR');
}

/// Rate limit error (429)
class RateLimitException extends ApiException {
  const RateLimitException([String message = 'الكثير من الطلبات، حاول لاحقاً'])
    : super(message, 'RATE_LIMIT', 429);
}
