/**
 * Services Index
 * Central export for all business logic services
 */

export { AuthService } from './auth.service';
export { CustomerService } from './customer.service';
export { MerchantService } from './merchant.service';
export { ProductService } from './product.service';
export { CategoryService } from './category.service';
export { OrderService } from './order.service';
export { CartService } from './cart.service';
export { PaymentService } from './payment.service';
export { NotificationService } from './notification.service';
export { AnalyticsService } from './analytics.service';
export { WebhookService } from './webhook.service';

// Service context type
export interface ServiceContext {
  db: import('../db').Database;
  env: import('../types').Env;
  userId?: string;
  merchantId?: string;
  userType?: string;
}
