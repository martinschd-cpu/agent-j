import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export function Logo({ size = 32 }: { size?: number }) {
  return <img className="logo" src="/logo.png" width={size} height={size} alt="Agent-J" />;
}

export function TopBar({
  title,
  subtitle,
  back,
  leading,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Route to go back to; shows a back button (mobile only on desktop-split views). */
  back?: string;
  leading?: ReactNode;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      {back && (
        <button className="icon-btn topbar-back" onClick={() => navigate(back)} aria-label="Zurück">
          <Icon name="back" size={22} />
        </button>
      )}
      {leading}
      <div className="topbar-titles">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </header>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  variant = 'ghost',
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  variant?: 'ghost' | 'primary' | 'soft';
}) {
  return (
    <button className={`icon-btn icon-btn-${variant}`} onClick={onClick} aria-label={label} title={label}>
      <Icon name={icon} />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: Array<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`segmented segmented-${size}`} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === value}
          className={o.id === value ? 'active' : ''}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  color,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  color?: string;
  icon?: IconName;
}) {
  return (
    <button
      className={`chip${active ? ' active' : ''}`}
      onClick={onClick}
      style={color ? ({ '--chip-color': color } as React.CSSProperties) : undefined}
    >
      {color && <span className="chip-dot" />}
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle${checked ? ' on' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <IconButton icon="x" label="Schließen" onClick={onClose} />
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Section({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Row({
  icon,
  title,
  detail,
  trailing,
  onClick,
  danger,
}: {
  icon?: IconName;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`row${onClick ? ' row-click' : ''}${danger ? ' row-danger' : ''}`} onClick={onClick}>
      {icon && (
        <span className="row-icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="row-main">
        <span className="row-title">{title}</span>
        {detail && <span className="row-detail">{detail}</span>}
      </span>
      {trailing}
    </Tag>
  );
}
