/// GraphQL Client Configuration for Merchant App
///
/// Configures GraphQL client with authentication and caching
library;

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class GraphQLConfig {
  static const String _baseUrl = 'https://api.mbuy.app/graphql';
  static const String _devUrl = 'http://localhost:8787/graphql';

  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static String get endpoint => kDebugMode ? _devUrl : _baseUrl;

  /// Get stored auth token
  static Future<String?> getToken() async {
    return _storage.read(key: 'merchant_auth_token');
  }

  /// Store auth token
  static Future<void> setToken(String token) async {
    await _storage.write(key: 'merchant_auth_token', value: token);
  }

  /// Remove auth token
  static Future<void> removeToken() async {
    await _storage.delete(key: 'merchant_auth_token');
  }

  /// Store refresh token
  static Future<void> setRefreshToken(String token) async {
    await _storage.write(key: 'merchant_refresh_token', value: token);
  }

  /// Get refresh token
  static Future<String?> getRefreshToken() async {
    return _storage.read(key: 'merchant_refresh_token');
  }

  /// Remove refresh token
  static Future<void> removeRefreshToken() async {
    await _storage.delete(key: 'merchant_refresh_token');
  }

  /// Initialize Hive for GraphQL caching
  static Future<void> initHive() async {
    await initHiveForFlutter();
  }

  /// Create GraphQL client
  static ValueNotifier<GraphQLClient> getClient() {
    final HttpLink httpLink = HttpLink(endpoint);

    final AuthLink authLink = AuthLink(
      getToken: () async {
        final token = await getToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final Link link = authLink.concat(httpLink);

    return ValueNotifier(
      GraphQLClient(
        link: link,
        cache: GraphQLCache(store: HiveStore()),
      ),
    );
  }

  /// Create GraphQL client without cache (for mutations)
  static GraphQLClient getClientWithoutCache() {
    final HttpLink httpLink = HttpLink(endpoint);

    final AuthLink authLink = AuthLink(
      getToken: () async {
        final token = await getToken();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final Link link = authLink.concat(httpLink);

    return GraphQLClient(link: link, cache: GraphQLCache());
  }
}

/// Extension methods for GraphQL operations
extension GraphQLClientExtensions on GraphQLClient {
  /// Execute query with error handling
  Future<T> safeQuery<T>({
    required String query,
    Map<String, dynamic>? variables,
    required T Function(Map<String, dynamic> data) parser,
    FetchPolicy? fetchPolicy,
  }) async {
    final options = QueryOptions(
      document: gql(query),
      variables: variables ?? {},
      fetchPolicy: fetchPolicy ?? FetchPolicy.cacheAndNetwork,
    );

    final result = await this.query(options);

    if (result.hasException) {
      throw GraphQLException(result.exception!);
    }

    if (result.data == null) {
      throw const GraphQLException.noData();
    }

    return parser(result.data!);
  }

  /// Execute mutation with error handling
  Future<T> safeMutate<T>({
    required String mutation,
    Map<String, dynamic>? variables,
    required T Function(Map<String, dynamic> data) parser,
  }) async {
    final options = MutationOptions(
      document: gql(mutation),
      variables: variables ?? {},
    );

    final result = await mutate(options);

    if (result.hasException) {
      throw GraphQLException(result.exception!);
    }

    if (result.data == null) {
      throw const GraphQLException.noData();
    }

    return parser(result.data!);
  }
}

/// GraphQL Exception wrapper
class GraphQLException implements Exception {
  final String message;
  final OperationException? operationException;

  const GraphQLException(this.operationException) : message = '';

  const GraphQLException.noData()
    : message = 'No data returned from server',
      operationException = null;

  const GraphQLException.custom(this.message) : operationException = null;

  @override
  String toString() {
    if (operationException != null) {
      final errors = operationException!.graphqlErrors;
      if (errors.isNotEmpty) {
        return errors.map((e) => e.message).join(', ');
      }
      final linkException = operationException!.linkException;
      if (linkException != null) {
        return 'Network error: ${linkException.toString()}';
      }
    }
    return message.isNotEmpty ? message : 'Unknown GraphQL error';
  }
}
