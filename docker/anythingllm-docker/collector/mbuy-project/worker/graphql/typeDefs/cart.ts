/**
 * Cart GraphQL Type Definitions
 */

export const cartTypeDefs = /* GraphQL */ `
  # Cart Type
  type Cart {
    id: UUID!
    status: String!
    itemCount: Int!
    subtotal: Float!
    subtotalFormatted: String!
    
    # Coupon
    couponCode: String
    couponDiscount: Float
    couponDiscountFormatted: String
    
    # Calculated totals
    taxAmount: Float!
    taxFormatted: String!
    shippingAmount: Float!
    shippingFormatted: String!
    totalAmount: Float!
    totalFormatted: String!
    
    # Timestamps
    lastActivityAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    customer: Customer
    merchant: Merchant!
    items: [CartItem!]!
  }

  # Cart Item
  type CartItem {
    id: UUID!
    quantity: Int!
    unitPrice: Float!
    unitPriceFormatted: String!
    totalPrice: Float!
    totalPriceFormatted: String!
    options: JSON
    notes: String
    
    # Stock status
    inStock: Boolean!
    availableQuantity: Int
    priceChanged: Boolean!
    originalPrice: Float
    
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    product: Product!
    variant: ProductVariant
  }

  # Cart Summary (for checkout)
  type CartSummary {
    itemCount: Int!
    subtotal: Float!
    taxAmount: Float!
    shippingAmount: Float!
    discountAmount: Float!
    totalAmount: Float!
    currency: String!
    
    # Formatted
    subtotalFormatted: String!
    taxFormatted: String!
    shippingFormatted: String!
    discountFormatted: String!
    totalFormatted: String!
    
    # Coupon
    couponCode: String
    couponValid: Boolean
    couponMessage: String
    
    # Delivery options
    deliveryAvailable: Boolean!
    pickupAvailable: Boolean!
    estimatedDeliveryTime: String
    
    # Minimum order
    meetsMinimumOrder: Boolean!
    minimumOrderAmount: Float
    minimumOrderMessage: String
  }

  # Queries
  extend type Query {
    # Get current cart for merchant
    cart(merchantId: UUID!): Cart
    
    # Get cart summary for checkout
    cartSummary(
      merchantId: UUID!
      deliveryType: String
      addressId: UUID
      couponCode: String
    ): CartSummary!
    
    # Validate cart before checkout
    validateCart(merchantId: UUID!): CartValidation!
  }

  # Cart Validation
  type CartValidation {
    valid: Boolean!
    errors: [CartError!]!
    warnings: [CartWarning!]!
  }

  type CartError {
    type: String!
    message: String!
    itemId: UUID
    productId: UUID
  }

  type CartWarning {
    type: String!
    message: String!
    itemId: UUID
    productId: UUID
  }

  # Inputs
  input AddToCartInput {
    merchantId: UUID!
    productId: UUID!
    variantId: UUID
    quantity: Int!
    options: JSON
    notes: String
  }

  input UpdateCartItemInput {
    quantity: Int
    options: JSON
    notes: String
  }

  # Mutations
  extend type Mutation {
    # Add item to cart
    addToCart(input: AddToCartInput!): Cart!
    
    # Update cart item
    updateCartItem(itemId: UUID!, input: UpdateCartItemInput!): Cart!
    
    # Remove item from cart
    removeFromCart(itemId: UUID!): Cart!
    
    # Clear cart
    clearCart(merchantId: UUID!): DeleteResponse!
    
    # Apply coupon
    applyCoupon(merchantId: UUID!, couponCode: String!): Cart!
    
    # Remove coupon
    removeCoupon(merchantId: UUID!): Cart!
    
    # Move item to saved
    moveToSaved(itemId: UUID!): Cart!
    
    # Move saved to cart
    moveSavedToCart(productId: UUID!, variantId: UUID, merchantId: UUID!): Cart!
    
    # Merge guest cart with logged in user
    mergeCart(sessionId: String!, merchantId: UUID!): Cart!
  }
`;
