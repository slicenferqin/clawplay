'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PUBLIC_PERSONA_DIMENSIONS } from '@/lib/persona/constants';
import {
  createDefaultInternalReview,
  createDefaultPersonaConfidence,
  createDefaultPersonaReasons,
  createDefaultPersonaPublicScores,
  normalizePersonaPublicConfidence,
  normalizePersonaPublicReasons,
  normalizePersonaPublicScores,
  type PersonaAnalysisRecord,
  type PersonaJobRecord,
  type PersonaPublicConfidence,
  type PersonaPublicReasons,
  type PersonaPublicScores,
} from '@/lib/persona/schema';

import { PersonaRadar } from '@/components/persona-radar';

interface AdminPersonaAnalysisCardProps {
  submissionId: string;
  initialAnalysis: PersonaAnalysisRecord | null;
  latestJob: PersonaJobRecord | null;
}

const sourceLabels = {
  bootstrap: 'Bootstrap 启动值',
  heuristic: '启发式建议',
  ai: 'AI 建议',
  manual: '人工确认',
} as const;

const statusLabels = {
  generated: '建议稿',
  confirmed: '已确认',
} as const;

const jobStatusLabels = {
  queued: '已入队',
  processing: '处理中',
  succeeded: '已完成',
  failed: '失败',
} as const;

function buildInitialScores(analysis: PersonaAnalysisRecord | null) {
  return normalizePersonaPublicScores(analysis?.publicScores ?? createDefaultPersonaPublicScores());
}

function buildInitialReasons(analysis: PersonaAnalysisRecord | null) {
  return normalizePersonaPublicReasons(analysis?.publicReasons ?? createDefaultPersonaReasons());
}

function buildInitialConfidence(analysis: PersonaAnalysisRecord | null) {
  return normalizePersonaPublicConfidence(analysis?.publicConfidence ?? createDefaultPersonaConfidence());
}

export function AdminPersonaAnalysisCard({ submissionId, initialAnalysis, latestJob }: AdminPersonaAnalysisCardProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<PersonaAnalysisRecord | null>(initialAnalysis);
  const [job, setJob] = useState<PersonaJobRecord | null>(latestJob);
  const [summary, setSummary] = useState(initialAnalysis?.summary ?? '');
  const [scores, setScores] = useState<PersonaPublicScores>(buildInitialScores(initialAnalysis));
  const [reasons, setReasons] = useState<PersonaPublicReasons>(buildInitialReasons(initialAnalysis));
  const [confidence, setConfidence] = useState<PersonaPublicConfidence>(buildInitialConfidence(initialAnalysis));
  const [isSubmitting, setIsSubmitting] = useState<'generate' | 'confirm' | 'save' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const internalReview = useMemo(() => analysis?.internalReview ?? createDefaultInternalReview(), [analysis]);

  function applyAnalysis(nextAnalysis: PersonaAnalysisRecord) {
    setAnalysis(nextAnalysis);
    setSummary(nextAnalysis.summary);
    setScores(normalizePersonaPublicScores(nextAnalysis.publicScores));
    setReasons(normalizePersonaPublicReasons(nextAnalysis.publicReasons));
    setConfidence(normalizePersonaPublicConfidence(nextAnalysis.publicConfidence));
  }

  async function submit(action: 'generate' | 'confirm' | 'save') {
    setIsSubmitting(action);
    setErrorMessage('');

    const response = await fetch(`/api/admin/submissions/${submissionId}/persona-analysis`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        action,
        summary,
        publicScores: scores,
        publicReasons: reasons,
        publicConfidence: confidence,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      data?: { analysis: PersonaAnalysisRecord; job?: PersonaJobRecord | null };
    } | null;

    if (!response.ok || !payload?.ok || !payload.data) {
      setErrorMessage(
        payload?.error === 'unauthorized'
          ? '登录已失效，请重新登录。'
          : payload?.error === 'invalid_persona_summary'
            ? '请先补一条一句话人格总结。'
            : '人格分析操作失败，请稍后再试。',
      );
      setIsSubmitting(null);
      return;
    }

    applyAnalysis(payload.data.analysis);
    setJob(payload.data.job ?? null);
    setIsSubmitting(null);
    router.refresh();
  }

  return (
    <article className="detail-panel detail-panel--side persona-admin-card">
      <div className="detail-panel__header">
        <div>
          <p className="detail-panel__eyebrow">人格分析</p>
          <h2 className="detail-panel__title detail-panel__title--small">人格分析</h2>
        </div>
        <span className={`admin-table__signal ${analysis?.status === 'confirmed' ? 'is-ready' : 'is-warning'}`}>
          {analysis ? statusLabels[analysis.status] : '未生成'}
        </span>
      </div>

      <p className="detail-panel__body">前台只展示已确认版本。这里先生成建议稿，再决定是否采用或人工覆写。</p>

      <div className="persona-admin-card__meta">
        <span className="tag-pill">来源：{analysis ? sourceLabels[analysis.source] : '—'}</span>
        <span className="tag-pill">最近作业：{job ? jobStatusLabels[job.status] : '未触发'}</span>
        <span className="tag-pill">风险度：{internalReview.risk}</span>
      </div>

      <div className="persona-admin-card__preview">
        <PersonaRadar scores={scores} size={250} />
        <div className="persona-admin-card__review-grid">
          <div className="detail-field">
            <span className="detail-panel__subheading">完整度</span>
            <strong>{internalReview.completeness}</strong>
          </div>
          <div className="detail-field">
            <span className="detail-panel__subheading">一致性</span>
            <strong>{internalReview.consistency}</strong>
          </div>
          <div className="detail-field">
            <span className="detail-panel__subheading">可发布性</span>
            <strong>{internalReview.publishability}</strong>
          </div>
          <div className="detail-field">
            <span className="detail-panel__subheading">风险度</span>
            <strong>{internalReview.risk}</strong>
          </div>
        </div>
      </div>

      <div className="submission-form__group">
        <label className="submission-form__label" htmlFor="persona-summary">一句话人格总结</label>
        <textarea
          id="persona-summary"
          className="submission-form__textarea"
          rows={3}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="例如：一个高主动、偏锋利、结构稳定的审查型 Soul。"
        />
      </div>

      <div className="persona-admin-card__dimension-grid">
        {PUBLIC_PERSONA_DIMENSIONS.map((dimension) => (
          <section key={dimension.key} className="persona-admin-card__dimension-item">
            <div className="submission-form__group">
              <label className="submission-form__label" htmlFor={`score-${dimension.key}`}>{dimension.label}</label>
              <input
                id={`score-${dimension.key}`}
                className="submission-form__input"
                type="number"
                min={0}
                max={100}
                value={scores[dimension.key]}
                onChange={(event) => setScores((current) => ({
                  ...current,
                  [dimension.key]: Number(event.target.value || 0),
                }))}
              />
            </div>
            <div className="submission-form__group">
              <label className="submission-form__label" htmlFor={`reason-${dimension.key}`}>判断理由</label>
              <textarea
                id={`reason-${dimension.key}`}
                className="submission-form__textarea"
                rows={3}
                value={reasons[dimension.key]}
                onChange={(event) => setReasons((current) => ({
                  ...current,
                  [dimension.key]: event.target.value,
                }))}
              />
            </div>
          </section>
        ))}
      </div>

      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}

      <div className="persona-admin-card__actions">
        <button type="button" className="submission-form__secondary admin-decision-panel__button" onClick={() => submit('generate')} disabled={isSubmitting !== null}>
          {isSubmitting === 'generate' ? '生成中…' : analysis ? '重新生成建议' : '生成建议'}
        </button>
        <button type="button" className="submission-form__secondary admin-decision-panel__button admin-decision-panel__button--approve" onClick={() => submit('confirm')} disabled={isSubmitting !== null || !analysis}>
          {isSubmitting === 'confirm' ? '采用中…' : '采用当前版本'}
        </button>
        <button type="button" className="submission-form__secondary admin-decision-panel__button" onClick={() => submit('save')} disabled={isSubmitting !== null}>
          {isSubmitting === 'save' ? '保存中…' : '保存人工版本'}
        </button>
      </div>
    </article>
  );
}
