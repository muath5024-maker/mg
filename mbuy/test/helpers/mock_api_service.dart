/// Mock API Service for testing
///
/// يوفر Mock للـ API Service للاستخدام في الاختبارات
library;

import 'package:mbuy/apps/customer/data/api/api.dart';
import 'package:mbuy/apps/customer/models/models.dart';

/// Mock API Client for testing
class MockApiClient extends BaseApiClient {
  /// Mock responses for different endpoints
  final Map<String, dynamic> mockResponses = {};

  /// Recorded requests for verification
  final List<MockRequest> recordedRequests = [];

  MockApiClient() : super(enableLogging: true);

  /// Set a mock response for a specific path
  void setMockResponse<T>(String path, ApiResponse<T> response) {
    mockResponses[path] = response;
  }

  /// Clear all mock responses
  void clearMocks() {
    mockResponses.clear();
    recordedRequests.clear();
  }

  @override
  Future<ApiResponse<T>> request<T>({
    required String method,
    required String path,
    Map<String, String>? queryParams,
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
    bool requiresAuth = false,
    int retryCount = 0,
  }) async {
    // Record the request
    recordedRequests.add(
      MockRequest(
        method: method,
        path: path,
        queryParams: queryParams,
        body: body,
        requiresAuth: requiresAuth,
      ),
    );

    // Return mock response if available
    if (mockResponses.containsKey(path)) {
      return mockResponses[path] as ApiResponse<T>;
    }

    // Default to empty success response
    return ApiResponse.success(null as T);
  }
}

/// Represents a recorded mock request
class MockRequest {
  final String method;
  final String path;
  final Map<String, String>? queryParams;
  final Map<String, dynamic>? body;
  final bool requiresAuth;

  MockRequest({
    required this.method,
    required this.path,
    this.queryParams,
    this.body,
    required this.requiresAuth,
  });
}

/// Mock data generators for testing
class MockData {
  /// Generate a mock product
  static Product mockProduct({
    String id = 'product-1',
    String name = 'منتج تجريبي',
    double price = 99.99,
    String? storeId,
  }) {
    return Product.fromJson({
      'id': id,
      'name': name,
      'price': price,
      'store_id': storeId ?? 'store-1',
      'description': 'وصف المنتج التجريبي',
      'images': ['https://example.com/image.jpg'],
      'category_id': 'cat-1',
      'stock': 100,
      'is_active': true,
    });
  }

  /// Generate a list of mock products
  static List<Product> mockProducts({int count = 5}) {
    return List.generate(
      count,
      (i) =>
          mockProduct(id: 'product-$i', name: 'منتج $i', price: 50.0 + i * 10),
    );
  }

  /// Generate a mock store
  static Store mockStore({String id = 'store-1', String name = 'متجر تجريبي'}) {
    return Store.fromJson({
      'id': id,
      'name': name,
      'description': 'وصف المتجر',
      'logo_url': 'https://example.com/logo.jpg',
      'is_active': true,
    });
  }

  /// Generate a mock cart
  static Cart mockCart({int itemCount = 2}) {
    return Cart.fromJson({
      'id': 'cart-1',
      'items': List.generate(
        itemCount,
        (i) => {
          'id': 'item-1', // تم تعديلها لتكون ثابتة للسهولة أو item-$i
          'product_id': 'product-$i',
          'quantity': i + 1,
          'price': 50.0 + i * 10,
        },
      ),
      'total': itemCount * 75.0,
    });
  }

  /// Generate a mock order
  static Order mockOrder({String id = 'order-1', String status = 'pending'}) {
    return Order.fromJson({
      'id': id,
      'status': status,
      'total': 199.99,
      'created_at': DateTime.now().toIso8601String(),
      'items': [],
    });
  }

  /// Generate a mock category
  static Category mockCategory({
    String id = 'cat-1',
    String name = 'فئة تجريبية',
  }) {
    return Category.fromJson({
      'id': id,
      'name': name,
      'slug': name.toLowerCase().replaceAll(' ', '-'),
    });
  }
}
