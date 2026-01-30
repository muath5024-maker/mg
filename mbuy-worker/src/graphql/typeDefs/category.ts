/**
 * Category GraphQL Type Definitions
 */

export const categoryTypeDefs = /* GraphQL */ `
  # Category Type
  type Category {
    id: UUID!
    name: String!
    nameAr: String
    slug: String
    description: String
    descriptionAr: String
    imageUrl: String
    iconUrl: String
    bannerUrl: String
    status: String!
    featured: Boolean
    showInMenu: Boolean
    showInHome: Boolean
    level: Int
    path: String
    sortOrder: Int
    productCount: Int
    metaTitle: String
    metaDescription: String
    createdAt: DateTime!
    updatedAt: DateTime
    
    # Relations
    parent: Category
    children: [Category!]!
    products(pagination: PaginationInput): ProductConnection!
    merchant: Merchant
  }

  # Connection
  type CategoryConnection {
    edges: [CategoryEdge!]!
    pageInfo: PageInfo!
  }

  type CategoryEdge {
    node: Category!
    cursor: String!
  }

  # Tree structure
  type CategoryTree {
    category: Category!
    children: [CategoryTree!]!
  }

  # Queries
  extend type Query {
    # Get category by ID or slug
    category(id: UUID, slug: String): Category
    
    # List categories
    categories(
      parentId: UUID
      merchantId: UUID
      status: String
      featured: Boolean
      showInMenu: Boolean
      showInHome: Boolean
      pagination: PaginationInput
    ): CategoryConnection!
    
    # Get category tree (hierarchical)
    categoryTree(
      merchantId: UUID
      rootId: UUID
      maxDepth: Int
    ): [CategoryTree!]!
    
    # Platform categories (for customer app)
    platformCategories(
      featured: Boolean
      showInHome: Boolean
    ): [Category!]!
    
    # Merchant categories
    merchantCategories(
      merchantId: UUID!
    ): [Category!]!
  }

  # Inputs
  input CreateCategoryInput {
    parentId: UUID
    name: String!
    nameAr: String
    description: String
    descriptionAr: String
    imageUrl: String
    iconUrl: String
    bannerUrl: String
    status: String
    featured: Boolean
    showInMenu: Boolean
    showInHome: Boolean
    sortOrder: Int
    metaTitle: String
    metaDescription: String
  }

  input UpdateCategoryInput {
    parentId: UUID
    name: String
    nameAr: String
    description: String
    descriptionAr: String
    imageUrl: String
    iconUrl: String
    bannerUrl: String
    status: String
    featured: Boolean
    showInMenu: Boolean
    showInHome: Boolean
    sortOrder: Int
    metaTitle: String
    metaDescription: String
  }

  # Mutations
  extend type Mutation {
    # Category CRUD (merchant/admin)
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: UUID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: UUID!): DeleteResponse!
    
    # Reorder categories
    reorderCategories(ids: [UUID!]!): [Category!]!
    
    # Move category to new parent
    moveCategory(id: UUID!, newParentId: UUID): Category!
  }
`;
