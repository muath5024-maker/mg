/// API Response - غلاف الاستجابة
///
/// يوفر نمط موحد للتعامل مع استجابات الـ API
library;

// =====================================================
// API RESPONSE WRAPPER
// =====================================================

/// API Response wrapper with typed data
class ApiResponse<T> {
  final bool ok;
  final T? data;
  final String? error;
  final String? errorCode;
  final String? message;
  final Map<String, dynamic>? pagination;

  const ApiResponse({
    required this.ok,
    this.data,
    this.error,
    this.errorCode,
    this.message,
    this.pagination,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? parser,
  ) {
    return ApiResponse(
      ok: json['ok'] ?? false,
      data: parser != null && json['data'] != null
          ? parser(json['data'])
          : json['data'] as T?,
      error: json['error']?.toString(),
      errorCode: json['error_code']?.toString(),
      message: json['message']?.toString(),
      pagination: json['pagination'] as Map<String, dynamic>?,
    );
  }

  factory ApiResponse.success(T data, {Map<String, dynamic>? pagination}) {
    return ApiResponse(ok: true, data: data, pagination: pagination);
  }

  factory ApiResponse.failure(String errorCode, [String? message]) {
    return ApiResponse(
      ok: false,
      errorCode: errorCode,
      error: message ?? errorCode,
    );
  }

  /// Check if response has more pages
  bool get hasMore => pagination?['has_more'] ?? false;

  /// Get current page
  int get currentPage => pagination?['page'] ?? 1;

  /// Get total pages
  int get totalPages => pagination?['total_pages'] ?? 1;

  /// Get total items
  int get totalItems => pagination?['total'] ?? 0;

  /// Map the data to a new type
  ApiResponse<R> map<R>(R Function(T) mapper) {
    if (!ok || data == null) {
      return ApiResponse<R>(
        ok: ok,
        error: error,
        errorCode: errorCode,
        message: message,
        pagination: pagination,
      );
    }
    return ApiResponse<R>(
      ok: true,
      data: mapper(data as T),
      message: message,
      pagination: pagination,
    );
  }

  /// Execute callback based on success/failure
  R fold<R>({
    required R Function(T data) onSuccess,
    required R Function(String errorCode, String? message) onFailure,
  }) {
    if (ok && data != null) {
      return onSuccess(data as T);
    }
    return onFailure(errorCode ?? 'UNKNOWN_ERROR', error);
  }
}
