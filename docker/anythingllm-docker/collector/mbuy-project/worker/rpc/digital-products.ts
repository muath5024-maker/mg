/**
 * Digital Products RPC Functions
 * 
 * Course management, lessons, and progress tracking
 */

import { sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

/**
 * Update course lessons count after adding/removing lessons
 */
export async function updateCourseLessonsCount(
  db: PostgresJsDatabase,
  courseId: string
): Promise<{ lessons_count: number; total_duration: number }> {
  const [stats] = await db.execute<{
    lessons_count: number;
    total_duration: number;
  }>(sql`
    SELECT 
      COUNT(*)::integer as lessons_count,
      COALESCE(SUM(duration), 0)::integer as total_duration
    FROM course_lessons
    WHERE course_id = ${courseId}
  `);

  await db.execute(sql`
    UPDATE courses
    SET 
      lessons_count = ${stats.lessons_count},
      total_duration = ${stats.total_duration},
      updated_at = NOW()
    WHERE id = ${courseId}
  `);

  return stats;
}

/**
 * Mark a lesson as completed for a customer
 */
export async function markLessonComplete(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    lessonId: string;
    courseId: string;
    watchedDuration?: number;
  }
): Promise<{
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  course_completed: boolean;
}> {
  const { customerId, lessonId, courseId, watchedDuration } = params;

  // Insert or update lesson progress
  await db.execute(sql`
    INSERT INTO lesson_progress (
      customer_id, lesson_id, course_id, completed, watched_duration, completed_at
    ) VALUES (
      ${customerId}, ${lessonId}, ${courseId}, true, ${watchedDuration || 0}, NOW()
    )
    ON CONFLICT (customer_id, lesson_id) DO UPDATE SET
      completed = true,
      watched_duration = GREATEST(lesson_progress.watched_duration, EXCLUDED.watched_duration),
      completed_at = COALESCE(lesson_progress.completed_at, NOW())
  `);

  // Calculate course progress
  const [progress] = await db.execute<{
    completed_lessons: number;
    total_lessons: number;
  }>(sql`
    SELECT 
      (SELECT COUNT(*) FROM lesson_progress 
       WHERE customer_id = ${customerId} AND course_id = ${courseId} AND completed = true
      )::integer as completed_lessons,
      (SELECT COUNT(*) FROM course_lessons WHERE course_id = ${courseId})::integer as total_lessons
  `);

  const progressPercent = progress.total_lessons > 0 
    ? Math.round((progress.completed_lessons / progress.total_lessons) * 100)
    : 0;

  const courseCompleted = progress.completed_lessons >= progress.total_lessons;

  // Update course enrollment progress
  await db.execute(sql`
    UPDATE course_enrollments
    SET 
      progress = ${progressPercent},
      completed_lessons = ${progress.completed_lessons},
      completed = ${courseCompleted},
      completed_at = ${courseCompleted ? sql`NOW()` : sql`completed_at`},
      last_accessed_at = NOW()
    WHERE customer_id = ${customerId} AND course_id = ${courseId}
  `);

  // Award completion certificate if completed
  if (courseCompleted) {
    await db.execute(sql`
      INSERT INTO course_certificates (
        customer_id, course_id, certificate_number, issued_at
      ) VALUES (
        ${customerId}, ${courseId}, 
        'CERT-' || ${courseId}::text || '-' || ${customerId}::text || '-' || EXTRACT(EPOCH FROM NOW())::integer,
        NOW()
      )
      ON CONFLICT (customer_id, course_id) DO NOTHING
    `);
  }

  return {
    progress: progressPercent,
    completed_lessons: progress.completed_lessons,
    total_lessons: progress.total_lessons,
    course_completed: courseCompleted
  };
}

/**
 * Enroll customer in a course
 */
export async function enrollInCourse(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    courseId: string;
    orderId?: string;
    paymentId?: string;
  }
): Promise<{
  enrollment_id: string;
  access_until?: string;
}> {
  const { customerId, courseId, orderId, paymentId } = params;

  // Get course details
  const [course] = await db.execute<{
    access_duration_days: number | null;
    price: number;
  }>(sql`
    SELECT access_duration_days, price
    FROM courses
    WHERE id = ${courseId}
  `);

  const accessUntil = course?.access_duration_days
    ? sql`NOW() + INTERVAL '${course.access_duration_days} days'`
    : sql`NULL`;

  const [enrollment] = await db.execute<{
    id: string;
    access_until: string | null;
  }>(sql`
    INSERT INTO course_enrollments (
      customer_id, course_id, order_id, payment_id, status, access_until, enrolled_at
    ) VALUES (
      ${customerId}, ${courseId}, ${orderId || null}, ${paymentId || null},
      'active', ${accessUntil}, NOW()
    )
    ON CONFLICT (customer_id, course_id) DO UPDATE SET
      status = 'active',
      access_until = COALESCE(course_enrollments.access_until, EXCLUDED.access_until)
    RETURNING id, access_until::text
  `);

  // Update course enrollment count
  await db.execute(sql`
    UPDATE courses
    SET 
      enrollment_count = (SELECT COUNT(*) FROM course_enrollments WHERE course_id = ${courseId}),
      updated_at = NOW()
    WHERE id = ${courseId}
  `);

  return {
    enrollment_id: enrollment.id,
    access_until: enrollment.access_until || undefined
  };
}

/**
 * Get course progress for a customer
 */
export async function getCourseProgress(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    courseId: string;
  }
): Promise<{
  enrolled: boolean;
  progress: number;
  completed_lessons: string[];
  last_lesson_id?: string;
  next_lesson_id?: string;
  access_until?: string;
  completed: boolean;
  certificate_id?: string;
}> {
  const { customerId, courseId } = params;

  // Get enrollment
  const [enrollment] = await db.execute<{
    progress: number;
    completed_lessons: number;
    last_accessed_lesson_id: string | null;
    access_until: string | null;
    completed: boolean;
  }>(sql`
    SELECT progress, completed_lessons, last_accessed_lesson_id, access_until::text, completed
    FROM course_enrollments
    WHERE customer_id = ${customerId} AND course_id = ${courseId} AND status = 'active'
  `);

  if (!enrollment) {
    return {
      enrolled: false,
      progress: 0,
      completed_lessons: [],
      completed: false
    };
  }

  // Get completed lesson IDs
  const completedLessons = await db.execute<{ lesson_id: string }>(sql`
    SELECT lesson_id
    FROM lesson_progress
    WHERE customer_id = ${customerId} AND course_id = ${courseId} AND completed = true
  `);

  // Get next uncompleted lesson
  const [nextLesson] = await db.execute<{ id: string }>(sql`
    SELECT l.id
    FROM course_lessons l
    LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.customer_id = ${customerId}
    WHERE l.course_id = ${courseId} AND (p.completed IS NULL OR p.completed = false)
    ORDER BY l.sort_order
    LIMIT 1
  `);

  // Get certificate if completed
  let certificateId: string | undefined;
  if (enrollment.completed) {
    const [cert] = await db.execute<{ id: string }>(sql`
      SELECT id FROM course_certificates
      WHERE customer_id = ${customerId} AND course_id = ${courseId}
    `);
    certificateId = cert?.id;
  }

  return {
    enrolled: true,
    progress: enrollment.progress,
    completed_lessons: (completedLessons as unknown as { lesson_id: string }[]).map(l => l.lesson_id),
    last_lesson_id: enrollment.last_accessed_lesson_id || undefined,
    next_lesson_id: nextLesson?.id,
    access_until: enrollment.access_until || undefined,
    completed: enrollment.completed,
    certificate_id: certificateId
  };
}

/**
 * Grant access to a digital download
 */
export async function grantDownloadAccess(
  db: PostgresJsDatabase,
  params: {
    customerId: string;
    productId: string;
    orderId: string;
    maxDownloads?: number;
    expiresInDays?: number;
  }
): Promise<{
  access_id: string;
  download_url: string;
  expires_at?: string;
}> {
  const { customerId, productId, orderId, maxDownloads = 5, expiresInDays = 30 } = params;

  // Get product download info
  const [product] = await db.execute<{
    download_url: string;
    file_size: number;
    file_name: string;
  }>(sql`
    SELECT download_url, file_size, file_name
    FROM digital_products
    WHERE product_id = ${productId}
  `);

  if (!product) {
    throw new Error('Digital product not found');
  }

  const expiresAt = expiresInDays 
    ? sql`NOW() + INTERVAL '${expiresInDays} days'`
    : sql`NULL`;

  const [access] = await db.execute<{
    id: string;
    expires_at: string | null;
  }>(sql`
    INSERT INTO download_access (
      customer_id, product_id, order_id, max_downloads, downloads_used,
      expires_at, download_url, status
    ) VALUES (
      ${customerId}, ${productId}, ${orderId}, ${maxDownloads}, 0,
      ${expiresAt}, ${product.download_url}, 'active'
    )
    RETURNING id, expires_at::text
  `);

  return {
    access_id: access.id,
    download_url: product.download_url,
    expires_at: access.expires_at || undefined
  };
}

/**
 * Record a download and check limits
 */
export async function recordDownload(
  db: PostgresJsDatabase,
  params: {
    accessId: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{
  allowed: boolean;
  downloads_remaining: number;
  error?: string;
}> {
  const { accessId, ipAddress, userAgent } = params;

  return await db.transaction(async (tx) => {
    // Get access record with lock
    const [access] = await tx.execute<{
      max_downloads: number;
      downloads_used: number;
      expires_at: string | null;
      status: string;
    }>(sql`
      SELECT max_downloads, downloads_used, expires_at, status
      FROM download_access
      WHERE id = ${accessId}
      FOR UPDATE
    `);

    if (!access) {
      return { allowed: false, downloads_remaining: 0, error: 'Access not found' };
    }

    if (access.status !== 'active') {
      return { allowed: false, downloads_remaining: 0, error: 'Access is no longer active' };
    }

    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      await tx.execute(sql`
        UPDATE download_access SET status = 'expired' WHERE id = ${accessId}
      `);
      return { allowed: false, downloads_remaining: 0, error: 'Access has expired' };
    }

    if (access.downloads_used >= access.max_downloads) {
      return { allowed: false, downloads_remaining: 0, error: 'Download limit reached' };
    }

    // Record download
    await tx.execute(sql`
      INSERT INTO download_logs (access_id, ip_address, user_agent, downloaded_at)
      VALUES (${accessId}, ${ipAddress || null}, ${userAgent || null}, NOW())
    `);

    // Update count
    await tx.execute(sql`
      UPDATE download_access
      SET downloads_used = downloads_used + 1
      WHERE id = ${accessId}
    `);

    return {
      allowed: true,
      downloads_remaining: access.max_downloads - access.downloads_used - 1
    };
  });
}
