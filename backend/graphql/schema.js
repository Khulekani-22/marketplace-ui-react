// backend/graphql/schema.js
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ============================================
  # ENUMS
  # ============================================

  enum ServiceStatus {
    ACTIVE
    INACTIVE
    PENDING
    ARCHIVED
  }

  enum SubscriptionStatus {
    ACTIVE
    CANCELLED
    EXPIRED
    PENDING
  }

  enum MessageStatus {
    SENT
    DELIVERED
    READ
    FAILED
  }

  enum TransactionType {
    CREDIT
    DEBIT
    REFUND
    TRANSFER
  }

  enum TransactionStatus {
    PENDING
    COMPLETED
    FAILED
    CANCELLED
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum UserRole {
    USER
    VENDOR
    STARTUP
    ADMIN
  }

  # ============================================
  # INPUT TYPES
  # ============================================

  input PaginationInput {
    limit: Int = 20
    cursor: String
  }

  input ServiceFilterInput {
    status: ServiceStatus
    vendorId: String
    categoryId: String
    minPrice: Float
    maxPrice: Float
    searchQuery: String
  }

  input ServiceSortInput {
    field: String!
    order: SortOrder = DESC
  }

  input CreateServiceInput {
    name: String!
    description: String!
    category: String!
    price: Float!
    duration: Int
    features: [String!]
    imageUrl: String
    status: ServiceStatus = ACTIVE
  }

  input UpdateServiceInput {
    name: String
    description: String
    category: String
    price: Float
    duration: Int
    features: [String!]
    imageUrl: String
    status: ServiceStatus
  }

  input VendorFilterInput {
    searchQuery: String
    verified: Boolean
    minRating: Float
    categoryId: String
  }

  input SubscriptionFilterInput {
    userId: String
    vendorId: String
    status: SubscriptionStatus
    startDate: DateTime
    endDate: DateTime
  }

  input CreateSubscriptionInput {
    serviceId: String!
    vendorId: String!
    planType: String!
    duration: Int!
    price: Float!
  }

  input MessageFilterInput {
    conversationId: String
    senderId: String
    recipientId: String
    status: MessageStatus
    unreadOnly: Boolean
  }

  input SendMessageInput {
    recipientId: String!
    subject: String
    body: String!
    attachments: [String!]
  }

  input WalletFilterInput {
    userId: String
    minBalance: Float
    maxBalance: Float
  }

  input TransactionFilterInput {
    walletId: String
    type: TransactionType
    status: TransactionStatus
    startDate: DateTime
    endDate: DateTime
    minAmount: Float
    maxAmount: Float
  }

  input CreateTransactionInput {
    walletId: String!
    type: TransactionType!
    amount: Float!
    description: String
    metadata: JSON
  }

  # ============================================
  # TYPES
  # ============================================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
    totalCount: Int
  }

  type Service {
    id: ID!
    name: String!
    description: String!
    category: String!
    price: Float!
    duration: Int
    features: [String!]!
    imageUrl: String
    status: ServiceStatus!
    vendor: Vendor!
    vendorId: String!
    ratings: Float
    reviewCount: Int
    subscribers: [Subscription!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ServiceEdge {
    cursor: String!
    node: Service!
  }

  type ServiceConnection {
    edges: [ServiceEdge!]!
    pageInfo: PageInfo!
  }

  type Vendor {
    id: ID!
    userId: String!
    user: User
    companyName: String!
    description: String
    email: String!
    phone: String
    website: String
    logo: String
    verified: Boolean!
    rating: Float
    totalReviews: Int
    services: [Service!]
    subscriptions: [Subscription!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type VendorEdge {
    cursor: String!
    node: Vendor!
  }

  type VendorConnection {
    edges: [VendorEdge!]!
    pageInfo: PageInfo!
  }

  type User {
    id: ID!
    uid: String!
    email: String!
    displayName: String
    photoURL: String
    role: UserRole!
    subscriptions: [Subscription!]
    messages: [Message!]
    wallet: Wallet
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Subscription {
    id: ID!
    userId: String!
    user: User!
    serviceId: String!
    service: Service!
    vendorId: String!
    vendor: Vendor!
    status: SubscriptionStatus!
    planType: String!
    startDate: DateTime!
    endDate: DateTime!
    price: Float!
    autoRenew: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SubscriptionEdge {
    cursor: String!
    node: Subscription!
  }

  type SubscriptionConnection {
    edges: [SubscriptionEdge!]!
    pageInfo: PageInfo!
  }

  type Message {
    id: ID!
    senderId: String!
    sender: User!
    recipientId: String!
    recipient: User!
    conversationId: String!
    subject: String
    body: String!
    attachments: [String!]
    status: MessageStatus!
    readAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MessageEdge {
    cursor: String!
    node: Message!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
  }

  type Wallet {
    id: ID!
    userId: String!
    user: User!
    balance: Float!
    currency: String!
    transactions: [Transaction!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type WalletEdge {
    cursor: String!
    node: Wallet!
  }

  type WalletConnection {
    edges: [WalletEdge!]!
    pageInfo: PageInfo!
  }

  type Transaction {
    id: ID!
    walletId: String!
    wallet: Wallet!
    type: TransactionType!
    amount: Float!
    balance: Float!
    description: String
    status: TransactionStatus!
    metadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TransactionEdge {
    cursor: String!
    node: Transaction!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # Services
    service(id: ID!): Service
    services(
      filter: ServiceFilterInput
      sort: ServiceSortInput
      pagination: PaginationInput
    ): ServiceConnection!

    # Vendors
    vendor(id: ID!): Vendor
    vendors(
      filter: VendorFilterInput
      pagination: PaginationInput
    ): VendorConnection!

    # Users
    user(id: ID!): User
    me: User

    # Subscriptions
    subscription(id: ID!): Subscription
    subscriptions(
      filter: SubscriptionFilterInput
      pagination: PaginationInput
    ): SubscriptionConnection!
    mySubscriptions(
      status: SubscriptionStatus
      pagination: PaginationInput
    ): SubscriptionConnection!

    # Messages
    message(id: ID!): Message
    messages(
      filter: MessageFilterInput
      pagination: PaginationInput
    ): MessageConnection!
    myMessages(
      unreadOnly: Boolean
      pagination: PaginationInput
    ): MessageConnection!
    conversation(
      userId: String!
      pagination: PaginationInput
    ): MessageConnection!

    # Wallet & Transactions
    wallet(id: ID!): Wallet
    wallets(
      filter: WalletFilterInput
      pagination: PaginationInput
    ): WalletConnection!
    myWallet: Wallet
    transaction(id: ID!): Transaction
    transactions(
      filter: TransactionFilterInput
      pagination: PaginationInput
    ): TransactionConnection!
    myTransactions(
      type: TransactionType
      status: TransactionStatus
      pagination: PaginationInput
    ): TransactionConnection!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Services
    createService(input: CreateServiceInput!): Service!
    updateService(id: ID!, input: UpdateServiceInput!): Service!
    deleteService(id: ID!): Boolean!

    # Subscriptions
    createSubscription(input: CreateSubscriptionInput!): Subscription!
    cancelSubscription(id: ID!): Subscription!
    renewSubscription(id: ID!): Subscription!

    # Messages
    sendMessage(input: SendMessageInput!): Message!
    markMessageAsRead(id: ID!): Message!
    deleteMessage(id: ID!): Boolean!

    # Wallet & Transactions
    createTransaction(input: CreateTransactionInput!): Transaction!
    creditWallet(walletId: ID!, amount: Float!, description: String): Wallet!
    debitWallet(walletId: ID!, amount: Float!, description: String): Wallet!
  }

  # ============================================
  # SUBSCRIPTIONS (Real-time)
  # ============================================

  type Subscription {
    # Service updates
    serviceCreated: Service!
    serviceUpdated(id: ID): Service!
    serviceDeleted: String!

    # New messages
    messageReceived(userId: ID!): Message!
    conversationUpdated(conversationId: ID!): Message!

    # Transaction updates
    transactionCreated(walletId: ID!): Transaction!
    walletUpdated(userId: ID!): Wallet!

    # Subscription updates
    subscriptionStatusChanged(userId: ID!): Subscription!
  }
`;
