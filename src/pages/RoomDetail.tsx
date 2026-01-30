import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    FaArrowLeft, FaWarehouse, FaPlus, FaCalendarAlt
} from 'react-icons/fa';
// date-fns removed
// es locale removed
import { roomsService } from '../services/roomsService';
// tasksService removed
// dailyLogsService removed
import { Room, Batch } from '../types/rooms';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

// Badges
const Badge = styled.span<{ stage?: string }>`
  padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  background: ${p => p.stage === 'vegetation' ? '#c6f6d5' : p.stage === 'flowering' ? '#fed7d7' : '#edf2f7'};
  color: ${p => p.stage === 'vegetation' ? '#22543d' : p.stage === 'flowering' ? '#822727' : '#4a5568'};
`;


const Title = styled.h1` font-size: 1.8rem; color: #2d3748; margin: 1rem 0 0.5rem; display: flex; align-items: center; gap: 0.75rem; `;

// Tabs
const TabGroup = styled.div`
  display: flex; margin-bottom: 1.5rem; background: #f7fafc; padding: 0.25rem; border-radius: 0.5rem; width: fit-content;
`;
const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1.5rem; border: none; border-radius: 0.375rem;
  background: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#2f855a' : '#718096'};
  font-weight: ${p => p.active ? '600' : '400'};
  box-shadow: ${p => p.active ? '0 1px 3px 0 rgba(0,0,0,0.1)' : 'none'};
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem;
`;

// Modal Utils
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
`;
const ModalContent = styled.div`
  background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;
`;



const CancelButton = styled.button`
  flex: 1; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; 
  background: white; color: #4a5568; cursor: pointer; font-weight: 600;
  transition: all 0.2s;
  &:hover { background: #f7fafc; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' }>`
  flex: 1; padding: 0.6rem; border: none; border-radius: 0.5rem; 
  background: ${p => p.$variant === 'danger' ? '#fc8181' : p.$variant === 'success' ? '#48bb78' : '#3182ce'}; 
  color: white; cursor: pointer; font-weight: 600;
  transition: all 0.2s;
  &:hover { filter: brightness(1.1); }
  &:disabled { background: #a0aec0; cursor: not-allowed; }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; font-size: 0.9rem; }
  input, select, textarea { width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 0.4rem; }
  textarea { min-height: 80px; }
`;





const RoomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<Room | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'calendar' | 'tables'>('tables'); // Default to tables as calendar is disabled

    // Calendar State (Removed)

    // Task/Log Modal State


    // Tables State (Batches)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newBatch, setNewBatch] = useState({ name: '', strain: '', quantity: 20, notes: '', geneticId: '', table_number: 0 });
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
    const [targetRoomId, setTargetRoomId] = useState('');
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [genetics, setGenetics] = useState<any[]>([]);



    const loadData = React.useCallback(async (roomId: string) => {
        setLoading(true);
        try {
            const { geneticsService } = await import('../services/geneticsService');

            const [roomData, batchesData, geneticsData] = await Promise.all([
                roomsService.getRoomById(roomId),
                roomsService.getBatchesByRoom(roomId),
                geneticsService.getGenetics()
            ]);

            setRoom(roomData);
            setBatches(batchesData);
            setGenetics(geneticsData);

        } catch (error) {
            console.error("Error loading room data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadAllRooms = React.useCallback(async () => {
        const data = await roomsService.getRooms();
        setAllRooms(data);
    }, []);

    // Batch Management Handlers
    const handleCreateBatch = async () => {
        if (!id || !newBatch.geneticId) { alert("Selecciona genética"); return; }
        const selectedGen = genetics.find(g => g.id === newBatch.geneticId);
        const created = await roomsService.createBatch({
            name: `Lote Mesa ${(newBatch as any).table_number}`,
            genetic_id: newBatch.geneticId,
            strain: selectedGen?.name || 'Desconocida',
            quantity: newBatch.quantity,
            stage: 'vegetation',
            start_date: new Date().toISOString(),
            current_room_id: id,
            table_number: (newBatch as any).table_number
        });
        if (created) {
            setBatches([created, ...batches]);
            setIsCreateOpen(false);
            setNewBatch({ name: '', strain: '', quantity: 20, notes: '', geneticId: '', table_number: 0 } as any);
        }
    };

    const handleMoveBatch = async () => {
        if (!selectedBatch || !targetRoomId) return;
        const success = await roomsService.moveBatch(selectedBatch.id, selectedBatch.current_room_id || null, targetRoomId, "Movimiento manual");
        if (success) {
            setBatches(batches.filter(b => b.id !== selectedBatch.id));
            setIsMoveOpen(false);
            setSelectedBatch(null);
        }
    };


    // Calendar Handlers

    useEffect(() => {
        if (id) {
            loadData(id);
            loadAllRooms();
        }
    }, [id, loadData, loadAllRooms]);

    // Calendar Rendering Logic

    const totalTables = room ? Math.floor(room.capacity / 20) : 0;
    const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

    if (loading) return <LoadingSpinner fullScreen text="Cargando sala..." />;

    return (
        <Container>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FaArrowLeft /></button>
                <Title>{room?.name} <Badge stage={room?.type}>{room?.type}</Badge></Title>
            </div>

            <TabGroup>
                <Tab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
                    <FaCalendarAlt /> Vista General (Calendario)
                </Tab>
                <Tab active={activeTab === 'tables'} onClick={() => setActiveTab('tables')}>
                    <FaWarehouse /> Mesas de Cultivo
                </Tab>
            </TabGroup>

            {activeTab === 'calendar' && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                    <FaCalendarAlt size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Calendario desactivado temporalmente.</p>
                </div>
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {tables.map(tableNum => {
                        const batch = batches.find(b => b.table_number === tableNum);
                        const isOccupied = !!batch;
                        return (
                            <div
                                key={tableNum}
                                onClick={() => {
                                    if (batch) { setSelectedBatch(batch); setIsMoveOpen(true); }
                                    else { setNewBatch({ ...newBatch, table_number: tableNum } as any); setIsCreateOpen(true); }
                                }}
                                style={{
                                    background: isOccupied ? '#f0fff4' : 'white',
                                    border: isOccupied ? '2px solid #48bb78' : '2px dashed #cbd5e0',
                                    borderRadius: '1rem',
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    minHeight: '180px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <h3 style={{ margin: 0, color: '#2d3748' }}>Mesa {tableNum}</h3>
                                {isOccupied ? (
                                    <>
                                        <Badge stage={batch?.stage}>{batch?.stage}</Badge>
                                        <strong style={{ color: '#2f855a', marginTop: '0.5rem' }}>{batch?.strain}</strong>
                                        <span style={{ fontSize: '0.9rem', color: '#718096' }}>{batch?.quantity} Plantas</span>
                                    </>
                                ) : (
                                    <div style={{ color: '#a0aec0', marginTop: '0.5rem', textAlign: 'center' }}>
                                        <FaPlus /> <br /> Disponible
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}




            {/* Create Batch Modal (Copied Logic) */}
            {
                isCreateOpen && (
                    <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsCreateOpen(false) }}>
                        <ModalContent>
                            <h3>Asignar Mesa {(newBatch as any).table_number}</h3>
                            <FormGroup>
                                <label>Genética</label>
                                <select value={(newBatch as any).geneticId} onChange={e => setNewBatch({ ...newBatch, geneticId: e.target.value } as any)}>
                                    <option value="">Seleccionar...</option>
                                    {genetics.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </FormGroup>
                            <FormGroup>
                                <label>Cantidad</label>
                                <input type="number" value={newBatch.quantity} onChange={e => setNewBatch({ ...newBatch, quantity: parseInt(e.target.value) })} />
                            </FormGroup>
                            <ActionButton
                                onClick={handleCreateBatch}
                                $variant="success"
                                style={{ width: '100%', marginTop: '1rem' }}
                            >
                                Guardar
                            </ActionButton>
                        </ModalContent>
                    </ModalOverlay>
                )
            }

            {/* Move Batch Modal */}
            {
                isMoveOpen && (
                    <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsMoveOpen(false) }}>
                        <ModalContent>
                            <h3>Mover Lote</h3>
                            <FormGroup>
                                <label>Sala Destino</label>
                                <select value={targetRoomId} onChange={e => setTargetRoomId(e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    {allRooms.filter(r => r.id !== room?.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </FormGroup>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <CancelButton onClick={() => setIsMoveOpen(false)}>
                                    Cancelar
                                </CancelButton>
                                <ActionButton
                                    onClick={handleMoveBatch}
                                    disabled={!targetRoomId}
                                >
                                    Mover
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )
            }



        </Container>
    );
};

export default RoomDetail;
