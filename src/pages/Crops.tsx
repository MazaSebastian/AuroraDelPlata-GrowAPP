import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  FaSeedling,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaEdit,
  FaTrash
} from 'react-icons/fa';
import { dailyLogsService } from '../services/dailyLogsService';
import { cropsService } from '../services/cropsService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Crop } from '../types';
import { PromptModal } from '../components/PromptModal';
import { DeleteProtectionModal } from '../components/DeleteProtectionModal';
import { ColorPickerModal } from '../components/ColorPickerModal';
import { FaPalette } from 'react-icons/fa';
import { ToastModal } from '../components/ToastModal';



const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f8fafc;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  h1 {
    font-size: 2rem;
    font-weight: 800;
    color: #1a202c;
    letter-spacing: -0.05rem;
    background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  align-items: flex-start;
`;

const Card = styled.div<{ forceHover?: boolean }>`
  background: white;
  border-radius: 1.25rem;
  overflow: hidden;
  box-shadow: ${p => p.forceHover ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)'};
  border: 1px solid #edf2f7;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  transform: ${p => p.forceHover ? 'translateY(-4px)' : 'none'};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  padding: 1.25rem;
  background: #f0fff4;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .icon {
    width: 40px;
    height: 40px;
    background: white;
    color: #38a169;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .title {
    font-weight: 700;
    color: #2d3748;
    font-size: 1.1rem;
  }
`;

const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-size: 0.9rem;

  svg { color: #a0aec0; }
`;

const Badge = styled.span<{ variant?: 'green' | 'yellow' | 'gray' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  background: ${p => p.variant === 'green' ? '#c6f6d5' : p.variant === 'yellow' ? '#fefcbf' : '#edf2f7'};
  color: ${p => p.variant === 'green' ? '#22543d' : p.variant === 'yellow' ? '#744210' : '#4a5568'};
  text-transform: uppercase;
  letter-spacing: 0.05em;
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


const ModalOverlay = styled.div<{ isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const ModalContent = styled.div<{ isClosing?: boolean }>`
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;

  h2 {
    margin-top: 0;
    color: #2d3748;
    margin-bottom: 1.5rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #4a5568;
    font-weight: 500;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.variant === 'secondary' ? '#e2e8f0' : 'transparent'};
  background: ${p => p.variant === 'secondary' ? 'white' : '#38a169'};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.variant === 'secondary' ? '#f7fafc' : '#2f855a'};
  }
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
    border-color: #48bb78;
    color: #48bb78;
    background: #f0fff4;
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

const Crops: React.FC = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  // Toast State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingCreate, setIsClosingCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // New state for creation loading
  const [lastActivityMap, setLastActivityMap] = useState<Record<string, string>>({});

  // New Crop Form State
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    estimatedHarvestDate: '',
    location: '',
    color: 'green',
    geneticId: ''
  });

  const loadLastActivities = React.useCallback(async (cropsData: Crop[]) => {
    const activityMap: Record<string, string> = {};

    await Promise.all(cropsData.map(async (crop) => {
      // Fetch tasks and logs in parallel for this crop
      const [tasks, logs] = await Promise.all([
        import('../services/tasksService').then(m => m.tasksService.getTasksByCropId(crop.id)),
        dailyLogsService.getLogsByCropId(crop.id)
      ]);

      const doneTasks = tasks.filter(t => t.status === 'done');

      let maxDate = 0;

      doneTasks.forEach(t => {
        let dateStr = t.due_date || t.created_at;
        // If it looks like a simple date (YYYY-MM-DD), force it to noon to avoid timezone back-shift
        if (dateStr && dateStr.length === 10) {
          dateStr += 'T12:00:00';
        }
        const d = new Date(dateStr).getTime();
        if (d > maxDate) maxDate = d;
      });

      logs.forEach(l => {
        let dateStr = l.date;
        if (dateStr && dateStr.length === 10) {
          dateStr += 'T12:00:00';
        }
        const d = new Date(dateStr).getTime();
        if (d > maxDate) maxDate = d;
      });

      if (maxDate > 0) {
        activityMap[crop.id] = new Date(maxDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }));

    setLastActivityMap(activityMap);
  }, []);

  const loadCrops = React.useCallback(async (isInitial = false, silent = false) => {
    if (!silent) setLoading(true);

    const fetchPromise = async () => {
      const data = await cropsService.getCrops();
      await loadLastActivities(data);
      return data;
    };

    const minTimePromise = isInitial
      ? new Promise(resolve => setTimeout(resolve, 1500))
      : Promise.resolve();

    const [data] = await Promise.all([
      fetchPromise(),
      minTimePromise
    ]);

    setCrops(data);
    if (!silent) setLoading(false);
  }, [loadLastActivities]);

  // Load initial data
  // Using useState + useEffect instead of useMemo to allow async fetching
  React.useEffect(() => {
    loadCrops(true);
  }, [loadCrops]);



  const handleCreate = async () => {
    if (!formData.name) {
      setToastMessage("Por favor ingresa un nombre para el Cultivo.");
      setToastType('info');
      setToastOpen(true);
      return;
    }

    try {
      setIsCreating(true);
      // Default values for simplified "Spot" creation
      const normalizedDate = new Date(); // Current date as default start
      normalizedDate.setHours(12, 0, 0, 0);

      const newCrop = await cropsService.createCrop({
        name: formData.name,
        location: 'Cultivo General', // Default location
        startDate: normalizedDate.toISOString(),
        estimatedHarvestDate: undefined,
        color: 'green' // Default color
      });

      if (newCrop) {
        setCrops(prev => [newCrop, ...prev]);
        setIsClosingCreate(true); // Trigger exit animation
        setFormData({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          estimatedHarvestDate: '',
          location: '',
          color: 'green',
          geneticId: ''
        });
        setToastMessage("Cultivo creado exitosamente!");
        setToastType('success');
        setToastAnimate(true);
        setToastOpen(true);
      } else {
        setToastMessage("Error al crear el cultivo. El servicio devolvió null.");
        setToastType('error');
        setToastOpen(true);
      }
    } catch (error: any) {
      console.error("Error creating spot:", error);
      setToastMessage(`Ocurrió un error al crear el cultivo: ${error.message || JSON.stringify(error)}`);
      setToastType('error');
      setToastAnimate(true);
      setToastOpen(true);
    } finally {
      setIsCreating(false);
    }
  };

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastAnimate, setToastAnimate] = useState(true);

  const handleDeleteCrop = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setCropToDelete({ id, name, location: '', startDate: '', status: 'active', partners: [], photoUrl: '' }); // Minimal crop obj
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cropToDelete) return;

    setIsDeleting(true);
    const success = await cropsService.deleteCrop(cropToDelete.id);
    setIsDeleting(false);

    if (success) {
      loadCrops(false, true); // Silent reload
      setConfirmOpen(false);

      // Show Success Toast
      setToastMessage(`El cultivo "${cropToDelete.name}" ha sido eliminado correctamente.`);
      setToastType('success');
      setToastAnimate(false); // Disable animation for smooth transition
      setToastOpen(true);

      setCropToDelete(null);
    } else {
      // Show Error Toast instead of alert
      setToastMessage("Error al eliminar el Cultivo. Inténtalo de nuevo.");
      setToastType('error');
      setToastAnimate(true);
      setToastOpen(true);
    }
  };

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

  const handleEditCropName = (e: React.MouseEvent, crop: Crop) => {
    e.stopPropagation();
    setEditingCrop(crop);
    setIsEditOpen(true);
  };

  const handleSaveCropName = async (newName: string) => {
    if (!editingCrop || !newName.trim()) return;

    const success = await cropsService.updateCrop(editingCrop.id, { name: newName });
    if (success) {
      loadCrops(false, true); // Silent reload
      setIsEditOpen(false);
      setEditingCrop(null);
    } else {
      alert("Error al renombrar el Spot.");
    }
  };

  // Color Picker State
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [cropForColor, setCropForColor] = useState<Crop | null>(null);

  const handleOpenColorPicker = (e: React.MouseEvent, crop: Crop) => {
    e.stopPropagation();
    setCropForColor(crop);
    setColorPickerOpen(true);
  };

  const handleUpdateColor = async (color: string) => {
    if (!cropForColor) return;
    const success = await cropsService.updateCrop(cropForColor.id, { color });
    if (success) {
      loadCrops(false, true); // Silent reload
      // Modal closes automatically in ColorPickerModal onSelect calls (or we can close it here if we change the component logic)
      // But component calls onClose only if we didn't pass logic inside.
      // Wait, my component calls onSelectColor then onClose.
    } else {
      alert("Error al actualizar el color.");
    }
    // Actually my component calls onSelectColor then onClose?
    // Let's check the component code I just wrote.
    // Yes: onClick={() => { onSelectColor(color); onClose(); }} in the component.
    // So I don't need to manually close it here if I just want to rely on that.
    // BUT, usually it is better to control it:
    // Let's assume onSelectColor does the logic.
  };

  const availableColors = ['green', 'blue', 'purple', 'orange', 'red', 'pink', 'teal', 'cyan', 'yellow', 'gray'];

  const statusVariant = (s: Crop['status']): 'green' | 'yellow' | 'gray' => {
    if (s === 'active') return 'green';
    if (s === 'paused') return 'yellow';
    return 'gray';
  };



  const navigate = useNavigate();

  const handleCardClick = (id: string) => {
    navigate(`/crops/${id}`);
  };

  if (loading) {
    return <LoadingSpinner text="Cargando tus cultivos..." fullScreen duration={1500} />;
  }

  return (
    <Container>
      <Header>
        <h1>Cultivos</h1>

      </Header>

      <Grid>
        {crops.map((crop) => (
          <Card
            key={crop.id}
            onClick={() => handleCardClick(crop.id)}
            forceHover={
              editingCrop?.id === crop.id ||
              cropToDelete?.id === crop.id ||
              cropForColor?.id === crop.id
            }
            style={{ cursor: 'pointer', borderTop: `4px solid ${getColorHex(crop.color)}` }}
          >
            <CardHeader style={{ background: `${getColorHex(crop.color)}15`, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="icon" style={{ color: getColorHex(crop.color) }}><FaSeedling /></div>
                <div className="title">{crop.name}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={(e) => handleOpenColorPicker(e, crop)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: '0.25rem', display: 'flex' }}
                  title="Cambiar Color"
                >
                  <FaPalette />
                </button>
                <button
                  onClick={(e) => handleEditCropName(e, crop)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: '0.25rem', display: 'flex' }}
                  title="Editar Nombre"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => handleDeleteCrop(e, crop.id, crop.name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096', padding: '0.25rem', display: 'flex' }}
                  title="Eliminar Spot"
                >
                  <FaTrash />
                </button>
              </div>
            </CardHeader>
            <CardBody>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={statusVariant(crop.status)}>{crop.status}</Badge>
              </div>



              {crop.estimatedHarvestDate && (
                <InfoRow>
                  <FaCalendarAlt /> Fin Previsto: {new Date(crop.estimatedHarvestDate).toLocaleDateString('es-AR')}
                </InfoRow>
              )}
              <InfoRow style={{ marginTop: '0.5rem', borderTop: '1px solid #edf2f7', paddingTop: '0.5rem' }}>
                <FaClock /> Última actividad: {lastActivityMap[crop.id] || '-'}
              </InfoRow>

              {/* Rooms Summary */}
              {crop.rooms && crop.rooms.length > 0 && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #edf2f7', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(() => {
                    const vegeCount = crop.rooms.filter(r => r.type === 'vegetation').length;
                    const floraCount = crop.rooms.filter(r => r.type === 'flowering').length;
                    const dryingCount = crop.rooms.filter(r => r.type === 'drying').length;
                    // Using filter directly on type

                    return (
                      <>
                        {vegeCount > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#f0fff4', color: '#2f855a', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {vegeCount} Vege
                          </span>
                        )}
                        {floraCount > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#fffaf0', color: '#dd6b20', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {floraCount} Flora
                          </span>
                        )}
                        {dryingCount > 0 && (
                          <span style={{ fontSize: '0.75rem', background: '#e6fffa', color: '#38b2ac', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {dryingCount} Secado
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {/* Add New Crop Card */}
        <CreateCard onClick={() => setIsModalOpen(true)}>
          <DashedCircle>
            <FaPlus />
          </DashedCircle>
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'inherit', textAlign: 'center', padding: '0 1rem' }}>Haz click aquí para crear un nuevo cultivo</span>
        </CreateCard>


      </Grid>

      {/* Create Modal */}
      {(isModalOpen || isClosingCreate) && (
        <ModalOverlay
          isClosing={isClosingCreate}
          onAnimationEnd={() => {
            if (isClosingCreate) {
              setIsClosingCreate(false);
              setIsModalOpen(false);
            }
          }}
        >
          <ModalContent isClosing={isClosingCreate}>
            <h2>Nuevo Cultivo</h2>

            <FormGroup>
              <label>Nombre del Cultivo</label>
              <input
                type="text"
                placeholder="Complete el nombre de su cultivo (Ej: Locación)"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
              <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Aquí deberás listar tu cultivo como locación de cultivo, por ejemplo: <strong>Cultivo casa</strong>
              </p>
            </FormGroup>

            <ModalActions>
              <Button variant="secondary" onClick={() => setIsClosingCreate(true)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? 'Creando...' : 'Crear Cultivo'}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
      {/* Prompt Modal for Renaming */}
      <PromptModal
        isOpen={isEditOpen}
        title="Renombrar Cultivo"
        initialValue={editingCrop?.name}
        placeholder="Nombre del Cultivo"
        onClose={() => setIsEditOpen(false)}
        onConfirm={handleSaveCropName}
        confirmButtonColor="green"
      />

      {/* Confirm Delete Modal (Protected) */}
      <DeleteProtectionModal
        isOpen={confirmOpen}
        itemType="Cultivo"
        itemName={cropToDelete?.name || ''}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />

      {/* Color Picker Modal */}
      <ColorPickerModal
        isOpen={colorPickerOpen}
        title={`Color para ${cropForColor?.name || 'Spot'}`}
        colors={availableColors}
        selectedColor={cropForColor?.color}
        onSelectColor={handleUpdateColor}
        onClose={() => setColorPickerOpen(false)}
        getColorHex={getColorHex}
      />

      <ToastModal
        isOpen={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
        animateOverlay={toastAnimate}
      />
    </Container >
  );
};

export default Crops;
