'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { trackClientEvent, trackClientEventOnce } from '@/lib/analytics/client';
import { RECOMMENDED_TAGS, assessSubmissionContent, getTagInputHint, getTextRangeHint } from '@/lib/content-rules';
import { CATEGORY_LABELS, PUBLIC_CATEGORY_OPTIONS, type SoulCategoryKey } from '@/lib/souls-types';

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
  category: SoulCategoryKey;
  tags: string;
  proposedTags: string;
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

const DEFAULT_RIGHTS_STATEMENT = '我确认自己有权提交这份 Soul，且来源、协议与标注信息真实有效。';
const RAW_SOUL_ACCEPT = '.md,.markdown,.txt,text/markdown,text/plain';
const RAW_SOUL_MAX_FILE_BYTES = 512 * 1024;

const defaultValues: SubmissionFormValues = {
  submissionType: '原创',
  title: '',
  summary: '',
  category: 'creative',
  tags: '',
  proposedTags: '',
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
  rightsStatement: DEFAULT_RIGHTS_STATEMENT,
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
    proposedTags: parseList(values.proposedTags),
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
    rightsStatement: values.rightsStatement.trim() || DEFAULT_RIGHTS_STATEMENT,
    submitterNote: values.submitterNote,
    website: values.website,
  };
}

function mapInitialValues(values?: SubmissionFormValues): SubmissionFormValues {
  return values ? { ...values } : { ...defaultValues };
}

function appendListValue(currentValue: string, nextValue: string) {
  const items = parseList(currentValue);
  if (items.includes(nextValue)) {
    return items.join('\n');
  }

  return [...items, nextValue].join('\n');
}

function isSupportedRawSoulFile(file: File) {
  if (/\.(md|markdown|txt)$/i.test(file.name)) {
    return true;
  }

  return file.type === 'text/markdown' || file.type === 'text/plain' || file.type === '';
}

function normalizeRawSoulText(value: string) {
  return value.replace(/\r\n/g, '\n');
}

export function SoulSubmissionForm({ mode = 'create', publicId, manageToken, initialValues }: SoulSubmissionFormProps) {
  const router = useRouter();
  const rawSoulFileInputRef = useRef<HTMLInputElement>(null);
  const rawSoulDragDepthRef = useRef(0);

  const [values, setValues] = useState<SubmissionFormValues>(mapInitialValues(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(mode === 'revision');
  const [rawSoulImportError, setRawSoulImportError] = useState('');
  const [rawSoulImportedFileName, setRawSoulImportedFileName] = useState('');
  const [isRawSoulDragActive, setIsRawSoulDragActive] = useState(false);

  const endpoint = useMemo(() => {
    if (mode === 'revision' && publicId) {
      return `/api/submissions/${publicId}`;
    }

    return '/api/submissions';
  }, [mode, publicId]);

  const draftPayload = useMemo(() => buildPayload(values), [values]);
  const contentAssessment = useMemo(() => assessSubmissionContent(draftPayload), [draftPayload]);
  const blockingChecks = useMemo(
    () => contentAssessment.checks.filter((check) => check.status === 'blocking'),
    [contentAssessment.checks],
  );
  const tagHint = useMemo(() => getTagInputHint(draftPayload.tags), [draftPayload.tags]);
  const titleHint = useMemo(() => getTextRangeHint(values.title, 4, 28), [values.title]);
  const summaryHint = useMemo(() => getTextRangeHint(values.summary, 24, 100), [values.summary]);
  const selectedTags = useMemo(() => new Set(draftPayload.tags), [draftPayload.tags]);
  const proposedTagList = useMemo(() => parseList(values.proposedTags), [values.proposedTags]);
  const requiresSourceAttribution = values.submissionType !== '原创';
  const isLegacyTranslatedCategory = values.category === 'translated';
  const requiredItemsText = requiresSourceAttribution
    ? '投稿类型、分类、标题、简介、SOUL 原文、作者、协议、来源链接'
    : '投稿类型、分类、标题、简介、SOUL 原文、作者、协议';

  function updateValue<Key extends keyof SubmissionFormValues>(key: Key, value: SubmissionFormValues[Key]) {
    if (!hasTrackedStart) {
      trackClientEventOnce(`submission_started:${mode}:${publicId ?? 'new'}`, {
        eventName: 'submission_started',
        source: 'submission',
        placement: mode === 'revision' ? 'revision_form' : 'submit_form',
      });
      setHasTrackedStart(true);
    }

    if (key === 'rawSoul') {
      setRawSoulImportError('');
    }

    setValues((current) => ({ ...current, [key]: value }));
  }

  async function importRawSoulFile(file: File) {
    if (!isSupportedRawSoulFile(file)) {
      setRawSoulImportError('目前只支持导入 `.md`、`.markdown` 或纯文本文件。');
      return;
    }

    if (file.size > RAW_SOUL_MAX_FILE_BYTES) {
      setRawSoulImportError('文件有点大，先控制在 512 KB 内，再上传会更稳。');
      return;
    }

    try {
      const text = normalizeRawSoulText(await file.text());
      if (!text.trim()) {
        setRawSoulImportError('文件内容是空的，换一个有实际内容的 SOUL.md 再试试。');
        return;
      }

      updateValue('rawSoul', text);
      setRawSoulImportedFileName(file.name);
      setRawSoulImportError('');
    } catch {
      setRawSoulImportError('文件读取失败了，可能是编码异常。你也可以直接把内容粘贴进文本框。');
    }
  }

  function triggerRawSoulFilePicker() {
    rawSoulFileInputRef.current?.click();
  }

  async function handleRawSoulFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) {
      return;
    }

    await importRawSoulFile(file);
  }

  function handleRawSoulDragEnter(event: React.DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return;
    }

    event.preventDefault();
    rawSoulDragDepthRef.current += 1;
    setIsRawSoulDragActive(true);
  }

  function handleRawSoulDragOver(event: React.DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleRawSoulDragLeave(event: React.DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return;
    }

    event.preventDefault();
    rawSoulDragDepthRef.current = Math.max(rawSoulDragDepthRef.current - 1, 0);
    if (rawSoulDragDepthRef.current === 0) {
      setIsRawSoulDragActive(false);
    }
  }

  async function handleRawSoulDrop(event: React.DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes('Files')) {
      return;
    }

    event.preventDefault();
    rawSoulDragDepthRef.current = 0;
    setIsRawSoulDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await importRawSoulFile(file);
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
      setErrorMessage('提交失败，请检查核心信息是否填写完整。');
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
      <section className="submission-form__section submission-intake">
        <div className="submission-form__section-header">
          <h2>{mode === 'revision' ? '按审核意见补资料' : '先交一个起始 Soul，剩下的展示信息后面再补'}</h2>
          <p>
            {mode === 'revision'
              ? '这次不需要再从头填写。优先把审核里点名的问题补齐，其他展示信息可以顺手完善。'
              : '这页先收最关键的信息，目的是让你顺利把这个灵魂起点投进来。标签、预览示例、风格说明和联系方式，都可以后面再补。'}
          </p>
        </div>

        <div className="submission-intake__meta">
          <span className="admin-meta-pill"><strong>首稿必填</strong><span>{requiresSourceAttribution ? '8 项' : '7 项'}</span></span>
          <span className="admin-meta-pill"><strong>现在要填</strong><span>{requiredItemsText}</span></span>
          <span className="admin-meta-pill"><strong>可后补</strong><span>标签、预览、人格描述、联系方式</span></span>
        </div>

        {mode === 'revision' ? (
          <div className={`submission-intake__review ${contentAssessment.readyForPublish ? 'is-ready' : 'is-blocked'}`}>
            <strong>{contentAssessment.readyForPublish ? '当前这版已经没有发布阻断项' : `当前还有 ${blockingChecks.length} 个待补阻断项`}</strong>
            <p>
              {contentAssessment.readyForPublish
                ? `已经满足发布底线${contentAssessment.warningCount > 0 ? `，另外还有 ${contentAssessment.warningCount} 个建议优化项。` : '。'}`
                : '先把下面列出的阻断项处理掉，再重新提交补充版本。'}
            </p>
            {blockingChecks.length > 0 ? (
              <ul className="submission-intake__review-list">
                {blockingChecks.map((check) => <li key={check.id}>{check.label}</li>)}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="submission-form__hint">前台不会因为展示字段没填完整就拦你；后台审核真正优先看的是这个人格起点是否可信、可导入、来源是否清楚。</p>
        )}
      </section>

      <section className="submission-form__section submission-form__section--compact">
        <div className="submission-form__section-header">
          <h2>核心信息</h2>
          <p>这部分是首稿必填，尽量控制在 1-2 分钟内完成。</p>
        </div>

        <div className="submission-form__grid submission-form__grid--core">
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
              {isLegacyTranslatedCategory ? <option value="translated">{CATEGORY_LABELS.translated}（旧分类，建议调整）</option> : null}
              {PUBLIC_CATEGORY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            {isLegacyTranslatedCategory ? (
              <p className="submission-form__assist submission-form__assist--warning">
                “翻译精选”已不再作为公开分类，建议改成更贴近用途的分类，例如开发专家或个性人格。
              </p>
            ) : null}
          </div>

          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="title">标题</label>
            <input id="title" className="submission-form__input" value={values.title} onChange={(event) => updateValue('title', event.target.value)} required />
            <p className={`submission-form__assist submission-form__assist--${titleHint.tone}`}>{titleHint.message}</p>
          </div>

          <div className="submission-form__group submission-form__group--full">
            <label className="submission-form__label" htmlFor="summary">一句话简介</label>
            <textarea id="summary" className="submission-form__textarea" rows={3} value={values.summary} onChange={(event) => updateValue('summary', event.target.value)} required />
            <p className={`submission-form__assist submission-form__assist--${summaryHint.tone}`}>{summaryHint.message}</p>
          </div>

          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="author-name">作者名</label>
            <input id="author-name" className="submission-form__input" value={values.authorName} onChange={(event) => updateValue('authorName', event.target.value)} required />
          </div>

          <div className="submission-form__group">
            <label className="submission-form__label" htmlFor="license">协议</label>
            <input id="license" className="submission-form__input" value={values.license} onChange={(event) => updateValue('license', event.target.value)} required />
          </div>

          {requiresSourceAttribution ? (
            <>
              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="source-url">来源链接</label>
                <input id="source-url" className="submission-form__input" value={values.sourceUrl} onChange={(event) => updateValue('sourceUrl', event.target.value)} required={requiresSourceAttribution} />
                <p className={`submission-form__assist submission-form__assist--${values.sourceUrl.trim() ? 'pass' : 'warning'}`}>
                  {values.sourceUrl.trim() ? '来源链接已提供。' : '翻译或改编稿件至少要提供原始来源链接，最好还能补清原作者。'}
                </p>
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="source-author">原作者（选填但强烈建议）</label>
                <input id="source-author" className="submission-form__input" value={values.sourceAuthor} onChange={(event) => updateValue('sourceAuthor', event.target.value)} />
              </div>
            </>
          ) : null}

          <div className="submission-form__group submission-form__group--full">
            <div className="submission-form__label-row">
              <label className="submission-form__label" htmlFor="raw-soul">原始 SOUL.md</label>
              <button type="button" className="submission-form__inline-action" onClick={triggerRawSoulFilePicker} disabled={isSubmitting}>
                导入 .md 文件
              </button>
            </div>

            <input
              ref={rawSoulFileInputRef}
              type="file"
              accept={RAW_SOUL_ACCEPT}
              className="submission-form__file-input"
              onChange={handleRawSoulFileChange}
              tabIndex={-1}
            />

            <div
              className={`submission-form__file-dropzone ${isRawSoulDragActive ? 'is-active' : ''}`}
              onDragEnter={handleRawSoulDragEnter}
              onDragOver={handleRawSoulDragOver}
              onDragLeave={handleRawSoulDragLeave}
              onDrop={handleRawSoulDrop}
            >
              <div className="submission-form__file-dropzone-head">
                <p className="submission-form__file-dropzone-title">支持直接拖拽 `.md` 文件，或点击上方按钮导入</p>
                <p className="submission-form__file-dropzone-meta">
                  {rawSoulImportedFileName
                    ? `已导入 ${rawSoulImportedFileName}，现在还可以继续手动编辑。`
                    : '导入后会自动填充到下方文本框，省掉复制粘贴；有原始 `.md` 就可以先投。'}
                </p>
              </div>
              <textarea id="raw-soul" className="submission-form__textarea submission-form__textarea--code" rows={16} value={values.rawSoul} onChange={(event) => updateValue('rawSoul', event.target.value)} required />
            </div>

            <p className={`submission-form__assist submission-form__assist--${rawSoulImportError ? 'warning' : 'neutral'}`}>
              {rawSoulImportError || '尽量贴接近最终导入态的版本。先把能导入的内容交上来，比把展示文案一次写满更重要。'}
            </p>
          </div>
        </div>
      </section>

      <section className="submission-form__section submission-form__section--compact">
        <div className="submission-form__toolbar">
          <div>
            <h2 className="submission-form__toolbar-title">补充展示信息</h2>
            <p className="submission-form__hint">这部分不是首稿门槛，但会明显影响审核效率、列表页观感和后续 SEO。</p>
          </div>
          <button
            type="button"
            className="submission-form__secondary submission-form__toggle"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((current) => !current)}
          >
            {showAdvanced ? '收起补充信息' : '展开补充信息（可选）'}
          </button>
        </div>

        {showAdvanced ? (
          <div className="submission-form__advanced">
            <div className="submission-form__grid">
              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="tags">正式标签（可选）</label>
                <textarea id="tags" className="submission-form__textarea" rows={4} value={values.tags} onChange={(event) => updateValue('tags', event.target.value)} placeholder="优先填写推荐词表里的标签，每行一个或用逗号分隔" />
                <p className={`submission-form__assist submission-form__assist--${tagHint.tone}`}>
                  {tagHint.review.offDictionaryTags.length > 0
                    ? `${tagHint.message} 如果这些是你想提议的新标签，建议改填到下面的“新标签建议”。`
                    : tagHint.message}
                </p>
                <div className="submission-form__tag-suggestions">
                  {RECOMMENDED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`submission-form__tag-suggestion ${selectedTags.has(tag) ? 'is-selected' : ''}`}
                      onClick={() => updateValue('tags', appendListValue(values.tags, tag))}
                      disabled={selectedTags.has(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="proposed-tags">新标签建议（选填）</label>
                <textarea
                  id="proposed-tags"
                  className="submission-form__textarea"
                  rows={3}
                  value={values.proposedTags}
                  onChange={(event) => updateValue('proposedTags', event.target.value)}
                  placeholder="如果你觉得这份 Soul 还需要新的标签词，填在这里，每行一个或用逗号分隔"
                />
                <p className={`submission-form__assist submission-form__assist--${proposedTagList.length > 0 ? 'warning' : 'neutral'}`}>
                  {proposedTagList.length > 0
                    ? `已记录 ${proposedTagList.length} 个新标签建议，后台会决定归并、收录或驳回。`
                    : '这里专门用来提议词表外的新标签，不建议直接把它们塞进正式标签。'}
                </p>
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="intro">详细介绍</label>
                <textarea id="intro" className="submission-form__textarea" rows={4} value={values.intro} onChange={(event) => updateValue('intro', event.target.value)} placeholder="说说这份 Soul 的定位、特色和适合谁用。" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="preview-hook">预览钩子</label>
                <textarea id="preview-hook" className="submission-form__textarea" rows={3} value={values.previewHook} onChange={(event) => updateValue('previewHook', event.target.value)} placeholder="一句话勾住用户点进详情页。" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="preview-prompt">示例 Prompt</label>
                <textarea id="preview-prompt" className="submission-form__textarea" rows={3} value={values.previewPrompt} onChange={(event) => updateValue('previewPrompt', event.target.value)} placeholder="给一个代表性输入场景。" />
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="preview-response">示例 Response</label>
                <textarea id="preview-response" className="submission-form__textarea" rows={5} value={values.previewResponse} onChange={(event) => updateValue('previewResponse', event.target.value)} placeholder="给一个最能体现风格和能力的输出片段。" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="tones">语气 / 风格</label>
                <textarea id="tones" className="submission-form__textarea" rows={4} value={values.tones} onChange={(event) => updateValue('tones', event.target.value)} placeholder="每行一个，或用逗号分隔" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="use-cases">适用场景</label>
                <textarea id="use-cases" className="submission-form__textarea" rows={4} value={values.useCases} onChange={(event) => updateValue('useCases', event.target.value)} placeholder="每行一个，或用逗号分隔" />
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="compatible-models">兼容模型</label>
                <textarea id="compatible-models" className="submission-form__textarea" rows={3} value={values.compatibleModels} onChange={(event) => updateValue('compatibleModels', event.target.value)} placeholder="每行一个，或用逗号分隔" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="features">特色功能</label>
                <textarea id="features" className="submission-form__textarea" rows={4} value={values.features} onChange={(event) => updateValue('features', event.target.value)} placeholder="每行一个，或用逗号分隔" />
              </div>

              <div className="submission-form__group">
                <label className="submission-form__label" htmlFor="suggestions">使用建议</label>
                <textarea id="suggestions" className="submission-form__textarea" rows={4} value={values.suggestions} onChange={(event) => updateValue('suggestions', event.target.value)} placeholder="每行一个，或用逗号分隔" />
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

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="rights-statement">版权 / 投稿声明</label>
                <textarea id="rights-statement" className="submission-form__textarea" rows={3} value={values.rightsStatement} onChange={(event) => updateValue('rightsStatement', event.target.value)} />
              </div>

              <div className="submission-form__group submission-form__group--full">
                <label className="submission-form__label" htmlFor="submitter-note">补充说明</label>
                <textarea id="submitter-note" className="submission-form__textarea" rows={4} value={values.submitterNote} onChange={(event) => updateValue('submitterNote', event.target.value)} placeholder="例如来源说明、改编范围、希望审核重点关注的地方。" />
              </div>
            </div>
          </div>
        ) : null}
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
        <p className="submission-form__hint">提交后会进入人工审核队列。需要补资料时，你会通过私密管理链接继续补，不要求这次一次写完。</p>
        <button type="submit" className="submission-form__submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中…' : mode === 'revision' ? '提交补充版本' : '提交首稿'}
        </button>
      </div>
    </form>
  );
}
