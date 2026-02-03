import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import {
    FaArrowLeft, FaPlus, FaCalendarAlt, FaCheck, FaExclamationTriangle,
    FaSeedling, FaDna, FaThermometerHalf, FaTint, FaClock, FaTrash
    // Task Icons
    // FaExclamationTriangle, FaTint, FaCut, FaSkull, FaLeaf, FaFlask, FaBroom
} from 'react-icons/fa';
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { roomsService } from '../services/roomsService';
import { tasksService } from '../services/tasksService';
import { stickiesService } from '../services/stickiesService';
import { Room } from '../types/rooms';
import { Task, StickyNote } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FaStickyNote } from 'react-icons/fa';
import { TuyaManager } from '../components/TuyaManager';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

// Helper for colors
const getTaskStyles = (type: string) => {
    switch (type) {
        case 'danger': return { bg: '#fed7d7', color: '#822727' };
        case 'warning': return { bg: '#fefcbf', color: '#744210' };
        case 'fertilizar':
        case 'enmienda':
        case 'te_compost': return { bg: '#c6f6d5', color: '#22543d' };
        case 'riego': return { bg: '#bee3f8', color: '#2c5282' };
        case 'poda_apical': return { bg: '#fc8181', color: '#742a2a' }; // Red
        case 'defoliacion': return { bg: '#fbd38d', color: '#975a16' }; // Orange
        case 'hst':
        case 'lst':
        case 'entrenamiento': return { bg: '#e9d8fd', color: '#44337a' };
        case 'esquejes': return { bg: '#feebc8', color: '#7b341e' };
        case 'info':
        default: return { bg: '#edf2f7', color: '#4a5568' };
    }
};

// Badges
const Badge = styled.span<{ stage?: string, taskType?: string }>`
  padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  
  ${p => {
        if (p.stage) {
            return `
            background: ${p.stage === 'vegetation' ? '#c6f6d5' : p.stage === 'flowering' ? '#fed7d7' : '#edf2f7'};
            color: ${p.stage === 'vegetation' ? '#22543d' : p.stage === 'flowering' ? '#822727' : '#4a5568'};
          `;
        }
        if (p.taskType) {
            const s = getTaskStyles(p.taskType || '');
            return `background: ${s.bg}; color: ${s.color};`;
        }
        return `background: #edf2f7; color: #4a5568;`;
    }}
`;


const Title = styled.h1` font-size: 1.8rem; color: #2d3748; margin: 1rem 0 0.5rem; display: flex; align-items: center; gap: 0.75rem; `;



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

// Room Header Components
const HeaderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #e2e8f0;
  
  h3 { font-size: 0.85rem; color: #718096; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: flex; alignItems: center; gap: 0.5rem; }
  .value { font-size: 1.5rem; font-weight: 800; color: #2d3748; }
  .sub { font-size: 0.85rem; color: #a0aec0; margin-top: 0.25rem; }
`;

const GeneticsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const GeneticTag = styled.span`
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
  border: 1px solid #bee3f8;
`;

// ... (existing helper definitions) ...

const RoomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stickies, setStickies] = useState<StickyNote[]>([]);

    // Day Summary State
    const [isDaySummaryOpen, setIsDaySummaryOpen] = useState(false);
    const [selectedDayForSummary, setSelectedDayForSummary] = useState<Date | null>(null);

    // Sticky Modal State
    const [isStickyModalOpen, setIsStickyModalOpen] = useState(false);
    const [stickyContent, setStickyContent] = useState('');
    const [stickyColor, setStickyColor] = useState<StickyNote['color']>('yellow');
    const [selectedSticky, /** setSelectedSticky unused */] = useState<StickyNote | null>(null);


    // Interactive Calendar State
    const { user } = useAuth();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskForm, setTaskForm] = useState({ title: '', type: 'info', due_date: '', description: '', assigned_to: '' });

    // Real Users State
    const [users, setUsers] = useState<any[]>([]);

    const loadData = React.useCallback(async (roomId: string) => {
        setLoading(true);
        try {
            const { usersService } = await import('../services/usersService');

            const [roomData, tasksData, usersData, stickiesData] = await Promise.all([
                roomsService.getRoomById(roomId),
                tasksService.getTasksByRoomId(roomId),
                usersService.getUsers(),
                stickiesService.getStickies(roomId)
            ]);

            setRoom(roomData);
            setTasks(tasksData);
            setUsers(usersData);
            setStickies(stickiesData);

        } catch (error) {
            console.error("Error loading room data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // ... (keep existing Task Handlers) ...

    // Sticky Handlers


    const handleSaveSticky = async () => {
        if (!id) return;

        // No specific date - general room note
        const targetDate = undefined;

        if (selectedSticky) {
            // Update logic (if implemented in service/UI fully)
            // For now we just create new ones or delete old ones manually
        } else {
            // Pass undefined or null for targetDate to make it general
            await stickiesService.createSticky(stickyContent, stickyColor, id, targetDate);
        }

        const freshStickies = await stickiesService.getStickies(id);
        setStickies(freshStickies);
        setIsStickyModalOpen(false);
    };

    const [stickyToDelete, setStickyToDelete] = useState<string | null>(null);

    const handleDeleteSticky = (stickyId: string) => {
        setStickyToDelete(stickyId);
    };

    const confirmDeleteSticky = async () => {
        if (stickyToDelete) {
            await stickiesService.deleteSticky(stickyToDelete);
            if (id) {
                const freshStickies = await stickiesService.getStickies(id);
                setStickies(freshStickies);
            }
            setStickyToDelete(null);
        }
    };


    // Inside calendar rendering loop...
    // const calendarDays = eachDayOfInterval(...)
    // return calendarDays.map(...)

    // ... logic to simulate inside the map:
    /*
     const dateStr = format(dayItem, 'yyyy-MM-dd');
     const dayStickies = stickies.filter(s => s.target_date === dateStr);
     
     // Render Sticky Icons
     {dayStickies.map(s => (
        <div key={s.id} 
             title={s.content}
             onClick={(e) => {e.stopPropagation(); handleDeleteSticky(s.id)}}
             style={{ 
               background: s.color === 'yellow' ? '#fefcbf' : s.color === 'pink' ? '#fed7d7' : s.color === 'blue' ? '#bee3f8' : '#c6f6d5',
               fontSize: '0.7em', padding: '2px 4px', borderRadius: '3px', marginTop: '2px',
               border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
             }}
        >
             <FaStickyNote size={10} />
             <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px'}}>{s.content}</span>
        </div>
     ))}
    */

    // UI for Sticky Modal to be added at end of return


    // Load all rooms removed


    // Batch Management Handlers
    // Batch Management Handlers - REMOVED


    // Calendar Handlers (Interactive)

    const handleAddTask = (day: Date) => {
        // Allow admin or partner (owner) to add tasks
        if (user && (user.role === 'admin' || user.role === 'partner')) {
            setTaskForm({ title: '', type: 'info', due_date: format(day, 'yyyy-MM-dd'), description: '', assigned_to: '' });
            setSelectedTask(null);
            setIsTaskModalOpen(true);
        }
    };

    const handleDayDetails = (day: Date) => {
        setSelectedDayForSummary(day);
        setIsDaySummaryOpen(true);
    };

    const handleTaskClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setTaskForm({
            title: task.title,
            type: task.type as any,
            due_date: task.due_date || '',
            description: task.description || '',
            assigned_to: task.assigned_to || ''
        });
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = async () => {
        if (!room) return;

        const taskData: any = {
            title: taskForm.title,
            type: taskForm.type as any,
            due_date: taskForm.due_date,
            description: taskForm.description,
            room_id: room.id,
            assigned_to: taskForm.assigned_to || null
        };

        if (selectedTask) {
            // Update
            await tasksService.updateTask(selectedTask.id, taskData);
        } else {
            // Create
            await tasksService.createTask(taskData);
        }

        // Refresh tasks
        if (id) {
            const updatedTasks = await tasksService.getTasksByRoomId(id);
            setTasks(updatedTasks);
        }
        setIsTaskModalOpen(false);
    };

    const handleToggleTaskStatus = async (task: Task) => {
        if (!task) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const originalStatus = task.status;

        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === task.id ? { ...t, status: newStatus } : t
        ));

        try {
            await tasksService.updateTask(task.id, { status: newStatus } as any);
            // No need to re-fetch if successful, state is already correct
        } catch (error) {
            console.error("Error updating task status:", error);
            // Revert on error
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === task.id ? { ...t, status: originalStatus } : t
            ));
            alert("No se pudo actualizar el estado de la tarea.");
        }
    };

    const handleDeleteTask = () => {
        if (selectedTask) {
            setIsDeleteConfirmOpen(true);
        }
    };

    const confirmDeleteTask = async () => {
        if (selectedTask) {
            await tasksService.deleteTask(selectedTask.id);
            if (id) {
                const updatedTasks = await tasksService.getTasksByRoomId(id);
                setTasks(updatedTasks);
            }
            setIsDeleteConfirmOpen(false);
            setIsTaskModalOpen(false);
        }
    };



    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id, loadData]);

    // Calendar Rendering Logic

    // Tables calc removed

    if (loading) return <LoadingSpinner fullScreen text="Cargando sala..." />;

    return (
        <Container>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><FaArrowLeft /></button>
                <Title>{room?.name} <Badge stage={room?.type}>{room?.type === 'vegetation' ? 'Vegetación' : room?.type === 'flowering' ? 'Floración' : room?.type}</Badge></Title>
            </div>

            {/* Room Summary Header */}
            {room && (
                <HeaderGrid>
                    {/* Plants Count */}
                    <StatCard>
                        <h3><FaSeedling /> Total Plantas</h3>
                        <div className="value">
                            {room.batches?.reduce((sum, b) => sum + b.quantity, 0) || 0}
                        </div>
                        <div className="sub">En {room.batches?.length || 0} lotes activos</div>
                    </StatCard>

                    {/* Genetics */}
                    <StatCard>
                        <h3><FaDna /> Genéticas</h3>
                        <div className="value" style={{ fontSize: '1rem' }}>
                            {/* Get unique genetics with counts */}
                            {(() => {
                                const geneticCounts: Record<string, number> = {};

                                room.batches?.forEach(b => {
                                    const name = b.genetic?.name || b.strain || 'Desconocida';
                                    geneticCounts[name] = (geneticCounts[name] || 0) + b.quantity;
                                });

                                const entries = Object.entries(geneticCounts);

                                if (entries.length === 0) return <span style={{ color: '#cbd5e0' }}>Sin asignar</span>;

                                return (
                                    <GeneticsList>
                                        {entries.map(([name, count]) => (
                                            <GeneticTag key={name}>
                                                <span style={{ fontWeight: 800, marginRight: '4px' }}>{count}</span>
                                                {name}
                                            </GeneticTag>
                                        ))}
                                    </GeneticsList>
                                );
                            })()}
                        </div>
                    </StatCard>

                    {/* Environment */}
                    <StatCard>
                        <h3><FaThermometerHalf /> Ambiente</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaThermometerHalf color="#e53e3e" />
                                <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{room.current_temperature || '--'}°C</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaTint color="#3182ce" />
                                <span style={{ fontWeight: 'bold', color: '#2d3748' }}>{room.current_humidity || '--'}%</span>
                            </div>
                        </div>
                        <div className="sub">Última act: Hoy</div>
                    </StatCard>

                    {/* Date */}
                    <StatCard>
                        <h3><FaClock /> Fecha Actual</h3>
                        <div className="value" style={{ fontSize: '1.25rem' }}>
                            {format(new Date(), "d 'de' MMMM", { locale: es })}
                        </div>
                        <div className="sub">{format(new Date(), "yyyy")}</div>
                    </StatCard>
                </HeaderGrid>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <TuyaManager mode="sensors" />
            </div>

            {/* Stickies Wall Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaStickyNote color="#ecc94b" /> Pizarra de Notas
                    </h2>
                    <button
                        onClick={() => {
                            setStickyContent('');
                            setStickyColor('yellow');
                            setIsStickyModalOpen(true);
                        }}
                        style={{
                            background: '#ecc94b', color: 'white', border: 'none', padding: '0.5rem 1rem',
                            borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <FaPlus /> Nueva Nota
                    </button>
                </div>

                {stickies.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {stickies.map(s => (
                            <div key={s.id} style={{
                                background: s.color === 'yellow' ? '#fefcbf' : s.color === 'blue' ? '#bee3f8' : s.color === 'pink' ? '#fed7d7' : '#c6f6d5',
                                padding: '1rem', borderRadius: '0.5rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column', gap: '0.5rem'
                            }}>
                                <p style={{ fontSize: '1rem', color: '#2d3748', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{s.content}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>{format(new Date(s.created_at), 'd MMM', { locale: es })}</span>
                                    <button
                                        onClick={() => handleDeleteSticky(s.id)}
                                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', opacity: 0.6, padding: '2px' }}
                                        title="Eliminar"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '2rem', border: '2px dashed #cbd5e0', borderRadius: '1rem', textAlign: 'center', color: '#a0aec0' }}>
                        <FaStickyNote style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                        <p>No hay notas fijadas en esta sala.</p>
                    </div>
                )}
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {/* Calendar Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '1rem', padding: '0.5rem' }}>&lt; Anterior</button>
                    <h2 style={{ fontSize: '1.5rem', color: '#2d3748', textTransform: 'capitalize' }}>
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', fontSize: '1rem', padding: '0.5rem' }}>Siguiente &gt;</button>
                </div>

                {/* Calendar Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                        <div key={d} style={{ background: '#f7fafc', padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#718096', fontSize: '0.85rem' }}>{d}</div>
                    ))}

                    {(() => {
                        const monthStart = startOfMonth(currentDate);
                        const monthEnd = endOfMonth(monthStart);
                        const startDate = startOfWeek(monthStart);
                        const endDate = endOfWeek(monthEnd);
                        const dateFormat = "d";


                        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                        return calendarDays.map((dayItem, idx) => {
                            const isCurrentMonth = isSameMonth(dayItem, monthStart);
                            const dateStr = format(dayItem, 'yyyy-MM-dd');
                            const dayTasks = tasks.filter(t => t.due_date && t.due_date.split('T')[0] === dateStr);

                            // Determine Background Gradient based on Task Distribution
                            let dayBg = 'white';

                            if (dayTasks.length > 0) {
                                // Helper to get pastel color by task type
                                const getTaskColor = (t: Task) => {
                                    switch (t.type) {
                                        case 'danger': return '#fed7d7'; // Red
                                        case 'warning': return '#fefcbf'; // Yellow
                                        case 'fertilizar':
                                        case 'enmienda':
                                        case 'te_compost': return '#c6f6d5'; // Green
                                        case 'riego': return '#bee3f8'; // Blue
                                        case 'poda_apical': return '#fed7d7'; // Light Red
                                        case 'defoliacion': return '#fbd38d'; // Orange
                                        case 'hst':
                                        case 'lst':
                                        case 'entrenamiento': return '#e9d8fd'; // Purple
                                        case 'esquejes': return '#feebc8'; // Orange
                                        default: return '#edf2f7'; // Gray (Info)
                                    }
                                };

                                if (dayTasks.length === 1) {
                                    dayBg = getTaskColor(dayTasks[0]);
                                } else {
                                    // Build linear gradient
                                    const step = 100 / dayTasks.length;
                                    const stops = dayTasks.map((t, i) => {
                                        const color = getTaskColor(t);
                                        return `${color} ${i * step}% ${(i + 1) * step}%`;
                                    }).join(', ');
                                    dayBg = `linear-gradient(135deg, ${stops})`;
                                }
                            }

                            // Phase Calculation Logic
                            let phaseBar = null;



                            if (room?.start_date && isCurrentMonth) {
                                // ... existing logic ...
                                const [y, m, d] = room.start_date.split('T')[0].split('-').map(Number);
                                const roomStart = new Date(y, m - 1, d);
                                const dayTime = new Date(dayItem).setHours(0, 0, 0, 0);
                                const startTime = roomStart.setHours(0, 0, 0, 0);

                                if (dayTime >= startTime) {
                                    const weekNum = Math.floor((dayTime - startTime) / (7 * 24 * 60 * 60 * 1000)) + 1;
                                    let isFloweringPhase = false;
                                    const activeBatch = room.batches?.find(b => b.genetic);
                                    const geneticVegWeeks = activeBatch?.genetic?.vegetative_weeks;

                                    if (geneticVegWeeks !== undefined && weekNum > geneticVegWeeks) {
                                        isFloweringPhase = true;
                                    } else if (room.type === 'flowering') {
                                        isFloweringPhase = true;
                                    }

                                    const color = isFloweringPhase ? '#fbd38d' : '#9ae6b4';
                                    const showLabel = dayItem.getDay() === 1 || dayItem.getDate() === 1 || dayTime === startTime;

                                    phaseBar = (
                                        <>
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                height: '6px', background: color, opacity: 0.7
                                            }} title={`Semana ${weekNum} del ciclo ${isFloweringPhase ? '(Floración)' : '(Vegetativo)'}`}></div>
                                            {showLabel && (
                                                <div style={{
                                                    position: 'absolute', bottom: '8px', right: '2px',
                                                    fontSize: '0.65rem', fontWeight: 'bold', color: isFloweringPhase ? '#c05621' : '#276749',
                                                    background: 'rgba(255,255,255,0.8)', padding: '0 2px', borderRadius: '2px'
                                                }}>Sem {weekNum}</div>
                                            )}
                                        </>
                                    );
                                }
                            }

                            return (
                                <div
                                    key={dayItem.toString()}
                                    className="calendar-day calendar-day-hover"
                                    style={{
                                        background: dayBg, // Applied dynamic background
                                        minHeight: '100px',
                                        padding: '0.5rem',
                                        position: 'relative',
                                        opacity: isCurrentMonth ? 1 : 0.4,
                                        cursor: user && (user.role === 'admin' || user.role === 'partner') ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        border: isSameDay(dayItem, new Date()) ? '2px solid #3182ce' : '1px solid transparent'
                                    }}
                                    onClick={() => handleDayDetails(dayItem)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: isSameDay(dayItem, new Date()) ? 'bold' : 'normal', color: isSameDay(dayItem, new Date()) ? '#2c5282' : '#2d3748' }}>
                                            {format(dayItem, dateFormat)}
                                        </span>
                                        {/* Actions: Add Task / Sticky */}
                                        {user && (user.role === 'admin' || user.role === 'partner') && (
                                            <div style={{ display: 'flex', gap: '4px' }}>

                                                <span
                                                    style={{ color: '#4a5568', fontSize: '0.8rem', opacity: 0.8, cursor: 'pointer', padding: '2px' }}
                                                    title="Agregar Tarea"
                                                    onClick={(e) => { e.stopPropagation(); handleAddTask(dayItem); }}
                                                >
                                                    <FaPlus />
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        {dayTasks.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={(e) => handleTaskClick(e, t)}
                                                style={{
                                                    fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px',
                                                    background: 'rgba(255,255,255,0.6)', // Semi-transparent white to stand out on colored bg
                                                    color: '#2d3748',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                    borderLeft: `3px solid ${t.status === 'done' ? '#48bb78' : '#718096'}`, // Status indicator instead of type color (since type is bg)
                                                    cursor: 'pointer',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                {t.title}
                                            </div>
                                        ))}
                                    </div>

                                    {phaseBar}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>




            {/* Task Modal - Interactive */}
            {isTaskModalOpen && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsTaskModalOpen(false) }}>
                    <ModalContent>
                        <h3>
                            {selectedTask ? 'Detalle de Tarea' : 'Nueva Tarea'}
                        </h3>

                        {user && (user.role === 'admin' || user.role === 'partner') ? (
                            <>
                                {/* Title is now auto-determined by Type */}
                                <FormGroup>
                                    <label>Tipo de Tarea</label>
                                    <select
                                        value={taskForm.type}
                                        onChange={e => {
                                            const newType = e.target.value as any;
                                            let newTitle = 'Tarea';
                                            switch (newType) {
                                                case 'info': newTitle = 'Información'; break;
                                                case 'riego': newTitle = 'Riego'; break;
                                                case 'fertilizar': newTitle = 'Fertilizar'; break;
                                                case 'defoliacion': newTitle = 'Defoliación'; break;
                                                case 'poda_apical': newTitle = 'Poda Apical'; break;
                                                case 'hst': newTitle = 'HST'; break;
                                                case 'lst': newTitle = 'LST'; break;
                                                case 'entrenamiento': newTitle = 'Entrenamiento'; break;
                                                case 'esquejes': newTitle = 'Esquejes'; break;
                                                case 'warning': newTitle = 'Alerta'; break;
                                                default: newTitle = 'Tarea';
                                            }
                                            setTaskForm({ ...taskForm, type: newType, title: newTitle });
                                        }}
                                    >
                                        <option value="info">Info</option>
                                        <option value="riego">Riego</option>
                                        <option value="fertilizar">Fertilizar</option>
                                        <option value="defoliacion">Defoliación</option>
                                        <option value="poda_apical">Poda Apical</option>
                                        <option value="hst">HST</option>
                                        <option value="lst">LST</option>
                                        <option value="entrenamiento">Entrenamiento</option>
                                        <option value="esquejes">Esquejes</option>
                                        <option value="warning">Alerta</option>
                                    </select>
                                </FormGroup>
                                <FormGroup>
                                    <label>Fecha</label>
                                    <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                                </FormGroup>
                                <FormGroup>
                                    <label>Asignar a</label>
                                    <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}>
                                        <option value="">-- Sin Asignar --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name || u.email || 'Usuario'}</option>
                                        ))}
                                    </select>
                                </FormGroup>
                                <FormGroup>
                                    <label>Indicaciones / Instrucciones (Opcional)</label>
                                    <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Escribe aquí los detalles precisos (ej: '5ml/L de CalMag')..." />
                                </FormGroup>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 600, color: '#4a5568', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Gestor de archivos</label>
                                    <button
                                        onClick={() => alert("Funcionalidad de subida de fotos en desarrollo. Se integrará con Supabase Storage.")}
                                        style={{ background: '#edf2f7', border: '1px dashed #cbd5e0', padding: '1rem', width: '100%', borderRadius: '0.5rem', cursor: 'pointer', color: '#718096' }}
                                    >
                                        <FaPlus /> Subir Foto
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    {selectedTask && (
                                        <CancelButton onClick={handleDeleteTask} style={{ color: '#e53e3e', borderColor: '#e53e3e' }}>
                                            Eliminar
                                        </CancelButton>
                                    )}
                                    <ActionButton onClick={handleSaveTask} $variant="success">
                                        Guardar
                                    </ActionButton>
                                </div>
                            </>
                        ) : (
                            // Read Only View for Employees (Execution Mode)
                            <div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>{selectedTask?.title}</strong> <br />
                                    <Badge taskType={selectedTask?.type}>{selectedTask?.type?.replace(/_/g, ' ')}</Badge>
                                </div>
                                <p style={{ color: '#4a5568', marginBottom: '1rem' }}>{selectedTask?.description || 'Sin descripción'}</p>
                                <p style={{ fontSize: '0.9rem', color: '#718096' }}>Asignado a: {users.find(u => u.id === selectedTask?.assigned_to)?.full_name || 'Nadie'}</p>

                                {/* Observations Field for Execution */}
                                <FormGroup>
                                    <label>Observaciones</label>
                                    <textarea
                                        placeholder="Registra observaciones puntuales al completar..."
                                        value={taskForm.description} // Re-using state for simplicity, ideally separate 'observations' state
                                        onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                    />
                                </FormGroup>

                                <div style={{ marginBottom: '1rem' }}>
                                    <button
                                        onClick={() => alert("Subir foto de evidencia (En desarrollo)")}
                                        style={{ background: '#edf2f7', border: '1px dashed #cbd5e0', padding: '0.5rem', width: '100%', borderRadius: '0.5rem', cursor: 'pointer', color: '#718096', fontSize: '0.9rem' }}
                                    >
                                        <FaPlus /> Subir Foto Evidencia
                                    </button>
                                </div>

                                <ActionButton
                                    onClick={async () => {
                                        if (selectedTask) {
                                            // Save observations first if any are typed (we are using description field state as a proxy for now, but should separate)
                                            // Actually, let's just complete it.
                                            const newStatus = selectedTask.status === 'done' ? 'pending' : 'done';
                                            // Ideally we save the observations to the 'observations' column, not description.
                                            // For now, let's just toggle status.
                                            await tasksService.updateTask(selectedTask.id, {
                                                observations: taskForm.description, // Saving the typed text as observations
                                                status: newStatus
                                            } as any);

                                            // Refresh
                                            if (id) {
                                                const updatedTasks = await tasksService.getTasksByRoomId(id);
                                                setTasks(updatedTasks);
                                            }
                                            setIsTaskModalOpen(false);
                                        }
                                    }}
                                    $variant={selectedTask?.status === 'done' ? 'primary' : 'success'}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                >
                                    {selectedTask?.status === 'done' ? 'Marcar como Pendiente' : 'Completa y Guardar'}
                                </ActionButton>
                            </div>
                        )}
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Day Summary Modal */}
            {isDaySummaryOpen && selectedDayForSummary && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsDaySummaryOpen(false) }}>
                    <ModalContent style={{ maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Resumen del {format(selectedDayForSummary, 'd MMMM yyyy', { locale: es })}</h3>
                            <button onClick={() => setIsDaySummaryOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>Tareas Asignadas</h4>
                            {tasks.filter(t => t.due_date && t.due_date.split('T')[0] === format(selectedDayForSummary, 'yyyy-MM-dd')).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {tasks.filter(t => t.due_date && t.due_date.split('T')[0] === format(selectedDayForSummary, 'yyyy-MM-dd')).map(t => (
                                        <div key={t.id} style={{
                                            border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem',
                                            background: t.status === 'done' ? '#f0fff4' : 'white',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{t.title}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                                                    <Badge taskType={t.type} style={{ marginRight: '0.5rem', fontSize: '0.65rem' }}>{t.type?.replace(/_/g, ' ')}</Badge>
                                                    Asignado a: {users.find(u => u.id === t.assigned_to)?.full_name || 'Nadie'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    title={t.status === 'done' ? "Marcar como pendiente" : "Marcar como completada"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleTaskStatus(t);
                                                    }}
                                                    style={{
                                                        background: t.status === 'done' ? '#48bb78' : 'white',
                                                        border: `1px solid ${t.status === 'done' ? '#48bb78' : '#cbd5e0'}`,
                                                        color: t.status === 'done' ? 'white' : '#cbd5e0',
                                                        borderRadius: '0.375rem',
                                                        padding: '0.4rem',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                        minWidth: '32px'
                                                    }}
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsDaySummaryOpen(false);
                                                        handleTaskClick({ stopPropagation: () => { } } as any, t);
                                                    }}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'white',
                                                        background: '#3182ce',
                                                        border: 'none',
                                                        borderRadius: '0.375rem',
                                                        padding: '0.4rem 0.8rem',
                                                        cursor: 'pointer',
                                                        fontWeight: '600',
                                                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    Ver / Editar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>No hay tareas para este día.</p>
                            )}
                        </div>

                        <div>
                            <h4 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>Registro Diario</h4>
                            <div style={{
                                border: '2px dashed #e2e8f0', borderRadius: '0.5rem', padding: '2rem',
                                textAlign: 'center', color: '#a0aec0'
                            }}>
                                <FaCalendarAlt style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p>No se cargaron fotos ni reportes diarios.</p>
                            </div>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Sticky Note Modal */}
            {isStickyModalOpen && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsStickyModalOpen(false) }}>
                    <ModalContent style={{ background: 'white', borderTop: '8px solid #ecc94b' }}>
                        <h3 style={{ color: '#2d3748', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaStickyNote color="#ecc94b" /> Nueva Nota
                        </h3>

                        <FormGroup>
                            <label>Mensaje</label>
                            <textarea
                                autoFocus
                                value={stickyContent}
                                onChange={e => setStickyContent(e.target.value)}
                                placeholder="Escribe tu nota aquí..."
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    minHeight: '120px',
                                    fontSize: '1rem',
                                    borderRadius: '0.5rem',
                                    padding: '1rem'
                                }}
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            {(['yellow', 'blue', 'pink', 'green'] as const).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setStickyColor(c)}
                                    style={{
                                        width: '30px', height: '30px', borderRadius: '50%',
                                        background: c === 'yellow' ? '#fefcbf' : c === 'blue' ? '#bee3f8' : c === 'pink' ? '#fed7d7' : '#c6f6d5',
                                        border: stickyColor === c ? '2px solid #4a5568' : '1px solid rgba(0,0,0,0.1)',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <CancelButton onClick={() => setIsStickyModalOpen(false)}>Cancelar</CancelButton>
                            <ActionButton onClick={handleSaveSticky} $variant="success" style={{ background: '#d69e2e', color: 'white' }}>
                                Pegar Nota
                            </ActionButton>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Sticky Delete Confirmation Modal */}
            {stickyToDelete && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setStickyToDelete(null) }}>
                    <ModalContent style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ color: '#e53e3e', fontSize: '3rem', marginBottom: '1rem' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¿Eliminar esta nota?</h3>
                        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                            Esta acción no se puede deshacer.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <CancelButton onClick={() => setStickyToDelete(null)}>
                                Cancelar
                            </CancelButton>
                            <ActionButton onClick={confirmDeleteSticky} $variant="danger">
                                Eliminar
                            </ActionButton>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Delete Confirmation Modal (Tasks) */}
            {isDeleteConfirmOpen && (
                <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteConfirmOpen(false) }}>
                    <ModalContent style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ color: '#e53e3e', fontSize: '3rem', marginBottom: '1rem' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¿Eliminar esta tarea?</h3>
                        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                            Esta acción no se puede deshacer. La tarea se eliminará permanentemente.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <CancelButton onClick={() => setIsDeleteConfirmOpen(false)}>
                                Cancelar
                            </CancelButton>
                            <ActionButton onClick={confirmDeleteTask} $variant="danger">
                                Sí, Eliminar
                            </ActionButton>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

        </Container>
    );
};

export default RoomDetail;
