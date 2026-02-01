/// API Response Tests
///
/// اختبارات شاملة لـ ApiResponse wrapper
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:mbuy/apps/customer/data/api/api.dart';

void main() {
  group('ApiResponse', () {
    group('factory constructors', () {
      test('success creates ApiResponse with data', () {
        final response = ApiResponse.success('test data');

        expect(response.ok, true);
        expect(response.data, 'test data');
        expect(response.error, null);
        expect(response.errorCode, null);
      });

      test('failure creates ApiResponse with error', () {
        final response = ApiResponse<String>.failure('ERROR', 'Error message');

        expect(response.ok, false);
        expect(response.data, null);
        expect(response.error, 'Error message');
        expect(response.errorCode, 'ERROR');
      });

      test('failure with only error code uses code as message', () {
        final response = ApiResponse<String>.failure('ERROR_CODE');

        expect(response.ok, false);
        expect(response.errorCode, 'ERROR_CODE');
        expect(response.error, 'ERROR_CODE');
      });
    });

    group('pagination', () {
      test('hasMore returns false when no pagination', () {
        final response = ApiResponse.success('data');
        expect(response.hasMore, false);
      });

      test('hasMore returns value from pagination', () {
        final response = ApiResponse.success(
          'data',
          pagination: {'has_more': true},
        );
        expect(response.hasMore, true);
      });

      test('currentPage defaults to 1', () {
        final response = ApiResponse.success('data');
        expect(response.currentPage, 1);
      });

      test('currentPage returns value from pagination', () {
        final response = ApiResponse.success('data', pagination: {'page': 3});
        expect(response.currentPage, 3);
      });

      test('totalPages defaults to 1', () {
        final response = ApiResponse.success('data');
        expect(response.totalPages, 1);
      });

      test('totalItems defaults to 0', () {
        final response = ApiResponse.success('data');
        expect(response.totalItems, 0);
      });
    });

    group('fold', () {
      test('calls onSuccess for successful response', () {
        final response = ApiResponse.success(42);
        String? result;

        response.fold(
          onSuccess: (data) => result = 'Got $data',
          onFailure: (code, msg) => result = 'Error',
        );

        expect(result, 'Got 42');
      });

      test('calls onFailure for failed response', () {
        final response = ApiResponse<int>.failure('TEST_ERROR', 'Test message');
        String? result;

        response.fold(
          onSuccess: (data) => result = 'Success',
          onFailure: (code, msg) => result = 'Error: $code - $msg',
        );

        expect(result, 'Error: TEST_ERROR - Test message');
      });
    });

    group('map', () {
      test('transforms data when successful', () {
        final response = ApiResponse.success(10);
        final mapped = response.map((data) => data * 2);

        expect(mapped.data, 20);
        expect(mapped.ok, true);
      });

      test('preserves error when failed', () {
        final response = ApiResponse<int>.failure('ERROR', 'Message');
        final mapped = response.map((data) => data * 2);

        expect(mapped.data, null);
        expect(mapped.ok, false);
        expect(mapped.errorCode, 'ERROR');
      });

      test('preserves pagination when mapping', () {
        final response = ApiResponse.success(10, pagination: {'page': 2});
        final mapped = response.map((data) => data.toString());

        expect(mapped.pagination?['page'], 2);
      });
    });

    group('fromJson', () {
      test('parses successful response', () {
        final json = {'ok': true, 'data': 'test'};
        final response = ApiResponse<String>.fromJson(json, null);

        expect(response.ok, true);
        expect(response.data, 'test');
      });

      test('parses error response', () {
        final json = {
          'ok': false,
          'error': 'Something went wrong',
          'error_code': 'SERVER_ERROR',
        };
        final response = ApiResponse<String>.fromJson(json, null);

        expect(response.ok, false);
        expect(response.error, 'Something went wrong');
        expect(response.errorCode, 'SERVER_ERROR');
      });

      test('uses parser when provided', () {
        final json = {'ok': true, 'data': '123'};
        final response = ApiResponse<int>.fromJson(
          json,
          (data) => int.parse(data as String),
        );

        expect(response.data, 123);
      });
    });
  });
}
