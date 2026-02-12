import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Batch, Room } from '../../types/rooms';
import { FaTimes, FaCut, FaCheck } from 'react-icons/fa';

interface HarvestModalProps {
    isOpen: boolean;
    onClose: () => void;
    batches: Batch[]; // Batches in the current room
    rooms: Room[]; // Available rooms to potentially move to (Drying)
    onConfirm: (selectedBatchIds: string[], targetRoomId?: string) => Promise<void>;
    overrideGroupName?: string;
}

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
`;

const Content = styled.div`
  background: white; padding: 0; border-radius: 1rem;
  width: 90%; max-width: 600px; max-height: 85vh;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
`;

const Title = styled.h2`
  margin: 0; font-size: 1.25rem; color: #2d3748;
  display: flex; align-items: center; gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none; border: none; color: #a0aec0; cursor: pointer;
  font-size: 1.25rem; transition: color 0.2s;
  &:hover { color: #e53e3e; }
`;

const Body = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const Footer = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  display: flex; justify-content: flex-end; gap: 1rem;
  border-radius: 0 0 1rem 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: ${p => p.$variant === 'secondary' ? '1px solid #cbd5e0' : 'none'};
  background: ${p => p.$variant === 'primary' ? '#48bb78' : p.$variant === 'danger' ? '#e53e3e' : 'white'};
  color: ${p => p.$variant === 'secondary' ? '#4a5568' : 'white'};
  transition: all 0.2s;

  &:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6; cursor: not-allowed; transform: none;
  }
`;

const BatchList = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem;
`;

const GeneticGroup = styled.div`
  margin-bottom: 1rem;
`;

const GroupHeader = styled.div`
  font-weight: 700; color: #4a5568; margin-bottom: 0.5rem;
  display: flex; align-items: center; justify-content: space-between;
  background: #edf2f7; padding: 0.5rem; border-radius: 0.5rem;
`;

const BatchItem = styled.div<{ $selected: boolean }>`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem;
  background: ${p => p.$selected ? '#f0fff4' : 'white'};
  border: 1px solid ${p => p.$selected ? '#48bb78' : '#e2e8f0'};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #48bb78;
  }
`;

const Checkbox = styled.div<{ $checked: boolean }>`
  width: 20px; height: 20px;
  border: 2px solid ${p => p.$checked ? '#48bb78' : '#cbd5e0'};
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$checked ? '#48bb78' : 'white'};
  color: white; font-size: 0.8rem;
`;

const Select = styled.select`
  width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem;
  margin-bottom: 1.5rem; font-size: 1rem;
`;

export const HarvestModal: React.FC<HarvestModalProps> = ({ isOpen, onClose, batches, rooms, onConfirm, overrideGroupName }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [targetRoomId, setTargetRoomId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // Initial Selection (Select All by default?)
    // Let's start with empty or all? Usually harvest is selective or full. Let's default to ALL.
    React.useEffect(() => {
        if (isOpen && batches.length > 0) {
            setSelectedIds(new Set(batches.map(b => b.id)));
        }
    }, [isOpen, batches]);

    // Filter Drying Rooms
    const dryingRooms = useMemo(() => {
        return rooms.filter(r => ['drying', 'secado'].includes((r.type || '').toLowerCase()));
    }, [rooms]);

    // Group batches by Lote (Parent Batch) -> Genetic
    const groupedBatches = useMemo(() => {
        const groups: Record<string, Batch[]> = {};
        batches.forEach(b => {
            // 1. Check for Override (Map Context)
            if (overrideGroupName) {
                if (!groups[overrideGroupName]) groups[overrideGroupName] = [];
                groups[overrideGroupName].push(b);
                return;
            }

            // 2. Check for Custom Group [Grupo: X]
            const groupMatch = b.notes?.match(/\[Grupo:\s*(.*?)\]/);
            const customGroupName = groupMatch ? groupMatch[1].trim() : null;

            // 3. Use custom group name if available, otherwise parent_batch name, otherwise fallback to Genetic
            const loteName = customGroupName || b.parent_batch?.name || `Lote ${b.genetic?.name || 'Desconocido'}`;

            // Key: Just the Lote Name (User wants to group by Lote, ignoring genetic split if same lote)
            const groupKey = loteName;

            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(b);
        });
        return groups;
    }, [batches, overrideGroupName]);

    const toggleBatch = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroup = (batchIds: string[]) => {
        // If all selected, deselect all. Otherwise select all.
        const allSelected = batchIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            batchIds.forEach(id => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const handleConfirm = async () => {
        if (selectedIds.size === 0) return;
        setLoading(true);
        try {
            await onConfirm(Array.from(selectedIds), targetRoomId || undefined);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Overlay>
            <Content>
                <Header>
                    <Title><FaCut /> Cosechar Plantas</Title>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                </Header>
                <Body>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', color: '#4a5568' }}>
                        Sala de Destino (Secado) <span style={{ fontWeight: 'normal', color: '#718096' }}>(Opcional)</span>
                    </label>
                    <Select value={targetRoomId} onChange={e => setTargetRoomId(e.target.value)}>
                        <option value="">-- Mantener en sala actual (Solo cambiar estado) --</option>
                        {dryingRooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name} (Capacidad: {r.capacity})</option>
                        ))}
                    </Select>

                    <div style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#2d3748' }}>
                        Seleccionadas: {selectedIds.size} de {batches.length}
                    </div>

                    <BatchList>
                        {Object.entries(groupedBatches).map(([genName, groupBatches]) => {
                            const groupIds = groupBatches.map(b => b.id);
                            const allSelected = groupIds.every(id => selectedIds.has(id));
                            const someSelected = groupIds.some(id => selectedIds.has(id));

                            return (
                                <GeneticGroup key={genName}>
                                    <GroupHeader onClick={() => toggleGroup(groupIds)} style={{ cursor: 'pointer' }}>
                                        <span>{genName} ({groupBatches.length})</span>
                                        <Checkbox $checked={allSelected}>
                                            {allSelected && <FaCheck />}
                                            {!allSelected && someSelected && <div style={{ width: 8, height: 2, background: 'white' }} />}
                                        </Checkbox>
                                    </GroupHeader>
                                    <div style={{ paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {groupBatches.map(batch => (
                                            <BatchItem
                                                key={batch.id}
                                                $selected={selectedIds.has(batch.id)}
                                                onClick={() => toggleBatch(batch.id)}
                                            >
                                                <Checkbox $checked={selectedIds.has(batch.id)}>
                                                    <FaCheck />
                                                </Checkbox>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#2d3748' }}>
                                                        {batch.tracking_code || batch.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                                                        {batch.quantity} plantas • Etapa: {batch.stage}
                                                    </div>
                                                </div>
                                            </BatchItem>
                                        ))}
                                    </div>
                                </GeneticGroup>
                            );
                        })}
                    </BatchList>
                </Body>
                <Footer>
                    <Button $variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button $variant="primary" onClick={handleConfirm} disabled={loading || selectedIds.size === 0}>
                        {loading ? 'Procesando...' : `Confirmar Cosecha (${selectedIds.size})`}
                    </Button>
                </Footer>
            </Content>
        </Overlay>
    );
};
