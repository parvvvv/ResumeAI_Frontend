export function PageShell({ children, className = '', wide = false, mobileSafe = true }) {
  return (
    <main className={`page app-page-shell fade-in ${wide ? 'page-wide' : ''} ${mobileSafe ? 'mobile-nav-safe-area' : ''} ${className}`}>
      {children}
    </main>
  );
}

export function SectionHeader({ eyebrow, title, description, icon, actions, className = '' }) {
  return (
    <header className={`section-header ${className}`}>
      <div className="section-header-copy">
        {eyebrow && <div className="label-md text-muted">{eyebrow}</div>}
        <div className="section-header-title-row">
          {icon && <div className="section-header-icon">{icon}</div>}
          {title && <h1 className="display-sm">{title}</h1>}
        </div>
        {description && <p className="section-header-description">{description}</p>}
      </div>
      {actions && <div className="section-header-actions">{actions}</div>}
    </header>
  );
}

export function ActionBar({ children, className = '', sticky = false }) {
  return (
    <div className={`action-bar ${sticky ? 'action-bar-sticky' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function MetricStrip({ items, className = '' }) {
  return (
    <div className={`metric-strip ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="metric-card">
          <div className="label-md text-muted">{item.label}</div>
          <div className={`metric-value ${item.valueClassName || ''}`}>
            {item.value}
            {item.accessory && <span className="metric-accessory">{item.accessory}</span>}
          </div>
          {item.hint && <div className="metric-hint">{item.hint}</div>}
        </div>
      ))}
    </div>
  );
}

export function MobileSheet({ isOpen, onClose, children, className = '', labelledBy }) {
  if (!isOpen) return null;

  return (
    <div className="mobile-sheet-overlay" onClick={onClose}>
      <section
        className={`mobile-sheet ${className}`}
        aria-modal="true"
        aria-labelledby={labelledBy}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mobile-sheet-handle" />
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`empty-state-premium ${className}`}>
      {icon && <div className="empty-state-premium-icon">{icon}</div>}
      <h2 className="display-sm">{title}</h2>
      {description && <p className="body-lg text-muted">{description}</p>}
      {action && <div className="empty-state-premium-action">{action}</div>}
    </div>
  );
}

export function IconButton({ children, label, className = '', ...props }) {
  return (
    <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function ResponsiveCardList({ children, className = '', as = 'div' }) {
  const Element = as;
  return (
    <Element className={`responsive-card-list ${className}`}>
      {children}
    </Element>
  );
}
