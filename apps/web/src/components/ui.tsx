import { clsx } from 'clsx';
import { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function cn(...parts: Array<string | false | null | undefined>) {
  return clsx(parts);
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const styles = {
    primary: 'bg-teal text-white hover:bg-[#066a8a]',
    secondary: 'bg-white text-navy border border-border hover:bg-cyan',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'bg-transparent text-navy hover:bg-cyan',
  }[variant];
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50',
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-teal focus:ring-2 focus:ring-cyan',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-teal focus:ring-2 focus:ring-cyan',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-teal',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">{children}</label>;
}

export function Card({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-white p-4 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const map = {
    neutral: 'bg-surface text-navy border-border',
    success: 'bg-green-50 text-success border-green-200',
    warning: 'bg-amber-50 text-warning border-amber-200',
    danger: 'bg-red-50 text-danger border-red-200',
    info: 'bg-cyan text-teal border-teal/20',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold', map)}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-navy/60">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white p-10 text-center">
      <p className="font-semibold text-navy">{title}</p>
      {hint ? <p className="mt-1 text-sm text-navy/60">{hint}</p> : null}
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/30">
      <button className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  const s = status.toUpperCase();
  if (['APPROVED', 'RESOLVED', 'DONE', 'ACTIVE', 'COMPLETED'].includes(s)) return 'success';
  if (['PENDING', 'SUBMITTED', 'REVIEW_REQUIRED', 'DETECTED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED'].includes(s))
    return 'warning';
  if (['REJECTED', 'CANCELLED', 'SUSPENDED', 'CRITICAL'].includes(s)) return 'danger';
  if (['RETURNED', 'ACKNOWLEDGED', 'IN_REVIEW'].includes(s)) return 'info';
  return 'neutral';
}
