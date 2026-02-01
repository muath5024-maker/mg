/// Cart Service Tests
///
/// اختبارات لخدمة السلة
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:mbuy/apps/customer/data/api/api.dart';
import 'package:mbuy/apps/customer/data/services/cart_service.dart';
import 'package:mbuy/apps/customer/models/models.dart';
import '../../helpers/mock_api_service.dart';

void main() {
  late MockApiClient mockClient;
  late CartService cartService;

  setUp(() {
    mockClient = MockApiClient();
    mockClient.setAuthToken('test-token'); // Cart requires auth
    cartService = CartService(mockClient);
  });

  tearDown(() {
    mockClient.clearMocks();
  });

  group('CartService', () {
    group('getCart', () {
      test('should make authenticated GET request', () async {
        mockClient.setMockResponse(
          '/api/customer/cart',
          ApiResponse.success(MockData.mockCart()),
        );

        await cartService.getCart();

        expect(mockClient.recordedRequests.length, 1);
        expect(mockClient.recordedRequests[0].method, 'GET');
        expect(mockClient.recordedRequests[0].path, '/api/customer/cart');
        expect(mockClient.recordedRequests[0].requiresAuth, true);
      });
    });

    group('addToCart', () {
      test('should return failure for empty productId', () async {
        final result = await cartService.addToCart(productId: '');

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should return failure for quantity less than 1', () async {
        final result = await cartService.addToCart(
          productId: 'prod-123',
          quantity: 0,
        );

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should make authenticated POST request', () async {
        mockClient.setMockResponse(
          '/api/customer/cart',
          ApiResponse.success(
            CartItem.fromJson({
              'id': 'item-1',
              'product_id': 'prod-123',
              'quantity': 2,
              'price': 100.0,
            }),
          ),
        );

        await cartService.addToCart(productId: 'prod-123', quantity: 2);

        final request = mockClient.recordedRequests[0];
        expect(request.method, 'POST');
        expect(request.path, '/api/customer/cart');
        expect(request.requiresAuth, true);
        expect(request.body?['product_id'], 'prod-123');
        expect(request.body?['quantity'], 2);
      });
    });

    group('updateCartItem', () {
      test('should return failure for empty itemId', () async {
        final result = await cartService.updateCartItem(
          itemId: '',
          quantity: 5,
        );

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should return failure for negative quantity', () async {
        final result = await cartService.updateCartItem(
          itemId: 'item-1',
          quantity: -1,
        );

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should make authenticated PUT request', () async {
        mockClient.setMockResponse(
          '/api/customer/cart/item-1',
          ApiResponse.success(
            CartItem.fromJson({
              'id': 'item-1',
              'quantity': 5,
              'product_id': 'prod-123',
              'price': 100.0,
            }),
          ),
        );

        await cartService.updateCartItem(itemId: 'item-1', quantity: 5);

        final request = mockClient.recordedRequests[0];
        expect(request.method, 'PUT');
        expect(request.path, '/api/customer/cart/item-1');
        expect(request.body?['quantity'], 5);
      });
    });

    group('removeFromCart', () {
      test('should return failure for empty itemId', () async {
        final result = await cartService.removeFromCart('');

        expect(result.ok, false);
        expect(result.errorCode, 'VALIDATION_ERROR');
      });

      test('should make authenticated DELETE request', () async {
        mockClient.setMockResponse(
          '/api/customer/cart/item-1',
          ApiResponse.success(null),
        );

        await cartService.removeFromCart('item-1');

        final request = mockClient.recordedRequests[0];
        expect(request.method, 'DELETE');
        expect(request.path, '/api/customer/cart/item-1');
        expect(request.requiresAuth, true);
      });
    });

    group('clearCart', () {
      test('should make authenticated DELETE request to cart root', () async {
        mockClient.setMockResponse(
          '/api/customer/cart',
          ApiResponse.success(null),
        );

        await cartService.clearCart();

        final request = mockClient.recordedRequests[0];
        expect(request.method, 'DELETE');
        expect(request.path, '/api/customer/cart');
        expect(request.requiresAuth, true);
      });
    });

    group('getCartCount', () {
      test('should make authenticated GET request to count endpoint', () async {
        mockClient.setMockResponse(
          '/api/customer/cart/count',
          ApiResponse.success(5),
        );

        await cartService.getCartCount();

        final request = mockClient.recordedRequests[0];
        expect(request.method, 'GET');
        expect(request.path, '/api/customer/cart/count');
        expect(request.requiresAuth, true);
      });
    });
  });
}
