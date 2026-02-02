/**
 * Product GraphQL Type Definitions
 */

export const productTypeDefs = /* GraphQL */ `
  # Product Type
  type Product {
    id: UUID!
    name: String!
    nameAr: String
    slug: String
    description: String
    descriptionAr: String
    sku: String
    barcode: String
    
    # Pricing
    price: Float!
    compareAtPrice: Float
    costPrice: Float
    priceFormatted: String!
    hasDiscount: Boolean!
    discountPercentage: Int
    
    # Inventory
    stockQuantity: Int
    lowStockThreshold: Int
    trackInventory: Boolean
    allowBackorder: Boolean
    inStock: Boolean!
    
    # Media
    images: [String!]!
    thumbnailUrl: String
    videoUrl: String
    
    # Attributes
    weight: Float
    weightUnit: String
    dimensions: JSON
    
    # Variants
    hasVariants: Boolean
    options: JSON
    
    # Status
    status: ProductStatus!
    visibility: String
    featured: Boolean
    
    # SEO
    metaTitle: String
    metaDescription: String
    
    # Stats
    viewCount: Int
    salesCount: Int
    rating: Float
    reviewCount: Int
    
    # Tags
    tags: [String!]!
    
    createdAt: DateTime!
    updatedAt: DateTime
    publishedAt: DateTime
    
    # Relations
    merchant: Merchant!
    category: Category
    variants: [ProductVariant!]!
    reviews(pagination: PaginationInput): ReviewConnection!
  }

  enum ProductStatus {
    draft
    active
    archived
  }

  # Product Variant
  type ProductVariant {
    id: UUID!
    name: String!
    sku: String
    barcode: String
    options: JSON!
    price: Float!
    compareAtPrice: Float
    stockQuantity: Int
    imageUrl: String
    status: String
    inStock: Boolean!
    
    # Relations
    product: Product!
  }

  # Review
  type Review {
    id: UUID!
    rating: Int!
    title: String
    comment: String
    images: [String!]
    helpful: Int
    verified: Boolean
    createdAt: DateTime!
    
    # Relations
    customer: Customer!
    product: Product!
  }

  # Connections
  type ProductConnection {
    edges: [ProductEdge!]!
    pageInfo: PageInfo!
  }

  type ProductEdge {
    node: Product!
    cursor: String!
  }

  type ReviewConnection {
    edges: [ReviewEdge!]!
    pageInfo: PageInfo!
    averageRating: Float
    totalCount: Int!
  }

  type ReviewEdge {
    node: Review!
    cursor: String!
  }

  # Queries
  extend type Query {
    # Get product by ID or slug
    product(id: UUID, slug: String, merchantId: UUID): Product
    
    # List products
    products(
      pagination: PaginationInput
      merchantId: UUID
      categoryId: UUID
      status: ProductStatus
      featured: Boolean
      inStock: Boolean
      minPrice: Float
      maxPrice: Float
      search: String
      tags: [String!]
      sort: SortInput
    ): ProductConnection!
    
    # Search products
    searchProducts(
      query: String!
      merchantId: UUID
      limit: Int
    ): [Product!]!
    
    # Get featured products
    featuredProducts(
      merchantId: UUID
      limit: Int
    ): [Product!]!
    
    # Get product reviews
    productReviews(
      productId: UUID!
      pagination: PaginationInput
      sort: SortInput
    ): ReviewConnection!
  }

  # Inputs
  input CreateProductInput {
    name: String!
    nameAr: String
    description: String
    descriptionAr: String
    sku: String
    barcode: String
    price: Float!
    compareAtPrice: Float
    costPrice: Float
    stockQuantity: Int
    lowStockThreshold: Int
    trackInventory: Boolean
    allowBackorder: Boolean
    images: [String!]
    thumbnailUrl: String
    videoUrl: String
    weight: Float
    weightUnit: String
    dimensions: JSON
    categoryId: UUID
    status: ProductStatus
    visibility: String
    featured: Boolean
    tags: [String!]
    metaTitle: String
    metaDescription: String
  }

  input UpdateProductInput {
    name: String
    nameAr: String
    description: String
    descriptionAr: String
    sku: String
    barcode: String
    price: Float
    compareAtPrice: Float
    costPrice: Float
    stockQuantity: Int
    lowStockThreshold: Int
    trackInventory: Boolean
    allowBackorder: Boolean
    images: [String!]
    thumbnailUrl: String
    videoUrl: String
    weight: Float
    weightUnit: String
    dimensions: JSON
    categoryId: UUID
    status: ProductStatus
    visibility: String
    featured: Boolean
    tags: [String!]
    metaTitle: String
    metaDescription: String
  }

  input CreateVariantInput {
    name: String!
    sku: String
    barcode: String
    options: JSON!
    price: Float!
    compareAtPrice: Float
    stockQuantity: Int
    imageUrl: String
  }

  input UpdateVariantInput {
    name: String
    sku: String
    barcode: String
    options: JSON
    price: Float
    compareAtPrice: Float
    stockQuantity: Int
    imageUrl: String
    status: String
  }

  input CreateReviewInput {
    productId: UUID!
    rating: Int!
    title: String
    comment: String
    images: [String!]
  }

  # Mutations
  extend type Mutation {
    # Product CRUD (merchant only)
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: UUID!, input: UpdateProductInput!): Product!
    deleteProduct(id: UUID!): DeleteResponse!
    
    # Bulk operations
    bulkUpdateProducts(ids: [UUID!]!, input: UpdateProductInput!): [Product!]!
    bulkDeleteProducts(ids: [UUID!]!): DeleteResponse!
    
    # Variant CRUD
    createVariant(productId: UUID!, input: CreateVariantInput!): ProductVariant!
    updateVariant(id: UUID!, input: UpdateVariantInput!): ProductVariant!
    deleteVariant(id: UUID!): DeleteResponse!
    
    # Inventory
    updateStock(productId: UUID!, variantId: UUID, quantity: Int!): Product!
    adjustStock(productId: UUID!, variantId: UUID, adjustment: Int!, reason: String): Product!
    
    # Reviews (customer only)
    createReview(input: CreateReviewInput!): Review!
    deleteReview(id: UUID!): DeleteResponse!
  }
`;
