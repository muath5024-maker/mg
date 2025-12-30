/**
 * Revenue Engine - Pricing Service
 * مصدر الحقيقة الوحيد لحساب الأسعار
 */

import {
  PRICING_CONFIG,
  PROTECTION_CONFIG,
  PricingQuoteRequest,
  PricingQuoteResponse,
  PriceBreakdownItem,
  PaymentType,
  ProjectType,
  ProductionQuality,
  VideoDuration,
  VoiceType,
  RevisionPolicy,
} from '../types/revenue.types';

// =====================================================
// Main Pricing Calculator
// =====================================================

export function calculatePricingQuote(request: PricingQuoteRequest): PricingQuoteResponse {
  const warnings: string[] = [];
  const breakdown: PriceBreakdownItem[] = [];

  // 1. Get base price
  const basePrice = PRICING_CONFIG.projectBasePrices[request.projectType];
  breakdown.push({
    label: 'Base Price',
    labelAr: 'السعر الأساسي',
    amount: basePrice,
  });

  // 2. Apply duration multiplier (for video projects)
  let durationMultiplier = 1.0;
  if (request.duration && (request.projectType === 'ugc_video' || request.projectType === 'motion_graphics')) {
    durationMultiplier = PRICING_CONFIG.durationMultipliers[request.duration];
    if (durationMultiplier > 1.0) {
      const durationAdd = Math.round(basePrice * (durationMultiplier - 1));
      breakdown.push({
        label: `Duration (${request.duration}s)`,
        labelAr: `المدة (${request.duration} ثانية)`,
        amount: durationAdd,
      });
    }
  }

  // 3. Apply quality multiplier
  const qualityMultiplier = PRICING_CONFIG.qualityMultipliers[request.quality];
  if (qualityMultiplier > 1.0) {
    const qualityAdd = Math.round(basePrice * durationMultiplier * (qualityMultiplier - 1));
    breakdown.push({
      label: `Quality (${request.quality})`,
      labelAr: `الجودة (${getQualityNameAr(request.quality)})`,
      amount: qualityAdd,
    });
  }

  // 4. Add voice cost
  const voiceCost = PRICING_CONFIG.voiceCosts[request.voiceType];
  if (voiceCost > 0) {
    breakdown.push({
      label: `Voice (${request.voiceType.replace('_', ' ')})`,
      labelAr: `الصوت (${getVoiceNameAr(request.voiceType)})`,
      amount: voiceCost,
    });
  }

  // 5. Add revision policy cost
  const revisionPolicy = PRICING_CONFIG.revisionPolicies[request.revisionPolicy];
  if (revisionPolicy.cost > 0) {
    breakdown.push({
      label: `Revisions (${request.revisionPolicy})`,
      labelAr: `التعديلات (${getRevisionNameAr(request.revisionPolicy)})`,
      amount: revisionPolicy.cost,
    });
  }

  // 6. Calculate total
  let totalCash = breakdown.reduce((sum, item) => sum + item.amount, 0);

  // 7. Determine payment type
  let paymentType: PaymentType = 'points';
  
  // Check force cash conditions
  if (
    totalCash >= PROTECTION_CONFIG.forceCashThresholds.minPriceForCash ||
    (PROTECTION_CONFIG.forceCashThresholds.ultraQuality && request.quality === 'ultra') ||
    (PROTECTION_CONFIG.forceCashThresholds.duration60 && request.duration === '60') ||
    (PROTECTION_CONFIG.forceCashThresholds.professionalRevision && 
     (request.revisionPolicy === 'professional' || request.revisionPolicy === 'unlimited'))
  ) {
    paymentType = 'cash';
    warnings.push('هذا المشروع يتطلب الدفع النقدي');
  }

  // Heavy projects are always cash
  if (request.projectType === 'brand_identity' || request.projectType === 'full_campaign') {
    paymentType = 'cash';
    if (!warnings.includes('هذا المشروع يتطلب الدفع النقدي')) {
      warnings.push('المشاريع الثقيلة تتطلب الدفع النقدي');
    }
  }

  // 8. Calculate margin
  const estimatedCost = PROTECTION_CONFIG.costCeilings[request.projectType];
  const margin = ((totalCash - estimatedCost) / totalCash) * 100;

  // Check minimum margin
  if (margin < PROTECTION_CONFIG.minimumMarginPercent) {
    // Auto-adjust price to meet minimum margin
    const minimumPrice = Math.ceil(estimatedCost / (1 - PROTECTION_CONFIG.minimumMarginPercent / 100));
    const adjustment = minimumPrice - totalCash;
    
    if (adjustment > 0) {
      totalCash = minimumPrice;
      breakdown.push({
        label: 'Price Adjustment',
        labelAr: 'تعديل السعر',
        amount: adjustment,
      });
      warnings.push(`تم تعديل السعر تلقائياً لضمان جودة الخدمة`);
    }
  }

  // 9. Calculate points equivalent
  const pricePoints = paymentType === 'points' 
    ? totalCash * PROTECTION_CONFIG.pointsToSarRate 
    : 0;

  // 10. Get revision and generation limits
  const includedRevisions = revisionPolicy.freeRevisions;
  const maxGenerations = PROTECTION_CONFIG.maxGenerationsPerProject[request.projectType];

  return {
    success: true,
    pricePoints,
    priceCash: totalCash,
    paymentType,
    includedRevisions,
    maxGenerations,
    locksAfterApproval: true,
    breakdown,
    warnings,
    estimatedMargin: margin,
  };
}

// =====================================================
// Validation Functions
// =====================================================

export function validatePricingRequest(request: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.projectType || !isValidProjectType(request.projectType)) {
    errors.push('نوع المشروع غير صالح');
  }

  if (!request.templateId) {
    errors.push('القالب مطلوب');
  }

  if (!request.quality || !isValidQuality(request.quality)) {
    errors.push('مستوى الجودة غير صالح');
  }

  if (!request.voiceType || !isValidVoiceType(request.voiceType)) {
    errors.push('نوع الصوت غير صالح');
  }

  if (!request.revisionPolicy || !isValidRevisionPolicy(request.revisionPolicy)) {
    errors.push('سياسة التعديلات غير صالحة');
  }

  // Duration required for video projects
  if (
    (request.projectType === 'ugc_video' || request.projectType === 'motion_graphics') &&
    (!request.duration || !isValidDuration(request.duration))
  ) {
    errors.push('المدة مطلوبة لمشاريع الفيديو');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// Type Guards
// =====================================================

function isValidProjectType(type: string): type is ProjectType {
  return ['ugc_video', 'motion_graphics', 'brand_identity', 'full_campaign'].includes(type);
}

function isValidQuality(quality: string): quality is ProductionQuality {
  return ['standard', 'high', 'ultra'].includes(quality);
}

function isValidDuration(duration: string): duration is VideoDuration {
  return ['15', '30', '60'].includes(duration);
}

function isValidVoiceType(voice: string): voice is VoiceType {
  return ['none', 'ai_arabic', 'ai_english', 'human_arabic', 'human_english'].includes(voice);
}

function isValidRevisionPolicy(policy: string): policy is RevisionPolicy {
  return ['basic', 'standard', 'professional', 'unlimited'].includes(policy);
}

// =====================================================
// Localization Helpers
// =====================================================

function getQualityNameAr(quality: ProductionQuality): string {
  const names: Record<ProductionQuality, string> = {
    standard: 'قياسي',
    high: 'عالي',
    ultra: 'فائق',
  };
  return names[quality];
}

function getVoiceNameAr(voice: VoiceType): string {
  const names: Record<VoiceType, string> = {
    none: 'بدون صوت',
    ai_arabic: 'صوت ذكي عربي',
    ai_english: 'صوت ذكي إنجليزي',
    human_arabic: 'صوت بشري عربي',
    human_english: 'صوت بشري إنجليزي',
  };
  return names[voice];
}

function getRevisionNameAr(policy: RevisionPolicy): string {
  const names: Record<RevisionPolicy, string> = {
    basic: 'أساسي',
    standard: 'قياسي',
    professional: 'احترافي',
    unlimited: 'غير محدود',
  };
  return names[policy];
}

// =====================================================
// Extra Costs Calculator
// =====================================================

export function calculateExtraRevisionCost(project: {
  revisionPolicy: RevisionPolicy;
  revisionsUsed: number;
  isRegenerate: boolean;
}): { cost: number; isFree: boolean; reason: string } {
  const policy = PRICING_CONFIG.revisionPolicies[project.revisionPolicy];
  
  // Check if free revisions available
  if (policy.freeRevisions === -1) {
    // Unlimited manual revisions
    if (!project.isRegenerate) {
      return { cost: 0, isFree: true, reason: 'تعديل يدوي مجاني (باقة غير محدودة)' };
    }
  } else if (project.revisionsUsed < policy.freeRevisions) {
    return { 
      cost: 0, 
      isFree: true, 
      reason: `تعديل مجاني (${project.revisionsUsed + 1}/${policy.freeRevisions})` 
    };
  }

  // Paid revision/regeneration
  const cost = project.isRegenerate 
    ? PRICING_CONFIG.extraRegenerationCost 
    : PRICING_CONFIG.extraRevisionCost;

  return {
    cost,
    isFree: false,
    reason: project.isRegenerate 
      ? 'إعادة توليد مدفوعة' 
      : 'تعديل إضافي مدفوع',
  };
}

export function canRegenerate(project: {
  totalGenerations: number;
  projectType: ProjectType;
  isLocked: boolean;
}): { allowed: boolean; reason: string } {
  if (project.isLocked) {
    return { allowed: false, reason: 'المشروع مقفل - لا يمكن إعادة التوليد' };
  }

  const maxGen = PROTECTION_CONFIG.maxGenerationsPerProject[project.projectType];
  if (project.totalGenerations >= maxGen) {
    return { 
      allowed: false, 
      reason: `تم استنفاد الحد الأقصى للتوليد (${maxGen})` 
    };
  }

  return { allowed: true, reason: '' };
}
