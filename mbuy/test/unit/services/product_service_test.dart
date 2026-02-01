/// Product Service Tests
///
/// اختبارات لخدمة المنتجات
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:mbuy/apps/customer/data/api/api.dart';
import 'package:mbuy/apps/customer/data/services/product_service.dart';
import 'package:mbuy/apps/customer/models/models.dart';
import '../../helpers/mock_api_service.dart';

void main() {
  late MockApiClient mockClient;
  late ProductService productService;

  setUp(() {
    mockClient = MockApiClient();
    productService = ProductService(mockClient);
  });

  tearDown(() {
    mockClient.clearMocks();
  });

  group('ProductService', () {
    group('getProducts', () {
      test('should make GET request to correct endpoint', () async {
        mockClient.setMockResponse(
          '/api/public/products',
          ApiResponse.success(<Product>[]),
        );

        await productService.getProducts();

        expect(mockClient.recordedRequests.length, 1);
        expect(mockClient.recordedRequests[0].method, 'GET');
        expect(mockClient.recordedRequests[0].path, '/api/public/products');
      });

      test('should include pagination params', () async {
        mockClient.setMockResponse(
          '/api/public/products',
          ApiResponse.success(<Product>[]),
        );

        await productService.getProducts(page: 2, limit: 10);

        final request = mockClient.recordedRequests[0];
        expect(request.queryParams?['page'], '2');
        expect(request.queryParams?['limit'], '10');
      });

      test('should include category filter when provided', () async {
        mockClient.setMockResponse(
          '/api/public/products',
          ApiResponse.success(<Product>[]),
        );

        await productService.getProducts(categoryId: 'cat-123');

        final request = mockClient.recordedRequests[0];
        expect(request.queryParams?['category_id'], 'cat-123');
      });

      test('should clamp limit to valid range', () async {
        mockClient.setMockResponse(
          '/api/public/products',
          ApiResponse.success(<Product>[]),
        );

        await productService.getProducts(limit: 500);

        final request = mockClient.recordedRequests[0];
        expect(request.queryParams?['limit'], '100'); // Max limit is 100
      });
    });

    group('getProduct', () {
      test('should return failure for empty productId', () async {
        final result = await productService.getProduct('');

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should make GET request with productId', () async {
        mockClient.setMockResponse(
          '/api/public/products/prod-123',
          ApiResponse.success(MockData.mockProduct()),
        );

        await productService.getProduct('prod-123');

        expect(
          mockClient.recordedRequests[0].path,
          '/api/public/products/prod-123',
        );
      });
    });

    group('getFlashDeals', () {
      test('should make GET request to flash-deals endpoint', () async {
        mockClient.setMockResponse(
          '/api/public/products/flash-deals',
          ApiResponse.success(<Product>[]),
        );

        await productService.getFlashDeals();

        expect(
          mockClient.recordedRequests[0].path,
          '/api/public/products/flash-deals',
        );
      });

      test('should include limit param', () async {
        mockClient.setMockResponse(
          '/api/public/products/flash-deals',
          ApiResponse.success(<Product>[]),
        );

        await productService.getFlashDeals(limit: 5);

        expect(mockClient.recordedRequests[0].queryParams?['limit'], '5');
      });
    });

    group('getTrendingProducts', () {
      test('should make GET request to trending endpoint', () async {
        mockClient.setMockResponse(
          '/api/public/products/trending',
          ApiResponse.success(<Product>[]),
        );

        await productService.getTrendingProducts();

        expect(
          mockClient.recordedRequests[0].path,
          '/api/public/products/trending',
        );
      });
    });
  });
}
