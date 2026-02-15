import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled, { createGlobalStyle } from 'styled-components';
import { es } from 'date-fns/locale';

// Register locale for Spanish
registerLocale('es', es);

const Wrapper = styled.div`
  width: 100%;
  
  /* Override styles to match app theme */
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container {
    width: 100%;

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      font-size: 1rem;
      color: #4a5568;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #38b2ac;
        box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1);
      }
    }
  }

  /* Calendar Container */
  .react-datepicker {
    font-family: inherit;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  /* Header */
  .react-datepicker__header {
    background-color: #f7fafc;
    border-bottom: 1px solid #e2e8f0;
    padding-top: 1rem;
  }

  .react-datepicker__current-month {
    color: #2d3748;
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .react-datepicker__day-name {
    color: #718096;
    font-weight: 600;
    margin: 0.3rem;
  }

  /* Days */
  .react-datepicker__day {
    margin: 0.3rem;
    border-radius: 0.5rem;
    color: #4a5568;
    
    &:hover {
      background-color: #e6fffa;
      color: #2c7a7b;
    }
  }

  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
    color: white;
    font-weight: 600;

    &:hover {
      background-color: #2c7a7b;
    }
  }

  .react-datepicker__day--today {
    font-weight: 700;
    border: 1px solid #38b2ac;
    background-color: transparent;
    color: #38b2ac;

    &.react-datepicker__day--selected {
      background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
      color: white;
      border: none;
    }
  }

  /* Navigation Arrows */
  .react-datepicker__navigation-icon::before {
    border-color: #718096;
  }
`;

interface CustomDatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    dateFormat?: string;
    minDate?: Date;
    maxDate?: Date;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
    selected,
    onChange,
    placeholderText = "Seleccionar fecha",
    dateFormat = "dd/MM/yyyy",
    minDate,
    maxDate
}) => {
    return (
        <Wrapper>
            <DatePicker
                selected={selected}
                onChange={onChange}
                placeholderText={placeholderText}
                dateFormat={dateFormat}
                minDate={minDate}
                maxDate={maxDate}
                locale="es"
                showPopperArrow={false}
            />
        </Wrapper>
    );
};
