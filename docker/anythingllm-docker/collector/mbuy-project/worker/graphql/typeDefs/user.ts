/**
 * User GraphQL Type Definitions
 * Customer types and operations
 */

export const userTypeDefs = /* GraphQL */ `
  # Customer Type
  type Customer {
    id: UUID!
    phone: String!
    phoneVerified: Boolean
    email: String
    emailVerified: Boolean
    fullName: String
    avatarUrl: String
    dateOfBirth: DateTime
    gender: String
    preferredLanguage: String
    marketingConsent: Boolean
    lastLoginAt: DateTime
    status: String!
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    addresses: [Address!]!
    orders(pagination: PaginationInput): OrderConnection!
    cart(merchantId: UUID!): Cart
    savedItems: [SavedItem!]!
    notifications(unreadOnly: Boolean): [Notification!]!
  }

  # Saved Item
  type SavedItem {
    id: UUID!
    product: Product!
    variant: ProductVariant
    createdAt: DateTime!
  }

  # Notification
  type Notification {
    id: UUID!
    type: String!
    category: String
    title: String!
    titleAr: String
    body: String
    bodyAr: String
    imageUrl: String
    actionType: String
    actionData: JSON
    isRead: Boolean!
    readAt: DateTime
    createdAt: DateTime!
  }

  # Connections
  type CustomerConnection {
    edges: [CustomerEdge!]!
    pageInfo: PageInfo!
  }

  type CustomerEdge {
    node: Customer!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Get current authenticated customer
    me: Customer
    
    # Get customer by ID (admin only)
    customer(id: UUID!): Customer
    
    # List customers (admin only)
    customers(
      pagination: PaginationInput
      search: String
      status: String
    ): CustomerConnection!
    
    # Get my addresses
    myAddresses: [Address!]!
    
    # Get my notifications
    myNotifications(
      unreadOnly: Boolean
      pagination: PaginationInput
    ): [Notification!]!
  }

  # Inputs
  input UpdateProfileInput {
    fullName: String
    email: String
    dateOfBirth: DateTime
    gender: String
    preferredLanguage: String
    marketingConsent: Boolean
    avatarUrl: String
  }

  input CreateAddressInput {
    type: String
    label: String
    fullName: String
    phone: String
    countryCode: String
    city: String!
    district: String
    street: String
    buildingNumber: String
    apartmentNumber: String
    floor: String
    postalCode: String
    additionalInfo: String
    landmark: String
    latitude: Float
    longitude: Float
    isDefault: Boolean
  }

  input UpdateAddressInput {
    type: String
    label: String
    fullName: String
    phone: String
    city: String
    district: String
    street: String
    buildingNumber: String
    apartmentNumber: String
    floor: String
    postalCode: String
    additionalInfo: String
    landmark: String
    latitude: Float
    longitude: Float
    isDefault: Boolean
  }

  # Mutations
  extend type Mutation {
    # Update current customer profile
    updateProfile(input: UpdateProfileInput!): Customer!
    
    # Address management
    createAddress(input: CreateAddressInput!): Address!
    updateAddress(id: UUID!, input: UpdateAddressInput!): Address!
    deleteAddress(id: UUID!): DeleteResponse!
    setDefaultAddress(id: UUID!): Address!
    
    # Saved items
    saveItem(productId: UUID!, variantId: UUID): SavedItem!
    removeSavedItem(productId: UUID!, variantId: UUID): DeleteResponse!
    
    # Notifications
    markNotificationRead(id: UUID!): Notification!
    markAllNotificationsRead: MutationResponse!
    
    # Push tokens
    registerPushToken(token: String!, platform: String!, deviceId: String): MutationResponse!
    unregisterPushToken(token: String!): MutationResponse!
  }
`;
