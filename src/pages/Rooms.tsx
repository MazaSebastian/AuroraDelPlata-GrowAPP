import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaWarehouse, FaPlus, FaThermometerHalf, FaTint, FaEdit, FaTrash, FaMapMarkedAlt } from 'react-icons/fa';
import { roomsService } from '../services/roomsService';
import { Room } from '../types/rooms';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #1a202c;
    background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
`;

const CreateButton = styled.button`
  background: #3182ce;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3);

  &:hover {
    background: #2b6cb0;
    transform: translateY(-2px);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const RoomCard = styled.div`
  background: white;
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
`;

const RoomHeader = styled.div<{ type: string }>`
  padding: 1.5rem;
  background: ${props => {
        switch (props.type) {
            case 'vegetation': return '#f0fff4'; // Green
            case 'flowering': return '#fff5f5'; // Red/Pink
            case 'drying': return '#fffaf0'; // Orange
            case 'curing': return '#fffaf0'; // Orange (Legacy)
            case 'living_soil': return '#e6fffa'; // Teal/Mint
            default: return '#f7fafc';
        }
    }};
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;

  .icon {
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: ${props => {
        switch (props.type) {
            case 'vegetation': return '#38a169';
            case 'flowering': return '#e53e3e';
            case 'drying': return '#dd6b20';
            case 'curing': return '#dd6b20';
            case 'living_soil': return '#319795';
            default: return '#718096';
        }
    }};
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  div {
    flex: 1;
    h3 { margin: 0; color: #2d3748; font-size: 1.25rem; }
    span { font-size: 0.875rem; color: #718096; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
  }
`;

const RoomBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f7fafc;
  
  &:last-child { border-bottom: none; }

  .label { display: flex; align-items: center; gap: 0.5rem; color: #718096; font-size: 0.9rem; }
  .value { font-weight: 600; color: #2d3748; }
`;

// Simple Modal Components
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; }
  input, select { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; }
`;

const Actions = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const ActionButton = styled.button<{ color: string }>`
    background: white;
    border: 1px solid transparent;
    color: ${p => p.color};
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${p => p.color}15;
        border-color: ${p => p.color}30;
    }
`;


const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const CreateCard = styled.div`
  background: #f7fafc;
  border-radius: 1.25rem;
  border: 2px dashed #cbd5e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 250px;
  gap: 1rem;
  transition: all 0.2s ease;
  opacity: 0.8;
  color: #a0aec0;

  &:hover {
    border-color: #3182ce;
    color: #3182ce;
    background: #ebf8ff;
    opacity: 1;
  }
`;

const DashedCircle = styled.div`
  width: 60px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: inherit;
  transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px dashed currentColor;
    transition: all 0.5s ease;
  }

  ${CreateCard}:hover &::before {
    animation: ${rotate} 10s linear infinite;
  }
`;

const Rooms: React.FC = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', type: 'vegetation', capacity: 0 });
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [toastAnimate, setToastAnimate] = useState(true);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    useEffect(() => {
        loadRooms(true);
    }, []);

    const loadRooms = async (isInitial = false) => {
        setLoading(true);

        const fetchPromise = async () => {
            const data = await roomsService.getRooms();
            return data;
        };

        const minTimePromise = isInitial
            ? new Promise(resolve => setTimeout(resolve, 1500))
            : Promise.resolve();

        const [data] = await Promise.all([
            fetchPromise(),
            minTimePromise
        ]);

        setRooms(data);
        setLoading(false);
    };

    const handleCreateOrUpdateRoom = async () => {
        if (!newRoom.name) return;

        if (editingRoomId) {
            const success = await roomsService.updateRoom(editingRoomId, {
                name: newRoom.name,
                type: newRoom.type as any,
                capacity: newRoom.capacity
            });
            if (success) {
                setRooms(rooms.map(r => r.id === editingRoomId ? { ...r, ...newRoom, type: newRoom.type as any } : r));
                closeModal();
            }
        } else {
            const created = await roomsService.createRoom({
                name: newRoom.name,
                type: newRoom.type as any,
                capacity: newRoom.capacity
            });

            if (created) {
                setRooms([...rooms, created]);
                closeModal();
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, room: Room) => {
        e.stopPropagation(); // Prevent navigation to detail
        setEditingRoomId(room.id);
        setNewRoom({
            name: room.name,
            type: room.type,
            capacity: room.capacity
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent navigation to detail
        setRoomToDelete(id);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete) return;

        setIsDeleting(true);
        const success = await roomsService.deleteRoom(roomToDelete);
        setIsDeleting(false);

        if (success) {
            setRooms(rooms.filter(r => r.id !== roomToDelete));
            // Show Success Toast
            setToastMessage(`La sala ha sido eliminada correctamente.`);
            setToastType('success');
            setToastAnimate(false);
            setToastOpen(true);
        } else {
            setToastMessage("Error al eliminar la Sala. Inténtalo de nuevo.");
            setToastType('error');
            setToastAnimate(true);
            setToastOpen(true);
        }
        setIsConfirmDeleteOpen(false);
        setRoomToDelete(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRoomId(null);
        setNewRoom({ name: '', type: 'vegetation', capacity: 0 });
    };

    if (loading) return <LoadingSpinner text="Cargando salas..." fullScreen duration={1500} />;

    return (
        <Container>
            <Header>
                <h1>Salas de Cultivo</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <CreateButton onClick={() => navigate('/rooms/map')} style={{ background: 'white', color: '#2b6cb0', border: '1px solid #2b6cb0' }}>
                        <FaMapMarkedAlt /> Mapa Interactivo
                    </CreateButton>
                    <CreateButton onClick={() => setIsModalOpen(true)}>
                        <FaPlus /> Nueva Sala
                    </CreateButton>
                </div>
            </Header>

            <Grid>
                {rooms.map(room => (
                    <RoomCard key={room.id} onClick={() => navigate(`/rooms/${room.id}`)}>
                        <RoomHeader type={room.type}>
                            <div className="icon"><FaWarehouse /></div>
                            <div>
                                <h3>{room.name}</h3>
                                <span>{room.type === 'living_soil' ? 'Agro/Living Soil' : room.type === 'curing' ? 'Secado' : room.type}</span>
                            </div>
                            <Actions>
                                <ActionButton color="#3182ce" onClick={(e) => handleEdit(e, room)} title="Editar">
                                    <FaEdit />
                                </ActionButton>
                                <ActionButton color="#e53e3e" onClick={(e) => handleDeleteClick(e, room.id)} title="Eliminar">
                                    <FaTrash />
                                </ActionButton>
                            </Actions>
                        </RoomHeader>
                        <RoomBody>

                            <StatRow>
                                <div className="label"><FaThermometerHalf /> Temp. Actual</div>
                                <div className="value">{room.current_temperature ? `${room.current_temperature}°C` : '--'}</div>
                            </StatRow>
                            <StatRow>
                                <div className="label"><FaTint /> Humedad</div>
                                <div className="value">{room.current_humidity ? `${room.current_humidity}%` : '--'}</div>
                            </StatRow>
                        </RoomBody>
                    </RoomCard>
                ))}
                <CreateCard onClick={() => setIsModalOpen(true)}>
                    <DashedCircle>
                        <FaPlus />
                    </DashedCircle>
                    <span style={{ fontWeight: 600, fontSize: '1rem', color: 'inherit', textAlign: 'center', padding: '0 1rem' }}>Haz click aquí para crear una nueva sala</span>
                </CreateCard>
            </Grid>

            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <h2>{editingRoomId ? 'Editar Sala' : 'Nueva Sala'}</h2>
                        <FormGroup>
                            <label>Nombre</label>
                            <input
                                value={newRoom.name}
                                onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
                                placeholder="Ej: Sala Vegetación A"
                            />
                        </FormGroup>
                        <FormGroup>
                            <label>Tipo</label>
                            <select
                                value={newRoom.type}
                                onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
                            >
                                <option value="vegetation">Vegetación</option>
                                <option value="flowering">Floración</option>
                                <option value="drying">Secado</option>
                                <option value="clones">Esquejera</option>
                                <option value="general">General/Mixta</option>
                                <option value="living_soil">Agro/Living Soil</option>

                            </select>
                        </FormGroup>

                        {newRoom.type === 'clones' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <FormGroup>
                                    <label>Filas (A-Z)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="26"
                                        value={(newRoom as any).grid_rows || ''}
                                        onChange={e => setNewRoom({ ...newRoom, grid_rows: parseInt(e.target.value) } as any)}
                                        placeholder="Ej: 5"
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <label>Columnas (1-N)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={(newRoom as any).grid_columns || ''}
                                        onChange={e => setNewRoom({ ...newRoom, grid_columns: parseInt(e.target.value) } as any)}
                                        placeholder="Ej: 10"
                                    />
                                </FormGroup>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={closeModal} style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleCreateOrUpdateRoom} style={{ padding: '0.75rem 1.5rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                {editingRoomId ? 'Actualizar' : 'Crear Sala'}
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )
            }

            <ConfirmModal
                isOpen={isConfirmDeleteOpen}
                title="Eliminar Sala"
                message="¿Estás seguro de que deseas eliminar esta sala? Esta acción no se puede deshacer y borrará todos los datos asociados."
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                confirmText="Eliminar"
                isDanger
                isLoading={isDeleting}
            />
        </Container >
    );
};

export default Rooms;
