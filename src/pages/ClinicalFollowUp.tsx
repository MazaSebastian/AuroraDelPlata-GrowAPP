import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { patientsService } from '../services/patientsService';
import { FaHeartbeat, FaPills, FaChartLine, FaUserSecret, FaPlus } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';

// --- Styled Components (Dashboard First) ---

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  background: #f7fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.5rem;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const HashBadge = styled.span`
  background: #2d3748;
  color: #63b3ed;
  font-family: monospace;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div<{ color?: string }>`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border-top: 4px solid ${props => props.color || '#e2e8f0'};
  position: relative;
  overflow: hidden;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// --- Custom Components ---

const ChromaticSlider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #48bb78, #ecc94b, #f56565);
  outline: none;
  margin: 1rem 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    cursor: pointer;
    border: 2px solid #2d3748;
  }
`;

const MetricBox = styled.div`
  margin-bottom: 1.5rem;
  p { margin: 0; font-size: 0.9rem; color: #718096; }
  .value { font-size: 1.5rem; font-weight: bold; color: #2d3748; }
`;

const ClinicalFollowUp: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [admission, setAdmission] = useState<any | null>(null);
    const [evolutions, setEvolutions] = useState<any[]>([]);

    // Evolution Form State
    const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
    const [newEvolution, setNewEvolution] = useState({
        eva_score: 0,
        notes: '',
        sparing_effect: [] as any[],
        adverse_effects: [] as any[]
    });

    // Admission Form State
    const [isAdmitting, setIsAdmitting] = useState(false);
    const [newAdmission, setNewAdmission] = useState({
        diagnosis_cie11: [] as string[],
        medications: [] as any[],
        baseline_qol: 50,
        baseline_pain_avg: 5,
        baseline_pain_worst: 8,
        patient_hash: ''
    });

    useEffect(() => {
        if (id) loadData(id);
    }, [id]);

    const loadData = async (patientId: string) => {
        setLoading(true);
        try {
            const adm = await patientsService.getClinicalAdmission(patientId);
            setAdmission(adm);

            if (adm) {
                const evos = await patientsService.getEvolutions(adm.id);
                setEvolutions(evos);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmission = async () => {
        if (!id) return;
        try {
            // Generate hash manually for display
            const cleanId = id.replace(/-/g, '').substring(0, 8).toUpperCase();
            const hash = `ANON-${cleanId}`;

            await patientsService.createClinicalAdmission({
                patient_id: id,
                // patient_hash: hash, // Already in newAdmission if set, or handled by service
                ...newAdmission,
                patient_hash: hash // Override with generated hash
            });
            loadData(id);
            setIsAdmitting(false);
        } catch (e) {
            alert("Error creating admission");
        }
    };

    const handleAddEvolution = async () => {
        if (!admission) return;
        try {
            // Calculate improvement (Simple logic: Baseline Pain - Current Pain / Baseline * 100)
            // Or just subjective % for now. Let's use logic if possible, or manual input.
            // Let's infer improvement from QoL or Pain. 
            // improved = (BaselinePain - CurrentPain) / BaselinePain * 100
            let improvement = 0;
            if (admission.baseline_pain_avg > 0) {
                improvement = ((admission.baseline_pain_avg - newEvolution.eva_score) / admission.baseline_pain_avg) * 100;
            }

            await patientsService.addEvolution({
                admission_id: admission.id,
                date: new Date().toISOString().split('T')[0], // Today
                eva_score: newEvolution.eva_score,
                improvement_percent: parseFloat(improvement.toFixed(2)),
                notes: newEvolution.notes,
                sparing_effect: newEvolution.sparing_effect,
                adverse_effects: newEvolution.adverse_effects
            });

            loadData(id || '');
            setIsEvolutionModalOpen(false);
            setNewEvolution({ eva_score: 0, notes: '', sparing_effect: [], adverse_effects: [] }); // Reset
        } catch (e) {
            alert("Error adding evolution");
        }
    };

    if (loading) return <LoadingSpinner text="Cargando Historia Clínica..." />;

    if (!admission && !isAdmitting) {
        return (
            <Container style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column' }}>
                <FaUserSecret size={64} color="#CBD5E0" />
                <h2 style={{ color: '#4A5568', marginTop: '1.5rem' }}>Sin Datos Clínicos</h2>
                <p style={{ color: '#718096', maxWidth: '400px', textAlign: 'center', marginBottom: '2rem' }}>
                    Este paciente aún no tiene una Admisión Clínica registrada (Baseline).
                </p>
                <button
                    style={{ padding: '1rem 2rem', background: '#319795', color: 'white', borderRadius: '0.5rem', border: 'none', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => setIsAdmitting(true)}
                >
                    Iniciar Admisión Clínica
                </button>
            </Container>
        );
    }

    // --- ADMISSION FORM VIEW ---
    if (isAdmitting) {
        return (
            <Container>
                <Header>
                    <h1><FaHeartbeat color="#F56565" /> Nueva Admisión Clínica</h1>
                </Header>
                <Card color="#319795" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <CardTitle>Línea Base (Baseline Metrics)</CardTitle>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568' }}>Calidad de Vida ({newAdmission.baseline_qol}%)</label>
                    <ChromaticSlider
                        type="range" min="0" max="100"
                        value={newAdmission.baseline_qol}
                        onChange={e => setNewAdmission({ ...newAdmission, baseline_qol: Number(e.target.value) })}
                        style={{ background: 'linear-gradient(to right, #F56565, #ECC94B, #48BB78)' }} // Red to Green for QoL
                    />

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568', marginTop: '1.5rem' }}>Dolor Promedio (EVA {newAdmission.baseline_pain_avg})</label>
                    <ChromaticSlider
                        type="range" min="0" max="10"
                        value={newAdmission.baseline_pain_avg}
                        onChange={e => setNewAdmission({ ...newAdmission, baseline_pain_avg: Number(e.target.value) })}
                    />

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568', marginTop: '1.5rem' }}>Peor Dolor Semana (EVA {newAdmission.baseline_pain_worst})</label>
                    <ChromaticSlider
                        type="range" min="0" max="10"
                        value={newAdmission.baseline_pain_worst}
                        onChange={e => setNewAdmission({ ...newAdmission, baseline_pain_worst: Number(e.target.value) })}
                    />

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button onClick={() => setIsAdmitting(false)} style={{ padding: '0.75rem 1.5rem', background: '#CBD5E0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleCreateAdmission} style={{ padding: '0.75rem 1.5rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Admisión</button>
                    </div>
                </Card>
            </Container>
        )
    }

    // --- DASHBOARD VIEW ---
    return (
        <Container>
            <Header>
                <h1><FaHeartbeat color="#F56565" /> Seguimiento Clínico</h1>
                <HashBadge><FaUserSecret /> {admission.patient_hash}</HashBadge>
            </Header>

            <Grid>
                {/* 1. Baseline Card */}
                <Card color="#4299E1">
                    <CardTitle><FaChartLine /> Línea Base (Admisión)</CardTitle>
                    <MetricBox>
                        <p>Calidad de Vida Inicial</p>
                        <div className="value">{admission.baseline_qol}%</div>
                        <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '0.5rem' }}>
                            <div style={{ height: '100%', width: `${admission.baseline_qol}%`, background: '#4299E1', borderRadius: '2px' }} />
                        </div>
                    </MetricBox>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                        <MetricBox>
                            <p>Dolor Prom. (EVA)</p>
                            <div className="value">{admission.baseline_pain_avg}</div>
                        </MetricBox>
                        <MetricBox>
                            <p>Peor Dolor (EVA)</p>
                            <div className="value">{admission.baseline_pain_worst}</div>
                        </MetricBox>
                    </div>
                </Card>

                {/* 2. Pharmacology Card */}
                <Card color="#805AD5">
                    <CardTitle><FaPills /> Farmacología Actual</CardTitle>
                    {admission.medications && admission.medications.length > 0 ? (
                        <ul>
                            {admission.medications.map((med: any, i: number) => (
                                <li key={i}>{med.name} - {med.dose}</li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#A0AEC0', border: '1px dashed #CBD5E0', borderRadius: '0.5rem' }}>
                            Sin medicación registrada
                            <br /><small>No hay interacciones detectadas</small>
                        </div>
                    )}
                </Card>

                {/* 3. Evolution / Progress */}
                <Card color="#48BB78">
                    <CardTitle>
                        <FaChartLine /> Evolución
                        <button
                            onClick={() => setIsEvolutionModalOpen(true)}
                            style={{ marginLeft: 'auto', background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FaPlus /> Nueva Evolución
                        </button>
                    </CardTitle>

                    {evolutions.length === 0 ? (
                        <p style={{ color: '#718096', fontStyle: 'italic' }}>No hay evoluciones registradas.</p>
                    ) : (
                        <div>
                            {/* Latest Evolution Highlight */}
                            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '0.5rem' }}>Última visita: {evolutions[0].date}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1, padding: '1rem', background: '#F0FFF4', borderRadius: '0.5rem', border: '1px solid #C6F6D5' }}>
                                        <small style={{ color: '#2F855A', fontWeight: 'bold' }}>MEJORÍA GLOBAL</small>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#22543D' }}>
                                            {evolutions[0].improvement_percent > 0 ? '+' : ''}{evolutions[0].improvement_percent || 0}%
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                                        <small style={{ color: '#718096', fontWeight: 'bold' }}>DOLOR ACTUAL (EVA)</small>
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2d3748' }}>
                                            {evolutions[0].eva_score} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#a0aec0' }}>/ 10</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* History List */}
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {evolutions.map((evo, idx) => (
                                    <div key={idx} style={{ padding: '0.75rem', borderBottom: '1px solid #f7fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#4a5568' }}>{evo.date}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#718096' }}>EVA: {evo.eva_score}</div>
                                        </div>
                                        <div style={{ color: evo.improvement_percent >= 0 ? '#48bb78' : '#e53e3e', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {evo.improvement_percent > 0 ? '+' : ''}{evo.improvement_percent}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </Grid>

            {/* EVOLUTION MODAL */}
            {isEvolutionModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <Card style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <CardTitle>Registrar Evolución</CardTitle>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568' }}>Dolor Actual (EVA {newEvolution.eva_score})</label>
                        <ChromaticSlider
                            type="range" min="0" max="10"
                            value={newEvolution.eva_score}
                            onChange={e => setNewEvolution({ ...newEvolution, eva_score: Number(e.target.value) })}
                        />

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#4A5568', marginTop: '1.5rem' }}>Notas de Evolución</label>
                        <textarea
                            style={{ width: '100%', height: '100px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #CBD5E0', fontFamily: 'inherit' }}
                            placeholder="Describa la evolución del paciente, efectos, etc..."
                            value={newEvolution.notes}
                            onChange={e => setNewEvolution({ ...newEvolution, notes: e.target.value })}
                        />

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setIsEvolutionModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: '#CBD5E0', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleAddEvolution} style={{ padding: '0.75rem 1.5rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
                        </div>
                    </Card>
                </div>
            )}
        </Container>
    );
};

export default ClinicalFollowUp;
