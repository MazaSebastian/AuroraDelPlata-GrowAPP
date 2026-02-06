import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaHandHoldingMedical, FaBoxOpen, FaQrcode, FaEdit, FaTrash, FaPrint } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { dispensaryService, DispensaryBatch } from '../services/dispensaryService';
import { patientsService } from '../services/patientsService';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { Tooltip } from '../components/Tooltip';
// Wait, Stock.tsx defined its own Button. I should redefine it here or import a shared one.
// Looking at Stock.tsx, Button was defined locally. I will copy the definition.
import { ConfirmModal } from '../components/ConfirmModal';
import { EditDispensaryModal } from '../components/EditDispensaryModal';

// --- Styled Components (Copied from Stock.tsx) ---

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    padding-top: 4rem;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const ButtonStyled = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background: ${props => {
        switch (props.variant) {
            case 'primary': return '#3b82f6';
            case 'secondary': return '#6b7280';
            case 'danger': return '#ef4444';
            default: return '#f3f4f6';
        }
    }};
  
  color: ${props => props.variant ? 'white' : '#374151'};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

// Re-using the locally defined ButtonStyled as Button for this file to match Stock.tsx usage
const ButtonComp = ButtonStyled;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  p {
    margin-bottom: 1.5rem;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
  
  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1e293b;
  }
`;

const FormGroup = styled.div`
  display: grid;
  gap: 0.5rem;
  
  label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  input, select {
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PrintableLabel = styled.div`
  display: none;
  @media print {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100mm;
    height: 150mm; // Adjust as needed for specific label size
    padding: 1rem;
    background: white;
    text-align: center;
    page-break-after: always;
    
    /* Force simple styling for thermal printers */
    font-family: sans-serif;
    color: black;
    
    h1 {
      font-size: 24pt;
      margin: 10px 0;
      font-weight: 800;
    }
    
    h2 {
      font-size: 16pt;
      margin: 5px 0;
      font-weight: normal;
    }
    
    .batch-code {
      font-size: 14pt;
      font-family: monospace;
      margin: 10px 0;
      padding: 5px 10px;
      border: 2px solid black;
      border-radius: 5px;
    }
    
    .qr-container {
      margin: 20px 0;
      border: 4px solid black;
      padding: 10px;
      background: white;
    }
    
    .logo {
      font-size: 12pt;
      margin-top: auto;
      font-weight: bold;
    }
  }
`;

// Global Print Styles to hide everything else
const PrintStyles = styled.div`
  @media print {
    body * {
      visibility: hidden;
    }
    .printable-label, .printable-label * {
      visibility: visible;
    }
    .printable-label {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  }
`;


const Dispensary: React.FC = () => {
    const [dispensaryBatches, setDispensaryBatches] = useState<DispensaryBatch[]>([]);
    const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
    const [batchToDispense, setBatchToDispense] = useState<DispensaryBatch | null>(null);
    const [dispenseForm, setDispenseForm] = useState({ amount: '', reason: 'dispensing', memberId: '' });
    const [deleteDispensaryModalOpen, setDeleteDispensaryModalOpen] = useState(false);
    const [batchToDeleteDispensary, setBatchToDeleteDispensary] = useState<DispensaryBatch | null>(null);
    const [editDispensaryModalOpen, setEditDispensaryModalOpen] = useState(false);
    const [batchToEditDispensary, setBatchToEditDispensary] = useState<DispensaryBatch | null>(null);

    const [patients, setPatients] = useState<import('../services/patientsService').Patient[]>([]);
    const [consumptionStats, setConsumptionStats] = useState<{ current: number, limit: number } | null>(null);
    const [genetics, setGenetics] = useState<Genetic[]>([]);

    /* QR Code Logic */
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrBatch, setQrBatch] = useState<DispensaryBatch | null>(null);

    const loadPatients = async () => {
        const data = await patientsService.getPatients();
        setPatients(data);
    };

    const loadDispensaryStock = async () => {
        const batches = await dispensaryService.getShopBatches();
        setDispensaryBatches(batches);
    };

    const loadGenetics = async () => {
        const data = await geneticsService.getGenetics();
        setGenetics(data);
    };

    useEffect(() => {
        loadPatients();
        loadDispensaryStock();
        loadGenetics();
    }, []);

    // Check consumption when member is selected
    useEffect(() => {
        if (dispenseForm.memberId && dispenseForm.reason === 'dispensing') {
            patientsService.getPatientConsumption(dispenseForm.memberId).then(setConsumptionStats);
        } else {
            setConsumptionStats(null);
        }
    }, [dispenseForm.memberId, dispenseForm.reason]);

    const handleOpenDispense = (batch: DispensaryBatch) => {
        setBatchToDispense(batch);
        setDispenseForm({ amount: '', reason: 'dispensing', memberId: '' });
        setDispenseModalOpen(true);
    };

    const getResolvedPrice = (batch: DispensaryBatch | null): number => {
        if (!batch) return 0;
        const genetic = genetics.find(g => g.name === batch.strain_name);
        if (genetic && genetic.default_price_per_gram) {
            return genetic.default_price_per_gram;
        }
        return 0; // No global price fallback
    };

    const resolvedPrice = getResolvedPrice(batchToDispense);

    const confirmDispense = async () => {
        if (!batchToDispense || !dispenseForm.amount) return;
        const amount = parseFloat(dispenseForm.amount);
        if (isNaN(amount) || amount <= 0 || amount > batchToDispense.current_weight) {
            alert("Cantidad inválida");
            return;
        }

        const success = await dispensaryService.dispense(batchToDispense.id, amount, dispenseForm.reason, dispenseForm.memberId, resolvedPrice);
        if (success) {
            setDispenseModalOpen(false);
            loadDispensaryStock(); // Refresh stock
        } else {
            alert("Error al dispensar");
        }
    };

    const handleEditDispensary = (batch: DispensaryBatch) => {
        setBatchToEditDispensary(batch);
        setEditDispensaryModalOpen(true);
    };

    const handleDeleteDispensary = (batch: DispensaryBatch) => {
        setBatchToDeleteDispensary(batch);
        setDeleteDispensaryModalOpen(true);
    };

    const confirmDeleteDispensary = async () => {
        if (batchToDeleteDispensary) {
            const success = await dispensaryService.deleteBatch(batchToDeleteDispensary.id);
            if (success) {
                await loadDispensaryStock();
                setDeleteDispensaryModalOpen(false);
                setBatchToDeleteDispensary(null);
            } else {
                alert("Error al eliminar el lote del dispensario");
            }
        }
    };

    return (
        <PageContainer>
            <PrintStyles />
            <Header>
                <h1><FaHandHoldingMedical style={{ marginRight: '10px' }} />Dispensario</h1>
            </Header>

            {dispensaryBatches.length === 0 ? (
                <EmptyState>
                    <div className="empty-icon">🏥</div>
                    <h3>El Dispensario está vacío</h3>
                    <p>Finaliza cultivos para generar stock de producto terminado.</p>
                </EmptyState>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {dispensaryBatches.map(batch => (
                        <div key={batch.id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            padding: '1.5rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Status Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: batch.status === 'available' ? '#c6f6d5' : '#feebc8',
                                color: batch.status === 'available' ? '#22543d' : '#744210',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {batch.status === 'available' ? 'Disponible' : batch.status === 'curing' ? 'Curándose' : batch.status}
                            </div>

                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2d3748', fontSize: '1.25rem' }}>{batch.strain_name}</h3>
                            <div style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaBoxOpen /> {batch.batch_code}
                            </div>

                            {/* Weight Visualization */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 'bold', color: '#4a5568' }}>
                                    <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Actual</span>
                                    <span>{batch.current_weight}g <span style={{ fontWeight: 'normal', color: '#a0aec0', fontSize: '0.9rem' }}>/ {batch.initial_weight}g</span></span>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(batch.current_weight / batch.initial_weight) * 100}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, #48bb78 0%, #38a169 100%)`,
                                        borderRadius: '4px'
                                    }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                                <ButtonComp
                                    onClick={() => handleOpenDispense(batch)}
                                    style={{ justifyContent: 'center', background: '#319795', borderColor: '#319795', color: 'white' }}
                                >
                                    <FaHandHoldingMedical /> Dispensar
                                </ButtonComp>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                    <Tooltip text="Ver Código QR">
                                        <ButtonComp
                                            onClick={() => { setQrBatch(batch); setQrModalOpen(true); }}
                                            style={{ justifyContent: 'center', background: 'white', borderColor: '#e2e8f0', color: '#4a5568', width: '100%' }}
                                        >
                                            <FaQrcode />
                                        </ButtonComp>
                                    </Tooltip>
                                    <Tooltip text="Editar Lote">
                                        <ButtonComp
                                            onClick={() => handleEditDispensary(batch)}
                                            style={{ justifyContent: 'center', background: 'white', borderColor: '#e2e8f0', color: '#3182ce', width: '100%' }}
                                        >
                                            <FaEdit />
                                        </ButtonComp>
                                    </Tooltip>
                                    <Tooltip text="Eliminar Lote">
                                        <ButtonComp
                                            onClick={() => handleDeleteDispensary(batch)}
                                            style={{ justifyContent: 'center', background: 'white', borderColor: '#e2e8f0', color: '#e53e3e', width: '100%' }}
                                        >
                                            <FaTrash />
                                        </ButtonComp>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dispense Modal */}
            <Modal isOpen={dispenseModalOpen}>
                <ModalContent>
                    <h2>💊 Dispensar Producto</h2>
                    <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
                        Lote: <strong>{batchToDispense?.strain_name}</strong>
                        <br />
                        Disponible: {batchToDispense?.current_weight}g
                        {resolvedPrice > 0 && (
                            <>
                                <br />
                                Precio: <strong>${resolvedPrice}/g</strong>
                            </>
                        )}
                    </p>

                    <FormGroup>
                        <label>Cantidad a Retirar (g)</label>
                        <input
                            type="number"
                            autoFocus
                            placeholder="0.0"
                            value={dispenseForm.amount}
                            onChange={e => setDispenseForm({ ...dispenseForm, amount: e.target.value })}
                            max={batchToDispense?.current_weight}
                        />
                    </FormGroup>

                    {resolvedPrice > 0 && dispenseForm.amount && !isNaN(parseFloat(dispenseForm.amount)) && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fff4', borderRadius: '0.5rem', border: '1px solid #c6f6d5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#2f855a', fontWeight: '600' }}>Costo Total:</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22543d' }}>
                                ${(parseFloat(dispenseForm.amount) * resolvedPrice).toFixed(2)}
                            </span>
                        </div>
                    )}

                    <FormGroup style={{ marginTop: '1rem' }}>
                        <label>Motivo</label>
                        <select
                            value={dispenseForm.reason}
                            onChange={e => setDispenseForm({ ...dispenseForm, reason: e.target.value })}
                        >
                            <option value="dispensing">Entrega a Socio/Paciente</option>
                            <option value="quality_control">Control de Calidad / Cata</option>
                            <option value="adjustment">Ajuste de Inventario / Merma</option>
                        </select>
                    </FormGroup>

                    {/* Patient Selector */}
                    {dispenseForm.reason === 'dispensing' && (
                        <FormGroup style={{ marginTop: '1rem' }}>
                            <label>Paciente / Socio (Opcional)</label>
                            <select
                                value={dispenseForm.memberId}
                                onChange={e => setDispenseForm({ ...dispenseForm, memberId: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            >
                                <option value="">Seleccionar Paciente...</option>
                                {patients.map(p => (
                                    <option key={p.profile_id} value={p.profile_id}>
                                        {p.profile?.full_name || 'Sin Nombre'} (Límite: {p.monthly_limit}g)
                                    </option>
                                ))}
                            </select>

                            {consumptionStats && (
                                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f7fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>
                                        <span>Consumo Mensual</span>
                                        <span>{consumptionStats.current}g / {consumptionStats.limit}g</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min((consumptionStats.current / consumptionStats.limit) * 100, 100)}%`,
                                            height: '100%',
                                            background: consumptionStats.current >= consumptionStats.limit ? '#e53e3e' : '#38a169',
                                            transition: 'width 0.3s'
                                        }}></div>
                                    </div>
                                    {consumptionStats.current >= consumptionStats.limit && (
                                        <div style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 'bold' }}>
                                            ⚠️ Límite mensual excedido ({consumptionStats.limit}g)
                                        </div>
                                    )}
                                </div>
                            )}
                        </FormGroup>
                    )}

                    <ModalActions>
                        <ButtonComp variant="secondary" onClick={() => setDispenseModalOpen(false)}>Cancelar</ButtonComp>
                        <ButtonComp variant="primary" onClick={confirmDispense} style={{ background: '#319795', borderColor: '#319795' }}>Confirmar Retiro</ButtonComp>
                    </ModalActions>
                </ModalContent>
            </Modal>

            {/* QR Code Modal for Passport */}
            <Modal isOpen={qrModalOpen} onClick={() => setQrModalOpen(false)}>
                <ModalContent onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <h2>📱 Pasaporte Digital</h2>
                    <p style={{ marginBottom: '2rem', color: '#718096' }}>Escanea este código para ver la Ficha Técnica del Lote</p>

                    {qrBatch && (
                        <div style={{ background: 'white', padding: '1rem', display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                            <QRCode
                                value={`${window.location.origin}/passport/${qrBatch.id}`}
                                size={200}
                            />
                        </div>
                    )}

                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2d3748' }}>{qrBatch?.strain_name}</p>
                    <p style={{ fontFamily: 'monospace', color: '#718096' }}>{qrBatch?.batch_code}</p>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <ButtonComp variant="secondary" onClick={() => setQrModalOpen(false)}>Cerrar</ButtonComp>
                        <ButtonComp variant="primary" onClick={() => window.print()} style={{ background: '#2d3748', borderColor: '#2d3748' }}>
                            <FaPrint /> Imprimir Etiqueta
                        </ButtonComp>
                    </div>

                    {/* Printable Content (Hidden until print) */}
                    <div className="printable-label" style={{ display: 'none' }}>
                        <PrintableLabel>
                            <h1>{qrBatch?.strain_name}</h1>
                            <div className="qr-container">
                                <QRCode value={`${window.location.origin}/passport/${qrBatch?.id}`} size={250} />
                            </div>
                            <div className="batch-code">{qrBatch?.batch_code}</div>
                            <h2>{qrBatch?.initial_weight}g / {qrBatch?.status}</h2>
                            <div className="logo">AURORA DEL PLATA</div>
                        </PrintableLabel>
                    </div>
                </ModalContent>
            </Modal>

            {/* Delete Dispensary Modal */}
            <ConfirmModal
                isOpen={deleteDispensaryModalOpen}
                title="Eliminar Lote del Dispensario"
                message={`¿Estás seguro de que deseas eliminar el lote ${batchToDeleteDispensary?.strain_name} (${batchToDeleteDispensary?.batch_code})? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                isDanger
                onClose={() => setDeleteDispensaryModalOpen(false)}
                onConfirm={confirmDeleteDispensary}
            />

            {/* Edit Dispensary Modal */}
            <EditDispensaryModal
                isOpen={editDispensaryModalOpen}
                batch={batchToEditDispensary}
                onClose={() => setEditDispensaryModalOpen(false)}
                onSuccess={() => {
                    setEditDispensaryModalOpen(false);
                    loadDispensaryStock();
                }}
            />
        </PageContainer>
    );
};

export default Dispensary;
