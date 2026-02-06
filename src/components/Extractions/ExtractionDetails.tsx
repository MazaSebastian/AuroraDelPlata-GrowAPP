import React from 'react';
import styled from 'styled-components';
import { Extraction } from '../../types/extractions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaTimes, FaPrint, FaThermometerHalf, FaClock, FaLayerGroup, FaSnowflake, FaTint, FaInfoCircle } from 'react-icons/fa';
import { TastingRating } from './TastingRating';

interface ExtractionDetailsProps {
    extraction: Extraction;
    onClose: () => void;
}

export const ExtractionDetails: React.FC<ExtractionDetailsProps> = ({ extraction, onClose }) => {

    const handlePrint = () => {
        window.print();
    };

    const renderParams = () => {
        const p = extraction.parameters as any;
        if (!p) return null;

        switch (extraction.technique) {
            case 'Rosin':
                return (
                    <ParamsGrid>
                        <ParamItem><FaThermometerHalf /> <strong>Temp:</strong> {p.temperature}°C</ParamItem>
                        <ParamItem><FaLayerGroup /> <strong>Micras:</strong> {p.micron}µ</ParamItem>
                        <ParamItem><FaClock /> <strong>Tiempo:</strong> {p.timeSeconds}s</ParamItem>
                    </ParamsGrid>
                );
            case 'Ice':
                return (
                    <ParamsGrid>
                        <ParamItem><FaTint /> <strong>Lavados:</strong> {p.washes}</ParamItem>
                        <ParamItem><FaSnowflake /> <strong>Hielo:</strong> {p.iceType === 'cubes' ? 'Cubos' : p.iceType === 'crushed' ? 'Picado' : p.iceType === 'dry_ice' ? 'Hielo Seco' : p.iceType}</ParamItem>
                    </ParamsGrid>
                );
            case 'BHO':
            case 'Dry Sift':
            default:
                // Render generic key-values if any
                return (
                    <ParamsGrid>
                        {Object.entries(p).map(([key, val]) => (
                            <ParamItem key={key}><strong>{key}:</strong> {String(val)}</ParamItem>
                        ))}
                    </ParamsGrid>
                );
        }
    };

    return (
        <Overlay>
            <Modal className="printable-content">
                <Header>
                    <Title>
                        📄 Detalle de Extracción
                        <Badge $technique={extraction.technique}>{extraction.technique}</Badge>
                    </Title>
                    <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                        <IconButton onClick={handlePrint} title="Imprimir / PDF">
                            <FaPrint />
                        </IconButton>
                        <IconButton onClick={onClose} title="Cerrar">
                            <FaTimes />
                        </IconButton>
                    </div>
                </Header>

                <Content>
                    <Section>
                        <SectionTitle>Información General</SectionTitle>
                        <InfoRow>
                            <div>
                                <Label>Fecha</Label>
                                <Value>{format(new Date(extraction.date), 'dd MMMM yyyy', { locale: es })}</Value>
                            </div>
                            <div>
                                <Label>ID</Label>
                                <Value style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{extraction.id.split('-')[0]}</Value>
                            </div>
                        </InfoRow>
                    </Section>

                    <Section>
                        <SectionTitle>Materia Prima</SectionTitle>
                        <InfoRow>
                            <div>
                                <Label>Variedad</Label>
                                <Value>{extraction.source_batch?.strain_name || 'Desconocido'}</Value>
                            </div>
                            <div>
                                <Label>Lote Origen</Label>
                                <Value>{extraction.source_batch?.batch_code}</Value>
                            </div>
                        </InfoRow>
                    </Section>

                    <Section>
                        <SectionTitle>Parámetros Técnicos</SectionTitle>
                        {renderParams()}
                    </Section>

                    <Section>
                        <SectionTitle>Resultados</SectionTitle>
                        <ResultsContainer>
                            <ResultBox>
                                <Label>Entrada</Label>
                                <BigValue>{extraction.input_weight}g</BigValue>
                            </ResultBox>
                            <ResultBox>
                                <Label>Salida</Label>
                                <BigValue>{extraction.output_weight}g</BigValue>
                            </ResultBox>
                            <ResultBox $highlight>
                                <Label>Retorno</Label>
                                <BigValue>{extraction.yield_percentage?.toFixed(1) || ((extraction.output_weight / extraction.input_weight) * 100).toFixed(1)}%</BigValue>
                            </ResultBox>
                        </ResultsContainer>
                    </Section>

                    {extraction.ratings && (
                        <Section>
                            <SectionTitle>Cata & Calidad</SectionTitle>
                            <TastingRating ratings={extraction.ratings} readonly />
                        </Section>
                    )}

                    {extraction.notes && (
                        <Section>
                            <SectionTitle>Notas</SectionTitle>
                            <NotesBox>
                                {extraction.notes}
                            </NotesBox>
                        </Section>
                    )}

                </Content>
            </Modal>
        </Overlay>
    );
};

// Styles
const Overlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    z-index: 1100;
    display: flex;
    justify-content: center;
    align-items: center;
    @media print {
        position: static;
        background: white;
    }
`;

const Modal = styled.div`
    background: white;
    width: 95%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    border-radius: 1rem;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    display: flex;
    flex-direction: column;
    @media print {
        width: 100%;
        max-width: none;
        max-height: none;
        box-shadow: none;
        border-radius: 0;
    }
`;

const Header = styled.div`
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border-radius: 1rem 1rem 0 0;
    @media print {
        background: white;
        border-bottom: 2px solid black;
    }
`;

const Title = styled.h2`
    margin: 0;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.25rem;
`;

const Badge = styled.span<{ $technique: string }>`
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    background: ${props => props.$technique === 'Rosin' ? '#f6e05e' : props.$technique === 'Ice' ? '#bee3f8' : props.$technique === 'BHO' ? '#feb2b2' : '#edf2f7'};
    color: ${props => props.$technique === 'Rosin' ? '#744210' : props.$technique === 'Ice' ? '#2c5282' : props.$technique === 'BHO' ? '#9b2c2c' : '#4a5568'};
    @media print {
        border: 1px solid black;
        background: white;
        color: black;
    }
`;

const IconButton = styled.button`
    background: white;
    border: 1px solid #e2e8f0;
    color: #4a5568;
    width: 36px;
    height: 36px;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    &:hover { background: #edf2f7; color: #2d3748; }
`;

const Content = styled.div`
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const SectionTitle = styled.h3`
    margin: 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #718096;
    letter-spacing: 0.05em;
    border-bottom: 2px solid #edf2f7;
    padding-bottom: 0.5rem;
`;

const InfoRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
`;

const Label = styled.span`
    display: block;
    font-size: 0.8rem;
    color: #718096;
    margin-bottom: 0.25rem;
`;

const Value = styled.span`
    display: block;
    font-size: 1.1rem;
    color: #2d3748;
    font-weight: 600;
`;

const ParamsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    background: #f7fafc;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    @media print {
        background: white;
        border: 1px solid black;
    }
`;

const ParamItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #4a5568;
    font-size: 0.95rem;
    strong { color: #2d3748; }
`;

const ResultsContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
`;

const ResultBox = styled.div<{ $highlight?: boolean }>`
    background: ${props => props.$highlight ? '#f0fff4' : 'white'};
    border: 1px solid ${props => props.$highlight ? '#c6f6d5' : '#e2e8f0'};
    padding: 1rem;
    border-radius: 0.5rem;
    text-align: center;
    @media print {
        background: white;
        border: 1px solid black;
    }
`;

const BigValue = styled.div`
    font-size: 1.5rem;
    font-weight: 800;
    color: #2d3748;
`;

const NotesBox = styled.div`
    background: #fff;
    border: 1px solid #e2e8f0;
    padding: 1rem;
    border-radius: 0.5rem;
    font-style: italic;
    color: #4a5568;
    line-height: 1.6;
    @media print {
        border: 1px solid black;
    }
`;
