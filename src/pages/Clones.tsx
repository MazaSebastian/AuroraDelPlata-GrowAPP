
import React, { useState, useEffect } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FaCut, FaHistory, FaPlus, FaBarcode, FaEdit, FaTrash, FaTimes, FaExchangeAlt, FaCheckCircle, FaLevelUpAlt, FaMinusCircle, FaThermometerHalf, FaTint } from 'react-icons/fa';
import { Tooltip } from '../components/Tooltip';
import { roomsService } from '../services/roomsService';
import { geneticsService } from '../services/geneticsService';
import { environmentService } from '../services/environmentService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';

import { Room } from '../types/rooms';
import QRCode from 'react-qr-code';
import { TuyaManager } from '../components/TuyaManager';

const Container = styled.div`
  padding: 2rem;
  padding-top: 5rem;
  max-width: 1400px;
  margin: 0 auto;
`;

// --- New Environment Components ---
const EnvironmentSection = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const EnvCard = styled.div<{ type: 'temp' | 'humidity' }>`
  flex: 1;
  min-width: 180px;
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border-left: 4px solid ${p => p.type === 'temp' ? '#e53e3e' : '#3182ce'};
  
  .info {
    display: flex;
    flex-direction: column;
  }

  .label {
    font-size: 0.75rem;
    color: #718096;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.15rem;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
  }

  .icon {
    font-size: 1.75rem;
    opacity: 0.15;
    color: ${p => p.type === 'temp' ? '#e53e3e' : '#3182ce'};
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div<{ isTotal?: boolean }>`
  background: white;
  padding: 1.25rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  border: 1px solid ${p => p.isTotal ? '#b2f5ea' : '#edf2f7'};
  position: relative;
  overflow: hidden;

  ${p => p.isTotal && `
    background: linear-gradient(135deg, #e6fffa 0%, #ffffff 100%);
  `}

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #718096;
    font-weight: 700;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 800;
    color: ${p => p.isTotal ? '#2c7a7b' : '#2d3748'};
    line-height: 1.2;
  }

  .icon {
    position: absolute;
    right: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.75rem;
    opacity: 0.1;
    color: ${p => p.isTotal ? '#319795' : '#4a5568'};
  }
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
    background: linear-gradient(135deg, #38b2ac 0%, #319795 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`;

const CreateButton = styled.button`
  background: #319795;
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
  box-shadow: 0 4px 6px rgba(49, 151, 149, 0.2);

  &:hover {
    background: #2c7a7b;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(49, 151, 149, 0.3);
  }
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const HistoryHeader = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 1rem;
    background: #f7fafc;
    color: #4a5568;
    font-weight: 600;
    border-bottom: 2px solid #edf2f7;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #edf2f7;
    color: #2d3748;
    vertical-align: middle;
  }
`;

const ActionButton = styled.button<{ color: string }>`
    background: white;
    border: 1px solid transparent;
    color: ${p => p.color};
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 0.5rem;

    &:hover {
        background: ${p => p.color}15;
        border-color: ${p => p.color}30;
    }
`;


// Styles for Modal
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
`;

const CloseIcon = styled.button`
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    font-size: 1.25rem;
    &:hover { color: #4a5568; }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #4a5568; }
  input, select, textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.95rem; }
`;



const BarcodeDisplay = styled.div`
    background: white;
    padding: 2rem;
    text-align: center;
    border-radius: 0.5rem;
    border: 2px dashed #cbd5e0;
    margin: 1rem 0;

    .code {
        font-family: 'Courier New', monospace;
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: #2d3748;
        margin-top: 1rem;
        display: block;
    }
    
    .label {
        font-size: 0.85rem;
        color: #718096;
        margin-top: 0.5rem;
    }
`;

const PrintableCloneLabel = styled.div`
  display: none;

  @media print {
    display: flex;
    flex-direction: row; /* Horizontal layout for wide small label */
    align-items: center;
    justify-content: space-between;
    width: 50mm;
    height: 30mm;
    page-break-after: always;
    padding: 2mm;
    box-sizing: border-box;
    overflow: hidden;
    
    /* Ensure only this is printed */
    position: relative;
    
    .qr-side {
        width: 22mm;
        height: 22mm;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .info-side {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        padding-left: 2mm;
        font-family: Arial, sans-serif;
    }

    .name {
        font-size: 10pt;
        font-weight: 800;
        color: black;
        margin-bottom: 2px;
    }

    .meta {
        font-size: 7pt;
        color: black;
        line-height: 1.1;
    }
  }
`;

const PrintStyles = createGlobalStyle`
  @media print {
    @page {
      size: 50mm 30mm;
      margin: 0;
    }
    body * {
      visibility: hidden;
    }
    #printable-clones-area, #printable-clones-area * {
      visibility: visible;
    }
    #printable-clones-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`;

const Clones: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [mothersStates, setMothersStates] = useState<any[]>([]);
    const [cloneBatches, setCloneBatches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [stats, setStats] = useState({ total: 0, byGenetic: {} as Record<string, number> });

    // Environment Data
    const [envData, setEnvData] = useState<{ temperature: number, humidity: number } | null>(null);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBatch, setNewBatch] = useState({
        geneticId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [editForm, setEditForm] = useState({ quantity: '', date: '' });

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState<any>(null);

    // Barcode Modal State
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [viewingBatch, setViewingBatch] = useState<any>(null);
    const [allBatchesHistory, setAllBatchesHistory] = useState<any[]>([]); // To calculate sequences

    // Move Modal State
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [batchToMove, setBatchToMove] = useState<any>(null);
    const [moveToRoomId, setMoveToRoomId] = useState('');
    const [moveQuantity, setMoveQuantity] = useState<number>(0);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Success Modal State

    // Print State
    const [printQuantity, setPrintQuantity] = useState(1);

    // Discard Modal State
    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
    const [batchToDiscard, setBatchToDiscard] = useState<any>(null);
    const [discardQuantity, setDiscardQuantity] = useState<number>(0);
    const [discardReason, setDiscardReason] = useState('');

    // Toast State
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastMessage(message);
        setToastType(type);
        setToastOpen(true);
    };


    const [clonesRoomId, setClonesRoomId] = useState<string | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Parallel data loading
        const [genetics, batches, allRooms, env] = await Promise.all([
            geneticsService.getGenetics(),
            roomsService.getBatches(),
            roomsService.getRooms(),
            environmentService.getEnvironmentData()
        ]);

        setEnvData(env);

        const validRooms = allRooms.filter(r => ['clones', 'vegetation', 'general'].includes(r.type));
        setRooms(validRooms);

        const clonesRoom = allRooms.find(r => r.type === 'clones');
        if (clonesRoom) setClonesRoomId(clonesRoom.id);

        const allClones = batches.filter(b =>
            b.parent_batch_id ||
            (b.name && b.name.startsWith('CL-')) ||
            (b.stage === 'seedling') || // New batches are seedlings
            /^[A-Z]{3}-\d{4}$/.test(b.name) // Match new sequential format
        );

        // Calculate Stats
        let totalQty = 0;
        const geneticBreakdown: Record<string, number> = {};

        allClones.forEach(b => {
            const qty = Number(b.quantity) || 0;
            totalQty += qty;
            const geneticName = b.genetic?.name || 'Desconocida';
            geneticBreakdown[geneticName] = (geneticBreakdown[geneticName] || 0) + qty;
        });

        setStats({ total: totalQty, byGenetic: geneticBreakdown });

        setMothersStates(genetics);
        // Sort grouping logic:
        // 1. Identify Roots (no parent or parent not in this list)
        // 2. Map children to parents
        // 3. Flatten list
        const batchMap = new Map();
        allClones.forEach(b => batchMap.set(b.id, { ...b, children: [] }));

        const roots: any[] = [];
        const orphans: any[] = []; // Sub-batches whose parents are not in the 'clones' view (e.g. parent moved to diff room or deleted)

        allClones.forEach(b => {
            if (b.parent_batch_id && batchMap.has(b.parent_batch_id)) {
                batchMap.get(b.parent_batch_id).children.push(b);
            } else {
                // Check if it's strictly a child (has parent_id) but parent not here
                if (b.parent_batch_id) orphans.push(b);
                else roots.push(batchMap.get(b.id)); // It's a root
            }
        });

        // Sort roots by date desc
        roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // Flatten logic change: Keep as groups { root, children }
        const groups: any[] = [];
        roots.forEach(root => {
            // Sort children by date desc
            root.children.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            groups.push({ root, children: root.children });
        });

        // Wrap orphans in groups
        orphans.forEach(o => groups.push({ root: o, children: [] }));

        // Sort groups by root date desc
        groups.sort((a, b) => new Date(b.root.created_at).getTime() - new Date(a.root.created_at).getTime());

        setMothersStates(genetics);
        setCloneBatches(groups);
        setAllBatchesHistory(batches); // Store full history
        setLoading(false);
    };

    const generateSequenceName = (geneticName: string) => {
        const prefix = (geneticName || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');

        // Filter all batches that start with this Genetic Prefix
        // Note: We check specifically for the pattern PREFIX-xxxx
        const pattern = new RegExp(`^${prefix}-\\d{4}$`);

        const existing = allBatchesHistory.filter(b => pattern.test(b.name));

        let maxSeq = 0;
        existing.forEach(b => {
            const parts = b.name.split('-');
            if (parts.length === 2) {
                const seq = parseInt(parts[1]);
                if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
            }
        });

        const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
        return `${prefix}-${nextSeq}`;
    };

    const handleCreateCloneBatch = async () => {
        if (!newBatch.geneticId || !newBatch.quantity) {
            showToast("Por favor completa todos los campos.", 'error');
            return;
        }

        const selectedGenetic = mothersStates.find(m => m.id === newBatch.geneticId);
        const barcodeName = generateSequenceName(selectedGenetic?.name || 'GEN');

        const batchData = {
            name: barcodeName,
            quantity: parseInt(newBatch.quantity),
            stage: 'seedling' as const,
            current_room_id: undefined,
            genetic_id: newBatch.geneticId,
            start_date: newBatch.date,
            parent_batch_id: undefined
        };

        const created = await roomsService.createBatch(batchData);

        if (created) {
            loadData();
            setIsCreateModalOpen(false);
            setNewBatch({
                geneticId: '',
                quantity: '',
                date: new Date().toISOString().split('T')[0]
            });
        } else {
            showToast("Error al crear el lote.", 'error');
        }
    };

    // Actions Handlers
    const handleEditClick = (batch: any) => {
        setEditingBatch(batch);
        setEditForm({
            quantity: batch.quantity.toString(),
            date: batch.start_date ? batch.start_date.split('T')[0] : ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingBatch) return;

        const success = await roomsService.updateBatch(editingBatch.id, {
            quantity: parseInt(editForm.quantity),
            start_date: editForm.date
        });

        if (success) {
            loadData();
            setIsEditModalOpen(false);
            setEditingBatch(null);
            setEditingBatch(null);
        } else {
            showToast("Error al actualizar el lote.", 'error');
        }
    };

    const handleDeleteClick = (batch: any) => {
        setBatchToDelete(batch);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!batchToDelete) return;

        const success = await roomsService.deleteBatch(batchToDelete.id);
        if (success) {
            loadData();
            setIsDeleteModalOpen(false);
            setBatchToDelete(null);
            setBatchToDelete(null);
        } else {
            showToast("Error al eliminar el lote.", 'error');
        }
    };

    const handleMoveClick = (batch: any) => {
        setBatchToMove(batch);
        setMoveToRoomId('');
        setMoveQuantity(batch.quantity); // Default to all
        setIsMoveModalOpen(true);
    };

    const handleConfirmMove = async () => {
        if (!batchToMove || !moveToRoomId || !moveQuantity) return;

        const success = await roomsService.moveBatch(batchToMove.id, batchToMove.current_room_id, moveToRoomId, "Movimiento desde Gestión de Esquejes", moveQuantity);
        if (success) {
            // alert("✅ Lote movido correctamente"); // Removed native alert
            loadData();
            setIsMoveModalOpen(false);
            setIsSuccessModalOpen(true); // Trigger Success Modal
            setBatchToMove(null);
            setMoveToRoomId('');
            setBatchToMove(null);
            setMoveToRoomId('');
        } else {
            showToast("Error al mover el lote", 'error');
        }
    };

    const handleBarcodeClick = (batch: any) => {
        setViewingBatch(batch);
        setPrintQuantity(1); // Reset default
        setIsBarcodeModalOpen(true);
    };

    const handlePrintTickets = () => {
        if (!viewingBatch) return;
        window.print();
    };

    const handleDiscardClick = (batch: any) => {
        setBatchToDiscard(batch);
        setDiscardQuantity(0);
        setDiscardReason('');
        setIsDiscardModalOpen(true);
    };

    const handleConfirmDiscard = async () => {
        if (!batchToDiscard || discardQuantity <= 0) return;

        if (discardQuantity > batchToDiscard.quantity) {
            showToast("No puedes descartar más de la cantidad disponible.", 'error');
            return;
        }

        const newQuantity = batchToDiscard.quantity - discardQuantity;
        let success = false;

        if (newQuantity === 0) {
            // Option: Delete batch if 0? Or just set to 0. 
            // Let's set to 0 strictly, or ask user?
            // For now, update to 0. It might disappear from list if filter > 0, but here we don't filter > 0 strictly in active lists usually?
            // Actually, usually 0 means empty. Let's update.
            success = await roomsService.updateBatch(batchToDiscard.id, {
                quantity: newQuantity
            });
        } else {
            success = await roomsService.updateBatch(batchToDiscard.id, {
                quantity: newQuantity
            });
        }

        if (success) {
            // Ideally log the reason
            console.log(`Discarded ${discardQuantity} from ${batchToDiscard.name}. Reason: ${discardReason}`);
            loadData();
            setIsDiscardModalOpen(false);
            setBatchToDiscard(null);
            setBatchToDiscard(null);
        } else {
            showToast("Error al descartar esquejes.", 'error');
        }
    };


    return (
        <Container>
            <Header>
                <h1><FaCut /> Gestión de Esquejes</h1>
                <CreateButton onClick={() => setIsCreateModalOpen(true)}>
                    <FaPlus /> Agregar Esquejes
                </CreateButton>
            </Header>

            <div style={{ marginBottom: '2rem' }}>
                <TuyaManager mode="sensors" roomId={clonesRoomId} />
            </div>

            {loading ? (
                <div style={{ position: 'relative', height: '300px', background: 'white', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <LoadingSpinner text="Cargando esquejes..." />
                </div>
            ) : (
                <>
                    {/* Environmental Conditions */}
                    {envData && (
                        <EnvironmentSection>
                            <EnvCard type="temp">
                                <div className="info">
                                    <span className="label">Temperatura</span>
                                    <span className="value">{envData.temperature}°C</span>
                                </div>
                                <div className="icon"><FaThermometerHalf /></div>
                            </EnvCard>
                            <EnvCard type="humidity">
                                <div className="info">
                                    <span className="label">Humedad</span>
                                    <span className="value">{envData.humidity}%</span>
                                </div>
                                <div className="icon"><FaTint /></div>
                            </EnvCard>
                        </EnvironmentSection>
                    )}

                    {/* Summary Section */}
                    <SummaryGrid>
                        <SummaryCard isTotal>
                            <h3>Total Esquejes</h3>
                            <div className="value">{stats.total}</div>
                            <div className="icon"><FaCut /></div>
                        </SummaryCard>
                        {Object.entries(stats.byGenetic).map(([name, qty]) => (
                            <SummaryCard key={name}>
                                <h3>{name}</h3>
                                <div className="value">{qty}</div>
                            </SummaryCard>
                        ))}
                    </SummaryGrid>

                    <HistorySection>
                        <HistoryHeader>
                            <FaHistory /> Lotes de Esquejes Activos
                        </HistoryHeader>
                        <div style={{ overflowX: 'auto' }}>
                            <HistoryTable>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Lote (Código)</th>
                                        <th>Genética</th>
                                        <th>Cantidad</th>
                                        <th>Destino</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* RENDER BY GROUPS */}
                                    {cloneBatches.map(group => {
                                        const { root, children } = group;
                                        const rows = [root, ...children];

                                        return (
                                            <React.Fragment key={root.id}>
                                                {rows.map((batch, index) => {
                                                    const isRoot = batch === root;
                                                    const isLast = index === rows.length - 1;

                                                    // Style to remove border if connected
                                                    const rowStyle: React.CSSProperties = {
                                                        borderBottom: !isLast ? 'none' : undefined,
                                                        fontSize: !isRoot ? '0.9rem' : undefined,
                                                        color: !isRoot ? '#4a5568' : undefined
                                                    };
                                                    const cellStyle = !isLast ? { borderBottom: 'none' } : undefined;

                                                    return (
                                                        <tr key={batch.id} style={rowStyle}>
                                                            <td style={cellStyle}>{new Date(batch.start_date || batch.created_at).toLocaleDateString()}</td>
                                                            <td style={cellStyle}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: batch.parent_batch_id ? '1.5rem' : '0' }}>
                                                                    {batch.parent_batch_id && (
                                                                        <FaLevelUpAlt
                                                                            style={{ transform: 'rotate(90deg)', color: '#a0aec0', fontSize: '1rem', minWidth: '1rem' }}
                                                                            title="Sub-lote derivado"
                                                                        />
                                                                    )}
                                                                    <FaBarcode style={{ color: batch.parent_batch_id ? '#718096' : '#2d3748' }} />
                                                                    <strong>{batch.name}</strong>
                                                                    {batch.parent_batch_id && <span style={{ fontSize: '0.7rem', color: '#a0aec0', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '0 4px' }}>Sub-lote</span>}
                                                                </div>
                                                            </td>
                                                            <td style={cellStyle}>{batch.genetic?.name || 'Desconocida'}</td>
                                                            <td style={cellStyle}>{batch.quantity} u.</td>
                                                            <td style={cellStyle}>{batch.room?.name || 'Desconocido'}</td>
                                                            <td style={{ textAlign: 'center', ...cellStyle }}>
                                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                                    <Tooltip text="Ver Código de Barras">
                                                                        <ActionButton color="#4a5568" onClick={() => handleBarcodeClick(batch)}>
                                                                            <FaBarcode />
                                                                        </ActionButton>
                                                                    </Tooltip>
                                                                    <Tooltip text="Mover a Sala (Transplante)">
                                                                        <ActionButton color="#ed8936" onClick={() => handleMoveClick(batch)}>
                                                                            <FaExchangeAlt />
                                                                        </ActionButton>
                                                                    </Tooltip>
                                                                    <Tooltip text="Dar de Baja (Descarte)">
                                                                        <ActionButton color="#e53e3e" onClick={() => handleDiscardClick(batch)}>
                                                                            <FaMinusCircle />
                                                                        </ActionButton>
                                                                    </Tooltip>
                                                                    <Tooltip text="Editar Lote">
                                                                        <ActionButton color="#3182ce" onClick={() => handleEditClick(batch)}>
                                                                            <FaEdit />
                                                                        </ActionButton>
                                                                    </Tooltip>
                                                                    <Tooltip text="Eliminar Lote">
                                                                        <ActionButton color="#e53e3e" onClick={() => handleDeleteClick(batch)}>
                                                                            <FaTrash />
                                                                        </ActionButton>
                                                                    </Tooltip>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                    {cloneBatches.length === 0 && (
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem' }}>
                                                No hay registros de esquejes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </HistoryTable>
                        </div>
                    </HistorySection>
                </>
            )}

            {/* Create Clone Batch Modal */}
            {isCreateModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseIcon onClick={() => setIsCreateModalOpen(false)}><FaTimes /></CloseIcon>
                        <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaCut /> Nuevo Lote de Esquejes
                        </h2>

                        <FormGroup>
                            <label>Madre de Origen</label>
                            <select
                                value={newBatch.geneticId}
                                onChange={e => setNewBatch({ ...newBatch, geneticId: e.target.value })}
                            >
                                <option value="">Seleccionar Madre...</option>
                                {mothersStates.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </FormGroup>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    value={newBatch.quantity}
                                    onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                    placeholder="Ej: 50"
                                />
                            </FormGroup>

                            <FormGroup style={{ flex: 1 }}>
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={newBatch.date}
                                    onChange={e => setNewBatch({ ...newBatch, date: e.target.value })}
                                />
                            </FormGroup>
                        </div>



                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateCloneBatch}
                                style={{ padding: '0.75rem 1.5rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Crear Lote
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Edit Batch Modal */}
            {isEditModalOpen && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseIcon onClick={() => setIsEditModalOpen(false)}><FaTimes /></CloseIcon>
                        <h2 style={{ marginBottom: '1.5rem' }}>Editar Lote</h2>

                        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#ebf8ff', borderRadius: '0.5rem', color: '#2c5282', fontSize: '0.9rem' }}>
                            <strong>Genética:</strong> {editingBatch?.genetic?.name || 'Desconocida'} <br />
                            <small>Para cambiar la genética, elimine este lote y cree uno nuevo.</small>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    value={editForm.quantity}
                                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup style={{ flex: 1 }}>
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                />
                            </FormGroup>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={handleSaveEdit} style={{ padding: '0.75rem 1.5rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                Guardar Cambios
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}


            {/* Move Batch Modal */}
            {isMoveModalOpen && batchToMove && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseIcon onClick={() => setIsMoveModalOpen(false)}><FaTimes /></CloseIcon>
                        <h2 style={{ marginBottom: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaExchangeAlt /> Mover Lote
                        </h2>
                        <p style={{ marginBottom: '1rem' }}>Mover <strong>{batchToMove.name}</strong> a otra sala:</p>

                        <FormGroup>
                            <label>Sala de Destino</label>
                            <select
                                value={moveToRoomId}
                                onChange={e => setMoveToRoomId(e.target.value)}
                            >
                                <option value="">Seleccionar Sala...</option>
                                {rooms.filter(r => r.id !== batchToMove.current_room_id).map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                ))}
                            </select>
                        </FormGroup>

                        <FormGroup>
                            <label>Cantidad a Mover (Total: {batchToMove.quantity})</label>
                            <input
                                type="number"
                                min="1"
                                max={batchToMove.quantity}
                                value={moveQuantity}
                                onChange={e => setMoveQuantity(Math.min(batchToMove.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                            />
                            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
                                {moveQuantity < batchToMove.quantity
                                    ? `Se moverán ${moveQuantity} esquejes. Quedarán ${batchToMove.quantity - moveQuantity} en el lote original.`
                                    : 'Se moverá todo el lote.'}
                            </div>
                        </FormGroup>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setIsMoveModalOpen(false)}
                                style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmMove}
                                style={{ padding: '0.75rem 1.5rem', background: '#ed8936', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Mover Lote
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Barcode Modal */
            }
            {isBarcodeModalOpen && viewingBatch && (
                <ModalOverlay onClick={() => setIsBarcodeModalOpen(false)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <CloseIcon onClick={() => setIsBarcodeModalOpen(false)}><FaTimes /></CloseIcon>
                        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Identificador de Lote</h2>
                        <p style={{ textAlign: 'center', color: '#718096', marginBottom: '1.5rem' }}>Utilice este código para seguimiento </p>

                        <BarcodeDisplay>
                            <FaBarcode size={60} />
                            <span className="code">{viewingBatch.name}</span>
                            <div className="label">
                                {viewingBatch.genetic?.name} • {viewingBatch.quantity}u • {new Date(viewingBatch.start_date || viewingBatch.created_at).toLocaleDateString()}
                            </div>
                        </BarcodeDisplay>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, color: '#4a5568' }}>Copias:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={printQuantity}
                                    onChange={(e) => setPrintQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    style={{ width: '60px', padding: '0.5rem', textAlign: 'center', borderRadius: '0.25rem', border: '1px solid #cbd5e0' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => setIsBarcodeModalOpen(false)} style={{ padding: '0.75rem 2rem', background: 'none', border: '1px solid #cbd5e0', borderRadius: '0.5rem', cursor: 'pointer', color: '#718096' }}>
                                    Cerrar
                                </button>
                                <button onClick={handlePrintTickets} style={{ padding: '0.75rem 2rem', background: '#2d3748', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaBarcode /> Imprimir
                                </button>
                            </div>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Discard Modal */}
            {isDiscardModalOpen && batchToDiscard && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseIcon onClick={() => setIsDiscardModalOpen(false)}><FaTimes /></CloseIcon>
                        <h2 style={{ marginBottom: '1.5rem', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FaMinusCircle /> Descartar Esquejes
                        </h2>
                        <p style={{ marginBottom: '1rem', color: '#718096' }}>
                            Registrar baja de esquejes para el lote <strong>{batchToDiscard.name}</strong>.
                        </p>

                        <div style={{ background: '#fff5f5', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px solid #fed7d7' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#c53030', fontWeight: 'bold' }}>
                                <span>Cantidad Actual:</span>
                                <span>{batchToDiscard.quantity} u.</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#2d3748' }}>
                                <span>Nueva Cantidad:</span>
                                <span>{Math.max(0, batchToDiscard.quantity - discardQuantity)} u.</span>
                            </div>
                        </div>

                        <FormGroup>
                            <label>Cantidad a Descartar</label>
                            <input
                                type="number"
                                min="1"
                                max={batchToDiscard.quantity}
                                value={discardQuantity}
                                onChange={e => setDiscardQuantity(Math.min(batchToDiscard.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                            />
                        </FormGroup>

                        <FormGroup>
                            <label>Motivo (Opcional)</label>
                            <input
                                type="text"
                                placeholder="Ej: Hongos, Dañados, No enraizó..."
                                value={discardReason}
                                onChange={e => setDiscardReason(e.target.value)}
                            />
                        </FormGroup>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setIsDiscardModalOpen(false)}
                                style={{ padding: '0.75rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDiscard}
                                disabled={discardQuantity <= 0}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: discardQuantity > 0 ? '#e53e3e' : '#feb2b2',
                                    color: 'white', border: 'none', borderRadius: '0.5rem', cursor: discardQuantity > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold'
                                }}
                            >
                                Confirmar Baja
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )
            }

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Eliminar Lote"
                message={`¿Estás seguro de que deseas eliminar el lote ${batchToDelete?.name}?`}
                confirmText="Eliminar"
                isDanger
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />

            {/* Success Modal */}
            {
                isSuccessModalOpen && (
                    <ModalOverlay onClick={() => setIsSuccessModalOpen(false)}>
                        <ModalContent style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ color: '#48bb78', fontSize: '3rem', marginBottom: '1rem' }}>
                                <FaCheckCircle />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¡Lote Movido!</h3>
                            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                                El lote se ha asignado correctamente a la sala de destino.
                            </p>
                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                style={{ padding: '0.75rem 2rem', background: '#319795', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Aceptar
                            </button>
                        </ModalContent>
                    </ModalOverlay>
                )
            }

            {/* Print Area */}
            <PrintStyles />
            <div id="printable-clones-area">
                {viewingBatch && Array.from({ length: printQuantity }).map((_, i) => (
                    <PrintableCloneLabel key={i}>
                        <div className="qr-side">
                            <QRCode
                                value={viewingBatch.name}
                                size={64} // sized for 22mm roughly (approx 80px)
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="info-side">
                            <div className="name">{viewingBatch.name}</div>
                            <div className="meta">{viewingBatch.genetic?.name?.substring(0, 15)}</div>
                            <div className="meta">{new Date(viewingBatch.start_date || viewingBatch.created_at).toLocaleDateString()}</div>
                        </div>
                    </PrintableCloneLabel>
                ))}
            </div>

            <ToastModal
                isOpen={toastOpen}
                message={toastMessage}
                type={toastType}
                onClose={() => setToastOpen(false)}
            />
        </Container >
    );
};

export default Clones;
