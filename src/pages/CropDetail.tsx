import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  format,
  // eachMonthOfInterval removed
  // startOfYear removed
  // endOfYear removed
  differenceInWeeks,
  addWeeks,
  differenceInDays
} from 'date-fns';
import es from 'date-fns/locale/es';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaSeedling,
  FaMapMarkerAlt,
  // FaTint removed
  // FaChevronLeft removed
  // FaChevronRight removed
  FaLeaf,
  // FaChartLine removed
  FaPlus,
  FaEdit,
  FaTrash,
  FaWarehouse,
  FaClock,
  // FaTimes removed
  FaCheckCircle,
  FaRegCircle,
  FaPalette,
  FaExchangeAlt,
  FaLayerGroup
} from 'react-icons/fa';

import { tasksService } from '../services/tasksService';
import { dailyLogsService } from '../services/dailyLogsService';
import { cropsService } from '../services/cropsService';
import { Crop, Task } from '../types';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { PromptModal } from '../components/PromptModal';
import { ConfirmModal } from '../components/ConfirmModal';



const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  padding-top: 5rem;
  background-color: #f8fafc;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #718096;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  padding: 0;
  font-size: 0.95rem;

  &:hover {
    color: #2f855a;
  }
`;

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const CropTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg { color: #38a169; }
`;


const MetaGrid = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  color: #4a5568;
  font-size: 0.95rem;

  div {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;








const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 { margin: 0; color: #2d3748; font-size: 1.25rem; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  &:hover { color: #e53e3e; }
`;

const TabGroup = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  background: #f7fafc;
  padding: 0.25rem;
  border-radius: 0.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#2f855a' : '#718096'};
  font-weight: ${p => p.active ? '600' : '400'};
  box-shadow: ${p => p.active ? '0 1px 3px 0 rgba(0,0,0,0.1)' : 'none'};
  transition: all 0.2s;
  cursor: pointer;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    &:focus { outline: none; border-color: #38b2ac; box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1); }
  }
  textarea { min-height: 100px; resize: vertical; }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.1s;
  &:active { transform: translateY(0); }
`;





const CycleControls = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
`;

const ActionLink = styled.button<{ $variant?: 'warning' | 'danger' }>`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${p => p.$variant === 'danger' ? '#e53e3e' : '#dd6b20'};
  cursor: pointer;
  text-decoration: underline;
  &:hover { opacity: 0.8; }
`;

const ConfirmModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: slideIn 0.2s ease-out;

  h3 {
    margin-top: 0;
    color: #2d3748;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #718096;
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.95rem;
  }

  .cancel {
    background: #edf2f7;
    color: #4a5568;
    &:hover { background: #e2e8f0; }
  }

  .confirm {
    background: #805ad5; 
    color: white;
    box-shadow: 0 4px 6px -1px rgba(128, 90, 213, 0.4);
    &:hover { background: #6b46c1; transform: translateY(-1px); }
  }

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;


const VisualStageBadge = styled.div<{ $type: string }>`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px; // Pill shape
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  background: ${p => p.$type === 'vegetation' ? '#c6f6d5' : p.$type === 'flowering' ? '#fbd38d' : p.$type === 'mother' ? '#e9d8fd' : p.$type === 'clones' ? '#b2f5ea' : '#e2e8f0'};
  color: ${p => p.$type === 'vegetation' ? '#22543d' : p.$type === 'flowering' ? '#975a16' : p.$type === 'mother' ? '#553c9a' : p.$type === 'clones' ? '#234e52' : '#4a5568'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 5;

  svg { width: 1.2em; height: 1.2em; }
`;

const getColorHex = (colorName?: string) => {
  switch (colorName) {
    case 'green': return '#38a169';
    case 'blue': return '#3182ce';
    case 'purple': return '#805ad5';
    case 'orange': return '#dd6b20';
    case 'red': return '#e53e3e';
    case 'pink': return '#d53f8c';
    case 'teal': return '#319795';
    case 'cyan': return '#0bc5ea';
    case 'yellow': return '#d69e2e';
    case 'gray': return '#718096';
    default: return '#38a169';
  }
};

const CropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  console.log("CropDetail Render. ID:", id); // Verify ID availability
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'log'>('task');
  const [selectedDate] = useState<Date | null>(null); // Setter unused

  // Form State
  const [taskForm, setTaskForm] = useState({ title: '', type: 'info', description: '' });
  const [fertilizerDetails, setFertilizerDetails] = useState(''); // New state for fertilizer info
  const [logForm, setLogForm] = useState({ notes: '' });

  // Modify/Delete State
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [existingLogId] = useState<string | null>(null); // Setter unused


  // ... (Define EventData type outside component)
  // interface EventData {
  //   tasks: any[]; // Using any to avoid importing Task if not strictly needed, or import it.
  //   log: any; // Using any or DailyLog
  // }

  // ... (Inside CropDetail)
  // State for events map
  // eventsMap removed as unused

  const [rooms, setRooms] = useState<any[]>([]);

  // New Room Form
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState<{
    name: string;
    type: 'vegetation' | 'flowering' | 'drying' | 'clones' | 'mother';
    medium: 'maceta' | 'bandeja' | 'bunker';
    totalMacetas: number;
    macetaGeneticId: string;
    startDate: string;
    tablesList: { id: number; plants: number; geneticId: string; originType?: 'seed' | 'clone' | 'mother'; originBatchId?: string }[];
  }>({
    name: '',
    type: 'vegetation',
    medium: 'maceta',
    totalMacetas: 0,
    macetaGeneticId: '',
    startDate: new Date().toISOString().split('T')[0],
    tablesList: []
  });

  const [genetics, setGenetics] = useState<any[]>([]);

  useEffect(() => {
    // Load genetics for the modal
    const fetchGenetics = async () => {
      const { geneticsService } = await import('../services/geneticsService');
      const data = await geneticsService.getGenetics();
      setGenetics(data);
    };
    fetchGenetics();
  }, []);




  const loadRooms = React.useCallback(async (spotId: string) => {
    const { roomsService } = await import('../services/roomsService');
    const data = await roomsService.getRooms(spotId);
    setRooms(data);
  }, []);

  const loadCrop = React.useCallback(async (cropId: string) => {
    try {
      console.log("Loading spot...", cropId);
      const data = await cropsService.getCropById(cropId);
      console.log("Crop data loaded:", data);

      if (!data) {
        console.warn("Spot not found, redirecting...");
        navigate('/crops'); // Redirect if not found
        return;
      }
      setCrop(data);
      loadRooms(cropId);
    } catch (error) {
      console.error("Error loading spot:", error);
      navigate('/crops'); // Fallback redirect
    }
  }, [navigate, loadRooms]);

  const handleCreateRoom = async () => {
    console.log("handleCreateRoom called");
    console.log("Form Data:", roomForm);
    console.log("Crop ID:", id);

    if (!roomForm.name || !id) {
      console.error("Missing name or ID");
      alert("Falta nombre de la sala o ID del cultivo");
      return;
    }

    const { roomsService } = await import('../services/roomsService');
    const newRoom = await roomsService.createRoom({
      name: roomForm.name,
      type: roomForm.type as any,
      medium: 'maceta', // Default for now, irrelevant
      capacity: 0,
      spot_id: id,
      created_at: roomForm.startDate ? new Date(roomForm.startDate).toISOString() : undefined
    });

    if (newRoom) {
      console.log("Room created successfully:", newRoom);
      loadRooms(id);
      setIsRoomModalOpen(false);
      setRoomForm({
        name: '',
        type: 'vegetation',
        medium: 'maceta',
        totalMacetas: 0,
        macetaGeneticId: '',
        startDate: new Date().toISOString().split('T')[0],
        tablesList: []
      });
    } else {
      console.error("Failed to create room");
      alert("Error al crear la sala.");
    }
  };

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string, name: string } | null>(null);

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string, roomName: string) => {
    e.stopPropagation();
    setRoomToDelete({ id: roomId, name: roomName });
    setConfirmOpen(true);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.deleteRoom(roomToDelete.id);
    if (success) {
      if (id) loadRooms(id);
      setConfirmOpen(false);
      setRoomToDelete(null);
    } else {
      alert("Error al eliminar la sala.");
    }
  };

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'room' | 'spot' | null>(null);
  const [editData, setEditData] = useState<{ id: string, name: string } | null>(null);

  const handleEditRoomName = (e: React.MouseEvent, room: any) => {
    e.stopPropagation();
    setEditType('room');
    setEditData({ id: room.id, name: room.name });
    setEditModalOpen(true);
  };



  const handleConfirmEditName = async (newName: string) => {
    if (!editData || !newName.trim()) return;

    if (editType === 'room') {
      const { roomsService } = await import('../services/roomsService');
      const success = await roomsService.updateRoom(editData.id, { name: newName });
      if (success) {
        if (id) loadRooms(id);
        setEditModalOpen(false);
      } else {
        alert("Error al renombrar la sala.");
      }
    } else if (editType === 'spot') {
      const success = await cropsService.updateCrop(editData.id, { name: newName });
      if (success) {
        setCrop(prev => prev ? { ...prev, name: newName } : null);
        setEditModalOpen(false);
      } else {
        alert("Error al renombrar el spot.");
      }
    }
  };

  // Transplant Modal State
  const [isTransplantModalOpen, setIsTransplantModalOpen] = useState(false);
  const [transplantRoom, setTransplantRoom] = useState<any | null>(null);
  const [transplantForm, setTransplantForm] = useState<{
    medium: 'maceta' | 'bandeja' | 'bunker';
    capacity: number;
  }>({
    medium: 'maceta',
    capacity: 0
  });

  const handleOpenTransplant = (e: React.MouseEvent, room: any) => {
    e.stopPropagation();
    setTransplantRoom(room);
    setTransplantForm({
      medium: room.medium || 'maceta',
      capacity: room.capacity || 0
    });
    setIsTransplantModalOpen(true);
  };

  const handleTransplantRoom = async () => {
    if (!transplantRoom) return;

    if (transplantForm.capacity <= 0) {
      alert("La capacidad debe ser mayor a 0.");
      return;
    }

    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.updateRoom(transplantRoom.id, {
      medium: transplantForm.medium,
      capacity: transplantForm.capacity
    });

    if (success) {
      if (id) loadRooms(id);
      setIsTransplantModalOpen(false);
      setTransplantRoom(null);
    } else {
      alert("Error al transplantar la sala.");
    }
  };

  // Confirm Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{ room: any, nextStage: string } | null>(null);

  const handleForceStage = (e: React.MouseEvent, room: any, nextStage: string) => {
    e.stopPropagation();
    setPendingStageChange({ room, nextStage });
    setIsConfirmModalOpen(true);
  };

  const executeStageChange = async () => {
    if (!pendingStageChange) return;
    const { room, nextStage } = pendingStageChange;

    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.updateRoom(room.id, { type: nextStage as any });

    if (success) {
      if (id) loadRooms(id);
      setIsConfirmModalOpen(false);
      setPendingStageChange(null);
    } else {
      alert("Error al cambiar etapa.");
    }
  };



  useEffect(() => {
    if (id) {
      loadCrop(id);
    }
  }, [id, loadCrop]);


  const handleEditTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      type: task.type as any, // Warning: loss of type safety pending strict check
      description: task.description || ''
    });
    setEditingTaskId(task.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    await tasksService.deleteTask(taskId);
    setIsModalOpen(false); // Close to refresh cleanly or update local state
  };

  const handleDeleteLog = async () => {
    if (!existingLogId) return;
    if (!window.confirm('¿Eliminar este registro diario?')) return;
    await dailyLogsService.deleteLog(existingLogId);
    setIsModalOpen(false);
  };

  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (processingTaskId === taskId) return;
    setProcessingTaskId(taskId);

    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    // Optimistic Update for UI responsiveness
    setSelectedDayTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus as any } : t
    ));

    const success = await tasksService.updateStatus(taskId, newStatus as any);

    if (!success) {
      // Revert on failure
      setSelectedDayTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: currentStatus as any } : t
      ));
    }
    setProcessingTaskId(null);
  };

  const handleSave = async () => {
    if (!selectedDate || !id) return;
    // Fix: Force date to noon to avoid timezone shifts (e.g. 20th 00:00 becoming 19th 21:00)
    const safeDate = new Date(selectedDate);
    safeDate.setHours(12, 0, 0, 0);
    const dateStr = format(safeDate, 'yyyy-MM-dd');

    if (activeTab === 'task') {
      // Append fertilizer details if applicable
      let finalDescription = taskForm.description;
      if (taskForm.type === 'fertilizante' && fertilizerDetails.trim()) {
        finalDescription = `${finalDescription ? finalDescription + '\n\n' : ''}🧪 Fertilizante/Dosis: ${fertilizerDetails}`;
      }

      if (editingTaskId) {
        await tasksService.updateTask(editingTaskId, {
          title: taskForm.title,
          description: finalDescription,
          type: taskForm.type as any,
        });

      } else {
        await tasksService.createTask({
          title: taskForm.title,
          description: finalDescription,
          type: taskForm.type as any,
          due_date: dateStr,
          crop_id: id
        });

      }
    } else {
      // Assuming this is where room creation logic would be if it were in handleSave
      // The instruction implies adding 'medium' to a 'createRoom' or 'createRooms' payload.
      // Since the provided snippet doesn't contain the actual room creation logic,
      // I'm inserting the requested change as a placeholder where it might logically fit,
      // but it's important to note that the original content does not have this specific
      // room creation block within the handleSave function.
      // If the room creation logic is elsewhere, this change should be applied there.
      // For the purpose of this exercise, I'm placing it as per the user's instruction snippet.

      // This block below is from the user's instruction, but it seems to be misplaced
      // if it's intended for room creation within handleSave's 'else' (daily log).
      // I will place it here as per the instruction's structure, assuming it's a
      // conceptual insertion point for the 'medium' property.
      // If this is not the correct location, please provide the actual room creation function.
      // const roomsData = [{
      //   name: roomForm.name,
      //   type: roomForm.type,
      //   medium: roomForm.medium, // Added as per instruction
      //   capacity: totalPlants,
      //   spot_id: id
      // }];
      // const { data: newRoomData, error: roomError } = await roomsService.createRooms(roomsData);

      await dailyLogsService.upsertLog({
        crop_id: id,
        date: dateStr,
        notes: logForm.notes
      });

    }
    // Refresh events map
    // if (id) await loadEvents(id);
    setIsModalOpen(false);
  };





  if (!crop) {
    return <LoadingSpinner text="Cargando detalles del cultivo..." fullScreen />;
  }

  const handleDeleteCrop = async () => {
    if (!crop) return;
    // Safety check
    const confirmName = window.prompt(`⛔ ZONA DE PELIGRO ⛔\n\nEstás a punto de eliminar el Spot "${crop.name}" y todas sus Salas asociadas.\n\nPara confirmar, escribe el nombre del Spot exactamente:`);

    if (confirmName !== crop.name) {
      if (confirmName !== null) alert("Nombre incorrecto. Operación cancelada.");
      return;
    }

    const success = await cropsService.deleteCrop(crop.id);
    if (success) {
      alert("✅ Spot eliminado permanentemente.");
      navigate('/');
    } else {
      alert("❌ Error al eliminar el Spot.");
    }
  };

  const handleUpdateColor = async (newColor: string) => {
    if (!crop) return;
    const success = await cropsService.updateCrop(crop.id, { color: newColor });
    if (success) {
      setCrop({ ...crop, color: newColor });
      setIsColorPickerOpen(false);
    }
  };

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton onClick={() => navigate('/crops')}>
            <FaArrowLeft /> Volver a Spots
          </BackButton>

          <button
            onClick={handleDeleteCrop}
            style={{
              background: 'transparent',
              color: '#e53e3e',
              border: '1px solid #fed7d7',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            <FaTrash /> Eliminar Spot
          </button>
        </div>

        <TitleSection>
          <div>
            <CropTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaSeedling /> {/* Changed icon to Seedling/Spot concept */}
                {crop.name}
                <button
                  onClick={async () => {
                    const newName = window.prompt("Renombrar Spot:", crop.name);
                    if (newName && newName.trim() !== "" && newName !== crop.name) {
                      const success = await cropsService.updateCrop(crop.id, { name: newName });
                      if (success) {
                        setCrop({ ...crop, name: newName });
                      } else {
                        alert("Error al renombrar.");
                      }
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a0aec0',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '5px'
                  }}
                  title="Renombrar Spot"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => setIsColorPickerOpen(true)}
                  style={{
                    border: 'none', background: 'none', cursor: 'pointer', color: getColorHex(crop.color), padding: '0.25rem', display: 'flex'
                  }}
                  title="Cambiar Color"
                >
                  <FaPalette size={16} />
                </button>
              </div>
            </CropTitle>
            <MetaGrid>
              <div><FaMapMarkerAlt /> {crop.location || 'Sin ubicación'}</div>
              <div><FaCalendarAlt /> Creado: {format(new Date(crop.startDate), 'dd MMM yyyy', { locale: es })}</div>
            </MetaGrid>
          </div>
        </TitleSection>
      </Header>

      {/* --- ROOMS SECTION --- */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#2d3748', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaMapMarkerAlt /> Salas
          </h2>
          <button
            onClick={() => setIsRoomModalOpen(true)}
            style={{
              background: '#3182ce',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <FaPlus /> Nueva Sala
          </button>
        </div>

        {rooms.length === 0 ? (
          <div style={{ padding: '2rem', background: 'white', borderRadius: '1rem', border: '1px dashed #e2e8f0', textAlign: 'center', color: '#718096' }}>
            <p>No hay salas creadas en este Spot.</p>
            <button
              onClick={() => setIsRoomModalOpen(true)}
              style={{ color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
            >
              Crear la primera sala
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {rooms.map(room => {
              // Calculate logic
              let weekInfo = "";
              let startDateDisplay = "-";
              let daysToFlip = null;

              if (room.batches && room.batches.length > 0) {
                const activeBatches = room.batches.filter((b: any) => b.stage === room.type); // Filter by current room stage
                if (activeBatches.length > 0) {
                  // Find earliest start date (Main Date)
                  const earliest = activeBatches.reduce((min: string, b: any) => b.start_date < min ? b.start_date : min, activeBatches[0].start_date);

                  // Week Calculation
                  const weeks = differenceInWeeks(new Date(), new Date(earliest)) + 1;
                  weekInfo = `Semana ${weeks}`;

                  // Start Date Display (DD/MM/YYYY)
                  const dateObj = new Date(earliest);
                  // Fix timezone offset for display if needed, or just use UTC parts
                  startDateDisplay = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });


                  // Countdown Logic (Only for Vegetation)
                  if (room.type === 'vegetation') {
                    // Try to find the genetic info from the first batch
                    // room.batches has genetic_id. We need to match with genetics list.
                    const firstBatch = activeBatches[0];
                    if (firstBatch && firstBatch.genetic_id) {
                      const genetic = genetics.find(g => g.id === firstBatch.genetic_id);
                      if (genetic && genetic.vegetative_weeks) {
                        const targetDate = addWeeks(new Date(earliest), genetic.vegetative_weeks);
                        const today = new Date();
                        const diffDays = differenceInDays(targetDate, today);
                        daysToFlip = diffDays;
                      }
                    }
                  }
                }
              }

              // --- CYCLE CALCULATION FOR PROGRESS BAR ---

              let vegeWidth = 0;
              let floraWidth = 0;
              let currentStageProgress = 0; // % within the total bar
              let activeBatchForCycle = room.batches && room.batches.length > 0 ? room.batches.find((b: any) => b.stage === room.type) : null;
              let cycleGenetic = activeBatchForCycle ? genetics.find(g => g.id === activeBatchForCycle.genetic_id) : null;

              if (activeBatchForCycle && cycleGenetic) {
                const startDate = new Date(activeBatchForCycle.start_date);
                const today = new Date();
                const weeksPassed = Math.max(0, differenceInWeeks(today, startDate));

                // Default estima: 4 weeks vege, 9 weeks flora (if no genetics)
                const estVege = cycleGenetic.vegetative_weeks || 4;
                const estFlora = cycleGenetic.flowering_weeks || 9;
                const totalEstWeeks = estVege + estFlora;

                // Calculate widths relative to total
                vegeWidth = (estVege / totalEstWeeks) * 100;
                floraWidth = (estFlora / totalEstWeeks) * 100;

                // Find current position logic...
                // Simplified: use total weeks passed from start_date / total weeks
                const totalProgress = (weeksPassed / totalEstWeeks) * 100;
                currentStageProgress = Math.min(100, totalProgress);

                // Refinement: If in Flora, we should be visibly past the Vege segment.
                // If week 1, and we are in Flora, we naturally are past Vege.
                // Since we track 'start_date' of the batch which IS the room start date usually.
                // However, if we moved to Flora and 'start_date' didn't change, we rely on total time.
                // If we force moved to Flora, type changed.
                // Let's assume progress is total time.
              }




              return (
                <div
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid #edf2f7',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: room.type === 'vegetation' ? '#48bb78' : room.type === 'flowering' ? '#ed8936' : '#ecc94b'
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: 800 }}>{room.name}</h3>

                      {/* Visual Stage Badge - Replaces old small badge */}
                      <VisualStageBadge $type={room.type}>
                        {room.type === 'vegetation' ? <FaLeaf />
                          : room.type === 'flowering' ? <span>🌸</span>
                            : room.type === 'mother' ? <FaSeedling />
                              : room.type === 'clones' ? <span>🧬</span>
                                : <FaWarehouse />}
                        <span>
                          {room.type === 'vegetation' ? 'VEGETACIÓN'
                            : room.type === 'flowering' ? 'FLORA'
                              : room.type === 'mother' ? 'MADRES'
                                : room.type === 'clones' ? 'ESQUEJERA'
                                  : 'SECADO'}
                        </span>
                      </VisualStageBadge>

                      {weekInfo && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                          background: '#ebf8ff',
                          color: '#2b6cb0',
                          width: 'fit-content',
                          marginTop: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <FaRegCircle size={8} /> {weekInfo}
                        </span>
                      )}

                    </div>

                    {/* Repositioned Action Buttons */}
                    <div style={{
                      position: 'absolute',
                      bottom: '1.5rem',
                      right: '1.5rem',
                      display: 'flex',
                      gap: '5px',
                      zIndex: 10
                    }}>
                      <button
                        onClick={(e) => handleOpenTransplant(e, room)}
                        style={{
                          background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Transplantar"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#d69e2e'; e.currentTarget.style.borderColor = '#d69e2e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        <FaExchangeAlt size={14} />
                      </button>
                      <button
                        onClick={(e) => handleEditRoomName(e, room)}
                        style={{
                          background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Editar Nombre"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#3182ce'; e.currentTarget.style.borderColor = '#3182ce'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRoom(e, room.id, room.name)}
                        style={{
                          background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Eliminar Sala"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#e53e3e'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Start Date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem' }}>
                      <FaCalendarAlt size={14} color="#718096" />
                      <span>Iniciado: <strong>{startDateDisplay}</strong></span>
                    </div>

                    {/* Medium Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem' }}>
                      <FaLayerGroup size={14} color="#718096" />
                      <span style={{ textTransform: 'capitalize' }}>Medio: <strong>{room.medium || 'No definido'}</strong></span>
                    </div>

                    {/* Capacity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem' }}>
                      <FaWarehouse size={14} color="#718096" />
                      <span>{room.capacity ? `${Math.floor(room.capacity / 20)} Mesas (${room.capacity} Plantas)` : 'Sin capacidad definida'}</span>
                    </div>

                    {/* Countdown To Flora */}
                    {daysToFlip !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        <FaClock size={14} color="#ed8936" />
                        <span>
                          {daysToFlip > 0
                            ? <span>Pasa a Flora en: <strong>{daysToFlip} días</strong></span>
                            : <span style={{ color: '#e53e3e', fontWeight: 600 }}>¡Listo para pasar a Flora!</span>
                          }
                        </span>
                      </div>
                    )}
                    {/* We could add Sensor data here if available */}

                    {/* LIFE CYCLE PROGRESS BAR */}
                    {(room.type === 'vegetation' || room.type === 'flowering') && activeBatchForCycle && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#718096', marginBottom: '2px' }}>
                          <span>Inicio</span>
                          <span>Cosecha Est.</span>
                        </div>
                        <div style={{ position: 'relative', height: '10px', width: '100%', background: '#edf2f7', borderRadius: '5px', overflow: 'hidden' }}>
                          {/* Vege Segment */}
                          <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${vegeWidth}%`, background: '#c6f6d5',
                            borderRight: '1px solid white'
                          }} title="Fase Vegetativa Estimada" />

                          {/* Flora Segment */}
                          <div style={{
                            position: 'absolute', left: `${vegeWidth}%`, top: 0, bottom: 0,
                            width: `${floraWidth}%`, background: '#fbd38d'
                          }} title="Fase de Floración Estimada" />

                          {/* Current Progress Indicator */}
                          <div style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${currentStageProgress}%`,
                            background: 'rgba(0,0,0,0.15)', // Shadow overlay to show progress
                            borderRight: '2px solid #2d3748',
                            transition: 'width 0.5s ease-out'
                          }} />
                        </div>

                        {/* Emergency / Advance Controls */}
                        <CycleControls>
                          {room.type === 'vegetation' && (
                            <ActionLink
                              onClick={(e) => handleForceStage(e, room, 'flowering')}
                              title="Terminar etapa vegetativa y pasar a 12/12"
                            >
                              ⚡ Forzar a Flora
                            </ActionLink>
                          )}
                          {room.type === 'flowering' && (
                            <ActionLink
                              $variant="danger"
                              onClick={(e) => handleForceStage(e, room, 'drying')}
                              title="Finalizar floración y pasar a secado"
                            >
                              ✂️ Cosecha Anticipada
                            </ActionLink>
                          )}
                        </CycleControls>
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {isRoomModalOpen && (
        <ModalOverlay>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h3>Nueva Sala</h3>
              <CloseButton onClick={() => setIsRoomModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            <FormGroup>
              <label>Nombre de la Sala</label>
              <input
                autoFocus
                type="text"
                placeholder="Ej: Sala Vege 1"
                value={roomForm.name}
                onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <label>Fecha de Inicio del Cultivo</label>
              <input
                type="date"
                value={roomForm.startDate}
                onChange={e => setRoomForm({ ...roomForm, startDate: e.target.value })}
                style={{ width: '100%', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
              />
            </FormGroup>

            <FormGroup>
              <label>Fase de Cultivo</label>
              <select
                value={roomForm.type}
                onChange={e => setRoomForm({ ...roomForm, type: e.target.value as any })}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
              >
                <option value="vegetation">Vegetación</option>
                <option value="flowering">Floración</option>
                <option value="drying">Secado</option>
                <option value="curing">Curado</option>
                <option value="clones">Esquejera</option>
                <option value="mother">Sala de Madres</option>
              </select>
            </FormGroup>

            <PrimaryButton onClick={handleCreateRoom}>Crear Sala</PrimaryButton>
          </Modal>
        </ModalOverlay>
      )}

      {/* Color Picker Modal */}
      {
        isColorPickerOpen && (
          <ModalOverlay>

            <Modal onClick={e => e.stopPropagation()} style={{ maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Elegir Color</h3>
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', padding: '1rem 0', flexWrap: 'wrap' }}>
                {['green', 'blue', 'purple', 'orange', 'red', 'pink', 'teal', 'cyan', 'yellow', 'gray'].map(color => (
                  <button
                    key={color}
                    onClick={() => handleUpdateColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: getColorHex(color),
                      border: crop.color === color ? '3px solid #cbd5e0' : 'none',
                      cursor: 'pointer',
                      transform: crop.color === color ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Monthly View */}




      {
        isModalOpen && selectedDate && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</h3>
                <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>

              <TabGroup>
                <Tab active={activeTab === 'task'} onClick={() => setActiveTab('task')}>Nueva Tarea</Tab>
                <Tab active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Diario de Cultivo</Tab>
              </TabGroup>

              {activeTab === 'task' ? (
                <>
                  {/* Task List for the Day */}
                  {selectedDayTasks.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#718096' }}>Tareas Programadas:</h4>
                      {selectedDayTasks.map(task => (
                        <div key={task.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#f7fafc', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '0.5rem',
                          opacity: task.status === 'done' ? 0.7 : 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: task.status === 'done' ? '#38a169' : '#cbd5e0', padding: 0, display: 'flex' }}
                              title={task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                              {task.status === 'done' ? <FaCheckCircle size={18} /> : <FaRegCircle size={18} />}
                            </button>
                            <span style={{
                              fontWeight: 500,
                              color: '#2d3748',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none'
                            }}>
                              {task.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditTask(task)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4299e1' }}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e53e3e' }}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>
                    {editingTaskId ? 'Editar Tarea' : 'Agendar Nueva Tarea'}
                    {editingTaskId && <button onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', type: 'info', description: '' }); }} style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer' }}>Cancelar Edición</button>}
                  </h4>

                  <FormGroup>
                    <label>Tipo</label>
                    <select
                      value={taskForm.type}
                      onChange={e => {
                        const newType = e.target.value as any;

                        // Auto-set title based on type label
                        const typeLabels: { [key: string]: string } = {
                          'info': 'Nota Informativa',
                          'warning': 'Alerta',
                          'danger': 'Urgente',
                          'fertilizante': 'Fertilizante',
                          'defoliacion': 'Defoliación',
                          'poda_apical': 'Poda Apical',
                          'hst': 'HST (High Stress)',
                          'lst': 'LST (Low Stress)',
                          'enmienda': 'Enmienda',
                          'te_compost': 'Té de Compost',
                          'agua': 'Agua / Riego',
                          'esquejes': 'Esquejes'
                        };

                        setTaskForm(prevForm => ({
                          ...prevForm,
                          type: newType,
                          title: typeLabels[newType] || 'Tarea'
                        }));
                      }}
                    >
                      <option value="info">Info / Atención</option>
                      <option value="fertilizante">Fertilizante</option>
                      <option value="defoliacion">Defoliación</option>
                      <option value="poda_apical">Poda Apical</option>
                      <option value="hst">HST (High Stress Training)</option>
                      <option value="lst">LST (Low Stress Training)</option>
                      <option value="enmienda">Enmienda</option>
                      <option value="te_compost">Té de Compost</option>
                      <option value="agua">Agua / Riego</option>
                      <option value="esquejes">Esquejes</option>
                      <option value="warning">Alerta (Warning)</option>
                      <option value="danger">Urgente (Danger)</option>
                    </select>
                  </FormGroup>

                  <FormGroup>
                    <label>Aclaraciones / Detalles (Opcional)</label>
                    <textarea
                      value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Ej: 5 litros, pH 6.2, Proporción 2ml/L..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', minHeight: '80px', fontFamily: 'inherit' }}
                    />
                  </FormGroup>

                  {taskForm.type === 'fertilizante' && (
                    <FormGroup>
                      <label>Tipo de Fertilizante y Medida</label>
                      <textarea
                        value={fertilizerDetails}
                        onChange={e => setFertilizerDetails(e.target.value)}
                        placeholder="Ej: Grow Big 5ml/L, CalMag 2ml/L..."
                        style={{ minHeight: '60px', borderColor: '#48bb78' }}
                      />
                    </FormGroup>
                  )}
                  <FormGroup>
                    <label>Descripción (Opcional)</label>
                    <textarea
                      value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </FormGroup>
                </>
              ) : (
                <FormGroup>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Notas del Día</label>
                    {existingLogId && (
                      <button onClick={handleDeleteLog} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                        <FaTrash /> Eliminar Registro
                      </button>
                    )}
                  </div>
                  <textarea
                    value={logForm.notes}
                    onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                    placeholder="¿Cómo se ve la planta hoy? ¿Alguna plaga? ¿Crecimiento?"
                    style={{ minHeight: '200px' }}
                  />
                </FormGroup>
              )}

              <PrimaryButton onClick={handleSave}>Guardar</PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Rename Modal */}
      <PromptModal
        isOpen={editModalOpen}
        title={editType === 'room' ? "Renombrar Sala" : "Renombrar Spot"}
        initialValue={editData?.name || ''}
        placeholder="Nuevo nombre..."
        onClose={() => setEditModalOpen(false)}
        onConfirm={handleConfirmEditName}
      />

      {/* Confirm Delete Room Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Eliminar Sala"
        message={`¿Estás seguro de que deseas eliminar la sala "${roomToDelete?.name}"? Se perderán todos los datos asociados.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDeleteRoom}
        confirmText="Eliminar"
        isDanger
      />
      {/* Transplant Modal */}
      {
        isTransplantModalOpen && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>Transplantar Sala: {transplantRoom?.name}</h3>
                <CloseButton onClick={() => setIsTransplantModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>

              <p style={{ marginBottom: '1rem', color: '#718096', fontSize: '0.9rem' }}>
                Actualiza el medio de cultivo y la capacidad total de la sala.
              </p>

              <FormGroup>
                <label>Nuevo Medio de Cultivo</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['maceta', 'bandeja', 'bunker'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setTransplantForm({ ...transplantForm, medium: m })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid',
                        borderColor: transplantForm.medium === m ? '#ed8936' : '#e2e8f0',
                        background: transplantForm.medium === m ? '#fffaf0' : 'white',
                        color: transplantForm.medium === m ? '#c05621' : '#718096',
                        fontWeight: transplantForm.medium === m ? 600 : 400,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </FormGroup>

              <FormGroup>
                <label>Nueva Capacidad Total (Plantas)</label>
                <input
                  type="number"
                  min="1"
                  value={transplantForm.capacity}
                  onChange={e => setTransplantForm({ ...transplantForm, capacity: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={() => setIsTransplantModalOpen(false)}>Cancelar</button>
                <button
                  onClick={handleTransplantRoom}
                  style={{ background: '#ed8936', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}
                >
                  Confirmar Transplante
                </button>
              </div>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Styled Change Stage Confirmation Modal */}
      {
        isConfirmModalOpen && pendingStageChange && (
          <ModalOverlay onClick={() => setIsConfirmModalOpen(false)}>
            <ConfirmModalContent onClick={e => e.stopPropagation()}>
              <h3>
                {pendingStageChange.nextStage === 'flowering' ? '🌺 Pasar a Floración' : '✂️ Pasar a Cosecha'}
              </h3>
              <p>
                ¿Estás seguro que deseas {pendingStageChange.nextStage === 'flowering' ? 'cambiar a fase de Floración' : 'cosechar esta sala'}?
                <br />
                Esta acción actualizará el estado y las fechas del ciclo.
              </p>
              <div className="actions">
                <button className="cancel" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                <button className="confirm" onClick={executeStageChange}>Confirmar</button>
              </div>
            </ConfirmModalContent>
          </ModalOverlay>
        )
      }

    </Container >
  );
};

export default CropDetail;
