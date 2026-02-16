import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes, FaTrash, FaLeaf, FaSeedling, FaCannabis, FaCheck } from 'react-icons/fa';
import { Batch, BatchStage } from '../../types/rooms';
import { getGeneticColor } from '../../utils/geneticColors';
import { ConfirmationModal } from '../ConfirmationModal';

interface LivingSoilBatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    batch: Batch;
    onUpdateStage: (batch: Batch, newStage: BatchStage) => void;
    onDeleteBatch: (batch: Batch) => void;
    onSaveNotes: (batch: Batch, notes: string) => void;
}

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
`;

const Content = styled.div`
  background: white; padding: 2rem; border-radius: 1rem;
  width: 90%; max-width: 500px;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  position: relative;
`;

const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h2`
  font-size: 1.5rem; color: #2d3748; margin: 0;
  display: flex; align-items: center; gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: 1.5rem; color: #a0aec0; cursor: pointer;
  &:hover { color: #4a5568; }
`;

const StageButton = styled.button<{ active?: boolean, stageColor?: string }>`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid ${p => p.active ? p.stageColor : '#e2e8f0'};
  background: ${p => p.active ? p.stageColor : 'white'};
  color: ${p => p.active ? '#fff' : '#4a5568'};
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  transition: all 0.2s;
  opacity: ${p => p.active ? 1 : 0.7};

  &:hover {
    transform: translateY(-2px);
    opacity: 1;
    border-color: ${p => p.stageColor};
  }
`;

const StagesContainer = styled.div`
  display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex; justify-content: space-between; margin-bottom: 0.5rem;
  font-size: 0.9rem; color: #4a5568;
`;



const ActionRow = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;
`;

const DeleteButton = styled.button`
  background: white; border: 1px solid #feb2b2; color: #e53e3e;
  padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: bold;
  
  &:hover { background: #fff5f5; border-color: #fc8181; }
`;

const SaveButton = styled.button`
  background: #3182ce; color: white; border: none;
  padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;
  font-weight: bold;
  
  &:hover { background: #2b6cb0; }
`;

export const LivingSoilBatchModal: React.FC<LivingSoilBatchModalProps> = ({
    isOpen, onClose, batch, onUpdateStage, onDeleteBatch, onSaveNotes
}) => {
    const [notes, setNotes] = useState(batch.notes || '');
    const [loading, setLoading] = useState(false);
    const [pendingStage, setPendingStage] = useState<BatchStage | null>(null);

    if (!isOpen) return null;

    const geneticParams = getGeneticColor(batch.genetic?.name || batch.name);

    const handleStageClick = (stage: BatchStage) => {
        if (stage === batch.stage) return;
        setPendingStage(stage);
    };

    const handleConfirmStageChange = async () => {
        if (!pendingStage) return;
        setLoading(true);
        await onUpdateStage(batch, pendingStage);
        setLoading(false);
        setPendingStage(null);
    };

    const handleSave = async () => {
        setLoading(true);
        await onSaveNotes(batch, notes);
        setLoading(false);
        onClose();
    };

    const getStageConfirmMessage = (stage: BatchStage) => {
        switch (stage) {
            case 'flowering': return "¿Cambiar a etapa de floración?";
            case 'vegetation': return "¿Cambiar a etapa de vegetación?";
            case 'seedling': return "¿Cambiar a etapa de plántula?";
            case 'completed': return "¿Marcar como finalizado?";
            default: return `¿Cambiar etapa a ${stage}?`;
        }
    };

    return (
        <>
            <Overlay>
                <Content onClick={e => e.stopPropagation()}>
                    <Header>
                        <Title>
                            <span style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: geneticParams.bg, border: `1px solid ${geneticParams.border}`
                            }} />
                            {batch.genetic?.name || batch.name}
                        </Title>
                        <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                    </Header>

                    <InfoRow>
                        <span>Posición: <strong>{batch.grid_position}</strong></span>
                        <span>Código: <code>{batch.tracking_code}</code></span>
                    </InfoRow>

                    <h4 style={{ margin: '1rem 0 0.5rem' }}>Etapa Actual</h4>
                    <StagesContainer>
                        <StageButton
                            active={batch.stage === 'seedling'}
                            stageColor="#4299e1" // Blue
                            onClick={() => handleStageClick('seedling')}
                        >
                            <FaSeedling /> Plántula
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'vegetation'}
                            stageColor="#48bb78" // Green
                            onClick={() => handleStageClick('vegetation')}
                        >
                            <FaLeaf /> Vege
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'flowering'}
                            stageColor="#f56565" // Red
                            onClick={() => handleStageClick('flowering')}
                        >
                            <FaCannabis /> Flora
                        </StageButton>
                        <StageButton
                            active={batch.stage === 'completed'}
                            stageColor="#718096" // Grey
                            onClick={() => handleStageClick('completed')}
                        >
                            <FaCheck /> Fin
                        </StageButton>
                    </StagesContainer>

                    <h4 style={{ margin: '0 0 0.5rem' }}>Notas / Bitácora</h4>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Registrar eventos, altura, poda..."
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '0.25rem', fontStyle: 'italic', marginBottom: '1rem' }}>
                        (Elimina esta nota por completo para desactivar la alerta de observación)
                    </div>

                    <ActionRow>
                        <DeleteButton onClick={() => onDeleteBatch(batch)}>
                            <FaTrash /> Eliminar
                        </DeleteButton>
                        <SaveButton onClick={handleSave} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar y Cerrar'}
                        </SaveButton>
                    </ActionRow>

                </Content>
            </Overlay>

            <ConfirmationModal
                isOpen={!!pendingStage}
                title="Confirmar Cambio de Etapa"
                message={pendingStage ? getStageConfirmMessage(pendingStage) : ''}
                onConfirm={handleConfirmStageChange}
                onCancel={() => setPendingStage(null)}
                confirmText="Confirmar"
                cancelText="Cancelar"
            />
        </>
    );
};
