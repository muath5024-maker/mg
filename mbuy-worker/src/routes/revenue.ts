/**
 * Revenue Engine Routes - API Endpoints
 * نقاط النهاية لنظام التسعير والمشاريع
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  PricingQuoteRequest,
  CreateProjectRequest,
  ExecuteStepRequest,
  ApproveProjectRequest,
  RevisionRequest,
  DbProject,
  dbToProject,
  projectToDb,
  Project,
} from '../types/revenue.types';
import {
  calculatePricingQuote,
  validatePricingRequest,
} from '../services/pricing.service';
import {
  createProject,
  executeStep,
  approveProject,
  requestRevision,
  confirmPayment,
  forceLock,
} from '../services/projects.service';

// =====================================================
// Types
// =====================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_BUCKET: R2Bucket;
}

interface Variables {
  userId: string;
  storeId?: string;
}

const revenue = new Hono<{ Bindings: Env; Variables: Variables }>();

// =====================================================
// Helper: Supabase Request
// =====================================================

async function supabaseRequest(
  env: Env,
  path: string,
  method: string = 'GET',
  body?: any
) {
  const headers: Record<string, string> = {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  if (method === 'POST') {
    headers['Prefer'] = 'return=representation';
  } else if (method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

// =====================================================
// Validation Schemas
// =====================================================

const PricingQuoteSchema = z.object({
  projectType: z.enum(['ugc_video', 'motion_graphics', 'brand_identity', 'full_campaign']),
  templateId: z.string().min(1),
  duration: z.enum(['15', '30', '60']).optional(),
  quality: z.enum(['standard', 'high', 'ultra']),
  voiceType: z.enum(['none', 'ai_arabic', 'ai_english', 'human_arabic', 'human_english']),
  revisionPolicy: z.enum(['basic', 'standard', 'professional', 'unlimited']),
  extras: z.array(z.string()).optional(),
});

const CreateProjectSchema = z.object({
  projectType: z.enum(['ugc_video', 'motion_graphics', 'brand_identity', 'full_campaign']),
  templateId: z.string().min(1),
  name: z.string().min(1).max(100),
  duration: z.enum(['15', '30', '60']).optional(),
  quality: z.enum(['standard', 'high', 'ultra']),
  voiceType: z.enum(['none', 'ai_arabic', 'ai_english', 'human_arabic', 'human_english']),
  revisionPolicy: z.enum(['basic', 'standard', 'professional', 'unlimited']),
  extras: z.array(z.string()).optional(),
});

const ExecuteStepSchema = z.object({
  stepIndex: z.number().int().min(0),
  value: z.string().optional(),
  forceRegenerate: z.boolean().optional(),
});

const ApproveProjectSchema = z.object({
  finalApproval: z.boolean(),
  feedback: z.string().optional(),
});

const RevisionSchema = z.object({
  stepIndex: z.number().int().min(0).optional(),
  notes: z.string().min(1),
  isRegenerate: z.boolean(),
});

// =====================================================
// PRICING ENDPOINTS
// =====================================================

/**
 * POST /pricing/quote
 * احصل على تسعير فوري للمشروع
 */
revenue.post('/pricing/quote', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request
    const validation = PricingQuoteSchema.safeParse(body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'بيانات غير صالحة',
        details: validation.error.issues,
      }, 400);
    }

    const request = validation.data as PricingQuoteRequest;

    // Validate business rules
    const businessValidation = validatePricingRequest(request);
    if (!businessValidation.valid) {
      return c.json({
        success: false,
        error: 'قواعد العمل غير مستوفاة',
        details: businessValidation.errors,
      }, 400);
    }

    // Calculate pricing
    const quote = calculatePricingQuote(request);

    // Remove internal fields before sending
    const { estimatedMargin, ...clientQuote } = quote;

    return c.json(clientQuote);
  } catch (error) {
    console.error('Pricing quote error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في حساب التسعير',
    }, 500);
  }
});

// =====================================================
// PROJECT CRUD ENDPOINTS
// =====================================================

/**
 * POST /projects/create
 * إنشاء مشروع جديد
 */
revenue.post('/projects/create', async (c) => {
  try {
    const userId = c.get('userId');
    const storeId = c.get('storeId');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const body = await c.req.json();
    
    // Validate request
    const validation = CreateProjectSchema.safeParse(body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'بيانات غير صالحة',
        details: validation.error.issues,
      }, 400);
    }

    const request = validation.data as CreateProjectRequest;

    // Create project in memory
    const { project, warnings } = createProject(request, userId, storeId);

    // Save to database
    const dbProject = projectToDb(project);
    const response = await supabaseRequest(
      c.env,
      'revenue_projects',
      'POST',
      dbProject
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to save project:', errorText);
      return c.json({
        success: false,
        error: 'فشل في حفظ المشروع',
      }, 500);
    }

    const savedProjects = await response.json() as DbProject[];
    const savedProject = savedProjects[0] ? dbToProject(savedProjects[0]) : project;

    return c.json({
      success: true,
      project: savedProject,
      warnings,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في إنشاء المشروع',
    }, 500);
  }
});

/**
 * GET /projects
 * الحصول على مشاريع المستخدم
 */
revenue.get('/projects', async (c) => {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const status = c.req.query('status');
    let query = `revenue_projects?user_id=eq.${userId}&order=created_at.desc`;
    
    if (status) {
      query += `&status=eq.${status}`;
    }

    const response = await supabaseRequest(c.env, query);
    const dbProjects = await response.json() as DbProject[];
    
    const projects = dbProjects.map(dbToProject);

    return c.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في جلب المشاريع',
    }, 500);
  }
});

/**
 * GET /projects/:id
 * الحصول على مشروع محدد
 */
revenue.get('/projects/:id', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const response = await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}&user_id=eq.${userId}`
    );
    const dbProjects = await response.json() as DbProject[];

    if (dbProjects.length === 0) {
      return c.json({
        success: false,
        error: 'المشروع غير موجود',
      }, 404);
    }

    const project = dbToProject(dbProjects[0]);

    return c.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في جلب المشروع',
    }, 500);
  }
});

// =====================================================
// PROJECT ACTION ENDPOINTS
// =====================================================

/**
 * POST /projects/:id/pay
 * تأكيد الدفع
 */
revenue.post('/projects/:id/pay', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    // Get project
    const getResponse = await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}&user_id=eq.${userId}`
    );
    const dbProjects = await getResponse.json() as DbProject[];

    if (dbProjects.length === 0) {
      return c.json({ success: false, error: 'المشروع غير موجود' }, 404);
    }

    const project = dbToProject(dbProjects[0]);

    if (project.status !== 'pending_payment') {
      return c.json({ success: false, error: 'المشروع مدفوع بالفعل' }, 400);
    }

    // TODO: Integrate with actual payment gateway
    // For now, simulate payment confirmation

    const updatedProject = confirmPayment(project);
    const dbUpdate = projectToDb(updatedProject);

    await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}`,
      'PATCH',
      dbUpdate
    );

    return c.json({
      success: true,
      project: updatedProject,
      message: 'تم تأكيد الدفع بنجاح',
    });
  } catch (error) {
    console.error('Pay project error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في تأكيد الدفع',
    }, 500);
  }
});

/**
 * POST /projects/:id/step/execute
 * تنفيذ خطوة في المشروع
 */
revenue.post('/projects/:id/step/execute', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const body = await c.req.json();
    const validation = ExecuteStepSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'بيانات غير صالحة',
        details: validation.error.issues,
      }, 400);
    }

    const request = validation.data as ExecuteStepRequest;

    // Get project
    const getResponse = await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}&user_id=eq.${userId}`
    );
    const dbProjects = await getResponse.json() as DbProject[];

    if (dbProjects.length === 0) {
      return c.json({ success: false, error: 'المشروع غير موجود' }, 404);
    }

    const project = dbToProject(dbProjects[0]);

    // Execute step
    const result = executeStep(project, request);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error,
        warnings: result.warnings,
        requiresPayment: result.requiresPayment,
      }, 400);
    }

    // Save updated project
    const dbUpdate = projectToDb(result.project);
    await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}`,
      'PATCH',
      dbUpdate
    );

    return c.json({
      success: true,
      project: result.project,
      stepResult: result.stepResult,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Execute step error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في تنفيذ الخطوة',
    }, 500);
  }
});

/**
 * POST /projects/:id/approve
 * اعتماد المشروع
 */
revenue.post('/projects/:id/approve', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const body = await c.req.json();
    const validation = ApproveProjectSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'بيانات غير صالحة',
        details: validation.error.issues,
      }, 400);
    }

    const request = validation.data as ApproveProjectRequest;

    // Get project
    const getResponse = await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}&user_id=eq.${userId}`
    );
    const dbProjects = await getResponse.json() as DbProject[];

    if (dbProjects.length === 0) {
      return c.json({ success: false, error: 'المشروع غير موجود' }, 404);
    }

    const project = dbToProject(dbProjects[0]);

    // Approve project
    const result = approveProject(project, request);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.message,
      }, 400);
    }

    // Save updated project
    const dbUpdate = projectToDb(result.project);
    await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}`,
      'PATCH',
      dbUpdate
    );

    return c.json({
      success: true,
      project: result.project,
      message: result.message,
      downloadUrls: result.downloadUrls,
    });
  } catch (error) {
    console.error('Approve project error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في اعتماد المشروع',
    }, 500);
  }
});

/**
 * POST /projects/:id/revise
 * طلب تعديل
 */
revenue.post('/projects/:id/revise', async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');

    if (!userId) {
      return c.json({ success: false, error: 'غير مصرح' }, 401);
    }

    const body = await c.req.json();
    const validation = RevisionSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json({
        success: false,
        error: 'بيانات غير صالحة',
        details: validation.error.issues,
      }, 400);
    }

    const request = validation.data as RevisionRequest;

    // Get project
    const getResponse = await supabaseRequest(
      c.env,
      `revenue_projects?id=eq.${projectId}&user_id=eq.${userId}`
    );
    const dbProjects = await getResponse.json() as DbProject[];

    if (dbProjects.length === 0) {
      return c.json({ success: false, error: 'المشروع غير موجود' }, 404);
    }

    const project = dbToProject(dbProjects[0]);

    // Request revision
    const result = requestRevision(project, request);

    if (!result.success) {
      return c.json({
        success: false,
        error: result.error,
        warnings: result.warnings,
      }, 400);
    }

    // If requires payment, return payment details
    if (result.requiresPayment) {
      return c.json({
        success: true,
        approved: false,
        requiresPayment: true,
        paymentDetails: result.paymentDetails,
        warnings: result.warnings,
      });
    }

    // Save updated project
    if (result.project) {
      const dbUpdate = projectToDb(result.project);
      await supabaseRequest(
        c.env,
        `revenue_projects?id=eq.${projectId}`,
        'PATCH',
        dbUpdate
      );
    }

    return c.json({
      success: true,
      project: result.project,
      approved: result.approved,
      requiresPayment: false,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Revise project error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في طلب التعديل',
    }, 500);
  }
});

// =====================================================
// TEMPLATES ENDPOINTS
// =====================================================

/**
 * GET /templates
 * الحصول على القوالب المتاحة
 */
revenue.get('/templates', async (c) => {
  try {
    const projectType = c.req.query('projectType');
    
    let query = 'revenue_templates?is_active=eq.true&order=sort_order.asc';
    if (projectType) {
      query += `&project_type=eq.${projectType}`;
    }

    const response = await supabaseRequest(c.env, query);
    const templates = await response.json();

    return c.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في جلب القوالب',
    }, 500);
  }
});

/**
 * GET /templates/:id
 * الحصول على قالب محدد
 */
revenue.get('/templates/:id', async (c) => {
  try {
    const templateId = c.req.param('id');

    const response = await supabaseRequest(
      c.env,
      `revenue_templates?id=eq.${templateId}`
    );
    const templates = await response.json() as any[];

    if (templates.length === 0) {
      return c.json({
        success: false,
        error: 'القالب غير موجود',
      }, 404);
    }

    return c.json({
      success: true,
      template: templates[0],
    });
  } catch (error) {
    console.error('Get template error:', error);
    return c.json({
      success: false,
      error: 'حدث خطأ في جلب القالب',
    }, 500);
  }
});

export default revenue;
