import { NextRequest, NextResponse } from 'next/server';

import { analyzePersonaSnapshot, derivePersonaInternalReview } from '@/lib/persona/provider';
import { buildPersonaSnapshotFromSubmission } from '@/lib/persona/snapshot';
import {
  createPersonaAnalysisJob,
  getPersonaAnalysisBySubject,
  getLatestPersonaAnalysisJob,
  updatePersonaAnalysisJobStatus,
  upsertPersonaAnalysis,
} from '@/lib/persona/service';
import {
  normalizePersonaPublicConfidence,
  normalizePersonaPublicReasons,
  normalizePersonaPublicScores,
  normalizePersonaSummary,
} from '@/lib/persona/schema';
import { isAdminAuthenticated } from '@/lib/submissions/admin';
import { getSubmissionDetailForAdmin } from '@/lib/submissions/service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const detail = getSubmissionDetailForAdmin(id);
  if (!detail) {
    return NextResponse.json({ ok: false, error: 'submission_not_found' }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const action = String(payload.action ?? '');

  try {
    if (action === 'generate') {
      const job = createPersonaAnalysisJob('submission', id, { queuedBy: 'admin' });
      updatePersonaAnalysisJobStatus(job?.id ?? '', 'processing', { attempts: (job?.attempts ?? 0) + 1 });

      const snapshot = buildPersonaSnapshotFromSubmission(detail.submission);
      const result = await analyzePersonaSnapshot(snapshot);
      const analysis = upsertPersonaAnalysis({
        subjectType: 'submission',
        subjectKey: id,
        status: 'generated',
        summary: result.summary,
        publicScores: result.publicScores,
        publicReasons: result.publicReasons,
        publicConfidence: result.publicConfidence,
        internalReview: result.internalReview,
        source: result.source,
        rawResponseJson: result.rawResponseJson ?? null,
      });
      const updatedJob = updatePersonaAnalysisJobStatus(job?.id ?? '', 'succeeded', { attempts: 1, lastError: null });

      return NextResponse.json({ ok: true, data: { analysis, job: updatedJob } });
    }

    const existing = getPersonaAnalysisBySubject('submission', id);
    if (!existing && action !== 'save') {
      return NextResponse.json({ ok: false, error: 'persona_analysis_not_found' }, { status: 404 });
    }

    if (action === 'confirm') {
      const analysis = upsertPersonaAnalysis({
        subjectType: 'submission',
        subjectKey: id,
        status: 'confirmed',
        summary: existing?.summary ?? '',
        publicScores: existing?.publicScores ?? normalizePersonaPublicScores(null),
        publicReasons: existing?.publicReasons ?? normalizePersonaPublicReasons(null),
        publicConfidence: existing?.publicConfidence ?? normalizePersonaPublicConfidence(null),
        internalReview: existing?.internalReview ?? derivePersonaInternalReview(buildPersonaSnapshotFromSubmission(detail.submission), normalizePersonaPublicScores(null)),
        source: existing?.source ?? 'manual',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString(),
        rawResponseJson: existing?.rawResponseJson ?? null,
      });

      return NextResponse.json({ ok: true, data: { analysis, job: getLatestPersonaAnalysisJob('submission', id) } });
    }

    if (action === 'save') {
      const publicScores = normalizePersonaPublicScores(payload.publicScores as Record<string, number> | null | undefined);
      const publicReasons = normalizePersonaPublicReasons(payload.publicReasons as Record<string, string> | null | undefined);
      const publicConfidence = normalizePersonaPublicConfidence(payload.publicConfidence as Record<string, number> | null | undefined);
      const summary = normalizePersonaSummary(typeof payload.summary === 'string' ? payload.summary : existing?.summary ?? '');
      const snapshot = buildPersonaSnapshotFromSubmission(detail.submission);

      const analysis = upsertPersonaAnalysis({
        subjectType: 'submission',
        subjectKey: id,
        status: 'confirmed',
        summary,
        publicScores,
        publicReasons,
        publicConfidence,
        internalReview: existing?.internalReview ?? derivePersonaInternalReview(snapshot, publicScores),
        source: 'manual',
        reviewedBy: 'admin',
        reviewedAt: new Date().toISOString(),
        rawResponseJson: existing?.rawResponseJson ?? null,
      });

      return NextResponse.json({ ok: true, data: { analysis, job: getLatestPersonaAnalysisJob('submission', id) } });
    }

    return NextResponse.json({ ok: false, error: 'invalid_action' }, { status: 400 });
  } catch (error) {
    const latestJob = getLatestPersonaAnalysisJob('submission', id);
    if (latestJob && latestJob.status === 'processing') {
      updatePersonaAnalysisJobStatus(latestJob.id, 'failed', {
        attempts: latestJob.attempts,
        lastError: error instanceof Error ? error.message : 'persona_analysis_failed',
      });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'persona_analysis_failed' },
      { status: 400 },
    );
  }
}
