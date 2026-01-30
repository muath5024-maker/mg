/// GraphQL Mutations for Merchant App
///
/// All GraphQL mutation definitions for merchant operations
library;

/// Auth Mutations
class AuthMutations {
  /// Merchant login
  static const String login = r'''
    mutation MerchantLogin($email: String!, $password: String!) {
      merchantLogin(email: $email, password: $password) {
        success
        token
        refreshToken
        merchant {
          id
          name
          email
          phone
          logo
          businessType
          isVerified
          isActive
        }
        error
      }
    }
  ''';

  /// Refresh token
  static const String refreshToken = r'''
    mutation RefreshMerchantToken($refreshToken: String!) {
      refreshMerchantToken(refreshToken: $refreshToken) {
        success
        token
        refreshToken
        error
      }
    }
  ''';

  /// Logout
  static const String logout = r'''
    mutation MerchantLogout {
      merchantLogout {
        success
      }
    }
  ''';

  /// Update merchant password
  static const String updatePassword = r'''
    mutation UpdateMerchantPassword(
      $merchantId: ID!
      $currentPassword: String!
      $newPassword: String!
    ) {
      updateMerchantPassword(
        merchantId: $merchantId
        currentPassword: $currentPassword
        newPassword: $newPassword
      ) {
        success
        error
      }
    }
  ''';
}

/// Profile Mutations
class ProfileMutations {
  /// Update merchant profile
  static const String updateProfile = r'''
    mutation UpdateMerchantProfile($input: UpdateMerchantInput!) {
      updateMerchant(input: $input) {
        id
        name
        email
        phone
        logo
        coverImage
        description
        address
        city
        state
        country
        postalCode
        latitude
        longitude
        settings
        workingHours
      }
    }
  ''';

  /// Update merchant settings
  static const String updateSettings = r'''
    mutation UpdateMerchantSettings($merchantId: ID!, $settings: JSON!) {
      updateMerchantSettings(merchantId: $merchantId, settings: $settings) {
        success
        settings
      }
    }
  ''';

  /// Update working hours
  static const String updateWorkingHours = r'''
    mutation UpdateWorkingHours($merchantId: ID!, $workingHours: JSON!) {
      updateWorkingHours(merchantId: $merchantId, workingHours: $workingHours) {
        success
        workingHours
      }
    }
  ''';
}

/// Product Mutations
class ProductMutations {
  /// Create product
  static const String createProduct = r'''
    mutation CreateProduct($input: CreateProductInput!) {
      createProduct(input: $input) {
        id
        name
        sku
        price
        stockQuantity
        status
        images
        createdAt
      }
    }
  ''';

  /// Update product
  static const String updateProduct = r'''
    mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
      updateProduct(id: $id, input: $input) {
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
        updatedAt
      }
    }
  ''';

  /// Delete product
  static const String deleteProduct = r'''
    mutation DeleteProduct($id: ID!) {
      deleteProduct(id: $id) {
        success
        error
      }
    }
  ''';

  /// Bulk update product status
  static const String bulkUpdateProductStatus = r'''
    mutation BulkUpdateProductStatus($ids: [ID!]!, $status: String!) {
      bulkUpdateProductStatus(ids: $ids, status: $status) {
        success
        updatedCount
        error
      }
    }
  ''';

  /// Update product stock
  static const String updateStock = r'''
    mutation UpdateProductStock(
      $productId: ID!
      $variantId: ID
      $quantity: Int!
      $reason: String
    ) {
      updateProductStock(
        productId: $productId
        variantId: $variantId
        quantity: $quantity
        reason: $reason
      ) {
        success
        newQuantity
        error
      }
    }
  ''';

  /// Create product variant
  static const String createVariant = r'''
    mutation CreateProductVariant($productId: ID!, $input: CreateVariantInput!) {
      createProductVariant(productId: $productId, input: $input) {
        id
        name
        sku
        price
        stockQuantity
        attributes
      }
    }
  ''';

  /// Update product variant
  static const String updateVariant = r'''
    mutation UpdateProductVariant($id: ID!, $input: UpdateVariantInput!) {
      updateProductVariant(id: $id, input: $input) {
        id
        name
        sku
        price
        stockQuantity
        attributes
      }
    }
  ''';

  /// Delete product variant
  static const String deleteVariant = r'''
    mutation DeleteProductVariant($id: ID!) {
      deleteProductVariant(id: $id) {
        success
        error
      }
    }
  ''';
}

/// Category Mutations
class CategoryMutations {
  /// Create category
  static const String createCategory = r'''
    mutation CreateCategory($input: CreateCategoryInput!) {
      createCategory(input: $input) {
        id
        name
        nameAr
        description
        image
        parentId
        sortOrder
        isActive
      }
    }
  ''';

  /// Update category
  static const String updateCategory = r'''
    mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
      updateCategory(id: $id, input: $input) {
        id
        name
        nameAr
        description
        image
        parentId
        sortOrder
        isActive
      }
    }
  ''';

  /// Delete category
  static const String deleteCategory = r'''
    mutation DeleteCategory($id: ID!) {
      deleteCategory(id: $id) {
        success
        error
      }
    }
  ''';

  /// Reorder categories
  static const String reorderCategories = r'''
    mutation ReorderCategories($merchantId: ID!, $categoryOrders: [CategoryOrderInput!]!) {
      reorderCategories(merchantId: $merchantId, categoryOrders: $categoryOrders) {
        success
      }
    }
  ''';
}

/// Order Mutations
class OrderMutations {
  /// Update order status
  static const String updateOrderStatus = r'''
    mutation UpdateOrderStatus($orderId: ID!, $status: String!, $note: String) {
      updateOrderStatus(orderId: $orderId, status: $status, note: $note) {
        id
        status
        statusHistory {
          status
          note
          createdAt
        }
      }
    }
  ''';

  /// Assign delivery
  static const String assignDelivery = r'''
    mutation AssignDelivery($orderId: ID!, $driverId: ID!, $estimatedTime: String) {
      assignDelivery(orderId: $orderId, driverId: $driverId, estimatedTime: $estimatedTime) {
        success
        error
      }
    }
  ''';

  /// Cancel order
  static const String cancelOrder = r'''
    mutation MerchantCancelOrder($orderId: ID!, $reason: String!) {
      merchantCancelOrder(orderId: $orderId, reason: $reason) {
        success
        refundAmount
        error
      }
    }
  ''';

  /// Refund order
  static const String refundOrder = r'''
    mutation RefundOrder($orderId: ID!, $amount: Float!, $reason: String!) {
      refundOrder(orderId: $orderId, amount: $amount, reason: $reason) {
        success
        refundId
        error
      }
    }
  ''';

  /// Print order
  static const String markOrderPrinted = r'''
    mutation MarkOrderPrinted($orderId: ID!) {
      markOrderPrinted(orderId: $orderId) {
        success
      }
    }
  ''';
}

/// Delivery Mutations
class DeliveryMutations {
  /// Create delivery slot
  static const String createDeliverySlot = r'''
    mutation CreateDeliverySlot($input: CreateDeliverySlotInput!) {
      createDeliverySlot(input: $input) {
        id
        date
        startTime
        endTime
        capacity
        isAvailable
      }
    }
  ''';

  /// Update delivery slot
  static const String updateDeliverySlot = r'''
    mutation UpdateDeliverySlot($id: ID!, $input: UpdateDeliverySlotInput!) {
      updateDeliverySlot(id: $id, input: $input) {
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

  /// Delete delivery slot
  static const String deleteDeliverySlot = r'''
    mutation DeleteDeliverySlot($id: ID!) {
      deleteDeliverySlot(id: $id) {
        success
        error
      }
    }
  ''';

  /// Create delivery zone
  static const String createDeliveryZone = r'''
    mutation CreateDeliveryZone($input: CreateDeliveryZoneInput!) {
      createDeliveryZone(input: $input) {
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

  /// Update delivery zone
  static const String updateDeliveryZone = r'''
    mutation UpdateDeliveryZone($id: ID!, $input: UpdateDeliveryZoneInput!) {
      updateDeliveryZone(id: $id, input: $input) {
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

  /// Delete delivery zone
  static const String deleteDeliveryZone = r'''
    mutation DeleteDeliveryZone($id: ID!) {
      deleteDeliveryZone(id: $id) {
        success
        error
      }
    }
  ''';
}

/// Review Mutations
class ReviewMutations {
  /// Reply to review
  static const String replyToReview = r'''
    mutation ReplyToReview($reviewId: ID!, $reply: String!) {
      replyToReview(reviewId: $reviewId, reply: $reply) {
        id
        reply
        repliedAt
      }
    }
  ''';

  /// Report review
  static const String reportReview = r'''
    mutation ReportReview($reviewId: ID!, $reason: String!) {
      reportReview(reviewId: $reviewId, reason: $reason) {
        success
      }
    }
  ''';
}

/// Notification Mutations
class NotificationMutations {
  /// Mark notification as read
  static const String markAsRead = r'''
    mutation MarkMerchantNotificationAsRead($id: ID!) {
      markMerchantNotificationAsRead(id: $id) {
        success
      }
    }
  ''';

  /// Mark all notifications as read
  static const String markAllAsRead = r'''
    mutation MarkAllMerchantNotificationsAsRead($merchantId: ID!) {
      markAllMerchantNotificationsAsRead(merchantId: $merchantId) {
        success
        updatedCount
      }
    }
  ''';

  /// Update FCM token
  static const String updateFcmToken = r'''
    mutation UpdateMerchantFcmToken($merchantId: ID!, $token: String!) {
      updateMerchantFcmToken(merchantId: $merchantId, token: $token) {
        success
      }
    }
  ''';
}

/// Coupon Mutations
class CouponMutations {
  /// Create coupon
  static const String createCoupon = r'''
    mutation CreateCoupon($input: CreateCouponInput!) {
      createCoupon(input: $input) {
        id
        code
        type
        value
        minimumOrder
        maxUses
        usedCount
        startDate
        endDate
        isActive
      }
    }
  ''';

  /// Update coupon
  static const String updateCoupon = r'''
    mutation UpdateCoupon($id: ID!, $input: UpdateCouponInput!) {
      updateCoupon(id: $id, input: $input) {
        id
        code
        type
        value
        minimumOrder
        maxUses
        usedCount
        startDate
        endDate
        isActive
      }
    }
  ''';

  /// Delete coupon
  static const String deleteCoupon = r'''
    mutation DeleteCoupon($id: ID!) {
      deleteCoupon(id: $id) {
        success
        error
      }
    }
  ''';
}
