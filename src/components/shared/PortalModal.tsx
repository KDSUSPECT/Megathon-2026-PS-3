import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalModalProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  backdropClassName?: string;
  id?: string;
}

export const PortalModal: React.FC<PortalModalProps> = ({
  children,
  onClose,
  className = '',
  backdropClassName = '',
  id,
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return createPortal(
    <div
      id={id || 'portal-modal-overlay'}
      className={`fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto modal-backdrop-overlay ${backdropClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div className={`relative max-w-full ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};
