import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaBoxes, FaPlus, FaChevronDown, FaChevronUp, FaEdit, FaTrash, FaTimes, FaHistory, FaHandHoldingMedical, FaFlask, FaCheckSquare } from 'react-icons/fa';
import { dispensaryService, DispensaryBatch, DispensaryMovement } from '../services/dispensaryService';
import { geneticsService } from '../services/geneticsService';
import { Genetic } from '../types/genetics';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';
import { AnimatedModal, CloseIcon } from '../components/AnimatedModal';
import { CustomSelect } from '../components/CustomSelect';

const CollapsibleWrapper = ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | number>(0);

  useEffect(() => {
    if (isOpen) {
      setHeight(contentRef.current?.scrollHeight || 'auto');
    } else {
      setHeight(0);
    }
  }, [isOpen, children]);

  return (
    <div
      style={{
        height: isOpen ? height : 0,
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'height 0.3s ease, opacity 0.3s ease',
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
};

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
    props.variant === 'primary' ? '#38a169' :
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
  box-shadow: ${props => props.variant === 'primary' ? '0 4px 6px rgba(56, 161, 105, 0.2)' : 'none'};

  &:hover {
    transform: translateY(-2px);
    opacity: 1;
    background: ${props =>
    props.variant === 'primary' ? '#2f855a' :
      props.variant === 'ghost' ? '#edf2f7' : undefined};
    box-shadow: ${props => props.variant === 'primary' ? '0 6px 8px rgba(56, 161, 105, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const IconButton = styled.button<{ color: string }>`
  background: white;
  border: 1px solid transparent;
  color: ${props => props.color};
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    background: ${props => props.color}15;
    border-color: ${props => props.color}30;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #2d3748;
    margin-bottom: 0.25rem;
    line-height: 1.2;
  }

  .stat-label {
    color: #718096;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
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

const ExpandedRow = styled.tr<{ $expanded?: boolean }>`
  background: #f8fafc;
  
  td {
    padding: 0 !important;
    border-bottom: ${props => props.$expanded ? '1px solid #e2e8f0' : 'none'};
    transition: border-bottom 0.3s ease;
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
  const [deleteData, setDeleteData] = useState<{ batch: DispensaryBatch | { strain_name: string }, reason: string, isBulk?: boolean } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false); // Custom small modal for reason

  // Selection State
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  const toggleBatchSelection = (batchId: string) => {
    const newSet = new Set(selectedBatches);
    if (newSet.has(batchId)) newSet.delete(batchId);
    else newSet.add(batchId);
    setSelectedBatches(newSet);
  };

  const toggleSelectAllStrain = (strainBatches: DispensaryBatch[]) => {
    const allSelected = strainBatches.every(b => selectedBatches.has(b.id));
    const newSet = new Set(selectedBatches);

    if (allSelected) {
      strainBatches.forEach(b => newSet.delete(b.id));
    } else {
      strainBatches.forEach(b => newSet.add(b.id));
    }
    setSelectedBatches(newSet);
  };

  const deleteSelected = async () => {
    if (selectedBatches.size === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Eliminación Masiva',
      message: `¿Estás seguro de eliminar ${selectedBatches.size} lotes seleccionados? Esta acción no se puede deshacer.`,
      isDanger: true,
      onConfirm: async () => {
        // Set loading state in modal if possible, or use a local state that the modal observes
        // Since ConfirmModal state doesn't have isLoading, let's update the modal message or title to indicate progress?
        // Better: Update the ConfirmModal component to accept isLoading, but first let's see if we can hack it or need to change the component.
        // Actually, looking at the code, I can't easily change the ConfirmModal *implementation* from here if it's imported.
        // BUT, looking at lines 956+, it seems ConfirmModal is hardcoded in this file?
        // Wait, line 303 defines setConfirmModal state.
        // Let's modify the onConfirm to update the modal content to "Eliminando..." before starting.

        setConfirmModal(prev => ({ ...prev, title: 'Eliminando...', message: 'Por favor espere mientras se eliminan los lotes...', isDanger: false }));

        // Small delay to let UI update
        await new Promise(resolve => setTimeout(resolve, 100));

        let successCount = 0;
        const batchesToDelete = Array.from(selectedBatches);
        for (const id of batchesToDelete) {
          const ok = await dispensaryService.deleteBatchWithReason(id, "Eliminación masiva por selección");
          if (ok) successCount++;
        }

        if (successCount > 0) {
          showToast(`Se eliminaron ${successCount} lotes.`, 'success');
          setSelectedBatches(new Set());
          loadData();
        } else {
          showToast("Error al eliminar.", 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // ... (existing code)


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
    const startTime = Date.now();
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

    // Minimum Loading Delay to show logo (3 seconds)
    const elapsedTime = Date.now() - startTime;
    const minimumLoadingTime = 3000; // ms
    if (elapsedTime < minimumLoadingTime) {
      await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - elapsedTime));
    }

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
      code = `MAN - ${date.getFullYear()} -${Math.floor(Math.random() * 1000).toString().padStart(3, '0')} `;
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
    setDeleteData({ batch, reason: '', isBulk: false });
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    if (!deleteData.reason || deleteData.reason.trim().length < 3) {
      showToast("Debes especificar el motivo de eliminación.", 'error');
      return;
    }

    if (deleteData.isBulk) {
      const strainName = (deleteData.batch as any).strain_name;
      const targetBatches = aggregatedStock.find(item => item.strain === strainName)?.batches || [];

      const batchIds = targetBatches.map(b => b.id);
      const success = await dispensaryService.deleteBatchesWithReason(batchIds, deleteData.reason);

      if (success) {
        showToast(`Se eliminaron todos los lotes de ${strainName}.`, 'success');
        loadData();
        setIsDeleteOpen(false);
        setDeleteData(null);
      } else {
        showToast("Error al eliminar lotes.", 'error');
      }

    } else {
      const success = await dispensaryService.deleteBatchWithReason((deleteData.batch as DispensaryBatch).id, deleteData.reason);
      if (success) {
        showToast("Lote dado de baja.", 'success');
        loadData();
        setIsDeleteOpen(false);
        setDeleteData(null);
      } else {
        showToast("Error al eliminar.", 'error');
      }
    }
  };

  // Laboratory Transfer
  const [isLabTransferOpen, setIsLabTransferOpen] = useState(false);
  const [labTransferBatch, setLabTransferBatch] = useState<DispensaryBatch | null>(null);
  const [labTransferAmount, setLabTransferAmount] = useState('');

  const openLabTransfer = (batch: DispensaryBatch) => {
    setLabTransferBatch(batch);
    setLabTransferAmount('');
    setIsLabTransferOpen(true);
  };

  const confirmLabTransfer = async () => {
    if (!labTransferBatch || !labTransferAmount) return;
    const amount = parseFloat(labTransferAmount);
    if (isNaN(amount) || amount <= 0 || amount > labTransferBatch.current_weight) {
      showToast("Cantidad inválida.", 'error');
      return;
    }

    const success = await dispensaryService.transferToLab(labTransferBatch.id, amount);
    if (success) {
      showToast("Enviado al Laboratorio.", 'success');
      setIsLabTransferOpen(false);
      setLabTransferBatch(null);
      loadData();
    } else {
      showToast("Error al enviar al laboratorio.", 'error');
    }
  };

  // Group Dispense
  const [isGroupDispenseOpen, setIsGroupDispenseOpen] = useState(false);
  const [groupDispenseStrain, setGroupDispenseStrain] = useState<string | null>(null);

  // Shop Dispense (Keeping these for legacy/other flows if needed, though replaced by Group Dispense in some contexts)

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

  // Group Lab Transfer
  const [isGroupLabOpen, setIsGroupLabOpen] = useState(false);
  const [groupLabStrain, setGroupLabStrain] = useState<string | null>(null);
  const [groupLabBatches, setGroupLabBatches] = useState<DispensaryBatch[]>([]);
  const [groupLabSelections, setGroupLabSelections] = useState<Record<string, { selected: boolean, amount: string }>>({});

  const openGroupLabTransfer = (strain: string) => {
    const group = aggregatedStock.find(g => g.strain === strain);
    if (!group || !group.batches.length) {
      showToast("No hay lotes disponibles.", 'error');
      return;
    }

    // Initialize selections: all unselected, default amount = current weight
    const initialSelections: Record<string, { selected: boolean, amount: string }> = {};
    group.batches.forEach(b => {
      initialSelections[b.id] = { selected: false, amount: Number(b.current_weight).toFixed(2) };
    });

    setGroupLabStrain(strain);
    setGroupLabBatches(group.batches);
    setGroupLabSelections(initialSelections);
    setIsGroupLabOpen(true);
  };

  const handleGroupLabSelectionChange = (batchId: string, field: 'selected' | 'amount', value: any) => {
    if (field === 'amount') {
      // Limit to 2 decimal places
      if (value && !/^\d*\.?\d{0,2}$/.test(value)) return;
    }
    setGroupLabSelections(prev => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [field]: value
      }
    }));
  };

  const confirmGroupLabTransfer = async () => {
    const selectedIds = Object.keys(groupLabSelections).filter(id => groupLabSelections[id].selected);
    if (selectedIds.length === 0) {
      showToast("Selecciona al menos un lote.", 'error');
      return;
    }

    let successCount = 0;
    for (const batchId of selectedIds) {
      const amountStr = groupLabSelections[batchId].amount;
      const amount = parseFloat(amountStr);
      const batch = groupLabBatches.find(b => b.id === batchId);

      if (!batch || isNaN(amount) || amount <= 0 || amount > batch.current_weight) {
        // Skip or warn?
        continue;
      }

      const ok = await dispensaryService.transferToLab(batchId, amount);
      if (ok) successCount++;
    }

    if (successCount > 0) {
      showToast(`Enviados ${successCount} lotes al Laboratorio.`, 'success');
      setIsGroupLabOpen(false);
      setGroupLabStrain(null);
      loadData();
    } else {
      showToast("Error al enviar lotes.", 'error');
    }
  };

  const handleGroupDispense = (strainName: string) => {
    const item = aggregatedStock.find(i => i.strain === strainName);
    if (!item || !item.batches.length) {
      showToast("No hay lotes disponibles para dispensar.", 'error');
      return;
    }
    setGroupDispenseStrain(strainName);
    setIsGroupDispenseOpen(true);
  };

  // Stats
  // Build a filtered list for display that EXCLUDES 'Laboratorio' items, assuming they shouldn't be in main stock (or maybe they should be separate?)
  // For now, let's keep showing everything but maybe add a filter toggle later.
  // Wait, if we move to Lab, the location changes to 'Laboratorio'. 
  // We might want to filter those out if this page is purely for "Warehouse/Shop" stock?
  // User didn't specify, but usually moving to Lab means it leaves the general stock.
  // The service default `getBatches` returns all except depleted.
  // Let's filter out 'Laboratorio' location from the main list so it doesn't double count if we have a Lab page.

  const stockBatches = aggregatedStock.map(group => ({
    ...group,
    batches: group.batches.filter(b => b.location !== 'Laboratorio')
  })).filter(group => group.batches.length > 0);

  // Re-calculate stats based on filtered list? Or Global?
  // Let's use the full list for "Total Assets" but maybe the table should show available?
  // Actually, better to just show everything for now.
  // ...
  // Re-reading plan: "Filter displayed stock to exclude items in 'Laboratorio'"
  // Okay, let's filter.

  const visibleStock = aggregatedStock.map(group => {
    const visibleBatches = group.batches.filter(b => b.location !== 'Laboratorio');
    return {
      ...group,
      batches: visibleBatches,
      totalWeight: visibleBatches.reduce((sum, b) => sum + b.current_weight, 0),
      batchesCount: visibleBatches.length
    };
  }).filter(g => g.batches.length > 0).sort((a, b) => b.totalWeight - a.totalWeight);


  const totalWeight = visibleStock.reduce((acc, curr) => acc + curr.totalWeight, 0);
  const activeBatchesCount = visibleStock.reduce((acc, curr) => acc + curr.batchesCount, 0);

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
                <th style={{ textAlign: 'right' }}>UNIDADES</th>
                <th style={{ textAlign: 'center' }}>% TOTAL</th>
                <th style={{ width: '120px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {visibleStock.map((item) => {
                const isExpanded = expandedStrains.has(item.strain);
                const percent = totalWeight > 0 ? (item.totalWeight / totalWeight * 100).toFixed(1) : '0';

                return (
                  <React.Fragment key={item.strain}>
                    <tr
                      onClick={() => toggleExpand(item.strain)}
                      style={{ cursor: 'pointer', background: isExpanded ? '#edf2f7' : 'white', transition: 'background 0.2s' }}
                    >
                      <td style={{ textAlign: 'center', color: '#a0aec0' }}>
                        <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                          <FaChevronDown />
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{item.strain}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2d3748' }}>{item.totalWeight.toFixed(1)}g</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {item.batchesCount}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: '#718096' }}>{percent}%</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <IconButton color="#38a169" onClick={(e) => {
                            e.stopPropagation();
                            handleGroupDispense(item.strain);
                          }} title="Dispensar">
                            <FaHandHoldingMedical />
                          </IconButton>
                          <IconButton color="#3182ce" onClick={(e) => {
                            e.stopPropagation();
                            showToast("Edición masiva de genética próximamente.", 'info');
                          }} title="Editar Genética">
                            <FaEdit />
                          </IconButton>
                          <IconButton color="#805ad5" onClick={(e) => {
                            e.stopPropagation();
                            openGroupLabTransfer(item.strain);
                          }} title="Enviar a Laboratorio (Selección Múltiple)">
                            <FaFlask />
                          </IconButton>
                          <IconButton color="#e53e3e" onClick={(e) => {
                            e.stopPropagation();
                            setDeleteData({ batch: { strain_name: item.strain }, reason: '', isBulk: true });
                            setIsDeleteOpen(true);
                          }} title="Eliminar Todos">
                            <FaTrash />
                          </IconButton>
                        </div>
                      </td>
                    </tr>


                    <ExpandedRow $expanded={isExpanded}>
                      <td colSpan={6}>
                        <CollapsibleWrapper isOpen={isExpanded}>
                          <div style={{ padding: '1rem 0' }}>
                            {/* Bulk Actions Toolbar for this strain if items selected */}
                            {item.batches.some(b => selectedBatches.has(b.id)) && (
                              <div style={{ background: '#ebf8ff', padding: '0.5rem 1rem', marginBottom: '0.5rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.85rem', color: '#2b6cb0', fontWeight: 'bold' }}>
                                  {item.batches.filter(b => selectedBatches.has(b.id)).length} seleccionados
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <ActionButton variant="danger" onClick={deleteSelected} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                                    <FaTrash /> Eliminar Seleccionados
                                  </ActionButton>
                                </div>
                              </div>
                            )}

                            <DetailTable>
                              <thead>
                                <tr style={{ color: '#718096', fontSize: '0.8rem', borderBottom: '1px solid #e2e8f0' }}>
                                  <th style={{ width: '40px', textAlign: 'center', padding: '0.5rem' }}>
                                    <input
                                      type="checkbox"
                                      checked={item.batches.length > 0 && item.batches.every(b => selectedBatches.has(b.id))}
                                      onChange={() => toggleSelectAllStrain(item.batches)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                  </th>
                                  <th style={{ padding: '0.5rem' }}>FECHA</th>
                                  <th style={{ padding: '0.5rem' }}>CÓDIGO</th>
                                  <th style={{ padding: '0.5rem' }}>PESO</th>
                                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>ACCIONES</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.batches.map(batch => {
                                  // Color Logic
                                  let rowBg = 'transparent';
                                  if (batch.current_weight === 0) rowBg = '#fed7d7'; // Depleted -> Red
                                  else if (batch.status === 'available') rowBg = '#c6f6d5'; // Dispensing -> Green

                                  const isSelected = selectedBatches.has(batch.id);

                                  return (
                                    <tr key={batch.id} style={{ background: isSelected ? '#ebf8ff' : rowBg }}>
                                      <td style={{ textAlign: 'center' }}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleBatchSelection(batch.id)}
                                          style={{ cursor: 'pointer' }}
                                        />
                                      </td>
                                      <td style={{ width: '15%', color: '#718096' }}>{new Date(batch.created_at).toLocaleDateString()}</td>
                                      <td style={{ width: '30%', fontWeight: '600' }}>{batch.batch_code}</td>
                                      <td style={{ width: '25%', fontWeight: 'bold', color: '#2d3748' }}>{Number(batch.current_weight).toFixed(2)}g / {Number(batch.initial_weight).toFixed(2)}g</td>
                                      <td style={{ width: '25%', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                          <IconButton color="#3182ce" onClick={(e) => { e.stopPropagation(); openEdit(batch); }} title="Editar">
                                            <FaEdit />
                                          </IconButton>
                                          <IconButton color="#e53e3e" onClick={(e) => { e.stopPropagation(); initDelete(batch); }} title="Eliminar">
                                            <FaTrash />
                                          </IconButton>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </DetailTable>
                          </div>
                        </CollapsibleWrapper>
                      </td>
                    </ExpandedRow>
                  </React.Fragment>
                );
              })}
              {visibleStock.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>No hay stock disponible.</td></tr>
              )}
            </tbody>
          </MainTable>
        </TableContainer>
      )}

      {/* CREATE MODAL */}
      <AnimatedModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <CloseIcon onClick={() => setIsCreateOpen(false)}><FaTimes /></CloseIcon>
        <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlus /> Nuevo Lote Manual
        </h2>
        <FormGroup style={{ zIndex: 20 }}>
          <label>Genética</label>
          <CustomSelect
            value={newBatch.strain_name}
            onChange={(val) => setNewBatch({ ...newBatch, strain_name: val })}
            options={genetics.map(g => ({ value: g.name, label: g.name }))}
            placeholder="Seleccionar Genética..."
          />
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <ActionButton variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</ActionButton>
          <ActionButton variant="primary" onClick={handleCreateBatch}>Crear Lote</ActionButton>
        </div>
      </AnimatedModal>

      {/* EDIT MODAL */}
      <AnimatedModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
        {editingBatch && (
          <>
            <CloseIcon onClick={() => setIsEditOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaEdit /> Editar Lote: {editingBatch.batch_code}
            </h2>

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
          </>
        )}
      </AnimatedModal>

      {/* DELETE REASON MODAL */}
      <AnimatedModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        {deleteData && (
          <>
            <CloseIcon onClick={() => setIsDeleteOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTrash /> {deleteData.isBulk ? 'Eliminación Masiva' : 'Baja de Lote'}
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              {deleteData.isBulk ? (
                <>Estás por eliminar <strong>TODOS</strong> los lotes de la genética <strong>{(deleteData.batch as any).strain_name}</strong>.</>
              ) : (
                <>Estás por eliminar el lote <strong>{(deleteData.batch as DispensaryBatch).batch_code}</strong>. Esta acción dará de baja todo el stock restante ({(deleteData.batch as DispensaryBatch).current_weight}g).</>
              )}
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
          </>
        )}
      </AnimatedModal>

      {/* GLOBAL CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '1rem',
            width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: confirmModal.isDanger ? '#e53e3e' : '#2d3748' }}>
              {confirmModal.title}
            </h3>
            <p style={{ marginBottom: '1.5rem', color: '#4a5568' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <ActionButton variant="secondary" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                Cancelar
              </ActionButton>
              <ActionButton
                variant={confirmModal.isDanger ? 'danger' : 'primary'}
                onClick={async () => {
                  // Quick Loading State hack: change text/disable
                  const btn = document.activeElement as HTMLButtonElement;
                  if (btn) { btn.disabled = true; btn.innerText = "Procesando..."; }
                  await confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
              >
                Confirmar
              </ActionButton>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      <AnimatedModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} wide>
        <CloseIcon onClick={() => setIsHistoryOpen(false)}><FaTimes /></CloseIcon>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
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
      </AnimatedModal>

      {/* GROUP DISPENSE SELECTION MODAL */}
      <AnimatedModal isOpen={isGroupDispenseOpen} onClose={() => setIsGroupDispenseOpen(false)} wide>
        {groupDispenseStrain && (
          <>
            <CloseIcon onClick={() => setIsGroupDispenseOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2d3748' }}>
              <FaHandHoldingMedical /> Dispensar: {groupDispenseStrain}
            </h2>
            <p style={{ marginBottom: '1rem', color: '#718096' }}>Selecciona la unidad de la cual deseas dispensar:</p>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #edf2f7', color: '#718096' }}>
                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                    <th style={{ padding: '0.75rem' }}>Código</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Stock Actual</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedStock.find(s => s.strain === groupDispenseStrain)?.batches
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // FIFO display
                    .map(batch => (
                      <tr key={batch.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '0.75rem' }}>{new Date(batch.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{batch.batch_code}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <span style={{ fontWeight: 'bold', color: batch.current_weight > 0 ? '#38a169' : '#e53e3e' }}>
                            {batch.current_weight}g
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <ActionButton
                            variant="primary"
                            disabled={batch.current_weight <= 0}
                            onClick={() => openDispenseToShop(batch)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', margin: '0 auto' }}
                          >
                            Seleccionar
                          </ActionButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AnimatedModal>

      {/* DISPENSE TO SHOP MODAL */}
      <AnimatedModal isOpen={isDispenseToShopOpen} onClose={() => setIsDispenseToShopOpen(false)}>
        {dispenseToShopBatch && (
          <>
            <CloseIcon onClick={() => setIsDispenseToShopOpen(false)}><FaTimes /></CloseIcon>
            <h2 style={{ marginBottom: '1rem', color: '#319795', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaHandHoldingMedical /> Enviar al Dispensario
            </h2>
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
          </>
        )}
      </AnimatedModal>



      {/* GROUP LAB TRANSFER MODAL */}
      <AnimatedModal isOpen={isGroupLabOpen} onClose={() => setIsGroupLabOpen(false)} wide>
        <CloseIcon onClick={() => setIsGroupLabOpen(false)}><FaTimes /></CloseIcon>
        <h2 style={{ marginBottom: '1.5rem', color: '#38a169', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaFlask /> Enviar a Laboratorio: {groupLabStrain}
        </h2>
        <p style={{ marginBottom: '1rem', color: '#718096', fontSize: '0.9rem' }}>
          Selecciona los lotes y cantidades que deseas enviar al laboratorio.
        </p>

        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead style={{ background: '#f7fafc', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'center', width: '50px', color: '#a0aec0' }}><FaCheckSquare /></th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Lote</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Disp.</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Enviar (g)</th>
              </tr>
            </thead>
            <tbody>
              {groupLabBatches.map(batch => {
                const selection = groupLabSelections[batch.id] || { selected: false, amount: '' };
                return (
                  <tr key={batch.id} style={{ borderTop: '1px solid #e2e8f0', background: selection.selected ? '#f0fff4' : 'transparent' }}>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selection.selected}
                        onChange={(e) => handleGroupLabSelectionChange(batch.id, 'selected', e.target.checked)}
                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{batch.batch_code}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#4a5568' }}>{Number(batch.current_weight).toFixed(2)}g</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <input
                        type="number"
                        value={selection.amount}
                        onChange={(e) => handleGroupLabSelectionChange(batch.id, 'amount', e.target.value)}
                        disabled={!selection.selected}
                        style={{
                          width: '80px',
                          padding: '0.25rem',
                          textAlign: 'right',
                          border: '1px solid #cbd5e0',
                          borderRadius: '0.25rem',
                          background: selection.selected ? 'white' : '#edf2f7'
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <ActionButton variant="secondary" onClick={() => setIsGroupLabOpen(false)}>Cancelar</ActionButton>
          <ActionButton variant="primary" style={{ background: '#38a169' }} onClick={confirmGroupLabTransfer}>Confirmar Envío</ActionButton>
        </div>
      </AnimatedModal>

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

      {/* LAB TRANSFER MODAL */}
      <AnimatedModal isOpen={isLabTransferOpen} onClose={() => setIsLabTransferOpen(false)}>
        <CloseIcon onClick={() => setIsLabTransferOpen(false)}><FaTimes /></CloseIcon>
        <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaFlask /> Enviar a Laboratorio
        </h2>
        {labTransferBatch && (
          <div style={{ marginBottom: '1.5rem', background: '#f7fafc', padding: '1rem', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{labTransferBatch.strain_name}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>Lote: {labTransferBatch.batch_code}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>Disponible: {labTransferBatch.current_weight}g</p>
          </div>
        )}
        <FormGroup>
          <label>Cantidad a enviar (g)</label>
          <input
            type="number"
            value={labTransferAmount}
            onChange={e => setLabTransferAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </FormGroup>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <ActionButton variant="secondary" onClick={() => setIsLabTransferOpen(false)}>Cancelar</ActionButton>
          <ActionButton variant="primary" onClick={confirmLabTransfer}>Confirmar Envío</ActionButton>
        </div>
      </AnimatedModal>

    </PageContainer >
  );
};

export default Stock;
