'use client';

import React from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  confirmationValue?: string;
  confirmationLabel?: string;
  confirmationPlaceholder?: string;
  confirmationInput?: string;
  onConfirmationInputChange?: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  confirmationValue,
  confirmationLabel,
  confirmationPlaceholder,
  confirmationInput = '',
  onConfirmationInputChange,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const requiresConfirmation = typeof confirmationValue === 'string';
  const isConfirmed = !requiresConfirmation || confirmationInput === confirmationValue;

  return (
    <div className="app-dialog-backdrop" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        className="app-dialog card fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 id="app-dialog-title" style={{ fontSize: 20, fontWeight: 700 }}>
            {title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>
        </div>

        {requiresConfirmation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              {confirmationLabel || `Type ${confirmationValue} to continue`}
            </label>
            <input
              className="input"
              value={confirmationInput}
              onChange={(event) => onConfirmationInputChange?.(event.target.value)}
              placeholder={confirmationPlaceholder || confirmationValue}
              autoFocus
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy || !isConfirmed}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
