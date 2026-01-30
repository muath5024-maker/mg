# MBuy API Documentation

## GraphQL API Reference

Base URL: `https://api.mbuy.app/graphql`

---

## Authentication

### Customer Login

```graphql
mutation CustomerLogin($phone: String!, $password: String!) {
  customerLogin(phone: $phone, password: $password) {
    success
    token
    refreshToken
    customer {
      id
      name
      email
      phone
    }
    error
  }
}
```

### Customer Register

```graphql
mutation CustomerRegister($input: RegisterCustomerInput!) {
  registerCustomer(input: $input) {
    success
    token
    refreshToken
    customer {
      id
      name
      phone
    }
    error
  }
}
```

**Input:**
```typescript
interface RegisterCustomerInput {
  phone: string;
  name: string;
  password: string;
  email?: string;
  referralCode?: string;
}
```

### Request OTP

```graphql
mutation RequestOtp($phone: String!, $type: String!) {
  requestOtp(phone: $phone, type: $type) {
    success
    expiresAt
    error
  }
}
```

**Types:** `login`, `register`, `reset_password`

### Verify OTP

```graphql
mutation VerifyOtp($phone: String!, $code: String!, $type: String!) {
  verifyOtp(phone: $phone, code: $code, type: $type) {
    success
    token
    refreshToken
    customer {
      id
      name
    }
    error
  }
}
```

### Merchant Login

```graphql
mutation MerchantLogin($email: String!, $password: String!) {
  merchantLogin(email: $email, password: $password) {
    success
    token
    refreshToken
    merchant {
      id
      name
      email
      isVerified
    }
    error
  }
}
```

### Refresh Token

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    success
    token
    refreshToken
    error
  }
}
```

---

## Products

### Get Products (Paginated)

```graphql
query GetProducts(
  $merchantId: ID!
  $categoryId: ID
  $search: String
  $first: Int
  $after: String
) {
  products(
    merchantId: $merchantId
    categoryId: $categoryId
    search: $search
    first: $first
    after: $after
  ) {
    edges {
      node {
        id
        name
        nameAr
        description
        price
        compareAtPrice
        stockQuantity
        images
        category {
          id
          name
        }
        variants {
          id
          name
          price
          stockQuantity
        }
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
```

### Get Single Product

```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    nameAr
    description
    descriptionAr
    sku
    barcode
    price
    compareAtPrice
    stockQuantity
    images
    isFeatured
    merchant {
      id
      name
      logo
    }
    category {
      id
      name
    }
    variants {
      id
      name
      sku
      price
      stockQuantity
      attributes
    }
    reviews {
      averageRating
      totalCount
    }
  }
}
```

### Get Featured Products

```graphql
query GetFeaturedProducts($merchantId: ID!, $first: Int) {
  featuredProducts(merchantId: $merchantId, first: $first) {
    id
    name
    price
    compareAtPrice
    images
  }
}
```

### Search Products

```graphql
query SearchProducts(
  $query: String!
  $merchantId: ID
  $categoryId: ID
  $minPrice: Float
  $maxPrice: Float
  $first: Int
) {
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
    price
    images
    merchant {
      name
    }
  }
}
```

### Create Product (Merchant)

```graphql
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id
    name
    sku
    price
    stockQuantity
    status
  }
}
```

**Input:**
```typescript
interface CreateProductInput {
  merchantId: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  sku: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId?: string;
  images?: string[];
  isFeatured?: boolean;
  status?: 'draft' | 'active' | 'archived';
}
```

### Update Product (Merchant)

```graphql
mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id
    name
    price
    stockQuantity
    status
    updatedAt
  }
}
```

---

## Categories

### Get Categories

```graphql
query GetCategories($merchantId: ID!) {
  categories(merchantId: $merchantId) {
    id
    name
    nameAr
    description
    image
    parentId
    sortOrder
    isActive
    productCount
    children {
      id
      name
      image
      productCount
    }
  }
}
```

### Get Category Tree

```graphql
query GetCategoryTree($merchantId: ID!) {
  categoryTree(merchantId: $merchantId) {
    id
    name
    children {
      id
      name
      children {
        id
        name
      }
    }
  }
}
```

---

## Cart

### Get Cart

```graphql
query GetCart($customerId: ID!, $merchantId: ID!) {
  cart(customerId: $customerId, merchantId: $merchantId) {
    id
    items {
      id
      productId
      variantId
      quantity
      price
      product {
        name
        images
        stockQuantity
      }
    }
    subtotal
    itemCount
  }
}
```

### Add to Cart

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    items {
      id
      productId
      quantity
      price
    }
    subtotal
    itemCount
  }
}
```

**Input:**
```typescript
interface AddToCartInput {
  customerId: string;
  merchantId: string;
  productId: string;
  variantId?: string;
  quantity: number;
}
```

### Update Cart Item

```graphql
mutation UpdateCartItem($itemId: ID!, $quantity: Int!) {
  updateCartItem(itemId: $itemId, quantity: $quantity) {
    id
    subtotal
    itemCount
  }
}
```

### Remove from Cart

```graphql
mutation RemoveFromCart($itemId: ID!) {
  removeFromCart(itemId: $itemId) {
    id
    subtotal
    itemCount
  }
}
```

### Clear Cart

```graphql
mutation ClearCart($customerId: ID!, $merchantId: ID!) {
  clearCart(customerId: $customerId, merchantId: $merchantId) {
    success
  }
}
```

---

## Wishlist

### Get Wishlist

```graphql
query GetWishlist($customerId: ID!) {
  wishlist(customerId: $customerId) {
    id
    productId
    product {
      id
      name
      price
      images
      merchant {
        name
      }
    }
    createdAt
  }
}
```

### Add to Wishlist

```graphql
mutation AddToWishlist($customerId: ID!, $productId: ID!) {
  addToWishlist(customerId: $customerId, productId: $productId) {
    success
  }
}
```

### Remove from Wishlist

```graphql
mutation RemoveFromWishlist($customerId: ID!, $productId: ID!) {
  removeFromWishlist(customerId: $customerId, productId: $productId) {
    success
  }
}
```

---

## Orders

### Get Orders (Customer)

```graphql
query GetOrders($customerId: ID!, $status: String, $first: Int, $after: String) {
  orders(customerId: $customerId, status: $status, first: $first, after: $after) {
    edges {
      node {
        id
        orderNumber
        status
        total
        itemCount
        createdAt
        merchant {
          name
          logo
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
```

### Get Order Details

```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    orderNumber
    status
    paymentStatus
    paymentMethod
    subtotal
    discount
    deliveryFee
    tax
    total
    notes
    items {
      id
      productName
      variantName
      quantity
      price
      total
      image
    }
    shippingAddress {
      label
      addressLine1
      city
      phone
    }
    deliverySlot {
      date
      startTime
      endTime
    }
    statusHistory {
      status
      note
      createdAt
    }
    createdAt
  }
}
```

### Create Order

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    orderNumber
    status
    total
    paymentUrl
    error
  }
}
```

**Input:**
```typescript
interface CreateOrderInput {
  customerId: string;
  merchantId: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
  shippingAddress: {
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  };
  billingAddress?: AddressInput;
  paymentMethod: 'cash' | 'card' | 'wallet';
  couponCode?: string;
  notes?: string;
  deliverySlotId?: string;
}
```

### Cancel Order (Customer)

```graphql
mutation CancelOrder($orderId: ID!, $reason: String) {
  cancelOrder(orderId: $orderId, reason: $reason) {
    success
    error
  }
}
```

### Reorder

```graphql
mutation Reorder($orderId: ID!) {
  reorder(orderId: $orderId) {
    id
    orderNumber
    total
    paymentUrl
  }
}
```

---

## Payments

### Initiate Payment

```graphql
mutation InitiatePayment($orderId: ID!, $paymentMethod: String!) {
  initiatePayment(orderId: $orderId, paymentMethod: $paymentMethod) {
    id
    paymentUrl
    transactionId
    status
  }
}
```

### Verify Payment

```graphql
mutation VerifyPayment($orderId: ID!, $transactionId: String!) {
  verifyPayment(orderId: $orderId, transactionId: $transactionId) {
    success
    status
    error
  }
}
```

---

## Customer Profile

### Get Profile

```graphql
query GetProfile($customerId: ID!) {
  customer(id: $customerId) {
    id
    name
    email
    phone
    avatar
    loyaltyPoints
    createdAt
  }
}
```

### Update Profile

```graphql
mutation UpdateProfile($customerId: ID!, $input: UpdateProfileInput!) {
  updateCustomerProfile(customerId: $customerId, input: $input) {
    id
    name
    email
    phone
    avatar
  }
}
```

### Get Addresses

```graphql
query GetAddresses($customerId: ID!) {
  customerAddresses(customerId: $customerId) {
    id
    label
    addressLine1
    addressLine2
    city
    state
    postalCode
    country
    latitude
    longitude
    isDefault
  }
}
```

### Add Address

```graphql
mutation AddAddress($customerId: ID!, $input: AddressInput!) {
  addCustomerAddress(customerId: $customerId, input: $input) {
    id
    label
    addressLine1
    city
    isDefault
  }
}
```

### Update Address

```graphql
mutation UpdateAddress($addressId: ID!, $input: AddressInput!) {
  updateCustomerAddress(addressId: $addressId, input: $input) {
    id
    label
    addressLine1
    city
  }
}
```

### Delete Address

```graphql
mutation DeleteAddress($addressId: ID!) {
  deleteCustomerAddress(addressId: $addressId) {
    success
  }
}
```

---

## Reviews

### Get Product Reviews

```graphql
query GetProductReviews($productId: ID!, $first: Int, $after: String) {
  productReviews(productId: $productId, first: $first, after: $after) {
    edges {
      node {
        id
        rating
        comment
        images
        customer {
          name
          avatar
        }
        reply
        repliedAt
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
    }
    averageRating
    totalCount
  }
}
```

### Create Review

```graphql
mutation CreateReview($input: CreateReviewInput!) {
  createReview(input: $input) {
    id
    rating
    comment
    createdAt
  }
}
```

**Input:**
```typescript
interface CreateReviewInput {
  customerId: string;
  productId: string;
  orderId?: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
}
```

---

## Notifications

### Get Notifications

```graphql
query GetNotifications($customerId: ID!, $first: Int, $after: String) {
  notifications(customerId: $customerId, first: $first, after: $after) {
    edges {
      node {
        id
        type
        title
        body
        data
        isRead
        createdAt
      }
      cursor
    }
    pageInfo {
      hasNextPage
    }
    unreadCount
  }
}
```

### Mark as Read

```graphql
mutation MarkNotificationAsRead($id: ID!) {
  markNotificationAsRead(id: $id) {
    success
  }
}
```

### Mark All as Read

```graphql
mutation MarkAllNotificationsAsRead($customerId: ID!) {
  markAllNotificationsAsRead(customerId: $customerId) {
    success
    updatedCount
  }
}
```

### Update FCM Token

```graphql
mutation UpdateFcmToken($customerId: ID!, $token: String!) {
  updateCustomerFcmToken(customerId: $customerId, token: $token) {
    success
  }
}
```

---

## Loyalty

### Get Loyalty Account

```graphql
query GetLoyaltyAccount($customerId: ID!) {
  loyaltyAccount(customerId: $customerId) {
    id
    points
    tier
    lifetimePoints
    transactions {
      id
      type
      points
      description
      createdAt
    }
  }
}
```

### Redeem Points

```graphql
mutation RedeemPoints($customerId: ID!, $points: Int!, $orderId: ID) {
  redeemLoyaltyPoints(customerId: $customerId, points: $points, orderId: $orderId) {
    success
    newBalance
    discountAmount
    error
  }
}
```

---

## Merchants

### Get Merchant

```graphql
query GetMerchant($id: ID!) {
  merchant(id: $id) {
    id
    name
    logo
    coverImage
    description
    rating
    totalReviews
    address
    city
    workingHours
    deliveryZones {
      name
      deliveryFee
      minimumOrder
    }
  }
}
```

### Get Nearby Merchants

```graphql
query GetNearbyMerchants($latitude: Float!, $longitude: Float!, $radius: Float) {
  nearbyMerchants(latitude: $latitude, longitude: $longitude, radius: $radius) {
    id
    name
    logo
    rating
    distance
    deliveryFee
    estimatedTime
  }
}
```

---

## Error Handling

All mutations return a consistent error format:

```typescript
interface MutationResult {
  success: boolean;
  error?: string;
  // ... other fields
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input |
| `CONFLICT` | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

- **Anonymous:** 60 requests/minute
- **Authenticated:** 120 requests/minute
- **Merchant:** 300 requests/minute

Headers returned:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1706638800
```
