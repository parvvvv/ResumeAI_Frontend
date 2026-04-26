import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

export function Tooltip({ content, children, className = '', preferredPlacement = 'top' }) {
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [isTouchLike, setIsTouchLike] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const syncTouchMode = () => setIsTouchLike(mediaQuery.matches);

    syncTouchMode();
    mediaQuery.addEventListener?.('change', syncTouchMode);
    return () => mediaQuery.removeEventListener?.('change', syncTouchMode);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (bubbleRef.current?.contains(event.target)) return;
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !bubbleRef.current || typeof window === 'undefined') return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 12;
    const arrowSize = 10;
    const roomAbove = triggerRect.top;
    const roomBelow = viewportHeight - triggerRect.bottom;
    const nextPlacement =
      preferredPlacement === 'top'
        ? roomAbove >= bubbleRect.height + arrowSize + margin || roomAbove > roomBelow
          ? 'top'
          : 'bottom'
        : roomBelow >= bubbleRect.height + arrowSize + margin || roomBelow > roomAbove
          ? 'bottom'
          : 'top';

    const centeredLeft = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2;
    const clampedLeft = Math.min(
      viewportWidth - bubbleRect.width - margin,
      Math.max(margin, centeredLeft),
    );
    const top =
      nextPlacement === 'top'
        ? Math.max(margin, triggerRect.top - bubbleRect.height - arrowSize)
        : Math.min(viewportHeight - bubbleRect.height - margin, triggerRect.bottom + arrowSize);

    const arrowLeft = Math.min(
      bubbleRect.width - 18,
      Math.max(18, triggerRect.left + triggerRect.width / 2 - clampedLeft),
    );

    bubbleRef.current.dataset.placement = nextPlacement;
    bubbleRef.current.style.left = `${clampedLeft}px`;
    bubbleRef.current.style.top = `${top}px`;
    bubbleRef.current.style.setProperty('--tooltip-arrow-left', `${arrowLeft}px`);
  }, [open, preferredPlacement, content]);

  const handlePointerEnter = () => {
    if (!isTouchLike) setOpen(true);
  };

  const handlePointerLeave = () => {
    if (!isTouchLike) setOpen(false);
  };

  const handleClick = (event) => {
    if (!isTouchLike) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen((value) => !value);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen((value) => !value);
    }
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`tooltip-trigger ${open ? 'is-open' : ''} ${className}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-describedby={open ? 'app-tooltip' : undefined}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          if (!isTouchLike) setOpen(false);
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </span>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          id="app-tooltip"
          ref={bubbleRef}
          className="tooltip-bubble"
          data-placement={preferredPlacement}
          role="tooltip"
        >
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
