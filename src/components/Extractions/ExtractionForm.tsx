import React, { useState, useEffect } from 'react';
import { extractionsService } from '../../services/extractionsService';
import { DispensaryBatch } from '../../services/dispensaryService';
import { Extraction, ExtractionTechnique } from '../../types/extractions';
import { TastingRating } from './TastingRating';
import { FaFlask, FaCalculator, FaSave, FaTimes } from 'react-icons/fa';

interface ExtractionFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Extraction;
    preselectedBatch?: DispensaryBatch;
}

export const ExtractionForm: React.FC<ExtractionFormProps> = ({ onClose, onSuccess, initialData, preselectedBatch }) => {
    const [sources, setSources] = useState<DispensaryBatch[]>([]);
    // const [loading, setLoading] = useState(true);

    // Form State
    const [sourceId, setSourceId] = useState('');
    const [technique, setTechnique] = useState<ExtractionTechnique>('Rosin');
    const [inputWeight, setInputWeight] = useState<number>(0);
    const [outputWeight, setOutputWeight] = useState<number>(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Dynamic Parameters
    const [params, setParams] = useState<any>({});

    // Ratings
    const [ratings, setRatings] = useState({ aroma: 0, texture: 0, potency: 0, color: 0 });

    useEffect(() => {
        loadSources();
        if (initialData) {
            setSourceId(initialData.source_batch_id);
            setTechnique(initialData.technique);
            setInputWeight(initialData.input_weight);
            setOutputWeight(initialData.output_weight);
            setDate(initialData.date.split('T')[0]);
            setNotes(initialData.notes || '');
            setParams(initialData.parameters || {});
            setRatings({
                aroma: initialData.ratings?.aroma || 0,
                texture: initialData.ratings?.texture || 0,
                potency: initialData.ratings?.potency || 0,
                color: initialData.ratings?.color || 0
            });
        } else if (preselectedBatch) {
            setSourceId(preselectedBatch.id);
            // Default input weight to visible/available weight? Or 0?
            // Maybe convenient to set it to current weight, assuming full processing.
            setInputWeight(preselectedBatch.current_weight);
        }
    }, [initialData, preselectedBatch]);

    const loadSources = async () => {
        try {
            const batches = await extractionsService.getAvailableSourceBatches();
            setSources(batches);
        } catch (err) {
            console.error(err);
        } finally {
            // setLoading(false);
        }
    };

    const calculateYield = () => {
        if (inputWeight > 0 && outputWeight >= 0) {
            return ((outputWeight / inputWeight) * 100).toFixed(1);
        }
        return "0.0";
    };

    const handleSubmit = async () => {
        if (!sourceId || inputWeight <= 0) {
            alert("Por favor selecciona una materia prima e ingresa un peso de entrada válido.");
            return;
        }

        try {
            let result;
            const extractionData = {
                source_batch_id: sourceId,
                technique,
                date,
                input_weight: inputWeight,
                output_weight: outputWeight,
                parameters: params,
                ratings,
                notes
            };

            if (initialData) {
                result = await extractionsService.updateExtraction(initialData.id, extractionData);
            } else {
                result = await extractionsService.createExtraction(extractionData);
            }

            if (result) {
                onSuccess();
            } else {
                alert("Error al guardar la extracción.");
            }
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
        }
    };

    // Render specific inputs based on technique
    const renderTechInputs = () => {
        switch (technique) {
            case 'Rosin':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Temperatura (°C)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 85"
                                value={params.temperature || ''} onChange={e => setParams({ ...params, temperature: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Micras (µ)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 73"
                                value={params.micron || ''} onChange={e => setParams({ ...params, micron: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tiempo (seg)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 120"
                                value={params.timeSeconds || ''} onChange={e => setParams({ ...params, timeSeconds: Number(e.target.value) })} />
                        </div>
                    </div>
                );
            case 'Ice':
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Lavados (#)</label>
                            <input type="number" style={inputStyle} placeholder="ej. 3"
                                value={params.washes || ''} onChange={e => setParams({ ...params, washes: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={labelStyle}>Hielo</label>
                            <select style={selectStyle} value={params.iceType || 'cubes'} onChange={e => setParams({ ...params, iceType: e.target.value })}>
                                <option value="cubes">Cubos</option>
                                <option value="crushed">Picado</option>
                                <option value="dry_ice">Hielo Seco</option>
                            </select>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const selectedSource = sources.find(s => s.id === sourceId);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '95%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '1rem', padding: '0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FaFlask color="#38a169" /> {initialData ? 'Editar Extracción' : 'Nueva Extracción'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '1.5rem' }}><FaTimes /></button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

                        {/* Left Column: Data */}
                        <div>
                            {/* Source Selection */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Materia Prima (Cosecha/Lote)</label>
                                <select
                                    style={selectStyle}
                                    value={sourceId}
                                    onChange={e => setSourceId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {sources.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.strain_name} | {s.batch_code} ({s.current_weight}g disp.)
                                        </option>
                                    ))}
                                </select>
                                {selectedSource && (
                                    <small style={{ color: '#4FD1C5', display: 'block', marginTop: '0.25rem' }}>
                                        Disponible: {selectedSource.current_weight}g - Calidad: {selectedSource.quality_grade}
                                    </small>
                                )}
                            </div>

                            {/* Technique & Date */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Técnica</label>
                                    <select style={{ ...selectStyle, width: '100%' }} value={technique} onChange={(e) => setTechnique(e.target.value as any)}>
                                        <option value="Rosin">Rosin Tech</option>
                                        <option value="BHO">BHO</option>
                                        <option value="Ice">Ice / Water Hash</option>
                                        <option value="Dry Sift">Dry Sift</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Fecha</label>
                                    <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>

                            {/* Technique Specifics */}
                            {renderTechInputs()}

                            {/* Weights & Yield */}
                            <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', color: '#d69e2e' }}>
                                    <FaCalculator /> <span style={{ fontWeight: 'bold' }}>Cálculo de Rendimiento</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Entrada (g)</label>
                                        <input type="number" style={{ ...inputStyle, borderColor: '#ecc94b' }}
                                            value={inputWeight || ''} onChange={e => setInputWeight(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Salida / Retorno (g)</label>
                                        <input type="number" style={{ ...inputStyle, borderColor: '#48bb78' }}
                                            value={outputWeight || ''} onChange={e => setOutputWeight(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', textAlign: 'center', background: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #edf2f7' }}>
                                    <span style={{ color: '#718096', fontSize: '0.9rem' }}>Rendimiento: </span>
                                    <strong style={{ color: '#38a169', fontSize: '1.5rem' }}>{calculateYield()}%</strong>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Rating & Notes */}
                        <div>
                            <TastingRating ratings={ratings} onChange={setRatings} />

                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={labelStyle}>Notas del Proceso</label>
                                <textarea
                                    rows={5}
                                    style={{ ...inputStyle, minHeight: '100px' }}
                                    placeholder="Detalles sobre el proceso, observaciones..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                        <button onClick={onClose} style={cancelButtonStyle}>Cancelar</button>
                        <button onClick={handleSubmit} style={primaryButtonStyle}>
                            <FaSave /> Guardar Extracción
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem', fontWeight: 600 as any };
const inputStyle = { width: '100%', padding: '0.6rem 0.75rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#2d3748', fontSize: '1rem', lineHeight: '1.5', boxSizing: 'border-box' as any };
const selectStyle = { ...inputStyle, appearance: 'none' as const, WebkitAppearance: 'none' as any, backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%232d3748%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '0.65em auto', paddingRight: '2rem', paddingLeft: '0.75rem', textOverflow: 'ellipsis' };
const primaryButtonStyle = { background: '#38a169', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' };
const cancelButtonStyle = { background: 'transparent', color: '#718096', border: '1px solid #cbd5e0', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' };
