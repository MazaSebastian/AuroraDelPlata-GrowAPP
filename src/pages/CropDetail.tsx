import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  eachMonthOfInterval,
  startOfYear,
  endOfYear
} from 'date-fns';
import es from 'date-fns/locale/es';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaSeedling,
  FaMapMarkerAlt,
  FaTint,
  FaChevronLeft,
  FaChevronRight,
  FaLeaf,
  FaChartLine,
  FaTrash,
  FaEdit,
  FaTimes,
  FaCheckCircle,
  FaRegCircle,
  FaPalette
} from 'react-icons/fa';

import { tasksService } from '../services/tasksService';
import { dailyLogsService } from '../services/dailyLogsService';
import { cropsService } from '../services/cropsService';
import { Crop, Task } from '../types';
import { DailyLog } from '../services/dailyLogsService';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface EventData {
  tasks: Task[];
  log: DailyLog | null;
}

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

const CalendarContainer = styled.div`
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
  padding: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    border-radius: 1rem;
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  button {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    color: #4a5568;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover { background: #f7fafc; color: #2f855a; }
  }

  span {
    font-weight: 600;
    min-width: 120px;
    text-align: center;
  }
`;

// Monthly View Grid
const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #e2e8f0; // Grid lines
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  overflow: hidden;

  > div {
    background: white;
    min-height: 100px;
    padding: 0.5rem;
    position: relative;

    @media (max-width: 768px) {
      min-height: 60px;
      padding: 0.25rem;
    }
  }
`;

const DayHeader = styled.div`
  background: #f7fafc !important;
  min-height: auto !important;
  font-weight: 600;
  color: #718096;
  font-size: 0.85rem;
  text-align: center;
  padding: 0.75rem !important;
  text-transform: uppercase;

  @media (max-width: 768px) {
    font-size: 0.65rem;
    padding: 0.5rem 0.1rem !important;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
  width: max-content;
  max-width: 200px;
  z-index: 50;
  display: none;
  font-size: 0.75rem;
  text-align: left;
  pointer-events: none;

  .log-badge {
      background: #ebf8ff;
      color: #3182ce;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
      font-weight: 600;
  }

  .task-item {
      color: #4a5568;
      margin-bottom: 2px;
  }
`;

const DayCell = styled.div<{ isCurrentMonth?: boolean, isToday?: boolean, hasEvent?: boolean, backgroundColor?: string, textColor?: string }>`
  opacity: ${props => props.isCurrentMonth ? 1 : 0.4};
  background-color: ${props => props.backgroundColor ? props.backgroundColor + ' !important' : (props.isToday ? '#f0fff4 !important' : 'white')};
  border: none;
  transition: all 0.2s;
  position: relative;
  
  .day-number {
    font-weight: 600;
    font-size: 0.9rem;
    color: ${props => props.textColor ? props.textColor : (props.isToday ? '#2f855a' : '#2d3748')};
    margin-bottom: 0.5rem;
    display: block;
  }

  &:hover {
    transform: translateY(-2px);
    z-index: 10;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    // Darken slightly on hover if it has a color
    filter: ${props => props.backgroundColor ? 'brightness(95%)' : 'none'};
    background-color: ${props => !props.backgroundColor ? '#fafafa' : undefined};
    
    ${Tooltip} {
        display: block;
    }
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
  &:hover { transform: translateY(-1px); }
  &:active { transform: translateY(0); }
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
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'task' | 'log'>('task');

  // Form State
  const [taskForm, setTaskForm] = useState({ title: '', type: 'info', description: '' });
  const [fertilizerDetails, setFertilizerDetails] = useState(''); // New state for fertilizer info
  const [logForm, setLogForm] = useState({ notes: '' });

  // Modify/Delete State
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  // ... (Define EventData type outside component)
  // interface EventData {
  //   tasks: any[]; // Using any to avoid importing Task if not strictly needed, or import it.
  //   log: any; // Using any or DailyLog
  // }

  // ... (Inside CropDetail)
  // State for events map
  const [eventsMap, setEventsMap] = useState<Map<string, EventData>>(new Map());

  // ...

  const loadCrop = async (cropId: string) => {
    try {
      console.log("Loading crop...", cropId);
      const data = await cropsService.getCropById(cropId);
      console.log("Crop data loaded:", data);

      if (!data) {
        console.warn("Crop not found, redirecting...");
        navigate('/crops'); // Redirect if not found
        return;
      }
      setCrop(data);
    } catch (error) {
      console.error("Error loading crop:", error);
      navigate('/crops'); // Fallback redirect
    }
  };
  const loadEvents = async (cropId: string) => {
    try {
      const [tasks, logs] = await Promise.all([
        tasksService.getTasksByCropId(cropId),
        dailyLogsService.getLogsByCropId(cropId)
      ]);

      const map = new Map<string, EventData>();

      tasks.forEach(t => {
        if (t.due_date) {
          const current = map.get(t.due_date) || { tasks: [], log: null };
          current.tasks.push(t);
          map.set(t.due_date, current);
        }
      });

      logs.forEach(l => {
        if (l.date) {
          const current = map.get(l.date) || { tasks: [], log: null };
          current.log = l;
          map.set(l.date, current);
        }
      });

      setEventsMap(map);
      console.log("Events loaded:", map.size);
    } catch (e) {
      console.error("Error loading events", e);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered. ID:", id);
    if (id) {
      loadCrop(id);
      loadEvents(id);
    }
  }, [id]);


  const handleDayClick = async (day: Date) => {
    setSelectedDate(day);

    // Reset forms and edit state
    setTaskForm({ title: '', type: 'info', description: '' });
    setFertilizerDetails('');
    setLogForm({ notes: '' });
    setEditingTaskId(null);
    setExistingLogId(null);
    setSelectedDayTasks([]); // Reset tasks list

    // Get Data from Map
    const dateStr = format(day, 'yyyy-MM-dd');
    const eventData = eventsMap.get(dateStr);

    if (eventData) {
      setSelectedDayTasks(eventData.tasks || []);
      if (eventData.log) {
        setExistingLogId(eventData.log.id);
        setLogForm({ notes: eventData.log.notes });
      }
    }

    // Determine initial tab (Logic: if log exists, show log. Else show task)
    if (eventData?.log) {
      setActiveTab('log');
    } else {
      setActiveTab('task');
    }

    setIsModalOpen(true);
  };

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
    if (id) loadEvents(id);
    setIsModalOpen(false); // Close to refresh cleanly or update local state
  };

  const handleDeleteLog = async () => {
    if (!existingLogId) return;
    if (!window.confirm('¿Eliminar este registro diario?')) return;
    await dailyLogsService.deleteLog(existingLogId);
    if (id) loadEvents(id);
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

    if (success && id) {
      await loadEvents(id);
    } else {
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
      await dailyLogsService.upsertLog({
        crop_id: id,
        date: dateStr,
        notes: logForm.notes
      });

    }
    // Refresh events map
    if (id) await loadEvents(id);
    setIsModalOpen(false);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Annual Logic for 2025 (Mock data for now)
  const yearStart = startOfYear(new Date());
  const yearMonths = eachMonthOfInterval({
    start: mapYearStart(new Date()),
    end: new Date()
  }).slice(-12); // Show last 12 months or simple current year


  function mapYearStart(date: Date) {
    return startOfYear(date);
  }

  if (!crop) {
    return <LoadingSpinner text="Cargando detalles del cultivo..." fullScreen />;
  }

  const handleDeleteCrop = async () => {
    if (!crop) return;
    // Safety check
    const confirmName = window.prompt(`⛔ ZONA DE PELIGRO ⛔\n\nEstás a punto de eliminar "${crop.name}" y todo su historial (tareas, notas, gastos).\n\nPara confirmar, escribe el nombre del cultivo exactamente:`);

    if (confirmName !== crop.name) {
      if (confirmName !== null) alert("Nombre incorrecto. Operación cancelada.");
      return;
    }

    const success = await cropsService.deleteCrop(crop.id);
    if (success) {
      alert("✅ Cultivo eliminado permanentemente.");
      navigate('/');
    } else {
      alert("❌ Error al eliminar el cultivo.");
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
            <FaArrowLeft /> Volver a Cultivos
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
            <FaTrash /> Eliminar Cultivo
          </button>
        </div>

        <TitleSection>
          <div>
            <CropTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaLeaf />
                {crop.name}
                <button
                  onClick={async () => {
                    const newName = window.prompt("Renombrar cultivo:", crop.name);
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
                  title="Renombrar cultivo"
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
              <div><FaMapMarkerAlt /> {crop.location}</div>
              <div><FaCalendarAlt /> Inicio: {format(new Date(crop.startDate), 'dd MMM yyyy', { locale: es })}</div>
              {crop.estimatedHarvestDate && (
                <div><FaSeedling /> Cosecha: {format(new Date(crop.estimatedHarvestDate), 'MMM yyyy', { locale: es })}</div>
              )}
            </MetaGrid>
          </div>
        </TitleSection>
      </Header>

      {/* Color Picker Modal */}
      {isColorPickerOpen && (
        <ModalOverlay onClick={() => setIsColorPickerOpen(false)}>
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
      )}

      {/* Monthly View */}
      <CalendarContainer>
        <CalendarHeader>
          <h2><FaCalendarAlt /> Calendario Mensual</h2>
          <MonthNav>
            <button onClick={prevMonth}><FaChevronLeft /></button>
            <span>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
            <button onClick={nextMonth}><FaChevronRight /></button>
          </MonthNav>
        </CalendarHeader>

        <MonthGrid>
          {weekDays.map(day => (
            <DayHeader key={day}>{day}</DayHeader>
          ))}

          {calendarDays.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const data = eventsMap.get(dateKey);
            const hasEvent = !!data;
            const hasTask = data?.tasks && data.tasks.length > 0;

            const getTaskColor = (type: string) => {
              switch (type) {
                case 'fertilizante': return '#48bb78'; // Green
                case 'defoliacion': return '#ed8936'; // Orange
                case 'poda_apical': return '#ecc94b'; // Yellow
                case 'hst': return '#f56565'; // Red
                case 'lst': return '#4299e1'; // Blue
                case 'enmienda': return '#9f7aea'; // Purple
                case 'te_compost': return '#805ad5'; // Dark Purple
                case 'agua': return '#3182ce'; // Dark Blue
                case 'esquejes': return '#d53f8c'; // Pink
                case 'warning': return '#dd6b20'; // Dark Orange
                case 'danger': return '#e53e3e'; // Red
                default: return '#718096'; // Gray
              }
            };

            // Determine background color
            let cellBg = undefined;
            let cellText = undefined;

            if (hasTask && data.tasks.length > 0) {
              // Prioritize: Use the color of the first task found.
              // We could add complex priority logic here if needed.
              cellBg = getTaskColor(data.tasks[0].type);
              cellText = 'white';
            } else if (data?.log) {
              // If only log, maybe a soft green?
              cellBg = '#c6f6d5';
              cellText = '#22543d';
            }

            return (
              <DayCell
                key={idx}
                isCurrentMonth={isSameMonth(day, monthStart)}
                isToday={isSameDay(day, new Date())}
                hasEvent={hasEvent}
                backgroundColor={cellBg}
                textColor={cellText}
                onClick={() => handleDayClick(day)}
                style={{ cursor: 'pointer' }}
              >
                <span className="day-number">{format(day, 'd')}</span>

                {/* Visual Indicators (Dots) - keep dots if multiple tasks, otherwise clean */}
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: 'auto', justifyContent: 'center' }}>
                  {(data?.tasks?.length || 0) > 1 && data!.tasks.slice(1).map((t, i) => (
                    <div key={i} style={{
                      width: '4px', height: '4px', borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.8)'
                    }} />
                  ))}
                  {data?.log && <div style={{ fontSize: '0.7rem', lineHeight: 1 }} title="Diario">📝</div>}
                </div>

                {hasEvent && (
                  <Tooltip>
                    {data?.log && <div className="log-badge" style={{ backgroundColor: '#f0fff4', color: '#2f855a' }}>📝 Diario</div>}
                    {data?.tasks.map((t, i) => (
                      <div key={i} className="task-item" style={{
                        borderLeft: `3px solid ${getTaskColor(t.type)}`,
                        paddingLeft: '0.5rem',
                        opacity: t.status === 'done' ? 0.6 : 1
                      }}>
                        <div>
                          <strong style={{
                            color: getTaskColor(t.type),
                            textDecoration: t.status === 'done' ? 'line-through' : 'none'
                          }}>
                            {t.title}
                          </strong>
                        </div>
                        {t.description && (
                          <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>
                            {t.description.length > 80 ? t.description.substring(0, 80) + '...' : t.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </Tooltip>
                )}
              </DayCell>
            )
          })}
        </MonthGrid>
      </CalendarContainer>



      {isModalOpen && selectedDate && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
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
      )}

    </Container>
  );
};

export default CropDetail;
