import React, { useEffect } from 'react';
import './Modal.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'status';
  contentType?: 'text' | 'logs' | 'preformatted';
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  contentType = 'text',
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'status':
        return '📊';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content${contentType === 'logs' ? ' modal-content-logs' : ''}${type === 'status' ? ' modal-content-status' : ''}${type === 'error' ? ' modal-content-error' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className={`modal-header modal-${type}`}>
          <div className="modal-icon">{getIcon()}</div>
          <h3 className="modal-title">{title}</h3>
          {showCloseButton && (
            <button className="modal-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="modal-body">
          {contentType === 'logs' ? (
            <pre className="modal-message modal-logs">{message}</pre>
          ) : contentType === 'preformatted' ? (
            <pre className="modal-message modal-preformatted">{message}</pre>
          ) : (
            <p className="modal-message">{message}</p>
          )}
        </div>
        <div className="modal-footer">
          {onConfirm ? (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button className="btn btn-primary" onClick={() => {
                onConfirm();
                onClose();
              }}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={onClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal; 