
import React from 'react';
import styled from 'styled-components';
import { FaTimes, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { Batch } from '../types/rooms';

interface GroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  batches: Batch[];
  onDeleteBatch: (batch: Batch, quantityToDiscard: number) => void;
}

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
`;

const Content = styled.div`
  background: white; padding: 2rem; border-radius: 1rem;
  width: 90%; max-width: 600px; max-height: 80vh;
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
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: 1.5rem; color: #a0aec0; cursor: pointer;
  &:hover { color: #4a5568; }
`;

const List = styled.div`
  flex: 1; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const BatchItem = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem;
  background: #f7fafc;
  border: 1px solid #edf2f7;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #edf2f7;
    border-color: #e2e8f0;
  }
`;

const BatchInfo = styled.div`
  display: flex; flex-direction: column;
`;

const BatchName = styled.span`
  font-weight: bold; color: #2d3748; font-size: 1rem;
`;

const BatchMeta = styled.span`
  color: #718096; font-size: 0.85rem;
`;

const DeleteButton = styled.button`
  background: white; border: 1px solid #feb2b2; color: #e53e3e;
  padding: 0.5rem; border-radius: 0.25rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #fff5f5;
    border-color: #fc8181;
  }
`;

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({ isOpen, onClose, groupName, batches, onDeleteBatch }) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Content onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Detalle del Grupo: {groupName}</Title>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </Header>

        <div style={{ marginBottom: '1rem', color: '#718096' }}>
          Total de plantas: <strong>{batches.reduce((sum, b) => sum + b.quantity, 0)}</strong> en {batches.length} lotes.
        </div>

        <List>
          {batches.map(batch => (
            <BatchItem key={batch.id}>
              <BatchInfo>
                <BatchName>{batch.quantity}x {batch.genetic?.name || 'Desconocida'}</BatchName>
                <BatchMeta>Código: {batch.tracking_code || 'N/A'} • {batch.current_room_id ? 'En sala' : 'Sin sala'}</BatchMeta>
              </BatchInfo>
              <DeleteButton onClick={() => {
                if (batch.quantity > 1) {
                  const qtyStr = window.prompt(`¿Cuántas unidades deseas descartar de ${batch.genetic?.name || 'este lote'}? (Máx: ${batch.quantity})`, String(batch.quantity));
                  if (qtyStr === null) return; // Cancelled
                  const qty = parseInt(qtyStr, 10);
                  if (isNaN(qty) || qty <= 0 || qty > batch.quantity) {
                    alert("Cantidad inválida");
                    return;
                  }
                  onDeleteBatch(batch, qty);
                } else {
                  onDeleteBatch(batch, 1);
                }
              }} title="Descartar Lote">
                <FaTrash />
              </DeleteButton>
            </BatchItem>
          ))}
          {batches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
              <FaExclamationTriangle style={{ fontSize: '2rem', marginBottom: '0.5rem' }} />
              <p>No hay lotes en este grupo.</p>
            </div>
          )}
        </List>
      </Content>
    </Overlay>
  );
};
