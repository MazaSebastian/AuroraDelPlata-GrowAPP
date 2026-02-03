import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0.6; transform: scale(0.98); }
`;

const Overlay = styled.div<{ $fullScreen?: boolean }>`
  position: ${props => props.$fullScreen ? 'fixed' : 'absolute'};
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  min-height: 200px;
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 1.5rem;
`;

const Circle = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid #e2e8f0;
  border-top-color: #38a169;
  border-radius: 50%;
  animation: ${spin} 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
`;

const LoadingText = styled.h3`
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.025em;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Cargando...',
  fullScreen = false
}) => {
  return (
    <Overlay $fullScreen={fullScreen}>
      <SpinnerContainer>
        <Circle />
      </SpinnerContainer>
      <LoadingText>{text}</LoadingText>
    </Overlay>
  );
};
