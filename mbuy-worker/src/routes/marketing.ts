/**
 * Marketing Routes Module
 * Coupons, promotions, flash sales, and marketing tools
 */

import { Hono } from 'hono';
import { Env, SupabaseAuthContext } from '../types';
import { supabaseAuthMiddleware } from '../middleware/supabaseAuthMiddleware';
import { 
  getCoupons, 
  createCoupon, 
  updateCoupon, 
  deleteCoupon, 
  validateCoupon, 
  applyCoupon, 
  getCouponStats, 
  createSmartCoupon 
} from '../endpoints/coupons';
import { 
  getFlashSales, 
  getFlashSale, 
  createFlashSale, 
  updateFlashSale, 
  deleteFlashSale, 
  addFlashSaleProducts, 
  removeFlashSaleProduct, 
  activateFlashSale 
} from '../endpoints/flash-sales';
import { 
  createPromotion, 
  getPromotions, 
  getPromotion, 
  cancelPromotion, 
  getPromotionStats 
} from '../endpoints/promotions';
import { 
  getAbandonedCarts, 
  getAbandonedCart, 
  getRecoverySettings, 
  updateRecoverySettings, 
  sendRecoveryReminder, 
  getAbandonedCartStats, 
  markCartRecovered, 
  createAbandonedCart 
} from '../endpoints/abandoned-cart';
import { 
  getReferralSettings, 
  updateReferralSettings, 
  getReferrals, 
  getReferralCodes, 
  getTopReferrers, 
  getReferralStats, 
  generateUserReferralCode, 
  validateReferralCode, 
  applyReferral, 
  toggleReferralCode 
} from '../endpoints/referral';

type Variables = SupabaseAuthContext;

const marketingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
marketingRoutes.use('*', supabaseAuthMiddleware);

// ========================================
// Coupons
// ========================================

marketingRoutes.get('/coupons', getCoupons);
marketingRoutes.post('/coupons', createCoupon);
marketingRoutes.put('/coupons/:id', updateCoupon);
marketingRoutes.delete('/coupons/:id', deleteCoupon);
marketingRoutes.post('/coupons/validate', validateCoupon);
marketingRoutes.post('/coupons/apply', applyCoupon);
marketingRoutes.get('/coupons/:id/stats', getCouponStats);
marketingRoutes.post('/coupons/smart', createSmartCoupon);

// ========================================
// Flash Sales
// ========================================

marketingRoutes.get('/flash-sales', getFlashSales);
marketingRoutes.get('/flash-sales/:id', getFlashSale);
marketingRoutes.post('/flash-sales', createFlashSale);
marketingRoutes.put('/flash-sales/:id', updateFlashSale);
marketingRoutes.delete('/flash-sales/:id', deleteFlashSale);
marketingRoutes.post('/flash-sales/:id/products', addFlashSaleProducts);
marketingRoutes.delete('/flash-sales/:id/products/:productId', removeFlashSaleProduct);
marketingRoutes.post('/flash-sales/:id/activate', activateFlashSale);

// ========================================
// Promotions
// ========================================

marketingRoutes.get('/promotions', getPromotions);
marketingRoutes.get('/promotions/:id', getPromotion);
marketingRoutes.post('/promotions', createPromotion);
marketingRoutes.post('/promotions/:id/cancel', cancelPromotion);
marketingRoutes.get('/promotions/:id/stats', getPromotionStats);

// ========================================
// Abandoned Cart Recovery
// ========================================

marketingRoutes.get('/abandoned-carts', getAbandonedCarts);
marketingRoutes.get('/abandoned-carts/stats', getAbandonedCartStats);
marketingRoutes.get('/abandoned-carts/settings', getRecoverySettings);
marketingRoutes.put('/abandoned-carts/settings', updateRecoverySettings);
marketingRoutes.get('/abandoned-carts/:id', getAbandonedCart);
marketingRoutes.post('/abandoned-carts/:id/remind', sendRecoveryReminder);
marketingRoutes.post('/abandoned-carts/:id/recover', markCartRecovered);
marketingRoutes.post('/abandoned-carts', createAbandonedCart);

// ========================================
// Referral Program
// ========================================

marketingRoutes.get('/referral/settings', getReferralSettings);
marketingRoutes.put('/referral/settings', updateReferralSettings);
marketingRoutes.get('/referral/list', getReferrals);
marketingRoutes.get('/referral/codes', getReferralCodes);
marketingRoutes.get('/referral/top', getTopReferrers);
marketingRoutes.get('/referral/stats', getReferralStats);
marketingRoutes.post('/referral/generate', generateUserReferralCode);
marketingRoutes.post('/referral/validate', validateReferralCode);
marketingRoutes.post('/referral/apply', applyReferral);
marketingRoutes.post('/referral/codes/:id/toggle', toggleReferralCode);

export default marketingRoutes;
