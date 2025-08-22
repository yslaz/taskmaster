import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`modal ${sizeClasses[size]}`}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="btn btn-secondary btn-sm"
                aria-label="Close modal"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  // Render modal in portal to avoid z-index issues
  return createPortal(modalContent, document.body);
};

// Modal with footer
interface ModalWithFooterProps extends ModalProps {
  footer?: React.ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: 'primary' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
}

export const ModalWithFooter: React.FC<ModalWithFooterProps> = ({
  footer,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  isLoading = false,
  children,
  ...modalProps
}) => {
  const defaultFooter = (
    <div className="modal-footer">
      {onCancel && (
        <button
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          {cancelText}
        </button>
      )}
      {onConfirm && (
        <button
          onClick={onConfirm}
          className={`btn btn-${confirmVariant}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner mr-2"></span>
              Loading...
            </>
          ) : (
            confirmText
          )}
        </button>
      )}
    </div>
  );

  return (
    <Modal {...modalProps}>
      {children}
      {footer || defaultFooter}
    </Modal>
  );
};