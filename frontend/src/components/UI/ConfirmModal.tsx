import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
      showCloseButton={!isLoading}
    >
      <div className="confirm-modal-content">
        <div className="confirm-modal-message">
          {message}
        </div>
        
        <div className="confirm-modal-actions">
          <button
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`btn btn-${variant === 'danger' ? 'error' : 'warning'}`}
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
        </div>
      </div>
    </Modal>
  );
};
