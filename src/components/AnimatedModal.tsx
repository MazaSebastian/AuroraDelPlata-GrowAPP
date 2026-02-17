import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export const ModalOverlay = styled.div<{ $visible?: boolean }>`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
  opacity: ${p => p.$visible ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  pointer-events: ${p => p.$visible ? 'auto' : 'none'};
`;

export const ModalContent = styled.div<{ $visible?: boolean; wide?: boolean }>`
  background: white; padding: 2rem; border-radius: 1rem; width: 90%; 
  max-width: ${props => props.wide ? '900px' : '500px'};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  transform: ${p => p.$visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'};
  opacity: ${p => p.$visible ? 1 : 0};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 85vh;
  overflow-y: auto;
`;

export const CloseIcon = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    font-size: 1.25rem;
    &:hover { color: #4a5568; }
`;

interface AnimatedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ isOpen, onClose, children, wide }) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <ModalOverlay $visible={isVisible} onClick={onClose}>
            <ModalContent $visible={isVisible} wide={wide} onClick={e => e.stopPropagation()}>
                {children}
            </ModalContent>
        </ModalOverlay>
    );
};
