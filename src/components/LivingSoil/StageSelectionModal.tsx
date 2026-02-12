import React, { useState } from 'react';
import styled from 'styled-components';
import { BatchStage } from '../../types/rooms';
import { FaSeedling, FaLeaf, FaCannabis, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
  background: rgba(0, 0, 0, 0.5); z-index: 10001;
  display: flex; align-items: center; justify-content: center; 
  backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
  background: white; padding: 2rem; border-radius: 1rem; 
  width: 90%; max-width: 400px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h3`
  font-size: 1.25rem; color: #2d3748; margin-bottom: 1rem; text-align: center;
`;

const StageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StageOption = styled.button<{ $isActive: boolean, $color: string }>`
  background: ${p => p.$isActive ? p.$color : 'white'};
  color: ${p => p.$isActive ? 'white' : '#4a5568'};
  border: 2px solid ${p => p.$isActive ? p.$color : '#e2e8f0'};
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border-color: ${p => p.$color};
  }
`;

const Actions = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: ${p => p.$variant === 'secondary' ? '1px solid #cbd5e0' : 'none'};
  background: ${p => p.$variant === 'secondary' ? 'white' : '#3182ce'};
  color: ${p => p.$variant === 'secondary' ? '#4a5568' : 'white'};
  transition: all 0.2s;

  &:hover {
    filter: brightness(0.95);
  }
`;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (stage: BatchStage) => void;
    currentStage?: BatchStage;
    count: number;
}

const STAGES: { id: BatchStage, label: string, color: string, icon: React.ReactNode }[] = [
    { id: 'seedling', label: 'Plántula', color: '#3182ce', icon: <FaSeedling /> },
    { id: 'vegetation', label: 'Vegetación', color: '#2f855a', icon: <FaLeaf /> },
    { id: 'flowering', label: 'Floración', color: '#c53030', icon: <FaCannabis /> },
    { id: 'drying', label: 'Secado', color: '#ed8936', icon: <FaExclamationTriangle /> }, // Use exclam/diff icon
    { id: 'completed', label: 'Completado', color: '#4a5568', icon: <FaCheckCircle /> },
];

export const StageSelectionModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, currentStage, count }) => {
    const [selectedStage, setSelectedStage] = useState<BatchStage | null>(null);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedStage) {
            onConfirm(selectedStage);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Title>Cambiar Fase ({count} Lotes)</Title>
                <StageGrid>
                    {STAGES.map(s => (
                        <StageOption
                            key={s.id}
                            $isActive={selectedStage === s.id}
                            $color={s.color}
                            onClick={() => setSelectedStage(s.id)}
                            disabled={s.id === currentStage} // Optional: disable current stage?
                            style={s.id === currentStage ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                            {s.label}
                        </StageOption>
                    ))}
                </StageGrid>

                <Actions>
                    <Button $variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={!selectedStage}>
                        Confirmar Cambio
                    </Button>
                </Actions>
            </ModalContent>
        </ModalOverlay>
    );
};
