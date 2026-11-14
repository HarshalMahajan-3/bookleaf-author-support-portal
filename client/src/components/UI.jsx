import { ArrowUpRight, Inbox, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusStyles = {
  Open: 'bg-amber-50 text-amber-700 ring-amber-200',
  'In Progress': 'bg-sky-50 text-sky-700 ring-sky-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};
const priorityStyles = {
  Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
  High: 'bg-orange-50 text-orange-700 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-200',
  Low: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function Pill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[tone] || tones.neutral}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusStyles[status] || statusStyles.Open}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${priorityStyles[priority] || priorityStyles.Medium}`}>
    {priority === 'Critical' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />}{priority}
  </span>;
}

export function PageTitle({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="eyebrow">{eyebrow}</p><h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>;
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'leaf', trend }) {
  const accents = { leaf: 'bg-[#eef6dc] text-forest', blue: 'bg-sky-50 text-sky-700', orange: 'bg-orange-50 text-orange-700', purple: 'bg-violet-50 text-violet-700' };
  return <div className="panel flex min-h-[128px] flex-col justify-between p-5">
    <div className="flex items-start justify-between gap-3"><p className="text-[13px] font-medium text-muted">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${accents[accent] || accents.leaf}`}><Icon size={17} /></span></div>
    <div><p className="mt-3 font-display text-[26px] font-bold tracking-tight text-ink">{value}</p>{hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}{trend && <p className="mt-1 text-xs font-semibold text-emerald-700">{trend}</p>}</div>
  </div>;
}

export function EmptyState({ title = 'Nothing here yet', description = 'New activity will appear here.', action }) {
  return <div className="flex min-h-[230px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/70 px-6 py-10 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cream text-muted"><Inbox size={21} /></span>
    <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-muted">{description}</p>{action && <div className="mt-4">{action}</div>}
  </div>;
}

export function PrimaryButton({ children, className = '', loading = false, ...props }) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#245445] disabled:cursor-not-allowed disabled:opacity-60 ${className}`} disabled={loading || props.disabled} {...props}>
    {loading ? <LoaderCircle className="animate-spin" size={16} /> : null}{children}
  </button>;
}

export function SecondaryButton({ children, className = '', ...props }) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-[#cbd5c9] hover:bg-cream disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}

export function TextLink({ to, children }) { return <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">{children}<ArrowUpRight size={14} /></Link>; }
