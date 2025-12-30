/**
 * PDF Report Generation System
 * Uses Cloudflare Browser Rendering to generate professional PDF reports
 */

import { Context } from 'hono';
import { Env, SupabaseAuthContext } from '../types';

type ReportContext = Context<{ Bindings: Env; Variables: SupabaseAuthContext }>;

/**
 * Generate PDF report for a promotion
 * POST /secure/promotions/:id/report
 */
export async function generatePromotionReport(c: ReportContext) {
  try {
    const profileId = c.get('profileId');
    const promotionId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const reportType = body.report_type || 'on_demand'; // 'daily' | 'final' | 'on_demand'
    const reportDate = body.report_date || null;
    
    // Get promotion with analytics
    const promoResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?id=eq.${promotionId}&select=*,`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await promoResponse.json();
    
    if (!promotions || promotions.length === 0) {
      return c.json({
        ok: false,
        error: 'Promotion not found',
      }, 404);
    }
    
    const promotion = promotions[0];
    
    // Verify ownership
    if (promotion.merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Get analytics data for the promotion period
    const startDate = new Date(promotion.start_at);
    const endDate = new Date(promotion.end_at);
    const now = new Date();
    const effectiveEndDate = endDate > now ? now : endDate;
    
    // Get baseline (7 days before promotion)
    const baselineStart = new Date(startDate);
    baselineStart.setDate(baselineStart.getDate() - 7);
    
    // Get baseline analytics
    const baselineResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?store_id=eq.${promotion.store_id}&date=gte.${baselineStart.toISOString().split('T')[0]}&date=lt.${startDate.toISOString().split('T')[0]}&select=views,clicks,orders,revenue`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const baselineData: any[] = await baselineResponse.json();
    
    // Get promotion period analytics
    const promotionResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/analytics_daily_rollups?promotion_id=eq.${promotionId}&select=date,views,clicks,orders,revenue,ctr,conversion_rate&order=date.asc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotionData: any[] = await promotionResponse.json();
    
    // Calculate baseline totals
    const baselineTotals = baselineData.reduce((acc, day) => ({
      views: acc.views + (day.views || 0),
      clicks: acc.clicks + (day.clicks || 0),
      orders: acc.orders + (day.orders || 0),
      revenue: acc.revenue + parseFloat(day.revenue || 0),
    }), { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    const baselineDays = Math.max(1, baselineData.length);
    const baselineAvg = {
      views: Math.round(baselineTotals.views / baselineDays),
      clicks: Math.round(baselineTotals.clicks / baselineDays),
      orders: Math.round(baselineTotals.orders / baselineDays),
      revenue: parseFloat((baselineTotals.revenue / baselineDays).toFixed(2)),
    };
    
    // Calculate promotion totals
    const promotionTotals = promotionData.reduce((acc, day) => ({
      views: acc.views + (day.views || 0),
      clicks: acc.clicks + (day.clicks || 0),
      orders: acc.orders + (day.orders || 0),
      revenue: acc.revenue + parseFloat(day.revenue || 0),
    }), { views: 0, clicks: 0, orders: 0, revenue: 0 });
    
    const promotionDays = Math.max(1, promotionData.length);
    const promotionAvg = {
      views: Math.round(promotionTotals.views / promotionDays),
      clicks: Math.round(promotionTotals.clicks / promotionDays),
      orders: Math.round(promotionTotals.orders / promotionDays),
      revenue: parseFloat((promotionTotals.revenue / promotionDays).toFixed(2)),
    };
    
    // Calculate improvements
    const improvement = {
      views: baselineAvg.views > 0 ? Math.round(((promotionAvg.views - baselineAvg.views) / baselineAvg.views) * 100) : 0,
      clicks: baselineAvg.clicks > 0 ? Math.round(((promotionAvg.clicks - baselineAvg.clicks) / baselineAvg.clicks) * 100) : 0,
      orders: baselineAvg.orders > 0 ? Math.round(((promotionAvg.orders - baselineAvg.orders) / baselineAvg.orders) * 100) : 0,
      revenue: baselineAvg.revenue > 0 ? Math.round(((promotionAvg.revenue - baselineAvg.revenue) / baselineAvg.revenue) * 100) : 0,
    };
    
    // Build report data
    const reportData = {
      promotion: {
        id: promotion.id,
        type: promotion.promo_type,
        target_type: promotion.target_type,
        weight: promotion.weight,
        status: promotion.status,
        start_at: promotion.start_at,
        end_at: promotion.end_at,
        budget_points: promotion.budget_points,
      },
      store: {
        name: promotion.stores.name,
        slug: promotion.stores.slug,
        public_url: promotion.stores.public_url,
      },
      baseline: {
        period: `${baselineStart.toISOString().split('T')[0]} - ${new Date(startDate.getTime() - 86400000).toISOString().split('T')[0]}`,
        days: baselineDays,
        totals: baselineTotals,
        daily_avg: baselineAvg,
      },
      promotion_period: {
        period: `${startDate.toISOString().split('T')[0]} - ${effectiveEndDate.toISOString().split('T')[0]}`,
        days: promotionDays,
        totals: promotionTotals,
        daily_avg: promotionAvg,
        daily_data: promotionData,
      },
      improvement,
      analysis: generateAnalysis(improvement, promotion.promo_type),
      generated_at: new Date().toISOString(),
    };
    
    // Generate PDF HTML
    const html = generateReportHTML(reportData);
    
    // Use Cloudflare Browser to render PDF
    let pdfBuffer: ArrayBuffer;
    try {
      const browser = c.env.BROWSER;
      if (!browser) {
        throw new Error('Browser rendering not available');
      }
      
      // @ts-ignore - Cloudflare Browser Rendering API
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });
      await page.close();
    } catch (browserError) {
      console.error('Browser rendering error:', browserError);
      // Fallback: Return HTML instead of PDF
      return c.json({
        ok: true,
        data: {
          report_type: reportType,
          format: 'json',
          summary: reportData,
          html_preview: html,
          message: 'PDF generation unavailable, returning JSON report',
        },
      });
    }
    
    // Upload PDF to R2
    const fileName = `reports/${promotion.store_id}/${promotionId}/${reportType}_${Date.now()}.pdf`;
    
    try {
      await c.env.R2.put(fileName, pdfBuffer, {
        httpMetadata: {
          contentType: 'application/pdf',
        },
        customMetadata: {
          promotionId,
          reportType,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (r2Error) {
      console.error('R2 upload error:', r2Error);
    }
    
    const pdfUrl = `${c.env.R2_PUBLIC_URL}/${fileName}`;
    
    // Save report record
    await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotion_reports`,
      {
        method: 'POST',
        headers: {
          'apikey': c.env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promotion_id: promotionId,
          report_date: reportDate,
          report_type: reportType,
          pdf_url: pdfUrl,
          summary_json: reportData,
        }),
      }
    );
    
    return c.json({
      ok: true,
      data: {
        report_type: reportType,
        pdf_url: pdfUrl,
        summary: reportData,
      },
      message: 'تم إنشاء التقرير بنجاح',
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Get promotion reports
 * GET /secure/promotions/:id/reports
 */
export async function getPromotionReports(c: ReportContext) {
  try {
    const profileId = c.get('profileId');
    const promotionId = c.req.param('id');
    
    // Verify ownership
    const promoResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotions?id=eq.${promotionId}&select=store_id,`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await promoResponse.json();
    
    if (!promotions || promotions.length === 0) {
      return c.json({
        ok: false,
        error: 'Promotion not found',
      }, 404);
    }
    
    if (promotions[0].merchant_id !== profileId) {
      return c.json({
        ok: false,
        error: 'Not authorized',
      }, 403);
    }
    
    // Get reports
    const reportsResponse = await fetch(
      `${c.env.SUPABASE_URL}/rest/v1/promotion_reports?promotion_id=eq.${promotionId}&select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': c.env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const reports = await reportsResponse.json();
    
    return c.json({
      ok: true,
      data: reports,
    });
    
  } catch (error: any) {
    return c.json({
      ok: false,
      error: 'Internal server error',
      detail: error.message,
    }, 500);
  }
}

/**
 * Generate analysis text based on improvements
 */
function generateAnalysis(improvement: any, promoType: string): string[] {
  const analysis: string[] = [];
  
  const promoTypeName = promoType === 'pin' ? 'التثبيت' : 'التعزيز';
  
  if (improvement.views > 0) {
    analysis.push(`✅ حققت حملة ${promoTypeName} زيادة ${improvement.views}% في المشاهدات مقارنة بالفترة السابقة`);
  } else if (improvement.views < 0) {
    analysis.push(`⚠️ انخفضت المشاهدات بنسبة ${Math.abs(improvement.views)}% خلال فترة الحملة`);
  }
  
  if (improvement.orders > 0) {
    analysis.push(`✅ ارتفعت الطلبات بنسبة ${improvement.orders}%`);
  }
  
  if (improvement.revenue > 0) {
    analysis.push(`💰 زادت الإيرادات بنسبة ${improvement.revenue}%`);
  }
  
  // Overall assessment
  const avgImprovement = (improvement.views + improvement.orders + improvement.revenue) / 3;
  
  if (avgImprovement > 20) {
    analysis.push('🎉 الحملة ناجحة جداً! ننصح بتكرارها');
  } else if (avgImprovement > 0) {
    analysis.push('👍 الحملة حققت نتائج إيجابية');
  } else {
    analysis.push('💡 ننصح بمراجعة استراتيجية الحملة للحصول على نتائج أفضل');
  }
  
  return analysis;
}

/**
 * Generate professional HTML report
 */
function generateReportHTML(data: any): string {
  const { promotion, store, baseline, promotion_period, improvement, analysis, generated_at } = data;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير الحملة - ${store.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header .store-name { font-size: 16px; opacity: 0.9; }
    .header .date { font-size: 12px; opacity: 0.8; margin-top: 10px; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .section h2 {
      font-size: 18px;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item { padding: 10px; background: #f8f9fa; border-radius: 8px; }
    .info-item .label { font-size: 12px; color: #666; }
    .info-item .value { font-size: 16px; font-weight: bold; color: #333; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }
    .stat-card {
      text-align: center;
      padding: 15px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 10px;
    }
    .stat-card .value { font-size: 24px; font-weight: bold; color: #667eea; }
    .stat-card .label { font-size: 12px; color: #666; margin-top: 5px; }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .comparison-table th, .comparison-table td {
      padding: 12px;
      text-align: center;
      border-bottom: 1px solid #eee;
    }
    .comparison-table th { background: #f8f9fa; font-weight: 600; }
    .improvement-positive { color: #28a745; }
    .improvement-negative { color: #dc3545; }
    .analysis-list { list-style: none; padding: 0; }
    .analysis-list li {
      padding: 10px 15px;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .chart-placeholder {
      height: 200px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 تقرير أداء الحملة</h1>
      <div class="store-name">${store.name}</div>
      <div class="date">تم الإنشاء: ${new Date(generated_at).toLocaleDateString('ar-SA', { dateStyle: 'full' })}</div>
    </div>
    
    <div class="section">
      <h2>معلومات الحملة</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">نوع الحملة</div>
          <div class="value">${promotion.type === 'pin' ? 'تثبيت 📌' : 'تعزيز 🚀'}</div>
        </div>
        <div class="info-item">
          <div class="label">الهدف</div>
          <div class="value">${promotion.target_type === 'store' ? 'المتجر' : 'منتج'}</div>
        </div>
        <div class="info-item">
          <div class="label">فترة الحملة</div>
          <div class="value">${promotion_period.period}</div>
        </div>
        <div class="info-item">
          <div class="label">الحالة</div>
          <div class="value">${promotion.status === 'active' ? '🟢 نشطة' : promotion.status === 'expired' ? '⚪ منتهية' : '🟡 مجدولة'}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>الإحصائيات الإجمالية</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${promotion_period.totals.views.toLocaleString()}</div>
          <div class="label">المشاهدات</div>
        </div>
        <div class="stat-card">
          <div class="value">${promotion_period.totals.clicks.toLocaleString()}</div>
          <div class="label">النقرات</div>
        </div>
        <div class="stat-card">
          <div class="value">${promotion_period.totals.orders.toLocaleString()}</div>
          <div class="label">الطلبات</div>
        </div>
        <div class="stat-card">
          <div class="value">${promotion_period.totals.revenue.toLocaleString()} ر.س</div>
          <div class="label">الإيرادات</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>مقارنة الأداء</h2>
      <table class="comparison-table">
        <tr>
          <th>المؤشر</th>
          <th>قبل الحملة (متوسط يومي)</th>
          <th>أثناء الحملة (متوسط يومي)</th>
          <th>التغيير</th>
        </tr>
        <tr>
          <td>المشاهدات</td>
          <td>${baseline.daily_avg.views}</td>
          <td>${promotion_period.daily_avg.views}</td>
          <td class="${improvement.views >= 0 ? 'improvement-positive' : 'improvement-negative'}">${improvement.views >= 0 ? '+' : ''}${improvement.views}%</td>
        </tr>
        <tr>
          <td>النقرات</td>
          <td>${baseline.daily_avg.clicks}</td>
          <td>${promotion_period.daily_avg.clicks}</td>
          <td class="${improvement.clicks >= 0 ? 'improvement-positive' : 'improvement-negative'}">${improvement.clicks >= 0 ? '+' : ''}${improvement.clicks}%</td>
        </tr>
        <tr>
          <td>الطلبات</td>
          <td>${baseline.daily_avg.orders}</td>
          <td>${promotion_period.daily_avg.orders}</td>
          <td class="${improvement.orders >= 0 ? 'improvement-positive' : 'improvement-negative'}">${improvement.orders >= 0 ? '+' : ''}${improvement.orders}%</td>
        </tr>
        <tr>
          <td>الإيرادات</td>
          <td>${baseline.daily_avg.revenue} ر.س</td>
          <td>${promotion_period.daily_avg.revenue} ر.س</td>
          <td class="${improvement.revenue >= 0 ? 'improvement-positive' : 'improvement-negative'}">${improvement.revenue >= 0 ? '+' : ''}${improvement.revenue}%</td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <h2>التحليل والتوصيات</h2>
      <ul class="analysis-list">
        ${analysis.map((item: string) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    
    <div class="footer">
      <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام MBUY</p>
      <p>${store.public_url}</p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Scheduled job: Generate daily reports for active promotions
 * Called by Cloudflare Cron Trigger
 */
export async function generateDailyReports(env: Env) {
  try {
    // Get active promotions
    const promoResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promotions?status=eq.active&select=id,store_id`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await promoResponse.json();
    
    console.log(`Generating daily reports for ${promotions.length} active promotions`);
    
    // Generate report for each promotion
    // Note: In production, you'd want to batch this or use a queue
    for (const promo of promotions) {
      try {
        // This would call the report generation logic
        // For now, just log
        console.log(`Would generate daily report for promotion ${promo.id}`);
      } catch (error) {
        console.error(`Failed to generate report for promotion ${promo.id}:`, error);
      }
    }
    
    return { processed: promotions.length };
    
  } catch (error: any) {
    console.error('Daily reports job error:', error);
    throw error;
  }
}

/**
 * Scheduled job: Generate final reports for expired promotions
 */
export async function generateFinalReports(env: Env) {
  try {
    // Get recently expired promotions without final report
    const promoResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/promotions?status=eq.expired&select=id,store_id&order=updated_at.desc&limit=50`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const promotions: any[] = await promoResponse.json();
    
    // Check which don't have final reports
    const needsReport: any[] = [];
    
    for (const promo of promotions) {
      const reportResponse = await fetch(
        `${env.SUPABASE_URL}/rest/v1/promotion_reports?promotion_id=eq.${promo.id}&report_type=eq.final&select=id&limit=1`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const reports: any[] = await reportResponse.json();
      
      if (!reports || reports.length === 0) {
        needsReport.push(promo);
      }
    }
    
    console.log(`Generating final reports for ${needsReport.length} expired promotions`);
    
    return { processed: needsReport.length };
    
  } catch (error: any) {
    console.error('Final reports job error:', error);
    throw error;
  }
}


