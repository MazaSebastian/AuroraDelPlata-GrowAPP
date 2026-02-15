import React, { useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const Overlay = styled.div<{ $animate: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  backdrop-filter: blur(4px);
  animation: ${p => p.$animate ? css`${fadeIn} 0.2s ease-out` : 'none'};
`;

const Content = styled.div`
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 380px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${scaleIn} 0.2s ease-out;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconWrapper = styled.div<{ type: 'success' | 'error' | 'info' }>`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${p => p.type === 'success' ? '#48bb78' : p.type === 'error' ? '#e53e3e' : '#3182ce'};
`;

const Message = styled.p`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const Button = styled.button<{ type: 'success' | 'error' | 'info' }>`
  background: ${p => p.type === 'success' ? '#48bb78' : p.type === 'error' ? '#e53e3e' : '#3182ce'};
  color: white;
  border: none;
  padding: 0.6rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover {
    transform: translateY(-1px);
    filter: brightness(110%);
  }
`;

interface ToastModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  animateOverlay?: boolean;
}

export const ToastModal: React.FC<ToastModalProps> = ({
  isOpen,
  message,
  onClose,
  type = 'info',
  animateOverlay = true
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose} $animate={animateOverlay}>
      <Content onClick={e => e.stopPropagation()}>
        <IconWrapper type={type}>
          {type === 'success' && <FaCheckCircle />}
          {type === 'error' && <FaExclamationCircle />}
          {type === 'info' && <FaInfoCircle />}
        </IconWrapper>
        <Message>{message}</Message>
        <Button onClick={onClose} type={type}>
          Aceptar
        </Button>
      </Content>
    </Overlay>
  );
};

export default ToastModal;
