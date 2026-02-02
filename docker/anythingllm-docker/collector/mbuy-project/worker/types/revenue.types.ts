/**
 * Revenue Engine Types - نظام التسعير والحماية
 * مصدر الحقيقة الوحيد للأسعار والقواعد
 */

// =====================================================
// Project Types & Enums
// =====================================================

export type ProjectType = 'ugc_video' | 'motion_graphics' | 'brand_identity' | 'full_campaign';
export type ProductionQuality = 'standard' | 'high' | 'ultra';
export type VideoDuration = '15' | '30' | '60'; // seconds
export type VoiceType = 'none' | 'ai_arabic' | 'ai_english' | 'human_arabic' | 'human_english';
export type RevisionPolicy = 'basic' | 'standard' | 'professional' | 'unlimited';
export type ProjectStatus = 'draft' | 'pending_payment' | 'paid' | 'in_progress' | 'review' | 'revision' | 'approved' | 'locked' | 'completed';
export type PaymentType = 'cash' | 'points' | 'mixed';
export type StepInputType = 'text' | 'image' | 'video' | 'file' | 'selection' | 'ai_generate';

// =====================================================
// Configuration Constants - مصدر الحقيقة للأسعار
// =====================================================

export const PRICING_CONFIG = {
  // Base prices per project type (SAR)
  projectBasePrices: {
    ugc_video: 299,
    motion_graphics: 399,
    brand_identity: 799,
    full_campaign: 1499,
  } as const,

  // Duration multipliers (for video projects)
  durationMultipliers: {
    '15': 1.0,
    '30': 1.5,
    '60': 2.2,
  } as const,

  // Quality multipliers
  qualityMultipliers: {
    standard: 1.0,
    high: 1.3,
    ultra: 1.8,
  } as const,

  // Voice addon costs (SAR)
  voiceCosts: {
    none: 0,
    ai_arabic: 29,
    ai_english: 29,
    human_arabic: 149,
    human_english: 149,
  } as const,

  // Revision policy costs (SAR) and limits
  revisionPolicies: {
    basic: { cost: 0, freeRevisions: 1, regenerationsAllowed: 1 },
    standard: { cost: 49, freeRevisions: 2, regenerationsAllowed: 2 },
    professional: { cost: 99, freeRevisions: 3, regenerationsAllowed: 3 },
    unlimited: { cost: 199, freeRevisions: -1, regenerationsAllowed: 5 }, // -1 = unlimited manual, but still max 5 regenerations
  } as const,

  // Extra revision cost after exhausting free ones (SAR per revision)
  extraRevisionCost: 79,

  // Extra regeneration cost after exhausting limit (SAR)
  extraRegenerationCost: 149,
} as const;

// =====================================================
// Protection & Margin Config
// =====================================================

export const PROTECTION_CONFIG = {
  // Cost ceiling per project type (internal max cost to us)
  costCeilings: {
    ugc_video: 150,    // Max we spend on AI generation
    motion_graphics: 200,
    brand_identity: 350,
    full_campaign: 600,
  } as const,

  // Minimum margin percentage (reject if below)
  minimumMarginPercent: 30,

  // Max generations per project (hard limit)
  maxGenerationsPerProject: {
    ugc_video: 3,
    motion_graphics: 3,
    brand_identity: 5,
    full_campaign: 8,
  } as const,

  // Force cash payment thresholds
  forceCashThresholds: {
    minPriceForCash: 200,       // SAR - above this = cash only
    ultraQuality: true,          // Ultra quality = cash only
    duration60: true,            // 60s videos = cash only
    professionalRevision: true,  // Professional+ revision = cash only
  } as const,

  // Points to SAR conversion rate
  pointsToSarRate: 10, // 10 points = 1 SAR
} as const;

// =====================================================
// Request/Response Types
// =====================================================

export interface PricingQuoteRequest {
  projectType: ProjectType;
  templateId: string;
  duration?: VideoDuration;
  quality: ProductionQuality;
  voiceType: VoiceType;
  revisionPolicy: RevisionPolicy;
  extras?: string[];
}

export interface PriceBreakdownItem {
  label: string;
  labelAr: string;
  amount: number;
}

export interface PricingQuoteResponse {
  success: boolean;
  pricePoints: number;      // 0 if cash only
  priceCash: number;        // SAR
  paymentType: PaymentType;
  includedRevisions: number; // -1 = unlimited
  maxGenerations: number;
  locksAfterApproval: boolean;
  breakdown: PriceBreakdownItem[];
  warnings: string[];
  estimatedMargin: number;  // Internal only, not sent to client
}

export interface CreateProjectRequest {
  projectType: ProjectType;
  templateId: string;
  name: string;
  duration?: VideoDuration;
  quality: ProductionQuality;
  voiceType: VoiceType;
  revisionPolicy: RevisionPolicy;
  extras?: string[];
}

export interface ProjectStep {
  stepIndex: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  inputType: StepInputType;
  value?: string;
  isCompleted: boolean;
  isLocked: boolean;
  generationCount: number;
  maxGenerations: number;
}

export interface Project {
  id: string;
  userId: string;
  storeId?: string;
  name: string;
  projectType: ProjectType;
  templateId: string;
  duration?: VideoDuration;
  quality: ProductionQuality;
  voiceType: VoiceType;
  revisionPolicy: RevisionPolicy;
  extras: string[];
  
  // Pricing snapshot (frozen at creation)
  pricingSnapshot: {
    priceCash: number;
    pricePoints: number;
    paymentType: PaymentType;
    includedRevisions: number;
    maxGenerations: number;
    breakdown: PriceBreakdownItem[];
    createdAt: string;
  };
  
  // Status & Progress
  status: ProjectStatus;
  currentStepIndex: number;
  steps: ProjectStep[];
  
  // Revision tracking
  revisionsUsed: number;
  totalGenerations: number;
  
  // Locking
  isLocked: boolean;
  lockedAt?: string;
  lockedReason?: string;
  
  // Output
  outputUrl?: string;
  outputFiles?: string[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  completedAt?: string;
}

export interface ExecuteStepRequest {
  stepIndex: number;
  value?: string;
  forceRegenerate?: boolean;
}

export interface ExecuteStepResponse {
  success: boolean;
  project: Project;
  stepResult?: {
    outputUrl?: string;
    outputData?: any;
  };
  warnings: string[];
  error?: string;
  requiresPayment?: {
    type: 'regeneration' | 'revision';
    amountCash: number;
    amountPoints: number;
  };
}

export interface ApproveProjectRequest {
  finalApproval: boolean;
  feedback?: string;
}

export interface ApproveProjectResponse {
  success: boolean;
  project: Project;
  message: string;
  downloadUrls?: string[];
}

export interface RevisionRequest {
  stepIndex?: number; // If not provided, applies to whole project
  notes: string;
  isRegenerate: boolean; // true = AI regenerate, false = manual revision
}

export interface RevisionResponse {
  success: boolean;
  project?: Project;
  approved: boolean;
  requiresPayment: boolean;
  paymentDetails?: {
    type: 'regeneration' | 'revision';
    amountCash: number;
    amountPoints: number;
    reason: string;
  };
  error?: string;
  warnings: string[];
}

// =====================================================
// Template Types
// =====================================================

export interface ProjectTemplate {
  id: string;
  projectType: ProjectType;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  thumbnailUrl: string;
  demoUrl?: string;
  basePriceSar: number;
  supportedDurations: VideoDuration[];
  supportedQualities: ProductionQuality[];
  defaultSteps: Omit<ProjectStep, 'value' | 'isCompleted' | 'generationCount'>[];
  isActive: boolean;
  sortOrder: number;
}

// =====================================================
// Database Schema Types (for Supabase)
// =====================================================

export interface DbProject {
  id: string;
  user_id: string;
  store_id?: string;
  name: string;
  project_type: ProjectType;
  template_id: string;
  duration?: VideoDuration;
  quality: ProductionQuality;
  voice_type: VoiceType;
  revision_policy: RevisionPolicy;
  extras: string[];
  pricing_snapshot: string; // JSON
  status: ProjectStatus;
  current_step_index: number;
  steps: string; // JSON
  revisions_used: number;
  total_generations: number;
  is_locked: boolean;
  locked_at?: string;
  locked_reason?: string;
  output_url?: string;
  output_files: string[]; // JSON array
  created_at: string;
  updated_at: string;
  paid_at?: string;
  completed_at?: string;
}

// =====================================================
// Helper Functions
// =====================================================

export function dbToProject(db: DbProject): Project {
  return {
    id: db.id,
    userId: db.user_id,
    storeId: db.store_id,
    name: db.name,
    projectType: db.project_type,
    templateId: db.template_id,
    duration: db.duration,
    quality: db.quality,
    voiceType: db.voice_type,
    revisionPolicy: db.revision_policy,
    extras: db.extras || [],
    pricingSnapshot: JSON.parse(db.pricing_snapshot),
    status: db.status,
    currentStepIndex: db.current_step_index,
    steps: JSON.parse(db.steps),
    revisionsUsed: db.revisions_used,
    totalGenerations: db.total_generations,
    isLocked: db.is_locked,
    lockedAt: db.locked_at,
    lockedReason: db.locked_reason,
    outputUrl: db.output_url,
    outputFiles: db.output_files || [],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    paidAt: db.paid_at,
    completedAt: db.completed_at,
  };
}

export function projectToDb(project: Partial<Project>): Partial<DbProject> {
  const db: Partial<DbProject> = {};
  
  if (project.id !== undefined) db.id = project.id;
  if (project.userId !== undefined) db.user_id = project.userId;
  if (project.storeId !== undefined) db.store_id = project.storeId;
  if (project.name !== undefined) db.name = project.name;
  if (project.projectType !== undefined) db.project_type = project.projectType;
  if (project.templateId !== undefined) db.template_id = project.templateId;
  if (project.duration !== undefined) db.duration = project.duration;
  if (project.quality !== undefined) db.quality = project.quality;
  if (project.voiceType !== undefined) db.voice_type = project.voiceType;
  if (project.revisionPolicy !== undefined) db.revision_policy = project.revisionPolicy;
  if (project.extras !== undefined) db.extras = project.extras;
  if (project.pricingSnapshot !== undefined) db.pricing_snapshot = JSON.stringify(project.pricingSnapshot);
  if (project.status !== undefined) db.status = project.status;
  if (project.currentStepIndex !== undefined) db.current_step_index = project.currentStepIndex;
  if (project.steps !== undefined) db.steps = JSON.stringify(project.steps);
  if (project.revisionsUsed !== undefined) db.revisions_used = project.revisionsUsed;
  if (project.totalGenerations !== undefined) db.total_generations = project.totalGenerations;
  if (project.isLocked !== undefined) db.is_locked = project.isLocked;
  if (project.lockedAt !== undefined) db.locked_at = project.lockedAt;
  if (project.lockedReason !== undefined) db.locked_reason = project.lockedReason;
  if (project.outputUrl !== undefined) db.output_url = project.outputUrl;
  if (project.outputFiles !== undefined) db.output_files = project.outputFiles;
  if (project.paidAt !== undefined) db.paid_at = project.paidAt;
  if (project.completedAt !== undefined) db.completed_at = project.completedAt;
  
  return db;
}
