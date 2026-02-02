/// GraphQL Queries for Customer App
///
/// All GraphQL query definitions
library;

/// Product Queries
class ProductQueries {
  static const String getProducts = r'''
    query GetProducts($merchantId: ID!, $categoryId: ID, $first: Int, $after: String, $search: String) {
      products(
        merchantId: $merchantId
        categoryId: $categoryId
        first: $first
        after: $after
        search: $search
      ) {
        edges {
          node {
            id
            name
            nameAr
            description
            descriptionAr
            price
            compareAtPrice
            currency
            stockQuantity
            sku
            images
            status
            featured
            category {
              id
              name
              nameAr
            }
            merchant {
              id
              businessName
              logoUrl
            }
            variants {
              id
              name
              price
              stockQuantity
              sku
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

  static const String getProduct = r'''
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        name
        nameAr
        description
        descriptionAr
        price
        compareAtPrice
        currency
        stockQuantity
        sku
        images
        status
        featured
        category {
          id
          name
          nameAr
          parentId
        }
        merchant {
          id
          businessName
          logoUrl
          rating
        }
        variants {
          id
          name
          price
          compareAtPrice
          stockQuantity
          sku
          attributes
        }
        reviews {
          id
          rating
          comment
          customer {
            id
            fullName
          }
          createdAt
        }
        avgRating
        reviewCount
        createdAt
      }
    }
  ''';

  static const String getFeaturedProducts = r'''
    query GetFeaturedProducts($merchantId: ID!, $limit: Int) {
      featuredProducts(merchantId: $merchantId, limit: $limit) {
        id
        name
        nameAr
        price
        compareAtPrice
        images
        avgRating
        merchant {
          id
          businessName
        }
      }
    }
  ''';

  static const String searchProducts = r'''
    query SearchProducts($query: String!, $merchantId: ID, $categoryId: ID, $minPrice: Float, $maxPrice: Float, $first: Int) {
      searchProducts(
        query: $query
        merchantId: $merchantId
        categoryId: $categoryId
        minPrice: $minPrice
        maxPrice: $maxPrice
        first: $first
      ) {
        id
        name
        nameAr
        price
        compareAtPrice
        images
        avgRating
        stockQuantity
        merchant {
          id
          businessName
        }
      }
    }
  ''';
}

/// Category Queries
class CategoryQueries {
  static const String getCategories = r'''
    query GetCategories($merchantId: ID!, $parentId: ID) {
      categories(merchantId: $merchantId, parentId: $parentId) {
        id
        name
        nameAr
        description
        imageUrl
        parentId
        sortOrder
        productCount
        children {
          id
          name
          nameAr
          imageUrl
          productCount
        }
      }
    }
  ''';

  static const String getCategoryTree = r'''
    query GetCategoryTree($merchantId: ID!) {
      categoryTree(merchantId: $merchantId) {
        id
        name
        nameAr
        imageUrl
        productCount
        children {
          id
          name
          nameAr
          imageUrl
          productCount
          children {
            id
            name
            nameAr
          }
        }
      }
    }
  ''';
}

/// Order Queries
class OrderQueries {
  static const String getOrders = r'''
    query GetOrders($customerId: ID!, $status: String, $first: Int, $after: String) {
      orders(customerId: $customerId, status: $status, first: $first, after: $after) {
        edges {
          node {
            id
            orderNumber
            status
            paymentStatus
            totalAmount
            currency
            itemsCount
            createdAt
            merchant {
              id
              businessName
              logoUrl
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  ''';

  static const String getOrder = r'''
    query GetOrder($id: ID!) {
      order(id: $id) {
        id
        orderNumber
        status
        paymentStatus
        subtotalAmount
        taxAmount
        shippingAmount
        discountAmount
        totalAmount
        currency
        notes
        trackingNumber
        shippingAddress {
          street
          city
          state
          country
          postalCode
          phone
        }
        items {
          id
          productId
          productName
          variantName
          quantity
          unitPrice
          totalPrice
          imageUrl
        }
        merchant {
          id
          businessName
          phone
          email
        }
        payment {
          id
          gateway
          status
          paidAt
        }
        createdAt
        updatedAt
      }
    }
  ''';
}

/// Cart Queries
class CartQueries {
  static const String getCart = r'''
    query GetCart($customerId: ID!, $merchantId: ID!) {
      cart(customerId: $customerId, merchantId: $merchantId) {
        id
        customerId
        merchantId
        items {
          id
          productId
          variantId
          quantity
          unitPrice
          product {
            id
            name
            nameAr
            images
            stockQuantity
          }
          variant {
            id
            name
            stockQuantity
          }
        }
        totalItems
        subtotal
        currency
      }
    }
  ''';

  static const String getWishlist = r'''
    query GetWishlist($customerId: ID!) {
      wishlist(customerId: $customerId) {
        id
        productId
        product {
          id
          name
          nameAr
          price
          compareAtPrice
          images
          stockQuantity
          merchant {
            id
            businessName
          }
        }
        addedAt
      }
    }
  ''';
}

/// Customer Queries
class CustomerQueries {
  static const String getProfile = r'''
    query GetProfile {
      me {
        id
        fullName
        email
        phone
        avatarUrl
        isVerified
        addresses {
          id
          label
          street
          city
          state
          country
          postalCode
          isDefault
        }
        createdAt
      }
    }
  ''';

  static const String getAddresses = r'''
    query GetAddresses($customerId: ID!) {
      addresses(customerId: $customerId) {
        id
        label
        street
        city
        state
        country
        postalCode
        phone
        isDefault
        lat
        lng
      }
    }
  ''';

  static const String getLoyaltyAccount = r'''
    query GetLoyaltyAccount($customerId: ID!, $merchantId: ID!) {
      loyaltyAccount(customerId: $customerId, merchantId: $merchantId) {
        id
        pointsBalance
        lifetimePoints
        tier {
          id
          name
          benefits
          pointsMultiplier
        }
        nextTier {
          id
          name
          pointsNeeded
        }
        recentTransactions {
          id
          points
          type
          reason
          createdAt
        }
      }
    }
  ''';
}

/// Merchant Queries
class MerchantQueries {
  static const String getMerchant = r'''
    query GetMerchant($id: ID!) {
      merchant(id: $id) {
        id
        businessName
        description
        logoUrl
        bannerUrl
        phone
        email
        rating
        reviewCount
        isOpen
        workingHours {
          day
          openTime
          closeTime
        }
        address {
          street
          city
          country
        }
        socialLinks {
          platform
          url
        }
      }
    }
  ''';

  static const String getMerchants = r'''
    query GetMerchants($categoryId: ID, $search: String, $first: Int) {
      merchants(categoryId: $categoryId, search: $search, first: $first) {
        id
        businessName
        logoUrl
        rating
        reviewCount
        isOpen
        deliveryFee
        minOrderAmount
      }
    }
  ''';
}

/// Notification Queries
class NotificationQueries {
  static const String getNotifications = r'''
    query GetNotifications($customerId: ID!, $first: Int, $after: String) {
      notifications(customerId: $customerId, first: $first, after: $after) {
        edges {
          node {
            id
            type
            title
            message
            data
            read
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
