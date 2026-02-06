import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    closestCenter,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    FaArrowLeft, FaSeedling, FaThermometerHalf, FaTint, FaMapMarkedAlt, FaTimes
} from 'react-icons/fa';
import { roomsService } from '../services/roomsService';
import { cropsService } from '../services/cropsService';
import { Room, Batch } from '../types/rooms';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MoveConfirmationModal } from '../components/MoveConfirmationModal';

// --- Styled Components ---

const Container = styled.div`
    padding: 2rem;
    padding-top: 5rem;
    max-width: 1600px; // Wider for map view
    margin: 0 auto;
    height: 100vh;
    display: flex;
    flex-direction: column;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
`;

const Title = styled.h1`
    font-size: 2rem;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const BackButton = styled.button`
    background: white;
    border: 1px solid #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4a5568;
    font-weight: 600;
    transition: all 0.2s;

    &:hover { background: #f7fafc; color: #2d3748; }
`;

const MapGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
    padding-bottom: 2rem;
    flex: 1;
    overflow-y: auto;
    /* align-items: flex-start; Removed to prevent overlap issues reported by user */
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 900;
    backdrop-filter: blur(2px);
`;

const ModalContent = styled.div`
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #718096;
    &:hover { color: #2d3748; }
`;

// --- Draggable Batch Component ---

const BatchCardStyled = styled.div<{ isDragging?: boolean }>`
    background: white;
    padding: 0.35rem 0.5rem; /* Very compact padding */
    border-radius: 0.25rem;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    cursor: grab;
    margin-bottom: 0.25rem; /* Tiny margin */
    transition: transform 0.2s, box-shadow 0.2s;
    opacity: ${p => p.isDragging ? 0.5 : 1};
    font-size: 0.85rem; 

    &:hover {
        border-color: #3182ce;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    &:active { cursor: grabbing; }

    .single-line-content {
        display: flex;
        align-items: center;
        width: 100%;
        color: #2d3748;
    }

    .batch-id {
        font-weight: 700;
        flex-shrink: 0;
        margin-right: 2px;
    }

    .separator {
        margin: 0 2px;
        flex-shrink: 0;
        color: #cbd5e0;
    }

    .genetic-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1; /* Takes remaining space */
        min-width: 0; /* Allows shrinking */
        margin: 0 2px;
    }

    .quantity {
        font-weight: 600;
        color: #4a5568;
        flex-shrink: 0; /* Always visible */
        margin-left: 2px;
    }
`;

const DraggableBatch = ({ batch }: { batch: Batch }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: batch.id,
        data: { type: 'batch', batch }
    });

    return (
        <BatchCardStyled ref={setNodeRef} style={{ transform: isDragging ? 'translate3d(0,0,0)' : undefined }} {...listeners} {...attributes} isDragging={isDragging}>
            <div className="single-line-content">
                <span className="batch-id">{batch.name}</span>
                <span className="separator">-</span>
                <span className="genetic-name" title={batch.genetic?.name || batch.strain}>
                    {batch.genetic?.name || batch.strain || 'S/N'}
                </span>
                <span className="separator">-</span>
                <span className="quantity">x{batch.quantity}</span>
            </div>
        </BatchCardStyled>
    );
};

// --- Droppable Room Component ---

const RoomZoneStyled = styled.div<{ isOver?: boolean; roomType: string; }>`
    background: ${p => p.isOver ? '#ebf8ff' : '#f7fafc'};
    border: 2px dashed ${p => p.isOver ? '#3182ce' : '#cbd5e0'};
    border-radius: 1rem;
    padding: 1rem;
    min-height: 180px;
    height: 100%; /* Ensure it fills the grid cell height */
    box-sizing: border-box; /* Ensure padding is included in height */
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
    overflow: hidden; /* Ensure content stays inside border radius */

    .room-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e2e8f0;
        
        h3 { margin: 0; color: #2d3748; font-size: 1.1rem; }
        .stats { display: flex; gap: 0.5rem; font-size: 0.75rem; color: #718096; }
    }
`;

const DroppableRoom = ({ room, cropName, children, onViewAll }: { room: Room, cropName?: string, children: React.ReactNode, onViewAll: (r: Room) => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: room.id,
        data: { type: 'room', room }
    });

    // We calculate count from children if possible, but children is opaque ReactNode.
    // However, in the usage below we map room.batches.
    // ..

    const batchCount = room.batches?.length || 0;
    const isOverflowing = batchCount > 3;

    return (
        <RoomZoneStyled ref={setNodeRef} isOver={isOver} roomType={room.type}>
            <div className="room-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <h3>{room.name}</h3>
                        {cropName && (
                            <span style={{ fontSize: '0.75rem', color: '#3182ce', background: '#ebf8ff', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                {cropName}
                            </span>
                        )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'capitalize' }}>{room.type}</span>
                </div>
                <div className="stats">
                    <span title="Temp"><FaThermometerHalf /> {room.current_temperature || '-'}°</span>
                    <span title="Hum"><FaTint /> {room.current_humidity || '-'}%</span>
                </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {children}
                {isOverflowing && (
                    <button
                        onClick={() => onViewAll(room)}
                        style={{
                            marginTop: 'auto',
                            width: '100%',
                            padding: '0.4rem',
                            background: '#e2e8f0',
                            border: 'none',
                            borderRadius: '0.25rem',
                            color: '#4a5568',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Ver todo ({batchCount})
                    </button>
                )}
            </div>
        </RoomZoneStyled>
    );
};


// --- Main Page Component ---

const RoomsMap: React.FC = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [cropsMap, setCropsMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [activeDragBatch, setActiveDragBatch] = useState<Batch | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; batch?: Batch; toRoom?: Room; fromRoom?: Room } | null>(null);
    const [viewAllRoom, setViewAllRoom] = useState<Room | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [loadedRooms, loadedCrops] = await Promise.all([
            roomsService.getRooms(),
            cropsService.getCrops()
        ]);

        // Create Map: SpotID (CropID) -> Crop Name
        const cMap: Record<string, string> = {};
        loadedCrops.forEach(c => {
            cMap[c.id] = c.name;
        });

        setRooms(loadedRooms);
        setCropsMap(cMap);
        setLoading(false);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const batch = active.data.current?.batch as Batch;
        if (batch) setActiveDragBatch(batch);

        // Close modal if dragging starts from within it
        if (viewAllRoom) {
            setViewAllRoom(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragBatch(null);

        if (!over) return;

        const batch = active.data.current?.batch as Batch;
        const toRoomId = over.id as string;
        const fromRoomId = batch.current_room_id;

        // If dropped in same room, do nothing
        if (toRoomId === fromRoomId) return;

        // Find Room Objects
        const toRoom = rooms.find(r => r.id === toRoomId);
        const fromRoom = rooms.find(r => r.id === fromRoomId);

        if (batch && toRoom) {
            // Open Confirmation Modal
            setModalConfig({
                isOpen: true,
                batch,
                toRoom,
                fromRoom
            });
        }
    };

    const confirmMove = async (notes: string) => {
        if (!modalConfig || !modalConfig.batch || !modalConfig.toRoom) return;

        const { batch, toRoom, fromRoom } = modalConfig;

        // Optimistic UI Update (Optional, but let's wait for API for safety)
        const success = await roomsService.moveBatch(
            batch.id,
            fromRoom?.id || null,
            toRoom.id,
            notes
        );

        if (success) {
            // Refresh Data
            await loadData();
        } else {
            alert("Error al mover el lote.");
        }

        setModalConfig(null);
    };

    if (loading) return <LoadingSpinner text="Cargando mapa..." fullScreen />;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Container>
                <Header>
                    <BackButton onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Volver
                    </BackButton>
                    <Title>
                        <FaMapMarkedAlt color="#3182ce" /> Mapa Interactivo de Cultivo
                    </Title>
                    <div style={{ width: '100px' }}></div> {/* Spacer */}
                </Header>

                <MapGrid>
                    {rooms.map(room => {
                        const visibleBatches = room.batches?.slice(0, 3) || [];
                        const cropName = room.spot_id ? cropsMap[room.spot_id] : undefined;

                        return (
                            <DroppableRoom key={room.id} room={room} cropName={cropName} onViewAll={setViewAllRoom}>
                                {visibleBatches.map(batch => (
                                    <DraggableBatch key={batch.id} batch={batch} />
                                ))}
                                {(!room.batches || room.batches.length === 0) && (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Sala Vacía
                                    </div>
                                )}
                            </DroppableRoom>
                        );
                    })}
                </MapGrid>

                <DragOverlay zIndex={1000}>
                    {activeDragBatch ? (
                        <div style={{ transform: 'rotate(5deg)' }}>
                            <BatchCardStyled style={{ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                                <h4>{activeDragBatch.name}</h4>
                                <div style={{ fontSize: '0.8rem' }}>Moviendo...</div>
                            </BatchCardStyled>
                        </div>
                    ) : null}
                </DragOverlay>

                {/* --- "See All" Modal --- */}
                {viewAllRoom && (
                    <ModalOverlay onClick={() => setViewAllRoom(null)}>
                        <ModalContent onClick={e => e.stopPropagation()}>
                            <CloseButton onClick={() => setViewAllRoom(null)}><FaTimes /></CloseButton>
                            <h3 style={{ marginBottom: '1rem', color: '#2d3748', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaMapMarkedAlt color="#3182ce" /> {viewAllRoom.name}
                                <span style={{ fontSize: '0.9rem', color: '#718096', fontWeight: 'normal' }}>({viewAllRoom.batches?.length} lotes)</span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {viewAllRoom.batches?.map(batch => (
                                    <DraggableBatch key={batch.id} batch={batch} />
                                ))}
                            </div>
                        </ModalContent>
                    </ModalOverlay>
                )}

                {modalConfig && (
                    <MoveConfirmationModal
                        isOpen={modalConfig.isOpen}
                        batchName={modalConfig.batch?.name || ''}
                        fromRoomName={modalConfig.fromRoom?.name || 'Inventario'}
                        toRoomName={modalConfig.toRoom?.name || ''}
                        onClose={() => setModalConfig(null)}
                        onConfirm={confirmMove}
                    />
                )}

            </Container>
        </DndContext>
    );
};

export default RoomsMap;
