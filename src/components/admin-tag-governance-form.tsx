'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { RECOMMENDED_TAGS } from '@/lib/content-rules';

interface AdminTagGovernanceFormProps {
  submissionId: string;
  currentTags: string[];
  proposedTags: string[];
}

type TagAction = 'merge' | 'accept' | 'dismiss';

const actionLabels: Record<TagAction, string> = {
  merge: '归并到现有标签',
  accept: '收录为正式标签',
  dismiss: '驳回标签建议',
};

export function AdminTagGovernanceForm({ submissionId, currentTags, proposedTags }: AdminTagGovernanceFormProps) {
  const router = useRouter();
  const availableTags = useMemo(() => Array.from(new Set([...currentTags, ...RECOMMENDED_TAGS])), [currentTags]);
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>(() => Object.fromEntries(
    proposedTags.map((tag) => [tag, currentTags[0] ?? RECOMMENDED_TAGS[0] ?? '']),
  ));
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function applyAction(action: TagAction, proposedTag: string) {
    const submissionKey = `${action}:${proposedTag}`;
    setSubmittingKey(submissionKey);
    setErrorMessage('');

    const response = await fetch(`/api/admin/submissions/${submissionId}/tags`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        action,
        proposedTag,
        targetTag: action === 'merge' ? mergeTargets[proposedTag] : null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!response.ok || !payload?.ok) {
      setErrorMessage(
        payload?.error === 'invalid_target_tag'
          ? '请先选择一个要归并到的正式标签。'
          : '标签处理失败，请刷新后重试。',
      );
      setSubmittingKey(null);
      return;
    }

    setSubmittingKey(null);
    router.refresh();
  }

  if (proposedTags.length === 0) {
    return (
      <div className="tag-governance-empty">
        <strong>当前没有待处理的新标签建议。</strong>
        <p>这篇稿件的正式标签已经可以直接用于前台展示；如果后续修订再补新词，这里会再次出现待处理队列。</p>
      </div>
    );
  }

  return (
    <div className="tag-governance-panel">
      <div className="tag-governance-panel__header">
        <div>
          <h3 className="detail-panel__subheading">待处理标签建议</h3>
          <p className="detail-panel__body">对每个提议标签，你可以选择归并到已有词、接受为这篇稿件的正式标签，或直接驳回。</p>
        </div>
      </div>

      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}

      <div className="tag-governance-list">
        {proposedTags.map((tag) => {
          const mergeTarget = mergeTargets[tag] ?? availableTags[0] ?? '';

          return (
            <article key={tag} className="tag-governance-item">
              <div className="tag-governance-item__top">
                <div>
                  <span className="tag-governance-item__label">标签建议</span>
                  <strong className="tag-governance-item__value">{tag}</strong>
                </div>
                <span className="admin-table__signal is-warning">待处理</span>
              </div>

              <div className="tag-governance-item__merge">
                <label className="submission-form__label" htmlFor={`merge-target-${tag}`}>归并到现有标签</label>
                <select
                  id={`merge-target-${tag}`}
                  className="submission-form__input"
                  value={mergeTarget}
                  onChange={(event) => setMergeTargets((current) => ({ ...current, [tag]: event.target.value }))}
                >
                  {availableTags.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="tag-governance-item__actions">
                <button
                  type="button"
                  className="submission-form__secondary admin-decision-panel__button"
                  onClick={() => applyAction('merge', tag)}
                  disabled={submittingKey !== null || !mergeTarget}
                >
                  {submittingKey === `merge:${tag}` ? '处理中…' : actionLabels.merge}
                </button>
                <button
                  type="button"
                  className="submission-form__secondary admin-decision-panel__button admin-decision-panel__button--approve"
                  onClick={() => applyAction('accept', tag)}
                  disabled={submittingKey !== null}
                >
                  {submittingKey === `accept:${tag}` ? '处理中…' : actionLabels.accept}
                </button>
                <button
                  type="button"
                  className="submission-form__secondary admin-decision-panel__button admin-decision-panel__button--danger"
                  onClick={() => applyAction('dismiss', tag)}
                  disabled={submittingKey !== null}
                >
                  {submittingKey === `dismiss:${tag}` ? '处理中…' : actionLabels.dismiss}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
