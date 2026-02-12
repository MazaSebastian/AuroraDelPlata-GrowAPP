import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaDna, FaPlus, FaClock, FaCalendarAlt, FaLeaf, FaEdit, FaTrash, FaTag } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { Genetic, GeneticType } from '../types/genetics';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
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
    background: linear-gradient(135deg, #6b46c1 0%, #805ad5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const CreateButton = styled.button`
  background: #805ad5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #6b46c1;
    transform: translateY(-2px);
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  .value {
    font-size: 2.5rem;
    font-weight: 800;
    color: #2d3748;
    line-height: 1;
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    color: #805ad5;
  }
`;

const GeneticCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #edf2f7;
`;

const CardHeader = styled.div`
  background: #f7fafc;
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.1rem;
  }
`;



const CardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #4a5568;
  font-size: 0.95rem;

  svg { color: #805ad5; }
  strong { margin-right: 0.25rem; }
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
  input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.95rem; }
  .hint { font-size: 0.8rem; color: #718096; margin-top: 0.25rem; }
`;

const Genetics: React.FC = () => {
    const [genetics, setGenetics] = useState<Genetic[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGenetic, setNewGenetic] = useState<Partial<Genetic>>({
        name: '',
        nomenclatura: '',
        type: 'photoperiodic',
        vegetative_weeks: 4,
        flowering_weeks: 9,
        description: ''
    });

    useEffect(() => {
        loadGenetics();
    }, []);

    const loadGenetics = async () => {
        setLoading(true);
        try {
            const data = await geneticsService.getGenetics();
            setGenetics(data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Delete Modal State
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [geneticToDelete, setGeneticToDelete] = useState<Genetic | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    const handleEdit = (genetic: Genetic) => {
        setEditingId(genetic.id);
        setNewGenetic(genetic);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (genetic: Genetic) => {
        setGeneticToDelete(genetic);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!geneticToDelete) return;

        const success = await geneticsService.deleteGenetic(geneticToDelete.id);
        if (success) {
            setGenetics(genetics.filter(g => g.id !== geneticToDelete.id));
            setConfirmDeleteOpen(false);
            setGeneticToDelete(null);
        }
    };

    const handleSave = async () => {
        if (!newGenetic.name) return;

        const geneticData = {
            name: newGenetic.name,
            nomenclatura: newGenetic.nomenclatura, // Added missing field
            type: newGenetic.type as GeneticType,
            vegetative_weeks: newGenetic.vegetative_weeks || 0,
            flowering_weeks: newGenetic.flowering_weeks || 0,
            description: newGenetic.description || '',
            acquisition_date: newGenetic.acquisition_date,
            thc_percent: newGenetic.thc_percent,
            cbd_percent: newGenetic.cbd_percent,
            estimated_yield_g: newGenetic.estimated_yield_g,
            default_price_per_gram: newGenetic.default_price_per_gram
        };

        if (editingId) {
            const success = await geneticsService.updateGenetic(editingId, geneticData);
            if (success) {
                setGenetics(genetics.map(g => g.id === editingId ? { ...g, ...geneticData } : g));
                closeModal();
            }
        } else {
            const created = await geneticsService.createGenetic(geneticData);
            if (created) {
                setGenetics([...genetics, created]);
                closeModal();
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setNewGenetic({
            name: '',
            type: 'photoperiodic',
            vegetative_weeks: 4,
            flowering_weeks: 9,
            description: '',
            acquisition_date: '',
            thc_percent: 0,
            cbd_percent: 0,
            estimated_yield_g: 0
        });
    };

    if (loading) return <LoadingSpinner text="Cargando madres..." fullScreen />;

    return (
        <Container>
            <Header>
                <h1><FaDna /> Gestión de Madres</h1>
                <CreateButton onClick={() => setIsModalOpen(true)}>
                    <FaPlus /> Nueva Madre
                </CreateButton>
            </Header>

            <StatsGrid>
                <StatCard>
                    <div className="icon-wrapper">
                        <FaDna size={20} />
                        <h3>Total de Genéticas</h3>
                    </div>
                    <div className="value">{genetics.length}</div>
                </StatCard>
            </StatsGrid>

            <ContentGrid>
                {genetics.map(gen => (
                    <GeneticCard key={gen.id}>
                        <CardHeader>
                            <h3>{gen.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleEdit(gen)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4299e1', padding: '0.25rem' }}
                                    title="Editar"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(gen)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e53e3e', padding: '0.25rem' }}
                                    title="Eliminar"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <Stat>
                                <FaLeaf /> <strong>Vege:</strong> {gen.vegetative_weeks} semanas
                            </Stat>
                            <Stat>
                                <FaClock /> <strong>Flora:</strong> {gen.flowering_weeks} semanas
                            </Stat>
                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #edf2f7', fontSize: '0.85rem', color: '#718096' }}>
                                <FaCalendarAlt style={{ marginRight: '0.5rem', color: '#a0aec0' }} />
                                Ciclo Total Est.: {gen.vegetative_weeks + gen.flowering_weeks} semanas
                            </div>
                            {gen.description && (
                                <p style={{ fontSize: '0.85rem', color: '#718096', margin: 0 }}>{gen.description}</p>
                            )}
                            {gen.acquisition_date && (
                                <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                    Inicio: {gen.acquisition_date.split('-').reverse().join('/')}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {(gen.thc_percent !== undefined) && (
                                    <span style={{ fontSize: '0.7rem', background: '#f0fff4', color: '#276749', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                        THC: {gen.thc_percent}%
                                    </span>
                                )}
                                {(gen.cbd_percent !== undefined) && (
                                    <span style={{ fontSize: '0.7rem', background: '#ebf8ff', color: '#2c5282', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                        CBD: {gen.cbd_percent}%
                                    </span>
                                )}
                                {(gen.estimated_yield_g !== undefined) && (
                                    <span style={{ fontSize: '0.7rem', background: '#fff5f5', color: '#9b2c2c', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                        Prod: {gen.estimated_yield_g}g
                                    </span>
                                )}
                                {gen.default_price_per_gram && (
                                    <span style={{ fontSize: '0.7rem', background: '#fffaf0', color: '#b7791f', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        <FaTag size={10} /> ${gen.default_price_per_gram}/g
                                    </span>
                                )}
                            </div>
                        </CardBody>
                    </GeneticCard>
                ))}
            </ContentGrid>

            {isModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <h2>{editingId ? 'Editar Madre' : 'Nueva Madre'}</h2>

                        <FormGroup>
                            <label>Nombre</label>
                            <input
                                type="text"
                                value={newGenetic.name}
                                onChange={e => setNewGenetic({ ...newGenetic, name: e.target.value })}
                                placeholder="Ej: Gorilla Glue #4"
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Nomenclatura (Código)</label>
                            <input
                                type="text"
                                value={newGenetic.nomenclatura || ''}
                                onChange={e => setNewGenetic({ ...newGenetic, nomenclatura: e.target.value })}
                                placeholder="Ej: GG4"
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Fecha de inicio</label>
                            <input
                                type="date"
                                value={newGenetic.acquisition_date || ''}
                                onChange={e => setNewGenetic({ ...newGenetic, acquisition_date: e.target.value })}
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Prod. Est. (g)</label>
                                <input
                                    type="number"
                                    value={newGenetic.estimated_yield_g || ''}
                                    onChange={e => setNewGenetic({ ...newGenetic, estimated_yield_g: parseFloat(e.target.value) })}
                                    placeholder="Ej: 500"
                                />
                            </FormGroup>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FormGroup style={{ flex: 1 }}>
                                <label>% THC (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newGenetic.thc_percent || ''}
                                    onChange={e => setNewGenetic({ ...newGenetic, thc_percent: parseFloat(e.target.value) })}
                                    placeholder="Ej: 22.5"
                                />
                            </FormGroup>
                            <FormGroup style={{ flex: 1 }}>
                                <label>% CBD (Opcional)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={newGenetic.cbd_percent || ''}
                                    onChange={e => setNewGenetic({ ...newGenetic, cbd_percent: parseFloat(e.target.value) })}
                                    placeholder="Ej: 0.5"
                                />
                            </FormGroup>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Semanas Vege</label>
                                <input
                                    type="number"
                                    value={newGenetic.vegetative_weeks}
                                    onChange={e => setNewGenetic({ ...newGenetic, vegetative_weeks: parseInt(e.target.value) })}
                                />
                                <div className="hint">Desde semilla hasta cambio de ciclo</div>
                            </FormGroup>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Semanas Flora</label>
                                <input
                                    type="number"
                                    value={newGenetic.flowering_weeks}
                                    onChange={e => setNewGenetic({ ...newGenetic, flowering_weeks: parseInt(e.target.value) })}
                                />
                                <div className="hint">Duración de la fase de floración</div>
                            </FormGroup>
                        </div>

                        <FormGroup>
                            <label>Descripción / Notas</label>
                            <textarea
                                rows={3}
                                value={newGenetic.description}
                                onChange={e => setNewGenetic({ ...newGenetic, description: e.target.value })}
                                placeholder="Información adicional..."
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={closeModal}
                                style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                style={{ padding: '0.75rem 1.5rem', background: '#805ad5', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {editingId ? 'Actualizar' : 'Guardar Madre'}
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Eliminar Madre"
                message={`¿Estás seguro de que deseas eliminar la madre "${geneticToDelete?.name}"? Esta acción no se puede deshacer.`}
                onClose={() => setConfirmDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                confirmText="Eliminar"
                isDanger
            />
        </Container>
    );
};

export default Genetics;
