/// GraphQL Client Configuration
///
/// Handles GraphQL client setup with authentication and caching
library;

import 'package:flutter/foundation.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// GraphQL Configuration
class GraphQLConfig {
  static const String _prodEndpoint = 'https://api.mbuy.sa/graphql';
  static const String _devEndpoint = 'http://localhost:8787/graphql';

  static String get endpoint => kDebugMode ? _devEndpoint : _prodEndpoint;

  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static GraphQLClient? _client;
  static ValueNotifier<GraphQLClient>? _clientNotifier;

  /// Initialize the GraphQL client
  static Future<void> init() async {
    await initHiveForFlutter();
    _client = await _createClient();
    _clientNotifier = ValueNotifier<GraphQLClient>(_client!);
  }

  /// Get the GraphQL client
  static GraphQLClient get client {
    if (_client == null) {
      throw StateError(
        'GraphQL client not initialized. Call GraphQLConfig.init() first.',
      );
    }
    return _client!;
  }

  /// Get the client notifier for GraphQLProvider
  static ValueNotifier<GraphQLClient> get clientNotifier {
    if (_clientNotifier == null) {
      throw StateError(
        'GraphQL client not initialized. Call GraphQLConfig.init() first.',
      );
    }
    return _clientNotifier!;
  }

  /// Create the GraphQL client with auth link
  static Future<GraphQLClient> _createClient() async {
    final HttpLink httpLink = HttpLink(endpoint);

    final AuthLink authLink = AuthLink(
      getToken: () async {
        final token = await _storage.read(key: 'auth_token');
        return token != null ? 'Bearer $token' : null;
      },
    );

    final Link link = authLink.concat(httpLink);

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: HiveStore()),
      defaultPolicies: DefaultPolicies(
        query: Policies(fetch: FetchPolicy.cacheAndNetwork),
        mutate: Policies(fetch: FetchPolicy.networkOnly),
      ),
    );
  }

  /// Update the auth token and recreate client
  static Future<void> setAuthToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
    _client = await _createClient();
    _clientNotifier?.value = _client!;
  }

  /// Clear auth token and recreate client
  static Future<void> clearAuthToken() async {
    await _storage.delete(key: 'auth_token');
    _client = await _createClient();
    _clientNotifier?.value = _client!;
  }

  /// Check if user is authenticated
  static Future<bool> isAuthenticated() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null && token.isNotEmpty;
  }
}

/// Extension for easy GraphQL operations
extension GraphQLClientExtension on GraphQLClient {
  /// Execute a query with error handling
  Future<QueryResult> safeQuery(QueryOptions options) async {
    try {
      final result = await query(options);
      if (result.hasException) {
        throw GraphQLException(result.exception!);
      }
      return result;
    } catch (e) {
      rethrow;
    }
  }

  /// Execute a mutation with error handling
  Future<QueryResult> safeMutate(MutationOptions options) async {
    try {
      final result = await mutate(options);
      if (result.hasException) {
        throw GraphQLException(result.exception!);
      }
      return result;
    } catch (e) {
      rethrow;
    }
  }
}

/// Custom GraphQL Exception
class GraphQLException implements Exception {
  final OperationException exception;

  GraphQLException(this.exception);

  String get message {
    if (exception.graphqlErrors.isNotEmpty) {
      return exception.graphqlErrors.map((e) => e.message).join(', ');
    }
    if (exception.linkException != null) {
      return 'Network error: ${exception.linkException}';
    }
    return 'Unknown GraphQL error';
  }

  @override
  String toString() => 'GraphQLException: $message';
}
