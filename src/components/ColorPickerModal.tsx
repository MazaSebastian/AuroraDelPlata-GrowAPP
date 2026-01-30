import React from 'react';
import styled from 'styled-components';

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
  padding: 1.5rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 320px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  animation: scaleIn 0.2s ease-out;

  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    color: #2d3748;
    font-size: 1.1rem;
  }

  button {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #a0aec0;
    cursor: pointer;
    padding: 0;
    &:hover { color: #4a5568; }
  }
`;

const ColorGrid = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ColorButton = styled.button<{ color: string; isSelected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: ${p => p.isSelected ? '3px solid #cbd5e0' : '2px solid transparent'};
  background-color: ${p => p.color};
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.1);
  }
`;

interface ColorPickerModalProps {
    isOpen: boolean;
    title?: string;
    colors: string[];
    selectedColor?: string;
    onSelectColor: (color: string) => void;
    onClose: () => void;
    getColorHex: (colorName: string) => string;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    isOpen,
    title = "Elegir Color",
    colors,
    selectedColor,
    onSelectColor,
    onClose,
    getColorHex
}) => {
    if (!isOpen) return null;

    return (
        <Overlay>
            <Content>
                <Header>
                    <h3>{title}</h3>
                    <button onClick={onClose}>&times;</button>
                </Header>
                <ColorGrid>
                    {colors.map(color => (
                        <ColorButton
                            key={color}
                            color={getColorHex(color)}
                            isSelected={selectedColor === color}
                            onClick={() => {
                                onSelectColor(color);
                                onClose();
                            }}
                            title={color}
                        />
                    ))}
                </ColorGrid>
            </Content>
        </Overlay>
    );
};
