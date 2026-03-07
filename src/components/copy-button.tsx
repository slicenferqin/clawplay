'use client';

import { useState } from 'react';

import { CopyIcon } from '@/components/icons';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'light' | 'dark';
}

export function CopyButton({ text, label = '复制', variant = 'light' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={`copy-button copy-button--${variant}`} onClick={handleCopy}>
      <CopyIcon className="copy-button__icon" />
      <span>{copied ? '已复制' : label}</span>
    </button>
  );
}
