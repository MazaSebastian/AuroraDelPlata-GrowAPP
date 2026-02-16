import React from 'react';
import styled, { keyframes } from 'styled-components';



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
  background: #f8fafc; /* Match app background for seamless look */
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  min-height: 200px;
`;

const filling = keyframes`
  0% { clip-path: inset(100% 0 0 0); }
  100% { clip-path: inset(0 0 0 0); }
`;

const SpinnerContainer = styled.div`
  position: relative;
  width: 150px; /* Increased size */
  height: 150px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const BaseImage = styled.img`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.3;
  filter: grayscale(100%);
  mix-blend-mode: multiply; /* Ensure white bg is transparent */
`;

const FillImage = styled.img<{ $duration: number }>`
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: ${filling} ${p => p.$duration}ms linear forwards;
  mix-blend-mode: multiply; /* Ensure white bg is transparent */
`;

const LoadingText = styled.h3`
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.05em;
  opacity: 0.8;
  animation: ${pulse} 2s ease-in-out infinite;
`;

interface LoadingSpinnerProps {
  text?: string;
  fullScreen?: boolean;
  duration?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Cargando...',
  fullScreen = false,
  duration = 2000
}) => {
  return (
    <Overlay $fullScreen={fullScreen}>
      <SpinnerContainer>
        {/* Base semi-transparent logo */}
        <BaseImage src="/LOGOAPIDCARGA.png" alt="Cargando base" />
        {/* Animated filling logo */}
        <FillImage src="/LOGOAPIDCARGA.png" alt="Cargando fill" $duration={duration} />
      </SpinnerContainer>
      <LoadingText>{text}</LoadingText>
    </Overlay>
  );
};
