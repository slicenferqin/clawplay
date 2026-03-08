'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { trackClientEvent, trackClientEventOnce } from '@/lib/analytics/client';

interface SoulSubmissionFormProps {
  mode?: 'create' | 'revision';
  publicId?: string;
  manageToken?: string;
  initialValues?: SubmissionFormValues;
}

export interface SubmissionFormValues {
  submissionType: '原创' | '翻译' | '改编';
  title: string;
  summary: string;
  category: 'work' | 'creative' | 'translated' | 'learning' | 'dev';
  tags: string;
  tones: string;
  useCases: string;
  compatibleModels: string;
  previewHook: string;
  previewPrompt: string;
  previewResponse: string;
  intro: string;
  features: string;
  suggestions: string;
  rawSoul: string;
  authorName: string;
  contactMethod: '' | 'github' | 'email' | 'wechat' | 'other';
  contactValue: string;
  license: string;
  sourceUrl: string;
  sourceAuthor: string;
  rightsStatement: string;
  submitterNote: string;
  website: string;
}

const defaultValues: SubmissionFormValues = {
  submissionType: '原创',
  title: '',
  summary: '',
  category: 'creative',
  tags: '',
  tones: '',
  useCases: '',
  compatibleModels: 'Claude Sonnet\nClaude Opus',
  previewHook: '',
  previewPrompt: '',
  previewResponse: '',
  intro: '',
  features: '',
  suggestions: '',
  rawSoul: '',
  authorName: '',
  contactMethod: 'github',
  contactValue: '',
  license: 'CC BY 4.0',
  sourceUrl: '',
  sourceAuthor: '',
  rightsStatement: '我确认自己有权提交这份 Soul，且来源、协议与标注信息真实有效。',
  submitterNote: '',
  website: '',
};

function parseList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPayload(values: SubmissionFormValues) {
  return {
    submissionType: values.submissionType,
    title: values.title,
    summary: values.summary,
    category: values.category,
    tags: parseList(values.tags),
    tones: parseList(values.tones),
    useCases: parseList(values.useCases),
    compatibleModels: parseList(values.compatibleModels),
    previewHook: values.previewHook,
    previewPrompt: values.previewPrompt,
    previewResponse: values.previewResponse,
    intro: values.intro,
    features: parseList(values.features),
    suggestions: parseList(values.suggestions),
    rawSoul: values.rawSoul,
    authorName: values.authorName,
    contactMethod: values.contactMethod || null,
    contactValue: values.contactValue,
    license: values.license,
    sourceUrl: values.sourceUrl,
    sourceAuthor: values.sourceAuthor,
    rightsStatement: values.rightsStatement,
    submitterNote: values.submitterNote,
    website: values.website,
  };
}

function mapInitialValues(values?: SubmissionFormValues): SubmissionFormValues {
  return values ? { ...values } : { ...defaultValues };
}

export function SoulSubmissionForm({ mode = 'create', publicId, manageToken, initialValues }: SoulSubmissionFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SubmissionFormValues>(mapInitialValues(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTrackedStart, setHasTrackedStart] = useState(false);

  const endpoint = useMemo(() => {
    if (mode === 'revision' && publicId) {
      return `/api/submissions/${publicId}`;
    }

    return '/api/submissions';
  }, [mode, publicId]);

  function updateValue<Key extends keyof SubmissionFormValues>(key: Key, value: SubmissionFormValues[Key]) {
    if (!hasTrackedStart) {
      trackClientEventOnce(`submission_started:${mode}:${publicId ?? 'new'}`, {
        eventName: 'submission_started',
        source: 'submission',
        placement: mode === 'revision' ? 'revision_form' : 'submit_form',
      });
      setHasTrackedStart(true);
    }

    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const response = await fetch(endpoint, {
      method: mode === 'revision' ? 'PATCH' : 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...buildPayload(values),
        token: manageToken,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; publicId?: string; manageUrl?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      setErrorMessage('提交失败，请检查必填项、数组字段和原始 SOUL 内容是否完整。');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'create') {
      trackClientEvent({
        eventName: 'submission_submitted',
        source: 'submission',
        placement: 'submit_form',
      });
      const target = new URL('/submit/success', window.location.origin);
      target.searchParams.set('publicId', payload.publicId ?? '');
      target.searchParams.set('manageUrl', payload.manageUrl ?? '');
      router.push(`${target.pathname}?${target.searchParams.toString()}`);
      router.refresh();
      return;
    }

    trackClientEvent({
      eventName: 'submission_revision_submitted',
      source: 'submission_status',
      placement: 'revision_form',
    });
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <section className="submission-form__section">
        <div className="submission-form__section-header">
          <h2>基本信息</h2>
          <p>先把这份 Soul 是谁、适合做什么、呈现什么风格说清楚。</p>
        </div>
        <div className="submission-form__grid">
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="submission-type">投稿类型</label>
            <select id="submission-type" className="submission-form__input" value={values.submissionType} onChange={(event) => updateValue('submissionType', event.target.value as SubmissionFormValues['submissionType'])}>
              <option value="原创">原创</option>
              <option value="翻译">翻译</option>
              <option value="改编">改编</option>
            </select>
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="category">分类</label>
            <select id="category" className="submission-form__input" value={values.category} onChange={(event) => updateValue('category', event.target.value as SubmissionFormValues['category'])}>
              <option value="work">工作助手</option>
              <option value="creative">个性人格</option>
              <option value="translated">翻译精选</option>
              <option value="learning">学习伙伴</option>
              <option value="dev">开发专家</option>
            </select>
          </div>
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="title">标题</label>
            <input id="title" className="submission-form__input" value={values.title} onChange={(event) => updateValue('title', event.target.value)} required />
          </div>
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="summary">一句话简介</label>
            <textarea id="summary" className="submission-form__textarea" rows={3} value={values.summary} onChange={(event) => updateValue('summary', event.target.value)} required />
          </div>
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="intro">详细介绍</label>
            <textarea id="intro" className="submission-form__textarea" rows={5} value={values.intro} onChange={(event) => updateValue('intro', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="tags">标签</label>
            <textarea id="tags" className="submission-form__textarea" rows={4} value={values.tags} onChange={(event) => updateValue('tags', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="tones">语气 / 风格</label>
            <textarea id="tones" className="submission-form__textarea" rows={4} value={values.tones} onChange={(event) => updateValue('tones', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="use-cases">适用场景</label>
            <textarea id="use-cases" className="submission-form__textarea" rows={4} value={values.useCases} onChange={(event) => updateValue('useCases', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="compatible-models">兼容模型</label>
            <textarea id="compatible-models" className="submission-form__textarea" rows={4} value={values.compatibleModels} onChange={(event) => updateValue('compatibleModels', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
        </div>
      </section>

      <section className="submission-form__section">
        <div className="submission-form__section-header">
          <h2>预览展示</h2>
          <p>这些字段会直接影响列表页、详情页和首页推荐卡片的观感。</p>
        </div>
        <div className="submission-form__grid">
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="preview-hook">预览钩子</label>
            <textarea id="preview-hook" className="submission-form__textarea" rows={3} value={values.previewHook} onChange={(event) => updateValue('previewHook', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="preview-prompt">示例 Prompt</label>
            <textarea id="preview-prompt" className="submission-form__textarea" rows={5} value={values.previewPrompt} onChange={(event) => updateValue('previewPrompt', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="preview-response">示例 Response</label>
            <textarea id="preview-response" className="submission-form__textarea" rows={5} value={values.previewResponse} onChange={(event) => updateValue('previewResponse', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="features">特色功能</label>
            <textarea id="features" className="submission-form__textarea" rows={5} value={values.features} onChange={(event) => updateValue('features', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="suggestions">使用建议</label>
            <textarea id="suggestions" className="submission-form__textarea" rows={5} value={values.suggestions} onChange={(event) => updateValue('suggestions', event.target.value)} placeholder="每行一个，或用逗号分隔" required />
          </div>
        </div>
      </section>

      <section className="submission-form__section">
        <div className="submission-form__section-header">
          <h2>原始内容与版权</h2>
          <p>这里决定你这份 Soul 能不能通过审核，以及能不能安全发布。</p>
        </div>
        <div className="submission-form__grid">
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="raw-soul">原始 SOUL.md</label>
            <textarea id="raw-soul" className="submission-form__textarea submission-form__textarea--code" rows={16} value={values.rawSoul} onChange={(event) => updateValue('rawSoul', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="author-name">作者名</label>
            <input id="author-name" className="submission-form__input" value={values.authorName} onChange={(event) => updateValue('authorName', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="license">协议</label>
            <input id="license" className="submission-form__input" value={values.license} onChange={(event) => updateValue('license', event.target.value)} required />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="contact-method">联系方式类型</label>
            <select id="contact-method" className="submission-form__input" value={values.contactMethod} onChange={(event) => updateValue('contactMethod', event.target.value as SubmissionFormValues['contactMethod'])}>
              <option value="github">GitHub</option>
              <option value="email">邮箱</option>
              <option value="wechat">微信</option>
              <option value="other">其他</option>
              <option value="">不提供</option>
            </select>
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="contact-value">联系方式</label>
            <input id="contact-value" className="submission-form__input" value={values.contactValue} onChange={(event) => updateValue('contactValue', event.target.value)} />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="source-author">原作者</label>
            <input id="source-author" className="submission-form__input" value={values.sourceAuthor} onChange={(event) => updateValue('sourceAuthor', event.target.value)} />
          </div>
          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="source-url">来源链接</label>
            <input id="source-url" className="submission-form__input" value={values.sourceUrl} onChange={(event) => updateValue('sourceUrl', event.target.value)} />
          </div>
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="rights-statement">版权 / 投稿声明</label>
            <textarea id="rights-statement" className="submission-form__textarea" rows={4} value={values.rightsStatement} onChange={(event) => updateValue('rightsStatement', event.target.value)} required />
          </div>
          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="submitter-note">补充说明</label>
            <textarea id="submitter-note" className="submission-form__textarea" rows={4} value={values.submitterNote} onChange={(event) => updateValue('submitterNote', event.target.value)} />
          </div>
        </div>
      </section>

      <input
        tabIndex={-1}
        autoComplete="off"
        className="submission-form__honeypot"
        value={values.website}
        onChange={(event) => updateValue('website', event.target.value)}
        aria-hidden="true"
      />

      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}
      <div className="submission-form__footer">
        <p className="submission-form__hint">提交后会进入人工审核队列。你会拿到一个私密管理链接，用来查看状态和补充资料。</p>
        <button type="submit" className="submission-form__submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中…' : mode === 'revision' ? '提交补充版本' : '提交 Soul 投稿'}
        </button>
      </div>
    </form>
  );
}
