import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { extractionsService } from '../services/extractionsService';
import { dispensaryService, DispensaryBatch } from '../services/dispensaryService';
import { Extraction } from '../types/extractions';
import { ExtractionForm } from '../components/Extractions/ExtractionForm';
import { ExtractionDetails } from '../components/Extractions/ExtractionDetails';
import { ConfirmationModal } from '../components/ConfirmationModal';

import { FaFlask, FaPlus, FaCalendarAlt, FaWeightHanging, FaTrash, FaEye, FaEdit, FaLeaf, FaBoxOpen } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const LaboratoryPage: React.FC = () => {
    const [extractions, setExtractions] = useState<Extraction[]>([]);
    const [rawMaterials, setRawMaterials] = useState<DispensaryBatch[]>([]);

    // Tab State
    const [activeTab, setActiveTab] = useState<'raw' | 'processed'>('raw');

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
    const [editingExtraction, setEditingExtraction] = useState<Extraction | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'extraction' } | null>(null);

    const [loading, setLoading] = useState(true);

    const [selectedRawBatch, setSelectedRawBatch] = useState<DispensaryBatch | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [extData, batchesData] = await Promise.all([
            extractionsService.getExtractions(),
            dispensaryService.getBatches()
        ]);

        setExtractions(extData);
        // Filter for batches in 'Laboratorio'
        const labBatches = batchesData.filter(b => b.location === 'Laboratorio' && b.current_weight > 0);
        setRawMaterials(labBatches);

        setLoading(false);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setItemToDelete({ id, type: 'extraction' });
    }

    const confirmDelete = async () => {
        if (itemToDelete) {
            await extractionsService.deleteExtraction(itemToDelete.id);
            setItemToDelete(null);
            loadData();
        }
    };

    const handleEdit = (ext: Extraction, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingExtraction(ext);
        setSelectedRawBatch(null); // Ensure no raw batch is selected when editing existing
        setIsFormOpen(true);
    };

    const handleProcess = (batch: DispensaryBatch) => {
        setSelectedRawBatch(batch);
        setEditingExtraction(null);
        setIsFormOpen(true);
    };

    const handleCreateDirect = () => {
        setSelectedRawBatch(null);
        setEditingExtraction(null);
        setIsFormOpen(true);
    };

    return (
        <Container>
            <Header>
                <Title>
                    <FaFlask size={24} color="#805ad5" />
                    Laboratorio
                </Title>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <TabButton $active={activeTab === 'raw'} onClick={() => setActiveTab('raw')}>
                        <FaLeaf /> Materia Prima ({rawMaterials.length})
                    </TabButton>
                    <TabButton $active={activeTab === 'processed'} onClick={() => setActiveTab('processed')}>
                        <FaBoxOpen /> Extracciones ({extractions.length})
                    </TabButton>
                </div>
            </Header>

            {loading ? (
                <div style={{ color: '#4a5568', textAlign: 'center', padding: '2rem' }}>Cargando laboratorio...</div>
            ) : (
                <>
                    {activeTab === 'raw' && (
                        <Grid>
                            {rawMaterials.length === 0 ? (
                                <EmptyState>
                                    <FaLeaf size={48} color="#cbd5e0" />
                                    <p>No hay materia prima en el laboratorio.</p>
                                    <small>Envía items desde la sección de Stock.</small>
                                </EmptyState>
                            ) : (
                                rawMaterials.map(batch => (
                                    <Card key={batch.id} style={{ borderColor: '#805ad5' }}>
                                        <CardContent>
                                            <CardHeader>
                                                <Badge>{batch.quality_grade}</Badge>
                                                <DateText>{new Date(batch.created_at).toLocaleDateString()}</DateText>
                                            </CardHeader>
                                            <MainInfo>
                                                <div className="source">
                                                    <strong>{batch.strain_name}</strong>
                                                    <span>{batch.batch_code}</span>
                                                </div>
                                                <div className="yield">
                                                    <YieldValue style={{ color: '#805ad5' }}>{Number(batch.current_weight).toFixed(2)}g</YieldValue>
                                                    <small>Disponible</small>
                                                </div>
                                            </MainInfo>
                                            <div style={{ fontSize: '0.85rem', color: '#718096', fontStyle: 'italic' }}>
                                                {batch.notes}
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <ActionButton onClick={() => handleProcess(batch)} className="process" style={{ width: '100%', justifyContent: 'center', background: '#805ad5', color: 'white', borderColor: 'transparent' }}>
                                                <FaFlask /> Procesar / Extraer
                                            </ActionButton>
                                        </CardFooter>
                                    </Card>
                                ))
                            )}
                        </Grid>
                    )}

                    {activeTab === 'processed' && (
                        <Grid>
                            {extractions.length === 0 ? (
                                <EmptyState>
                                    <FaFlask size={48} color="#cbd5e0" />
                                    <p>No hay extracciones registradas aún.</p>
                                    <NewButton onClick={handleCreateDirect}>Registrar Extracción Manual</NewButton>
                                </EmptyState>
                            ) : (
                                <>
                                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                        <NewButton onClick={handleCreateDirect} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                            <FaPlus /> Nueva Extracción Manual
                                        </NewButton>
                                    </div>
                                    {extractions.map(ext => (
                                        <Card key={ext.id} onClick={() => setSelectedExtraction(ext)}>
                                            <CardContent>
                                                <CardHeader>
                                                    <Badge $technique={ext.technique}>{ext.technique}</Badge>
                                                    <DateText><FaCalendarAlt /> {format(new Date(ext.date), 'dd MMM', { locale: es })}</DateText>
                                                </CardHeader>

                                                <MainInfo>
                                                    <div className="source">
                                                        <small>Origen</small>
                                                        <strong>{ext.source_batch?.strain_name || 'Desconocido'}</strong>
                                                        <span>{ext.source_batch?.batch_code || '-'}</span>
                                                    </div>
                                                    <div className="yield">
                                                        <small>Retorno</small>
                                                        <YieldValue>{ext.yield_percentage ? ext.yield_percentage.toFixed(1) : ((ext.output_weight / ext.input_weight) * 100).toFixed(1)}%</YieldValue>
                                                    </div>
                                                </MainInfo>

                                                <StatsGrid>
                                                    <div><FaWeightHanging size={10} /> IN: {Number(ext.input_weight).toFixed(2)}g</div>
                                                    <div><FaFlask size={10} /> OUT: {Number(ext.output_weight).toFixed(2)}g</div>
                                                </StatsGrid>
                                            </CardContent>

                                            <CardFooter>
                                                <ActionButton onClick={(e) => { e.stopPropagation(); setSelectedExtraction(ext); }} className="view">
                                                    <FaEye />
                                                </ActionButton>
                                                <ActionButton onClick={(e) => handleEdit(ext, e)} className="edit">
                                                    <FaEdit />
                                                </ActionButton>
                                                <ActionButton onClick={(e) => handleDeleteClick(ext.id, e)} className="delete">
                                                    <FaTrash />
                                                </ActionButton>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </>
                            )}
                        </Grid>
                    )}
                </>
            )}

            {isFormOpen && (
                <ExtractionForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => { setIsFormOpen(false); loadData(); }}
                    initialData={editingExtraction || undefined}
                    preselectedBatch={selectedRawBatch || undefined}
                />
            )}

            {selectedExtraction && (
                <ExtractionDetails
                    extraction={selectedExtraction}
                    onClose={() => setSelectedExtraction(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!itemToDelete}
                title="Eliminar Extracción"
                message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
                confirmText="Eliminar"
                isDestructive
            />
        </Container>
    );
};

// Styles
const Container = styled.div`
    padding: 1rem;
    padding-top: 5rem;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
    color: #2d3748;

    @media (max-width: 768px) {
        padding: 0.5rem;
        padding-top: 4rem;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const Title = styled.h1`
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.8rem;
    color: #2d3748;
    margin: 0;
`;

const TabButton = styled.button<{ $active: boolean }>`
    background: ${props => props.$active ? '#805ad5' : 'white'};
    color: ${props => props.$active ? 'white' : '#4a5568'};
    border: 1px solid ${props => props.$active ? '#805ad5' : '#e2e8f0'};
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    
    &:hover {
        transform: translateY(-1px);
        background: ${props => props.$active ? '#6b46c1' : '#f7fafc'};
    }
`;

const NewButton = styled.button`
    background: #38a169;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: transform 0.1s;
    box-shadow: 0 4px 6px rgba(56, 161, 105, 0.2);
    &:hover { transform: translateY(-2px); background: #2f855a; }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    background: white;
    border-radius: 1rem;
    border: 2px dashed #e2e8f0;
    color: #a0aec0;
    gap: 1rem;
    grid-column: 1 / -1;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
`;

const Card = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05); /* Lighter shadow */
    border: 1px solid #e2e8f0;
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    &:hover { transform: translateY(-4px); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
`;

const CardContent = styled.div`
    padding: 1.5rem;
    flex: 1;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
`;

const Badge = styled.span<{ $technique?: string }>`
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    background: ${props => props.$technique === 'Rosin' ? '#f6e05e' : props.$technique === 'Ice' ? '#bee3f8' : props.$technique === 'BHO' ? '#feb2b2' : '#edf2f7'};
    color: ${props => props.$technique === 'Rosin' ? '#744210' : props.$technique === 'Ice' ? '#2c5282' : props.$technique === 'BHO' ? '#9b2c2c' : '#4a5568'};
`;

const DateText = styled.span`
    color: #718096;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
`;

const MainInfo = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    .source {
        display: flex;
        flex-direction: column;
        strong { color: #2d3748; font-size: 1.1rem; }
        small { color: #718096; font-size: 0.75rem; text-transform: uppercase; }
        span { color: #cbd5e0; font-size: 0.85rem; font-family: monospace; }
    }

    .yield {
        text-align: right;
        small { display: block; color: #718096; font-size: 0.75rem; }
    }
`;

const YieldValue = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    color: #38a169;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #f7fafc;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    color: #4a5568;
    margin-bottom: 1rem;
    border: 1px solid #edf2f7;
    div { display: flex; alignItems: center; gap: 0.5rem; }
`;

const CardFooter = styled.div`
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
`;

const ActionButton = styled.button`
    background: white;
    border: 1px solid #cbd5e0;
    padding: 0.4rem 0.75rem;
    border-radius: 0.35rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #4a5568;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s;

    &:hover { background: #edf2f7; }

    &.delete {
        color: #e53e3e;
        border-color: #feb2b2;
        &:hover { background: #fff5f5; border-color: #fc8181; }
    }

    &.view {
        color: #3182ce;
        border-color: #bee3f8;
        &:hover { background: #ebf8ff; border-color: #63b3ed; }
    }
    
    &.edit {
        color: #d69e2e;
        border-color: #f6e05e;
        &:hover { background: #fffff0; border-color: #d69e2e; }
    }
`;
