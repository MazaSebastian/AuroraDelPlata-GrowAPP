import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { tasksService } from '../services/tasksService';
import { cropsService } from '../services/cropsService';
import { roomsService } from '../services/roomsService';
import { stickiesService } from '../services/stickiesService';
import { Crop } from '../types';
import { Room } from '../types/rooms';

import styled, { keyframes, css } from 'styled-components';

import {
  FaSeedling,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaStickyNote,
  FaPlus,
  FaTrash,
  FaClock
} from 'react-icons/fa';
import { WeatherWidget } from '../components/WeatherWidget';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LoadingSpinner } from '../components/LoadingSpinner';


// --- Styled Components (Premium Eco-Tech Theme) ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  padding-top: 5rem; // Space for TopNav
  background-color: #f8fafc;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const WelcomeHeader = styled.div`
  margin-bottom: 2.5rem;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1a202c;
    margin: 0;
    letter-spacing: -0.05rem;
    background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 1.1rem;
    color: #718096;
    margin-top: 0.5rem;
    font-weight: 500;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: #4a5568;
  font-size: 1rem;
  font-weight: 600;
  
  svg { color: #3182ce; }
`;

const KPISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const KPICard = styled.div<{ active?: boolean, alert?: boolean }>`
  background: white;
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border: 1px solid ${props => props.alert ? '#feb2b2' : '#edf2f7'};
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  /* Decorative accent line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: ${props => props.alert ? '#e53e3e' : props.active ? '#38a169' : '#cbd5e0'};
  }

  .icon-wrapper {
    display: inline-flex;
    padding: 0.75rem;
    border-radius: 1rem;
    background: ${props => props.alert ? '#fff5f5' : '#f0fff4'};
    color: ${props => props.alert ? '#c53030' : '#2f855a'};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .label {
    font-size: 0.875rem;
    color: #718096;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    margin: 0.25rem 0;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;

    .unit {
      font-size: 1rem;
      color: #a0aec0;
      font-weight: 500;
    }
  }

  .subtext {
    font-size: 0.8rem;
    color: ${props => props.alert ? '#e53e3e' : '#718096'};
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); }
`;

const CountdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

interface CountdownCardProps {
  stage: string;
  $alertLevel?: number; // 0: None, 1: Badge Red, 2: Border Red, 3: Heartbeat
}

const CountdownCard = styled.div<CountdownCardProps>`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-left: 5px solid ${p => p.stage === 'vegetation' ? '#48bb78' : p.stage === 'flowering' ? '#ed8936' : (p.stage === 'drying' || p.stage === 'curing') ? '#dd6b20' : '#cbd5e0'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;

  // Level 2 Alert: Red Border
  ${p => p.$alertLevel && p.$alertLevel >= 2 && css`
      border: 2px solid #e53e3e;
      border-left: 5px solid #e53e3e;
  `}

  // Level 3 Alert: Heartbeat
  ${p => p.$alertLevel && p.$alertLevel >= 3 && css`
      animation: ${heartbeat} 2s infinite;
  `}
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .room-name { font-weight: 700; color: #2d3748; font-size: 1.1rem; }
  
  .active-badges {
      display: flex; gap: 0.5rem;
  }

  .stage-badge { 
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 999px;
    background: ${p => p.stage === 'vegetation' ? '#c6f6d5' : p.stage === 'flowering' ? '#bee3f8' : (p.stage === 'drying' || p.stage === 'curing') ? '#fffaf0' : '#edf2f7'}; // Note: flowering usually warm colors, but let's distinguish.
    color: ${p => p.stage === 'vegetation' ? '#22543d' : p.stage === 'flowering' ? '#2c5282' : (p.stage === 'drying' || p.stage === 'curing') ? '#c05621' : '#4a5568'};
  }

  // Level 1 Alert: Red Badge for "Days Remaining"
  .warning-badge {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 999px;
      background: #fed7d7; color: #c53030; display: flex; align-items: center; gap: 0.25rem;
  }
  
  .countdown { font-size: 1.25rem; font-weight: 600; color: #4a5568; display: flex; align-items: center; gap: 0.5rem; }
  .days { font-size: 1.5rem; font-weight: 800; color: ${p => p.stage === 'vegetation' ? '#38a169' : p.stage === 'flowering' ? '#dd6b20' : (p.stage === 'drying' || p.stage === 'curing') ? '#c05621' : '#718096'}; margin: 0 4px; }
  
  .progress-bar {
    height: 6px; background: #edf2f7; border-radius: 3px; margin-top: 1rem; overflow: hidden;
  }
  .progress-fill {
    height: 100%; 
    background: ${p => p.stage === 'vegetation' ? '#48bb78' : p.stage === 'flowering' ? '#ed8936' : (p.stage === 'drying' || p.stage === 'curing') ? '#dd6b20' : '#cbd5e0'};
    border-radius: 3px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;





const AlertItem = styled.div`
  background: #fffaf0;
  border-left: 4px solid #ed8936;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: start;
  gap: 0.75rem;

  .icon { color: #ed8936; margin-top: 0.2rem; }
  
  .content {
    h5 { margin: 0; color: #744210; font-weight: 600; }
    p { margin: 0.25rem 0 0; color: #975a16; font-size: 0.85rem; }
  }
`;

const StickyBoard = styled.div`
  margin-bottom: 3rem;
`;

const StickyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StickyNoteCard = styled.div<{ color: string }>`
  background-color: ${p => {
    switch (p.color) {
      case 'yellow': return '#fff7cd';
      case 'blue': return '#d0f2ff';
      case 'pink': return '#ffe7ea';
      case 'green': return '#e3fce3';
      default: return '#fff7cd';
    }
  }};
  color: ${p => {
    switch (p.color) {
      case 'yellow': return '#7a4f01';
      case 'blue': return '#04297a';
      case 'pink': return '#7a0c2e';
      case 'green': return '#1a531b';
    }
  }};
  padding: 1.25rem;
  border-radius: 0 0 1rem 0;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.1);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02) rotate(1deg);
    z-index: 10;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
    background: rgba(0,0,0,0.05);
    border-radius: 0 0 0 30px;
  }

  .content {
    flex: 1;
    font-family: 'Segoe UI', 'Roboto', sans-serif;
    font-size: 1rem;
    white-space: pre-wrap;
    line-height: 1.5;
    font-weight: 500;
  }

  .footer {
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .delete-btn {
    opacity: 0;
    transition: opacity 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: 1rem;
  }

  &:hover .delete-btn {
    opacity: 1;
  }
`;

const AddStickyParams = styled.div`
  background: white;
  border: 2px dashed #cbd5e0;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  cursor: pointer;
  color: #a0aec0;
  transition: all 0.2s;

  &:hover {
    border-color: #4299e1;
    color: #4299e1;
    background: #ebf8ff;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  
  h3 { margin-top: 0; color: #2d3748; }
  
  textarea {
    width: 100%;
    height: 120px;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    margin: 1rem 0;
    font-size: 1rem;
    resize: none;
    &:focus { outline: none; border-color: #3182ce; }
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ColorOption = styled.button<{ color: string, selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${p => p.selected ? '#4a5568' : 'transparent'};
  cursor: pointer;
  background-color: ${p => {
    switch (p.color) {
      case 'yellow': return '#fff7cd';
      case 'blue': return '#d0f2ff';
      case 'pink': return '#ffe7ea';
      case 'green': return '#e3fce3';
      default: return '#fff';
    }
  }};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: ${p => p.selected ? 'scale(1.1)' : 'scale(1)'};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  background: ${p => p.variant === 'secondary' ? '#e2e8f0' : '#3182ce'};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;



const ActionButtonSmall = styled.button<{ type: 'success' | 'danger' }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.type === 'success' ? '#38a169' : '#e53e3e'};
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.type === 'success' ? '#c6f6d5' : '#fed7d7'};
  }
`;

const AlertActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
`;




// ... (existing imports)

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, crops, rooms, stickies, isLoading, refreshData, updateStickies, updateTasks } = useData();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Sticky Modal State
  const [isStickyModalOpen, setIsStickyModalOpen] = useState(false);
  const [newStickyContent, setNewStickyContent] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'blue' | 'pink' | 'green'>('yellow');

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle />;
      case 'info': return <FaCalendarCheck />;
      case 'danger': return <FaExclamationTriangle />;
      default: return <FaCheckCircle />;
    }
  };

  useEffect(() => {
    // Map DB tasks to UI alert format whenever tasks change
    const mappedAlerts = tasks.map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      message: t.description || '',
      icon: getIconForType(t.type)
    }));
    setAlerts(mappedAlerts);
  }, [tasks]);

  // Optional: Refresh data silently on mount to ensure freshness
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateSticky = async () => {
    if (!newStickyContent.trim()) return;
    const note = await stickiesService.createSticky(newStickyContent, newStickyColor);
    if (note) {
      updateStickies();
      setIsStickyModalOpen(false);
      setNewStickyContent('');
      setNewStickyColor('yellow');
    }
  };

  const handleDeleteSticky = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Borrar esta nota?')) return;
    const success = await stickiesService.deleteSticky(id);
    if (success) {
      updateStickies();
    }
  };

  const removeAlert = async (id: string, action: 'done' | 'dismissed') => {
    // Optimistic update
    setAlerts(prev => prev.filter(a => a.id !== id));
    const success = await tasksService.updateStatus(id, action);
    if (success) {
      updateTasks();
    } else {
      refreshData(); // Revert on failure
    }
  };

  const handleAction = (id: any, action: 'done' | 'dismissed') => {
    removeAlert(id, action);
  };

  const activeCrops = crops.filter(c => c.status === 'active');

  // Helper to calculate days since start (Stage mockup)


  if (isLoading) {
    return <LoadingSpinner text="Cargando panel..." fullScreen duration={3000} />;
  }

  return (
    <Container>
      <WelcomeHeader>
        <h1>Panel de Control</h1>
        <p>Bienvenido de nuevo, {user?.name || 'Cultivador'}. Aquí está el estado actual de tus cultivos.</p>
        <DateDisplay>
          <FaCalendarCheck />
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </DateDisplay>
      </WelcomeHeader>

      <StickyBoard>
        <SectionTitle><FaStickyNote /> Tablero de Notas (Stick-it)</SectionTitle>
        <StickyGrid>
          {stickies.map(note => (
            <StickyNoteCard key={note.id} color={note.color}>
              <div className="content">{note.content}</div>
              <div className="footer">
                <span>{note.created_by || 'Anónimo'} • {new Date(note.created_at).toLocaleDateString()}</span>
                <button className="delete-btn" onClick={(e) => handleDeleteSticky(note.id, e)}><FaTrash /></button>
              </div>
            </StickyNoteCard>
          ))}
          <AddStickyParams onClick={() => setIsStickyModalOpen(true)}>
            <FaPlus size={24} />
            <span style={{ marginTop: '0.5rem', fontWeight: 600 }}>Nueva Nota</span>
          </AddStickyParams>
        </StickyGrid>
      </StickyBoard>

      {/* Sticky Modal */}
      {isStickyModalOpen && (
        <ModalOverlay onClick={() => setIsStickyModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Nueva Nota Adhesiva</h3>
            <ColorPicker>
              {['yellow', 'blue', 'pink', 'green'].map(c => (
                <ColorOption
                  key={c}
                  color={c}
                  selected={newStickyColor === c}
                  onClick={() => setNewStickyColor(c as any)}
                />
              ))}
            </ColorPicker>
            <textarea
              placeholder="Escribe tu recordatorio aquí..."
              value={newStickyContent}
              onChange={e => setNewStickyContent(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsStickyModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateSticky}>Pegar Nota</Button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      <WeatherWidget />

      {/* Stage Countdowns */}
      {rooms.some(r => (r.type === 'vegetation' || r.type === 'flowering') && r.start_date) && (
        <StickyBoard>
          <SectionTitle><FaClock style={{ color: '#805ad5' }} /> Próximos Cambios de Etapa</SectionTitle>
          <CountdownGrid>
            {rooms
              .filter(r => (r.type === 'vegetation' || r.type === 'flowering') && r.start_date)
              .map(room => {
                // Calculation Logic
                const startDate = new Date(room.start_date!);
                const activeBatch = room.batches?.find(b => b.genetic); // Heuristic: use first batch with genetic info
                const genetic = activeBatch?.genetic;

                // Defaults if no genetic info (fallback to standard 4 weeks veg / 9 weeks flora)
                const vegWeeks = genetic?.vegetative_weeks || 4;
                const floraWeeks = genetic?.flowering_weeks || 9;

                let totalDays = 0;

                if (room.type === 'vegetation') {
                  totalDays = vegWeeks * 7;
                } else {
                  totalDays = floraWeeks * 7;
                }

                const daysElapsed = differenceInDays(new Date(), startDate);
                const daysRemaining = totalDays - daysElapsed;
                const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

                // ALERT LOGIC
                let alertLevel = 0;
                if (daysRemaining <= 3) alertLevel = 3;      // Heartbeat
                else if (daysRemaining <= 5) alertLevel = 2; // Red Border
                else if (daysRemaining <= 7) alertLevel = 1; // Red Badge only

                return (
                  <CountdownCard key={room.id} stage={room.type} $alertLevel={alertLevel}>
                    <div className="header">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="room-name">{room.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 500 }}>
                          {crops.find(c => c.id === room.spot_id)?.name || 'Sin Crop Asignado'}
                        </span>
                      </div>
                      <div className="active-badges">
                        {alertLevel >= 1 && (
                          <span className="warning-badge">
                            <FaExclamationTriangle /> Faltan {Math.max(0, daysRemaining)} días
                          </span>
                        )}
                        <span className="stage-badge">{room.type === 'vegetation' ? 'Vegetativo' : 'Floración'}</span>
                      </div>
                    </div>

                    <div className="countdown">
                      Van <span className="days">{daysElapsed}</span> días de {room.type === 'vegetation' ? 'Vegetativo' : 'Floración'}
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.5rem', textAlign: 'right' }}>
                      Base: {genetic?.name || 'Genética Estándar'} ({room.type === 'vegetation' ? vegWeeks : floraWeeks} sem)
                    </div>
                  </CountdownCard>
                );
              })}
          </CountdownGrid>
        </StickyBoard>
      )}

      <KPISection>
        <Link to="/crops" style={{ textDecoration: 'none', color: 'inherit' }}>
          <KPICard active>
            <div className="icon-wrapper"><FaSeedling /></div>
            <div className="label">Cultivos Activos</div>
            <div className="value">{activeCrops.length} <span className="unit">variedades</span></div>
            <div className="subtext"><FaChartLine /> En curso</div>
          </KPICard>
        </Link>

        {/* Removed Temperature and Humidity cards as requested */}

        <KPICard alert>
          <div className="icon-wrapper"><FaExclamationTriangle /></div>
          <div className="label">Alertas</div>
          <div className="value">{alerts.length} <span className="unit">pendientes</span></div>

          <div className="subtext">Requiere atención</div>
        </KPICard>
      </KPISection>






      <ContentGrid>


        <div>
          <SectionTitle><FaExclamationTriangle /> Alertas & Tareas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {alerts.map(alert => (
              <AlertItem key={alert.id} style={alert.type === 'info' ? { background: '#ebf8ff', borderLeftColor: '#4299e1' } : {}}>
                <div className="icon" style={alert.type === 'info' ? { color: '#4299e1' } : {}}>{alert.icon}</div>
                <div className="content">
                  <h5 style={alert.type === 'info' ? { color: '#2b6cb0' } : {}}>{alert.title}</h5>
                  <p style={alert.type === 'info' ? { color: '#2c5282' } : {}}>{alert.message}</p>
                </div>
                <AlertActions>
                  <ActionButtonSmall type="success" onClick={() => handleAction(alert.id, 'done')} title="Marcar como realizado">
                    <FaCheck />
                  </ActionButtonSmall>
                  <ActionButtonSmall type="danger" onClick={() => handleAction(alert.id, 'dismissed')} title="Descartar">
                    <FaTrash />
                  </ActionButtonSmall>
                </AlertActions>

              </AlertItem>
            ))}

            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0', background: 'white', borderRadius: '0.5rem' }}>
                <FaCheckCircle style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#38a169' }} />
                <p>¡Todo al día!</p>
              </div>
            )}


          </div>
        </div>
      </ContentGrid>
    </Container>
  );
};

export default Dashboard;
