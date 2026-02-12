import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Room, Batch, CloneMap } from '../../types/rooms';
import { FaExchangeAlt, FaArrowRight, FaSeedling, FaMap, FaBoxOpen, FaPlus, FaTrash, FaCheckSquare, FaRegSquare, FaPrint } from 'react-icons/fa';


import { EsquejeraGrid } from './EsquejeraGrid';
import { PrintableBatchLabels } from './PrintableBatchLabels'; // Import the new component
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import ToastModal from '../ToastModal';

interface TransplantModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRoom: Room;
    rooms: Room[];
    cloneMaps: CloneMap[];
    onConfirm: (destinationRoomId: string, selectedBatchIds: string[], groups?: { name: string, batchIds: string[] }[]) => Promise<void>;
    initialMapId?: string;
    initialSelectedBatchIds?: string[];
}

// Styled Components (Existing + New)
const Overlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(2px);
`;

const Content = styled.div`
  background: white; padding: 0; border-radius: 1rem;
  width: 95%; max-width: 1100px; height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem 0 2rem;
  flex-shrink: 0;
`;

const ModalBody = styled.div`
  padding: 1rem 2rem;
  flex: 1;
  min-height: 0; /* Critical for scrolling */
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 1.5rem 2rem;
  flex-shrink: 0;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: #f7fafc;
`;

const Title = styled.h2`
  font-size: 1.5rem; color: #2d3748; margin-bottom: 1rem;
  display: flex; align-items: center; gap: 0.5rem;
`;

const Section = styled.div` margin-bottom: 1.5rem; `;
const Label = styled.label` display: block; font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; `;
const Select = styled.select` width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 1rem; color: #2d3748; background: white; `;

const TabContainer = styled.div` display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; `;
const Tab = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem; background: ${p => p.$active ? 'white' : '#f7fafc'};
  border: 1px solid #e2e8f0; border-bottom: ${p => p.$active ? '1px solid white' : '1px solid #e2e8f0'};
  border-radius: 0.5rem 0.5rem 0 0; margin-bottom: -1px;
  color: ${p => p.$active ? '#3182ce' : '#718096'}; font-weight: ${p => p.$active ? 'bold' : 'normal'};
  cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
  &:hover { background: white; color: ${p => p.$active ? '#3182ce' : '#4a5568'}; }
`;

const StepIndicator = styled.div`
  display: flex; gap: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem;
`;
const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  font-weight: bold; color: ${p => p.$active ? '#3182ce' : p.$completed ? '#48bb78' : '#cbd5e0'};
  display: flex; align-items: center; gap: 0.5rem;
`;

const TextActionButton = styled.button`
  background: none;
  border: none;
  color: #3182ce;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background: #ebf8ff;
    color: #2b6cb0;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;
  border: ${p => p.$variant === 'secondary' ? '1px solid #cbd5e0' : 'none'};
  background: ${p => p.$variant === 'secondary' ? 'white' : '#3182ce'};
  color: ${p => p.$variant === 'secondary' ? '#4a5568' : 'white'};
  &:hover { filter: brightness(0.95); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

// Drag & Drop Components
const DraggableItem = ({ id, children }: { id: string, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 } : undefined;
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

const DroppableContainer = ({ id, children, isOver }: { id: string, children: React.ReactNode, isOver?: boolean }) => {
    const { setNodeRef, isOver: activeIsOver } = useDroppable({ id });
    return (
        <div ref={setNodeRef} style={{
            background: (isOver || activeIsOver) ? '#ebf8ff' : '#f7fafc',
            border: `2px dashed ${(isOver || activeIsOver) ? '#3182ce' : '#cbd5e0'}`,
            borderRadius: '0.5rem', padding: '1rem', minHeight: '100px', transition: 'all 0.2s'
        }}>
            {children}
        </div>
    );
};



export const TransplantModal: React.FC<TransplantModalProps> = ({ isOpen, onClose, currentRoom, rooms, cloneMaps, onConfirm, initialMapId, initialSelectedBatchIds = [] }) => {
    const [step, setStep] = useState(1); // 1: Selection, 2: Grouping
    const [destinationId, setDestinationId] = useState('');
    const [loading, setLoading] = useState(false);

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Step 1: Selection
    const [activeMapId, setActiveMapId] = useState<string | null>(initialMapId || null);
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set(initialSelectedBatchIds));

    // Sync state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            if (initialMapId) setActiveMapId(initialMapId);
            if (initialSelectedBatchIds) setSelectedBatchIds(new Set(initialSelectedBatchIds));
            setStep(1); // Reset to first step
            setGroups([]);
            setSingles([]);
        }
    }, [isOpen, initialMapId, initialSelectedBatchIds]);

    // Step 2: Grouping (Organization)
    const [groups, setGroups] = useState<{ id: string, name: string, batchIds: string[] }[]>([]);
    const [singles, setSingles] = useState<string[]>([]);
    const [organizeSelection, setOrganizeSelection] = useState<Set<string>>(new Set());

    // Selection Box State
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
    const singlesContainerRef = React.useRef<HTMLDivElement>(null);

    // Print State
    const [printingGroup, setPrintingGroup] = useState<{ id: string, name: string, batchIds: string[] } | null>(null);

    const handlePrintLabels = (group: { id: string, name: string, batchIds: string[] }) => {
        setPrintingGroup(group);
        // Allow render to update before printing
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Initialize Active Map
    useEffect(() => {
        if (cloneMaps.length > 0 && !activeMapId) setActiveMapId(cloneMaps[0].id);
    }, [cloneMaps]);

    // Filter suitable rooms based on current room type
    const targetRooms = rooms.filter(r => {
        if (r.id === currentRoom.id) return false;

        const type = (currentRoom.type || '').toLowerCase();

        // Allow moving to Vegetation or Flowering
        if (['clones', 'esquejera', 'vegetation', 'vegetación'].includes(type)) {
            return r.type === 'vegetation' || r.type === 'flowering';
        }

        // Default fallback (e.g. from General room)
        return r.type === 'vegetation' || r.type === 'flowering';
    });

    // Group by Crop (Spot)
    const roomsByCrop = targetRooms.reduce((acc, room) => {
        const cropName = room.spot?.name || 'Otro / Sin Cultivo';
        if (!acc[cropName]) acc[cropName] = [];
        acc[cropName].push(room);
        return acc;
    }, {} as Record<string, Room[]>);

    const handleBatchClick = (batch: Batch | null) => {
        if (!batch) return;
        setSelectedBatchIds(prev => {
            const next = new Set(prev);
            if (next.has(batch.id)) next.delete(batch.id);
            else next.add(batch.id);
            return next;
        });
    };

    const handleSelectAll = (mapId: string) => {
        const map = cloneMaps.find(m => m.id === mapId);
        if (!map) return;

        const mapBatches = currentRoom.batches?.filter(b => b.clone_map_id === map.id) || [];
        const mapBatchIds = mapBatches.map(b => b.id);

        // Check if all valid batches in this map are already selected
        const allSelected = mapBatchIds.length > 0 && mapBatchIds.every(id => selectedBatchIds.has(id));

        setSelectedBatchIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                // Deselect all from this map
                mapBatchIds.forEach(id => next.delete(id));
            } else {
                // Select all from this map
                mapBatchIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleNextStep = () => {
        if (!destinationId) { showToast("Selecciona una sala de destino", 'error'); return; }
        if (selectedBatchIds.size === 0) { showToast("Selecciona al menos un esqueje", 'error'); return; }

        // Initialize Grouping State
        setSingles(Array.from(selectedBatchIds));
        setGroups([]);
        setStep(2);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Transform internal groups structure for parent
            const groupsPayload = groups.map(g => ({ name: g.name, batchIds: g.batchIds }));
            await onConfirm(destinationId, singles, groupsPayload);
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Error al realizar el transplante", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizeClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent drag start interference if any
        setOrganizeSelection(prev => {
            const next = new Set(prev);
            if (e.ctrlKey || e.metaKey) {
                // Toggle
                if (next.has(id)) next.delete(id);
                else next.add(id);
            } else {
                // Exclusive select (unless already selected and dragging - handled by DND?)
                // Simple click usually selects just one.
                next.clear();
                next.add(id);
            }
            return next;
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const targetId = over.id as string;

        // Determine items to move
        let itemsToMove: string[] = [activeId];

        // If dragging a selected item, move ALL selected items
        if (organizeSelection.has(activeId)) {
            itemsToMove = Array.from(organizeSelection);
        }

        // Helper to remove items from any source
        const removeItemsFromSource = (items: string[]) => {
            const itemSet = new Set(items);
            setSingles(prev => prev.filter(id => !itemSet.has(id)));
            setGroups(prev => prev.map(g => ({
                ...g,
                batchIds: g.batchIds.filter(id => !itemSet.has(id))
            })));
        };

        if (targetId === 'singles') {
            removeItemsFromSource(itemsToMove);
            setSingles(prev => [...prev, ...itemsToMove]);
        } else if (targetId.startsWith('group-')) {
            const groupId = targetId.replace('group-', '');
            removeItemsFromSource(itemsToMove);
            setGroups(prev => prev.map(g =>
                g.id === groupId ? { ...g, batchIds: [...g.batchIds, ...itemsToMove] } : g
            ));
        }

        // Clear selection after move? Optional but often expected.
        setOrganizeSelection(new Set());
    };

    // Selection Box Logic
    useEffect(() => {
        if (!selectionBox) return;

        const handleMouseMove = (e: MouseEvent) => {
            setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        };

        const handleMouseUp = () => {
            if (selectionBox && singlesContainerRef.current) {
                // Finalize selection logic could be here if we wanted "select on mouse up",
                // but usually "live selection" is better.
                // We perform the final calculation here just to be sure, or rely on live updates.
                // For performance, let's do live updates in a separate effect or throttled.
                // Actually, let's calculate intersection on mouse up to avoid lag?
                // No, users expect visual feedback.

                // Let's do the intersection calculation HERE to ensure final state is correct.
                calculateSelection(selectionBox.startX, selectionBox.startY, selectionBox.currentX, selectionBox.currentY, false);
            }
            setSelectionBox(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectionBox]); // Dependency on selectionBox existence

    // Live Selection Calculation (Throttled ideally, but simple for now)
    useEffect(() => {
        if (!selectionBox) return;
        calculateSelection(selectionBox.startX, selectionBox.startY, selectionBox.currentX, selectionBox.currentY, true);
    }, [selectionBox?.currentX, selectionBox?.currentY]);


    const calculateSelection = (startX: number, startY: number, currentX: number, currentY: number, isLive: boolean) => {
        if (!singlesContainerRef.current) return;

        const boxRect = {
            left: Math.min(startX, currentX),
            top: Math.min(startY, currentY),
            right: Math.max(startX, currentX),
            bottom: Math.max(startY, currentY)
        };

        // If box is too small, ignore (prevents accidental clears on click)
        if (Math.abs(currentX - startX) < 5 && Math.abs(currentY - startY) < 5) return;

        const items = singlesContainerRef.current.querySelectorAll('[data-draggable-id]');
        const newSelection = new Set(organizeSelection);

        // If not holding Ctrl/Shift, maybe clear first? 
        // Classic desktop: separate click vs drag. 
        // If I start dragging on empty space, usually it selects NEW items.
        // Let's assume additive for now or implementing a "SelectionMode" state (replace vs add).
        // Let's implement active selection = (Previous Selection) U (Items in Box)
        // BUT wait, standard behavior is:
        // Click on background -> Clear selection based.
        // Drag -> Select items in box.

        // Complex: We need to know what was selected BEFORE the drag started if we want "Add to selection".
        // For simplicity: Dragging on background CLEARS previous selection and selects ONLY what is in box (unless Ctrl is held).

        // We can't easily implement "Ctrl key held" check inside useEffect without tracking key state or passing it.
        // Let's simplify: Dragging box ADDS to selection.

        // Better:
        // On MouseDown: If not Ctrl, clear selection.

        items.forEach((item) => {
            const rect = item.getBoundingClientRect();
            // Intersection Check
            const intersects = !(rect.right < boxRect.left ||
                rect.left > boxRect.right ||
                rect.bottom < boxRect.top ||
                rect.top > boxRect.bottom);

            const id = item.getAttribute('data-draggable-id');
            if (id) {
                if (intersects) {
                    newSelection.add(id);
                } else if (!isLive) {
                    // If we want "Select ONLY what is in box", we remove if not intersecting?
                    // No, that's tricky if we are adding.
                    // Let's stick to "Add to selection" for this iteration.
                }
            }
        });

        setOrganizeSelection(newSelection);
    };

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        // Only if clicking on valid background
        if ((e.target as HTMLElement).closest('[data-draggable-id]')) return;
        if ((e.target as HTMLElement).closest('button')) return; // Ignore buttons

        e.preventDefault(); // Prevent text selection

        // If Not Ctrl/Shift, clear selection on start
        if (!e.ctrlKey && !e.shiftKey) {
            setOrganizeSelection(new Set());
        }

        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
        });
    };

    const addGroup = () => {
        const newId = Date.now().toString();
        setGroups(prev => [...prev, { id: newId, name: `Grupo ${prev.length + 1}`, batchIds: [] }]);
    };

    const removeGroup = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        // Move items back to singles
        setSingles(prev => [...prev, ...group.batchIds]);
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const autoGroup = () => {
        if (singles.length === 0) return;

        // Group singles by genetic
        const byGenetic: Record<string, string[]> = {};

        singles.forEach(id => {
            const b = getBatch(id);
            const genName = b?.genetic?.name || 'Varios';
            if (!byGenetic[genName]) byGenetic[genName] = [];
            byGenetic[genName].push(id);
        });

        const newGroups: { id: string, name: string, batchIds: string[] }[] = [];
        const timestamp = Date.now();

        Object.entries(byGenetic).forEach(([genName, ids], index) => {
            newGroups.push({
                id: `${timestamp}-${index}`,
                name: `Lote ${genName}`,
                batchIds: ids
            });
        });

        setGroups(prev => [...prev, ...newGroups]);
        setSingles([]);
    };

    if (!isOpen) return null;

    // Helper to get batch details
    const getBatch = (id: string) => currentRoom.batches?.find(b => b.id === id);

    return (
        <Overlay>
            <Content>
                <ModalHeader>
                    <Title><FaExchangeAlt /> Transplantar Esquejes</Title>
                    <StepIndicator>
                        <Step $active={step === 1} $completed={step > 1}>1. Selección</Step>
                        <Step $active={step === 2} $completed={false}>2. Organización</Step>
                    </StepIndicator>
                </ModalHeader>

                <ModalBody>
                    {step === 1 && (
                        <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0 }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <Section>
                                    <Label>Sala de Destino</Label>
                                    <Select value={destinationId} onChange={e => setDestinationId(e.target.value)}>
                                        <option value="">-- Seleccionar Sala --</option>
                                        {Object.entries(roomsByCrop).map(([cropName, cropRooms]) => (
                                            <optgroup key={cropName} label={cropName}>
                                                {cropRooms.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.name} ({r.type === 'flowering' ? 'Flora' : 'Veg'})
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </Select>
                                </Section>
                                <Section>
                                    <Label>Resumen</Label>
                                    <div style={{ background: '#ebf8ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bee3f8', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2b6cb0' }}>{selectedBatchIds.size}</div>
                                        <div style={{ color: '#4a5568', fontSize: '0.9rem' }}>Plantas seleccionadas</div>
                                    </div>
                                </Section>
                            </div>
                            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                                <Label>Seleccionar Esquejes</Label>
                                <TabContainer>
                                    {cloneMaps.map(map => (
                                        <Tab key={map.id} $active={activeMapId === map.id} onClick={() => setActiveMapId(map.id)}>
                                            <FaMap /> {map.name}
                                        </Tab>
                                    ))}
                                </TabContainer>
                                {activeMapId && (() => {
                                    const map = cloneMaps.find(m => m.id === activeMapId);
                                    if (!map) return null;

                                    const mapBatches = currentRoom.batches?.filter(b => b.clone_map_id === map.id) || [];
                                    const allSelected = mapBatches.length > 0 && mapBatches.every(b => selectedBatchIds.has(b.id));

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                <TextActionButton onClick={() => handleSelectAll(map.id)}>
                                                    {allSelected ? <FaRegSquare /> : <FaCheckSquare />}
                                                    {allSelected ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                                                </TextActionButton>
                                            </div>
                                            <div style={{
                                                border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.5rem',
                                                flex: 1, overflow: 'auto', background: '#f7fafc'
                                            }}>
                                                <EsquejeraGrid
                                                    rows={map.grid_rows} cols={map.grid_columns}
                                                    batches={currentRoom.batches?.filter(b => b.clone_map_id === map.id) || []}
                                                    onBatchClick={handleBatchClick} selectedBatchIds={selectedBatchIds} selectionMode={true}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <DndContext
                            sensors={sensors}
                            onDragEnd={handleDragEnd}
                            autoScroll={false} /* Disable auto-scroll to prevent infinite loop */
                        >
                            <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {/* Singles Column */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <Label style={{ marginBottom: 0 }}>Esquejes Individuales ({singles.length})</Label>
                                        {singles.length > 0 && (
                                            <button
                                                onClick={autoGroup}
                                                style={{
                                                    background: '#3182ce', color: 'white', border: 'none',
                                                    borderRadius: '0.25rem', padding: '0.25rem 0.5rem',
                                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                                                }}
                                                title="Agrupar automáticamente por Genética"
                                            >
                                                Agrupar Todo
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        <DroppableContainer id="singles">
                                            {/* Selection Box Visual */}
                                            {selectionBox && (
                                                <div style={{
                                                    position: 'fixed',
                                                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                                                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                                                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                                                    height: Math.abs(selectionBox.currentY - selectionBox.startY),
                                                    background: 'rgba(49, 130, 206, 0.2)',
                                                    border: '1px solid #3182ce',
                                                    pointerEvents: 'none',
                                                    zIndex: 9999
                                                }} />
                                            )}

                                            <div
                                                ref={singlesContainerRef}
                                                onMouseDown={handleContainerMouseDown}
                                                style={{ minHeight: '100%', paddingBottom: '2rem' }} // Ensure area to click
                                            >
                                                {(() => {
                                                    // Group singles by genetic
                                                    const grouped = singles.reduce((acc, id) => {
                                                        const batch = getBatch(id);
                                                        const geneticName = batch?.genetic?.name || 'Desconocida';
                                                        if (!acc[geneticName]) acc[geneticName] = [];
                                                        acc[geneticName].push(id);
                                                        return acc;
                                                    }, {} as Record<string, string[]>);

                                                    return Object.entries(grouped).map(([geneticName, ids]) => (
                                                        <div key={geneticName} style={{ marginBottom: '1rem' }}>
                                                            <div style={{
                                                                fontSize: '0.85rem', fontWeight: 'bold', color: '#718096',
                                                                marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem'
                                                            }}>
                                                                {geneticName} <span style={{ fontWeight: 'normal' }}>({ids.length})</span>
                                                            </div>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                {ids.map(id => {
                                                                    const b = getBatch(id);
                                                                    const isSelected = organizeSelection.has(id);
                                                                    return (
                                                                        <DraggableItem key={id} id={id}>
                                                                            <div
                                                                                data-draggable-id={id}
                                                                                onClick={(e) => handleOrganizeClick(id, e)}
                                                                                style={{
                                                                                    padding: '0.5rem',
                                                                                    background: isSelected ? '#ebf8ff' : 'white',
                                                                                    border: isSelected ? '2px solid #3182ce' : '1px solid #e2e8f0',
                                                                                    borderRadius: '0.25rem',
                                                                                    fontSize: '0.8rem', cursor: 'grab',
                                                                                    boxShadow: isSelected ? '0 0 0 2px rgba(49, 130, 206, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                                                                                    transition: 'all 0.1s',
                                                                                    userSelect: 'none'
                                                                                }}>
                                                                                <strong>{b?.tracking_code}</strong><br />
                                                                            </div>
                                                                        </DraggableItem>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </DroppableContainer>
                                    </div>
                                </div>

                                {/* Groups Column */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <Label style={{ marginBottom: 0 }}>Grupos Nuevos</Label>
                                        <button onClick={addGroup} style={{ background: '#48bb78', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <FaPlus /> Nuevo Grupo
                                        </button>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                                        {groups.map(group => (
                                            <div key={group.id} style={{ border: '1px solid #cbd5e0', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                                                <div style={{ background: '#edf2f7', padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <input
                                                        value={group.name}
                                                        onChange={e => setGroups(prev => prev.map(g => g.id === group.id ? { ...g, name: e.target.value } : g))}
                                                        style={{ border: 'none', background: 'transparent', fontWeight: 'bold', flex: 1 }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => handlePrintLabels(group)}
                                                            title="Imprimir Etiquetas"
                                                            style={{ color: '#4a5568', border: 'none', background: 'white', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem' }}
                                                        >
                                                            <FaPrint />
                                                        </button>
                                                        <button onClick={() => removeGroup(group.id)} style={{ color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer' }}><FaTrash /></button>
                                                    </div>
                                                </div>
                                                <DroppableContainer id={`group-${group.id}`}>
                                                    {group.batchIds.length === 0 && <span style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Arrastra esquejes aquí</span>}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        {group.batchIds.map(id => {
                                                            const b = getBatch(id);
                                                            const isSelected = organizeSelection.has(id);
                                                            return (
                                                                <DraggableItem key={id} id={id}>
                                                                    <div
                                                                        onClick={(e) => handleOrganizeClick(id, e)}
                                                                        style={{
                                                                            padding: '0.25rem 0.5rem',
                                                                            background: isSelected ? '#ebf8ff' : '#c6f6d5',
                                                                            borderRadius: '0.25rem',
                                                                            fontSize: '0.75rem', fontWeight: 'bold',
                                                                            color: isSelected ? '#2b6cb0' : '#22543d',
                                                                            cursor: 'grab',
                                                                            border: isSelected ? '2px solid #3182ce' : '1px solid transparent'
                                                                        }}>
                                                                        {b?.tracking_code}
                                                                    </div>
                                                                </DraggableItem>
                                                            )
                                                        })}
                                                    </div>
                                                </DroppableContainer>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </DndContext>
                    )}
                </ModalBody>

                <ModalFooter>
                    {step === 1 ? (
                        <>
                            <Button $variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleNextStep}>Siguiente: Organizar</Button>
                        </>
                    ) : (
                        <>
                            <Button $variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                            <Button onClick={handleConfirm} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar Todo'}</Button>
                        </>
                    )}
                </ModalFooter>
            </Content>

            {/* Hidden Print Area */}
            {printingGroup && (
                <PrintableBatchLabels
                    batches={printingGroup.batchIds.map(id => getBatch(id)).filter(Boolean) as Batch[]}
                />
            )}

            <ToastModal
                isOpen={toastOpen}
                message={toastMessage}
                type={toastType}
                onClose={() => setToastOpen(false)}
            />
        </Overlay>
    );
};
