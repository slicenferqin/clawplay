'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminDecisionFormProps {
  submissionId: string;
  initialSlug: string;
}

type AdminAction = 'needs_revision' | 'reject' | 'approve' | 'publish';

const actionLabels: Record<AdminAction, string> = {
  needs_revision: '标记待补充',
  reject: '拒绝投稿',
  approve: '通过审核',
  publish: '发布入站',
};

export function AdminDecisionForm({ submissionId, initialSlug }: AdminDecisionFormProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [slug, setSlug] = useState(initialSlug);
  const [submittingAction, setSubmittingAction] = useState<AdminAction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(action: AdminAction) {
    setSubmittingAction(action);
    setErrorMessage('');

    const response = await fetch(`/api/admin/submissions/${submissionId}/decision`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ action, note, slug }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      setErrorMessage(payload?.error === 'unauthorized' ? '登录已失效，请重新登录。' : '操作失败，请检查状态流转或 slug。');
      setSubmittingAction(null);
      return;
    }

    setSubmittingAction(null);
    router.refresh();
  }

  const isSubmitting = submittingAction !== null;

  return (
    <div className="admin-decision-panel">
      <div className="admin-decision-panel__header">
        <div>
          <h3 className="detail-panel__subheading">处理说明</h3>
          <p className="detail-panel__body">
            审核备注会写入状态记录；发布 slug 只在“发布入站”时生效，用来生成最终 Soul 地址。
          </p>
        </div>
      </div>

      <div className="admin-decision-panel__grid">
        <div className="submission-form__group admin-decision-panel__group admin-decision-panel__group--full">
          <label className="submission-form__label" htmlFor="review-note">审核备注</label>
          <textarea
            id="review-note"
            className="submission-form__textarea"
            rows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="给投稿人的补充建议、通过说明或拒绝原因。"
          />
          <p className="admin-decision-panel__hint">建议写清楚：为什么通过、为什么要补充、为什么不采用，方便后续回看记录。</p>
        </div>

        <div className="submission-form__group admin-decision-panel__group">
          <label className="submission-form__label" htmlFor="publish-slug">发布 slug</label>
          <input
            id="publish-slug"
            className="submission-form__input"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="留空则自动生成"
          />
          <p className="admin-decision-panel__hint">建议使用简短、稳定、可读的英文 slug；如果暂不发布，可先不处理。</p>
        </div>
      </div>

      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}

      <section className="admin-decision-panel__section">
        <div className="admin-decision-panel__section-head">
          <div>
            <h3 className="detail-panel__subheading">审核流转</h3>
            <p className="admin-decision-panel__hint">先决定这份稿件是否继续推进，再决定是否立即发布。</p>
          </div>
        </div>
        <div className="admin-decision-panel__actions admin-decision-panel__actions--stacked">
          <button
            type="button"
            className="submission-form__secondary admin-decision-panel__button"
            onClick={() => submit('needs_revision')}
            disabled={isSubmitting}
          >
            {submittingAction === 'needs_revision' ? '处理中…' : actionLabels.needs_revision}
          </button>
          <button
            type="button"
            className="submission-form__secondary admin-decision-panel__button admin-decision-panel__button--danger"
            onClick={() => submit('reject')}
            disabled={isSubmitting}
          >
            {submittingAction === 'reject' ? '处理中…' : actionLabels.reject}
          </button>
          <button
            type="button"
            className="submission-form__secondary admin-decision-panel__button admin-decision-panel__button--approve"
            onClick={() => submit('approve')}
            disabled={isSubmitting}
          >
            {submittingAction === 'approve' ? '处理中…' : actionLabels.approve}
          </button>
        </div>
      </section>

      <section className="admin-decision-panel__section admin-decision-panel__section--publish">
        <div className="admin-decision-panel__section-head">
          <div>
            <h3 className="detail-panel__subheading">发布动作</h3>
            <p className="admin-decision-panel__hint">确认内容与 slug 都无误后，再执行最终发布，站点会立即读取该 Soul。</p>
          </div>
        </div>
        <div className="admin-decision-panel__actions">
          <button
            type="button"
            className="submission-form__submit admin-decision-panel__button admin-decision-panel__button--publish"
            onClick={() => submit('publish')}
            disabled={isSubmitting}
          >
            {submittingAction === 'publish' ? '发布中…' : actionLabels.publish}
          </button>
        </div>
      </section>
    </div>
  );
}
