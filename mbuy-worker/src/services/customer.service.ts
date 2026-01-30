/**
 * Customer Service
 * Handles customer-related business logic
 */

import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import type { Database } from '../db';
import type { Env } from '../types';
import { customers, type Customer, type NewCustomer } from '../db/schema/users';
import { customerAddresses, type CustomerAddress, type NewCustomerAddress } from '../db/schema/addresses';

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CustomerListResult {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export class CustomerService {
  constructor(
    private db: Database,
    private env: Env
  ) {}

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer | null> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return customer || null;
  }

  /**
   * Get customer by email
   */
  async getByEmail(email: string): Promise<Customer | null> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    return customer || null;
  }

  /**
   * List customers with pagination and filters
   */
  async list(params: CustomerListParams = {}): Promise<CustomerListResult> {
    const { page = 1, limit = 20, search, status } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(customers.status, status));
    }
    if (search) {
      conditions.push(
        sql`(${customers.fullName} ILIKE ${'%' + search + '%'} OR ${customers.email} ILIKE ${'%' + search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .where(whereClause);

    // Get customers
    const result = await this.db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      customers: result,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Create a new customer
   */
  async create(data: NewCustomer): Promise<Customer> {
    const [customer] = await this.db
      .insert(customers)
      .values({
        ...data,
        email: data.email.toLowerCase(),
      })
      .returning();

    return customer;
  }

  /**
   * Update a customer
   */
  async update(id: string, data: Partial<NewCustomer>): Promise<Customer | null> {
    const [customer] = await this.db
      .update(customers)
      .set({
        ...data,
        email: data.email?.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    return customer || null;
  }

  /**
   * Update customer status
   */
  async updateStatus(id: string, status: string): Promise<Customer | null> {
    const [customer] = await this.db
      .update(customers)
      .set({ status, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    return customer || null;
  }

  /**
   * Delete a customer (soft delete - set status to deleted)
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .update(customers)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(customers.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Get customer addresses
   */
  async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), desc(customerAddresses.createdAt));
  }

  /**
   * Add a new address
   */
  async addAddress(customerId: string, data: Omit<NewCustomerAddress, 'customerId'>): Promise<CustomerAddress> {
    // If this is the default address, unset other defaults
    if (data.isDefault) {
      await this.db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [address] = await this.db
      .insert(customerAddresses)
      .values({ ...data, customerId })
      .returning();

    return address;
  }

  /**
   * Update an address
   */
  async updateAddress(
    customerId: string,
    addressId: string,
    data: Partial<NewCustomerAddress>
  ): Promise<CustomerAddress | null> {
    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.customerId, customerId));
    }

    const [address] = await this.db
      .update(customerAddresses)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        )
      )
      .returning();

    return address || null;
  }

  /**
   * Delete an address
   */
  async deleteAddress(customerId: string, addressId: string): Promise<boolean> {
    const result = await this.db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        )
      );

    return (result as any).rowCount > 0;
  }

  /**
   * Set default address
   */
  async setDefaultAddress(customerId: string, addressId: string): Promise<CustomerAddress | null> {
    // Unset all defaults
    await this.db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customerId));

    // Set the new default
    const [address] = await this.db
      .update(customerAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(
          eq(customerAddresses.id, addressId),
          eq(customerAddresses.customerId, customerId)
        )
      )
      .returning();

    return address || null;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(customerId: string, fcmToken: string): Promise<void> {
    await this.db
      .update(customers)
      .set({ pushToken: fcmToken, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  /**
   * Get customer statistics
   */
  async getStats(customerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    memberSince: Date;
  }> {
    const customer = await this.getById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get order stats from orders table
    const [stats] = await this.db.execute<{
      total_orders: number;
      total_spent: number;
    }>(sql`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(total), 0)::numeric as total_spent
      FROM orders 
      WHERE customer_id = ${customerId}
      AND status != 'cancelled'
    `);

    const totalOrders = stats?.total_orders || 0;
    const totalSpent = parseFloat(String(stats?.total_spent || 0));

    return {
      totalOrders,
      totalSpent,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      memberSince: customer.createdAt,
    };
  }
}
