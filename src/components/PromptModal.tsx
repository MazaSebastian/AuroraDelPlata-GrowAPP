import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;

const Overlay = styled.div<{ isClosing: boolean }>`
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
  animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const Content = styled.div<{ isClosing: boolean }>`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;

  h3 {
    margin-top: 0;
    color: #2d3748;
    margin-bottom: 1rem;
    font-size: 1.25rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #38b2ac;
    box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'green' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.variant === 'secondary' ? '#e2e8f0' : 'transparent'};
  background: ${p => {
    if (p.variant === 'secondary') return 'white';
    if (p.variant === 'green') return '#38a169';
    return '#3182ce';
  }};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => {
    if (p.variant === 'secondary') return '#f7fafc';
    if (p.variant === 'green') return '#2f855a';
    return '#2b6cb0';
  }};
  }
`;

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  confirmButtonColor?: 'primary' | 'green';
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  initialValue = '',
  placeholder = '',
  onClose,
  onConfirm,
  confirmButtonColor = 'primary'
}) => {
  const [value, setValue] = useState(initialValue);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setIsVisible(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialValue]);

  if (!isVisible && !isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
    handleClose(); // Close with animation on confirm too
  };

  return (
    <Overlay isClosing={isClosing}>
      <Content isClosing={isClosing}>
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
          <ButtonGroup>
            <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" variant={confirmButtonColor}>Guardar</Button>
          </ButtonGroup>
        </form>
      </Content>
    </Overlay>
  );
};
