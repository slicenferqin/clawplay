import type { SubmissionStatus } from '@/lib/submissions/schema';

const statusLabels: Record<SubmissionStatus, string> = {
  pending_review: '待审核',
  needs_revision: '待补充',
  approved: '已通过',
  published: '已发布',
  rejected: '未采用',
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabels[status]}</span>;
}
