import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaBoxes, FaPlus, FaChevronDown, FaChevronUp, FaEdit, FaTrash, FaTimes, FaHistory, FaArrowRight, FaArrowDown, FaArrowUp, FaHandHoldingMedical } from 'react-icons/fa';
import { dispensaryService, DispensaryBatch, DispensaryMovement } from '../services/dispensaryService';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';

// --- Styled Components ---

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 5rem;
  max-width: 1400px;
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
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' | 'ghost' | 'info' }>`
  background: ${props =>
    props.variant === 'primary' ? '#319795' :
      props.variant === 'danger' ? '#e53e3e' :
        props.variant === 'info' ? '#3182ce' :
          props.variant === 'secondary' ? 'white' : 'transparent'};
  color: ${props =>
    props.variant === 'primary' || props.variant === 'danger' || props.variant === 'info' ? 'white' :
      props.variant === 'secondary' ? '#2d3748' : '#4a5568'};
  border: ${props => props.variant === 'secondary' ? '1px solid #e2e8f0' : 'none'};
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
    background: ${props => props.variant === 'ghost' ? '#edf2f7' : undefined};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  
  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
`;

const MainTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    padding: 1rem;
    text-align: left;
    background: #f8fafc;
    color: #64748b;
    font-weight: 600;
    font-size: 0.85rem;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const ExpandedRow = styled.tr`
  background: #f8fafc;
  
  td {
    padding: 0 !important;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const DetailTable = styled.table`
  width: 100%;
  background: #f8fafc;
  
  td {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-bottom: 1px solid #e2e8f0;
    color: #475569;
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div<{ wide?: boolean }>`
  background: white; padding: 2rem; border-radius: 1rem; width: 90%; 
  max-width: ${props => props.wide ? '900px' : '500px'};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  max-height: 85vh;
  overflow-y: auto;
`;

const CloseIcon = styled.button`
    position: absolute; top: 1rem; right: 1rem;
    background: none; border: none; color: #a0aec0;
    cursor: pointer; font-size: 1.25rem;
    &:hover { color: #4a5568; }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; font-size: 0.9rem; }
  input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.95rem; }
`;

// --- Interfaces ---
interface AggregatedStock {
  strain: string;
  totalWeight: number;
  batchesCount: number;
  batches: DispensaryBatch[];
}

const Stock: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [aggregatedStock, setAggregatedStock] = useState<AggregatedStock[]>([]);
  const [expandedStrains, setExpandedStrains] = useState<Set<string>>(new Set());

  // History State
  const [movements, setMovements] = useState<DispensaryMovement[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<DispensaryBatch | null>(null);

  // Form States
  const [newBatch, setNewBatch] = useState({
    strain_name: '',
    initial_weight: '',
    batch_code: '',
    quality_grade: 'Standard',
    location: 'Depósito General',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    current_weight: '',
    quality_grade: 'Standard',
    location: '',
    notes: '',
    reason: '',
    movementType: 'adjustment'
  });

  // Dispense to Shop
  const [isDispenseToShopOpen, setIsDispenseToShopOpen] = useState(false);
  const [dispenseToShopBatch, setDispenseToShopBatch] = useState<DispensaryBatch | null>(null);
  const [dispenseToShopAmount, setDispenseToShopAmount] = useState('');

  // Delete Prompt
  const [deleteData, setDeleteData] = useState<{ batch: DispensaryBatch, reason: string } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // Custom small modal for reason

  // Feedback States
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDanger: false
  });

  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ isOpen: true, message, type });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [batches, geneticsList] = await Promise.all([
      dispensaryService.getBatches(),
      geneticsService.getGenetics()
    ]);

    setGenetics(geneticsList as Genetic[]);

    // Aggregate Data
    const items: { [key: string]: AggregatedStock } = {};
    batches.forEach(b => {
      const strainName = b.strain_name || 'Sin Genética';
      if (!items[strainName]) {
        items[strainName] = { strain: strainName, totalWeight: 0, batchesCount: 0, batches: [] };
      }
      items[strainName].totalWeight += b.current_weight;
      items[strainName].batchesCount += 1;
      items[strainName].batches.push(b);
    });

    setAggregatedStock(Object.values(items).sort((a, b) => b.totalWeight - a.totalWeight));
    setIsLoading(false);
  };

  const loadMovements = async () => {
    const data = await dispensaryService.getMovements(50);
    setMovements(data);
  };

  const toggleExpand = (strain: string) => {
    const newSet = new Set(expandedStrains);
    if (newSet.has(strain)) newSet.delete(strain);
    else newSet.add(strain);
    setExpandedStrains(newSet);
  };

  const handleOpenHistory = () => {
    loadMovements();
    setIsHistoryOpen(true);
  };

  // --- Actions ---

  const handleCreateBatch = async () => {
    if (!newBatch.strain_name || !newBatch.initial_weight) {
      showToast("Faltan campos obligatorios.", 'error');
      return;
    }

    let code = newBatch.batch_code;
    if (!code) {
      const date = new Date();
      code = `MAN-${date.getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    }

    const batchData: any = {
      strain_name: newBatch.strain_name,
      batch_code: code,
      initial_weight: parseFloat(newBatch.initial_weight),
      quality_grade: newBatch.quality_grade,
      status: 'curing',
      location: newBatch.location,
      notes: newBatch.notes || 'Carga Manual'
    };

    const created = await dispensaryService.createBatch(batchData);
    if (created) {
      showToast("Lote creado exitosamente.", 'success');
      setIsCreateOpen(false);
      setNewBatch({ strain_name: '', initial_weight: '', batch_code: '', quality_grade: 'Standard', location: 'Depósito General', notes: '' });
      loadData();
    } else {
      showToast("Error al crear el lote.", 'error');
    }
  };

  const openEdit = (batch: DispensaryBatch) => {
    setEditingBatch(batch);
    setEditForm({
      current_weight: batch.current_weight.toString(),
      quality_grade: batch.quality_grade,
      location: batch.location,
      notes: batch.notes || '',
      reason: '',
      movementType: 'adjustment'
    });
    setIsEditOpen(true);
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    if (!editForm.reason || editForm.reason.trim().length < 3) {
      showToast("Debes especificar un motivo válido.", 'error');
      return;
    }

    const updates: Partial<DispensaryBatch> = {
      current_weight: parseFloat(editForm.current_weight),
      notes: editForm.notes
    };

    const success = await dispensaryService.updateBatchWithReason(editingBatch.id, updates, editForm.reason, editForm.movementType as any);
    if (success) {
      showToast("Lote actualizado.", 'success');
      setIsEditOpen(false);
      setEditingBatch(null);
      loadData();
    } else {
      showToast("Error al actualizar.", 'error');
    }
  };

  const initDelete = (batch: DispensaryBatch) => {
    setDeleteData({ batch, reason: '' });
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    if (!deleteData.reason || deleteData.reason.trim().length < 3) {
      showToast("Debes especificar el motivo de eliminación.", 'error');
      return;
    }

    const success = await dispensaryService.deleteBatchWithReason(deleteData.batch.id, deleteData.reason);
    if (success) {
      showToast("Lote dado de baja.", 'success');
      loadData();
      setIsDeleteOpen(false);
      setDeleteData(null);
    } else {
      showToast("Error al eliminar.", 'error');
    }
  };

  const openDispenseToShop = (batch: DispensaryBatch) => {
    setDispenseToShopBatch(batch);
    setDispenseToShopAmount('');
    setIsDispenseToShopOpen(true);
  };

  const confirmDispenseToShop = async () => {
    if (!dispenseToShopBatch || !dispenseToShopAmount) return;
    const amount = parseFloat(dispenseToShopAmount);
    if (isNaN(amount) || amount <= 0 || amount > dispenseToShopBatch.current_weight) {
      showToast("Cantidad inválida.", 'error');
      return;
    }

    const success = await dispensaryService.dispenseToShop(dispenseToShopBatch.id, amount);
    if (success) {
      showToast("Enviado al Dispensario.", 'success');
      setIsDispenseToShopOpen(false);
      setDispenseToShopBatch(null);
      loadData();
    } else {
      showToast("Error al enviar.", 'error');
    }
  };

  // Stats
  const totalWeight = aggregatedStock.reduce((acc, curr) => acc + curr.totalWeight, 0);
  const activeBatchesCount = aggregatedStock.reduce((acc, curr) => acc + curr.batchesCount, 0);

  return (
    <PageContainer>
      <Header>
        <h1><FaBoxes /> Stock & Inventario</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <ActionButton variant="info" onClick={handleOpenHistory}>
            <FaHistory /> Historial
          </ActionButton>
          <ActionButton variant="primary" onClick={() => setIsCreateOpen(true)}>
            <FaPlus /> Nuevo Lote Manual
          </ActionButton>
        </div>

      </Header>

      <StatsGrid>
        <StatCard>
          <div className="stat-value">{totalWeight.toFixed(1)}g</div>
          <div className="stat-label">Total en Stock</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{aggregatedStock.length}</div>
          <div className="stat-label">Variedades</div>
        </StatCard>
        <StatCard>
          <div className="stat-value">{activeBatchesCount}</div>
          <div className="stat-label">Lotes Activos</div>
        </StatCard>
      </StatsGrid>

      {isLoading ? (
        <LoadingSpinner text="Cargando inventario..." />
      ) : (
        <TableContainer>
          <MainTable>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>GENÉTICA</th>
                <th style={{ textAlign: 'right' }}>PESO TOTAL</th>
                <th style={{ textAlign: 'right' }}>LOTES</th>
                <th style={{ textAlign: 'center' }}>% TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedStock.map((item) => {
                const isExpanded = expandedStrains.has(item.strain);
                const percent = totalWeight > 0 ? (item.totalWeight / totalWeight * 100).toFixed(1) : '0';

                return (
                  <React.Fragment key={item.strain}>
                    <tr
                      onClick={() => toggleExpand(item.strain)}
                      style={{ cursor: 'pointer', background: isExpanded ? '#edf2f7' : 'white' }}
                    >
                      <td style={{ textAlign: 'center', color: '#a0aec0' }}>
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{item.strain}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2d3748' }}>{item.totalWeight.toFixed(1)}g</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {item.batchesCount}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#718096' }}>{percent}%</td>
                    </tr>
                    {isExpanded && (
                      <ExpandedRow>
                        <td colSpan={5}>
                          <DetailTable>
                            <tbody>
                              {item.batches.map(batch => {
                                // Color Logic
                                let rowBg = 'transparent';
                                if (batch.current_weight === 0) rowBg = '#fed7d7'; // Depleted -> Red
                                else if (batch.status === 'available') rowBg = '#c6f6d5'; // Dispensing -> Green

                                return (
                                  <tr key={batch.id} style={{ background: rowBg }}>
                                    <td style={{ width: '15%', color: '#718096' }}>{new Date(batch.created_at).toLocaleDateString()}</td>
                                    <td style={{ width: '30%', fontWeight: '600' }}>{batch.batch_code}</td>
                                    {/* Quality and Location removed */}
                                    <td style={{ width: '25%', fontWeight: 'bold', color: '#2d3748' }}>{batch.current_weight}g / {batch.initial_weight}g</td>
                                    <td style={{ width: '25%', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                        {/* Dispense Button */}
                                        <ActionButton variant="primary" style={{ padding: '8px 12px', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); openDispenseToShop(batch); }} disabled={batch.current_weight === 0} title="Dispensar">
                                          <FaHandHoldingMedical />
                                        </ActionButton>
                                        <ActionButton variant="info" style={{ padding: '8px 12px', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); openEdit(batch); }} title="Editar">
                                          <FaEdit />
                                        </ActionButton>
                                        <ActionButton variant="danger" style={{ padding: '8px 12px', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={(e) => { e.stopPropagation(); initDelete(batch); }} title="Eliminar">
                                          <FaTrash />
                                        </ActionButton>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </DetailTable>
                        </td>
                      </ExpandedRow>
                    )}
                  </React.Fragment>
                );
              })}
              {aggregatedStock.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>No hay stock disponible.</td></tr>
              )}
            </tbody>
          </MainTable>
        </TableContainer>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <ModalOverlay>
          <ModalContent>
            <CloseIcon onClick={() => setIsCreateOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1.5rem' }}>Nuevo Lote Manual</h2>
            <FormGroup>
              <label>Genética</label>
              <select
                value={newBatch.strain_name}
                onChange={e => setNewBatch({ ...newBatch, strain_name: e.target.value })}
              >
                <option value="">Seleccionar Genética...</option>
                {genetics.map(g => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </FormGroup>
            <FormGroup>
              <label>Peso Inicial (g)</label>
              <input
                type="number"
                value={newBatch.initial_weight}
                onChange={e => setNewBatch({ ...newBatch, initial_weight: e.target.value })}
                placeholder="0.00"
              />
            </FormGroup>
            {/* ... other fields similar to previous edit ... */}
            {/* Quality and Location inputs removed */}
            <FormGroup>
              <label>Notas</label>
              <textarea value={newBatch.notes} onChange={e => setNewBatch({ ...newBatch, notes: e.target.value })} rows={2} />
            </FormGroup>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <ActionButton variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</ActionButton>
              <ActionButton variant="primary" onClick={handleCreateBatch}>Crear Lote</ActionButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingBatch && (
        <ModalOverlay>
          <ModalContent>
            <CloseIcon onClick={() => setIsEditOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem' }}>Editar Lote: {editingBatch.batch_code}</h2>

            <FormGroup>
              <label>Peso Actual (g) <small style={{ fontWeight: 'normal', color: '#718096' }}>(Control Manual)</small></label>
              <input type="number" value={editForm.current_weight} onChange={e => setEditForm({ ...editForm, current_weight: e.target.value })} />
            </FormGroup>

            <FormGroup>
              <label>Tipo de Movimiento</label>
              <select value={editForm.movementType} onChange={e => setEditForm({ ...editForm, movementType: e.target.value })}>
                <option value="adjustment">Ajuste (Corrección)</option>
                <option value="dispense">Venta</option>
                <option value="quality_test">Muestra / Test</option>
                <option value="restock">Ingreso / Devolución</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label style={{ color: '#e53e3e' }}>Motivo del Cambio (Requerido)</label>
              <input
                type="text"
                value={editForm.reason}
                onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                placeholder="Ej: Ajuste por merma, Error de carga..."
                style={{ borderColor: '#fc8181' }}
              />
            </FormGroup>

            {/* Quality and Location inputs removed */}
            <FormGroup>
              <label>Notas</label>
              <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
            </FormGroup>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <ActionButton variant="secondary" onClick={() => setIsEditOpen(false)}>Cancelar</ActionButton>
              <ActionButton variant="primary" onClick={handleUpdateBatch}>Guardar Cambios</ActionButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* DELETE REASON MODAL */}
      {isDeleteOpen && deleteData && (
        <ModalOverlay>
          <ModalContent style={{ maxWidth: '400px' }}>
            <CloseIcon onClick={() => setIsDeleteOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem', color: '#e53e3e' }}>Baja de Lote</h2>
            <p style={{ marginBottom: '1rem' }}>
              Estás por eliminar el lote <strong>{deleteData.batch.batch_code}</strong>.
              Esta acción dará de baja todo el stock restante ({deleteData.batch.current_weight}g).
            </p>
            <FormGroup>
              <label>Motivo de Baja (Requerido)</label>
              <textarea
                value={deleteData.reason}
                onChange={e => setDeleteData({ ...deleteData, reason: e.target.value })}
                rows={3}
                placeholder="Ej: Hongos, Error administrativo, Consumo interno..."
                style={{ borderColor: '#fc8181' }}
              />
            </FormGroup>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <ActionButton variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancelar</ActionButton>
              <ActionButton variant="danger" onClick={confirmDelete}>Confirmar Baja</ActionButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* HISTORY MODAL */}
      {isHistoryOpen && (
        <ModalOverlay>
          <ModalContent wide>
            <CloseIcon onClick={() => setIsHistoryOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaHistory /> Historial de Movimientos
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f7fafc', borderBottom: '2px solid #edf2f7', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                    <th style={{ padding: '0.75rem' }}>Tipo</th>
                    <th style={{ padding: '0.75rem' }}>Lote / Genética</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cantidad</th>
                    <th style={{ padding: '0.75rem' }}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map(mov => (
                    <tr key={mov.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.75rem' }}>{new Date(mov.created_at).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                          background: mov.type === 'dispense' ? '#c6f6d5' : mov.type === 'adjustment' ? '#feebc8' : mov.type === 'disposal' ? '#fed7d7' : '#edf2f7',
                          color: mov.type === 'dispense' ? '#22543d' : mov.type === 'adjustment' ? '#744210' : mov.type === 'disposal' ? '#822727' : '#4a5568'
                        }}>
                          {{
                            dispense: 'VENTA',
                            adjustment: 'AJUSTE',
                            disposal: 'BAJA',
                            restock: 'INGRESO',
                            quality_test: 'TEST'
                          }[mov.type] || mov.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{mov.batch?.batch_code || '-'}</strong>
                        <br />
                        <span style={{ color: '#718096', fontSize: '0.8rem' }}>{mov.batch?.strain_name}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: mov.amount > 0 ? 'green' : 'red' }}>
                        {mov.amount > 0 ? '+' : ''}{mov.amount}g
                      </td>
                      <td style={{ padding: '0.75rem', color: '#4a5568' }}>{mov.reason || '-'}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>No hay movimientos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* DISPENSE TO SHOP MODAL */}
      {isDispenseToShopOpen && dispenseToShopBatch && (
        <ModalOverlay>
          <ModalContent>
            <CloseIcon onClick={() => setIsDispenseToShopOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem', color: '#319795' }}><FaHandHoldingMedical /> Enviar al Dispensario</h2>
            <p>Transferir stock de <strong>{dispenseToShopBatch.batch_code}</strong> al punto de venta.</p>
            <p>Disponible: <strong>{dispenseToShopBatch.current_weight}g</strong></p>

            <FormGroup style={{ marginTop: '1rem' }}>
              <label>Cantidad a Enviar (g)</label>
              <input
                type="number"
                autoFocus
                value={dispenseToShopAmount}
                onChange={e => setDispenseToShopAmount(e.target.value)}
                placeholder="0.00"
                max={dispenseToShopBatch.current_weight}
              />
            </FormGroup>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <ActionButton variant="secondary" onClick={() => setIsDispenseToShopOpen(false)}>Cancelar</ActionButton>
              <ActionButton variant="primary" onClick={confirmDispenseToShop}>Enviar</ActionButton>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmModal.isDanger}
      />

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />

    </PageContainer>
  );
};

export default Stock;
