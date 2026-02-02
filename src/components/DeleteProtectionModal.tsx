import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Content = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: scaleIn 0.2s ease-out;
  text-align: center;

  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  h3 {
    margin-top: 1rem;
    color: #c53030;
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    font-weight: 700;
  }

  p {
    color: #4a5568;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  background: #fff5f5;
  color: #c53030;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  margin: 0 auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e0;
  border-radius: 0.5rem;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  text-align: center;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #c53030;
    box-shadow: 0 0 0 3px rgba(197, 48, 48, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const VerificationText = styled.div`
  background: #edf2f7;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 1rem;
  user-select: all;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'danger' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.variant === 'secondary' ? '#e2e8f0' : 'transparent'};
  background: ${p => p.variant === 'secondary' ? 'white' : '#c53030'};
  color: ${p => p.variant === 'secondary' ? '#4a5568' : 'white'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;

  &:hover {
    background: ${p => p.variant === 'secondary' ? '#f7fafc' : '#9b2c2c'};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface DeleteProtectionModalProps {
    isOpen: boolean;
    itemType: string; // e.g., "Cultivo", "Sala"
    itemName: string; // e.g., "Aurora"
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteProtectionModal: React.FC<DeleteProtectionModalProps> = ({
    isOpen,
    itemType,
    itemName,
    onClose,
    onConfirm
}) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInputValue('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputValue === itemName) {
            onConfirm();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue === itemName) {
            onConfirm();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Overlay>
            <Content>
                <IconWrapper>
                    <FaExclamationTriangle />
                </IconWrapper>
                <h3>Zona de Peligro</h3>
                <p>
                    Estás a punto de eliminar el {itemType} <strong>"{itemName}"</strong>.<br />
                    Esta acción es permanente y no se puede deshacer.
                </p>

                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Escribe el nombre para confirmar:</p>
                <VerificationText>{itemName}</VerificationText>

                <Input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe el nombre aquí..."
                />

                <ButtonGroup>
                    <Button onClick={onClose} variant="secondary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="danger"
                        disabled={inputValue !== itemName}
                    >
                        Eliminar
                    </Button>
                </ButtonGroup>
            </Content>
        </Overlay>
    );
};
