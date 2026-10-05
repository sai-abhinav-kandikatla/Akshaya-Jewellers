'use client';

import React, { useEffect, useId } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  details?: {
    code?: string;
    customerName?: string;
    value?: string | number;
    date?: string;
  };
  children?: React.ReactNode;
  primaryButtonText: string;
  primaryButtonAction: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  isLoading?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  details,
  children,
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
  isLoading = false,
}: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bottom-sheet-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isLoading) onClose();
    }}>
      <section className="bottom-sheet-panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="bottom-sheet-handle" aria-hidden="true" />
        <h2 id={titleId}>{title}</h2>
        <p className="bottom-sheet-description">{description}</p>

        {details && (
          <div className="bottom-sheet-details">
            <div className="bottom-sheet-details-main">
              {details.code && <span className="bottom-sheet-details-code">{details.code}</span>}
              {details.customerName && <span className="bottom-sheet-details-customer">{details.customerName}</span>}
            </div>
            <div className="bottom-sheet-details-value">
              {details.value !== undefined && <span className="bottom-sheet-details-amount">{details.value}</span>}
              {details.date && <span className="bottom-sheet-details-date">{details.date}</span>}
            </div>
          </div>
        )}

        {children && <div className="bottom-sheet-content">{children}</div>}

        <div className="bottom-sheet-actions">
          {secondaryButtonText && (
            <button
              type="button"
              className="bottom-sheet-secondary"
              onClick={secondaryButtonAction || onClose}
              disabled={isLoading}
            >
              {secondaryButtonText}
            </button>
          )}
          <button
            type="button"
            className="bottom-sheet-primary"
            onClick={primaryButtonAction}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : primaryButtonText}
          </button>
        </div>
      </section>
    </div>
  );
}
