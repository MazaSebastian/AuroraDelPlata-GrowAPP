import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { extractionsService } from '../services/extractionsService';
import { Extraction } from '../types/extractions';
import { ExtractionForm } from '../components/Extractions/ExtractionForm';
import { ExtractionDetails } from '../components/Extractions/ExtractionDetails';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { TastingRating } from '../components/Extractions/TastingRating'; // check if unused
import { FaFlask, FaPlus, FaCalendarAlt, FaWeightHanging, FaTrash, FaEye, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ExtractionsPage: React.FC = () => {
    const [extractions, setExtractions] = useState<Extraction[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
    const [editingExtraction, setEditingExtraction] = useState<Extraction | null>(null);
    const [extractionToDelete, setExtractionToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExtractions();
    }, []);

    const loadExtractions = async () => {
        setLoading(true);
        const data = await extractionsService.getExtractions();
        setExtractions(data);
        setLoading(false);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExtractionToDelete(id);
    }

    const confirmDelete = async () => {
        if (extractionToDelete) {
            await extractionsService.deleteExtraction(extractionToDelete);
            setExtractionToDelete(null);
            loadExtractions();
        }
    };

    const handleEdit = (ext: Extraction, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingExtraction(ext);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingExtraction(null);
        setIsFormOpen(true);
    };

    return (
        <Container>
            <Header>
                <Title>
                    <FaFlask size={24} color="#38a169" />
                    Laboratorio de Extracciones
                </Title>
                <NewButton onClick={handleCreate}>
                    <FaPlus /> Nueva Extracción
                </NewButton>
            </Header>

            {loading ? (
                <div style={{ color: '#4a5568', textAlign: 'center', padding: '2rem' }}>Cargando laboratorio...</div>
            ) : extractions.length === 0 ? (
                <EmptyState>
                    <FaFlask size={48} color="#4a5568" />
                    <p>No hay extracciones registradas aún.</p>
                    <NewButton onClick={handleCreate}>Comenzar Primera Extracción</NewButton>
                </EmptyState>
            ) : (
                <Grid>
                    {extractions.map(ext => (
                        <Card key={ext.id} onClick={() => setSelectedExtraction(ext)}>
                            <CardContent>
                                <CardHeader>
                                    <Badge $technique={ext.technique}>{ext.technique}</Badge>
                                    <DateText><FaCalendarAlt /> {format(new Date(ext.date), 'dd MMM', { locale: es })}</DateText>
                                </CardHeader>

                                <MainInfo>
                                    <div className="source">
                                        <small>Materia Prima</small>
                                        <strong>{ext.source_batch?.strain_name || 'Desconocido'}</strong>
                                        <span>{ext.source_batch?.batch_code}</span>
                                    </div>
                                    <div className="yield">
                                        <small>Retorno</small>
                                        <YieldValue>{ext.yield_percentage ? ext.yield_percentage.toFixed(1) : ((ext.output_weight / ext.input_weight) * 100).toFixed(1)}%</YieldValue>
                                    </div>
                                </MainInfo>

                                <StatsGrid>
                                    <div><FaWeightHanging size={10} /> IN: {ext.input_weight}g</div>
                                    <div><FaFlask size={10} /> OUT: {ext.output_weight}g</div>
                                </StatsGrid>

                                {ext.ratings && (
                                    <RatingMini>
                                        <div className="r-item">⭐ {ext.ratings.overall || ((ext.ratings.aroma + ext.ratings.texture + ext.ratings.potency) / 3).toFixed(1)}</div>
                                        <small>Calidad Global</small>
                                    </RatingMini>
                                )}
                            </CardContent>

                            <CardFooter>
                                <ActionButton onClick={(e) => { e.stopPropagation(); setSelectedExtraction(ext); }} className="view">
                                    <FaEye /> Ver
                                </ActionButton>
                                <ActionButton onClick={(e) => handleEdit(ext, e)} className="edit">
                                    <FaEdit /> Editar
                                </ActionButton>
                                <ActionButton onClick={(e) => handleDeleteClick(ext.id, e)} className="delete">
                                    <FaTrash />
                                </ActionButton>
                            </CardFooter>

                        </Card>
                    ))}
                </Grid>
            )}

            {isFormOpen && (
                <ExtractionForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => { setIsFormOpen(false); loadExtractions(); }}
                    initialData={editingExtraction || undefined}
                />
            )}

            {selectedExtraction && (
                <ExtractionDetails
                    extraction={selectedExtraction}
                    onClose={() => setSelectedExtraction(null)}
                />
            )}

            <ConfirmationModal
                isOpen={!!extractionToDelete}
                title="Eliminar Extracción"
                message="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
                onConfirm={confirmDelete}
                onCancel={() => setExtractionToDelete(null)}
                confirmText="Eliminar"
                isDestructive
            />
        </Container>
    );
};

// Styles
const Container = styled.div`
    padding: 2rem;
    background: transparent;
    min-height: 100vh;
    color: #2d3748;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
`;

const Title = styled.h1`
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.8rem;
    color: #2d3748;
    margin: 0;
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

const Badge = styled.span<{ $technique: string }>`
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

const RatingMini = styled.div`
    background: linear-gradient(90deg, #f7fafc 0%, #edf2f7 100%);
    padding: 0.5rem;
    border-radius: 0.5rem;
    text-align: center;
    border: 1px solid #e2e8f0;
    .r-item { color: #d69e2e; font-weight: bold; }
    small { color: #718096; font-size: 0.7rem; }
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
