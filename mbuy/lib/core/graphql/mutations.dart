/// GraphQL Mutations for Customer App
///
/// All GraphQL mutation definitions
library;

/// Auth Mutations
class AuthMutations {
  static const String login = r'''
    mutation Login($phone: String!, $password: String!) {
      loginCustomer(phone: $phone, password: $password) {
        token
        customer {
          id
          fullName
          email
          phone
          avatarUrl
          isVerified
        }
      }
    }
  ''';

  static const String register = r'''
    mutation Register($input: RegisterCustomerInput!) {
      registerCustomer(input: $input) {
        token
        customer {
          id
          fullName
          email
          phone
        }
      }
    }
  ''';

  static const String verifyOtp = r'''
    mutation VerifyOtp($phone: String!, $otp: String!) {
      verifyOtp(phone: $phone, otp: $otp) {
        success
        message
      }
    }
  ''';

  static const String requestOtp = r'''
    mutation RequestOtp($phone: String!) {
      requestOtp(phone: $phone) {
        success
        message
        expiresIn
      }
    }
  ''';

  static const String refreshToken = r'''
    mutation RefreshToken($token: String!) {
      refreshToken(token: $token) {
        token
        expiresAt
      }
    }
  ''';

  static const String logout = r'''
    mutation Logout {
      logout {
        success
      }
    }
  ''';
}

/// Cart Mutations
class CartMutations {
  static const String addToCart = r'''
    mutation AddToCart($input: AddToCartInput!) {
      addToCart(input: $input) {
        id
        items {
          id
          productId
          variantId
          quantity
          unitPrice
        }
        totalItems
        subtotal
      }
    }
  ''';

  static const String updateCartItem = r'''
    mutation UpdateCartItem($itemId: ID!, $quantity: Int!) {
      updateCartItem(itemId: $itemId, quantity: $quantity) {
        id
        items {
          id
          quantity
        }
        totalItems
        subtotal
      }
    }
  ''';

  static const String removeFromCart = r'''
    mutation RemoveFromCart($itemId: ID!) {
      removeFromCart(itemId: $itemId) {
        id
        totalItems
        subtotal
      }
    }
  ''';

  static const String clearCart = r'''
    mutation ClearCart($customerId: ID!, $merchantId: ID!) {
      clearCart(customerId: $customerId, merchantId: $merchantId) {
        success
      }
    }
  ''';

  static const String addToWishlist = r'''
    mutation AddToWishlist($customerId: ID!, $productId: ID!) {
      addToWishlist(customerId: $customerId, productId: $productId) {
        id
        productId
        addedAt
      }
    }
  ''';

  static const String removeFromWishlist = r'''
    mutation RemoveFromWishlist($customerId: ID!, $productId: ID!) {
      removeFromWishlist(customerId: $customerId, productId: $productId) {
        success
      }
    }
  ''';
}

/// Order Mutations
class OrderMutations {
  static const String createOrder = r'''
    mutation CreateOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
        id
        orderNumber
        status
        totalAmount
        payment {
          id
          gateway
          checkoutUrl
        }
      }
    }
  ''';

  static const String cancelOrder = r'''
    mutation CancelOrder($orderId: ID!, $reason: String) {
      cancelOrder(orderId: $orderId, reason: $reason) {
        id
        status
        cancelledAt
      }
    }
  ''';

  static const String reorder = r'''
    mutation Reorder($orderId: ID!) {
      reorder(orderId: $orderId) {
        id
        items {
          id
          productId
          quantity
        }
        totalItems
        subtotal
      }
    }
  ''';
}

/// Payment Mutations
class PaymentMutations {
  static const String initiatePayment = r'''
    mutation InitiatePayment($input: InitiatePaymentInput!) {
      initiatePayment(input: $input) {
        id
        checkoutUrl
        gateway
        amount
        status
      }
    }
  ''';

  static const String verifyPayment = r'''
    mutation VerifyPayment($paymentId: ID!, $transactionId: String!) {
      verifyPayment(paymentId: $paymentId, transactionId: $transactionId) {
        id
        status
        paidAt
        order {
          id
          status
          paymentStatus
        }
      }
    }
  ''';
}

/// Customer Mutations
class CustomerMutations {
  static const String updateProfile = r'''
    mutation UpdateProfile($input: UpdateProfileInput!) {
      updateProfile(input: $input) {
        id
        fullName
        email
        phone
        avatarUrl
      }
    }
  ''';

  static const String addAddress = r'''
    mutation AddAddress($input: AddressInput!) {
      addAddress(input: $input) {
        id
        label
        street
        city
        state
        country
        postalCode
        isDefault
      }
    }
  ''';

  static const String updateAddress = r'''
    mutation UpdateAddress($id: ID!, $input: AddressInput!) {
      updateAddress(id: $id, input: $input) {
        id
        label
        street
        city
        isDefault
      }
    }
  ''';

  static const String deleteAddress = r'''
    mutation DeleteAddress($id: ID!) {
      deleteAddress(id: $id) {
        success
      }
    }
  ''';

  static const String setDefaultAddress = r'''
    mutation SetDefaultAddress($id: ID!) {
      setDefaultAddress(id: $id) {
        id
        isDefault
      }
    }
  ''';

  static const String updateFcmToken = r'''
    mutation UpdateFcmToken($token: String!) {
      updateFcmToken(token: $token) {
        success
      }
    }
  ''';
}

/// Review Mutations
class ReviewMutations {
  static const String createReview = r'''
    mutation CreateReview($input: CreateReviewInput!) {
      createReview(input: $input) {
        id
        rating
        comment
        createdAt
      }
    }
  ''';

  static const String updateReview = r'''
    mutation UpdateReview($id: ID!, $rating: Int, $comment: String) {
      updateReview(id: $id, rating: $rating, comment: $comment) {
        id
        rating
        comment
        updatedAt
      }
    }
  ''';

  static const String deleteReview = r'''
    mutation DeleteReview($id: ID!) {
      deleteReview(id: $id) {
        success
      }
    }
  ''';
}

/// Notification Mutations
class NotificationMutations {
  static const String markAsRead = r'''
    mutation MarkNotificationAsRead($id: ID!) {
      markNotificationAsRead(id: $id) {
        id
        read
      }
    }
  ''';

  static const String markAllAsRead = r'''
    mutation MarkAllNotificationsAsRead($customerId: ID!) {
      markAllNotificationsAsRead(customerId: $customerId) {
        success
        updatedCount
      }
    }
  ''';
}

/// Loyalty Mutations
class LoyaltyMutations {
  static const String redeemPoints = r'''
    mutation RedeemPoints($input: RedeemPointsInput!) {
      redeemPoints(input: $input) {
        transactionId
        newBalance
        rewardCode
      }
    }
  ''';
}
