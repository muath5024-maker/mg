/**
 * Revenue Engine - Projects Service
 * إدارة المشاريع مع الحماية والتحقق
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Project,
  ProjectStep,
  ProjectStatus,
  CreateProjectRequest,
  ExecuteStepRequest,
  ExecuteStepResponse,
  ApproveProjectRequest,
  ApproveProjectResponse,
  RevisionRequest,
  RevisionResponse,
  DbProject,
  dbToProject,
  projectToDb,
  PRICING_CONFIG,
  PROTECTION_CONFIG,
  StepInputType,
} from '../types/revenue.types';
import { calculatePricingQuote, calculateExtraRevisionCost, canRegenerate } from './pricing.service';

// =====================================================
// Project Creation
// =====================================================

export function createProject(
  request: CreateProjectRequest,
  userId: string,
  storeId?: string
): { project: Project; warnings: string[] } {
  const warnings: string[] = [];

  // Calculate and snapshot pricing
  const pricing = calculatePricingQuote({
    projectType: request.projectType,
    templateId: request.templateId,
    duration: request.duration,
    quality: request.quality,
    voiceType: request.voiceType,
    revisionPolicy: request.revisionPolicy,
    extras: request.extras,
  });

  warnings.push(...pricing.warnings);

  // Generate steps based on project type
  const steps = generateProjectSteps(request.projectType, request.duration);

  // Create project object
  const project: Project = {
    id: uuidv4(),
    userId,
    storeId,
    name: request.name,
    projectType: request.projectType,
    templateId: request.templateId,
    duration: request.duration,
    quality: request.quality,
    voiceType: request.voiceType,
    revisionPolicy: request.revisionPolicy,
    extras: request.extras || [],

    // Pricing snapshot - frozen at creation
    pricingSnapshot: {
      priceCash: pricing.priceCash,
      pricePoints: pricing.pricePoints,
      paymentType: pricing.paymentType,
      includedRevisions: pricing.includedRevisions,
      maxGenerations: pricing.maxGenerations,
      breakdown: pricing.breakdown,
      createdAt: new Date().toISOString(),
    },

    // Initial status
    status: 'pending_payment',
    currentStepIndex: 0,
    steps,

    // Tracking
    revisionsUsed: 0,
    totalGenerations: 0,

    // Not locked initially
    isLocked: false,

    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { project, warnings };
}

// =====================================================
// Step Generation
// =====================================================

function generateProjectSteps(projectType: string, duration?: string): ProjectStep[] {
  const baseSteps: Omit<ProjectStep, 'generationCount'>[] = [];

  switch (projectType) {
    case 'ugc_video':
      baseSteps.push(
        { stepIndex: 0, title: 'Script Writing', titleAr: 'كتابة السيناريو', description: 'AI generates script based on your product', descriptionAr: 'الذكاء الاصطناعي يكتب السيناريو بناءً على منتجك', inputType: 'text', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 1, title: 'Voice Generation', titleAr: 'توليد الصوت', description: 'Generate professional voiceover', descriptionAr: 'توليد تعليق صوتي احترافي', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 2, title: 'Avatar Selection', titleAr: 'اختيار الشخصية', description: 'Choose your virtual presenter', descriptionAr: 'اختر المقدم الافتراضي', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 1 },
        { stepIndex: 3, title: 'Video Generation', titleAr: 'توليد الفيديو', description: 'AI creates your UGC video', descriptionAr: 'الذكاء الاصطناعي ينشئ فيديو UGC', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 4, title: 'Review & Finalize', titleAr: 'المراجعة والإنهاء', description: 'Review and approve final video', descriptionAr: 'راجع واعتمد الفيديو النهائي', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 1 },
      );
      break;

    case 'motion_graphics':
      baseSteps.push(
        { stepIndex: 0, title: 'Concept Brief', titleAr: 'موجز المفهوم', description: 'Define your motion graphics concept', descriptionAr: 'حدد مفهوم الموشن جرافيك', inputType: 'text', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 1, title: 'Storyboard', titleAr: 'القصة المصورة', description: 'AI generates storyboard frames', descriptionAr: 'الذكاء الاصطناعي يولد إطارات القصة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 2, title: 'Style Selection', titleAr: 'اختيار الأسلوب', description: 'Choose animation style and colors', descriptionAr: 'اختر أسلوب الرسوم المتحركة والألوان', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 1 },
        { stepIndex: 3, title: 'Animation', titleAr: 'الرسوم المتحركة', description: 'Generate motion graphics animation', descriptionAr: 'توليد رسوم متحركة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 4, title: 'Audio/Music', titleAr: 'الصوت/الموسيقى', description: 'Add background music and sound effects', descriptionAr: 'إضافة موسيقى خلفية ومؤثرات صوتية', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 5, title: 'Final Render', titleAr: 'التصدير النهائي', description: 'Render and export final video', descriptionAr: 'تصدير الفيديو النهائي', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 1 },
      );
      break;

    case 'brand_identity':
      baseSteps.push(
        { stepIndex: 0, title: 'Brand Brief', titleAr: 'موجز العلامة', description: 'Define your brand personality and values', descriptionAr: 'حدد شخصية علامتك التجارية وقيمها', inputType: 'text', isCompleted: false, isLocked: false, maxGenerations: 1 },
        { stepIndex: 1, title: 'Logo Concepts', titleAr: 'مفاهيم الشعار', description: 'AI generates logo concepts', descriptionAr: 'الذكاء الاصطناعي يولد مفاهيم الشعار', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 5 },
        { stepIndex: 2, title: 'Color Palette', titleAr: 'لوحة الألوان', description: 'Select brand colors', descriptionAr: 'اختر ألوان العلامة التجارية', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 3, title: 'Typography', titleAr: 'الخطوط', description: 'Choose brand fonts', descriptionAr: 'اختر خطوط العلامة التجارية', inputType: 'selection', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 4, title: 'Brand Guidelines', titleAr: 'إرشادات العلامة', description: 'Generate brand guidelines document', descriptionAr: 'توليد وثيقة إرشادات العلامة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 5, title: 'Mockups', titleAr: 'النماذج', description: 'Create brand application mockups', descriptionAr: 'إنشاء نماذج تطبيق العلامة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 3 },
      );
      break;

    case 'full_campaign':
      baseSteps.push(
        { stepIndex: 0, title: 'Campaign Strategy', titleAr: 'استراتيجية الحملة', description: 'Define campaign goals and audience', descriptionAr: 'حدد أهداف الحملة والجمهور', inputType: 'text', isCompleted: false, isLocked: false, maxGenerations: 1 },
        { stepIndex: 1, title: 'Content Calendar', titleAr: 'تقويم المحتوى', description: 'AI creates content schedule', descriptionAr: 'الذكاء الاصطناعي ينشئ جدول المحتوى', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 2 },
        { stepIndex: 2, title: 'Visual Assets', titleAr: 'الأصول المرئية', description: 'Generate images and graphics', descriptionAr: 'توليد الصور والرسومات', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 5 },
        { stepIndex: 3, title: 'Video Content', titleAr: 'محتوى الفيديو', description: 'Create campaign videos', descriptionAr: 'إنشاء فيديوهات الحملة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 4, title: 'Copy & Captions', titleAr: 'النصوص والتعليقات', description: 'Write ad copy and social captions', descriptionAr: 'كتابة نصوص الإعلانات وتعليقات السوشيال', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 3 },
        { stepIndex: 5, title: 'Ad Creatives', titleAr: 'تصاميم الإعلانات', description: 'Design ads for different platforms', descriptionAr: 'تصميم إعلانات لمنصات مختلفة', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 4 },
        { stepIndex: 6, title: 'Campaign Package', titleAr: 'حزمة الحملة', description: 'Compile and export all assets', descriptionAr: 'تجميع وتصدير جميع الأصول', inputType: 'ai_generate', isCompleted: false, isLocked: false, maxGenerations: 1 },
      );
      break;
  }

  return baseSteps.map(step => ({ ...step, generationCount: 0 }));
}

// =====================================================
// Step Execution
// =====================================================

export function executeStep(
  project: Project,
  request: ExecuteStepRequest
): ExecuteStepResponse {
  const warnings: string[] = [];

  // 1. Check if project is locked
  if (project.isLocked) {
    return {
      success: false,
      project,
      warnings: [],
      error: 'المشروع مقفل - لا يمكن تنفيذ خطوات جديدة',
    };
  }

  // 2. Check if project is paid
  if (project.status === 'pending_payment') {
    return {
      success: false,
      project,
      warnings: [],
      error: 'يجب دفع المشروع أولاً',
    };
  }

  // 3. Validate step index
  if (request.stepIndex < 0 || request.stepIndex >= project.steps.length) {
    return {
      success: false,
      project,
      warnings: [],
      error: 'رقم الخطوة غير صالح',
    };
  }

  const step = project.steps[request.stepIndex];

  // 4. Check if step is locked
  if (step.isLocked) {
    return {
      success: false,
      project,
      warnings: [],
      error: 'هذه الخطوة مقفلة',
    };
  }

  // 5. Check regeneration limits
  if (step.isCompleted && request.forceRegenerate) {
    const regenCheck = canRegenerate({
      totalGenerations: project.totalGenerations,
      projectType: project.projectType,
      isLocked: project.isLocked,
    });

    if (!regenCheck.allowed) {
      return {
        success: false,
        project,
        warnings: [],
        error: regenCheck.reason,
      };
    }

    // Check if regeneration is paid
    if (step.generationCount >= step.maxGenerations) {
      const revisionCost = calculateExtraRevisionCost({
        revisionPolicy: project.revisionPolicy,
        revisionsUsed: project.revisionsUsed,
        isRegenerate: true,
      });

      if (!revisionCost.isFree) {
        return {
          success: false,
          project,
          warnings: [revisionCost.reason],
          requiresPayment: {
            type: 'regeneration',
            amountCash: revisionCost.cost,
            amountPoints: revisionCost.cost * PROTECTION_CONFIG.pointsToSarRate,
          },
        };
      }
    }
  }

  // 6. Execute step (simulation - actual AI calls would go here)
  const updatedStep: ProjectStep = {
    ...step,
    value: request.value || `generated_${Date.now()}`,
    isCompleted: true,
    generationCount: step.generationCount + 1,
  };

  const updatedSteps = [...project.steps];
  updatedSteps[request.stepIndex] = updatedStep;

  // 7. Update project
  const isAllComplete = updatedSteps.every(s => s.isCompleted);
  const updatedProject: Project = {
    ...project,
    steps: updatedSteps,
    currentStepIndex: isAllComplete ? project.steps.length - 1 : request.stepIndex + 1,
    totalGenerations: project.totalGenerations + 1,
    status: isAllComplete ? 'review' : 'in_progress',
    updatedAt: new Date().toISOString(),
  };

  if (isAllComplete) {
    warnings.push('تم إكمال جميع الخطوات - المشروع جاهز للمراجعة');
  }

  return {
    success: true,
    project: updatedProject,
    stepResult: {
      outputUrl: `https://storage.example.com/projects/${project.id}/step_${request.stepIndex}.png`,
    },
    warnings,
  };
}

// =====================================================
// Project Approval
// =====================================================

export function approveProject(
  project: Project,
  request: ApproveProjectRequest
): ApproveProjectResponse {
  // Check if project can be approved
  if (project.isLocked) {
    return {
      success: false,
      project,
      message: 'المشروع مقفل بالفعل',
    };
  }

  if (project.status !== 'review') {
    return {
      success: false,
      project,
      message: 'المشروع ليس في حالة المراجعة',
    };
  }

  // Lock the project
  const updatedProject: Project = {
    ...project,
    status: 'approved',
    isLocked: request.finalApproval,
    lockedAt: request.finalApproval ? new Date().toISOString() : undefined,
    lockedReason: request.finalApproval ? 'اعتماد نهائي من العميل' : undefined,
    completedAt: request.finalApproval ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  if (request.finalApproval) {
    updatedProject.status = 'completed';
  }

  return {
    success: true,
    project: updatedProject,
    message: request.finalApproval 
      ? 'تم اعتماد المشروع وقفله نهائياً' 
      : 'تم اعتماد المشروع',
    downloadUrls: [
      `https://storage.example.com/projects/${project.id}/final_output.zip`,
    ],
  };
}

// =====================================================
// Revision Request
// =====================================================

export function requestRevision(
  project: Project,
  request: RevisionRequest
): RevisionResponse {
  const warnings: string[] = [];

  // 1. Check if project is locked
  if (project.isLocked) {
    return {
      success: false,
      approved: false,
      requiresPayment: false,
      error: 'المشروع مقفل - لا يمكن طلب تعديلات',
      warnings: [],
    };
  }

  // 2. Check if regeneration allowed (for AI regenerate)
  if (request.isRegenerate) {
    const regenCheck = canRegenerate({
      totalGenerations: project.totalGenerations,
      projectType: project.projectType,
      isLocked: project.isLocked,
    });

    if (!regenCheck.allowed) {
      return {
        success: false,
        approved: false,
        requiresPayment: false,
        error: regenCheck.reason,
        warnings: [],
      };
    }
  }

  // 3. Calculate revision cost
  const revisionCost = calculateExtraRevisionCost({
    revisionPolicy: project.revisionPolicy,
    revisionsUsed: project.revisionsUsed,
    isRegenerate: request.isRegenerate,
  });

  // 4. If paid revision needed, return payment request
  if (!revisionCost.isFree) {
    return {
      success: true,
      approved: false,
      requiresPayment: true,
      paymentDetails: {
        type: request.isRegenerate ? 'regeneration' : 'revision',
        amountCash: revisionCost.cost,
        amountPoints: revisionCost.cost * PROTECTION_CONFIG.pointsToSarRate,
        reason: revisionCost.reason,
      },
      warnings: [revisionCost.reason],
    };
  }

  // 5. Free revision - approve and update project
  const updatedProject: Project = {
    ...project,
    status: 'revision',
    revisionsUsed: project.revisionsUsed + 1,
    updatedAt: new Date().toISOString(),
  };

  // If specific step, unlock it
  if (request.stepIndex !== undefined && request.stepIndex >= 0) {
    const updatedSteps = [...project.steps];
    updatedSteps[request.stepIndex] = {
      ...updatedSteps[request.stepIndex],
      isCompleted: false,
      isLocked: false,
    };
    updatedProject.steps = updatedSteps;
    updatedProject.currentStepIndex = request.stepIndex;
  }

  warnings.push(revisionCost.reason);

  return {
    success: true,
    project: updatedProject,
    approved: true,
    requiresPayment: false,
    warnings,
  };
}

// =====================================================
// Payment Confirmation
// =====================================================

export function confirmPayment(project: Project): Project {
  return {
    ...project,
    status: 'paid',
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// =====================================================
// Force Lock (Admin)
// =====================================================

export function forceLock(project: Project, reason: string): Project {
  return {
    ...project,
    isLocked: true,
    lockedAt: new Date().toISOString(),
    lockedReason: reason,
    updatedAt: new Date().toISOString(),
  };
}
