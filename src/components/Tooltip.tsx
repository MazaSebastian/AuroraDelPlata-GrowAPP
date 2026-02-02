import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

const TooltipWrapper = styled.div`
  display: inline-block;
  cursor: pointer;
`;

const PortalContainer = styled.div<{ top: number; left: number }>`
  position: fixed;
  top: ${p => p.top}px;
  left: ${p => p.left}px;
  transform: translateX(-50%) translateY(-100%);
  margin-top: -8px; 
  padding: 0.5rem 0.75rem;
  background-color: #2d3748;
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 0.375rem;
  white-space: nowrap;
  z-index: 9999;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  animation: fadeIn 0.2s forwards;

  /* Arrow */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #2d3748 transparent transparent transparent;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-100%);
    }
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-95%); 
    }
  }
`;

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top, // Position above the element
        left: rect.left + rect.width / 2 // Center horizontally
      });
      setIsVisible(true);
    }
  };

  return (
    <>
      <TooltipWrapper
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </TooltipWrapper>
      {isVisible && createPortal(
        <PortalContainer top={coords.top} left={coords.left}>
          {text}
        </PortalContainer>,
        document.body
      )}
    </>
  );
};
