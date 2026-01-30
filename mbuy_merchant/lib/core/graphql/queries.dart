/// GraphQL Queries for Merchant App
///
/// All GraphQL query definitions for merchant operations
library;

/// Merchant Queries
class MerchantQueries {
  /// Get merchant profile
  static const String getMerchant = r'''
    query GetMerchant($id: ID!) {
      merchant(id: $id) {
        id
        name
        email
        phone
        logo
        coverImage
        description
        businessType
        address
        city
        state
        country
        postalCode
        latitude
        longitude
        rating
        totalReviews
        isVerified
        isActive
        settings
        workingHours
        deliveryZones
        createdAt
        updatedAt
      }
    }
  ''';

  /// Get merchant dashboard stats
  static const String getDashboardStats = r'''
    query GetDashboardStats($merchantId: ID!, $dateRange: DateRangeInput) {
      merchantDashboard(merchantId: $merchantId, dateRange: $dateRange) {
        totalOrders
        pendingOrders
        completedOrders
        cancelledOrders
        totalRevenue
        averageOrderValue
        totalCustomers
        newCustomers
        topProducts {
          id
          name
          totalSold
          revenue
        }
        revenueByDay {
          date
          revenue
          orders
        }
      }
    }
  ''';
}

/// Product Queries for Merchant
class ProductQueries {
  /// Get merchant products
  static const String getProducts = r'''
    query GetMerchantProducts(
      $merchantId: ID!
      $categoryId: ID
      $status: String
      $search: String
      $first: Int
      $after: String
    ) {
      merchantProducts(
        merchantId: $merchantId
        categoryId: $categoryId
        status: $status
        search: $search
        first: $first
        after: $after
      ) {
        edges {
          node {
            id
            name
            nameAr
            description
            descriptionAr
            sku
            barcode
            price
            compareAtPrice
            costPrice
            stockQuantity
            lowStockThreshold
            status
            isFeatured
            images
            categoryId
            category {
              id
              name
            }
            variants {
              id
              name
              sku
              price
              stockQuantity
              attributes
            }
            createdAt
            updatedAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  ''';

  /// Get single product
  static const String getProduct = r'''
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        nameAr
        description
        descriptionAr
        sku
        barcode
        price
        compareAtPrice
        costPrice
        stockQuantity
        lowStockThreshold
        status
        isFeatured
        images
        categoryId
        category {
          id
          name
        }
        variants {
          id
          name
          sku
          price
          stockQuantity
          attributes
        }
        createdAt
        updatedAt
      }
    }
  ''';

  /// Get low stock products
  static const String getLowStockProducts = r'''
    query GetLowStockProducts($merchantId: ID!, $threshold: Int) {
      lowStockProducts(merchantId: $merchantId, threshold: $threshold) {
        id
        name
        sku
        stockQuantity
        lowStockThreshold
        status
      }
    }
  ''';
}

/// Order Queries for Merchant
class OrderQueries {
  /// Get merchant orders
  static const String getOrders = r'''
    query GetMerchantOrders(
      $merchantId: ID!
      $status: String
      $dateRange: DateRangeInput
      $first: Int
      $after: String
    ) {
      merchantOrders(
        merchantId: $merchantId
        status: $status
        dateRange: $dateRange
        first: $first
        after: $after
      ) {
        edges {
          node {
            id
            orderNumber
            status
            paymentStatus
            paymentMethod
            subtotal
            discount
            deliveryFee
            tax
            total
            itemCount
            customer {
              id
              name
              phone
            }
            shippingAddress {
              label
              addressLine1
              city
              phone
            }
            deliverySlot {
              date
              startTime
              endTime
            }
            createdAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  ''';

  /// Get single order details
  static const String getOrder = r'''
    query GetOrder($id: ID!) {
      order(id: $id) {
        id
        orderNumber
        status
        paymentStatus
        paymentMethod
        subtotal
        discount
        deliveryFee
        tax
        total
        notes
        customer {
          id
          name
          email
          phone
        }
        items {
          id
          productId
          productName
          variantName
          sku
          quantity
          price
          total
          image
        }
        shippingAddress {
          label
          addressLine1
          addressLine2
          city
          state
          postalCode
          phone
          latitude
          longitude
        }
        billingAddress {
          label
          addressLine1
          city
        }
        deliverySlot {
          date
          startTime
          endTime
        }
        statusHistory {
          status
          note
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  ''';

  /// Get order statistics
  static const String getOrderStats = r'''
    query GetOrderStats($merchantId: ID!, $dateRange: DateRangeInput) {
      orderStats(merchantId: $merchantId, dateRange: $dateRange) {
        totalOrders
        pendingOrders
        processingOrders
        shippedOrders
        deliveredOrders
        cancelledOrders
        averageOrderValue
        totalRevenue
      }
    }
  ''';
}

/// Category Queries
class CategoryQueries {
  /// Get merchant categories
  static const String getCategories = r'''
    query GetMerchantCategories($merchantId: ID!) {
      merchantCategories(merchantId: $merchantId) {
        id
        name
        nameAr
        description
        image
        parentId
        sortOrder
        isActive
        productCount
        children {
          id
          name
          nameAr
          image
          productCount
        }
      }
    }
  ''';
}

/// Customer Queries
class CustomerQueries {
  /// Get merchant customers
  static const String getCustomers = r'''
    query GetMerchantCustomers(
      $merchantId: ID!
      $search: String
      $first: Int
      $after: String
    ) {
      merchantCustomers(
        merchantId: $merchantId
        search: $search
        first: $first
        after: $after
      ) {
        edges {
          node {
            id
            name
            email
            phone
            totalOrders
            totalSpent
            lastOrderAt
            createdAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  ''';

  /// Get customer details
  static const String getCustomer = r'''
    query GetCustomerDetails($id: ID!, $merchantId: ID!) {
      customerDetails(id: $id, merchantId: $merchantId) {
        id
        name
        email
        phone
        totalOrders
        totalSpent
        averageOrderValue
        lastOrderAt
        addresses {
          id
          label
          addressLine1
          city
        }
        recentOrders {
          id
          orderNumber
          status
          total
          createdAt
        }
      }
    }
  ''';
}

/// Analytics Queries
class AnalyticsQueries {
  /// Get sales analytics
  static const String getSalesAnalytics = r'''
    query GetSalesAnalytics($merchantId: ID!, $dateRange: DateRangeInput!) {
      salesAnalytics(merchantId: $merchantId, dateRange: $dateRange) {
        totalRevenue
        totalOrders
        averageOrderValue
        revenueByDay {
          date
          revenue
          orders
        }
        topProducts {
          productId
          productName
          quantity
          revenue
        }
        topCategories {
          categoryId
          categoryName
          revenue
          percentage
        }
        paymentMethodBreakdown {
          method
          count
          total
        }
      }
    }
  ''';

  /// Get customer analytics
  static const String getCustomerAnalytics = r'''
    query GetCustomerAnalytics($merchantId: ID!, $dateRange: DateRangeInput!) {
      customerAnalytics(merchantId: $merchantId, dateRange: $dateRange) {
        totalCustomers
        newCustomers
        returningCustomers
        customerRetentionRate
        averageLifetimeValue
        customersBySegment {
          segment
          count
          percentage
        }
      }
    }
  ''';
}

/// Review Queries
class ReviewQueries {
  /// Get merchant reviews
  static const String getReviews = r'''
    query GetMerchantReviews(
      $merchantId: ID!
      $productId: ID
      $rating: Int
      $first: Int
      $after: String
    ) {
      merchantReviews(
        merchantId: $merchantId
        productId: $productId
        rating: $rating
        first: $first
        after: $after
      ) {
        edges {
          node {
            id
            rating
            comment
            images
            customer {
              id
              name
            }
            product {
              id
              name
            }
            reply
            repliedAt
            createdAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
        averageRating
      }
    }
  ''';
}

/// Delivery Queries
class DeliveryQueries {
  /// Get delivery slots
  static const String getDeliverySlots = r'''
    query GetDeliverySlots($merchantId: ID!, $date: String!) {
      deliverySlots(merchantId: $merchantId, date: $date) {
        id
        date
        startTime
        endTime
        capacity
        bookedCount
        isAvailable
      }
    }
  ''';

  /// Get delivery zones
  static const String getDeliveryZones = r'''
    query GetDeliveryZones($merchantId: ID!) {
      deliveryZones(merchantId: $merchantId) {
        id
        name
        polygon
        deliveryFee
        minimumOrder
        estimatedTime
        isActive
      }
    }
  ''';
}

/// Notification Queries
class NotificationQueries {
  /// Get merchant notifications
  static const String getNotifications = r'''
    query GetMerchantNotifications($merchantId: ID!, $first: Int, $after: String) {
      merchantNotifications(merchantId: $merchantId, first: $first, after: $after) {
        edges {
          node {
            id
            type
            title
            body
            data
            isRead
            createdAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        unreadCount
      }
    }
  ''';
}
