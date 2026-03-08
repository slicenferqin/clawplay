'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      setErrorMessage(payload?.error === 'not_configured' ? '管理员密码尚未配置。' : '密码不正确。');
      setIsSubmitting(false);
      return;
    }

    const nextPath = searchParams.get('next') || '/admin/submissions';
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="submission-form" onSubmit={handleSubmit}>
      <div className="submission-form__group">
        <label className="submission-form__label" htmlFor="admin-password">管理员密码</label>
        <input
          id="admin-password"
          type="password"
          className="submission-form__input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {errorMessage ? <p className="submission-form__error">{errorMessage}</p> : null}
      <button type="submit" className="submission-form__submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中…' : '进入审核后台'}
      </button>
    </form>
  );
}
