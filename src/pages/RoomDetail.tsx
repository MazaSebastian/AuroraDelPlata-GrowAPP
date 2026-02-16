import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaThermometerHalf, FaPlus, FaCalendarAlt, FaSeedling, FaMapMarkedAlt, FaExchangeAlt, FaExpandArrowsAlt, FaStickyNote, FaTrash, FaHistory, FaDna, FaClock, FaCheck, FaExclamationTriangle, FaPrint, FaCut, FaPen, FaEdit, FaChevronDown, FaTasks, FaTimes, FaSpinner, FaChevronLeft, FaChevronRight, FaCircleNotch } from 'react-icons/fa';
// FaExclamationTriangle, FaTint, FaCut, FaSkull, FaLeaf, FaFlask, FaBroom
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
    addDays, addWeeks, differenceInDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { roomsService } from '../services/roomsService';
import { tasksService } from '../services/tasksService';
import { stickiesService } from '../services/stickiesService';
import { usersService } from '../services/usersService';
import { Room } from '../types/rooms';
import { Task, StickyNote, RecurrenceConfig } from '../types';


import { GroupDetailModal } from '../components/GroupDetailModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

// import { EsquejeraGrid } from '../components/Esquejera/EsquejeraGrid';
import { LivingSoilGrid } from '../components/LivingSoil/LivingSoilGrid';
import { LivingSoilBatchModal } from '../components/LivingSoil/LivingSoilBatchModal';
import { StageSelectionModal } from '../components/LivingSoil/StageSelectionModal';
import { DndContext, DragEndEvent, useSensor, useSensors, MouseSensor, TouchSensor, pointerWithin, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { getGeneticColor } from '../utils/geneticColors';
import { Batch, CloneMap } from '../types/rooms';
import { Genetic } from '../types/genetics';

import { ConfirmationModal } from '../components/ConfirmationModal';

import { TransplantModal } from '../components/Esquejera/TransplantModal';
import { HarvestModal } from '../components/Flowering/HarvestModal';
import { ToastModal } from '../components/ToastModal';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';

import { createGlobalStyle } from 'styled-components';

// Global Print Styles
// Handles hiding the report on screen, and hiding everything ELSE on print.
const GlobalPrintStyles = createGlobalStyle`
@media screen {
    .printable-area {
        display: none!important;
    }
    .printable-map-details {
        display: none !important;
    }
}

@media print {
    @page { size: landscape; margin: 10mm; }

    /* Hide everything by default using a class-based approach + broad selectors */
    .no-print, nav, aside, header, footer,
    /* Also hide direct children of root that aren't the print area if needed, 
       but here we rely on the extensive use of .no-print class */
    .Toastify {
        display: none!important;
    }

    body {
        background: white;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
    }

    .printable-area {
        display: block!important;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        background: white;
    }

    /* SPECIFIC MAP PRINT STYLES */
    /* Use visibility to hide everything but keep the active map */
    body.printing-map {
        visibility: hidden;
    }

    body.printing-map .active-map-container {
        visibility: visible;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        background: white;
        z-index: 10000;
        padding: 20px;
        /* SCALING TO FIT PAGE */
        zoom: 60%; /* Simple zoom for browsers that support it */
        transform-origin: top left;
        display: block;
    }
    
    /* Ensure all children of the map are visible */
    body.printing-map .active-map-container * {
        visibility: visible;
    }

    /* Hide specific controls even if they are inside the visible container */
    body.printing-map .no-print-map-controls {
        display: none !important;
    }
    
    body.printing-map .map-grid-item {
        break-inside: avoid;
        border: 1px solid #000 !important;
        color: black !important;
    }

    body.printing-map .printable-map-grid {
        overflow: visible !important;
        width: 100% !important;
        display: block !important;
    }
    
    body.printing-map .printable-map-grid > div {
         overflow: visible !important;
         width: 100% !important;
    }

    /* PRINT DETAIL TABLE STYLES */
    body.printing-map .printable-map-details {
        display: block !important;
        margin-top: 2rem;
        page-break-before: auto;
    }

    body.printing-map .printable-map-details table {
        width: 100%;
        page-break-inside: auto;
    }

    body.printing-map .printable-map-details tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    
    body.printing-map .printable-map-details th,
    body.printing-map .printable-map-details td {
        color: black !important;
        border-color: #000 !important;
    }

    /* NEW PRINTABLE REPORT STYLES */
    .printable-report {
        display: none;
    }
}
@media print {
    /* Hide EVERYTHING by default */
    body * {
        visibility: hidden;
    }
    
    /* Show only our report and its children */
    .printable-report, .printable-report * {
        visibility: visible;
    }

    .printable-report {
        display: block !important;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        margin: 0;
        padding: 0;
        z-index: 20000;
        background: white;
    }
    
    /* Reset body margin/padding for print */
    @page { margin: 10mm; }
    body {
        margin: 0;
        padding: 0;
        overflow: visible !important; /* Allow scroll if content is long */
    }
}
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;

const Container = styled.div`
padding: 2rem;
padding-top: 5rem;
max-width: 1200px;
margin: 0 auto;
animation: ${fadeIn} 0.5s ease-in-out;
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpinningIcon = styled(FaSpinner)`
  animation: ${rotate} 1s linear infinite;
`;

const CreateCard = styled.div`
  background: #f7fafc;
  border-radius: 1.25rem;
  border: 2px dashed #cbd5e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 250px;
  gap: 1rem;
  transition: all 0.2s ease;
  opacity: 0.8;
  color: #a0aec0;
  width: 100%;

  &:hover {
    border-color: #48bb78;
    color: #48bb78;
    background: #f0fff4;
    opacity: 1;
  }
`;

const DashedCircle = styled.div`
  width: 60px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: inherit;
  transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px dashed currentColor;
    transition: all 0.5s ease;
  }

  ${CreateCard}:hover &::before {
    animation: ${rotate} 10s linear infinite;
  }
`;

const EmptyStickyState = styled.div`
background: #f7fafc;
border-radius: 0.75rem;
border: 2px dashed #cbd5e0;
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
padding: 1.5rem;
gap: 1.5rem;
transition: all 0.2s ease;
color: #a0aec0;
width: 100%;
margin-top: 1rem;

  &:hover {
    border-color: #ecc94b; /* Yellow/Gold */
    color: #d69e2e;
    background: #fffff0;
}
`;

const DashedStickyCircle = styled.div`
width: 50px;
height: 50px;
position: relative;
display: flex;
align-items: center;
justify-content: center;
font-size: 1.25rem; /* Icon size */
color: inherit;
transition: all 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 2px dashed currentColor;
    transition: all 0.5s ease;
}

  ${EmptyStickyState}: hover &::before {
    animation: ${rotate} 10s linear infinite;
}
`;

// Helper for colors
const getTaskStyles = (type: string) => {
    switch (type) {
        case 'danger': return { bg: '#fed7d7', color: '#822727' };
        case 'warning': return { bg: '#fefcbf', color: '#744210' };
        case 'fertilizar':
        case 'enmienda':
        case 'te_compost': return { bg: '#c6f6d5', color: '#22543d' };
        case 'riego': return { bg: '#bee3f8', color: '#2c5282' };
        case 'poda_apical': return { bg: '#fc8181', color: '#742a2a' }; // Red
        case 'defoliacion': return { bg: '#fbd38d', color: '#975a16' }; // Orange
        case 'hst':
        case 'lst':
        case 'entrenamiento': return { bg: '#e9d8fd', color: '#44337a' };
        case 'esquejes': return { bg: '#feebc8', color: '#7b341e' };
        case 'info':
        default: return { bg: '#edf2f7', color: '#4a5568' };
    }
};

// Badges
const Badge = styled.span<{ stage?: string, taskType?: string }>`
padding: 2px 8px;
border-radius: 9999px;
font-size: 0.7rem;
font-weight: 600;
text-transform: capitalize;
display: inline-flex;
align-items: center;
border: 1px solid transparent; 
  
  ${p => {
        if (p.stage) {
            return `
            background: ${p.stage === 'vegetation' ? '#c6f6d5' : p.stage === 'flowering' ? '#fed7d7' : (p.stage === 'drying' || p.stage === 'curing') ? '#fffaf0' : p.stage === 'living_soil' ? '#e6fffa' : '#f7fafc'};
            color: ${p.stage === 'vegetation' ? '#22543d' : p.stage === 'flowering' ? '#822727' : (p.stage === 'drying' || p.stage === 'curing') ? '#c05621' : p.stage === 'living_soil' ? '#319795' : '#718096'};
            ${(p.stage !== 'vegetation' && p.stage !== 'flowering') ? 'border-color: #e2e8f0;' : ''}
          `;
        }
        if (p.taskType) {
            const s = getTaskStyles(p.taskType || '');
            return `background: ${s.bg}; color: ${s.color};`;
        }
        return `background: #f7fafc; color: #718096; border-color: #e2e8f0;`;
    }
    }
`;


const Title = styled.h1` font-size: 1.8rem; color: #2d3748; margin: 1rem 0 0.5rem; display: flex; align-items: center; gap: 0.75rem; `; // Repair corrupted title

const StyledActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'gold' | 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: ${p => p.$variant === 'secondary' ? '1px solid #e2e8f0' : 'none'};
  background: ${p => {
        switch (p.$variant) {
            case 'gold': return '#d69e2e';
            case 'primary': return '#48bb78';
            case 'success': return '#48bb78'; // Map success to green
            case 'danger': return '#e53e3e';
            default: return 'white';
        }
    }};
  color: ${p => p.$variant === 'secondary' ? '#4a5568' : 'white'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    filter: brightness(1.05);
    background: ${p => p.$variant === 'secondary' ? '#f7fafc' : undefined};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Modal Utils
const ModalOverlay = styled.div<{ isClosing?: boolean }>`
position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); z-index: 10001;
display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px);
animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const PortalModalOverlay = ({ children, isClosing }: { children: React.ReactNode, isClosing?: boolean }) => {
    return createPortal(
        <ModalOverlay onClick={(e) => e.stopPropagation()} isClosing={isClosing}>
            {children}
        </ModalOverlay>,
        document.body
    );
};
const ModalContent = styled.div<{ isClosing?: boolean }>`
background: white; padding: 2rem; border-radius: 1rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;
animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;
`;

const TaskModalContent = styled.div<{ isClosing?: boolean }>`
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;
background: white;
padding: 2rem;
border-radius: 1.5rem;
width: 95%;
max-width: 1000px; /* Wider for 2 columns */
max-height: 90vh;
overflow-y: auto;
display: flex;
flex-direction: column;

@media(max-width: 768px) {
    padding: 1rem;
}
`;






const CreateMapDropZone = ({ children }: { children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'create-map-zone' });

    return (
        <div ref={setNodeRef} style={{
            position: 'relative',
            minHeight: '200px',
            borderRadius: '0.5rem',
            border: isOver ? '2px dashed #48bb78' : '2px dashed transparent',
            background: isOver ? 'rgba(72, 187, 120, 0.1)' : 'transparent',
            transition: 'all 0.2s'
        }}>
            {children}
            {isOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.8)', zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    <div style={{ color: '#2f855a', fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaPlus /> Soltar para crear Mesa
                    </div>
                </div>
            )}
        </div>
    );
};

const DroppableMapCard = ({ map, children, onClick }: { map: CloneMap, children: React.ReactNode, onClick: () => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `map - ${map.id} `,
        data: { type: 'map', map }
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            style={{
                border: isOver ? '2px solid #3182ce' : '1px solid #e2e8f0',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                background: isOver ? '#ebf8ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isOver ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
        >
            {children}
        </div>
    );
};




const CancelButton = styled.button`
flex: 1;
padding: 0.6rem;
border: 1px solid #e2e8f0;
border-radius: 0.5rem;
background: white;
color: #4a5568;
cursor: pointer;
font-weight: 600;
transition: all 0.2s;
  &:hover { background: #f7fafc; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'success' }>`

padding: 0.75rem 1rem;
border: none;
border-radius: 0.5rem;
background: ${p => p.$variant === 'danger' ? '#fc8181' : p.$variant === 'success' ? '#48bb78' : '#3182ce'};
color: white;
cursor: pointer;
font-weight: 600;
font-size: 0.9rem;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
transition: all 0.2s;
display: flex;
align-items: center;
justify-content: center;
gap: 0.5rem;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}
`;



const HoverButton = styled.button`
  background: #ed8936;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.3rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.05);
    background: #dd6b20;
    box-shadow: 0 4px 6px rgba(0,0,0,0.15);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const BackButton = styled.button`
display: flex;
align-items: center;
gap: 0.5rem;
background: white;
border: 1px solid #e2e8f0;
border-radius: 0.5rem;
color: #4a5568;
font-weight: 600;
cursor: pointer;
padding: 0.5rem 1rem;
font-size: 0.95rem;
transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
    border-color: #cbd5e0;
}
`;

const FormGroup = styled.div`
margin-bottom: 1.5rem;
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #4a5568;
    font-size: 0.9rem;
}
input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    color: #2d3748;
    background: #fff;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:focus {
        outline: none;
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }
    &::placeholder {
        color: #a0aec0;
    }
}
  textarea { min-height: 100px; resize: vertical; font-family: inherit; }
`;

// Room Header Components


const HeaderGrid = styled.div`
display: grid;
grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
gap: 1.5rem;
margin-bottom: 2rem;
`;

const StatCard = styled.div`
background: white;
padding: 1.5rem;
border-radius: 1rem;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
display: flex;
flex-direction: column;
justify-content: center;
align-items: flex-start;
border: 1px solid #e2e8f0;
transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px - 1px rgba(0, 0, 0, 0.1);
}
  
  h3 {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
    line-height: 1.2;
}
  .sub {
    font-size: 0.875rem;
    color: #a0aec0;
    margin-top: 0.25rem;
}
`;




const DraggableStockBatch = ({ batch, onClick }: { batch: Batch, onClick?: () => void }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `stock - ${batch.id} `,
        data: { type: 'batch', batch, fromStock: true }
    });

    const geneticName = batch.genetic?.name || batch.name;
    const colors = getGeneticColor(geneticName);

    return (
        <div
            ref={setNodeRef} {...listeners} {...attributes}
            onClick={onClick}
            style={{
                transform: isDragging ? 'translate3d(0,0,0)' : undefined,
                opacity: isDragging ? 0.5 : 1,
                background: 'white',
                padding: '0.5rem',
                marginBottom: '0',
                borderRadius: '0.5rem',
                border: `1px solid ${colors.border} `,
                borderLeft: `4px solid ${colors.border} `,
                cursor: 'grab',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: '1rem'
            }}
        >
            <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#2d3748' }}>{geneticName}</div>
                <div style={{ fontSize: '0.7rem', color: '#718096' }}>
                    {batch.start_date ? format(new Date(batch.start_date), 'dd/MM/yyyy') : (batch.tracking_code || batch.name)}
                </div>
            </div>
            <div style={{
                background: '#ebf8ff', color: '#2b6cb0', fontWeight: 'bold',
                padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem'
            }}>
                x{batch.quantity}
            </div>
        </div>
    );
};

const DraggableGenetic = ({ genetic }: { genetic: Genetic }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `genetic - ${genetic.id} `,
        data: { type: 'genetic', genetic, fromSidebar: true }
    });

    return (
        <div
            ref={setNodeRef} {...listeners} {...attributes}
            style={{
                transform: isDragging ? 'translate3d(0,0,0)' : undefined,
                opacity: isDragging ? 0.5 : 1,
                background: 'white', padding: '0.75rem', marginBottom: '0.5rem',
                borderRadius: '0.5rem', border: '1px solid #e2e8f0',
                cursor: 'grab', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}
        >
            <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#2d3748' }}>{genetic.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#718096' }}>{genetic.type === 'photoperiodic' ? 'Fotoperiódica' : 'Automática'}</div>
            </div>
            <div style={{
                background: '#ebf8ff', color: '#2b6cb0', fontWeight: 'bold',
                padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem'
            }}>
                <FaDna />
            </div>
        </div>
    );
};


// --- SIDEBAR GROUPING UTILS ---
const groupBatchesByGeneticDate = (batches: Batch[]) => {
    // 1. Identify Roots & Orphans
    const batchMap = new Map();
    batches.forEach(b => batchMap.set(b.id, { ...b, children: [] }));

    const roots: any[] = [];
    const orphans: any[] = [];

    batches.forEach(b => {
        if (b.parent_batch_id && batchMap.has(b.parent_batch_id)) {
            batchMap.get(b.parent_batch_id).children.push(b);
        } else {
            if (b.parent_batch_id) orphans.push(b); // Orphaned child
            else roots.push(batchMap.get(b.id)); // Proper Root
        }
    });

    // 2. Initial Grouping (Parent-Child)
    const groups: any[] = [];
    roots.forEach(root => {
        root.children.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        groups.push({ root, children: root.children });
    });
    orphans.forEach(o => groups.push({ root: o, children: [] }));

    // 3. Smart Grouping (Virtual Batches)
    const smartGroups: any[] = [];
    const groupMap = new Map<string, any[]>();

    groups.forEach(group => {
        const { root } = group;

        // Check for Custom Group Tag in Notes
        const notes = root.notes || '';
        const groupMatch = notes.match(/\[Grupo:\s*(.*?)\]/);

        if (groupMatch) {
            // Priority Grouping by "Grupo: X"
            const groupName = groupMatch[1].trim();
            const key = `GROUP | ${groupName} `;
            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key)!.push(group);
        } else {
            // Default Grouping
            const dateKey = new Date(root.start_date || root.created_at).toLocaleDateString();
            // Key: GeneticID | Date
            const key = `${root.genetic_id || 'unk'}| ${dateKey} `;

            if (!groupMap.has(key)) {
                groupMap.set(key, []);
            }
            groupMap.get(key)!.push(group);
        }
    });

    groupMap.forEach((bundledGroups, key) => {
        // If it's a Custom Group, we merge EVERYTHING under that name
        if (key.startsWith('GROUP|')) {
            const groupName = key.split('|')[1];

            // Sort by name inside the group for consistency?
            bundledGroups.sort((a, b) => a.root.name.localeCompare(b.root.name));

            const primary = bundledGroups[0];
            const rest = bundledGroups.slice(1);
            const mergedChildren = [...primary.children];

            rest.forEach(g => {
                mergedChildren.push(g.root);
                mergedChildren.push(...g.children);
            });

            // We need a "Fake Root" or use the primary one but Override the Name display?
            // Let's attach a special property to the root or handle it in the renderer?
            // The renderer uses `root.name` or smart logic. 
            // Let's modify the root's `displayName` property if we could, but these are raw objects.
            // Best way: The SidebarBatchGroup component logic needs to be aware of this scope.
            // OR we attach a "virtual name" to the root object here.

            // Important: Use the first batch as root, but we must signal that this is a "Named Group"
            // We can inject a property into the root object (it's a copy effectively in usage or we mutate it carefully)
            // Actually `roots` are references to objects in memory. Mutating them might be risky if reused.
            // But valid for this render cycle.

            // Let's create a proxy root for the group?
            // Currently `SidebarBatchGroup` takes `{ root, children } `.
            // We can pass `{ root: { ...primary.root, _virtualGroupName: groupName }, children: mergedChildren } `

            smartGroups.push({
                root: { ...primary.root, _virtualGroupName: groupName },
                children: mergedChildren
            });

        } else {
            // Standard Logic
            if (bundledGroups.length === 1) {
                smartGroups.push(bundledGroups[0]);
            } else {
                // Merge
                bundledGroups.sort((a, b) => a.root.name.localeCompare(b.root.name));
                const primary = bundledGroups[0];
                const rest = bundledGroups.slice(1);
                const mergedChildren = [...primary.children];
                rest.forEach(g => {
                    mergedChildren.push(g.root);
                    mergedChildren.push(...g.children);
                });
                mergedChildren.sort((a: any, b: any) => a.name.localeCompare(b.name));
                smartGroups.push({ root: primary.root, children: mergedChildren });
            }
        }
    });

    // Sort by Date Desc
    // We might want Groups to appear first? Or just by date of the "primary" root?
    // Current sort works by date of root.
    smartGroups.sort((a, b) => new Date(b.root.created_at).getTime() - new Date(a.root.created_at).getTime());
    return smartGroups;
};

const SidebarBatchGroup = ({ group, expanded, onToggleExpand, childrenRender, onBatchGroupClick, renderHeaderActions }: { group: any, expanded: boolean, onToggleExpand: () => void, childrenRender: (batch: any) => React.ReactNode, onBatchGroupClick?: (batch: any) => void, renderHeaderActions?: (batch: any) => React.ReactNode }) => {
    const { root, children } = group;


    const totalQty = root.quantity + children.reduce((acc: number, c: any) => acc + c.quantity, 0);
    const displayDate = new Date(root.start_date || root.created_at).toLocaleDateString();

    // Custom Name Logic
    let displayName = root.name;

    // Check for Virtual Group Name (Custom Grouping from Transplant)
    if (root._virtualGroupName) {
        displayName = root._virtualGroupName;
    } else {
        if (true) { // Default Smart Naming
            const geneticName = root.genetic?.name || root.name || 'Desconocida';
            const prefix = geneticName.substring(0, 6).toUpperCase();
            displayName = `Lote ${prefix} ${displayDate} `;
        }
    }

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `group - ${root.id} `,
        data: { type: 'batch-group', group, fromSidebar: true }
    });

    return (
        <div
            ref={setNodeRef} {...listeners} {...attributes}
            style={{
                marginBottom: '0.25rem',
                background: '#fff',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                transform: isDragging ? 'translate3d(0,0,0)' : undefined,
                opacity: isDragging ? 0.3 : 1,
                cursor: 'grab',
                touchAction: 'manipulation'
            }}
        >
            {/* Header */}
            <div
                onClick={() => {
                    if (onBatchGroupClick) {
                        onBatchGroupClick({ ...root, _totalQuantity: totalQty, _displayName: displayName });
                    } else {
                        onToggleExpand();
                    }
                }}
                style={{
                    padding: '0.35rem 0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: expanded ? '#ebf8ff' : 'white',
                    borderBottom: expanded ? '1px solid #bee3f8' : 'none',
                    gap: '1rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand();
                        }}
                        style={{ color: '#3182ce', fontSize: '0.65rem', padding: '0.25rem', cursor: 'pointer' }}
                    >
                        {expanded ? '▼' : '▶'}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.8rem', color: '#2d3748' }}>{displayName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>Total: {totalQty} u.</span>
                    </div>
                </div>
                {/* Header Actions for Groups or Single Batches */}
                {renderHeaderActions && (
                    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: '0.25rem' }}>
                        {renderHeaderActions(root)}
                    </div>
                )}
            </div>

            {/* Content with internal scroll */}
            {/* Content with internal scroll */}
            <ExpandableContainer $expanded={expanded}>
                <ExpandableInner>
                    <div
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            padding: '0.25rem',
                            background: '#f7fafc',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                            maxHeight: '350px', // Limit height for internal scrolling
                            overflowY: 'auto',
                            cursor: 'default'
                        }}
                    >
                        {childrenRender(root)}
                        {children.map((child: any) => childrenRender(child))}
                    </div>
                </ExpandableInner>
            </ExpandableContainer>

        </div >
    );
};


const RoomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // --- BULK SELECTION & DELETE ---
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
    const [isClosingBulkDelete, setIsClosingBulkDelete] = useState(false); // Animation State
    const [isDeletingBulk, setIsDeletingBulk] = useState(false); // Loading state for delete button

    const handleCloseBulkDelete = () => {
        setIsClosingBulkDelete(true);
        setTimeout(() => {
            setIsBulkDeleteConfirmOpen(false);
            setIsClosingBulkDelete(false);
        }, 200);
    };

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedBatchIds(new Set()); // Clear on toggle
    };



    const handleBulkDeleteFirstStep = () => {
        if (selectedBatchIds.size === 0) return;
        setIsBulkDeleteConfirmOpen(true);
    };

    const handleBulkDeleteConfirm = async () => {
        setIsDeletingBulk(true);
        try {
            const success = await roomsService.deleteBatches(Array.from(selectedBatchIds), 'Eliminación Masiva desde Mapa', user?.id);
            if (success) {
                // Keep modal open but show success toast after small delay or immediately
                await new Promise(resolve => setTimeout(resolve, 500)); // Smooth UX

                handleCloseBulkDelete(); // Close Modal with animation

                // Wait for animation to finish BEFORE changing UI state (prevents glitch)
                setTimeout(async () => {
                    setToastState({ isOpen: true, message: 'Lotes eliminados correctamente', type: 'success' });
                    setIsSelectionMode(false);
                    setSelectedBatchIds(new Set());
                    // Force refresh room data to remove deleted items visually
                    if (id) await loadData(id, false, false);
                }, 200);
            } else {
                setToastState({ isOpen: true, message: 'Error al eliminar lotes', type: 'error' });
                // Clear selection
                setSelectedBatchIds(new Set());
                setIsBulkDeleteConfirmOpen(false);
                setIsSelectionMode(false); // Optional: Exit selection mode // Immediate close on error is fine, or use handler
            }
        } catch (error) {
            console.error(error);
            setToastState({ isOpen: true, message: 'Error inesperado', type: 'error' });
            setIsBulkDeleteConfirmOpen(false);
        } finally {
            setIsDeletingBulk(false);
        }
    };
    // --- END BULK SELECTION ---

    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
    const [metricsData, setMetricsData] = useState<any[]>([]);

    const handleBulkStageChange = async (newStage: any) => {
        if (selectedBatchIds.size === 0) return;
        setLoading(true);
        try {
            // Update all selected batches
            const updatePromises = Array.from(selectedBatchIds).map(id =>
                roomsService.updateBatchStage(id, newStage, user?.id)
            );
            await Promise.all(updatePromises);

            showToast(`Fase actualizada a ${newStage} para ${selectedBatchIds.size} lotes.`, 'success');

            // Clear selection and refresh
            setIsSelectionMode(false);
            setSelectedBatchIds(new Set());
            setIsStageModalOpen(false);

            if (id) await loadData(id, false, false);

        } catch (error) {
            console.error(error);
            showToast("Error al actualizar la fase.", 'error');
        } finally {
            setLoading(false);
        }
    };



    // Genetics Modal State
    const [isGeneticsModalOpen, setIsGeneticsModalOpen] = useState(false);

    // Living Soil Stage Modal
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);

    // Transplant Modal (Use constants to satisfy unused implementation for now)
    const loadingMetrics = false;
    // const transplantRoom = room; // Unused warning fix

    // ...

    // Group Detail Modal State
    // const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null); // Unused warning fix
    const [selectedGroupName] = useState<string | null>(null);

    // ...

    // const handleOpenGroupDetail = ... (Already removed)

    // Transplant Modal


    // Plant Detail Modal

    // Move/Delete/Assign confirmations

    // History

    // Harvest Modal










    // Batch Selection State
    const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);


    // Create Batch Modal State
    const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
    const [isClosingCreateBatch, setIsClosingCreateBatch] = useState(false);
    const [isCreatingBatch, setIsCreatingBatch] = useState(false);

    const closeCreateBatchModal = () => {
        setIsClosingCreateBatch(true);
        setTimeout(() => {
            setIsCreateBatchModalOpen(false);
            setIsClosingCreateBatch(false);
        }, 200);
    };
    const [newBatch, setNewBatch] = useState({
        geneticId: '',
        quantity: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [genetics, setGenetics] = useState<any[]>([]);

    useEffect(() => {
        const fetchGenetics = async () => {
            const data = await roomsService.getGenetics();
            setGenetics(data);
        };
        fetchGenetics();
    }, []);

    // Group Detail Modal State
    // selectedGroupName moved to line 796 to fix lint warning
    const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stickies, setStickies] = useState<StickyNote[]>([]);

    // Day Summary State
    const [isDaySummaryOpen, setIsDaySummaryOpen] = useState(false);
    const [selectedDayForSummary, setSelectedDayForSummary] = useState<Date | null>(null);

    // Sticky Modal State
    const [isStickyModalOpen, setIsStickyModalOpen] = useState(false);
    const [isStickyModalClosing, setIsStickyModalClosing] = useState(false);

    const handleCloseStickyModal = () => {
        setIsStickyModalClosing(true);
        setTimeout(() => {
            setIsStickyModalOpen(false);
            setIsStickyModalClosing(false);
        }, 200);
    };
    const [isProjectionAlertOpen, setIsProjectionAlertOpen] = useState(false);

    // Recurrence State
    const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
    const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
        type: 'daily',
        interval: 1,
        unit: 'day',
        daysOfWeek: []
    });


    const [stickyContent, setStickyContent] = useState('');
    const [stickyColor, setStickyColor] = useState<StickyNote['color']>('yellow');
    const [selectedSticky] = useState<StickyNote | null>(null);
    const [isSavingSticky, setIsSavingSticky] = useState(false);

    const [stickyToDelete, setStickyToDelete] = useState<string | null>(null);
    const [isDeletingSticky, setIsDeletingSticky] = useState(false);
    const [isStickyDeleteModalClosing, setIsStickyDeleteModalClosing] = useState(false);

    const handleCloseStickyDeleteModal = () => {
        setIsStickyDeleteModalClosing(true);
        setTimeout(() => {
            setStickyToDelete(null);
            setIsStickyDeleteModalClosing(false);
        }, 200);
    };


    // Interactive Calendar State
    const { user } = useAuth();
    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isClosingTaskModal, setIsClosingTaskModal] = useState(false);
    const [isSavingTask, setIsSavingTask] = useState(false);

    const closeTaskModal = () => {
        setIsClosingTaskModal(true);
        setTimeout(() => {
            setIsTaskModalOpen(false);
            setIsClosingTaskModal(false);
        }, 200);
    };
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskForm, setTaskForm] = useState({ title: '', type: 'info', due_date: '', description: '', assigned_to: '' });

    // Real Users State
    const [users, setUsers] = useState<any[]>([]);

    // Clone Maps State
    const [cloneMaps, setCloneMaps] = useState<CloneMap[]>([]);

    // Distribution Modal State
    const [isDistributionConfirmOpen, setIsDistributionConfirmOpen] = useState(false);
    const [distributionData, setDistributionData] = useState<{
        batches: Batch[];
        position: string;
        mapId: string;
        map: CloneMap;
    } | null>(null);

    const [toastState, setToastState] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        message: '',
        type: 'info'
    });

    const [searchParams, setSearchParams] = useSearchParams();
    const activeMapId = searchParams.get('mapId');
    const setActiveMapId = (id: string | null) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            if (id) {
                newParams.set('mapId', id);
            } else {
                newParams.delete('mapId');
            }
            return newParams;
        });
    };

    // Room Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isClosingEditRoom, setIsClosingEditRoom] = useState(false);
    const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);

    const closeEditRoomModal = () => {
        setIsClosingEditRoom(true);
        setTimeout(() => {
            setIsEditModalOpen(false);
            setIsClosingEditRoom(false);
        }, 200);
    };
    const [editRoomName, setEditRoomName] = useState('');
    const [editRoomType, setEditRoomType] = useState('');
    const [editRoomStartDate, setEditRoomStartDate] = useState('');

    useEffect(() => {
        if (isEditModalOpen && room) {
            setEditRoomName(room.name);
            setEditRoomType(room.type || 'vegetation');
            setEditRoomStartDate(room.start_date ? new Date(room.start_date).toISOString().split('T')[0] : '');
        }
    }, [isEditModalOpen, room]);

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isClosingMapModal, setIsClosingMapModal] = useState(false);
    const [isCreatingMap, setIsCreatingMap] = useState(false);

    const closeMapModal = () => {
        setIsClosingMapModal(true);
        setTimeout(() => {
            setIsMapModalOpen(false);
            setIsClosingMapModal(false);
        }, 200);
    };
    const [newMapName, setNewMapName] = useState('');
    const [newMapRows, setNewMapRows] = useState<number | string>('');
    const [newMapCols, setNewMapCols] = useState<number | string>('');

    // Edit Map Modal State
    const [isEditMapModalOpen, setIsEditMapModalOpen] = useState(false);
    const [isClosingEditMap, setIsClosingEditMap] = useState(false);
    const [editingMapId, setEditingMapId] = useState<string | null>(null);
    // const [targetMapId, setTargetMapId] = useState<string | null>(null);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkEditForm, setBulkEditForm] = useState({ stage: '', notes: '' });
    const [isUpdatingMap, setIsUpdatingMap] = useState(false);

    const closeEditMapModal = () => {
        setIsClosingEditMap(true);
        setTimeout(() => {
            setIsEditMapModalOpen(false);
            setIsClosingEditMap(false);
        }, 200);
    };

    // --- Loading Data ---
    const [editMapName, setEditMapName] = useState('');
    const [editMapRows, setEditMapRows] = useState<number | string>('');
    const [editMapCols, setEditMapCols] = useState<number | string>('');


    // Map Deletion Modal State
    const [isDeleteMapModalOpen, setIsDeleteMapModalOpen] = useState(false);
    const [isClosingDeleteMap, setIsClosingDeleteMap] = useState(false);
    const [isDeletingMap, setIsDeletingMap] = useState(false);
    const [mapIdToDelete, setMapIdToDelete] = useState<string | null>(null);

    const closeDeleteMapModal = () => {
        setIsClosingDeleteMap(true);
        setTimeout(() => {
            setIsDeleteMapModalOpen(false);
            setIsClosingDeleteMap(false);
        }, 200);
    };

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isClosingHistory, setIsClosingHistory] = useState(false);

    const closeHistoryModal = () => {
        setIsClosingHistory(true);
        setTimeout(() => {
            setIsHistoryModalOpen(false);
            setIsClosingHistory(false);
        }, 200);
    };
    const [historyLoading, setHistoryLoading] = useState(false);
    const [roomHistory, setRoomHistory] = useState<any[]>([]);


    // Map Clear Modal State
    const [isClearMapConfirmOpen, setIsClearMapConfirmOpen] = useState(false);

    // Create Map from Batch Confirmation State
    const [isCreateMapConfirmOpen, setIsCreateMapConfirmOpen] = useState(false);
    const [pendingMapBatch, setPendingMapBatch] = useState<Batch | null>(null);

    // Create Map from Group Confirmation State
    const [isCreateMapFromGroupConfirmOpen, setIsCreateMapFromGroupConfirmOpen] = useState(false);
    const [pendingMapGroup, setPendingMapGroup] = useState<any | null>(null);
    const [isClosingCreateMapFromGroup, setIsClosingCreateMapFromGroup] = useState(false);
    const [isCreatingMapFromGroup, setIsCreatingMapFromGroup] = useState(false);

    const closeCreateMapFromGroupModal = () => {
        setIsClosingCreateMapFromGroup(true);
        setTimeout(() => {
            setIsCreateMapFromGroupConfirmOpen(false);
            setIsClosingCreateMapFromGroup(false);
        }, 200);
    };

    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; batch: Batch | null }>({
        isOpen: false,
        batch: null
    });
    const [isDeletingBatch, setIsDeletingBatch] = useState(false);
    const [isClosingDeleteConfirm, setIsClosingDeleteConfirm] = useState(false);

    const closeDeleteConfirm = () => {
        setIsClosingDeleteConfirm(true);
        setTimeout(() => {
            setDeleteConfirm({ isOpen: false, batch: null });
            setIsClosingDeleteConfirm(false);
        }, 200);
    };

    const [moveConfirm, setMoveConfirm] = useState<{ isOpen: boolean; position: string | null }>({
        isOpen: false,
        position: null
    });


    // State for Map Assignment Modal
    const [assignModal, setAssignModal] = useState<{ isOpen: boolean; batch: Batch | null; quantity: string | number }>({
        isOpen: false,
        batch: null,
        quantity: 1
    });
    const [isAssignModalClosing, setIsAssignModalClosing] = useState(false);
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);

    const handleCloseAssignModal = () => {
        setIsAssignModalClosing(true);
        setTimeout(() => {
            setAssignModal({ ...assignModal, isOpen: false });
            setIsAssignModalClosing(false);
        }, 300);
    };

    // Plant Detail Modal State (Individual Clone on Map)
    const [plantDetailModal, setPlantDetailModal] = useState<{ isOpen: boolean; batch: Batch | null }>({
        isOpen: false,
        batch: null
    });

    // Click-to-Fill State (Legacy-keeping for potentially manual, or removing if fully replaced)
    // We will replace handleBatchClick to open modal instead.


    // Relocation State
    const [movingBatch, setMovingBatch] = useState<Batch | null>(null);

    // Genetics List for Sidebar (Available Genetics for dropdown)
    // availableGenetics removed in favor of genetics

    // Edit Batch Modal State
    const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
    const [editBatchForm, setEditBatchForm] = useState<{ id: string, name: string, quantity: number | string, notes: string }>({
        id: '', name: '', quantity: '', notes: ''
    });
    const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);

    const [isClosingEditBatch, setIsClosingEditBatch] = useState(false);

    const closeEditBatchModal = () => {
        setIsClosingEditBatch(true);
        setTimeout(() => {
            setIsEditBatchModalOpen(false);
            setIsClosingEditBatch(false);
        }, 200);
    };

    // --- SIDEBAR GROUP EXPANSION STATE ---
    const [expandedSidebarGroups, setExpandedSidebarGroups] = useState<Set<string>>(new Set());
    const [expandedDryingGroups, setExpandedDryingGroups] = useState<Set<string>>(new Set());

    const toggleSidebarGroupExpansion = (groupId: string) => {
        setExpandedSidebarGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const toggleDryingGroupExpansion = (groupId: string) => {
        setExpandedDryingGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const activeMap = cloneMaps.find(m => m.id === activeMapId);

    const handleOpenEditBatch = (batch: Batch) => {
        setEditBatchForm({
            id: batch.id,
            name: batch.name,
            quantity: '', // Start empty per user request
            notes: batch.notes || ''
        });
        setIsEditBatchModalOpen(true);
        // Close other modals if open
        setPlantDetailModal({ ...plantDetailModal, isOpen: false });
    };

    const [allRooms, setAllRooms] = useState<Room[]>([]);

    // Transplant Modal State
    const [isTransplantModalOpen, setIsTransplantModalOpen] = useState(false);
    const [isClosingTransplant, setIsClosingTransplant] = useState(false);
    const [isClosingDistribution, setIsClosingDistribution] = useState(false);
    const [isClosingSingleDistribution, setIsClosingSingleDistribution] = useState(false);

    const closeTransplantModal = () => {
        setIsClosingTransplant(true);
        setTimeout(() => {
            setIsTransplantModalOpen(false);
            setIsClosingTransplant(false);
        }, 200);
    };

    const [isSingleDistributeConfirmOpen, setIsSingleDistributeConfirmOpen] = useState(false);
    const [singleDistributionData, setSingleDistributionData] = useState<{ batchId: string, position: string, quantity: number, mapId: string } | null>(null);

    const [transplantForm, setTransplantForm] = useState<{ batchId: string, quantity: number }>({ batchId: '', quantity: 1 });

    const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
    const [isClosingHarvestModal, setIsClosingHarvestModal] = useState(false);

    const closeHarvestModal = () => {
        setIsClosingHarvestModal(true);
        setTimeout(() => {
            setIsHarvestModalOpen(false);
            setIsClosingHarvestModal(false);
        }, 300);
    };

    // Toast State
    const [toastModal, setToastModal] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false, message: '', type: 'info'
    });
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToastModal({ isOpen: true, message, type });
    };

    useEffect(() => {
        // Fetch all rooms for transplant destination selection
        const fetchAllRooms = async () => {
            const rooms = await roomsService.getRooms();
            setAllRooms(rooms);
        };
        fetchAllRooms();
    }, []);


    // HARVEST CONFIRM HANDLER
    // HARVEST CONFIRM HANDLER
    const [harvestTargetMapId, setHarvestTargetMapId] = useState<string | null>(null); // Track which map is being harvested

    // HARVEST CONFIRM HANDLER
    const handleHarvestConfirm = async (selectedBatchIds: string[], targetRoomId?: string) => {
        try {
            // Use dedicated harvest service
            await roomsService.harvestBatches(selectedBatchIds, targetRoomId);

            showToast('Cosecha registrada correctamente', 'success');
            if (id) await loadData(id);
            setHarvestTargetMapId(null);
            if (id) await loadData(id);

        } catch (error) {
            console.error(error);
            showToast('Error al registrar cosecha', 'error');
        }
    };

    // FINALIZE DRYING BATCH HANDLER
    const [finalizeBatch, setFinalizeBatch] = useState<{ id: string, name: string, quantity: number } | null>(null);
    const [finalizeBatches, setFinalizeBatches] = useState<Batch[] | null>(null); // For group finalization
    const [finalWeight, setFinalWeight] = useState('');
    const [finalNotes, setFinalNotes] = useState('');
    const [isClosingFinalize, setIsClosingFinalize] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    const handleOpenFinalize = (batch: Batch) => {
        setFinalizeBatch({ id: batch.id, name: batch.genetic?.name || batch.name, quantity: batch.quantity });
        setFinalizeBatches(null);
        setFinalWeight('');
        setFinalNotes('');
    };

    const handleOpenGroupFinalize = (e: React.MouseEvent, batches: Batch[]) => {
        e.stopPropagation();
        setFinalizeBatches(batches);
        setFinalizeBatch(null);
        setFinalWeight('');
        setFinalNotes('');
    };

    const handleConfirmFinalize = async () => {
        if (!finalizeBatch && !finalizeBatches) return;

        const weight = parseFloat(finalWeight);
        if (isNaN(weight) || weight < 0) {
            alert("Por favor ingresa un peso válido.");
            return;
        }

        setIsFinalizing(true);

        try {
            if (finalizeBatches) {
                // Group Finalization Logic
                const totalPlants = finalizeBatches.reduce((acc, b) => acc + b.quantity, 0);
                if (totalPlants === 0) {
                    alert("No hay plantas para finalizar en este grupo.");
                    setIsFinalizing(false);
                    return;
                }

                const weightPerPlant = weight / totalPlants;
                const promises = finalizeBatches.map(batch => {
                    const batchWeight = weightPerPlant * batch.quantity;
                    return roomsService.finalizeBatch(batch.id, batchWeight, finalNotes);
                });

                await Promise.all(promises);

                // Animate Close
                setIsClosingFinalize(true);
                setTimeout(async () => {
                    showToast(`Grupo finalizado: ${finalizeBatches.length} lotes enviados a stock`, 'success');
                    setFinalizeBatches(null);
                    setIsClosingFinalize(false);
                    // Silent refresh to avoid flicker
                    if (id) await loadData(id, false);
                    setIsFinalizing(false);
                }, 200);

            } else if (finalizeBatch) {
                // Single Batch Finalization Logic
                const success = await roomsService.finalizeBatch(finalizeBatch.id, weight, finalNotes);
                if (success) {
                    // Animate Close
                    setIsClosingFinalize(true);
                    setTimeout(async () => {
                        showToast("Lote finalizado y enviado a stock", 'success');
                        setFinalizeBatch(null);
                        setIsClosingFinalize(false);
                        // Silent refresh to avoid flicker
                        if (id) await loadData(id, false);
                        setIsFinalizing(false);
                    }, 200);
                } else {
                    showToast("Error al finalizar el lote", 'error');
                    setIsFinalizing(false);
                }
            }
        } catch (error) {
            console.error(error);
            showToast("Error al finalizar", 'error');
            setIsFinalizing(false);
        }
    };

    const handleTransplant = async (destinationRoomId: string, singles: string[], groups?: { name: string, batchIds: string[] }[]) => {
        if (!room) return;

        try {
            // 1. Move Singles (Existing Logic)
            if (singles.length > 0) {
                await roomsService.moveBatches(singles, destinationRoomId, ''); // Clean notes: No label
            }

            // 2. Process Groups (Merge Logic)
            if (groups && groups.length > 0) {
                const groupPromises: Promise<void>[] = [];

                for (const group of groups) {
                    if (group.batchIds.length === 0) continue;

                    // USER REQUIREMENT: Tracking IDs must NEVER change.
                    // Previous logic merged batches into a new one, destroying IDs.
                    // New logic: Move each batch individually. 
                    // We treat the "Group Name" as a labeling/note preference, not a database merge.

                    for (const batchId of group.batchIds) {
                        const batch = room.batches?.find(b => b.id === batchId);

                        if (batch) {
                            // Enqueue operation
                            groupPromises.push((async () => {
                                // Move the batch
                                await roomsService.moveBatch(
                                    batchId,
                                    room.id,
                                    destinationRoomId,
                                    'Transplante' // Clean history, no group label
                                );

                                await roomsService.updateBatch(batchId, {
                                    stage: 'vegetation',
                                    notes: '', // CLEAR: Ensure batch has no label ("LIMPIO")
                                    current_room_id: destinationRoomId,
                                    clone_map_id: null,
                                    grid_position: null
                                }, user?.id, 'Transplante: Inicio de Vegetación');
                            })());
                        }
                    }
                }
                // Execute all group batch operations in parallel
                await Promise.all(groupPromises);
            }

            // Refresh
            if (id) await loadData(id);
        } catch (error) {
            console.error("Error transplanting batches:", error);
            alert("Hubo un error al mover los esquejes.");
        }
    };

    const handleUpdateBatch = async () => {
        if (!editBatchForm.id) return;
        setIsUpdatingBatch(true);
        try {
            // Artificial delay for UX
            const minDelay = new Promise(resolve => setTimeout(resolve, 800));

            await Promise.all([
                roomsService.updateBatch(editBatchForm.id, {
                    name: editBatchForm.name,
                    quantity: Number(editBatchForm.quantity),
                    notes: editBatchForm.notes,
                    current_room_id: room?.id
                }, user?.id, 'Edición Manual de Lote'),
                minDelay
            ]);

            // Refresh
            if (id) {
                // Silent refresh if possible, or just standard load
                await loadData(id, false, false);
            }
            closeEditBatchModal();
            showToast("Lote actualizado correctamente", 'success');
        } catch (error) {
            console.error("Error updating batch", error);
            showToast("Error al actualizar el lote", 'error');
        } finally {
            setIsUpdatingBatch(false);
        }
    };



    // Room Update Handler
    const handleUpdateRoom = async () => {
        if (!room || !editRoomName || !editRoomType) return;
        setIsUpdatingRoom(true); // Local loading state
        try {
            await roomsService.updateRoom(room.id, {
                name: editRoomName,
                type: editRoomType as any,
                start_date: editRoomStartDate ? new Date(editRoomStartDate).toISOString() : undefined
            });
            // Reload data without triggering global loading screen if possible, or accept short delay.
            // The flicker happened because setLoading(true) unmounted the modal/page content.
            if (id) await loadData(id);

            closeEditRoomModal();
        } catch (error) {
            console.error("Error updating room:", error);
            alert("Error al actualizar la sala");
        } finally {
            setIsUpdatingRoom(false);
        }
    };




    const handleCreateMap = async () => {
        if (!newMapName || !newMapRows || !newMapCols) {
            showToast("Por favor completa todos los campos.", 'error');
            return;
        }

        setIsCreatingMap(true); // Local loading
        try {
            // Artificial delay for smoother UX
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newMap = await roomsService.createCloneMap({
                room_id: room?.id || '',
                name: newMapName,
                grid_rows: Number(newMapRows),
                grid_columns: Number(newMapCols)
            });

            if (newMap) {
                setCloneMaps(prev => [...prev, newMap]);
                closeMapModal();
                setNewMapName('');
                setNewMapRows('');
                setNewMapCols('');
            }
        } catch (error) {
            console.error("Error creating map", error);
            alert("Error al crear el mapa.");
        } finally {
            setIsCreatingMap(false);
        }
    };


    const handleEditMapClick = (e: React.MouseEvent, map: CloneMap) => {
        e.stopPropagation();
        setEditingMapId(map.id);
        setEditMapName(map.name);
        setEditMapRows(map.grid_rows);
        setEditMapCols(map.grid_columns);
        setIsEditMapModalOpen(true);
    };

    const handleUpdateMap = async () => {
        if (!editingMapId || !editMapName) return;
        const rows = Number(editMapRows);
        const cols = Number(editMapCols);

        if (!rows || rows < 1 || !cols || cols < 1) {
            alert("Por favor ingresa filas y columnas válidas.");
            return;
        }

        setIsUpdatingMap(true); // Local loading
        try {
            const updatedMap = await roomsService.updateCloneMap(editingMapId, {
                name: editMapName,
                grid_rows: rows,
                grid_columns: cols
            });

            if (updatedMap) {
                setCloneMaps(prev => prev.map(m => m.id === editingMapId ? updatedMap : m));
                closeEditMapModal();
                setEditingMapId(null);
            }
        } catch (error) {
            console.error("Error updating map:", error);
            alert("Error al actualizar el mapa.");
        } finally {
            setIsUpdatingMap(false);
        }

    };

    const loadData = React.useCallback(async (roomId: string, isInitial = false, showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            // const { usersService } = await import('../services/usersService');
            // usersService is now imported statically

            const loadPromise = async () => {
                const [roomData, tasksData, usersData, stickiesData, mapsData, metricsResult, geneticsData] = await Promise.all([
                    roomsService.getRoomById(roomId),
                    tasksService.getTasksByRoomId(roomId),
                    usersService.getUsers(),
                    stickiesService.getStickies(roomId),
                    roomsService.getCloneMaps(roomId),
                    roomsService.getCloneSuccessMetrics(roomId),
                    roomsService.getGenetics() // Always fetch genetics to be safe or keep conditional?
                ]);
                return { roomData, tasksData, usersData, stickiesData, mapsData, metricsResult, geneticsData };
            };

            const minTimePromise = isInitial
                ? new Promise(resolve => setTimeout(resolve, 1500))
                : Promise.resolve();

            const [results] = await Promise.all([
                loadPromise(),
                minTimePromise
            ]);

            const { roomData, tasksData, usersData, stickiesData, mapsData, metricsResult, geneticsData } = results;

            setRoom(roomData);
            setTasks(tasksData);
            setUsers(usersData);
            setStickies(stickiesData);
            setCloneMaps(mapsData);
            setMetricsData(metricsResult);

            // Conditional genetics set-reusing the fetched data if needed
            if (['clones', 'esquejes', 'esquejera', 'germinacion', 'germinación', 'germination', 'semillero', 'living_soil'].includes((roomData?.type as string)?.toLowerCase())) {
                setGenetics(geneticsData);
            }

        } catch (error) {
            console.error("Error loading room data", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    const confirmDeleteMap = async () => {
        if (!mapIdToDelete) return;

        setIsDeletingMap(true); // Local loading
        try {
            await roomsService.deleteCloneMap(mapIdToDelete);
            if (id) {
                const maps = await roomsService.getCloneMaps(id);
                setCloneMaps(maps);
            }
            if (activeMapId === mapIdToDelete) setActiveMapId(null);

            closeDeleteMapModal();
            setMapIdToDelete(null);
            showToast("Mapa eliminado correctamente!", 'success');
        } catch (error) {
            console.error("Error deleting map", error);
            showToast("Error al eliminar el mapa.", 'error');
        } finally {
            setIsDeletingMap(false);
        }
    };




    const handleClearMap = async () => {
        if (!activeMapId) return;
        try {
            setLoading(true);
            await roomsService.clearMap(activeMapId);
            if (id) await loadData(id);
        } catch (error) {
            console.error("Error clearing map", error);
        } finally {
            setLoading(false);
            setIsClearMapConfirmOpen(false);
        }
    };




    const handleOpenHistory = async () => {
        if (!room) return;
        setHistoryLoading(true);
        setIsHistoryModalOpen(true);
        try {
            const history = await roomsService.getRoomMovements(room.id);
            setRoomHistory(history);
        } catch (error) {
            console.error("Error loading history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Click-to-Fill Handler & Plant Detail Trigger
    const handleEditBatchClick = (e: React.MouseEvent, batch: Batch) => {
        e.stopPropagation();
        handleOpenEditBatch(batch);
    };

    const handleDeleteBatchClick = (e: React.MouseEvent, batch: Batch) => {
        e.stopPropagation();
        setDeleteConfirm({ isOpen: true, batch });
    };

    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false); // Dropdown State

    // Living Soil States
    const [isSowingModalOpen, setIsSowingModalOpen] = useState(false);
    const [sowingPosition, setSowingPosition] = useState<string | null>(null);
    const [newSowingBatch, setNewSowingBatch] = useState({
        genetic_id: '',
        name: '', // Will be generated or manual
        quantity: 1, // Usually 1 per slot
        notes: ''
    });

    // ... existing handleBatchClick ...
    const handleBatchClick = async (batch: Batch | null, position?: string) => {
        // 1. Relocation Logic (If actively moving a batch)
        if (movingBatch) {
            if (batch) {
                showToast("La celda destino está ocupada. Selecciona una celda vacía.", 'error');
                return;
            }
            // ... move logic ...
            if (position && activeMapId) {
                // Execute Move
                // ...
                // Implementation details for move needing context, not changing now.
            }
        } else {
            // Normal Click
            if (!batch) {
                // Empty cell click
                if (position && activeMapId && (room?.type === 'living_soil' || room?.type === 'clones')) {
                    setSowingPosition(position);
                    setIsSowingModalOpen(true);
                }
                return;
            }

            // Bulk Edit Trigger
            if (isSelectionMode && selectedBatchIds.has(batch.id) && selectedBatchIds.size > 1) {
                // Open Bulk Edit Modal
                setBulkEditForm({ stage: '', notes: '' }); // Reset
                setIsBulkEditModalOpen(true);
                return;
            }

            // Standard Single Batch Click
            setSelectedBatchId(batch.id);
            setPlantDetailModal({ isOpen: true, batch });
        }
    };

    const handleBulkEditSubmit = async () => {
        if (selectedBatchIds.size === 0) return;

        setLoading(true);
        try {
            const updates: any = {};
            if (bulkEditForm.stage) updates.stage = bulkEditForm.stage;
            if (bulkEditForm.notes) {
                // We might want to append notes or replace? Replace typical for bulk.
                // Or maybe append? Let's replace for now based on user request "modificador de Etapa y notas".
                // If simple text, it's a replace/set.
                updates.notes = bulkEditForm.notes;
            }

            if (Object.keys(updates).length === 0) {
                setIsBulkEditModalOpen(false);
                setLoading(false);
                return;
            }

            // Execute Updates
            const promises = Array.from(selectedBatchIds).map(id =>
                roomsService.updateBatch(
                    id,
                    { ...updates, current_room_id: room?.id },
                    user?.id,
                    'Edición Masiva'
                )
            );

            await Promise.all(promises);

            if (id) await loadData(id);
            setIsBulkEditModalOpen(false);
            setSelectedBatchIds(new Set()); // Clear selection after edit? Usually yes.
            // setIsSelectionMode(false); // Maybe exit selection mode too?
            showToast(`Se actualizaron ${selectedBatchIds.size} lotes correctamente.`, 'success');

        } catch (error) {
            console.error("Error bulk updating:", error);
            showToast("Error al actualizar lotes.", 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for Excel-style row labels (A, ..., Z, AA, AB, ...)
    const getRowLabel = (n: number) => {
        let s = "";
        while (n > 0) {
            let remainder = (n - 1) % 26;
            s = String.fromCharCode(65 + remainder) + s;
            n = Math.floor((n - 1) / 26);
        }
        return s;
    };

    const getRowIndex = (s: string) => {
        let n = 0;
        for (let i = 0; i < s.length; i++) {
            n = n * 26 + (s.charCodeAt(i) - 64);
        }
        return n;
    };

    const handleSowingSubmit = async () => {
        if (!room || !activeMapId || !sowingPosition || !newSowingBatch.genetic_id) {
            showToast("Faltan datos para realizar la siembra.", 'error');
            return;
        }

        try {
            setLoading(true);
            // 1. Get Genetic for Nomenclatura
            const genetic = genetics.find(g => g.id === newSowingBatch.genetic_id);
            const prefix = genetic?.nomenclatura || 'GEN';

            // 2. Generate Tracking Code (Simplified, or rely on backend triggers/service)
            // Ideally service handles this. Let's use createBatch logic from service if possible or custom manual one.
            // We'll use a specific service method or standard createBatch.
            // But standard createBatch doesn't auto-set tracking code easily without logic.
            // Let's rely on backend or service logic handling naming if passed empty? 
            // For now, let's just pass basic info and let DB/Service handle naming if needed or generate here.

            // Getting next sequence is hard on client without query. 
            // Let's use a simpler approach: Name = "S-POS" or similar temporarily, or assume service fixes it.
            // Actually `roomsService.batchAssignToMap` does logic. Maybe we can misuse it? No.

            // Let's use `roomsService.createBatch` but we need to generate unique name/code.
            // Ideally we'd have `roomsService.sowBatch(...)`.

            await roomsService.createBatch({
                name: `${prefix} -${sowingPosition} `, // Temporary name until better logic
                quantity: 1,
                stage: 'seedling', // Start as Seedling
                genetic_id: newSowingBatch.genetic_id,
                start_date: new Date().toISOString(),
                current_room_id: room.id,
                clone_map_id: activeMapId,
                grid_position: sowingPosition,
                notes: newSowingBatch.notes
            }, user?.id);

            await loadData(room.id);
            setIsSowingModalOpen(false);
            setSowingPosition(null);
            setNewSowingBatch({ genetic_id: '', name: '', quantity: 1, notes: '' });
            showToast("Siembra registrada con éxito.", 'success');

        } catch (error) {
            console.error(error);
            showToast("Error al registrar siembra.", 'error');
        } finally {
            setLoading(false);
        }
    };


    const handleOpenTransplant = (e: React.MouseEvent, room: Room, batch: Batch | null) => {
        e.stopPropagation();

        if (batch) {
            setTransplantForm({ ...transplantForm, batchId: batch.id, quantity: batch.quantity });
        } else {
            setTransplantForm({ batchId: '', quantity: 1 });
        }
        setIsTransplantModalOpen(true);
    };

    // Living Soil Handlers
    const handleUpdateStage = async (batch: Batch, newStage: any) => {
        try {
            await roomsService.updateBatchStage(batch.id, newStage, user?.id);
            if (id) await loadData(id);
            showToast(`Etapa actualizada a ${newStage} `, 'success');
            // Update the modal's internal batch if possible, or close it.
            setPlantDetailModal({ isOpen: false, batch: null });
        } catch (error) {
            console.error(error);
            showToast("Error al actualizar etapa", 'error');
        }
    };

    const handleSaveNotes = async (batch: Batch, notes: string) => {
        try {
            const hasContent = !!notes?.trim();
            const updates = {
                notes,
                has_alert: hasContent,
                current_room_id: room?.id // Ensure room context for history log
            };
            await roomsService.updateBatch(batch.id, updates, user?.id, 'Nota actualizada');

            // Update local state
            if (activeMapId && room?.batches) {
                const updatedBatches = room.batches.map(b => b.id === batch.id ? { ...b, ...updates } : b);
                setRoom(prev => prev ? { ...prev, batches: updatedBatches } : null);
            }
            showToast("Nota guardada", 'success');
        } catch (e) {
            console.error(e);
            showToast("Error al guardar nota", 'error');
        }
    };

    const handleConfirmMove = async () => {
        if (!moveConfirm.position || !room || !activeMapId || !movingBatch) return;

        try {
            // Correct signature: batchId, fromRoomId, toRoomId, notes, quantity, gridPosition, cloneMapId
            await roomsService.moveBatch(
                movingBatch.id,
                room.id,
                room.id,
                'Reubicación manual',
                undefined,
                moveConfirm.position || undefined,
                activeMapId || undefined
            );

            setMovingBatch(null);
            if (id) {
                const updatedRoom = await roomsService.getRoomById(id);
                if (updatedRoom) setRoom(updatedRoom);
            }
            showToast("Lote reubicado correctamente", 'success');
        } catch (error) {
            console.error("Move error", error);
            showToast("Error moviendo lote", 'error');
        } finally {
            setMoveConfirm({ isOpen: false, position: null });
            // Ensure moving state is cleared on error too if desired, 
            // but keeping it might allow retry. The user requested "cancel" explicitly.
            setMovingBatch(null);
        }
    };

    const handleConfirmDelete = async () => {
        const { batch } = deleteConfirm;
        if (!batch) return;

        setIsDeletingBatch(true);
        try {
            // Artificial delay for UX
            const minDelay = new Promise(resolve => setTimeout(resolve, 800));

            await Promise.all([
                roomsService.deleteBatch(batch.id),
                minDelay
            ]);

            closeDeleteConfirm();
            if (id) {
                // Silent refresh if possible
                // Silent refresh if possible
                await loadData(id, false, false);
                // Remove from selection if present
                if (selectedBatchIds.has(batch.id)) {
                    const newSet = new Set(selectedBatchIds);
                    newSet.delete(batch.id);
                    setSelectedBatchIds(newSet);
                }
            }
        } catch (error) {
            console.error("Error deleting single plant", error);
            alert("Error al eliminar la planta");
        } finally {
            setIsDeletingBatch(false);
        }
    };

    /* 
    // Legacy Toggle Alert - Removed in favor of Register Observation
    const handleToggleAlert = async () => { ... } 
    */




    const handleDeleteBatchFromGroup = async (batch: Batch, quantityDiscard: number) => {
        // Validation
        if (quantityDiscard <= 0) return;

        const isFullDelete = quantityDiscard >= batch.quantity;

        if (window.confirm(`¿Estás seguro de descartar ${quantityDiscard} unidades de ${batch.tracking_code || 'este lote'}?`)) {
            try {
                if (isFullDelete) {
                    await roomsService.deleteBatch(batch.id);
                } else {
                    // Update Quantity (Partial Discard)
                    await roomsService.updateBatch(batch.id, {
                        ...batch,
                        quantity: batch.quantity - quantityDiscard,
                        // Append note about discard?
                        notes: (batch.notes || '') + `\n[${new Date().toLocaleDateString()}] Descartadas ${quantityDiscard} unidades.`
                    });
                }

                // Refresh
                if (id) await loadData(id);

            } catch (e) { console.error(e); alert("Error al descartar"); }
        }
    };

    const handleAutoAssign = async () => {
        const { batch, quantity } = assignModal;
        const qty = Number(quantity);
        if (!batch || !room || !activeMapId || qty <= 0) return;

        // 1. Find Empty Spots
        const map = cloneMaps.find(m => m.id === activeMapId);
        if (!map) return;

        const currentBatchesInMap = room.batches?.filter(b => b.clone_map_id === activeMapId) || [];
        const occupiedPositions = new Set(currentBatchesInMap.map(b => b.grid_position));

        const targetPositions: string[] = [];
        let assignedCount = 0;

        // Iterate grid to find empty spots
        for (let r = 0; r < map.grid_rows; r++) {
            for (let c = 0; c < map.grid_columns; c++) {
                if (assignedCount >= qty) break;
                const rowLabel = String.fromCharCode(65 + r);
                const pos = `${rowLabel}${c + 1}`; // Fixed: Removed trailing space

                if (!occupiedPositions.has(pos)) {
                    targetPositions.push(pos);
                    assignedCount++;
                }
            }
        }

        if (targetPositions.length < qty) {
            alert(`No hay suficiente espacio libre en el mapa.Se necesitan ${qty} espacios, hay ${targetPositions.length}.`);
            return;
        }

        setIsAutoAssigning(true); // Local loading
        try {
            // Check if we are assigning a group (qty > 1 and batch has siblings in room)
            // Or just multiple batches from a group
            // We need to find 'qty' batches from the available stock that match the criteria

            // Available batches in this room, not in map, same genetic, same creation date (roughly) or just same genetic?
            // Sidebar grouping uses genetic_id and created_at.
            // batch is the root of the group (or one of them).



            if (qty === 1) {
                // Single unit assignment
                // Only use batchesToAssign if it was set, or just use batch.id directly if we are sure
                // Since batchesToAssign was declared but not used in the new logic, let's use batch.id directly
                // matching the original logic which used batchesToAssign[0] = batch.id
                await roomsService.batchAssignToMap(batch.id, activeMapId, targetPositions, room.id, user?.id);
            } else {
                // Multi-unit distribution logic
                const availableBatches = room.batches?.filter(b =>
                    !b.clone_map_id &&
                    b.quantity > 0 &&
                    b.current_room_id === room.id &&
                    (b.genetic_id === batch.genetic_id || b.name === batch.name)
                ) || [];

                availableBatches.sort((a, b) => a.tracking_code?.localeCompare(b.tracking_code || '') || a.id.localeCompare(b.id));

                const totalAvailableUnits = availableBatches.reduce((sum, b) => sum + b.quantity, 0);

                if (totalAvailableUnits < qty) {
                    alert(`No se encontraron suficientes lotes disponibles.Solicitados: ${qty}, Disponibles: ${totalAvailableUnits} `);
                    setIsAutoAssigning(false);
                    return;
                }

                let remainingQtyToAssign = qty;
                let positionIndex = 0;
                const promises = [];

                for (const b of availableBatches) {
                    if (remainingQtyToAssign <= 0) break;
                    const quantityFromThisBatch = Math.min(b.quantity, remainingQtyToAssign);
                    const positionsForThisBatch = targetPositions.slice(positionIndex, positionIndex + quantityFromThisBatch);

                    if (positionsForThisBatch.length > 0) {
                        promises.push(
                            roomsService.batchAssignToMap(b.id, activeMapId, positionsForThisBatch, room.id, user?.id)
                        );
                    }
                    remainingQtyToAssign -= quantityFromThisBatch;
                    positionIndex += quantityFromThisBatch;
                }
                await Promise.all(promises);
            }

            if (id) {
                const updatedRoom = await roomsService.getRoomById(id);
                if (updatedRoom) setRoom(updatedRoom);
            }
            handleCloseAssignModal();
            // Wait for modal to close partially before resetting
            setTimeout(() => setAssignModal({ isOpen: false, batch: null, quantity: 1 }), 300);

            showToast("Lotes asignados correctamente", 'success');

        } catch (error) {
            console.error("Auto assign error", error);
            showToast("Error asignando lotes", 'error');
        } finally {
            setIsAutoAssigning(false);
        }
    };
    // DnD Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleConfirmDistribution = async () => {
        if (!distributionData) return;

        setLoading(true);
        setIsDistributionConfirmOpen(false);

        try {
            const { batches, position, mapId, map } = distributionData;

            // Fix for AA+ rows
            const match = position.match(/^([A-Z]+)(\d+)$/);
            if (!match) {
                console.error("Invalid position format:", position);
                return;
            }
            const rowLabel = match[1];
            const colStr = match[2];

            const startRow = getRowIndex(rowLabel);
            const startCol = parseInt(colStr, 10);

            const success = await roomsService.bulkDistributeBatchesToMap(
                batches,
                mapId,
                startRow,
                startCol,
                map.grid_rows,
                map.grid_columns,
                user?.id
            );

            if (success) {
                if (id) await loadData(id);
            } else {
                alert("No se pudo completar la distribución. Verifica el espacio disponible.");
            }
        } catch (error) {
            console.error("Error distributing group", error);
            alert("Error al distribuir el grupo.");
        } finally {
            setLoading(false);
            setDistributionData(null);
        }
    };

    const [activeItem, setActiveItem] = useState<any>(null);

    // Memoized batches for LivingSoilGrid to prevent infinite loops
    const livingSoilBatches = useMemo(() => {
        return (room?.batches || []).filter(b => b.clone_map_id === activeMapId && b.quantity > 0);
    }, [room?.batches, activeMapId]);

    const handleDragStart = (event: any) => {
        setActiveItem(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveItem(null);
        const { active, over } = event;

        console.log("DRAG END:", { active, over, activeData: active?.data?.current, overId: over?.id });

        if (!over) {
            // Dropped outside
            return;
        }

        // If we are dropping on create-map-zone, we don't need an active map
        if (over.id !== 'create-map-zone' && !activeMapId) return;


        const targetId = over.id as string;

        if (targetId.startsWith('cell-')) {
            // Moved to a Grid Cell
            const position = active.data.current?.position || targetId.replace('cell-', '');

            // CHECK IF GENETIC DROP (New Batch Creation)
            if (active.data.current?.type === 'genetic') {
                const genetic = active.data.current?.genetic as Genetic;
                try {
                    await roomsService.createBatch({
                        name: genetic.name,
                        genetic_id: genetic.id,
                        quantity: 1,
                        stage: 'vegetation', // Default for clones
                        start_date: new Date().toISOString(),
                        current_room_id: room?.id,
                        clone_map_id: activeMapId || undefined,
                        grid_position: position,
                        notes: 'Creado desde Genetica'
                    });
                    if (id) await loadData(id);
                } catch (err) {
                    console.error("Error creating batch from genetic drop", err);
                }
                setLoading(false);
                return;
            }

            // CHECK IF BATCH GROUP DROP (Auto-Distribute Lote)
            if (active.data.current?.type === 'batch-group') {
                const group = active.data.current.group;
                if (!group || !activeMapId) return;

                const { root, children } = group;
                const allBatches = [root, ...(children || [])].filter(b => b.quantity > 0);

                if (allBatches.length === 0) return;

                const map = cloneMaps.find(m => m.id === activeMapId);
                if (!map) {
                    console.error("Map not found in cloneMaps");
                    return;
                }

                // Check Capacity
                const totalPlants = allBatches.reduce((a, b) => a + b.quantity, 0);

                // Calculate available slots from start position
                console.log("Distribution Debug-Target ID:", targetId);
                console.log("Distribution Debug-Resolved Position:", position);

                const match = position.match(/^([A-Z]+)(\d+)$/);
                if (!match) {
                    console.error("Invalid position for distribution:", position);
                    setLoading(false);
                    return;
                }
                const rowLabel = match[1];
                const colStr = match[2];

                const startRow = getRowIndex(rowLabel);
                const startCol = parseInt(colStr, 10);

                console.log("Distribution Debug-StartRow:", startRow, "StartCol:", startCol);

                const existingBatchesInMap = room?.batches?.filter(b => b.clone_map_id === activeMapId && b.quantity > 0) || [];
                const occupiedSet = new Set(existingBatchesInMap.map(b => b.grid_position));

                let freeSlots = 0;
                let r = startRow;
                let c = startCol;

                // Safety break to prevent infinite loops if logic fails
                let iterations = 0;
                const MAX_ITERATIONS = map.grid_rows * map.grid_columns * 2;

                while (r <= map.grid_rows) {
                    // Safety check
                    if (iterations++ > MAX_ITERATIONS) {
                        console.error("Infinite loop detected in distribution calculation");
                        break;
                    }

                    const pos = `${getRowLabel(r)}${c} `;
                    if (!occupiedSet.has(pos)) {
                        freeSlots++;
                    }

                    c++;
                    if (c > map.grid_columns) {
                        c = 1;
                        r++;
                    }
                }

                if (totalPlants > freeSlots) {
                    // Show Toast/Alert for capacity exceeded
                    // Using standard alert for now as requested "modal toast central" implies existing component or simple alert is better than nothing, 
                    // and I'll use the existing ToastModal if available or simple alert.
                    // Given the constraint "debe desplegar un modal toast central flotante", I will use a custom state for a simple central modal if ToastModal isn't easy to hook up instantly without looking at it.
                    // But wait, there is a ToastModal imported. Let's try to use it if I can see how. 
                    // Actually, for now, to ensure reliability, I will use window.alert but ideally I should check ToastModal usage.
                    // Improving: I will use a simple alert for now to ensure functionality, then can refine to ToastModal.
                    setToastState({
                        isOpen: true,
                        message: `Cantidad excedida: Tienes ${totalPlants} plantas pero solo ${freeSlots} espacios disponibles a partir de la celda seleccionada.`,
                        type: 'error'
                    });
                    setLoading(false);
                    return;
                }

                // logic to open custom modal instead of window.confirm
                setDistributionData({
                    batches: allBatches,
                    position: position,
                    mapId: activeMapId,
                    map: map
                });
                setIsDistributionConfirmOpen(true);
                setLoading(false);
                return;

            }

            const batch = active.data.current?.batch as Batch;
            const fromStock = active.data.current?.fromStock;

            const notes = `Movido a mapa ${activeMapId} celda ${position} `;

            // MAP MODE (VEGETATION / FLOWERING): DISTRIBUTE BATCH (INDIVIDUALIZATION)
            const isMapMode = ['vegetacion', 'vegetación', 'vegetation', 'flowering', 'floración', 'flora', 'living_soil'].includes((room?.type || '').toLowerCase());

            if (isMapMode && fromStock && batch.quantity > 0 && activeMapId) {
                // Open Custom Confirmation Modal instead of window.confirm
                setSingleDistributionData({
                    batchId: batch.id,
                    position: position,
                    quantity: batch.quantity,
                    mapId: activeMapId
                });
                setIsSingleDistributeConfirmOpen(true);
                setLoading(false);
                return;
            }

            // Logic for Splitting (Standard Esquejera Behavior)
            let splitQty = undefined;
            if (fromStock && batch.quantity > 1) {
                // Automatically split 1 unit when dragging from "Bulk" Stock
                splitQty = 1;
            }

            // If simply moving within map (no split, just move)
            if (!fromStock && batch.grid_position === position && batch.clone_map_id === activeMapId) {
                setLoading(false);
                return;
            }

            // API Call (Standard Move)
            try {
                await roomsService.moveBatch(batch.id, room?.id || null, room?.id || '', notes, splitQty, position, activeMapId || undefined, user?.id);
                // Refresh data to see the split result
                if (id) await loadData(id);
            } catch (err) {
                console.error(err);
                if (id) await loadData(id); // Revert on error
            } finally {
                setLoading(false);
            }
        }

        // CHECK IF DROPPED IN STOCK ZONE (Return to Stock)
        if (targetId === 'stock-zone') {
            const batch = active.data.current?.batch as Batch;
            if (!batch || !batch.clone_map_id) return; // Already in stock or invalid

            try {
                // Determine if we need to split? 
                // Usually dragging back means "Unassign All of this batch" or "Unassign 1 unit"?
                // If it's a grid item (single), we move it back.

                // Move to room (null map, null position)
                await roomsService.moveBatch(batch.id, room?.id || null, room?.id || '', 'Devuelto a Stock', undefined, undefined, undefined, user?.id);
                if (id) await loadData(id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        // CHECK IF DROPPED IN TRASH ZONE (Delete)
        if (targetId === 'trash-zone') {
            const batch = active.data.current?.batch as Batch;
            if (!batch) return;

            if (!window.confirm("¿Eliminar este lote permanentemente?")) {
                setLoading(false);
                return;
            }

            try {
                // Explicit reason for metrics
                await roomsService.deleteBatch(batch.id, 'Baja-Eliminado del Mapa', user?.id);
                if (id) await loadData(id);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }


        if (targetId === 'create-map-zone') {
            // CHECK IF BATCH GROUP
            if (active.data.current?.type === 'batch-group') {
                const group = active.data.current?.group;
                if (!group) return;

                const isMapCapable = ['clones', 'esquejes', 'esquejera', 'vegetacion', 'vegetación', 'vegetation', 'flowering', 'floración', 'flora', 'living_soil'].includes((room?.type || '').toLowerCase());
                if (!isMapCapable) return;

                setPendingMapGroup(group);
                setIsCreateMapFromGroupConfirmOpen(true);
                return;
            }

            const batch = active.data.current?.batch as Batch;
            const fromStock = active.data.current?.fromStock;

            // Only allow from stock and if it has quantity
            if (!fromStock || !batch || batch.quantity <= 0) {
                return;
            }

            const isMapCapable = ['clones', 'esquejes', 'esquejera', 'vegetacion', 'vegetación', 'vegetation', 'flowering', 'floración', 'flora', 'living_soil'].includes((room?.type || '').toLowerCase());

            if (!isMapCapable) return;

            // Trigger Custom Modal instead of window.confirm
            setPendingMapBatch(batch);
            setIsCreateMapConfirmOpen(true);
            return;
        }
    };

    const handleConfirmCreateMap = async () => {
        if (!pendingMapBatch || !room) return;

        setLoading(true);
        try {
            // 1. Calculate Grid Size (Square-ish)
            const total = pendingMapBatch.quantity;
            const cols = Math.ceil(Math.sqrt(total));
            const rows = Math.ceil(total / cols);

            // 2. Create Map
            const newMapName = `${pendingMapBatch.name} -${format(new Date(), 'dd/MM HH:mm')} `;

            const { data: newMap, error: mapError } = await supabase
                .from('clone_maps')
                .insert([{
                    room_id: room.id,
                    name: newMapName,
                    grid_rows: rows,
                    grid_columns: cols
                }])
                .select()
                .single();

            if (mapError || !newMap) {
                console.error("Error creating map:", mapError);
                throw new Error("Error creating map");
            }

            // 3. Distribute Batch
            const success = await roomsService.distributeBatchToMap(
                pendingMapBatch.id,
                newMap.id,
                1, 1, // Start at A1
                rows, cols,
                user?.id
            );

            if (success) {
                // Refresh
                if (id) await loadData(id);
            } else {
                alert("El mapa se creó pero hubo un error distribuyendo las plantas.");
            }

        } catch (e) {
            console.error(e);
            alert("Error al crear la mesa automática.");
        } finally {
            setLoading(false);
            setIsCreateMapConfirmOpen(false);
            setPendingMapBatch(null);
        }
    };

    const handleConfirmCreateMapFromGroup = async () => {
        if (!pendingMapGroup || !room) return;

        setIsCreatingMapFromGroup(true); // Local loading
        try {
            // 1. Calculate Total and Grid Size
            const { root, children } = pendingMapGroup;
            // Ensure we use all batches in the group
            const allBatches = [root, ...(children || [])];

            const totalQty = allBatches.reduce((acc: number, b: any) => acc + (b.quantity || 0), 0);

            // Default roughly square
            const cols = Math.ceil(Math.sqrt(totalQty));
            const rows = Math.ceil(totalQty / cols);

            // 2. Create Map
            // Use same naming as Sidebar Group
            let newMapName = '';

            if (root._virtualGroupName) {
                newMapName = root._virtualGroupName;
            } else {
                const geneticName = root.genetic?.name || root.name || 'Desconocida';
                const prefix = geneticName.substring(0, 6).toUpperCase();
                const displayDate = new Date(root.start_date || root.created_at).toLocaleDateString();
                newMapName = `Lote ${prefix} ${displayDate} `; // Consistent naming without hyphen
            }

            const { data: newMap, error: mapError } = await supabase
                .from('clone_maps')
                .insert([{
                    room_id: room.id,
                    name: newMapName,
                    grid_rows: rows,
                    grid_columns: cols
                }])
                .select()
                .single();

            if (mapError || !newMap) throw mapError;

            // 3. Assign Batches Sequentially (BULK OPTIMIZATION)
            await roomsService.bulkDistributeBatchesToMap(
                allBatches,
                newMap.id,
                1, // Start Row
                1, // Start Col
                rows,
                cols,
                user?.id
            );

            if (id) await loadData(id);

            closeCreateMapFromGroupModal();
            setPendingMapGroup(null);

        } catch (e) {
            console.error(e);
            alert("Error al crear el mapa desde el grupo.");
            setIsCreatingMapFromGroup(false); // Stop loading on error
        }
    };



    // ... (keep existing Task Handlers) ...

    // Sticky Handlers


    const handleSaveSticky = async () => {
        if (!id) return;
        setIsSavingSticky(true);

        // No specific date-general room note
        const targetDate = undefined;

        try {
            if (selectedSticky) {
                // Update logic (if implemented in service/UI fully)
                // For now we just create new ones or delete old ones manually
            } else {
                // Pass undefined or null for targetDate to make it general
                await stickiesService.createSticky(stickyContent, stickyColor, id, targetDate);
            }

            const freshStickies = await stickiesService.getStickies(id);
            setStickies(freshStickies);
            handleCloseStickyModal();
            setStickyContent('');
        } catch (error) {
            console.error("Error saving sticky:", error);
            alert("Error al guardar la nota. Intente nuevamente.");
        } finally {
            setIsSavingSticky(false);
        }
    };



    const handleDeleteSticky = (stickyId: string) => {
        setStickyToDelete(stickyId);
    };

    const confirmDeleteSticky = async () => {
        if (stickyToDelete) {
            setIsDeletingSticky(true);
            try {
                await stickiesService.deleteSticky(stickyToDelete);
                if (id) {
                    const freshStickies = await stickiesService.getStickies(id);
                    setStickies(freshStickies);
                }
                handleCloseStickyDeleteModal();
            } catch (error) {
                console.error("Error deleting sticky:", error);
                alert("Error al eliminar la nota.");
            } finally {
                setIsDeletingSticky(false);
            }
        }
    };


    // Calendar rendering logic removed from here as it was misplaced.


    // --- Observation Feature State ---
    const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
    const [isClosingObservation, setIsClosingObservation] = useState(false); // Animation State
    const [observationText, setObservationText] = useState('');

    const handleCloseObservation = () => {
        setIsClosingObservation(true);
        setTimeout(() => {
            setIsObservationModalOpen(false);
            setIsClosingObservation(false);
        }, 200);
    };

    const handleRegisterObservation = async () => {
        if (!selectedBatchIds.size) return;

        setLoading(true); // Add loading state
        try {
            const batchIds = Array.from(selectedBatchIds);
            const hasContent = !!observationText?.trim();

            console.log(`[Observation] Updating ${batchIds.length} batches.Notes: "${observationText}"`);

            // 1. Update via Service with Logging
            const updatePromises = batchIds.map(id =>
                roomsService.updateBatch(
                    id,
                    {
                        notes: observationText,
                        has_alert: hasContent,
                        current_room_id: room?.id
                    },
                    user?.id,
                    'Observación Registrada'
                )
            );

            await Promise.all(updatePromises);

            // 2. Update local state
            if (activeMapId && room?.batches) {
                const updatedBatches = room.batches.map(b => {
                    if (selectedBatchIds.has(b.id)) {
                        return { ...b, notes: observationText, has_alert: hasContent };
                    }
                    return b;
                });

                setRoom(prev => prev ? { ...prev, batches: updatedBatches } : null);
            }

            showToast(`Observación registrada en ${selectedBatchIds.size} lotes.`, 'success');

            // Clear selection logic-intentionally kept after success
            setObservationText('');
            setIsBulkActionsOpen(false);
            setSelectedBatchIds(new Set());

        } catch (error) {
            console.error('Error registering observation:', error);
            showToast('Error al registrar observación.', 'error');
        } finally {
            // Key Fix: Always close modal
            setIsObservationModalOpen(false);
            setLoading(false);
        }
    };

    // Batch Management Handlers-REMOVED


    // Calendar Handlers (Interactive)

    const handleCreateBatch = async () => {
        if (!newBatch.geneticId || !newBatch.quantity || !room) {
            showToast("Por favor completa todos los campos.", 'error');
            return;
        }

        setIsCreatingBatch(true);

        const selectedGenetic = genetics.find(m => m.id === newBatch.geneticId);
        // Prefix logic
        const prefix = (selectedGenetic?.name || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');

        let batchName = `${prefix} - ${format(new Date(), 'dd/MM/yy')}`;

        // Determine Stage based on Room Type
        let stage: 'seedling' | 'vegetation' | 'flowering' | 'drying' | 'curing' = 'vegetation';

        const rType = (room?.type || '').toLowerCase();
        if (['germinacion', 'germinación', 'germination', 'semillero'].includes(rType)) {
            stage = 'seedling';
            batchName = `SEM - ${prefix} - ${format(new Date(), 'dd/MM/yy')}`;
        } else if (['clones', 'esquejes', 'esquejera'].includes(rType)) {
            stage = 'vegetation';
        }

        const batchData = {
            name: batchName,
            quantity: parseInt(newBatch.quantity),
            stage: stage,
            current_room_id: room.id,
            genetic_id: newBatch.geneticId,
            start_date: newBatch.date,
            parent_batch_id: undefined
        };

        try {
            // Artificial delay for better UX (1 second)
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

            const [created] = await Promise.all([
                roomsService.createBatch(batchData, user?.id),
                minDelay
            ]);

            if (created) {
                // Silent reload (no full screen spinner)
                if (id) await loadData(id, false, false);

                // Close modal first
                closeCreateBatchModal();
                setNewBatch({
                    geneticId: '',
                    quantity: '',
                    date: new Date().toISOString().split('T')[0]
                });

                // Small delay before showing success toast to avoid modal overlap/ghosting
                setTimeout(() => {
                    showToast("Lote creado correctamente.", 'success');
                }, 300);
            } else {
                showToast("Error al crear el lote.", 'error');
            }
        } catch (error) {
            console.error(error);
            showToast("Error al crear el lote.", 'error');
        } finally {
            // Ensure loading state is off. 
            // If component unmounted, this might warn, but usually fine in this structure.
            setIsCreatingBatch(false);
        }
    };

    const handleAddTask = (day: Date) => {
        // Allow admin or partner (owner) to add tasks
        if (user && (user.role === 'admin' || user.role === 'partner')) {
            setTaskForm({ title: '', type: 'info', due_date: format(day, 'yyyy-MM-dd'), description: '', assigned_to: '' });
            setSelectedTask(null);
            setRecurrenceEnabled(false);
            setRecurrenceConfig({ type: 'daily', interval: 1, unit: 'day', daysOfWeek: [] });
            setIsTaskModalOpen(true);
        }
    };

    const handleDayDetails = (day: Date) => {
        setSelectedDayForSummary(day);
        setIsDaySummaryOpen(true);
    };

    const handleTaskClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setTaskForm({
            title: task.title,
            type: task.type as any,
            due_date: task.due_date || '',
            description: task.description || '',
            assigned_to: task.assigned_to || ''
        });
        if (task.recurrence) {
            setRecurrenceEnabled(true);
            setRecurrenceConfig(task.recurrence);
        } else {
            setRecurrenceEnabled(false);
            setRecurrenceConfig({ type: 'daily', interval: 1, unit: 'day', daysOfWeek: [] });
        }
        setIsTaskModalOpen(true);
    };

    const handleSaveTask = async () => {
        if (!room) return;
        setIsSavingTask(true);
        try {
            const taskData: any = {
                title: taskForm.title,
                type: taskForm.type as any,
                due_date: taskForm.due_date,
                description: taskForm.description,
                room_id: room.id,
                assigned_to: taskForm.assigned_to || null,
                recurrence: recurrenceEnabled ? recurrenceConfig : undefined
            };

            if (selectedTask) {
                // Update
                await tasksService.updateTask(selectedTask.id, taskData);
            } else {
                // Create
                await tasksService.createTask(taskData);
            }

            // Refresh tasks
            if (id) {
                const updatedTasks = await tasksService.getTasksByRoomId(id);
                setTasks(updatedTasks);
            }
            closeTaskModal();
        } catch (error) {
            console.error("Error saving task", error);
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleToggleTaskStatus = async (task: Task) => {
        if (!task) return;
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        const originalStatus = task.status;

        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === task.id ? { ...t, status: newStatus } : t
        ));

        try {
            await tasksService.updateTask(task.id, { status: newStatus } as any);
            // No need to re-fetch if successful, state is already correct
        } catch (error) {
            console.error("Error updating task status:", error);
            // Revert on error
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === task.id ? { ...t, status: originalStatus } : t
            ));
            alert("No se pudo actualizar el estado de la tarea.");
        }
    };

    const handleDeleteTask = () => {
        if (selectedTask) {
            setIsDeleteConfirmOpen(true);
        }
    };

    const confirmDeleteTask = async () => {
        if (selectedTask) {
            await tasksService.deleteTask(selectedTask.id);
            if (id) {
                const updatedTasks = await tasksService.getTasksByRoomId(id);
                setTasks(updatedTasks);
            }
            setIsDeleteConfirmOpen(false);
            setIsTaskModalOpen(false);
        }
    };



    useEffect(() => {
        if (id) {
            loadData(id, true);
        }
    }, [id, loadData]);

    // Memoized selection for Transplant Modal to prevent infinite loops
    // We must declare this at the top level, not conditionally
    const memoizedTransplantBatchIds = useMemo(() => {
        if (transplantForm.batchId) return [transplantForm.batchId];
        return Array.from(selectedBatchIds);
    }, [transplantForm.batchId, selectedBatchIds]);

    // Calendar Rendering Logic

    // Tables calc removed

    if (loading) return <LoadingSpinner fullScreen text={activeMapId ? "Cargando Mapa..." : "Cargando sala..."} duration={1500} />

    return (
        <Container>
            <GlobalPrintStyles />
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BackButton onClick={() => navigate(-1)}><FaArrowLeft /> Volver</BackButton>
                    <Title>{room?.name} <Badge stage={room?.type}>{room?.type === 'vegetation' ? 'Vegetación' : room?.type === 'flowering' ? 'Floración' : (room?.type === 'drying' || room?.type === 'curing') ? 'Secado' : room?.type === 'living_soil' ? 'Agro/Living Soil' : room?.type}</Badge></Title>
                </div>

            </div>

            {/* Room Summary Header */}
            {room && (
                <HeaderGrid className="no-print">
                    {/* Plants Count */}
                    <StatCard>

                        <h3><FaSeedling /> {
                            room.type === 'germination' ? 'Total Semillas' :
                                room.type === 'flowering' ? 'Total Plantas en Floración' :
                                    room.type === 'drying' ? 'Total Plantas Secandose' :
                                        ['clones', 'esquejes', 'esquejera'].includes((room.type || '').toLowerCase()) ? 'Total Esquejes' :
                                            'Total Plantas'
                        }</h3>
                        <div className="value" style={{ color: '#2f855a' }}>
                            {room.batches?.reduce((sum: any, b: any) => sum + b.quantity, 0) || 0}
                        </div>
                        <div className="sub">
                            En {(() => {
                                if (!room.batches) return 0;
                                const uniqueBatches = new Set();
                                room.batches.forEach(b => {
                                    if (b.quantity > 0) {
                                        // Group by Genetic + Date (YYYY-MM-DD) to count logical batches
                                        const date = b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : 'unknown';
                                        const key = `${b.genetic_id || b.name} -${date} `;
                                        uniqueBatches.add(key);
                                    }
                                });
                                return uniqueBatches.size;
                            })()} lotes activos
                        </div>
                    </StatCard>

                    {/* Total Maps Stat */}
                    {/* Total Maps Stat */}
                    {room.type !== 'germination' && room.type !== 'drying' && (
                        <StatCard>
                            <h3><FaMapMarkedAlt /> {
                                room.type === 'flowering' ? 'Total mesas de floracion' :
                                    ['vegetation', 'vegetación', 'vegetacion'].includes((room.type || '').toLowerCase()) ? 'Total Mesas Vegetación' :
                                        room.type === 'living_soil' ? 'Total Camas' :
                                            'Total de Esquejeras'
                            }</h3>
                            <div className="value" style={{ color: '#2b6cb0' }}>
                                {cloneMaps.length}
                            </div>
                            <div className="sub">Mapas activos</div>
                        </StatCard>
                    )}

                    {/* Environment */}
                    <StatCard>
                        <h3><FaThermometerHalf /> Ambiente</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {room.current_temperature || '--'}°
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>Temp</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: '#cbd5e0' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3182ce', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    {room.current_humidity || '--'}%
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>Humedad</div>
                            </div>
                        </div>
                    </StatCard>

                    {/* Date-CHANGED to Start Date */}
                    <StatCard>
                        <h3><FaCalendarAlt /> Fecha Inicio</h3>
                        <div className="value" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
                            {room.start_date
                                ? format(new Date(room.start_date + 'T00:00:00'), "d MMM yyyy", { locale: es })
                                : '--'}
                        </div>
                        <div className="sub">
                            {room.start_date
                                ? `Creado hace ${differenceInDays(new Date(), new Date(room.start_date))} días`
                                : 'Sin fecha'}
                        </div>
                    </StatCard>
                </HeaderGrid>
            )}


            {/* 
            <div style={{ marginBottom: '2rem' }} className="no-print">
                <TuyaManager mode="sensors" roomId={room?.id} />
            </div> 
            */}


            {/* Stickies Wall Section */}
            <div style={{ marginBottom: '2rem' }} className="no-print">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaStickyNote color="#ecc94b" /> Pizarra de Notas
                    </h2>
                </div>

                {stickies.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {stickies.map(s => (
                            <div key={s.id} style={{
                                background: s.color === 'yellow' ? '#fefcbf' : s.color === 'blue' ? '#bee3f8' : s.color === 'pink' ? '#fed7d7' : '#c6f6d5',
                                padding: '1rem', borderRadius: '0.5rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                position: 'relative',
                                display: 'flex', flexDirection: 'column', gap: '0.5rem'
                            }}>
                                <p style={{ fontSize: '1rem', color: '#2d3748', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{s.content}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#718096' }}>{format(new Date(s.created_at), 'd MMM', { locale: es })}</span>
                                    <button
                                        onClick={() => handleDeleteSticky(s.id)}
                                        style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', opacity: 0.6, padding: '2px' }}
                                        title="Eliminar"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {/* Add New Note Placeholder Card */}
                        <div
                            onClick={() => {
                                setStickyContent('');
                                setStickyColor('yellow');
                                setIsStickyModalOpen(true);
                            }}
                            style={{
                                border: '2px dashed #cbd5e0',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#a0aec0',
                                cursor: 'pointer',
                                minHeight: '120px',
                                transition: 'all 0.2s ease',
                                background: '#f7fafc'
                            }}
                        >
                            <FaPlus size={24} style={{ marginBottom: '0.5rem' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click aqui + para agregar nota</span>
                        </div>
                    </div>
                ) : (

                    <EmptyStickyState
                        onClick={() => {
                            setStickyContent('');
                            setStickyColor('yellow');
                            setIsStickyModalOpen(true);
                        }}
                    >
                        <DashedStickyCircle>
                            <FaPlus />
                        </DashedStickyCircle>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'inherit', margin: 0 }}>No hay notas fijadas.</p>
                            <p style={{ color: 'inherit', opacity: 0.8, fontSize: '0.85rem', margin: 0 }}>Toca aquí para agregar una nota</p>
                        </div>
                    </EmptyStickyState>
                )}
            </div>

            {/* Esquejera View or Standard View */}
            {
                ['clones', 'esquejes', 'esquejera', 'vegetacion', 'vegetación', 'vegetation', 'flowering', 'floración', 'flora', 'germination', 'germinacion', 'germinación', 'semillero', 'living_soil'].includes((room?.type as string)?.toLowerCase()) ? (
                    <div style={{ padding: '2rem' }}>
                        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {/* Hide "Nueva Tarea" for Clones/Esquejes/Germination rooms */}
                                {!['clones', 'esquejes', 'esquejera', 'germination'].includes((room?.type as string)?.toLowerCase()) && (
                                    <StyledActionButton
                                        onClick={() => setIsTaskModalOpen(true)}
                                        $variant="secondary"
                                    >
                                        <FaTasks /> Nueva Tarea
                                    </StyledActionButton>
                                )}
                                <StyledActionButton
                                    onClick={handleOpenHistory}
                                    $variant="secondary"
                                >
                                    <FaHistory /> Historial
                                </StyledActionButton>
                                <StyledActionButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (room) {
                                            if (room.type === 'flowering') {
                                                setIsHarvestModalOpen(true);
                                            } else {
                                                setTransplantForm({ batchId: '', quantity: 1 }); // Reset form
                                                handleOpenTransplant(e, room, null); // Open without specific batch
                                            }
                                        }
                                    }}
                                    $variant={room?.type === 'flowering' ? 'gold' : 'primary'}
                                >
                                    {room?.type === 'flowering' ? <FaCut /> : <FaExchangeAlt />}
                                    {room?.type === 'flowering' ? 'Cosechar' : 'Transplantar'}
                                </StyledActionButton>
                                <StyledActionButton
                                    onClick={() => setIsEditModalOpen(true)}
                                    $variant="secondary"
                                >
                                    <FaEdit /> Editar Sala
                                </StyledActionButton>
                            </div>
                        </div>

                        {/* DndContext WRAPPER FOR BOTH VIEWS */}
                        {/* Moved Map Header (Toolbar) Here for Full Width */}
                        {
                            activeMapId && activeMap && (
                                <div className="no-print-map-header" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    background: 'white',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    height: '80px',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}>
                                    {/* LEFT: Map Title & Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, overflow: 'hidden' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2d3748', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {activeMap.name}
                                        </h3>
                                        <span style={{ background: '#c6f6d5', color: '#2f855a', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                            {activeMap.grid_rows} x {activeMap.grid_columns}
                                        </span>
                                    </div>

                                    {/* CENTER: Selection Status (New) */}
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {isSelectionMode && selectedBatchIds.size > 0 && (
                                            <span style={{
                                                fontSize: '0.9rem',
                                                color: '#2f855a', // Dark Green
                                                fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                background: '#c6f6d5', // Light Green
                                                padding: '0.35rem 1rem',
                                                borderRadius: '999px',
                                                border: '1px solid #9ae6b4',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                {selectedBatchIds.size} seleccionados
                                            </span>
                                        )}
                                    </div>

                                    {/* RIGHT: Actions Toolbar */}
                                    <div className="no-print-map-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 1, height: '100%', justifyContent: 'flex-end' }}>

                                        {/* 1. SELECTION ACTIONS */}
                                        {isSelectionMode && selectedBatchIds.size > 0 && (
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.5rem', borderRight: '1px solid #e2e8f0', flexShrink: 0 }}>

                                                {/* BULK ACTIONS DROPDOWN */}
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsBulkActionsOpen(!isBulkActionsOpen); }}
                                                        style={{
                                                            background: '#48bb78', // Green
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '0.375rem',
                                                            padding: '0.5rem 1rem',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 4px rgba(72, 187, 120, 0.3)',
                                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                            transition: 'background 0.2s'
                                                        }}
                                                    >
                                                        Acciones <FaChevronDown size={10} />
                                                    </button>

                                                    {isBulkActionsOpen && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '120%',
                                                            right: 0,
                                                            background: 'white',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '0.5rem',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                            zIndex: 50,
                                                            minWidth: '220px',
                                                            overflow: 'hidden',
                                                            animation: 'fadeIn 0.1s ease-out'
                                                        }}>
                                                            <div style={{ padding: '0.75rem 1rem', background: '#f7fafc', borderBottom: '1px solid #edf2f7' }}>
                                                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a0aec0', letterSpacing: '0.05em' }}>ACCIONES DE LOTE</div>
                                                            </div>

                                                            {/* 1. EDITAR */}
                                                            <button
                                                                onClick={() => {
                                                                    setIsBulkActionsOpen(false);
                                                                    if (selectedBatchIds.size === 1) {
                                                                        const batchId = Array.from(selectedBatchIds)[0];
                                                                        const batch = room?.batches?.find(b => b.id === batchId);
                                                                        if (batch) handleOpenEditBatch(batch);
                                                                    } else {
                                                                        // Bulk Edit
                                                                        setBulkEditForm({ stage: '', notes: '' });
                                                                        setIsBulkEditModalOpen(true);
                                                                    }
                                                                }}
                                                                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2d3748', fontSize: '0.9rem', transition: 'background 0.1s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#f0fff4'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <div style={{ background: '#c6f6d5', padding: '0.4rem', borderRadius: '0.375rem', color: '#2f855a', display: 'flex' }}><FaEdit size={12} /></div>
                                                                <span>Editar</span>
                                                            </button>

                                                            {/* 2. REUBICAR */}
                                                            <button
                                                                onClick={() => {
                                                                    setIsBulkActionsOpen(false);
                                                                    // Reset form for fresh bulk move
                                                                    setTransplantForm({ batchId: '', quantity: 1 });
                                                                    setIsTransplantModalOpen(true);
                                                                }}
                                                                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2d3748', fontSize: '0.9rem', transition: 'background 0.1s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#ebf8ff'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <div style={{ background: '#bee3f8', padding: '0.4rem', borderRadius: '0.375rem', color: '#3182ce', display: 'flex' }}><FaExchangeAlt size={12} /></div>
                                                                <span>Reubicar</span>
                                                            </button>

                                                            {/* 3. OBSERVACION */}
                                                            <button
                                                                onClick={() => {
                                                                    setIsBulkActionsOpen(false);
                                                                    const firstSelectedBatch = room?.batches?.find(b => selectedBatchIds.has(b.id) && b.notes);
                                                                    setObservationText(firstSelectedBatch?.notes || '');
                                                                    setIsObservationModalOpen(true);
                                                                }}
                                                                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2d3748', fontSize: '0.9rem', transition: 'background 0.1s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#fffaf0'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <div style={{ background: '#fefcbf', padding: '0.4rem', borderRadius: '0.375rem', color: '#d69e2e', display: 'flex' }}><FaExclamationTriangle size={12} /></div>
                                                                <span>Observación</span>
                                                            </button>

                                                            <div style={{ borderTop: '1px solid #edf2f7', margin: '0.25rem 0' }}></div>

                                                            {/* 4. ELIMINAR */}
                                                            <button
                                                                onClick={() => { setIsBulkActionsOpen(false); handleBulkDeleteFirstStep(); }}
                                                                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e53e3e', fontSize: '0.9rem', transition: 'background 0.1s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                            >
                                                                <div style={{ background: '#fed7d7', padding: '0.4rem', borderRadius: '0.375rem', color: '#e53e3e', display: 'flex' }}><FaTrash size={12} /></div>
                                                                <span>Eliminar Selección</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Overlay for Dropdown */}
                                        {isBulkActionsOpen && (
                                            <div
                                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                                onClick={() => setIsBulkActionsOpen(false)}
                                            />
                                        )}

                                        {/* 2. PERSISTENT ACTIONS */}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {isSelectionMode && (
                                                <button
                                                    onClick={() => handleToggleSelectionMode()}
                                                    title="Cancelar Selección"
                                                    style={{
                                                        background: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '0.375rem',
                                                        padding: '0.5rem',
                                                        cursor: 'pointer',
                                                        color: '#718096',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <FaTimes />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    document.body.classList.add('printing-map');
                                                    window.print();
                                                    document.body.classList.remove('printing-map');
                                                }}
                                                title="Imprimir Mapa"
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.375rem',
                                                    padding: '0.5rem 0.75rem',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    color: '#4a5568',
                                                    fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                }}
                                            >
                                                <FaPrint />
                                            </button>

                                            <button
                                                onClick={() => setActiveMapId(null)}
                                                style={{
                                                    background: '#edf2f7',
                                                    border: 'none',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '0.5rem',
                                                    color: '#4a5568',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#edf2f7'}
                                            >
                                                <FaArrowLeft /> Volver
                                            </button>
                                        </div>

                                    </div>
                                </div >
                            )
                        }
                        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

                                {/* MAIN CONTENT AREA */}
                                <div style={{ flex: 3 }}>
                                    {!activeMapId ? (
                                        /* MAPS LIST VIEW */
                                        <div>
                                            <h3 className="no-print" style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Mesas Activas (Arrastra lotes aquí para crear nuevas)</h3>

                                            <div style={{
                                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem',
                                                marginBottom: '2rem'
                                            }}>
                                                {cloneMaps.length === 0 ? (
                                                    (room?.type === 'vegetation') ? (
                                                        <div style={{ gridColumn: '1/-1' }}>
                                                            <CreateCard onClick={() => setIsMapModalOpen(true)}>
                                                                <DashedCircle>
                                                                    <FaPlus />
                                                                </DashedCircle>
                                                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>+ Agregar cultivo a Vegetación</p>
                                                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>No hay cultivos en vegetacion actualmente</p>
                                                            </CreateCard>
                                                        </div>
                                                    ) : (
                                                        <div style={{ gridColumn: '1/-1' }}>
                                                            <CreateCard onClick={() => setIsMapModalOpen(true)}>
                                                                <DashedCircle>
                                                                    <FaPlus size={20} color="#cbd5e0" />
                                                                </DashedCircle>
                                                                <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                                                    {
                                                                        room?.type === 'germination' ? 'Germinar Semillas' :
                                                                            room?.type === 'flowering' ? 'Agregar plantas a floración' :
                                                                                ['clones', 'esquejes', 'esquejera'].includes((room?.type || '').toLowerCase()) ? 'Crear Mesa de Esquejes' :
                                                                                    room?.type === 'living_soil' ? 'Nueva Cama/Cultivo' :
                                                                                        'Crear Primera Mesa'
                                                                    }
                                                                </p>
                                                                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                                                    {
                                                                        room?.type === 'germination' ? 'No hay semillas en germinación.' :
                                                                            room?.type === 'flowering' ? 'No hay plantas en floracion actualmente' :
                                                                                room?.type === 'living_soil' ? 'No hay camas/cultivos activos.' :
                                                                                    'No hay mesas de esquejes creadas.'
                                                                    }
                                                                </p>
                                                            </CreateCard>
                                                        </div>
                                                    )
                                                ) : (
                                                    <>
                                                        {cloneMaps.map(map => {
                                                            const mapBatches = room?.batches?.filter(b => b.clone_map_id === map.id && b.quantity > 0) || [];
                                                            const totalPlants = mapBatches.reduce((acc, b) => acc + b.quantity, 0);
                                                            const uniqueGenetics = new Set(mapBatches.map(b => b.genetic_id)).size;

                                                            return (
                                                                <DroppableMapCard key={map.id} map={map} onClick={() => setActiveMapId(map.id)}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>{map.name}</h3>
                                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                                {/* Selection buttons removed from Map List View */}
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                            {!isSelectionMode && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleEditMapClick(e, map); }}
                                                                                        style={{ background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}
                                                                                    >
                                                                                        <FaEdit />
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setMapIdToDelete(map.id); setIsDeleteMapModalOpen(true); }}
                                                                                style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}
                                                                            >
                                                                                <FaTrash />
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                        <div style={{ background: '#ebf8ff', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2b6cb0' }}>{totalPlants}</div>
                                                                            <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Plantas</div>
                                                                        </div>
                                                                        <div style={{ background: '#f0fff4', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                                                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2f855a' }}>{uniqueGenetics}</div>
                                                                            <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Variedades</div>
                                                                        </div>
                                                                    </div>
                                                                </DroppableMapCard>
                                                            );
                                                        })}
                                                        <CreateCard
                                                            onClick={() => setIsMapModalOpen(true)}
                                                            style={{ minHeight: '160px' }}
                                                        >
                                                            <DashedCircle>
                                                                <FaPlus />
                                                            </DashedCircle>
                                                            <span style={{ fontWeight: 600 }}>{room?.type === 'living_soil' ? 'Nueva Cama/Cultivo' : 'Nueva Mesa'}</span>
                                                        </CreateCard>
                                                    </>
                                                )}
                                            </div>

                                            {/* Create Map Drop Zone */}
                                            <CreateMapDropZone>
                                                <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0' }}>
                                                    <FaMapMarkedAlt style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                                                    <p>{room?.type === 'living_soil' ? 'Crea una nueva cama/cultivo para sembrar o transplantar' : 'Arrastra lotes aquí para crear una nueva mesa automáticamente'}</p>
                                                </div>
                                            </CreateMapDropZone>

                                            {/* Modals are kept here within main flow or moved to root? They are safer here for now */}
                                            {/* Create Map Modal */}




                                        </div>
                                    ) : (
                                        /* ACTIVE MAP VIEW */
                                        (() => {
                                            const activeMap = cloneMaps.find(m => m.id === activeMapId);
                                            if (!activeMap) return (
                                                <div style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                    padding: '4rem 2rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #cbd5e0',
                                                    color: '#718096', textAlign: 'center'
                                                }}>
                                                    <h3 style={{ fontSize: '1.25rem', color: '#4a5568', marginBottom: '0.5rem' }}>Mapa No Encontrado</h3>
                                                    <p style={{ marginBottom: '1.5rem' }}>El mapa que intentas ver no existe o ha sido eliminado.</p>
                                                    <button
                                                        onClick={() => setActiveMapId(null)}
                                                        style={{
                                                            background: '#3182ce', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                                            border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                        }}
                                                    >
                                                        <FaArrowLeft /> Volver a la Lista
                                                    </button>
                                                </div>
                                            );
                                            return (
                                                <div className="active-map-container">
                                                    {/* Print-only title since toolbar is hidden on print */}
                                                    <div className="printable-map-details" style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                                        <h2>{activeMap?.name}</h2>
                                                        <p>{activeMap?.grid_rows} x {activeMap?.grid_columns}</p>
                                                    </div>

                                                    <div className="printable-map-grid">
                                                        <LivingSoilGrid
                                                            rows={(() => {
                                                                const activeMap = cloneMaps.find(m => m.id === activeMapId);
                                                                return activeMap?.grid_rows || 20;
                                                            })()}
                                                            cols={(() => {
                                                                const activeMap = cloneMaps.find(m => m.id === activeMapId);
                                                                return activeMap?.grid_columns || 10;
                                                            })()}
                                                            batches={livingSoilBatches}
                                                            mapId={activeMapId || undefined}
                                                            onBatchClick={handleBatchClick}
                                                            selectedBatchIds={selectedBatchIds}
                                                            isSelectionMode={isSelectionMode}
                                                            onToggleSelectionMode={setIsSelectionMode}
                                                            onSelectionChange={(newSet) => setSelectedBatchIds(newSet)}
                                                        />

                                                        {/* SOWING MODAL */}
                                                        {isSowingModalOpen && (
                                                            <PortalModalOverlay>
                                                                <ModalContent>
                                                                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <FaSeedling color="#48bb78" /> Nueva Siembra ({sowingPosition})
                                                                    </h2>

                                                                    <FormGroup>
                                                                        <label>Genética</label>
                                                                        <select
                                                                            value={newSowingBatch.genetic_id}
                                                                            onChange={e => setNewSowingBatch({ ...newSowingBatch, genetic_id: e.target.value })}
                                                                        >
                                                                            <option value="">Seleccionar Genética...</option>
                                                                            {genetics.map(g => (
                                                                                <option key={g.id} value={g.id}>{g.name} ({g.type === 'photoperiodic' ? 'Foto' : 'Auto'})</option>
                                                                            ))}
                                                                        </select>
                                                                    </FormGroup>

                                                                    <FormGroup>
                                                                        <label>Notas</label>
                                                                        <textarea
                                                                            value={newSowingBatch.notes}
                                                                            onChange={e => setNewSowingBatch({ ...newSowingBatch, notes: e.target.value })}
                                                                            placeholder="Observaciones..."
                                                                        />
                                                                    </FormGroup>

                                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                                                        <CancelButton onClick={() => setIsSowingModalOpen(false)}>Cancelar</CancelButton>
                                                                        <ActionButton $variant="success" onClick={handleSowingSubmit} disabled={!newSowingBatch.genetic_id || loading}>
                                                                            {loading ? 'Sembrando...' : 'Sembrar'}
                                                                        </ActionButton>
                                                                    </div>
                                                                </ModalContent>
                                                            </PortalModalOverlay>
                                                        )}
                                                    </div>

                                                    {/* PRINTABLE DETAIL TABLE */}
                                                    <div className="printable-map-details">
                                                        <h4 style={{ margin: '2rem 0 1rem 0', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>Detalle de Lotes</h4>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                            <thead>
                                                                <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ccc' }}>Posición</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ccc' }}>Genética / Nombre</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ccc' }}>Código (ID)</th>
                                                                    <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #ccc' }}>Fecha Ingreso</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(room?.batches?.filter(b => b.clone_map_id === activeMap.id) || [])
                                                                    .sort((a, b) => {
                                                                        // Simple alphanumeric sort for positions like A1, A2, B1
                                                                        return (a.grid_position || '').localeCompare(b.grid_position || '', undefined, { numeric: true, sensitivity: 'base' });
                                                                    })
                                                                    .map(batch => (
                                                                        <tr key={batch.id} style={{ borderBottom: '1px solid #eee' }}>
                                                                            <td style={{ padding: '0.4rem', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'center' }}>{batch.grid_position || '-'}</td>
                                                                            <td style={{ padding: '0.4rem', border: '1px solid #ccc' }}>{batch.genetic?.name || batch.name}</td>
                                                                            <td style={{ padding: '0.4rem', border: '1px solid #ccc', fontFamily: 'monospace' }}>{batch.tracking_code || '-'}</td>
                                                                            <td style={{ padding: '0.4rem', border: '1px solid #ccc' }}>
                                                                                {batch.created_at ? format(new Date(batch.created_at), 'dd/MM/yyyy', { locale: es }) : '-'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )
                                    }
                                </div>

                                {/* SIDEBAR (Shared) */}
                                <div className="no-print" style={{
                                    flex: 1,
                                    minWidth: '250px',
                                    background: '#f7fafc',
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    maxHeight: 'calc(100vh - 160px)',
                                    position: 'sticky',
                                    top: '1rem'
                                }}>
                                    <div style={{ flexShrink: 0 }}>
                                        <h4 style={{ margin: '0 0 1rem 0', color: '#4a5568', fontSize: '1rem' }}>Lotes Disponibles</h4>
                                        <ActionButton onClick={() => setIsCreateBatchModalOpen(true)} $variant="success" style={{ width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <FaPlus /> Nuevo Lote
                                        </ActionButton>
                                    </div>
                                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                                        {(() => {
                                            const available = room?.batches?.filter(b => !b.clone_map_id && b.quantity > 0 && b.current_room_id === room.id) || [];
                                            const grouped = groupBatchesByGeneticDate(available);
                                            if (grouped.length === 0) return <div style={{ fontSize: '0.85rem', color: '#a0aec0', padding: '1rem', textAlign: 'center' }}>No hay lotes en espera.</div>;
                                            return grouped.map(group => (
                                                <SidebarBatchGroup
                                                    key={group.root.id}
                                                    group={group}
                                                    expanded={expandedSidebarGroups.has(group.root.id)}
                                                    onToggleExpand={() => toggleSidebarGroupExpansion(group.root.id)}
                                                    onBatchGroupClick={handleBatchClick}
                                                    renderHeaderActions={(b) => (
                                                        <>
                                                            <BatchActionButton onClick={(e) => { e.stopPropagation(); handleEditBatchClick(e, b); }} title="Editar Lote"><FaPen size={12} /></BatchActionButton>
                                                            <BatchActionButton $variant="delete" onClick={(e) => { e.stopPropagation(); handleDeleteBatchClick(e, b); }} title="Eliminar Lote"><FaTrash size={12} /></BatchActionButton>
                                                        </>
                                                    )}
                                                    childrenRender={(b) => (
                                                        <div key={b.id} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            padding: '0.25rem 0.5rem',
                                                            margin: '0.25rem 0',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '0.5rem',
                                                            transition: 'all 0.2s',
                                                            background: selectedBatchId === b.id ? '#ebf8ff' : 'transparent'
                                                        }}>
                                                            <div style={{ flex: 1 }}>
                                                                <DraggableStockBatch batch={b} onClick={() => handleBatchClick(b)} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '0.5rem' }}>
                                                                <BatchActionButton onClick={(e) => { e.stopPropagation(); handleEditBatchClick(e, b); }} title="Editar Lote"><FaPen size={12} /></BatchActionButton>
                                                                <BatchActionButton $variant="delete" onClick={(e) => { e.stopPropagation(); handleDeleteBatchClick(e, b); }} title="Eliminar Lote"><FaTrash size={12} /></BatchActionButton>
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div >

                            <DragOverlay>
                                {activeItem ? (
                                    activeItem.type === 'batch' ? (
                                        <div style={{ transform: 'none' }}>
                                            <DraggableStockBatch batch={activeItem.batch} />
                                        </div>
                                    ) : activeItem.type === 'batch-group' ? (
                                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #3182ce', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '250px' }}>
                                            <strong>{activeItem.group.root.name}</strong>
                                            <div style={{ fontSize: '0.8rem' }}>Arrastrando grupo...</div>
                                        </div>
                                    ) : activeItem.type === 'genetic' ? (
                                        <div style={{ transform: 'none' }}>
                                            <DraggableGenetic genetic={activeItem.genetic} />
                                        </div>
                                    ) : null
                                ) : null}
                            </DragOverlay>
                        </DndContext >
                    </div >
                ) : ['drying', 'secado', 'curing', 'curado'].includes((room?.type || '').toLowerCase()) ? (
                    /* DRYING ROOM VIEW */
                    <div className="no-print">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {groupBatchesByGeneticDate(room?.batches || []).map(group => {
                                const { root, children } = group;
                                const isExpanded = expandedDryingGroups.has(root.id);
                                const totalQty = root.quantity + children.reduce((acc: number, c: any) => acc + c.quantity, 0);
                                const groupName = root.genetic?.name || root.name; // Logic from SidebarBatchGroup

                                // Specific display name for the group header
                                let displayName = groupName;
                                if (root._virtualGroupName) displayName = root._virtualGroupName;
                                else if (true) { // Default Smart Naming
                                    const geneticName = root.genetic?.name || root.name || 'Desconocida';
                                    const prefix = geneticName.substring(0, 6).toUpperCase();
                                    const dateStr = new Date(root.start_date || root.created_at).toLocaleDateString();
                                    displayName = `Lote ${prefix} ${dateStr} `;
                                    // Override if name is simple
                                    if (root.name && !root.name.includes('Lote')) displayName = `Lote ${root.name} `;
                                }

                                return (
                                    <div key={root.id} style={{
                                        background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden'
                                    }}>
                                        {/* Group Header */}
                                        <div
                                            onClick={() => toggleDryingGroupExpansion(root.id)}
                                            style={{
                                                padding: '1rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: isExpanded ? '#ebf8ff' : 'white',
                                                borderBottom: isExpanded ? '1px solid #bee3f8' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: '#48bb78', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {isExpanded ? '▼' : '▶'}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>{displayName}</h3>
                                                    <span style={{ fontSize: '0.9rem', color: '#718096' }}>{totalQty} plantas en total</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <HoverButton
                                                    onClick={(e) => handleOpenGroupFinalize(e, [root, ...children])}
                                                >
                                                    Finalizar Grupo
                                                </HoverButton>
                                                <Badge stage="drying">Secado</Badge>
                                            </div>
                                        </div>

                                        {/* Expanded Content: Individual Batches - SMOOTH ANIMATION */}
                                        <ExpandableContainer $expanded={isExpanded}>
                                            <ExpandableInner>
                                                <div style={{
                                                    padding: '0.75rem', // Reduced padding
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', // Smaller cards
                                                    gap: '0.75rem', // Reduced gap
                                                    background: '#f7fafc',
                                                    opacity: isExpanded ? 1 : 0,
                                                    transition: 'opacity 0.4s ease-in-out'
                                                }}>
                                                    {[root, ...children].map(b => {
                                                        const daysInDrying = differenceInDays(new Date(), new Date(b.created_at));
                                                        return (
                                                            <div key={b.id} style={{
                                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                                                padding: '0.5rem', // Compact padding
                                                                position: 'relative',
                                                                display: 'flex', flexDirection: 'column', gap: '0.25rem' // Tight layout
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4a5568' }}>{b.tracking_code || 'S/C'}</span>
                                                                    <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>{format(new Date(b.created_at), 'd MMM', { locale: es })}</span>
                                                                </div>

                                                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#2d3748', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.name}>{b.name}</h4>

                                                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#718096' }}>
                                                                    <span><strong>{b.quantity}</strong> u.</span>
                                                                    <span><strong>{daysInDrying}</strong> días</span>
                                                                </div>

                                                                <button style={{
                                                                    width: '100%',
                                                                    marginTop: '0.25rem',
                                                                    background: '#ed8936', color: 'white', border: 'none',
                                                                    padding: '0.25rem', borderRadius: '0.25rem', cursor: 'pointer',
                                                                    fontWeight: 600, fontSize: '0.75rem',
                                                                    transition: 'background 0.2s'
                                                                }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = '#dd6b20'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = '#ed8936'}
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenFinalize(b); }}>
                                                                    Finalizar
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </ExpandableInner>
                                        </ExpandableContainer>
                                    </div>
                                );
                            })}

                            {(!room?.batches || room.batches.length === 0) && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0', border: '2px dashed #cbd5e0', borderRadius: '1rem' }}>
                                    <FaThermometerHalf style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>La sala de secado está vacía.</p>
                                    <p style={{ fontSize: '0.9rem' }}>Realiza una cosecha desde Floración para enviar plantas aquí.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null
            }



            {/* Calendar Section (Hidden for Clones/Germination) */}
            {
                !['clones', 'esquejes', 'esquejera', 'drying', 'secado', 'curing', 'curado', 'germination'].includes((room?.type as string)?.toLowerCase()) && (
                    <div className="no-print" style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        {/* Calendar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <StyledActionButton onClick={() => setCurrentDate(subMonths(currentDate, 1))} $variant="secondary" style={{ padding: '0.5rem 1rem' }}>
                                <FaChevronLeft /> Anterior
                            </StyledActionButton>
                            <h2 style={{ fontSize: '1.5rem', color: '#2d3748', textTransform: 'capitalize', margin: 0 }}>
                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <StyledActionButton onClick={() => setCurrentDate(addMonths(currentDate, 1))} $variant="secondary" style={{ padding: '0.5rem 1rem' }}>
                                Siguiente <FaChevronRight />
                            </StyledActionButton>
                        </div>

                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                <div key={d} style={{ background: '#f7fafc', padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: '#718096', fontSize: '0.85rem' }}>{d}</div>
                            ))}

                            {(() => {
                                const monthStart = startOfMonth(currentDate);
                                const monthEnd = endOfMonth(monthStart);
                                const startDate = startOfWeek(monthStart);
                                const endDate = endOfWeek(monthEnd);
                                const dateFormat = "d";


                                const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                                // Helper to generate virtual tasks based on recurrence
                                const generateVirtualTasks = (currentTasks: Task[], viewingDate: Date): Task[] => {
                                    const virtualTasks: Task[] = [];
                                    const monthEnd = endOfMonth(viewingDate);

                                    currentTasks.forEach(task => {
                                        if (!task.recurrence || !task.due_date) return;

                                        const rec = task.recurrence;
                                        let lastDate = new Date(task.due_date);
                                        // Ensure lastDate is valid
                                        if (isNaN(lastDate.getTime())) return;

                                        // Prevent infinite loops
                                        let safetyCounter = 0;

                                        while (lastDate < monthEnd && safetyCounter < 50) {
                                            let nextDate: Date | null = null;
                                            const interval = typeof rec.interval === 'string' ? parseInt(rec.interval) || 1 : rec.interval || 1;

                                            if (rec.type === 'custom' || rec.type === 'daily' || rec.type === 'weekly') {
                                                if (rec.unit === 'day' || rec.type === 'daily') {
                                                    nextDate = addDays(lastDate, interval);
                                                } else if (rec.unit === 'week' || rec.type === 'weekly') {
                                                    nextDate = addWeeks(lastDate, interval);
                                                } else if (rec.unit === 'month') {
                                                    nextDate = addMonths(lastDate, interval);
                                                }
                                            }

                                            if (nextDate && nextDate <= monthEnd) {
                                                // Create Virtual Task
                                                // Check if a real task already exists on this date for this crop/room to avoid dupes?
                                                // For now, simply trust the projection.
                                                virtualTasks.push({
                                                    ...task,
                                                    id: `virtual - ${task.id} -${nextDate.getTime()} `,
                                                    due_date: format(nextDate, 'yyyy-MM-dd'),
                                                    status: 'pending',
                                                    title: `${task.title} (Proyectada)`,
                                                    // Add a custom flag handled by UI
                                                    type: task.type // Keep type for color
                                                });
                                                lastDate = nextDate;
                                            } else {
                                                break;
                                            }
                                            safetyCounter++;
                                        }
                                    });
                                    return virtualTasks;
                                };

                                const allVirtualTasks = generateVirtualTasks(tasks, currentDate);
                                const allTasksForView = [...tasks, ...allVirtualTasks];

                                return calendarDays.map((dayItem, idx) => {
                                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                                    const dateStr = format(dayItem, 'yyyy-MM-dd');
                                    const dayTasks = allTasksForView.filter(t => t.due_date && t.due_date.split('T')[0] === dateStr);

                                    // Determine Background Gradient based on Task Distribution
                                    let dayBg = 'white';

                                    if (dayTasks.length > 0) {
                                        // Helper to get pastel color by task type
                                        const getTaskColor = (t: Task) => {
                                            switch (t.type) {
                                                case 'danger': return '#fed7d7'; // Red
                                                case 'warning': return '#fefcbf'; // Yellow
                                                case 'fertilizar':
                                                case 'enmienda':
                                                case 'te_compost': return '#c6f6d5'; // Green
                                                case 'riego': return '#bee3f8'; // Blue
                                                case 'poda_apical': return '#fed7d7'; // Light Red
                                                case 'defoliacion': return '#fbd38d'; // Orange
                                                case 'hst':
                                                case 'lst':
                                                case 'entrenamiento': return '#e9d8fd'; // Purple
                                                case 'esquejes': return '#feebc8'; // Orange
                                                default: return '#edf2f7'; // Gray (Info)
                                            }
                                        };

                                        if (dayTasks.length === 1) {
                                            dayBg = getTaskColor(dayTasks[0]);
                                        } else {
                                            // Build linear gradient
                                            const step = 100 / dayTasks.length;
                                            const stops = dayTasks.map((t, i) => {
                                                const color = getTaskColor(t);
                                                return `${color} ${i * step}% ${(i + 1) * step}% `;
                                            }).join(', ');
                                            dayBg = `linear-gradient(135deg, ${stops})`;
                                        }
                                    }

                                    // Phase Calculation Logic
                                    let phaseBar = null;



                                    if (room?.start_date && isCurrentMonth) {
                                        // ... existing logic ...
                                        const [y, m, d] = room.start_date.split('T')[0].split('-').map(Number);
                                        const roomStart = new Date(y, m - 1, d);
                                        const dayTime = new Date(dayItem).setHours(0, 0, 0, 0);
                                        const startTime = roomStart.setHours(0, 0, 0, 0);

                                        if (dayTime >= startTime) {
                                            const weekNum = Math.floor((dayTime - startTime) / (7 * 24 * 60 * 60 * 1000)) + 1;
                                            let isFloweringPhase = false;
                                            const activeBatch = room.batches?.find(b => b.genetic);
                                            const geneticVegWeeks = activeBatch?.genetic?.vegetative_weeks;

                                            if (geneticVegWeeks !== undefined && weekNum > geneticVegWeeks) {
                                                isFloweringPhase = true;
                                            } else if (room.type === 'flowering') {
                                                isFloweringPhase = true;
                                            }

                                            const color = isFloweringPhase ? '#fbd38d' : '#9ae6b4';
                                            const showLabel = dayItem.getDay() === 1 || dayItem.getDate() === 1 || dayTime === startTime;

                                            phaseBar = (
                                                <>
                                                    <div style={{
                                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                                        height: '6px', background: color, opacity: 0.7
                                                    }} title={`Semana ${weekNum} del ciclo ${isFloweringPhase ? '(Floración)' : '(Vegetativo)'} `}></div>
                                                    {showLabel && (
                                                        <div style={{
                                                            position: 'absolute', bottom: '8px', right: '2px',
                                                            fontSize: '0.65rem', fontWeight: 'bold', color: isFloweringPhase ? '#c05621' : '#276749',
                                                            background: 'rgba(255,255,255,0.8)', padding: '0 2px', borderRadius: '2px'
                                                        }}>Sem {weekNum}</div>
                                                    )}
                                                </>
                                            );
                                        }
                                    }

                                    return (
                                        <div
                                            key={dayItem.toString()}
                                            className="calendar-day calendar-day-hover"
                                            style={{
                                                background: dayBg, // Applied dynamic background
                                                minHeight: '100px',
                                                padding: '0.5rem',
                                                position: 'relative',
                                                opacity: isCurrentMonth ? 1 : 0.4,
                                                cursor: user && (user.role === 'admin' || user.role === 'partner') ? 'pointer' : 'default',
                                                transition: 'all 0.2s',
                                                border: isSameDay(dayItem, new Date()) ? '2px solid #3182ce' : '1px solid transparent'
                                            }}
                                            onClick={() => handleDayDetails(dayItem)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: isSameDay(dayItem, new Date()) ? 'bold' : 'normal', color: isSameDay(dayItem, new Date()) ? '#2c5282' : '#2d3748' }}>
                                                    {format(dayItem, dateFormat)}
                                                </span>
                                                {/* Actions: Add Task / Sticky */}
                                                {user && (user.role === 'admin' || user.role === 'partner') && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>

                                                        <span
                                                            style={{ color: '#4a5568', fontSize: '0.8rem', opacity: 0.8, cursor: 'pointer', padding: '2px' }}
                                                            title="Agregar Tarea"
                                                            onClick={(e) => { e.stopPropagation(); handleAddTask(dayItem); }}
                                                        >
                                                            <FaPlus />
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                                {dayTasks.map(t => {
                                                    const isVirtual = t.id.startsWith('virtual-');
                                                    return (
                                                        <div
                                                            key={t.id}
                                                            onClick={(e) => {
                                                                if (isVirtual) {
                                                                    e.stopPropagation();
                                                                    setIsProjectionAlertOpen(true);
                                                                    return;
                                                                }
                                                                handleTaskClick(e, t);
                                                            }}
                                                            style={{
                                                                fontSize: '0.7rem', padding: '2px 4px', borderRadius: '3px',
                                                                background: isVirtual ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.6)',
                                                                color: '#2d3748',
                                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                                borderLeft: `3px solid ${t.status === 'done' ? '#48bb78' : isVirtual ? '#a0aec0' : '#718096'} `,
                                                                cursor: isVirtual ? 'default' : 'pointer',
                                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                                opacity: isVirtual ? 0.7 : 1,
                                                                fontStyle: isVirtual ? 'italic' : 'normal',
                                                                border: isVirtual ? '1px dashed #cbd5e0' : 'none'
                                                            }}
                                                            title={isVirtual ? "Proyección futura (Virtual)" : t.title}
                                                        >
                                                            {t.title.replace(' (Proyectada)', '')}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {phaseBar}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div >
                )
            }




            {/* Task Modal-Interactive */}
            {/* Task Modal-Interactive */}
            {
                (isTaskModalOpen || isClosingTaskModal) && (
                    <PortalModalOverlay isClosing={isClosingTaskModal}>
                        <TaskModalContent isClosing={isClosingTaskModal}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>
                                    {selectedTask ? 'Detalle de Tarea' : 'Nueva Tarea'}
                                </h3>
                                <button
                                    onClick={closeTaskModal}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#a0aec0', padding: '0.5rem' }}
                                >
                                    ✕
                                </button>
                            </div>

                            {user && (user.role === 'admin' || user.role === 'partner') ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
                                        {/* Left Column: Primary Info */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <FormGroup>
                                                <label style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Tipo de Tarea</label>
                                                <CustomSelect
                                                    value={taskForm.type}
                                                    onChange={(value) => {
                                                        const newType = value as any;
                                                        let newTitle = 'Tarea';
                                                        switch (newType) {
                                                            case 'info': newTitle = 'Información'; break;
                                                            case 'riego': newTitle = 'Riego'; break;
                                                            case 'fertilizar': newTitle = 'Fertilizar'; break;
                                                            case 'defoliacion': newTitle = 'Defoliación'; break;
                                                            case 'poda_apical': newTitle = 'Poda Apical'; break;
                                                            case 'hst': newTitle = 'HST'; break;
                                                            case 'lst': newTitle = 'LST'; break;
                                                            case 'entrenamiento': newTitle = 'Entrenamiento'; break;
                                                            case 'esquejes': newTitle = 'Esquejes'; break;
                                                            case 'warning': newTitle = 'Alerta'; break;
                                                            default: newTitle = 'Tarea';
                                                        }
                                                        setTaskForm({ ...taskForm, type: newType, title: newTitle });
                                                    }}
                                                    options={[
                                                        { value: "info", label: "Info" },
                                                        { value: "riego", label: "Riego" },
                                                        { value: "fertilizar", label: "Fertilizar" },
                                                        { value: "defoliacion", label: "Defoliación" },
                                                        { value: "poda_apical", label: "Poda Apical" },
                                                        { value: "hst", label: "HST" },
                                                        { value: "lst", label: "LST" },
                                                        { value: "entrenamiento", label: "Entrenamiento" },
                                                        { value: "esquejes", label: "Esquejes" },
                                                        { value: "warning", label: "Alerta" }
                                                    ]}
                                                    placeholder="Seleccionar Tipo"
                                                />
                                            </FormGroup>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                <FormGroup>
                                                    <label style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Fecha</label>
                                                    <CustomDatePicker
                                                        selected={taskForm.due_date ? new Date(taskForm.due_date) : new Date()}
                                                        onChange={(date) => {
                                                            if (date) {
                                                                setTaskForm({ ...taskForm, due_date: format(date, 'yyyy-MM-dd') });
                                                            }
                                                        }}
                                                    />
                                                </FormGroup>
                                                <FormGroup>
                                                    <label style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Asignar a</label>
                                                    <CustomSelect
                                                        value={taskForm.assigned_to}
                                                        onChange={(value) => setTaskForm({ ...taskForm, assigned_to: value })}
                                                        options={[
                                                            { value: "", label: "-- Sin Asignar --" },
                                                            ...users.map(u => ({ value: u.id, label: u.full_name || u.email || 'Usuario' }))
                                                        ]}
                                                        placeholder="Asignar a..."
                                                    />
                                                </FormGroup>
                                            </div>

                                            {/* Recurrence Section */}
                                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #edf2f7' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, color: '#2d3748', cursor: 'pointer', marginBottom: recurrenceEnabled ? '1rem' : 0, fontSize: '0.95rem', transition: 'margin-bottom 0.3s ease-out' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={recurrenceEnabled}
                                                        onChange={e => setRecurrenceEnabled(e.target.checked)}
                                                        style={{ width: '1.25rem', height: '1.25rem', accentColor: '#48bb78' }}
                                                    />
                                                    Repetir Tarea (Periodicidad)
                                                </label>

                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateRows: recurrenceEnabled ? '1fr' : '0fr',
                                                    transition: 'grid-template-rows 0.3s ease-out'
                                                }}>
                                                    <div style={{ overflow: 'hidden', minHeight: 0 }}>
                                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#718096' }}>Repetir cada:</label>
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        value={recurrenceConfig.interval}
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            setRecurrenceConfig(prev => ({
                                                                                ...prev,
                                                                                interval: val === '' ? '' : Math.max(1, parseInt(val))
                                                                            }));
                                                                        }}
                                                                        style={{ width: '70px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e0', fontSize: '0.9rem' }}
                                                                    />
                                                                    <div style={{ flex: 1 }}>
                                                                        <CustomSelect
                                                                            value={recurrenceConfig.unit}
                                                                            onChange={(value) => setRecurrenceConfig(prev => ({ ...prev, unit: value as any, type: 'custom' }))}
                                                                            options={[
                                                                                { value: "day", label: "Días" },
                                                                                { value: "week", label: "Semanas" },
                                                                                { value: "month", label: "Meses" }
                                                                            ]}
                                                                            placeholder="Unidad"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {recurrenceConfig.unit === 'week' && (
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#718096' }}>Se repite el:</label>
                                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => {
                                                                        const isSelected = recurrenceConfig.daysOfWeek?.includes(idx);
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={() => {
                                                                                    setRecurrenceConfig(prev => {
                                                                                        const days = prev.daysOfWeek || [];
                                                                                        if (days.includes(idx)) return { ...prev, daysOfWeek: days.filter(d => d !== idx) };
                                                                                        return { ...prev, daysOfWeek: [...days, idx] };
                                                                                    });
                                                                                }}
                                                                                style={{
                                                                                    width: '32px', height: '32px', borderRadius: '50%', border: '1px solid',
                                                                                    borderColor: isSelected ? '#3182ce' : '#e2e8f0',
                                                                                    background: isSelected ? '#3182ce' : 'white',
                                                                                    color: isSelected ? 'white' : '#4a5568',
                                                                                    fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem',
                                                                                    boxShadow: isSelected ? '0 2px 4px rgba(49,130,206,0.3)' : 'none',
                                                                                    transition: 'all 0.2s'
                                                                                }}
                                                                            >
                                                                                {day}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Instructions & Files */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <FormGroup style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <label style={{ color: '#4a5568', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Instrucciones</label>
                                                <textarea
                                                    value={taskForm.description}
                                                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                                    placeholder="Escribe aquí los detalles precisos (ej: '5ml/L de CalMag')..."
                                                    style={{
                                                        flex: 1,
                                                        padding: '1rem',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid #e2e8f0',
                                                        fontSize: '0.95rem',
                                                        resize: 'none',
                                                        minHeight: '200px',
                                                        background: '#fafbfc',
                                                        lineHeight: '1.5'
                                                    }}
                                                />
                                            </FormGroup>

                                            <div>
                                                <label style={{ display: 'block', fontWeight: 600, color: '#4a5568', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Gestor de archivos</label>
                                                <button
                                                    onClick={() => alert("Funcionalidad de subida de fotos en desarrollo. Se integrará con Supabase Storage.")}
                                                    style={{
                                                        background: 'white',
                                                        border: '2px dashed #cbd5e0',
                                                        padding: '1.5rem',
                                                        width: '100%',
                                                        borderRadius: '0.5rem',
                                                        cursor: 'pointer',
                                                        color: '#718096',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        transition: 'all 0.2s',
                                                        fontWeight: 500
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#48bb78'; e.currentTarget.style.color = '#38a169'; e.currentTarget.style.background = '#f0fff4'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e0'; e.currentTarget.style.color = '#718096'; e.currentTarget.style.background = 'white'; }}
                                                >
                                                    <FaPlus /> Subir Foto / Archivo
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #edf2f7' }}>
                                        {selectedTask && (
                                            <CancelButton onClick={handleDeleteTask} style={{ color: '#e53e3e', borderColor: '#e53e3e' }}>
                                                Eliminar
                                            </CancelButton>
                                        )}
                                        <button
                                            onClick={closeTaskModal}
                                            style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: 'white', color: '#4a5568', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Cancelar
                                        </button>
                                        <ActionButton
                                            onClick={handleSaveTask}
                                            $variant="success"
                                            disabled={isSavingTask}
                                            style={{
                                                minWidth: '150px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                opacity: isSavingTask ? 0.7 : 1,
                                                cursor: isSavingTask ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {isSavingTask ? (
                                                <>
                                                    <SpinningIcon /> {selectedTask ? 'Guardando...' : 'Creando...'}
                                                </>
                                            ) : (
                                                selectedTask ? 'Guardar Cambios' : 'Crear Tarea'
                                            )}
                                        </ActionButton>
                                    </div>
                                </>
                            ) : (
                                // Read Only View for Employees (Execution Mode)
                                <div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <strong>{selectedTask?.title}</strong> <br />
                                        <Badge taskType={selectedTask?.type}>{selectedTask?.type?.replace(/_/g, ' ')}</Badge>
                                    </div>
                                    <p style={{ color: '#4a5568', marginBottom: '1rem' }}>{selectedTask?.description || 'Sin descripción'}</p>
                                    <p style={{ fontSize: '0.9rem', color: '#718096' }}>Asignado a: {users.find(u => u.id === selectedTask?.assigned_to)?.full_name || 'Nadie'}</p>

                                    {/* Observations Field for Execution */}
                                    <FormGroup>
                                        <label>Observaciones</label>
                                        <textarea
                                            placeholder="Registra observaciones puntuales al completar..."
                                            value={taskForm.description} // Re-using state for simplicity, ideally separate 'observations' state
                                            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                                        />
                                    </FormGroup>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <button
                                            onClick={() => alert("Subir foto de evidencia (En desarrollo)")}
                                            style={{ background: '#edf2f7', border: '1px dashed #cbd5e0', padding: '0.5rem', width: '100%', borderRadius: '0.5rem', cursor: 'pointer', color: '#718096', fontSize: '0.9rem' }}
                                        >
                                            <FaPlus /> Subir Foto Evidencia
                                        </button>
                                    </div>

                                    <ActionButton
                                        onClick={async () => {
                                            if (selectedTask) {
                                                // Save observations first if any are typed (we are using description field state as a proxy for now, but should separate)
                                                // Actually, let's just complete it.
                                                const newStatus = selectedTask.status === 'done' ? 'pending' : 'done';
                                                // Ideally we save the observations to the 'observations' column, not description.
                                                // For now, let's just toggle status.
                                                await tasksService.updateTask(selectedTask.id, {
                                                    observations: taskForm.description, // Saving the typed text as observations
                                                    status: newStatus
                                                } as any);

                                                // Refresh
                                                if (id) {
                                                    const updatedTasks = await tasksService.getTasksByRoomId(id);
                                                    setTasks(updatedTasks);
                                                }
                                                setIsTaskModalOpen(false);
                                            }
                                        }}
                                        $variant={selectedTask?.status === 'done' ? 'primary' : 'success'}
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                    >
                                        {selectedTask?.status === 'done' ? 'Marcar como Pendiente' : 'Completa y Guardar'}
                                    </ActionButton>
                                </div>
                            )}
                        </TaskModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Day Summary Modal */}
            {
                isDaySummaryOpen && selectedDayForSummary && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Resumen del {format(selectedDayForSummary, 'd MMMM yyyy', { locale: es })}</h3>
                                <button onClick={() => setIsDaySummaryOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>Tareas Asignadas</h4>
                                {tasks.filter(t => t.due_date && t.due_date.split('T')[0] === format(selectedDayForSummary, 'yyyy-MM-dd')).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {tasks.filter(t => t.due_date && t.due_date.split('T')[0] === format(selectedDayForSummary, 'yyyy-MM-dd')).map(t => (
                                            <div key={t.id} style={{
                                                border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.75rem',
                                                background: t.status === 'done' ? '#f0fff4' : 'white',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#2d3748' }}>{t.title}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                                                        <Badge taskType={t.type} style={{ marginRight: '0.5rem', fontSize: '0.65rem' }}>{t.type?.replace(/_/g, ' ')}</Badge>
                                                        Asignado a: {users.find(u => u.id === t.assigned_to)?.full_name || 'Nadie'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        title={t.status === 'done' ? "Marcar como pendiente" : "Marcar como completada"}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleTaskStatus(t);
                                                        }}
                                                        style={{
                                                            background: t.status === 'done' ? '#48bb78' : 'white',
                                                            border: `1px solid ${t.status === 'done' ? '#48bb78' : '#cbd5e0'} `,
                                                            color: t.status === 'done' ? 'white' : '#cbd5e0',
                                                            borderRadius: '0.375rem',
                                                            padding: '0.4rem',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s',
                                                            minWidth: '32px'
                                                        }}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsDaySummaryOpen(false);
                                                            handleTaskClick({ stopPropagation: () => { } } as any, t);
                                                        }}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'white',
                                                            background: '#3182ce',
                                                            border: 'none',
                                                            borderRadius: '0.375rem',
                                                            padding: '0.4rem 0.8rem',
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        Ver / Editar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>No hay tareas para este día.</p>
                                )}
                            </div>

                            <div>
                                <h4 style={{ fontSize: '1rem', color: '#4a5568', marginBottom: '0.5rem' }}>Registro Diario</h4>
                                <div style={{
                                    border: '2px dashed #e2e8f0', borderRadius: '0.5rem', padding: '2rem',
                                    textAlign: 'center', color: '#a0aec0'
                                }}>
                                    <FaCalendarAlt style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p>No se cargaron fotos ni reportes diarios.</p>
                                </div>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Sticky Note Modal */}
            {
                isStickyModalOpen && (
                    <PortalModalOverlay isClosing={isStickyModalClosing}>
                        <ModalContent isClosing={isStickyModalClosing} style={{
                            background: 'white',
                            borderTop: `8px solid ${stickyColor === 'yellow' ? '#ecc94b' :
                                stickyColor === 'blue' ? '#4299e1' :
                                    stickyColor === 'pink' ? '#ed64a6' :
                                        '#48bb78' // green
                                }`
                        }}>
                            <h3 style={{ color: '#2d3748', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <FaStickyNote color={
                                    stickyColor === 'yellow' ? '#ecc94b' :
                                        stickyColor === 'blue' ? '#4299e1' :
                                            stickyColor === 'pink' ? '#ed64a6' :
                                                '#48bb78'
                                } /> Nueva Nota
                            </h3>

                            <FormGroup>
                                <label>Mensaje</label>
                                <textarea
                                    autoFocus
                                    value={stickyContent}
                                    onChange={e => setStickyContent(e.target.value)}
                                    placeholder="Escribe tu nota aquí..."
                                    disabled={isSavingSticky}
                                    style={{
                                        width: '100%',
                                        background: isSavingSticky ? '#f7fafc' : '#fff',
                                        border: '1px solid #e2e8f0',
                                        minHeight: '120px',
                                        fontSize: '1rem',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        opacity: isSavingSticky ? 0.7 : 1
                                    }}
                                />
                            </FormGroup>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                                {(['yellow', 'blue', 'pink', 'green'] as const).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => !isSavingSticky && setStickyColor(c)}
                                        disabled={isSavingSticky}
                                        style={{
                                            width: '30px', height: '30px', borderRadius: '50%',
                                            background: c === 'yellow' ? '#fefcbf' : c === 'blue' ? '#bee3f8' : c === 'pink' ? '#fed7d7' : '#c6f6d5',
                                            border: stickyColor === c ? '2px solid #4a5568' : '1px solid rgba(0,0,0,0.1)',
                                            cursor: isSavingSticky ? 'not-allowed' : 'pointer',
                                            opacity: isSavingSticky ? 0.7 : 1
                                        }}
                                    />
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <CancelButton onClick={handleCloseStickyModal} disabled={isSavingSticky}>
                                    Cancelar
                                </CancelButton>
                                <ActionButton
                                    onClick={handleSaveSticky}
                                    $variant="success"
                                    disabled={isSavingSticky || !stickyContent.trim()}
                                    style={{ background: '#d69e2e', color: 'white', opacity: (isSavingSticky || !stickyContent.trim()) ? 0.7 : 1 }}
                                >
                                    {isSavingSticky ? 'Guardando...' : 'Pegar Nota'}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Sticky Delete Confirmation Modal */}
            {
                stickyToDelete && (
                    <PortalModalOverlay isClosing={isStickyDeleteModalClosing}>
                        <ModalContent isClosing={isStickyDeleteModalClosing} style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#e53e3e', fontSize: '3rem', marginBottom: '1rem' }}>
                                <FaExclamationTriangle />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¿Eliminar esta nota?</h3>
                            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                                Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <CancelButton onClick={() => setStickyToDelete(null)} disabled={isDeletingSticky}>
                                    Cancelar
                                </CancelButton>
                                <ActionButton
                                    onClick={confirmDeleteSticky}
                                    $variant="danger"
                                    disabled={isDeletingSticky}
                                    style={{ opacity: isDeletingSticky ? 0.7 : 1 }}
                                >
                                    {isDeletingSticky ? 'Eliminando...' : 'Eliminar'}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Projection Alert Modal */}
            {
                isProjectionAlertOpen && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#3182ce', fontSize: '3rem', marginBottom: '1rem' }}>
                                <FaClock />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>Tarea Proyectada</h3>
                            <p style={{ color: '#718096', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Esta es una proyección futura. Para activarla, primero debes completar la tarea anterior.
                            </p>
                            <ActionButton onClick={() => setIsProjectionAlertOpen(false)} $variant="primary">
                                Entendido
                            </ActionButton>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Delete Confirmation Modal (Tasks) */}
            {
                isDeleteConfirmOpen && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#e53e3e', fontSize: '3rem', marginBottom: '1rem' }}>
                                <FaExclamationTriangle />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¿Eliminar esta tarea?</h3>
                            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                                Esta acción no se puede deshacer. La tarea se eliminará permanentemente.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <CancelButton onClick={() => setIsDeleteConfirmOpen(false)}>
                                    Cancelar
                                </CancelButton>
                                <ActionButton onClick={confirmDeleteTask} $variant="danger">
                                    Sí, Eliminar
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Genetics Modal */}
            {
                isGeneticsModalOpen && room && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaDna style={{ color: '#2b6cb0' }} /> Todas las Genéticas en Sala
                            </h3>

                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {(() => {
                                    const geneticCounts: Record<string, number> = {};
                                    room.batches?.forEach(b => {
                                        const name = b.genetic?.name || b.strain || 'Desconocida';
                                        geneticCounts[name] = (geneticCounts[name] || 0) + b.quantity;
                                    });
                                    const entries = Object.entries(geneticCounts);

                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {entries.map(([name, count]) => (
                                                <div key={name} style={{
                                                    background: '#ebf8ff',
                                                    border: '1px solid #bee3f8',
                                                    borderRadius: '0.5rem',
                                                    padding: '1rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span style={{ fontWeight: 600, color: '#2b6cb0' }}>{name}</span>
                                                    <span style={{
                                                        background: 'white',
                                                        color: '#2b6cb0',
                                                        fontWeight: 800,
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.9rem',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}>
                                                        {count}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <ActionButton onClick={() => setIsGeneticsModalOpen(false)} style={{ maxWidth: '150px' }}>
                                    Cerrar
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* New Map Modal */}
            {
                (isMapModalOpen || isClosingMapModal) && (
                    <PortalModalOverlay isClosing={isClosingMapModal}>
                        <ModalContent style={{ maxWidth: '400px' }} isClosing={isClosingMapModal}>
                            <h3 style={{ marginBottom: '1.5rem' }}>{room?.type === 'living_soil' ? 'Nueva Cama/Cultivo' : 'Nuevo Mapa de Esquejes'}</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>{room?.type === 'living_soil' ? 'Nombre (ej: Cama 1)' : 'Nombre (ej: Bandeja 1)'}</label>
                                <input
                                    autoFocus
                                    value={newMapName}
                                    onChange={e => setNewMapName(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    placeholder="Nombre del mapa..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Filas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="26"
                                        value={newMapRows}
                                        onChange={e => setNewMapRows(e.target.value === '' ? '' : Number(e.target.value))}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Columnas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={newMapCols}
                                        onChange={e => setNewMapCols(e.target.value === '' ? '' : Number(e.target.value))}
                                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <CancelButton onClick={closeMapModal} disabled={isCreatingMap}>Cancelar</CancelButton>
                                <ActionButton
                                    onClick={handleCreateMap}
                                    $variant="success"
                                    disabled={isCreatingMap}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {isCreatingMap && <FaCircleNotch className="spin" />}
                                    {isCreatingMap ? 'Creando...' : 'Crear Mapa'}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Edit Map Modal */}
            {
                (isEditMapModalOpen || isClosingEditMap) && (
                    <PortalModalOverlay isClosing={isClosingEditMap}>
                        <ModalContent onClick={e => e.stopPropagation()} isClosing={isClosingEditMap}>
                            <h3>Editar Mapa</h3>
                            <FormGroup>
                                <label>Nombre</label>
                                <input autoFocus value={editMapName} onChange={e => setEditMapName(e.target.value)} placeholder="Nombre del mapa..." />
                            </FormGroup>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <FormGroup style={{ flex: 1 }}>
                                    <label>Filas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="26"
                                        value={editMapRows}
                                        onChange={e => setEditMapRows(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </FormGroup>
                                <FormGroup style={{ flex: 1 }}>
                                    <label>Columnas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={editMapCols}
                                        onChange={e => setEditMapCols(e.target.value === '' ? '' : Number(e.target.value))}
                                    />
                                </FormGroup>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <CancelButton onClick={closeEditMapModal} disabled={isUpdatingMap}>Cancelar</CancelButton>
                                <ActionButton
                                    $variant="success"
                                    onClick={handleUpdateMap}
                                    disabled={isUpdatingMap}
                                >
                                    {isUpdatingMap && <FaCircleNotch className="spin" />}
                                    {isUpdatingMap ? 'Guardando...' : 'Guardar Cambios'}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {
                (isTransplantModalOpen || isClosingTransplant) && room && (
                    <TransplantModal
                        isOpen={isTransplantModalOpen}
                        onClose={closeTransplantModal}
                        currentRoom={room}
                        rooms={allRooms}
                        cloneMaps={room.clone_maps || []}
                        onConfirm={handleTransplant}
                        initialMapId={activeMapId || undefined}
                        initialSelectedBatchIds={memoizedTransplantBatchIds}
                        isClosing={isClosingTransplant}
                    />
                )
            }

            <ConfirmationModal
                isOpen={isDeleteMapModalOpen || isClosingDeleteMap}
                title="Eliminar Mapa"
                message="¿Estás seguro de que deseas eliminar este mapa? Los lotes asociados perderán su posición (no se eliminarán los lotes, solo el mapa)."
                onConfirm={confirmDeleteMap}
                onCancel={closeDeleteMapModal}
                confirmText={isDeletingMap ? "Eliminando..." : "Eliminar"}
                cancelText="Cancelar"
                isDestructive={true}
                isClosing={isClosingDeleteMap}
                isLoading={isDeletingMap}
            />

            <ConfirmationModal
                isOpen={isClearMapConfirmOpen}
                title="Limpiar Mapa"
                message="¿Estás seguro de que deseas ELIMINAR TODOS los esquejes de este mapa? Esta acción no se puede deshacer."
                onConfirm={handleClearMap}
                onCancel={() => setIsClearMapConfirmOpen(false)}
                confirmText="ELIMINAR TODO"
                cancelText="Cancelar"
                isDestructive={true}
            />


            {
                assignModal.isOpen && assignModal.batch && (
                    <PortalModalOverlay isClosing={isAssignModalClosing}>
                        <ModalContent isClosing={isAssignModalClosing}>
                            <h3>Asignar Lote al Mapa</h3>
                            <p style={{ marginBottom: '1rem', color: '#718096' }}>
                                Lote: <strong>{(assignModal.batch as any)._displayName || assignModal.batch.name}</strong><br />
                                Disponibles: {(assignModal.batch as any)._totalQuantity || assignModal.batch.quantity}
                            </p>

                            <FormGroup>
                                <label>¿Cuántas unidades deseas enviar al mapa?</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={(assignModal.batch as any)._totalQuantity || assignModal.batch.quantity}
                                    autoFocus
                                    value={assignModal.quantity}
                                    onChange={e => setAssignModal({ ...assignModal, quantity: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAutoAssign();
                                    }}
                                />
                                <small style={{ display: 'block', marginTop: '0.5rem', color: '#718096' }}>
                                    Se llenarán automáticamente los primeros espacios vacíos disponibles.
                                </small>
                            </FormGroup>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <CancelButton onClick={handleCloseAssignModal}>Cancelar</CancelButton>
                                <ActionButton
                                    onClick={handleAutoAssign}
                                    $variant="success"
                                    disabled={
                                        Number(assignModal.quantity) < 1 ||
                                        Number(assignModal.quantity) > ((assignModal.batch as any)._totalQuantity || assignModal.batch.quantity) ||
                                        isAutoAssigning
                                    }
                                    style={{
                                        opacity: isAutoAssigning ? 0.7 : 1,
                                        cursor: isAutoAssigning ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                    }}
                                >
                                    {isAutoAssigning ? (
                                        <>
                                            <FaSpinner className="icon-spin" /> Asignando...
                                        </>
                                    ) : (
                                        'Asignar Automáticamente'
                                    )}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }



            {/* Plant Detail Modal (Unified for Map and Stock) */}
            {
                plantDetailModal.isOpen && plantDetailModal.batch && (
                    (room?.type === 'living_soil') ? (
                        <LivingSoilBatchModal
                            isOpen={plantDetailModal.isOpen}
                            onClose={() => setPlantDetailModal({ isOpen: false, batch: null })}
                            batch={plantDetailModal.batch}
                            onUpdateStage={handleUpdateStage}
                            onSaveNotes={handleSaveNotes}
                            onDeleteBatch={(b) => {
                                setDeleteConfirm({ isOpen: true, batch: b });
                                setPlantDetailModal({ isOpen: false, batch: null });
                            }}
                        />
                    ) : (
                        <PortalModalOverlay>
                            <ModalContent style={{ maxWidth: '500px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaSeedling size={24} color="#48bb78" />
                                        <div>
                                            <h3 style={{ margin: 0, color: '#2d3748' }}>{plantDetailModal.batch.tracking_code || 'Lote de Stock'}</h3>
                                            <span style={{ fontSize: '0.9rem', color: '#718096' }}>
                                                {plantDetailModal.batch.clone_map_id
                                                    ? `Ubicación: ${plantDetailModal.batch.grid_position || 'N/A'} `
                                                    : `En Stock(Disponibles: ${(plantDetailModal.batch as any)._totalQuantity || plantDetailModal.batch.quantity})`
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setPlantDetailModal({ ...plantDetailModal, isOpen: false })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0' }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                <div style={{ background: '#f7fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Nombre / Genética</label>
                                            <strong style={{ color: '#2d3748' }}>{plantDetailModal.batch.genetic?.name || plantDetailModal.batch.name || 'Desconocida'}</strong>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Fase</label>
                                            <span style={{
                                                display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                                                background: plantDetailModal.batch.stage === 'vegetation' ? '#c6f6d5' : '#bee3f8',
                                                color: plantDetailModal.batch.stage === 'vegetation' ? '#22543d' : '#2a4365'
                                            }}>
                                                {plantDetailModal.batch.stage === 'vegetation' ? 'Vegetativo' : 'Floración'}
                                            </span>
                                        </div>
                                        {plantDetailModal.batch.notes && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>Notas</label>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>{plantDetailModal.batch.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
                                    Acciones
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {/* Map Batch specific actions */}
                                    {plantDetailModal.batch.clone_map_id ? (
                                        <button
                                            onClick={() => {
                                                setMovingBatch(plantDetailModal.batch);
                                                setPlantDetailModal({ ...plantDetailModal, isOpen: false });
                                            }}
                                            style={{
                                                width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: 'white',
                                                color: '#3182ce', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
                                            }}
                                        >
                                            <FaExpandArrowsAlt /> Reubicar en otro lugar
                                        </button>
                                    ) : (
                                        /* Stock Batch specific actions */
                                        <button
                                            onClick={() => {
                                                if (!plantDetailModal.batch) return;
                                                setAssignModal({ isOpen: true, batch: plantDetailModal.batch, quantity: (plantDetailModal.batch as any)._totalQuantity || plantDetailModal.batch.quantity || 1 });
                                                setPlantDetailModal({ ...plantDetailModal, isOpen: false });
                                            }}
                                            style={{
                                                width: '100%', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: 'white',
                                                color: '#38a169', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
                                            }}
                                        >
                                            <FaArrowLeft /> Asignar al Mapa
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => {
                                                if (plantDetailModal.batch) handleOpenEditBatch(plantDetailModal.batch);
                                            }}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', background: 'white',
                                                color: '#d69e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
                                            }}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDeleteConfirm({ isOpen: true, batch: plantDetailModal.batch });
                                                setPlantDetailModal({ ...plantDetailModal, isOpen: false });
                                            }}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #fed7d7', background: '#fff5f5',
                                                color: '#c53030', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600
                                            }}
                                        >
                                            <FaTrash /> Eliminar
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                    <ActionButton onClick={() => setPlantDetailModal({ ...plantDetailModal, isOpen: false })}>
                                        Cerrar
                                    </ActionButton>
                                </div>
                            </ModalContent>
                        </PortalModalOverlay>
                    )
                )
            }



            {/* Move Confirmation Modal */}
            {
                moveConfirm.isOpen && movingBatch && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '400px', textAlign: 'center' }}>
                            <div style={{ color: '#3182ce', fontSize: '3rem', marginBottom: '1rem' }}>
                                <FaExpandArrowsAlt />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>Confirmar Movimiento</h3>
                            <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                                ¿Mover <strong>{movingBatch.tracking_code || movingBatch.name}</strong> a la posición <strong>{moveConfirm.position}</strong>?
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <CancelButton onClick={() => setMoveConfirm({ isOpen: false, position: null })}>
                                    Cancelar
                                </CancelButton>
                                <ActionButton onClick={handleConfirmMove}>
                                    Confirmar Mover
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }


            {/* Custom Delete Confirmation Modal */}
            {
                <ConfirmationModal
                    isOpen={deleteConfirm.isOpen || isClosingDeleteConfirm}
                    isClosing={isClosingDeleteConfirm}
                    title="¿Eliminar definitivamente?"
                    message={`Estás a punto de eliminar ${deleteConfirm.batch?.tracking_code || deleteConfirm.batch?.name}. Esta acción no se puede deshacer.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={closeDeleteConfirm}
                    confirmText={isDeletingBatch ? "Eliminando..." : "Eliminar"}
                    cancelText="Cancelar"
                    isDestructive={true}
                    isLoading={isDeletingBatch}
                />
            }

            {/* Edit Batch Modal */}
            {
                (isEditBatchModalOpen || isClosingEditBatch) && (
                    <PortalModalOverlay isClosing={isClosingEditBatch}>
                        <ModalContent isClosing={isClosingEditBatch}>
                            <h3>Editar Lote</h3>
                            <FormGroup>
                                <label>Nombre / Identificador</label>
                                <input
                                    value={editBatchForm.name}
                                    onChange={e => setEditBatchForm({ ...editBatchForm, name: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup>
                                <label>Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={editBatchForm.quantity}
                                    onChange={e => setEditBatchForm({ ...editBatchForm, quantity: e.target.value })}
                                />
                            </FormGroup>
                            <FormGroup>
                                <label>Notas</label>
                                <textarea
                                    value={editBatchForm.notes}
                                    onChange={e => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
                                />
                            </FormGroup>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <CancelButton onClick={closeEditBatchModal} disabled={isUpdatingBatch}>Cancelar</CancelButton>
                                <ActionButton
                                    $variant="success"
                                    onClick={handleUpdateBatch}
                                    disabled={isUpdatingBatch}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {isUpdatingBatch && <FaCircleNotch className="spin" />}
                                    {isUpdatingBatch ? 'Guardando...' : 'Guardar Cambios'}
                                </ActionButton>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }

            {/* Bulk Edit Modal */}
            {
                isBulkEditModalOpen && (
                    <PortalModalOverlay>
                        <ModalContent style={{ width: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                                    Editando {selectedBatchIds.size} Lotes
                                </h2>
                                <button onClick={() => setIsBulkEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4a5568' }}>Nueva Etapa (Opcional)</label>
                                <select
                                    value={bulkEditForm.stage}
                                    onChange={e => setBulkEditForm({ ...bulkEditForm, stage: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="">-- No cambiar --</option>
                                    <option value="seedling">Plántula</option>
                                    <option value="vegetation">Vegetativo</option>
                                    <option value="flowering">Floración</option>
                                    <option value="drying">Secado</option>
                                    <option value="completed">Finalizado</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#4a5568' }}>Notas / Bitácora (Se sobreescribirá)</label>
                                <textarea
                                    value={bulkEditForm.notes}
                                    onChange={e => setBulkEditForm({ ...bulkEditForm, notes: e.target.value })}
                                    placeholder="Escribe una nota para aplicar a todos..."
                                    style={{ width: '100%', minHeight: '100px', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setIsBulkEditModalOpen(false)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancelar</button>
                                <button onClick={handleBulkEditSubmit} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                                    Aplicar Cambios
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay >
                )
            }

            {/* History Modal */}
            {
                (isHistoryModalOpen || isClosingHistory) && (
                    <PortalModalOverlay isClosing={isClosingHistory}>
                        <ModalContent style={{ maxWidth: '1000px', width: '90%' }} isClosing={isClosingHistory}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#2d3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaHistory color="#48bb78" /> Historial de Movimientos
                                </h2>
                                <button onClick={closeHistoryModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#a0aec0' }}>
                                    ✕
                                </button>
                            </div>

                            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {historyLoading ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>Cargando historial...</p>
                                ) : roomHistory.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', color: '#718096', background: '#f7fafc', borderRadius: '0.5rem' }}>
                                        No hay movimientos registrados recientemente.
                                    </p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.85rem' }}>Fecha</th>
                                                <th style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.85rem' }}>Usuario</th>
                                                <th style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.85rem' }}>Código</th>
                                                <th style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.85rem' }}>Acción/Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roomHistory.map((move: any) => {
                                                // Date Formatting
                                                const dateObj = move.moved_at ? new Date(move.moved_at) : null;
                                                const dateStr = dateObj ? dateObj.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' }) : '-';
                                                const timeStr = dateObj ? dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '';
                                                const fullDate = dateObj ? `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} - ${timeStr} ` : '-';

                                                // Color Coding Logic
                                                let rowBg = 'transparent';
                                                let noteColor = '#4a5568';
                                                let borderColor = '#edf2f7';

                                                const noteLower = (move.notes || '').toLowerCase();

                                                if (noteLower.includes('observación') || noteLower.includes('alerta')) {
                                                    rowBg = '#fffff0'; // Light Yellow
                                                    noteColor = '#d69e2e'; // Dark Yellow
                                                    borderColor = '#f6e05e';
                                                } else if (noteLower.includes('etapa') || noteLower.includes('transplante') || noteLower.includes('siembra')) {
                                                    rowBg = '#f0fff4'; // Light Green
                                                    noteColor = '#38a169'; // Dark Green
                                                    borderColor = '#68d391';
                                                } else if (noteLower.includes('eliminado') || noteLower.includes('baja') || noteLower.includes('descartad')) {
                                                    rowBg = '#fff5f5'; // Light Red
                                                    noteColor = '#e53e3e'; // Dark Red
                                                    borderColor = '#fc8181';
                                                } else if (noteLower.includes('nota') || noteLower.includes('edición')) {
                                                    rowBg = '#ebf8ff'; // Light Blue
                                                    noteColor = '#3182ce'; // Dark Blue
                                                    borderColor = '#63b3ed';
                                                }

                                                return (
                                                    <tr key={move.id} style={{ borderBottom: `1px solid ${borderColor} `, background: rowBg }}>
                                                        <td style={{ padding: '0.75rem', color: '#2d3748', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                            {fullDate}
                                                        </td>
                                                        <td style={{ padding: '0.75rem', color: '#4a5568', fontSize: '0.9rem' }}>
                                                            {move.user?.full_name || move.user?.email || 'Sistema'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#2d3748', fontSize: '0.9rem' }}>
                                                            {move.batch?.tracking_code || move.batch?.name || 'Desconocido'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem', color: noteColor, fontSize: '0.9rem', fontWeight: 500 }}>
                                                            {move.notes || '-'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </ModalContent>
                    </PortalModalOverlay >
                )
            }

            <ConfirmationModal
                isOpen={isCreateMapConfirmOpen}
                title="¿Crear nueva Mesa?"
                message={`¿Estás seguro de crear una nueva mesa para "${pendingMapBatch?.name}"(${pendingMapBatch?.quantity} unidades) ?\n\nSe distribuirán las plantas automáticamente en una grilla.`}
                onConfirm={handleConfirmCreateMap}
                onCancel={() => {
                    setIsCreateMapConfirmOpen(false);
                    setPendingMapBatch(null);
                }}
                confirmText="Crear Mesa"
                cancelText="Cancelar"
            />

            {/* Harvest Modal */}
            {
                (isHarvestModalOpen || isClosingHarvestModal) && room && (
                    <HarvestModal
                        isOpen={isHarvestModalOpen}
                        isClosing={isClosingHarvestModal}
                        onClose={() => {
                            closeHarvestModal();
                            setTimeout(() => setHarvestTargetMapId(null), 300); // Clear target after animation
                        }}
                        batches={harvestTargetMapId
                            ? (room.batches?.filter(b => b.clone_map_id === harvestTargetMapId) || [])
                            : (room.batches || [])}
                        rooms={allRooms}
                        onConfirm={handleHarvestConfirm}
                        overrideGroupName={harvestTargetMapId ? (room.clone_maps?.find(m => m.id === harvestTargetMapId)?.name) : undefined}
                    />
                )
            }
            {/* Create Map From Group Confirmation Modal */}
            {
                (isCreateMapFromGroupConfirmOpen || isClosingCreateMapFromGroup) && pendingMapGroup && (
                    <PortalModalOverlay isClosing={isClosingCreateMapFromGroup}>
                        <ModalContent onClick={e => e.stopPropagation()} isClosing={isClosingCreateMapFromGroup}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Crear Mapa desde Grupo</h2>
                            {(() => {
                                // PRIORITIZE VIRTUAL GROUP NAME
                                if (pendingMapGroup.root._virtualGroupName) {
                                    return (
                                        <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
                                            Vas a crear un nuevo mapa para el lote <strong>{pendingMapGroup.root._virtualGroupName}</strong> y sus variantes.
                                        </p>
                                    );
                                }

                                const geneticName = pendingMapGroup.root.genetic?.name || pendingMapGroup.root.name || 'Desconocida';
                                const prefix = geneticName.substring(0, 6).toUpperCase();
                                const displayDate = new Date(pendingMapGroup.root.start_date || pendingMapGroup.root.created_at).toLocaleDateString();
                                const displayName = `Lote ${prefix} ${displayDate} `;

                                return (
                                    <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
                                        Vas a crear un nuevo mapa para el lote <strong>{displayName}</strong> y sus variantes.
                                    </p>
                                );
                            })()}

                            <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
                                Total de plantas: <strong>{pendingMapGroup.root.quantity + pendingMapGroup.children.reduce((acc: number, c: any) => acc + c.quantity, 0)}</strong>
                            </p>
                            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#718096' }}>
                                Se creará una mesa automática y se distribuirán todas las plantas individualmente.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={closeCreateMapFromGroupModal}
                                    disabled={isCreatingMapFromGroup}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #cbd5e0',
                                        background: 'white',
                                        color: '#4a5568',
                                        cursor: isCreatingMapFromGroup ? 'not-allowed' : 'pointer',
                                        opacity: isCreatingMapFromGroup ? 0.7 : 1
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmCreateMapFromGroup}
                                    disabled={isCreatingMapFromGroup}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.375rem',
                                        background: '#48bb78',
                                        color: 'white',
                                        border: 'none',
                                        cursor: isCreatingMapFromGroup ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        opacity: isCreatingMapFromGroup ? 0.7 : 1
                                    }}
                                >
                                    {isCreatingMapFromGroup && <FaCircleNotch className="spin" />}
                                    {isCreatingMapFromGroup ? 'Creando...' : 'Crear Mapa'}
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay >
                )
            }

            <ToastModal
                isOpen={toastModal.isOpen}
                message={toastModal.message}
                type={toastModal.type}
                onClose={() => setToastModal({ ...toastModal, isOpen: false })}
            />
            <GroupDetailModal
                isOpen={isGroupDetailModalOpen}
                onClose={() => setIsGroupDetailModalOpen(false)}
                groupName={selectedGroupName || ''}
                batches={room?.batches?.filter(b => (b.name || b.genetic?.name || 'Lote sin nombre') === selectedGroupName) || []}
                onDeleteBatch={handleDeleteBatchFromGroup}
            />
            {
                isMetricsModalOpen && (
                    <PortalModalOverlay>
                        <ModalContent style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d3748' }}>Métricas de Enraizamiento</h2>
                                <button onClick={() => setIsMetricsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}>&times;</button>
                            </div>

                            {loadingMetrics ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <LoadingSpinner />
                                    <p style={{ marginTop: '1rem', color: '#718096' }}>Calculando métricas...</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#4a5568' }}>Genética</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#4a5568' }}>Activos</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#38a169' }}>Transplantados</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#e53e3e' }}>Bajas/Fallas</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#2d3748' }}>Total Proc.</th>
                                                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.85rem', color: '#3182ce' }}>% Éxito</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {metricsData.map((stat, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{stat.name}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stat.active}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#38a169', fontWeight: 500 }}>{stat.success}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#e53e3e', fontWeight: 500 }}>{stat.failed}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{stat.total}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                            <div style={{
                                                                width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden'
                                                            }}>
                                                                <div style={{
                                                                    width: `${stat.successRate}% `,
                                                                    height: '100%',
                                                                    background: parseFloat(stat.successRate) > 80 ? '#48bb78' : parseFloat(stat.successRate) > 50 ? '#ecc94b' : '#f56565'
                                                                }} />
                                                            </div>
                                                            <span style={{ fontWeight: 'bold', minWidth: '40px' }}>{stat.successRate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {metricsData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                                                        No hay suficientes datos para mostrar métricas.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#ebf8ff', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#2c5282' }}>
                                        <strong>Nota:</strong> El % de Éxito se calcula sobre los esquejes que han finalizado su ciclo en esta sala (Transplantados vs Bajas). Los esquejes activos no afectan el porcentaje.
                                    </div>
                                </div>
                            )}
                        </ModalContent>
                    </PortalModalOverlay >
                )
            }
            {/* EDIT ROOM MODAL */}
            {/* EDIT ROOM MODAL */}
            {
                (isEditModalOpen || isClosingEditRoom) && (
                    <PortalModalOverlay isClosing={isClosingEditRoom}>
                        <ModalContent isClosing={isClosingEditRoom}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#2d3748' }}>Editar Sala</h2>
                                <button
                                    onClick={closeEditRoomModal}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#a0aec0' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre</label>
                                <input
                                    type="text"
                                    value={editRoomName}
                                    onChange={e => setEditRoomName(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Etapa de cultivo</label>
                                <CustomSelect
                                    value={editRoomType}
                                    onChange={(val) => setEditRoomType(val)}
                                    options={[
                                        { value: 'vegetation', label: 'Vegetación' },
                                        { value: 'flowering', label: 'Floración' },
                                        { value: 'drying', label: 'Secado' },
                                        { value: 'living_soil', label: 'Agro/Living Soil' }
                                    ]}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fecha de Inicio</label>
                                <CustomDatePicker
                                    selected={editRoomStartDate ? new Date(editRoomStartDate) : new Date()}
                                    onChange={(date) => {
                                        if (date) {
                                            setEditRoomStartDate(format(date, 'yyyy-MM-dd'));
                                        }
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={closeEditRoomModal}
                                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateRoom}
                                    disabled={isUpdatingRoom}
                                    style={{
                                        background: isUpdatingRoom ? '#a0aec0' : '#48bb78',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        cursor: isUpdatingRoom ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isUpdatingRoom ? (
                                        <>
                                            <SpinningIcon /> Guardando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay >
                )
            }

            {/* FINALIZE MODAL */}
            {
                (finalizeBatch || finalizeBatches || isClosingFinalize) && (
                    <PortalModalOverlay isClosing={isClosingFinalize}>
                        <ModalContent isClosing={isClosingFinalize} style={{ maxWidth: '400px' }}>
                            <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>
                                {finalizeBatches ? 'Finalizar Grupo Completo' : 'Finalizar Secado'}
                            </h2>
                            <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
                                {finalizeBatches ? (
                                    <>
                                        Estás enviando <strong>{finalizeBatches.length} lotes</strong> ({finalizeBatches.reduce((acc, b) => acc + b.quantity, 0)} plantas) a Stock.
                                        <br /><span style={{ fontSize: '0.85rem', color: '#718096' }}>El peso total se distribuirá proporcionalmente.</span>
                                    </>
                                ) : (
                                    <>Estás enviando <strong>{finalizeBatch?.name}</strong> ({finalizeBatch?.quantity} plantas) a Stock.</>
                                )}
                            </p>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {finalizeBatches ? 'Peso Seco TOTAL del Grupo (g)' : 'Peso Seco Final (g)'}
                                </label>
                                <input
                                    type="number"
                                    autoFocus
                                    value={finalWeight}
                                    onChange={e => setFinalWeight(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    placeholder="0.00"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notas</label>
                                <textarea
                                    value={finalNotes}
                                    onChange={e => setFinalNotes(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    rows={3}
                                    placeholder="Calidad, observaciones..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={() => {
                                        setIsClosingFinalize(true);
                                        setTimeout(() => {
                                            setFinalizeBatch(null);
                                            setFinalizeBatches(null);
                                            setIsClosingFinalize(false);
                                        }, 200);
                                    }}
                                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={async () => {
                                        await handleConfirmFinalize();
                                    }}
                                    disabled={isFinalizing}
                                    style={{
                                        background: isFinalizing ? '#9ae6b4' : '#38a169',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        cursor: isFinalizing ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isFinalizing && <FaCircleNotch className="spin" />}
                                    {isFinalizing ? 'Enviando...' : 'Confirmar y Enviar'}
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }
            < ConfirmationModal
                isOpen={isDistributionConfirmOpen}
                isClosing={isClosingDistribution}
                isLoading={loading}
                title="Distribuir Lote Automáticamente"
                message={distributionData ? `¿Deseas distribuir ${distributionData.batches.length} lotes (${distributionData.batches.reduce((a, b) => a + b.quantity, 0)} plantas) en el mapa comenzando desde la celda ${distributionData.position}?` : ''}
                onConfirm={handleConfirmDistribution}
                onCancel={() => {
                    setIsClosingDistribution(true);
                    setTimeout(() => {
                        setIsDistributionConfirmOpen(false);
                        setIsClosingDistribution(false);
                        setDistributionData(null);
                    }, 200);
                }}
                confirmText="Distribuir"
                cancelText="Cancelar"
                variant="success"
            />

            {/* Single Distribution Confirmation Modal */}
            <ConfirmationModal
                isOpen={isSingleDistributeConfirmOpen}
                isClosing={isClosingSingleDistribution}
                isLoading={loading}
                title="Distribuir Plantas"
                message={singleDistributionData ? `¿Distribuir ${singleDistributionData.quantity} plantas individualmente en el mapa a partir de ${singleDistributionData.position}?` : ''}
                onConfirm={async () => {
                    if (!singleDistributionData) return;
                    setLoading(true);
                    // Close happens after success/fail in logic, but we can trigger loading here

                    const { batchId, position, mapId } = singleDistributionData;
                    // ... existing logic ...
                    // Calculate start row/col from position (e.g. "A1")
                    const rowLetter = position.charAt(0);
                    const colStr = position.slice(1);
                    const startRow = rowLetter.charCodeAt(0) - 64; // A=1
                    const startCol = parseInt(colStr, 10);

                    const map = cloneMaps.find(m => m.id === mapId);

                    if (map) {
                        try {
                            const success = await roomsService.distributeBatchToMap(
                                batchId,
                                mapId,
                                startRow,
                                startCol,
                                map.grid_rows,
                                map.grid_columns,
                                user?.id
                            );
                            if (success) {
                                if (id) await loadData(id);
                                showToast("Plantas distribuidas correctamente", 'success');
                                setIsClosingSingleDistribution(true);
                                setTimeout(() => {
                                    setIsSingleDistributeConfirmOpen(false);
                                    setIsClosingSingleDistribution(false);
                                    setSingleDistributionData(null);
                                }, 200);
                            } else {
                                showToast("No se pudo distribuir el lote completo. Verifica el espacio.", 'error');
                                setLoading(false); // Stop loading if failed
                            }
                        } catch (e) {
                            console.error(e);
                            showToast("Error al distribuir el lote.", 'error');
                            setLoading(false);
                        }
                    } else {
                        setLoading(false);
                    }
                }}
                onCancel={() => {
                    setIsClosingSingleDistribution(true);
                    setTimeout(() => {
                        setIsSingleDistributeConfirmOpen(false);
                        setIsClosingSingleDistribution(false);
                        setSingleDistributionData(null);
                    }, 200);
                }}
                confirmText="Distribuir"
                cancelText="Cancelar"
                variant="success"
            />

            {/* OBSEVATION MODAL */}
            {/* OBSEVATION MODAL */}
            {
                (isObservationModalOpen || isClosingObservation) && (
                    <PortalModalOverlay isClosing={isClosingObservation}>
                        <ModalContent isClosing={isClosingObservation} style={{ maxWidth: '400px' }}>
                            <h3 style={{ marginTop: 0, color: '#2d3748', marginBottom: '0.5rem' }}>Registrar Observación</h3>
                            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Esto agregará una nota y una alerta a los {selectedBatchIds.size} lotes seleccionados.
                            </p>
                            <textarea
                                value={observationText}
                                onChange={(e) => setObservationText(e.target.value)}
                                placeholder="Escribe tu observación aquí..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '0.5rem',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                autoFocus
                            />
                            <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginBottom: '1rem', fontStyle: 'italic' }}>
                                (Elimina esta nota por completo para desactivar la alerta de observación)
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    onClick={handleCloseObservation}
                                    style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.375rem', cursor: 'pointer', color: '#4a5568', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRegisterObservation}
                                    style={{ padding: '0.5rem 1rem', background: '#48bb78', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', color: 'white', fontWeight: 600, transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(72, 187, 120, 0.3)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#38a169'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#48bb78'}
                                >
                                    Guardar Observación
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }
            <ToastModal
                isOpen={toastState.isOpen}
                message={toastState.message}
                type={toastState.type}
                onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
            />
            {/* Bulk Delete Config Modal */}
            {
                (isBulkDeleteConfirmOpen || isClosingBulkDelete) && (
                    <ConfirmationModal
                        isOpen={isBulkDeleteConfirmOpen}
                        onCancel={handleCloseBulkDelete}
                        onConfirm={handleBulkDeleteConfirm}
                        title="Confirmar Eliminación Masiva"
                        message={`¿Estás seguro de que deseas eliminar ${selectedBatchIds.size} lotes seleccionados ? Esta acción no se puede deshacer.`}
                        confirmText="Eliminar Lotes"
                        cancelText="Cancelar"
                        isDestructive={true}
                        isLoading={isDeletingBulk}
                        isClosing={isClosingBulkDelete}
                    />
                )
            } {/* CREATE BATCH MODAL */}
            {
                (isCreateBatchModalOpen || isClosingCreateBatch) && (
                    <PortalModalOverlay isClosing={isClosingCreateBatch}>
                        <ModalContent isClosing={isClosingCreateBatch}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2d3748' }}>
                                    {['germinacion', 'germinación', 'germination', 'semillero'].includes((room?.type || '').toLowerCase()) ? 'Nuevo Lote de Semillas' : 'Nuevo Lote'}
                                </h3>
                                <button
                                    onClick={closeCreateBatchModal}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#a0aec0' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Genética</label>
                                <CustomSelect
                                    value={newBatch.geneticId}
                                    onChange={(value) => setNewBatch({ ...newBatch, geneticId: value })}
                                    options={[
                                        { value: "", label: "Seleccionar Genética" },
                                        ...genetics.map(m => ({ value: m.id, label: m.name }))
                                    ]}
                                    placeholder="Seleccionar Genética"
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cantidad</label>
                                <input
                                    type="number"
                                    value={newBatch.quantity}
                                    onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                                    placeholder="0"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fecha de Inicio</label>
                                <CustomDatePicker
                                    selected={newBatch.date ? new Date(newBatch.date) : new Date()}
                                    onChange={(date) => {
                                        if (date) {
                                            setNewBatch({ ...newBatch, date: format(date, 'yyyy-MM-dd') });
                                        }
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    onClick={closeCreateBatchModal}
                                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateBatch}
                                    disabled={isCreatingBatch}
                                    style={{
                                        background: isCreatingBatch ? '#9ae6b4' : '#48bb78',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        cursor: isCreatingBatch ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {isCreatingBatch && <FaCircleNotch className="spin" />}
                                    {isCreatingBatch ? 'Creando...' : 'Crear'}
                                </button>
                            </div>
                        </ModalContent>
                    </PortalModalOverlay>
                )
            }
            {/* Stage Selection Modal */}
            <StageSelectionModal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                onConfirm={handleBulkStageChange}
                currentStage={undefined}
                count={selectedBatchIds.size}
            />
            {/* PRINTABLE REPORT SECTION (VISIBLE ONLY ON PRINT) */}
            <div className="printable-report">
                <style>
                    {`
@media print {
                        .printable-report table { page -break-inside: auto; }
                        .printable-report tr { page -break-inside: avoid; page -break-after: auto; }
                        .printable-report thead { display: table-header-group; }
                        .printable-report tfoot { display: table-footer-group; }
}
`}
                </style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #000', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>Reporte: {room?.name}</h2>
                    <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>
                </div>



                {/* DATA GRID */}
                <div>
                    <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #000', paddingBottom: '0.25rem', marginTop: 0 }}>Detalle de Lotes Activos</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                        <thead>
                            <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
                                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ccc' }}>Pos</th>
                                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ccc' }}>Genética / Lote</th>
                                <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>Cant.</th>
                                <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>Fase</th>
                                <th style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>Estado</th>
                                <th style={{ padding: '4px', textAlign: 'left', border: '1px solid #ccc' }}>Notas / Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(room?.batches || [])
                                .filter(b => b.quantity > 0 && (!activeMapId || b.clone_map_id === activeMapId))
                                .sort((a, b) => {
                                    const posA = a.grid_position || "";
                                    const posB = b.grid_position || "";
                                    return posA.localeCompare(posB, undefined, { numeric: true, sensitivity: 'base' });
                                })
                                .map((b, idx) => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}>{b.grid_position}</td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc' }}>
                                            <div style={{ fontWeight: '600' }}>{b.genetic?.name || b.name}</div>
                                            {b.tracking_code && <div style={{ fontSize: '0.85em', color: '#666' }}>{b.tracking_code}</div>}
                                        </td>
                                        <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>
                                            {b.quantity}
                                        </td>
                                        <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>
                                            {b.stage === 'vegetation' ? 'VEG' : 'FLOR'}
                                        </td>
                                        <td style={{ padding: '4px', textAlign: 'center', border: '1px solid #ccc' }}>
                                            {b.has_alert ? '⚠️' : 'OK'}
                                        </td>
                                        <td style={{ padding: '4px', border: '1px solid #ccc', maxWidth: '300px', wordWrap: 'break-word' }}>
                                            {b.notes || ''}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div >

        </Container >
    );
};


const BatchActionButton = styled.button<{ $variant?: 'delete' }>`
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: ${props => props.$variant === 'delete' ? '#e53e3e' : '#3182ce'};
    cursor: pointer;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);

    &:hover {
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        background: ${props => props.$variant === 'delete' ? '#fff5f5' : '#ebf8ff'};
        border-color: ${props => props.$variant === 'delete' ? '#fc8181' : '#63b3ed'};
        z-index: 2;
    }

    &:active {
        transform: translateY(0) scale(1);
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
`;

const ExpandableContainer = styled.div<{ $expanded: boolean }>`
    display: grid;
    grid-template-rows: ${props => props.$expanded ? '1fr' : '0fr'};
    transition: grid-template-rows 0.3s ease-out;
`;

const ExpandableInner = styled.div`
    overflow: hidden;
`;

export default RoomDetail;
