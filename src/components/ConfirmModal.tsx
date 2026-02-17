import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

const Overlay = styled.div<{ $visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  opacity: ${p => p.$visible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
`;

const Content = styled.div<{ $visible: boolean }>`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
  transform: ${p => p.$visible ? 'scale(1)' : 'scale(0.95)'};
  opacity: ${p => p.$visible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  h3 {
    margin-top: 1rem;
    color: #2d3748;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
  }

  p {
    color: #718096;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
`;

const IconWrapper = styled.div`
  width: 50px;
  height: 50px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 0.6rem 1.2rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.variant === 'secondary' ? '#e2e8f0' : 'transparent'};
  background: ${p => p.variant === 'secondary' ? 'white' : p.variant === 'danger' ? '#e53e3e' : '#3182ce'};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;

  &:hover {
    background: ${p => p.variant === 'secondary' ? '#f7fafc' : p.variant === 'danger' ? '#c53030' : '#2b6cb0'};
    transform: translateY(-1px);
  }
`;

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  isLoading = false
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to allow render before transition
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
      // Wait for transition to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, isLoading]);

  if (!shouldRender) return null;

  return (
    <Overlay $visible={isVisible} onClick={onClose}>
      <Content $visible={isVisible} onClick={e => e.stopPropagation()}>
        <IconWrapper>
          <FaExclamationTriangle />
        </IconWrapper>
        <h3>{title}</h3>
        <p>{message}</p>
        <ButtonGroup>
          <Button onClick={onClose} variant="secondary" disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={isDanger ? 'danger' : 'primary'}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </Button>
        </ButtonGroup>
      </Content>
    </Overlay>
  );
};
