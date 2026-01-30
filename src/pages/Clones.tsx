
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCut, FaHistory, FaPlus, FaBarcode, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { roomsService } from '../services/roomsService';
import { geneticsService } from '../services/geneticsService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

import { Room } from '../types/rooms';

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

const Clones: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [mothersStates, setMothersStates] = useState<any[]>([]);
    const [cloneBatches, setCloneBatches] = useState<any[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBatch, setNewBatch] = useState({
        geneticId: '',
        quantity: '',
        roomId: '',
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


    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const genetics = await geneticsService.getGenetics();
        const batches = await roomsService.getBatches();
        const allRooms = await roomsService.getRooms();

        const validRooms = allRooms.filter(r => ['clones', 'vegetation', 'general'].includes(r.type));
        setRooms(validRooms);

        const allClones = batches.filter(b => b.parent_batch_id || (b.name && b.name.startsWith('CL-')));

        setMothersStates(genetics);
        setCloneBatches(allClones);
        setLoading(false);
    };

    const generateBarcode = (geneticName: string) => {
        const prefix = "CL";
        const genCode = (geneticName || 'UNK').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${genCode}-${date}-${random}`;
    };

    const handleCreateCloneBatch = async () => {
        if (!newBatch.geneticId || !newBatch.quantity || !newBatch.roomId) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const selectedGenetic = mothersStates.find(m => m.id === newBatch.geneticId);
        const barcodeName = generateBarcode(selectedGenetic?.name || 'GEN');

        const batchData = {
            name: barcodeName,
            quantity: parseInt(newBatch.quantity),
            stage: 'seedling' as const,
            current_room_id: newBatch.roomId,
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
                roomId: '',
                date: new Date().toISOString().split('T')[0]
            });
        } else {
            alert("Error al crear el lote.");
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
        } else {
            alert("Error al actualizar el lote.");
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
        } else {
            alert("Error al eliminar el lote.");
        }
    };

    const handleBarcodeClick = (batch: any) => {
        setViewingBatch(batch);
        setIsBarcodeModalOpen(true);
    };


    if (loading) return <LoadingSpinner text="Cargando esquejes..." fullScreen />;

    return (
        <Container>
            <Header>
                <h1><FaCut /> Gestión de Esquejes</h1>
                <CreateButton onClick={() => setIsCreateModalOpen(true)}>
                    <FaPlus /> Agregar Esquejes
                </CreateButton>
            </Header>

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
                            {cloneBatches.map(batch => (
                                <tr key={batch.id}>
                                    <td>{new Date(batch.start_date || batch.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FaBarcode style={{ color: '#718096' }} />
                                            <strong>{batch.name}</strong>
                                        </div>
                                    </td>
                                    <td>{batch.genetic?.name || 'Desconocida'}</td>
                                    <td>{batch.quantity} u.</td>
                                    <td>{batch.room?.name || 'Desconocido'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <ActionButton color="#4a5568" onClick={() => handleBarcodeClick(batch)} title="Ver Código">
                                                <FaBarcode />
                                            </ActionButton>
                                            <ActionButton color="#3182ce" onClick={() => handleEditClick(batch)} title="Editar">
                                                <FaEdit />
                                            </ActionButton>
                                            <ActionButton color="#e53e3e" onClick={() => handleDeleteClick(batch)} title="Eliminar">
                                                <FaTrash />
                                            </ActionButton>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

                        <FormGroup>
                            <label>Sala de Destino</label>
                            <select
                                value={newBatch.roomId}
                                onChange={e => setNewBatch({ ...newBatch, roomId: e.target.value })}
                            >
                                <option value="">Seleccionar Sala...</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                ))}
                            </select>
                        </FormGroup>

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

            {/* Barcode Modal */}
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

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button onClick={() => setIsBarcodeModalOpen(false)} style={{ padding: '0.75rem 2rem', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                Cerrar
                            </button>
                        </div>
                    </ModalContent>
                </ModalOverlay>
            )}

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

        </Container>
    );
};

export default Clones;

