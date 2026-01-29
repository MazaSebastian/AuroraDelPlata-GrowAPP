import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tasksService } from '../services/tasksService';
import { cropsService } from '../services/cropsService';
import { Task, Crop } from '../types';

import styled from 'styled-components';

import {
  FaSeedling,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaLeaf,
  FaChartLine,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaStickyNote,
  FaPlus,
  FaTrash
} from 'react-icons/fa';
import { WeatherWidget } from '../components/WeatherWidget';
import { stickiesService } from '../services/stickiesService';
import { useAuth } from '../context/AuthContext';


// --- Styled Components (Premium Eco-Tech Theme) ---

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  padding-top: 5rem; // Space for TopNav
  background-color: #f8fafc;
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

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const MainCard = styled.div`
  background: white;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
`;

const CropRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #edf2f7;

  &:last-child {
    border-bottom: none;
  }

  .crop-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    .crop-icon {
      width: 48px;
      height: 48px;
      background: #c6f6d5;
      color: #2f855a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .details {
      h4 { margin: 0; color: #2d3748; font-size: 1rem; font-weight: 600; }
      p { margin: 0; color: #718096; font-size: 0.85rem; }
    }
  }

  .crop-stats {
    display: flex;
    gap: 1.5rem;
    
    .stat {
      text-align: right;
      .val { font-weight: 600; color: #2d3748; }
      .lbl { font-size: 0.75rem; color: #a0aec0; }
    }
  }

  .status-badge {
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #e6fffa;
    color: #2c7a7b;

    &.warning { background: #fffaf0; color: #c05621; }
    &.danger { background: #fff5f5; color: #c53030; }
  }
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


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [stickies, setStickies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sticky Modal State
  const [isStickyModalOpen, setIsStickyModalOpen] = useState(false);
  const [newStickyContent, setNewStickyContent] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'blue' | 'pink' | 'green'>('yellow');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasks, loadedCrops, loadedStickies] = await Promise.all([
        tasksService.getPendingTasks(),
        cropsService.getCrops(),
        stickiesService.getStickies()
      ]);

      // Map DB tasks to UI alert format
      const mappedAlerts = tasks.map(t => ({
        id: t.id,
        type: t.type,
        title: t.title,
        message: t.description || '',
        icon: getIconForType(t.type)
      }));
      setAlerts(mappedAlerts);
      setCrops(loadedCrops);
      setStickies(loadedStickies);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSticky = async () => {
    if (!newStickyContent.trim()) return;
    const note = await stickiesService.createSticky(newStickyContent, newStickyColor);
    if (note) {
      setStickies(prev => [note, ...prev]);
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
      setStickies(prev => prev.filter(s => s.id !== id));
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle />;
      case 'info': return <FaCalendarCheck />;
      case 'danger': return <FaExclamationTriangle />;
      default: return <FaCheckCircle />;
    }
  };

  const removeAlert = async (id: string, action: 'done' | 'dismissed') => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    const success = await tasksService.updateStatus(id, action);
    if (!success) loadData();
  };

  const handleAction = (id: any, action: 'done' | 'dismissed') => {
    removeAlert(id, action);
  };

  const activeCrops = crops.filter(c => c.status === 'active');

  // Helper to calculate days since start (Stage mockup)
  const getStage = (dateStr: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    return `Día ${days}`;
  };

  return (
    <Container>
      <WelcomeHeader>
        <h1>Panel de Control</h1>
        <p>Bienvenido de nuevo, {user?.name || 'Cultivador'}. Aquí está el estado actual de tus cultivos.</p>
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
                    <FaTimes />
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
