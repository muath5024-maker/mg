/**
 * Payment Gateway Factory
 * 
 * يختار البوابة المناسبة حسب إعدادات التاجر
 */

import { PaymentGateway, PaymentGatewayInterface } from './types';
import { MoyasarGateway } from './moyasar';
import { TapGateway } from './tap';
import { PayTabsGateway } from './paytabs';
import { HyperPayGateway } from './hyperpay';

// =============================================================================
// Gateway Registry
// =============================================================================

const gateways: Record<PaymentGateway, PaymentGatewayInterface> = {
  moyasar: MoyasarGateway,
  tap: TapGateway,
  paytabs: PayTabsGateway,
  hyperpay: HyperPayGateway,
};

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * الحصول على بوابة الدفع حسب الاسم
 */
export function getGateway(gatewayName: PaymentGateway): PaymentGatewayInterface {
  const gateway = gateways[gatewayName];
  
  if (!gateway) {
    throw new Error(`Unknown payment gateway: ${gatewayName}`);
  }
  
  return gateway;
}

/**
 * التحقق من أن البوابة مدعومة
 */
export function isSupportedGateway(gatewayName: string): gatewayName is PaymentGateway {
  return gatewayName in gateways;
}

/**
 * الحصول على قائمة البوابات المدعومة
 */
export function getSupportedGateways(): PaymentGateway[] {
  return Object.keys(gateways) as PaymentGateway[];
}

/**
 * معلومات البوابات المدعومة
 */
export const gatewayInfo: Record<PaymentGateway, {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  website: string;
  supportedMethods: string[];
  countries: string[];
}> = {
  moyasar: {
    name: 'Moyasar',
    nameAr: 'مُيسر',
    description: 'Saudi payment gateway supporting Mada, Apple Pay, and credit cards',
    descriptionAr: 'بوابة دفع سعودية تدعم مدى وآبل باي وبطاقات الائتمان',
    website: 'https://moyasar.com',
    supportedMethods: ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay'],
    countries: ['SA'],
  },
  tap: {
    name: 'Tap Payments',
    nameAr: 'تاب',
    description: 'Middle East payment gateway with wide coverage',
    descriptionAr: 'بوابة دفع خليجية مع تغطية واسعة',
    website: 'https://tap.company',
    supportedMethods: ['mada', 'visa', 'mastercard', 'apple_pay', 'knet', 'benefit'],
    countries: ['SA', 'AE', 'KW', 'BH', 'QA', 'OM'],
  },
  paytabs: {
    name: 'PayTabs',
    nameAr: 'باي تابز',
    description: 'Saudi payment gateway with SADAD support',
    descriptionAr: 'بوابة دفع سعودية تدعم سداد',
    website: 'https://paytabs.com',
    supportedMethods: ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay', 'sadad'],
    countries: ['SA', 'AE', 'EG', 'JO'],
  },
  hyperpay: {
    name: 'HyperPay',
    nameAr: 'هايبر باي',
    description: 'Global payment gateway with strong Saudi presence',
    descriptionAr: 'بوابة دفع عالمية بتواجد قوي في السعودية',
    website: 'https://hyperpay.com',
    supportedMethods: ['mada', 'visa', 'mastercard', 'apple_pay', 'stc_pay', 'sadad'],
    countries: ['SA', 'AE', 'EG', 'JO', 'global'],
  },
};
