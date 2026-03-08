'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminDecisionFormProps {
  submissionId: string;
  initialSlug: string;
}

export function AdminDecisionForm({ submissionId, initialSlug }: AdminDecisionFormProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [slug, setSlug] = useState(initialSlug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function submit(action: 'needs_revision' | 'reject' | 'approve' | 'publish') {
    setIsSubmitting(true);
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
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="admin-decision-panel">
      <div className="submission-form__group">
        <label className="submission-form__label" htmlFor="review-note">审核备注</label>
        <textarea
          id="review-note"
          className="submission-form__textarea"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="给投稿人的补充建议、通过说明或拒绝原因。"
        />
      </div>
      <div className="submission-form__group">
        <label className="submission-form__label" htmlFor="publish-slug">发布 slug</label>
        <input
          id="publish-slug"
          className="submission-form__input"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="留空则自动生成"
        />
      </div>
      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}
      <div className="admin-decision-panel__actions">
        <button type="button" className="submission-form__secondary" onClick={() => submit('needs_revision')} disabled={isSubmitting}>标记待补充</button>
        <button type="button" className="submission-form__secondary" onClick={() => submit('reject')} disabled={isSubmitting}>拒绝</button>
        <button type="button" className="submission-form__secondary" onClick={() => submit('approve')} disabled={isSubmitting}>通过审核</button>
        <button type="button" className="submission-form__submit" onClick={() => submit('publish')} disabled={isSubmitting}>发布入站</button>
      </div>
    </div>
  );
}
