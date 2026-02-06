import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false
}) => {
    if (!isOpen) return null;

    return (
        <Overlay onClick={onCancel}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <IconWrapper $isDestructive={isDestructive}>
                    <FaExclamationTriangle size={24} />
                </IconWrapper>
                <Title>{title}</Title>
                <Message>{message}</Message>
                <ButtonGroup>
                    <CancelButton onClick={onCancel}>{cancelText}</CancelButton>
                    <ConfirmButton onClick={onConfirm} $isDestructive={isDestructive}>
                        {confirmText}
                    </ConfirmButton>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};

const Overlay = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
    animation: fadeIn 0.2s ease-out;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

const ModalContainer = styled.div`
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    transform: translateY(0);
    animation: slideUp 0.2s ease-out;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

const IconWrapper = styled.div<{ $isDestructive: boolean }>`
    background: ${props => props.$isDestructive ? '#fed7d7' : '#feebc8'};
    color: ${props => props.$isDestructive ? '#c53030' : '#d69e2e'};
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 1rem;
`;

const Title = styled.h3`
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.25rem;
`;

const Message = styled.p`
    color: #718096;
    margin: 0 0 2rem 0;
    font-size: 0.95rem;
    line-height: 1.5;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;
`;

const Button = styled.button`
    flex: 1;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.95rem;
`;

const CancelButton = styled(Button)`
    background: white;
    border: 1px solid #cbd5e0;
    color: #4a5568;
    &:hover { background: #f7fafc; }
`;

const ConfirmButton = styled(Button) <{ $isDestructive: boolean }>`
    background: ${props => props.$isDestructive ? '#e53e3e' : '#3182ce'};
    border: none;
    color: white;
    &:hover { background: ${props => props.$isDestructive ? '#c53030' : '#2b6cb0'}; }
`;
