import React from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaCircleNotch } from 'react-icons/fa';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    variant?: 'primary' | 'danger' | 'success';
    isClosing?: boolean;
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = false,
    variant = isDestructive ? 'danger' : 'primary',
    isClosing = false,
    isLoading = false
}) => {
    if (!isOpen && !isClosing) return null;

    return (
        <Overlay isClosing={isClosing}>
            <ModalContainer onClick={(e) => e.stopPropagation()} isClosing={isClosing}>
                <IconWrapper $variant={variant}>
                    <FaExclamationTriangle size={24} />
                </IconWrapper>
                <Title>{title}</Title>
                <Message>{message}</Message>
                <ButtonGroup>
                    <CancelButton onClick={onCancel} disabled={isLoading}>
                        {cancelText}
                    </CancelButton>
                    <ConfirmButton
                        onClick={onConfirm}
                        $variant={variant}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {isLoading && <FaCircleNotch className="spin" />}
                        {confirmText}
                    </ConfirmButton>
                </ButtonGroup>
            </ModalContainer>
        </Overlay>
    );
};

const Overlay = styled.div<{ isClosing?: boolean }>`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
    animation: ${props => props.isClosing ? 'fadeOut' : 'fadeIn'} 0.2s ease-out forwards;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;

const ModalContainer = styled.div<{ isClosing?: boolean }>`
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
    animation: ${props => props.isClosing ? 'slideDown' : 'slideUp'} 0.2s ease-out forwards;

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(20px); opacity: 0; }
    }
`;

const IconWrapper = styled.div<{ $variant: 'primary' | 'danger' | 'success' }>`
    background: ${props => props.$variant === 'danger' ? '#fed7d7' : props.$variant === 'success' ? '#c6f6d5' : '#feebc8'};
    color: ${props => props.$variant === 'danger' ? '#c53030' : props.$variant === 'success' ? '#2f855a' : '#d69e2e'};
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

const ConfirmButton = styled(Button) <{ $variant: 'primary' | 'danger' | 'success' }>`
    background: ${props => props.$variant === 'danger' ? '#e53e3e' : props.$variant === 'success' ? '#48bb78' : '#3182ce'};
    border: none;
    color: white;
    &:hover { background: ${props => props.$variant === 'danger' ? '#c53030' : props.$variant === 'success' ? '#38a169' : '#2b6cb0'}; }
`;
