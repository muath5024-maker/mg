/**
 * Merchant GraphQL Type Definitions
 */

export const merchantTypeDefs = /* GraphQL */ `
  # Merchant Type
  type Merchant {
    id: UUID!
    businessName: String!
    businessNameAr: String
    slug: String
    description: String
    descriptionAr: String
    logoUrl: String
    bannerUrl: String
    businessType: String
    
    # Contact
    phone: String
    email: String
    whatsapp: String
    website: String
    
    # Location
    countryCode: String
    city: String
    district: String
    street: String
    latitude: Float
    longitude: Float
    
    # Settings
    currency: String!
    taxEnabled: Boolean
    taxRate: Float
    minOrderAmount: Float
    deliveryEnabled: Boolean
    pickupEnabled: Boolean
    
    # Stats
    rating: Float
    reviewCount: Int
    totalOrders: Int
    
    # Status
    status: MerchantStatus!
    verified: Boolean
    featured: Boolean
    
    # Subscription
    subscriptionPlan: String
    subscriptionExpiresAt: DateTime
    
    # Metadata
    settings: JSON
    socialLinks: JSON
    workingHours: JSON
    
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    category: Category
    products(
      pagination: PaginationInput
      status: ProductStatus
      categoryId: UUID
    ): ProductConnection!
    categories: [Category!]!
    orders(
      pagination: PaginationInput
      status: OrderStatus
    ): OrderConnection!
  }

  enum MerchantStatus {
    pending
    active
    suspended
  }

  # Merchant User (staff)
  type MerchantUser {
    id: UUID!
    phone: String!
    email: String
    fullName: String
    role: String!
    permissions: JSON
    avatarUrl: String
    lastLoginAt: DateTime
    status: String!
    createdAt: DateTime!
    
    # Relations
    merchant: Merchant!
  }

  # Connections
  type MerchantConnection {
    edges: [MerchantEdge!]!
    pageInfo: PageInfo!
  }

  type MerchantEdge {
    node: Merchant!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Get current merchant (for merchant app)
    myMerchant: Merchant
    
    # Get merchant by ID or slug
    merchant(id: UUID, slug: String): Merchant
    
    # List merchants (public)
    merchants(
      pagination: PaginationInput
      categoryId: UUID
      city: String
      featured: Boolean
      search: String
      sort: SortInput
    ): MerchantConnection!
    
    # Get nearby merchants
    nearbyMerchants(
      latitude: Float!
      longitude: Float!
      radiusKm: Float
      limit: Int
    ): [Merchant!]!
    
    # Merchant dashboard stats
    merchantDashboard: MerchantDashboard
  }

  # Dashboard Stats
  type MerchantDashboard {
    todayOrders: Int!
    todayRevenue: Float!
    pendingOrders: Int!
    totalProducts: Int!
    lowStockProducts: Int!
    recentOrders: [Order!]!
    topProducts: [Product!]!
    salesChart: [SalesDataPoint!]!
  }

  type SalesDataPoint {
    date: String!
    orders: Int!
    revenue: Float!
  }

  # Inputs
  input UpdateMerchantInput {
    businessName: String
    businessNameAr: String
    description: String
    descriptionAr: String
    logoUrl: String
    bannerUrl: String
    phone: String
    email: String
    whatsapp: String
    website: String
    city: String
    district: String
    street: String
    latitude: Float
    longitude: Float
    taxEnabled: Boolean
    taxRate: Float
    minOrderAmount: Float
    deliveryEnabled: Boolean
    pickupEnabled: Boolean
    settings: JSON
    socialLinks: JSON
    workingHours: JSON
  }

  input CreateMerchantUserInput {
    phone: String!
    email: String
    fullName: String
    role: String!
    permissions: JSON
  }

  input UpdateMerchantUserInput {
    email: String
    fullName: String
    role: String
    permissions: JSON
    status: String
  }

  # Mutations
  extend type Mutation {
    # Update merchant profile
    updateMerchant(input: UpdateMerchantInput!): Merchant!
    
    # Staff management
    createMerchantUser(input: CreateMerchantUserInput!): MerchantUser!
    updateMerchantUser(id: UUID!, input: UpdateMerchantUserInput!): MerchantUser!
    deleteMerchantUser(id: UUID!): DeleteResponse!
    
    # Merchant settings
    updateMerchantSetting(key: String!, value: JSON!): MutationResponse!
  }
`;
