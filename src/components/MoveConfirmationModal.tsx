import React, { useState } from 'react';
import styled from 'styled-components';
import { FaExchangeAlt, FaTimes, FaCheck } from 'react-icons/fa';

const Overlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1200;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const Content = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform-origin: center;
    animation: scaleIn 0.2s ease-out;

    @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;

const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    color: #2b6cb0;
    
    h2 {
        margin: 0;
        font-size: 1.5rem;
    }

    svg {
        font-size: 1.5rem;
    }
`;

const Details = styled.div`
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 0.5rem;
    border: 1px solid #edf2f7;

    p {
        margin: 0.5rem 0;
        font-size: 1rem;
        color: #4a5568;
        display: flex;
        justify-content: space-between;

        strong {
            color: #2d3748;
        }
    }
`;

const FormGroup = styled.div`
    margin-bottom: 1.5rem;
    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #4a5568;
    }
    textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        min-height: 80px;
        font-family: inherit;
        resize: vertical;
        
        &:focus {
            outline: none;
            border-color: #3182ce;
            box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }
    }
`;

const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    border: none;

    ${props => props.$variant === 'primary' ? `
        background: #3182ce;
        color: white;
        &:hover { background: #2c5282; }
    ` : `
        background: #edf2f7;
        color: #4a5568;
        &:hover { background: #e2e8f0; }
    `}
`;

interface MoveConfirmationModalProps {
    isOpen: boolean;
    batchName: string;
    fromRoomName: string;
    toRoomName: string;
    onClose: () => void;
    onConfirm: (notes: string) => void;
}

export const MoveConfirmationModal: React.FC<MoveConfirmationModalProps> = ({
    isOpen, batchName, fromRoomName, toRoomName, onClose, onConfirm
}) => {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(notes);
        setNotes(''); // Reset
    };

    return (
        <Overlay onClick={onClose}>
            <Content onClick={e => e.stopPropagation()}>
                <Header>
                    <FaExchangeAlt />
                    <h2>Confirmar Movimiento</h2>
                </Header>

                <Details>
                    <p><span>Lote:</span> <strong>{batchName}</strong></p>
                    <p><span>Origen:</span> <strong>{fromRoomName}</strong></p>
                    <p><span>Destino:</span> <strong style={{ color: '#38a169' }}>{toRoomName}</strong></p>
                </Details>

                <FormGroup>
                    <label>Notas del movimiento (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej: Traslado por inicio de floración..."
                    />
                </FormGroup>

                <Actions>
                    <Button onClick={onClose} $variant="secondary">
                        <FaTimes /> Cancelar
                    </Button>
                    <Button onClick={handleConfirm} $variant="primary">
                        <FaCheck /> Confirmar Mover
                    </Button>
                </Actions>
            </Content>
        </Overlay>
    );
};
