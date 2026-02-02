import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DispensaryBatch, dispensaryService } from '../services/dispensaryService';
import { FaSave, FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h2 {
    font-size: 1.5rem;
    color: #2d3748;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #4a5568;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #4a5568;
    font-weight: 500;
    font-size: 0.95rem;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3182ce;
      box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
  }
  
  .hint {
    font-size: 0.8rem;
    color: #718096;
    margin-top: 0.25rem;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${p => p.variant === 'secondary' ? 'white' : p.variant === 'danger' ? '#e53e3e' : '#3182ce'};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  border: 1px solid ${p => p.variant === 'secondary' ? '#e2e8f0' : 'transparent'};
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    filter: brightness(110%);
    transform: translateY(-1px);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

interface EditDispensaryModalProps {
    isOpen: boolean;
    batch: DispensaryBatch | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditDispensaryModal: React.FC<EditDispensaryModalProps> = ({
    isOpen,
    batch,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        strain_name: '',
        initial_weight: '',
        current_weight: '',
        status: 'curing',
        quality_grade: 'Standard',
        price_per_gram: '',
        notes: ''
    });

    useEffect(() => {
        if (batch) {
            setFormData({
                strain_name: batch.strain_name,
                initial_weight: batch.initial_weight.toString(),
                current_weight: batch.current_weight.toString(),
                status: batch.status,
                quality_grade: batch.quality_grade,
                price_per_gram: batch.price_per_gram ? batch.price_per_gram.toString() : '',
                notes: batch.notes || ''
            });
        }
    }, [batch]);

    if (!isOpen || !batch) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const updates: Partial<DispensaryBatch> = {
            strain_name: formData.strain_name,
            initial_weight: parseFloat(formData.initial_weight),
            current_weight: parseFloat(formData.current_weight),
            status: formData.status as any,
            quality_grade: formData.quality_grade as any,
            price_per_gram: formData.price_per_gram ? parseFloat(formData.price_per_gram) : 0,
            notes: formData.notes
        };

        const success = await dispensaryService.updateBatch(batch.id, updates);

        if (success) {
            onSuccess();
        } else {
            alert('Error al actualizar el lote');
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Header>
                    <div>
                        <h2>Editar Lote</h2>
                        <span style={{ fontSize: '0.9rem', color: '#718096', fontFamily: 'monospace' }}>
                            {batch.batch_code}
                        </span>
                    </div>
                    <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                </Header>

                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <label>Variedad (Strain)</label>
                        <input
                            type="text"
                            value={formData.strain_name}
                            onChange={e => setFormData({ ...formData, strain_name: e.target.value })}
                            required
                        />
                    </FormGroup>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormGroup>
                            <label>Peso Inicial (g)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.initial_weight}
                                onChange={e => setFormData({ ...formData, initial_weight: e.target.value })}
                                required
                            />
                            <div className="hint">Original: {batch.initial_weight}g</div>
                        </FormGroup>

                        <FormGroup>
                            <label>Peso Actual (g)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.current_weight}
                                onChange={e => setFormData({ ...formData, current_weight: e.target.value })}
                                required
                            />
                            <div className="hint">Original: {batch.current_weight}g</div>
                        </FormGroup>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <FormGroup>
                            <label>Estado</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="curing">Curándose (Curing)</option>
                                <option value="available">Disponible</option>
                                <option value="quarantine">Cuarentena</option>
                                <option value="depleted">Agotado</option>
                            </select>
                        </FormGroup>

                        <FormGroup>
                            <label>Calidad</label>
                            <select
                                value={formData.quality_grade}
                                onChange={e => setFormData({ ...formData, quality_grade: e.target.value })}
                            >
                                <option value="Premium">Premium</option>
                                <option value="Standard">Standard</option>
                                <option value="Extracts">Extracts</option>
                                <option value="Trim">Trim</option>
                            </select>
                        </FormGroup>
                    </div>

                    <FormGroup>
                        <label>Notas</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Notas opcionales..."
                        />
                    </FormGroup>

                    <Actions>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            <FaSave /> Guardar Cambios
                        </Button>
                    </Actions>
                </form>
            </ModalContent>
        </ModalOverlay>
    );
};
