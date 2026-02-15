import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa';

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectTrigger = styled.div<{ $isOpen: boolean }>`
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid ${p => p.$isOpen ? '#38b2ac' : '#e2e8f0'};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #4a5568;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${p => p.$isOpen ? '0 0 0 3px rgba(56, 178, 172, 0.1)' : 'none'};
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
  }
`;

const DropdownMenu = styled.div<{ $coords: { top: number; left: number; width: number } }>`
  position: fixed;
  top: ${p => p.$coords.top}px;
  left: ${p => p.$coords.left}px;
  width: ${p => p.$coords.width}px;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 10005; /* Higher z-index to sit on top of everything, including modals (10001) */
  max-height: 250px;
  overflow-y: auto;
  animation: fadeIn 0.1s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const OptionItem = styled.div<{ $isSelected: boolean }>`
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: ${p => p.$isSelected ? '#2f855a' : '#4a5568'};
  background-color: ${p => p.$isSelected ? '#f0fff4' : 'transparent'};
  font-weight: ${p => p.$isSelected ? '600' : '400'};
  transition: background-color 0.1s;

  &:hover {
    background-color: #ebf8ff;
    color: #2c7a7b;
  }
`;

const HiddenSelect = styled.select`
  display: none;
`;

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Seleccionar..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const updatePosition = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width
            });
        }
    };

    const toggleOpen = () => {
        if (!isOpen) {
            updatePosition();
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Close when clicking outside - Updated to handle Portal clicks
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If clicking inside the container, do nothing (trigger handles it)
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            // If clicking inside the portal dropdown
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event: Event) => {
            // If scrolling inside the dropdown, do nothing logic-wise (position doesn't change)
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            // If scrolling outside (window/modal), update position to stay attached
            updatePosition();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Update coords on scroll/resize to prevent detachment
            window.addEventListener('scroll', handleScroll, { capture: true });
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, { capture: true });
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <SelectContainer ref={containerRef}>
            <SelectTrigger $isOpen={isOpen} onClick={toggleOpen}>
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <FaChevronDown size={12} color="#718096" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </SelectTrigger>

            {isOpen && ReactDOM.createPortal(
                <DropdownMenu
                    ref={dropdownRef}
                    $coords={coords}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking scrollbar/empty space in dropdown
                >
                    {options.map(option => (
                        <OptionItem
                            key={option.value}
                            $isSelected={option.value === value}
                            onMouseDown={() => handleSelect(option.value)} // Use onMouseDown to fire before blur/click-outside
                        >
                            {option.label}
                        </OptionItem>
                    ))}
                </DropdownMenu>,
                document.body
            )}

            {/* Hidden native select for form data/accessibility fallback if needed later */}
            <HiddenSelect value={value} onChange={e => onChange(e.target.value)} tabIndex={-1}>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </HiddenSelect>
        </SelectContainer>
    );
};
