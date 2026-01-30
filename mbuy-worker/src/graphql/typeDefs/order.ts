/**
 * Order GraphQL Type Definitions
 */

export const orderTypeDefs = /* GraphQL */ `
  # Order Type
  type Order {
    id: UUID!
    orderNumber: String!
    status: OrderStatus!
    paymentStatus: PaymentStatus!
    fulfillmentStatus: String
    
    # Totals
    subtotal: Float!
    taxAmount: Float!
    discountAmount: Float!
    shippingAmount: Float!
    totalAmount: Float!
    currency: String!
    
    # Formatted totals
    subtotalFormatted: String!
    taxFormatted: String!
    discountFormatted: String!
    shippingFormatted: String!
    totalFormatted: String!
    
    # Delivery
    deliveryType: String
    deliveryAddress: JSON
    deliveryNotes: String
    scheduledDeliveryAt: DateTime
    deliveredAt: DateTime
    
    # Customer Info
    customerName: String
    customerPhone: String
    customerEmail: String
    
    # Payment
    paymentMethod: String
    paymentGateway: String
    paymentTransactionId: String
    paidAt: DateTime
    
    # Coupon
    couponCode: String
    couponDiscount: Float
    
    # Tracking
    trackingNumber: String
    trackingUrl: String
    
    # Notes
    customerNotes: String
    merchantNotes: String
    
    # Cancellation
    cancelledAt: DateTime
    cancellationReason: String
    cancelledBy: String
    
    # Refund
    refundedAt: DateTime
    refundAmount: Float
    refundReason: String
    
    # Metadata
    source: String
    metadata: JSON
    
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    customer: Customer
    merchant: Merchant!
    items: [OrderItem!]!
    statusHistory: [OrderStatusHistory!]!
    payment: Payment
  }

  enum OrderStatus {
    pending
    confirmed
    preparing
    ready
    shipped
    delivered
    cancelled
  }

  enum PaymentStatus {
    pending
    paid
    failed
    refunded
  }

  # Order Item
  type OrderItem {
    id: UUID!
    productName: String!
    productNameAr: String
    variantName: String
    sku: String
    imageUrl: String
    unitPrice: Float!
    quantity: Int!
    totalPrice: Float!
    discountAmount: Float
    options: JSON
    notes: String
    fulfilledQuantity: Int
    
    # Relations
    product: Product
    variant: ProductVariant
  }

  # Order Status History
  type OrderStatusHistory {
    id: UUID!
    status: String!
    previousStatus: String
    note: String
    changedBy: String
    createdAt: DateTime!
  }

  # Payment
  type Payment {
    id: UUID!
    paymentNumber: String
    amount: Float!
    currency: String!
    method: String!
    gateway: String
    status: String!
    cardBrand: String
    cardLast4: String
    failureCode: String
    failureMessage: String
    refundedAmount: Float
    processedAt: DateTime
    completedAt: DateTime
    createdAt: DateTime!
  }

  # Connections
  type OrderConnection {
    edges: [OrderEdge!]!
    pageInfo: PageInfo!
  }

  type OrderEdge {
    node: Order!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Get order by ID or number
    order(id: UUID, orderNumber: String): Order
    
    # My orders (customer)
    myOrders(
      pagination: PaginationInput
      status: OrderStatus
    ): OrderConnection!
    
    # Merchant orders
    merchantOrders(
      pagination: PaginationInput
      status: OrderStatus
      paymentStatus: PaymentStatus
      dateFrom: DateTime
      dateTo: DateTime
      search: String
      sort: SortInput
    ): OrderConnection!
    
    # Order stats
    orderStats(
      merchantId: UUID
      dateFrom: DateTime
      dateTo: DateTime
    ): OrderStats!
  }

  # Order Stats
  type OrderStats {
    totalOrders: Int!
    totalRevenue: Float!
    averageOrderValue: Float!
    pendingOrders: Int!
    completedOrders: Int!
    cancelledOrders: Int!
    byStatus: [OrderStatusCount!]!
    byPaymentMethod: [PaymentMethodCount!]!
  }

  type OrderStatusCount {
    status: String!
    count: Int!
  }

  type PaymentMethodCount {
    method: String!
    count: Int!
    total: Float!
  }

  # Inputs
  input CreateOrderInput {
    merchantId: UUID!
    items: [OrderItemInput!]!
    deliveryType: String
    deliveryAddressId: UUID
    deliveryAddress: AddressInput
    deliveryNotes: String
    scheduledDeliveryAt: DateTime
    customerNotes: String
    couponCode: String
    paymentMethod: String!
    source: String
    metadata: JSON
  }

  input OrderItemInput {
    productId: UUID!
    variantId: UUID
    quantity: Int!
    notes: String
  }

  input UpdateOrderStatusInput {
    status: OrderStatus!
    note: String
  }

  # Mutations
  extend type Mutation {
    # Create order (customer)
    createOrder(input: CreateOrderInput!): Order!
    
    # Update order status (merchant)
    updateOrderStatus(id: UUID!, input: UpdateOrderStatusInput!): Order!
    
    # Cancel order
    cancelOrder(id: UUID!, reason: String): Order!
    
    # Merchant notes
    updateOrderNotes(id: UUID!, merchantNotes: String!): Order!
    
    # Refund order
    refundOrder(id: UUID!, amount: Float!, reason: String): Order!
    
    # Reorder (customer)
    reorder(orderId: UUID!): Order!
  }
`;
