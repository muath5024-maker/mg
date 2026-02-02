/// Base Repository - القاعدة الأساسية للمستودعات
///
/// Provides common functionality for all repositories
library;

import '../customer_api_service.dart';

/// Result wrapper for repository operations
sealed class Result<T> {
  const Result();

  /// Create a success result
  factory Result.success(T data) = Success<T>;

  /// Create a failure result
  factory Result.failure(String message, {String? code}) = Failure<T>;

  /// Check if result is success
  bool get isSuccess => this is Success<T>;

  /// Check if result is failure
  bool get isFailure => this is Failure<T>;

  /// Get data if success, throws if failure
  T get data => (this as Success<T>).value;

  /// Get data or null
  T? get dataOrNull => isSuccess ? (this as Success<T>).value : null;

  /// Get error message if failure
  String? get errorMessage => isFailure ? (this as Failure<T>).message : null;

  /// Map success value
  Result<R> map<R>(R Function(T) transform) {
    if (this is Success<T>) {
      return Result.success(transform((this as Success<T>).value));
    }
    final failure = this as Failure<T>;
    return Result.failure(failure.message, code: failure.code);
  }

  /// Handle both cases
  R fold<R>({
    required R Function(T data) onSuccess,
    required R Function(String message, String? code) onFailure,
  }) {
    if (this is Success<T>) {
      return onSuccess((this as Success<T>).value);
    }
    final failure = this as Failure<T>;
    return onFailure(failure.message, failure.code);
  }
}

/// Success result
class Success<T> extends Result<T> {
  final T value;
  const Success(this.value);
}

/// Failure result
class Failure<T> extends Result<T> {
  final String message;
  final String? code;
  const Failure(this.message, {this.code});
}

/// Base repository with common functionality
abstract class BaseRepository {
  final CustomerApiService api;

  const BaseRepository(this.api);

  /// Convert API response to Result
  Result<T> toResult<T>(ApiResponse<T> response) {
    if (response.ok && response.data != null) {
      return Result.success(response.data as T);
    }
    return Result.failure(
      response.error ?? 'Unknown error',
      code: response.errorCode,
    );
  }

  /// Convert nullable API response to Result
  Result<T?> toNullableResult<T>(ApiResponse<T> response) {
    if (response.ok) {
      return Result.success(response.data);
    }
    return Result.failure(
      response.error ?? 'Unknown error',
      code: response.errorCode,
    );
  }
}
