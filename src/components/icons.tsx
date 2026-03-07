import type { SVGProps } from 'react';

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M7.5 0 5.2 5.2 0 7.5l5.2 2.3L7.5 15l2.3-5.2L15 7.5 9.8 5.2 7.5 0Z" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M10.7 5.3a5.3 5.3 0 1 1-10.7 0 5.3 5.3 0 0 1 10.7 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" transform="translate(2 2)" />
      <path d="m11.1 11.1 2.9 2.9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M1 6h8m0 0L6 3m3 3-3 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
      <path d="M6 1v6m0 0L3 4m3 3 3-3M2 10h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M6 2h7v9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <rect x="3" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
