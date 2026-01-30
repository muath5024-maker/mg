/**
 * Base GraphQL Type Definitions
 * Common types, scalars, and directives
 */

export const baseTypeDefs = /* GraphQL */ `
  # Custom Scalars
  scalar DateTime
  scalar JSON
  scalar UUID

  # Pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalCount: Int!
  }

  # Common Input Types
  input PaginationInput {
    first: Int
    after: String
    last: Int
    before: String
    limit: Int
    offset: Int
  }

  input SortInput {
    field: String!
    direction: SortDirection!
  }

  enum SortDirection {
    ASC
    DESC
  }

  # Common Response Types
  type MutationResponse {
    success: Boolean!
    message: String
    code: String
  }

  type DeleteResponse {
    success: Boolean!
    message: String
    deletedId: UUID
  }

  # Money Type
  type Money {
    amount: Float!
    currency: String!
    formatted: String!
  }

  # Image Type
  type Image {
    url: String!
    alt: String
    width: Int
    height: Int
  }

  # Address Type (shared)
  type Address {
    id: UUID!
    type: String
    label: String
    fullName: String
    phone: String
    countryCode: String
    country: String
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
    formattedAddress: String
    isDefault: Boolean
    isVerified: Boolean
  }

  input AddressInput {
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
  }

  # Root Types
  type Query {
    # Health check
    _health: String!
  }

  type Mutation {
    # Placeholder - will be extended
    _empty: String
  }

  type Subscription {
    # Placeholder - will be extended
    _empty: String
  }
`;
