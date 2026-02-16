import React, { useState, useEffect } from 'react';
import { DeleteProtectionModal } from '../components/DeleteProtectionModal';
import { QRCodeModal } from '../components/QRCodeModal';
import { Tooltip } from '../components/Tooltip';

import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  format,
  // eachMonthOfInterval removed
  // startOfYear removed
  // endOfYear removed
  differenceInWeeks,
  addWeeks,
  differenceInDays
} from 'date-fns';
import es from 'date-fns/locale/es';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaSeedling,
  FaTint,
  FaTemperatureHigh,
  // FaChevronLeft removed
  // FaChevronRight removed
  FaLeaf,
  // FaChartLine removed
  FaPlus,
  FaEdit,
  FaTrash,
  FaWarehouse,
  FaClock,
  FaTimes, // Re-added for Modal
  FaCheckCircle,
  FaRegCircle,
  FaExchangeAlt,
  FaBarcode,
  FaFileUpload,
  FaExclamationTriangle,
} from 'react-icons/fa';

import { Task, CreateTaskInput, RecurrenceConfig, Crop } from '../types';
import { tasksService } from '../services/tasksService';
import { dailyLogsService } from '../services/dailyLogsService';
import { cropsService } from '../services/cropsService';

import { roomsService } from '../services/roomsService';

import { CustomDatePicker } from '../components/CustomDatePicker';
import { CustomSelect } from '../components/CustomSelect';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';


import { LoadingSpinner } from '../components/LoadingSpinner';
import { PromptModal } from '../components/PromptModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { ToastModal } from '../components/ToastModal';





const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const FadeInWrapper = styled.div`
  animation: ${fadeIn} 0.5s ease-in-out;
  width: 100%;
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
  break-inside: avoid;
  margin-bottom: 1.5rem;

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

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  padding-top: 5rem;
  background-color: #f8fafc;
  animation: ${fadeIn} 0.5s ease-in-out;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 5rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
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
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;

  &:hover {
    background: #f7fafc;
    color: #2d3748;
    border-color: #cbd5e0;
  }
`;

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const CropTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg { color: #38a169; }
`;

// Removing duplicate styled components if they exist here.
// The previous multi_replace might have inserted them before `const Container`.
// I need to be careful not to double delete or leave duplicates.
// I will check the file content in `view_file` output.
// It seems `fadeIn` etc were already defined around line 82?
// Error says: "Cannot redeclare block-scoped variable 'fadeIn' ... at line 82 ... and line 206".
// So I inserted them at line 150 (which pushed down to ~200) but they were already at 82.
// I should remove the NEW definitions I added around line 203.

// Wait, I can't easily validly remove a chunk without knowing EXACT content.
// I will read the file to confirm locations of duplicates.



const MetaGrid = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
  color: #4a5568;
  font-size: 0.95rem;

  div {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
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

const ModalOverlay = styled.div<{ isClosing?: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: ${p => p.isClosing ? fadeOut : fadeIn} 0.2s ease-in-out forwards;
`;

const Modal = styled.div<{ isClosing?: boolean }>`
  background: white;
  padding: 2rem;
  border-radius: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: ${p => p.isClosing ? scaleOut : scaleIn} 0.2s ease-in-out forwards;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 { margin: 0; color: #2d3748; font-size: 1.25rem; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  &:hover { color: #e53e3e; }
`;

const TabGroup = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  background: #f7fafc;
  padding: 0.25rem;
  border-radius: 0.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  background: ${p => p.active ? 'white' : 'transparent'};
  color: ${p => p.active ? '#2f855a' : '#718096'};
  font-weight: ${p => p.active ? '600' : '400'};
  box-shadow: ${p => p.active ? '0 1px 3px 0 rgba(0,0,0,0.1)' : 'none'};
  transition: all 0.2s;
  cursor: pointer;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    &:focus { outline: none; border-color: #38b2ac; box-shadow: 0 0 0 3px rgba(56, 178, 172, 0.1); }
  }
  textarea { min-height: 100px; resize: vertical; }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  align-items: start;
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2f855a 0%, #38b2ac 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.1s;
  &:active { transform: translateY(0); }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    if (props.$variant === 'danger') return '#e53e3e';
    if (props.$variant === 'primary') return '#38a169'; // Green matching app theme
    return 'white';
  }};
  color: ${props => (props.$variant === 'primary' || props.$variant === 'danger') ? 'white' : '#4a5568'};
  border: 1px solid ${props => {
    if (props.$variant === 'danger') return '#c53030';
    if (props.$variant === 'primary') return '#2f855a';
    return '#cbd5e0';
  }};
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    filter: brightness(0.95);
  }
`;



const ConfirmModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: slideIn 0.2s ease-out;

  h3 {
    margin-top: 0;
    color: #2d3748;
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #718096;
    margin-bottom: 2rem;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.95rem;
  }

  .cancel {
    background: #edf2f7;
    color: #4a5568;
    &:hover { background: #e2e8f0; }
  }

  .confirm {
    background: #805ad5; 
    color: white;
    box-shadow: 0 4px 6px -1px rgba(128, 90, 213, 0.4);
    &:hover { background: #6b46c1; transform: translateY(-1px); }
  }

  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;


const VisualStageBadge = styled.div<{ $type: string }>`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px; // Pill shape
  font-weight: 800;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  background: ${p => p.$type === 'vegetation' ? '#c6f6d5' : p.$type === 'flowering' ? '#fbd38d' : (p.$type === 'drying' || p.$type === 'curing') ? '#fffaf0' : p.$type === 'mother' ? '#e9d8fd' : p.$type === 'clones' ? '#b2f5ea' : p.$type === 'germination' ? '#feebc8' : p.$type === 'living_soil' ? '#d4edda' : '#e2e8f0'};
  color: ${p => p.$type === 'vegetation' ? '#22543d' : p.$type === 'flowering' ? '#975a16' : (p.$type === 'drying' || p.$type === 'curing') ? '#c05621' : p.$type === 'mother' ? '#553c9a' : p.$type === 'clones' ? '#234e52' : p.$type === 'germination' ? '#7b341e' : p.$type === 'living_soil' ? '#155724' : '#4a5568'};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 5;

  svg { width: 1.2em; height: 1.2em; }
`;

const FileUploadBox = styled.div`
    border: 2px dashed #cbd5e0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #f7fafc;
    &:hover { border-color: #38a169; background: #f0fff4; }
    input { display: none; }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); }
`;

const RoomCard = styled.div<{ $type?: string; $alertLevel?: number }>`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  // Level 2 Alert: Red Border
  ${p => p.$alertLevel && p.$alertLevel >= 2 && css`
      border: 2px solid #e53e3e;
  `}

  // Level 3 Alert: Heartbeat
  ${p => p.$alertLevel && p.$alertLevel >= 3 && css`
      animation: ${heartbeat} 2s infinite;
  `}
`;

const getColorHex = (colorName?: string) => {
  switch (colorName) {
    case 'green': return '#38a169';
    case 'blue': return '#3182ce';
    case 'purple': return '#805ad5';
    case 'orange': return '#dd6b20';
    case 'red': return '#e53e3e';
    case 'pink': return '#d53f8c';
    case 'teal': return '#319795';
    case 'cyan': return '#0bc5ea';
    case 'yellow': return '#d69e2e';
    case 'gray': return '#718096';
    default: return '#38a169';
  }
};

// --- DnD Helper Components ---
// Ensure RoomCard is defined before this.
// ... (DroppableRoomCard and DraggableBatchRow are already here in the file, just need to be after RoomCard)
// Actually, I am not replacing them here, they are further down (line 373+).
// Just ensuring Imports (Chunk 1) and RoomCard (Chunk 2) are added.
// --- DnD Helper Components ---
// Ensure RoomCard is defined before this.
// ... (DroppableRoomCard and DraggableBatchRow are already here in the file, just need to be after RoomCard)

const DraggableBatchRow = ({ batch, isSelected, onToggleSelect, children }: { batch: any, isSelected: boolean, onToggleSelect: (id: string) => void, children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: batch.id,
    data: { type: 'batch', batch }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => { }} // Controlled component without onChange logic here
          onClick={(e) => e.stopPropagation()} // Stop click propagation to parent RoomCard
          onPointerDown={(e) => {
            e.stopPropagation(); // Stop drag start
            onToggleSelect(batch.id);
          }}
          style={{ cursor: 'pointer', marginRight: '8px' }}
        />
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};


// Simplified Room Card Component (No generic UseDroppable, relies on parent Sortable or is passed props)
const RoomCardContainer = ({ room, children, isOver, $alertLevel }: { room: any, children: React.ReactNode, isOver?: boolean, $alertLevel?: number }) => {
  return (
    <div style={{ borderRadius: '1rem', overflow: 'hidden', breakInside: 'avoid', marginBottom: '1.5rem' }}>
      <RoomCard
        $type={room.type}
        $alertLevel={$alertLevel}
        style={{
          borderColor: isOver ? '#3182ce' : undefined,
          backgroundColor: isOver ? '#ebf8ff' : undefined,
          transition: 'background-color 0.2s, border-color 0.2s'
        }}
        onClick={(e) => {
          // Navigate to room (handled in children or separate logic?)
          // navigate(`/rooms/${room.id}`);
          // Prevent default?
        }}
      >
        {children}
      </RoomCard>
    </div>
  );
};

const SortableRoomItem = ({ room, children }: { room: any, children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver // Sortable also acts as droppable
  } = useSortable({ id: room.id, data: { type: 'room', room } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative' as 'relative',
    touchAction: 'none' // Essential for touch dragging
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag Handle Component - Positioned Absolute Top Right or similar */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          top: '0.5rem',
          left: '1rem',
          marginTop: '0.25rem',
          zIndex: 20,
          cursor: 'grab',
          padding: '0.5rem',
          background: 'white',
          borderRadius: '50%',
          color: '#4a5568',
          transition: 'all 0.2s',
        }}
        className="drag-handle"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.borderColor = '#3182ce';
          e.currentTarget.style.color = '#3182ce';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          e.currentTarget.style.border = '1px solid #e2e8f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.color = '#4a5568';
        }}
      >
        <FaExchangeAlt size={16} style={{ transform: 'rotate(90deg)' }} />
      </div>

      <RoomCardContainer room={room} isOver={isOver}>
        {children}
      </RoomCardContainer>
    </div>
  );
};


// --- BATCH GROUPING UTILS ---
const groupBatchesByGeneticDateRoom = (batches: any[]) => {
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
    const dateKey = new Date(root.start_date || root.created_at).toLocaleDateString();
    // Key: GeneticID | Date | Stage (Ensure we only group same stage if mixed)
    const key = `${root.genetic_id || 'unk'}|${dateKey}|${root.stage || 'unk'}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(group);
  });

  groupMap.forEach((bundledGroups) => {
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
  });

  // Sort by Date Desc
  smartGroups.sort((a, b) => new Date(b.root.created_at).getTime() - new Date(a.root.created_at).getTime());
  return smartGroups;
};


const BatchGroupRow = ({ group, expanded, onToggleExpand, childrenRender }: { group: any, expanded: boolean, onToggleExpand: () => void, childrenRender: (batch: any) => React.ReactNode }) => {
  const { root, children } = group;
  const hasChildren = children.length > 0;

  const totalQty = root.quantity + children.reduce((acc: number, c: any) => acc + c.quantity, 0);
  const displayDate = new Date(root.start_date || root.created_at).toLocaleDateString();

  // Custom Name Logic
  let displayName = root.name;
  if (hasChildren) {
    const geneticName = root.genetic?.name || 'Desconocida';
    const prefix = geneticName.substring(0, 6).toUpperCase();
    displayName = `Lote ${prefix} - ${displayDate}`;
  }

  return (
    <React.Fragment>
      {/* Parent Row (Click to Expand if grouped, or just display if single) */}
      <div
        onClick={(e) => {
          if (hasChildren) {
            e.stopPropagation();
            onToggleExpand();
          }
        }}
        style={{
          background: hasChildren ? '#ebf8ff' : '#f7fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.5rem',
          cursor: hasChildren ? 'pointer' : 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '0.25rem',
          marginBottom: '0.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasChildren && (
            <span style={{ color: '#3182ce', fontSize: '0.8rem' }}>
              {expanded ? '▼' : '▶'}
            </span>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '0.9rem', color: '#2d3748' }}>{displayName}</strong>
            {hasChildren && <span style={{ fontSize: '0.75rem', color: '#718096' }}>{totalQty} u. ({children.length + 1} items)</span>}
          </div>
        </div>
      </div>

      {/* Render Items: Always render Root if expanded or if it's a single item */}
      {/* If Single Item (no children), we render the root using childrenRender directly? 
                Actually, simpler: 
                If hasChildren:
                   Render Dropdown header.
                   If Expanded: Render Root + Children using childrenRender.
                If !hasChildren:
                   Render Root using childrenRender directly (no header needed? Or header is the item?)
                   Wait, usually the "Lote" header IS the visualization requested.
                   If we always wrap in "Lote", then single items also get a header? 
                   Maybe better: always render grouping header.
                   But for single items, the header IS the item? No, the item has specific actions (edit/delete/QR).
                   Let's say: 
                   If hasChildren: Header (Summary) -> Expanded -> List of Items (Root + Children)
                   If NO children: Just render the Item (Root). 
                   But the user asked for "Agrupacion Inteligente". Single items are groups of 1.
                   Maybe nice: Always show Header "Lote X". Inside: The draggable row.
                   Let's stick to: Group only if multiple.
            */}

      {(!hasChildren) && childrenRender(root)}

      {hasChildren && expanded && (
        <div style={{ paddingLeft: '1rem', borderLeft: '2px solid #ebf8ff' }}>
          {childrenRender(root)}
          {children.map((child: any) => childrenRender(child))}
        </div>
      )}
    </React.Fragment>
  );
};


const CropDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  console.log("CropDetail Render. ID:", id); // Verify ID availability
  const navigate = useNavigate();
  const [crop, setCrop] = useState<Crop | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'log'>('task');
  const [selectedDate] = useState<Date | null>(null); // Setter unused

  // Form State
  const [taskForm, setTaskForm] = useState({ title: '', type: 'info', description: '' });
  // const [fertilizerDetails, setFertilizerDetails] = useState('');

  // Recurrence State
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig>({
    type: 'daily',
    interval: 1,
    unit: 'day',
    daysOfWeek: [],
    endOccurrences: undefined,
    endDate: undefined
  }); // New state for fertilizer info
  const [logForm, setLogForm] = useState({ notes: '' });

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [qrTitle, setQrTitle] = useState('');

  // Error/Info Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toast State
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  // Modify/Delete State
  const [isDeleteProtectionOpen, setIsDeleteProtectionOpen] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [existingLogId] = useState<string | null>(null); // Setter unused


  // ... (Define EventData type outside component)
  // interface EventData {
  //   tasks: any[]; // Using any to avoid importing Task if not strictly needed, or import it.
  //   log: any; // Using any or DailyLog
  // }

  // ... (Inside CropDetail)
  // State for events map
  // eventsMap removed as unused

  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);


  // New Room Form
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomModalClosing, setIsRoomModalClosing] = useState(false);

  const handleCloseRoomModal = () => {
    setIsRoomModalClosing(true);
    setTimeout(() => {
      setIsRoomModalOpen(false);
      setIsRoomModalClosing(false);
    }, 200); // Match animation duration
  };
  const [roomForm, setRoomForm] = useState<{
    name: string;
    type: 'vegetation' | 'flowering' | 'drying' | 'curing' | 'clones' | 'germination' | 'mother' | 'living_soil';
    medium?: 'maceta' | 'bandeja' | 'bunker';
    totalMacetas?: number;
    macetaGeneticId?: string;
    startDate?: string;
    operationalDays?: number; // Optional: Only for alerts
    tablesList?: { id: string; name: string }[]; // For Esquejera/Clones if complex
  }>({
    name: '',
    type: 'vegetation',
    medium: 'maceta', // default
    totalMacetas: 0,
    macetaGeneticId: '',
    startDate: new Date().toISOString().split('T')[0], // Default today
    operationalDays: undefined,
    tablesList: []
  });

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [genetics, setGenetics] = useState<any[]>([]);

  // --- DnD State ---
  const [activeDragRoom, setActiveDragRoom] = useState<any | null>(null);
  const [activeDragBatch, setActiveDragBatch] = useState<any | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());

  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 10 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));

  // --- Move Confirmation State ---
  const [moveConfirmState, setMoveConfirmState] = useState<{
    isOpen: boolean;
    batch: any | null;
    batchIds?: string[];
    targetRoomId: string | null;
    sourceRoomId: string | null;
  }>({
    isOpen: false,
    batch: null,
    batchIds: [],
    targetRoomId: null,
    sourceRoomId: null
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'room') {
      setActiveDragRoom(active.data.current.room);
      return;
    }

    const batch = active.data.current?.batch;
    setActiveDragBatch(batch || null);

    if (batch) {
      // If dragging an unselected item, clear selection and select only this one (standard OS behavior usually)
      // OR just add it to selection?
      // Let's go with: If it IS selected, we are dragging the group. If it is NOT selected, we clear group and drag just this one.
      if (!selectedBatchIds.has(batch.id)) {
        setSelectedBatchIds(new Set([batch.id]));
      }
    }
  };



  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragBatch(null);

    if (!over) return;

    // --- REORDERING ROOMS ---
    if (active.data.current?.type === 'room') {
      setActiveDragRoom(null);
      if (active.id !== over.id) {
        // Calculate new order logic extracted from setState to avoid side effects
        const oldIndex = rooms.findIndex(item => item.id === active.id);
        const newIndex = rooms.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(rooms, oldIndex, newIndex);
          setRooms(newOrder);
          // Persist order
          roomsService.updateRoomOrder(newOrder).catch(err => console.error("Failed to update order", err));
        }
      }
      return;
    }

    const batch = active.data.current?.batch;
    const roomId = over.id as string;

    if (!batch || batch.current_room_id === roomId) return;

    // --- BATCH MOVEMENT ---
    const batchesToMoveId = Array.from(selectedBatchIds);
    const finalBatchIds = batchesToMoveId.length > 0 && batchesToMoveId.includes(batch.id) ? batchesToMoveId : [batch.id];

    setMoveConfirmState({
      isOpen: true,
      batch: batch,
      batchIds: finalBatchIds,
      targetRoomId: roomId,
      sourceRoomId: active.data.current?.room?.id || batch.current_room_id
    });
  };

  const executeBatchMove = async () => {
    const { targetRoomId, sourceRoomId, batchIds } = moveConfirmState; // extracted batchIds
    if (!targetRoomId || !batchIds || batchIds.length === 0) return;

    try {
      const { roomsService } = await import('../services/roomsService');

      // Loop move for now (simplest implementation without backend changes)
      for (const bId of batchIds) {
        // Find the batch object to get quantity if needed, or rely on moveBatch fetching it?
        // moveBatch fetches it. But we need to pass defined params.
        // We can just pass the ID. implementation of moveBatch fetches the batch to get quantity if undefined.
        await roomsService.moveBatch(bId, sourceRoomId, targetRoomId, undefined, undefined);
      }

      loadRooms(id!); // Reload
      setMoveConfirmState(prev => ({ ...prev, isOpen: false }));
      setSelectedBatchIds(new Set()); // Clear selection after move
    } catch (e) {
      console.error("Move failed", e);
      alert("Error al mover los lotes.");
    }
  };

  useEffect(() => {
    // Load genetics for the modal
    const fetchGenetics = async () => {
      const { geneticsService } = await import('../services/geneticsService');
      const data = await geneticsService.getGenetics();
      setGenetics(data);
    };
    fetchGenetics();
  }, []);



  // Expanded State for Room Batch Lists
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  const toggleRoomExpansion = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // --- BATCH GROUP EXPANSION STATE ---
  const [expandedBatchGroups, setExpandedBatchGroups] = useState<Set<string>>(new Set());

  const toggleBatchGroupExpansion = (groupId: string) => {
    setExpandedBatchGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };






  const loadRooms = React.useCallback(async (spotId: string, minLoadingTime = 0) => {
    setIsLoadingRooms(true);
    const start = Date.now();

    const { roomsService } = await import('../services/roomsService');
    const data = await roomsService.getRooms(spotId);

    // Calculate remaining time
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minLoadingTime - elapsed);

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    setRooms(data);
    setIsLoadingRooms(false);
  }, []);

  const loadCrop = React.useCallback(async (cropId: string, isInitial = false) => {
    try {
      console.log("Loading spot...", cropId);

      const loadPromise = async () => {
        const data = await cropsService.getCropById(cropId);
        if (!data) throw new Error("Spot not found");
        return data;
      };

      const minTimePromise = isInitial
        ? new Promise(resolve => setTimeout(resolve, 1500))
        : Promise.resolve();

      // Run fetching and timer in parallel
      const [data] = await Promise.all([
        loadPromise(),
        // Load rooms in parallel too if we want, or sequentially?
        // Previous logic: load rooms BEFORE setting crop.
        // Let's keep loadRooms separate or inside?
        // To ensure 3s *total* wait, we should include the timer in the main wait.
        minTimePromise
      ]);

      console.log("Crop data loaded:", data);

      // Load rooms BEFORE setting crop to avoid double loading screens (Split flash)
      await loadRooms(cropId);
      setCrop(data);
    } catch (error) {
      console.error("Error loading spot:", error);
      navigate('/crops'); // Fallback redirect
    }
  }, [navigate, loadRooms]);

  // ... skip until handleConfirmDeleteRoom

  // ...

  // ...



  const handleCreateRoom = async () => {
    console.log("handleCreateRoom called");
    console.log("Form Data:", roomForm);
    console.log("Crop ID:", id);

    if (isCreatingRoom) return;

    if (!roomForm.name || !id || (!roomForm.operationalDays && roomForm.type !== 'living_soil')) {
      console.error("Missing name, ID, or operational days");
      showToast("Por favor completa el nombre de la sala y los días de funcionamiento.", 'error');
      return;
    }

    try {
      setIsCreatingRoom(true);

      // Validate Duplicate Name
      const isDuplicate = rooms.some(r => r.name.toLowerCase().trim() === roomForm.name.toLowerCase().trim());
      if (isDuplicate) {
        showToast("Ya existe una sala con este nombre. Por favor, elige otro nombre.", 'error');
        setIsCreatingRoom(false);
        return;
      }

      const { roomsService } = await import('../services/roomsService');
      const newRoom = await roomsService.createRoom({
        name: roomForm.name,
        type: roomForm.type as any,
        medium: 'maceta', // Default for now, irrelevant
        capacity: 0,
        spot_id: id,
        start_date: roomForm.startDate,
        operational_days: roomForm.operationalDays ? Number(roomForm.operationalDays) : undefined // Pass to service
      });

      if (newRoom) {
        console.log("Room created successfully:", newRoom);
        handleCloseRoomModal(); // Close first!
        await loadRooms(id, 2000); // Then load with delay
        setRoomForm({
          name: '',
          type: 'vegetation',
          medium: 'maceta',
          totalMacetas: 0,
          macetaGeneticId: '',
          startDate: new Date().toISOString().split('T')[0],
          operationalDays: undefined,
          tablesList: []
        });
      } else {
        console.error("Failed to create room");
        showToast("Error al crear la sala.", 'error');
      }
    } catch (error) {
      console.error("Error creating room:", error);
      showToast("Ocurrió un error al crear la sala.", 'error');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  /* Finish Crop / Harvest Logic */



  const handleOpenFinishModal = (e: React.MouseEvent, room: any) => {
    e.stopPropagation();
    setRoomToFinish(room);

    // Initialize yields for each batch
    const yields: Record<string, number> = {};
    if (room.batches) {
      room.batches.forEach((b: any) => {
        yields[b.id] = 0;
      });
    }
    setHarvestForm({
      date: new Date().toISOString().split('T')[0],
      totalWeight: 0,
      notes: '',
      dryingDays: 14,
      dryingConditions: '20°C / 55% HR',
      batchYields: yields,
      unit: 'g'
    });
    setHarvestPhoto(null);
    setIsFinishModalOpen(true);
  };

  const handleConfirmFinish = async () => {
    if (!roomToFinish || !crop) return;

    // Validate
    if (Object.values(harvestForm.batchYields).some(v => v < 0)) {
      alert("Los pesos no pueden ser negativos.");
      return;
    }

    try {
      setIsFinishing(true);
      const { roomsService } = await import('../services/roomsService');
      const { dispensaryService } = await import('../services/dispensaryService');
      const { cropsService } = await import('../services/cropsService');

      let uploadedPhotoUrl = undefined;
      if (harvestPhoto) {
        uploadedPhotoUrl = await dispensaryService.uploadHarvestPhoto(harvestPhoto);
      }

      const batches = roomToFinish.batches || [];

      // Process each batch
      for (const batch of batches) {
        const amount = harvestForm.batchYields[batch.id];
        // Logic handles if amount is missing or invalid in loop
        if (!amount || amount < 0) continue;

        // 1. Log Harvest
        const harvestLogId = await cropsService.logHarvest({
          cropId: crop.id,
          roomName: roomToFinish.name,
          amount: amount,
          unit: harvestForm.unit || 'g',
          notes: `${harvestForm.notes} - Lote: ${batch.name} (${batch.genetic?.name || 'Unknown'})`
        });

        if (harvestLogId) {
          // 2. Create Dispensary Batch
          try {
            await dispensaryService.createFromHarvest({
              cropId: crop.id,
              harvestLogId: harvestLogId,
              strainName: batch.genetic?.name || batch.name || 'Unknown Strain',
              amount: amount,
              unit: harvestForm.unit || 'g',
              originalBatchCode: batch.name,
              photoUrl: uploadedPhotoUrl || undefined
            });

            // 3. Delete Batch
            await roomsService.deleteBatch(batch.id);
          } catch (err) {
            console.error(`Error creating dispensary batch for ${batch.name}:`, err);
          }
        }
      }

      // Finish Room (Delete)
      const success = await roomsService.deleteRoom(roomToFinish.id);

      if (success) {
        setRoomToFinish(null);
        setIsFinishModalOpen(false); // Close first
        if (id) await loadRooms(id, 2000); // Wait 2s
      } else {
        alert("Error al finalizar la sala.");
      }

    } catch (error) {
      console.error("Error finishing room:", error);
      alert("Error al finalizar la sala.");
    } finally {
      setIsFinishing(false);
    }
  };

  const [isFinishing, setIsFinishing] = useState(false);
  const [roomToFinish, setRoomToFinish] = useState<any>(null);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [harvestPhoto, setHarvestPhoto] = useState<File | null>(null);
  const [harvestForm, setHarvestForm] = useState<{
    date: string;
    totalWeight: number;
    notes: string;
    dryingDays: number;
    dryingConditions: string;
    batchYields: Record<string, number>;
    unit: 'g' | 'kg';
  }>({
    date: '',
    totalWeight: 0,
    notes: '',
    dryingDays: 14,
    dryingConditions: '',
    batchYields: {},
    unit: 'g'
  });

  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const handleDeleteRoom = (e: React.MouseEvent, roomId: string, roomName: string) => {
    e.stopPropagation();
    setRoomToDelete({ id: roomId, name: roomName });
    setConfirmOpen(true);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;

    setIsDeletingRoom(true);
    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.deleteRoom(roomToDelete.id);
    setIsDeletingRoom(false);

    if (success) {
      setConfirmOpen(false); // Close modal FIRST
      setRoomToDelete(null);
      if (id) await loadRooms(id, 2000); // THEN trigger loading state with 2s delay
    } else {
      setErrorMessage("Error al eliminar la sala.");
      setIsErrorModalOpen(true);
    }
  };



  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'room' | 'spot' | null>(null);
  const [editData, setEditData] = useState<{ id: string, name: string } | null>(null);

  const handleEditRoomName = (e: React.MouseEvent, room: any) => {
    e.stopPropagation();
    setEditType('room');
    setEditData({ id: room.id, name: room.name });
    setEditModalOpen(true);
  };



  const handleConfirmEditName = async (newName: string) => {
    if (!editData || !newName.trim()) return;

    if (editType === 'room') {
      const { roomsService } = await import('../services/roomsService');
      const success = await roomsService.updateRoom(editData.id, { name: newName });
      if (success) {
        if (id) loadRooms(id);
        setEditModalOpen(false);
      } else {
        alert("Error al renombrar la sala.");
      }
    } else if (editType === 'spot') {
      const success = await cropsService.updateCrop(editData.id, { name: newName });
      if (success) {
        setCrop(prev => prev ? { ...prev, name: newName } : null);
        setEditModalOpen(false);
      } else {
        alert("Error al renombrar el spot.");
      }
    }
  };

  // Old Transplant Logic Removed/Replaced in the block below
  // keeping the state declarations for compatibility with the replacement block if needed, 
  // but better to remove the old handlers to avoid confusion.
  // ... handled in the main replacement block ...

  // Confirm Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingStageChange, setPendingStageChange] = useState<{ room: any, nextStage: string } | null>(null);





  const executeStageChange = async () => {
    if (!pendingStageChange) return;
    const { room, nextStage } = pendingStageChange;
    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.updateRoom(room.id, { type: nextStage as any });

    if (success) {
      if (id) loadRooms(id);
      setIsConfirmModalOpen(false);
      setPendingStageChange(null);
    } else {
      alert("Error al cambiar etapa.");
    }
  };

  // Assign Clone Modal State
  // Assign Clone Modal State
  const isAssignModalOpen = false;
  const assignRoom: any = null;
  const availableCloneBatches: any[] = [];
  const selectedBatchId = '';
  const assignQuantity = 0;
  const isAssigning = false;
  const isSuccessModalOpen = false;

  // Dummy setters to satisfy dead JSX
  const setIsAssignModalOpen = (v: boolean) => { };
  const setSelectedBatchId = (v: string) => { };
  const setAssignQuantity = (v: number) => { };
  const setIsSuccessModalOpen = (v: boolean) => { };
  const handleConfirmAssign = () => { };






  // --- BATCH EDIT / DELETE STATE ---
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [batchEditForm, setBatchEditForm] = useState({ id: '', name: '', quantity: 0, geneticId: '' });

  const handleEditBatchClick = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation();
    setBatchEditForm({ id: batch.id, name: batch.name, quantity: batch.quantity, geneticId: batch.genetic_id || '' });
    setIsBatchEditModalOpen(true);
  };

  const handleSaveBatchEdit = async () => {
    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.updateBatch(batchEditForm.id, {
      name: batchEditForm.name,
      quantity: Number(batchEditForm.quantity),
      genetic_id: batchEditForm.geneticId // Update genetic
    });

    if (success) {
      if (id) loadRooms(id);
      setIsBatchEditModalOpen(false);
    } else {
      alert("Error al editar el lote.");
    }
  };

  const [isDeleteBatchConfirmOpen, setIsDeleteBatchConfirmOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<any | null>(null);

  const handleDeleteBatchClick = (e: React.MouseEvent, batch: any) => {
    e.stopPropagation();
    setBatchToDelete(batch);
    setIsDeleteBatchConfirmOpen(true);
  };

  const executeDeleteBatch = async () => {
    if (!batchToDelete) return;

    const { roomsService } = await import('../services/roomsService');
    const success = await roomsService.deleteBatch(batchToDelete.id);

    if (success) {
      if (id) loadRooms(id);
      setIsDeleteBatchConfirmOpen(false);
      setBatchToDelete(null);
    } else {
      alert("Error al eliminar el lote.");
    }
  };

  // --- NEW TRANSPLANT LOGIC ---
  const [isTransplantModalOpen, setIsTransplantModalOpen] = useState(false);
  const [transplantRoom, setTransplantRoom] = useState<any | null>(null);

  const [transplantForm, setTransplantForm] = useState<{
    targetRoomId: string;
    batchId: string;
    medium: 'Maceta' | 'Bandeja' | 'Bunker';
    quantity: number;
  }>({
    targetRoomId: '',
    batchId: '',
    medium: 'Maceta',
    quantity: 0
  });



  const handleTransplantSave = async () => {
    if (!transplantRoom || !transplantForm.targetRoomId || !transplantForm.batchId) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (transplantForm.quantity <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }

    const { roomsService } = await import('../services/roomsService');

    // Notes can include the medium info
    const notes = `Transplante a ${transplantForm.medium}`;

    const success = await roomsService.moveBatch(
      transplantForm.batchId,
      transplantRoom.id,
      transplantForm.targetRoomId,
      notes,
      transplantForm.quantity
    );

    if (success) {
      if (id) loadRooms(id);
      setIsTransplantModalOpen(false);
      setTransplantRoom(null);
    } else {
      alert("Error al realizar el transplante.");
    }
  };

  // const handleRecurrenceChange = (field: keyof RecurrenceConfig, value: any) => {
  //   setRecurrenceConfig(prev => ({ ...prev, [field]: value }));
  // };


  useEffect(() => {
    if (id) {
      loadCrop(id, true);
    }
  }, [id, loadCrop]);


  const handleEditTask = (task: Task) => {
    setTaskForm({
      title: task.title,
      type: task.type as any, // Warning: loss of type safety pending strict check
      description: task.description || ''
    });
    setEditingTaskId(task.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    await tasksService.deleteTask(taskId);
    setIsModalOpen(false); // Close to refresh cleanly or update local state
  };

  const handleDeleteLog = async () => {
    if (!existingLogId) return;
    if (!window.confirm('¿Eliminar este registro diario?')) return;
    await dailyLogsService.deleteLog(existingLogId);
    setIsModalOpen(false);
  };

  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    if (processingTaskId === taskId) return;
    setProcessingTaskId(taskId);

    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    // Optimistic Update for UI responsiveness
    setSelectedDayTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus as any } : t
    ));

    const success = await tasksService.updateStatus(taskId, newStatus as any);

    if (!success) {
      // Revert on failure
      setSelectedDayTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: currentStatus as any } : t
      ));
    }
    setProcessingTaskId(null);
  };

  const handleSave = async () => {
    if (!selectedDate || !id) return;
    // Fix: Force date to noon to avoid timezone shifts (e.g. 20th 00:00 becoming 19th 21:00)
    const safeDate = new Date(selectedDate);
    safeDate.setHours(12, 0, 0, 0);
    const dateStr = format(safeDate, 'yyyy-MM-dd');

    if (activeTab === 'task') {
      if (!taskForm.title) return;
      // Append fertilizer details if applicable
      let finalDescription = taskForm.description;
      /* if (taskForm.type === 'fertilizante' && fertilizerDetails.trim()) {
        finalDescription = `${finalDescription ? finalDescription + '\n\n' : ''}🧪 Fertilizante/Dosis: ${fertilizerDetails}`;
      } */

      const taskData: CreateTaskInput = {
        title: taskForm.title,
        description: finalDescription,
        type: taskForm.type as any,
        due_date: dateStr,
        crop_id: id,
        // room_id: crop.rooms?.[0].id, // Default to first room? Or logic to select room?
        recurrence: recurrenceEnabled ? recurrenceConfig : undefined
      };

      if (editingTaskId) {
        await tasksService.updateTask(editingTaskId, taskData);
      } else {
        await tasksService.createTask(taskData);
      }
    } else {
      // Assuming this is where room creation logic would be if it were in handleSave
      // The instruction implies adding 'medium' to a 'createRoom' or 'createRooms' payload.
      // Since the provided snippet doesn't contain the actual room creation logic,
      // I'm inserting the requested change as a placeholder where it might logically fit,
      // but it's important to note that the original content does not have this specific
      // room creation block within the handleSave function.
      // If the room creation logic is elsewhere, this change should be applied there.
      // For the purpose of this exercise, I'm placing it as per the user's instruction's structure.

      // This block below is from the user's instruction, but it seems to be misplaced
      // if it's intended for room creation within handleSave's 'else' (daily log).
      // I will place it here as per the instruction's structure, assuming it's a
      // conceptual insertion point for the 'medium' property.
      // If this is not the correct location, please provide the actual room creation function.
      // const roomsData = [{
      //   name: roomForm.name,
      //   type: roomForm.type,
      //   medium: roomForm.medium, // Added as per instruction
      //   capacity: totalPlants,
      //   spot_id: id
      // }];
      // const { data: newRoomData, error: roomError } = await roomsService.createRooms(roomsData);

      await dailyLogsService.upsertLog({
        crop_id: id,
        date: dateStr,
        notes: logForm.notes
      });

    }
    // Refresh events map
    // if (id) await loadEvents(id);
    setIsModalOpen(false);
  };

  // This function is not used in the provided snippet, but it was part of the original code
  // and is likely intended to be used when opening the modal for a specific date.
  // Keeping it here for context, but it's not directly modified by the current instruction.
  // const handleDayClick = async (date: Date) => {
  //   // setSelectedDate(date);
  //   // const dateStr = format(date, 'yyyy-MM-dd');
  //   // const tasksForDay = await tasksService.getTasksByDate(id!, dateStr);
  //   // setSelectedDayTasks(tasksForDay);

  //   // const logForDay = await dailyLogsService.getLogByDate(id!, dateStr);
  //   // if (logForDay) {
  //   //   setLogForm({ notes: logForDay.notes || '', photos: logForDay.photos || [] });
  //   //   setExistingLogId(logForDay.id);
  //   // } else {
  //   //   setLogForm({ notes: '', photos: [] });
  //   //   setExistingLogId(null);
  //   // }

  //   // Reset Task/Recurrence Form
  //   // setTaskForm({ title: '', type: 'info', description: '' });
  //   // setRecurrenceEnabled(false);
  //   // setRecurrenceConfig({ type: 'daily', interval: 1, unit: 'day', daysOfWeek: [] });
  //   // setEditingTaskId(null);

  //   // setIsModalOpen(true);
  // };




  if (!crop) {
    return <LoadingSpinner text="Cargando detalles del cultivo..." fullScreen duration={1500} />;
  }



  const executeDeleteCrop = async () => {
    if (!crop) return;

    const success = await cropsService.deleteCrop(crop.id);
    if (success) {
      navigate('/');
    } else {
      setErrorMessage("Error al eliminar el Cultivo.");
      setIsErrorModalOpen(true);
    }
  };

  const handleUpdateColor = async (newColor: string) => {
    if (!crop) return;
    const success = await cropsService.updateCrop(crop.id, { color: newColor });
    if (success) {
      setCrop({ ...crop, color: newColor });
      setIsColorPickerOpen(false);
    }
  };

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BackButton onClick={() => navigate('/crops')}>
            <FaArrowLeft /> Volver a Cultivos
          </BackButton>
        </div>

        <TitleSection>
          <div>
            <CropTitle>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FaSeedling /> {/* Changed icon to Seedling/Spot concept */}
                {crop.name}
                {/* Buttons removed as per request */}
              </div>
            </CropTitle>
            <MetaGrid>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaCalendarAlt /> Creado: {format(new Date(crop.startDate), 'dd MMM yyyy', { locale: es })}
              </div>
            </MetaGrid>
          </div>
        </TitleSection>
      </Header>

      {/* --- ROOMS SECTION --- */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#2d3748', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Salas de Cultivo Activas
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>


          </div>
        </div>

        {isLoadingRooms ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
            <LoadingSpinner text="Cargando salas..." />
          </div>
        ) : (
          <FadeInWrapper>
            {rooms.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>

                <div style={{
                  padding: '2rem',
                  background: '#fff',
                  borderRadius: '1rem',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  color: '#718096',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>No hay salas/cultivos activos</p>
                </div>

                <CreateCard onClick={() => setIsRoomModalOpen(true)}>
                  <DashedCircle>
                    <FaPlus />
                  </DashedCircle>
                  <span style={{ fontWeight: 600, fontSize: '1rem', color: 'inherit', textAlign: 'center', padding: '0 1rem' }}>
                    Crear la primera sala
                  </span>
                </CreateCard>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={rooms.map((r: any) => r.id)} strategy={rectSortingStrategy}>
                  <GridContainer>
                    {rooms.map(room => {
                      // Calculate logic
                      let weekInfo = "";
                      let startDateDisplay = "-";
                      let daysToFlip = null;

                      // Determine effective start date (Priority: Earliest Active Batch > Room Start Date)
                      let effectiveStartDate = room.start_date;
                      let activeBatches: any[] = [];

                      if (room.batches && room.batches.length > 0) {
                        activeBatches = room.batches.filter((b: any) => b.stage === room.type);
                        if (activeBatches.length > 0) {
                          const earliestBatchDate = activeBatches.reduce((min: string, b: any) => b.start_date < min ? b.start_date : min, activeBatches[0].start_date);
                          effectiveStartDate = earliestBatchDate;
                        }
                      }

                      // --- OPERATIONAL DAYS LOGIC ---
                      let daysRemainingString = null;
                      let isPeriodOver = false;
                      let alertLevel = 0; // 0: None, 1: Badge Red, 2: Border Red, 3: Heartbeat

                      if (room.operational_days && room.start_date) {
                        const start = new Date(room.start_date);
                        const now = new Date();
                        const end = new Date(start);
                        end.setDate(start.getDate() + room.operational_days);

                        const diffDays = differenceInDays(end, now);

                        if (diffDays <= 0) {
                          isPeriodOver = true;
                          daysRemainingString = "Periodo finalizado";
                          alertLevel = 3; // Finished = Critical
                        } else {
                          daysRemainingString = `${diffDays} días restantes`;
                          if (diffDays <= 3) alertLevel = 3;
                          else if (diffDays <= 5) alertLevel = 2;
                          else if (diffDays <= 7) alertLevel = 1;
                        }
                      }


                      // --- ESQUEJERA LOGIC: Genetic Breakdown ---
                      let geneticBreakdown: Record<string, number> | null = null;
                      if (room.type === 'clones' && room.batches) {
                        geneticBreakdown = {};
                        room.batches.forEach((b: any) => {
                          const gName = b.genetic?.name || 'Desconocida';
                          geneticBreakdown![gName] = (geneticBreakdown![gName] || 0) + b.quantity;
                        });
                      }

                      // Calculate Display Date & Weeks
                      if (effectiveStartDate) {
                        // Parse manually to avoid UTC conversion issues (e.g. 2026-01-30 becoming 29th in GMT-3)
                        const [y, m, d] = effectiveStartDate.split('T')[0].split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d); // Local midnight

                        startDateDisplay = format(dateObj, 'dd/MM/yyyy');
                        const weeks = differenceInWeeks(new Date(), dateObj) + 1;
                        weekInfo = `Semana ${weeks}`;
                      }

                      // Countdown Logic (Only for Vegetation with Genetics)
                      if (room.type === 'vegetation' && activeBatches.length > 0) {
                        const firstBatch = activeBatches[0];
                        if (firstBatch && firstBatch.genetic_id) {
                          const genetic = genetics.find(g => g.id === firstBatch.genetic_id);
                          if (genetic && genetic.vegetative_weeks && effectiveStartDate) {
                            const targetDate = addWeeks(new Date(effectiveStartDate), genetic.vegetative_weeks);
                            daysToFlip = differenceInDays(targetDate, new Date());
                          }
                        }
                      }

                      // --- CYCLE CALCULATION FOR PROGRESS BAR ---

                      let vegeWidth = 0;
                      let floraWidth = 0;
                      let currentStageProgress = 0; // % within the total bar
                      let activeBatchForCycle = room.batches && room.batches.length > 0 ? room.batches.find((b: any) => b.stage === room.type) : null;
                      let cycleGenetic = activeBatchForCycle ? genetics.find(g => g.id === activeBatchForCycle.genetic_id) : null;

                      if (activeBatchForCycle && cycleGenetic) {
                        const startDate = new Date(activeBatchForCycle.start_date);
                        const today = new Date();
                        const weeksPassed = Math.max(0, differenceInWeeks(today, startDate));

                        // Default estima: 4 weeks vege, 9 weeks flora (if no genetics)
                        const estVege = cycleGenetic.vegetative_weeks || 4;
                        const estFlora = cycleGenetic.flowering_weeks || 9;
                        const totalEstWeeks = estVege + estFlora;

                        // Calculate widths relative to total
                        vegeWidth = (estVege / totalEstWeeks) * 100;
                        floraWidth = (estFlora / totalEstWeeks) * 100;

                        // Find current position logic...
                        // Simplified: use total weeks passed from start_date / total weeks
                        const totalProgress = (weeksPassed / totalEstWeeks) * 100;
                        currentStageProgress = Math.min(100, totalProgress);
                      }




                      return (
                        <SortableRoomItem key={room.id} room={room}>
                          <div
                            onClick={() => navigate(`/rooms/${room.id}`)}
                            style={{
                              // Removed wrapping explicit div styles as they are now handled by RoomCard or moved
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '4px',
                              background: room.type === 'vegetation' ? '#48bb78' // Green
                                : room.type === 'flowering' ? '#ed8936' // Orange
                                  : room.type === 'clones' ? '#63b3ed' // Blue
                                    : room.type === 'living_soil' ? '#319795' // Teal
                                      : room.type === 'mother' ? '#d53f8c' // Pink
                                        : room.type === 'germination' ? '#9ae6b4' // Light Green
                                          : '#ecc94b' // Yellow (Default)
                            }} />

                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem', marginTop: '3.5rem' }}>
                              <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: 800, paddingRight: '140px', wordBreak: 'break-word' }}>{room.name}</h3>

                              {/* Visual Stage Badge - Replaces old small badge */}
                              <VisualStageBadge $type={room.type}>
                                {room.type === 'vegetation' ? <FaLeaf />
                                  : room.type === 'flowering' ? <span>🌸</span>
                                    : room.type === 'mother' ? <FaSeedling />
                                      : room.type === 'clones' ? <span>🧬</span>
                                        : room.type === 'germination' ? <span>🌱</span>
                                          : room.type === 'living_soil' ? <span>🌍</span>
                                            : <FaWarehouse />}
                                <span>
                                  {room.type === 'vegetation' ? 'VEGETACIÓN'
                                    : room.type === 'flowering' ? 'FLORA'
                                      : room.type === 'mother' ? 'MADRES'
                                        : room.type === 'clones' ? 'ESQUEJERA'
                                          : room.type === 'germination' ? 'GERMINACIÓN'
                                            : room.type === 'living_soil' ? 'LIVING SOIL'
                                              : 'SECADO'}
                                </span>
                              </VisualStageBadge>
                            </div>

                            {weekInfo && (
                              <span style={{
                                position: 'absolute',
                                top: '3.5rem',
                                right: '0.75rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                background: '#ebf8ff',
                                color: '#2b6cb0',
                                width: 'fit-content',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                zIndex: 5
                              }}>
                                <FaRegCircle size={8} /> {weekInfo}
                              </span>
                            )}



                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {/* Start Date */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem' }}>
                                <FaCalendarAlt size={14} color="#718096" />
                                <span>Iniciado: <strong>{startDateDisplay}</strong></span>
                              </div>

                              {/* OPERATIONAL DAYS ALERT/COUNTDOWN */}
                              {room.operational_days && daysRemainingString && (
                                <div style={{
                                  marginTop: '0.5rem',
                                  padding: '0.5rem',
                                  borderRadius: '0.5rem',
                                  background: alertLevel >= 1 || isPeriodOver ? '#fed7d7' : '#e6fffa',
                                  color: alertLevel >= 1 || isPeriodOver ? '#c53030' : '#2c7a7b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontWeight: 700,
                                  fontSize: '0.9rem',
                                  border: alertLevel >= 1 || isPeriodOver ? '1px solid #fc8181' : '1px solid #b2f5ea'
                                }}>
                                  {alertLevel >= 1 || isPeriodOver ? <FaExclamationTriangle /> : <FaClock />}
                                  <span>{daysRemainingString}</span>
                                </div>
                              )}

                              {/* ESQUEJERA SUMMARY */}
                              {geneticBreakdown && (
                                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#ebf8ff', borderRadius: '0.5rem', border: '1px solid #bee3f8' }}>
                                  <strong style={{ display: 'block', fontSize: '0.8rem', color: '#2b6cb0', marginBottom: '0.25rem' }}>Resumen por Genética:</strong>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {Object.entries(geneticBreakdown as Record<string, number>).map(([name, count]) => (
                                      <span key={name} style={{ fontSize: '0.8.5rem', background: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#4a5568' }}>
                                        <strong>{count}</strong> {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Assigned Batch Info - SMART GROUPING REPLACEMENT */}
                              {room.batches && room.batches.length > 0 && (
                                <div
                                  onClick={(e) => e.stopPropagation()} // Stop navigation when clicking in batch area
                                  style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: '#4a5568', background: '#f7fafc', padding: '0.5rem', borderRadius: '0.5rem' }}
                                >
                                  {(() => {
                                    // Smart Grouping Logic
                                    const groupedBatches = groupBatchesByGeneticDateRoom(room.batches);
                                    const visibleGroups = expandedRooms[room.id] ? groupedBatches : groupedBatches.slice(0, 5);

                                    return (
                                      <>
                                        {visibleGroups.map((group: any) => (
                                          <BatchGroupRow
                                            key={group.root.id}
                                            group={group}
                                            expanded={expandedBatchGroups.has(group.root.id)}
                                            onToggleExpand={() => toggleBatchGroupExpansion(group.root.id)}
                                            childrenRender={(batch: any) => (
                                              <DraggableBatchRow
                                                key={batch.id}
                                                batch={batch}
                                                isSelected={selectedBatchIds.has(batch.id)}
                                                onToggleSelect={toggleBatchSelection}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaBarcode color="#4a5568" size={12} />
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                                                      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{batch.name}</strong> <span style={{ color: '#718096', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>({batch.quantity}u)</span>
                                                    </span>
                                                  </div>
                                                  <div style={{ display: 'flex', gap: '5px' }}>
                                                    <Tooltip text="Editar Datos del Lote">
                                                      <button
                                                        onPointerDown={(e) => e.stopPropagation()} // Prevent Drag
                                                        onClick={(e) => handleEditBatchClick(e, batch)}
                                                        style={{
                                                          background: 'white', border: '1px solid #e2e8f0', borderRadius: '4px',
                                                          color: '#3182ce', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem',
                                                          display: 'flex', alignItems: 'center'
                                                        }}
                                                      >
                                                        <FaEdit size={12} />
                                                      </button>
                                                    </Tooltip>
                                                    <Tooltip text="Eliminar Lote">
                                                      <button
                                                        onPointerDown={(e) => e.stopPropagation()} // Prevent Drag
                                                        onClick={(e) => handleDeleteBatchClick(e, batch)}
                                                        style={{
                                                          background: 'white', border: '1px solid #fed7d7', borderRadius: '4px',
                                                          color: '#e53e3e', cursor: 'pointer', fontSize: '0.8rem', padding: '0.2rem',
                                                          display: 'flex', alignItems: 'center'
                                                        }}
                                                      >
                                                        <FaTrash size={12} />
                                                      </button>
                                                    </Tooltip>
                                                    <Tooltip text="Ver Código QR / Pasaporte">
                                                      <button
                                                        onPointerDown={(e) => e.stopPropagation()} // Prevent Drag
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          const passportUrl = `${window.location.origin}/passport/${batch.id}`;
                                                          setQrValue(passportUrl);
                                                          setQrTitle(`QR: ${batch.name}`);
                                                          setQrModalOpen(true);
                                                        }}
                                                        style={{
                                                          background: 'white',
                                                          border: '1px solid #e2e8f0',
                                                          borderRadius: '4px',
                                                          color: '#4a5568',
                                                          cursor: 'pointer',
                                                          fontSize: '0.7rem',
                                                          padding: '0.1rem 0.4rem',
                                                          fontWeight: 600
                                                        }}
                                                      >
                                                        QR
                                                      </button>
                                                    </Tooltip>
                                                  </div>
                                                </div>
                                              </DraggableBatchRow>
                                            )}
                                          />
                                        ))}

                                        {/* Show "Ver todos" based on GROUPS count, not batches */}
                                        {groupedBatches.length > 5 && (
                                          <button
                                            onClick={(e) => toggleRoomExpansion(room.id, e)}
                                            style={{
                                              border: 'none',
                                              background: 'none',
                                              color: '#3182ce',
                                              fontSize: '0.8rem',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              marginTop: '0.25rem',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: '100%',
                                              padding: '0.25rem'
                                            }}
                                          >
                                            {expandedRooms[room.id] ? 'Ver menos' : `Ver todos (${groupedBatches.length} lotes)`}
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Environmental Data (Placeholders for TUYA API) */}
                              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.85rem' }}>
                                  <FaTemperatureHigh size={12} color="#e53e3e" />
                                  <span>Temp. Actual <span style={{ float: 'right', fontWeight: 'bold' }}>--</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.85rem' }}>
                                  <FaTint size={12} color="#3182ce" />
                                  <span>Humedad <span style={{ float: 'right', fontWeight: 'bold' }}>--</span></span>
                                </div>
                              </div>

                              {/* Countdown To Flora */}
                              {daysToFlip !== null && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4a5568', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                  <FaClock size={14} color="#ed8936" />
                                  <span>
                                    {daysToFlip > 0
                                      ? <span>Pasa a Flora en: <strong>{daysToFlip} días</strong></span>
                                      : <span style={{ color: '#e53e3e', fontWeight: 600 }}>¡Listo para pasar a Flora!</span>
                                    }
                                  </span>
                                </div>
                              )}
                              {/* We could add Sensor data here if available */}

                              {/* LIFE CYCLE PROGRESS BAR */}
                              {(room.type === 'vegetation' || room.type === 'flowering') && activeBatchForCycle && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#718096', marginBottom: '2px' }}>
                                    <span>Inicio</span>
                                    <span>Cosecha Est.</span>
                                  </div>
                                  <div style={{ position: 'relative', height: '10px', width: '100%', background: '#edf2f7', borderRadius: '5px', overflow: 'hidden' }}>
                                    {/* Vege Segment */}
                                    <div style={{
                                      position: 'absolute', left: 0, top: 0, bottom: 0,
                                      width: `${vegeWidth}%`, background: '#c6f6d5',
                                      borderRight: '1px solid white'
                                    }} title="Fase Vegetativa Estimada" />

                                    {/* Flora Segment */}
                                    <div style={{
                                      position: 'absolute', left: `${vegeWidth}%`, top: 0, bottom: 0,
                                      width: `${floraWidth}%`, background: '#fbd38d'
                                    }} title="Fase de Floración Estimada" />

                                    {/* Current Progress Indicator */}
                                    <div style={{
                                      position: 'absolute',
                                      left: 0, top: 0, bottom: 0,
                                      width: `${currentStageProgress}%`,
                                      background: 'rgba(0,0,0,0.15)', // Shadow overlay to show progress
                                      borderRight: '2px solid #2d3748',
                                      transition: 'width 0.5s ease-out'
                                    }} />
                                  </div>

                                </div>
                              )}

                              {/* Footer Actions: Stage Controls + Utility Buttons */}
                              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

                                {/* Left: Stage Action (or empty spacer if none) */}
                                <div style={{ flex: 1 }}>
                                  {/* {room.type === 'vegetation' && (
                                <button
                                  onClick={(e) => handleForceStage(e, room, 'flowering')}
                                  style={{
                                    width: '100%',
                                    background: '#fbd38d',
                                    color: '#975a16',
                                    border: '1px solid #f6ad55',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span>🌸</span> Pasar a Floración
                                </button>
                              )} */}




                                </div>

                                {/* Right: Utility Buttons (Moved from Absolute Position) */}
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  {/* Removed "Asignar Nuevo Lote" button as per request, since it is handled in the map */}
                                  {/* Removed Transplant Button as per request */}
                                  {/* <Tooltip text="Transplantar">
                                <button
                                  onClick={(e) => handleOpenTransplant(e, room)}
                                  style={{
                                    background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#d69e2e'; e.currentTarget.style.borderColor = '#d69e2e'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                >
                                  <FaExchangeAlt size={14} />
                                </button>
                              </Tooltip> */}
                                  <Tooltip text="Editar Nombre de Sala">
                                    <button
                                      onClick={(e) => handleEditRoomName(e, room)}
                                      style={{
                                        background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.color = '#3182ce'; e.currentTarget.style.borderColor = '#3182ce'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                  </Tooltip>
                                  <Tooltip text="Eliminar Sala">
                                    <button
                                      onClick={(e) => handleDeleteRoom(e, room.id, room.name)}
                                      style={{
                                        background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#718096', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                      }}
                                      onMouseEnter={(e) => { e.currentTarget.style.color = '#e53e3e'; e.currentTarget.style.borderColor = '#e53e3e'; }}
                                      onMouseLeave={(e) => { e.currentTarget.style.color = '#718096'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                      <FaTrash size={14} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SortableRoomItem>
                      )
                    })}

                    {/* Add New Room Card */}
                    <CreateCard onClick={() => setIsRoomModalOpen(true)}>
                      <DashedCircle>
                        <FaPlus />
                      </DashedCircle>
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: 'inherit' }}>Haz click aquí para crear una nueva sala</span>
                    </CreateCard>
                  </GridContainer>
                </SortableContext>
                <DragOverlay>
                  {activeDragRoom ? (
                    <div style={{ transform: 'scale(1.05)', cursor: 'grabbing' }}>
                      <RoomCardContainer room={activeDragRoom}>
                        {/* Re-render content? Or just basic card? 
                               We need to render the content to make it look like the actual card being dragged.
                               Ideally we'd extract the card content to a component, but for now we can't easily replicate
                               the distinct children logic (Drag batches etc) without refactoring properly.
                               However, the SortableRoomItem usually wraps the content.
                               
                               Wait, the children of RoomCardContainer in the main loop contains the batch list.
                               If we don't render that, the drag overlay will be empty/different. 
    
                               For now, let's render a "Collapsed" version or just the Title/Header style 
                               because dragging a huge list is heavy. 
                               But the user expects the card.
                           */}
                        <div style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>{activeDragRoom.name}</h3>
                            </div>
                            {(() => {
                              const typeStyles: Record<string, { label: string, color: string, bg: string }> = {
                                vegetation: { label: 'VEGETACIÓN', color: '#22543d', bg: '#c6f6d5' },
                                flowering: { label: 'FLORA', color: '#975a16', bg: '#fbd38d' },
                                drying: { label: 'SECADO', color: '#c05621', bg: '#fffaf0' },
                                curing: { label: 'CURADO', color: '#c05621', bg: '#fffaf0' },
                                mother: { label: 'MADRES', color: '#553c9a', bg: '#e9d8fd' },
                                clones: { label: 'ESQUEJERA', color: '#234e52', bg: '#b2f5ea' },
                                germination: { label: 'GERMINACIÓN', color: '#7b341e', bg: '#feebc8' },
                                living_soil: { label: 'LIVING SOIL', color: '#155724', bg: '#d4edda' },
                              };
                              const style = typeStyles[activeDragRoom.type] || { label: activeDragRoom.type?.toUpperCase() || 'SALA', color: '#4a5568', bg: '#e2e8f0' };
                              return (
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '0.2rem', background: style.bg, color: style.color }}>
                                  {style.label}
                                </span>
                              );
                            })()}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                            <FaClock style={{ marginRight: '0.4rem' }} /> Arrastra y soltá para reordenar las salas
                          </div>
                        </div>
                      </RoomCardContainer>
                    </div>
                  ) : activeDragBatch ? (
                    <div style={{
                      padding: '0.5rem', background: 'white', border: '1px solid #3182ce',
                      borderRadius: '0.5rem', boxShadow: '0 5px 10px rgba(0,0,0,0.2)',
                      width: '250px', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{activeDragBatch.name}</span>
                      <span style={{ fontSize: '0.8rem' }}>({activeDragBatch.quantity}u)</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </FadeInWrapper>
        )}
      </div >

      {/* Move Confirmation Modal */}
      < ConfirmModal
        isOpen={moveConfirmState.isOpen}
        title="Confirmar Movimiento"
        message={
          moveConfirmState.batchIds && moveConfirmState.batchIds.length > 1
            ? `¿Estás seguro de mover ${moveConfirmState.batchIds.length} lotes a la sala seleccionada?`
            : `¿Estás seguro de mover el lote "${moveConfirmState.batch?.name}" a la sala seleccionada?`
        }
        onClose={() => setMoveConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeBatchMove}
        confirmText={moveConfirmState.batchIds && moveConfirmState.batchIds.length > 1 ? "Mover Lotes" : "Mover Lote"}
        cancelText="Cancelar"
      />

      {/* New Room Modal */}
      {/* Transplant Modal (New Layout) */}
      {
        isTransplantModalOpen && transplantRoom && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>Transplantar</h3>
                <CloseButton onClick={() => setIsTransplantModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>

              <FormGroup>
                <label>Lote a Transplantar</label>
                <select
                  value={transplantForm.batchId}
                  onChange={e => {
                    const batch = transplantRoom.batches.find((b: any) => b.id === e.target.value);
                    setTransplantForm(prev => ({
                      ...prev,
                      batchId: e.target.value,
                      quantity: batch ? batch.quantity : 0
                    }));
                  }}
                >
                  {transplantRoom.batches && transplantRoom.batches.length > 0 ? (
                    transplantRoom.batches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.quantity}u)</option>
                    ))
                  ) : (
                    <option value="">No hay lotes disponibles</option>
                  )}
                </select>
              </FormGroup>

              <FormGroup>
                <label>Sala de Destino</label>
                <select
                  value={transplantForm.targetRoomId}
                  onChange={e => setTransplantForm(prev => ({ ...prev, targetRoomId: e.target.value }))}
                >
                  <option value="">-- Seleccionar Sala --</option>
                  {rooms
                    .filter(r => r.id !== transplantRoom.id) // Exclude current room
                    .map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                    ))}
                </select>
              </FormGroup>

              <FormGroup>
                <label>Nuevo Medio de Cultivo</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Maceta', 'Bandeja', 'Bunker'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setTransplantForm(prev => ({ ...prev, medium: opt as any }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #e2e8f0',
                        background: transplantForm.medium === opt ? '#ebf8ff' : 'white',
                        color: transplantForm.medium === opt ? '#2b6cb0' : '#4a5568',
                        fontWeight: transplantForm.medium === opt ? 600 : 400,
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </FormGroup>

              <FormGroup>
                <label>Cantidad a Transplantar</label>
                <input
                  type="number"
                  min="1"
                  value={transplantForm.quantity}
                  onChange={e => setTransplantForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                />
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#718096' }}>
                  Si la cantidad es menor al total del lote, se dividirá en un nuevo lote.
                </small>
              </FormGroup>

              <PrimaryButton onClick={handleTransplantSave}>Confirmar Transplante</PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Batch Edit Modal */}
      {
        isBatchEditModalOpen && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>Editar Lote</h3>
                <CloseButton onClick={() => setIsBatchEditModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>
              <FormGroup>
                <label>Nombre del Lote</label>
                <input
                  type="text"
                  value={batchEditForm.name}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormGroup>
              <FormGroup>
                <label>Genética</label>
                <select
                  value={batchEditForm.geneticId}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, geneticId: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                >
                  <option value="">-- Seleccionar Genética --</option>
                  {genetics.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.type})</option>
                  ))}
                </select>
              </FormGroup>
              <FormGroup>
                <label>Cantidad (Unidades)</label>
                <input
                  type="number"
                  value={batchEditForm.quantity}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                />
              </FormGroup>
              <PrimaryButton onClick={handleSaveBatchEdit}>Guardar Cambios</PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Modal Nueva Sala */}
      {
        (isRoomModalOpen || isRoomModalClosing) && (
          <ModalOverlay isClosing={isRoomModalClosing}>
            <Modal isClosing={isRoomModalClosing}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#2d3748' }}>Nueva Sala</h3>
                <button
                  onClick={handleCloseRoomModal}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}
                >
                  &times;
                </button>
              </div>

              <FormGroup>
                <label>Nombre de la Sala</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="Ej: Sala Vege 1"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                />
              </FormGroup>

              {/* --- Date Logic --- */}
              <FormGroup>
                <label>Fecha de Inicio del Cultivo</label>
                <CustomDatePicker
                  selected={roomForm.startDate ? new Date(roomForm.startDate + 'T12:00:00') : new Date()}
                  onChange={(date) => {
                    const dateStr = date ? date.toISOString().split('T')[0] : '';
                    setRoomForm({ ...roomForm, startDate: dateStr });
                  }}
                  dateFormat="dd/MM/yyyy"
                />
              </FormGroup>

              {roomForm.type !== 'living_soil' && (
                <FormGroup>
                  <label>Días de Funcionamiento <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="number"
                    placeholder="Ej: 30"
                    value={roomForm.operationalDays || ''}
                    onChange={e => setRoomForm({ ...roomForm, operationalDays: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <small style={{ display: 'block', marginTop: '0.25rem', color: '#718096' }}>
                    Definir la duración del ciclo para activar las alertas.
                  </small>
                </FormGroup>
              )}

              <FormGroup>
                <label>Fase de Cultivo</label>
                <CustomSelect
                  value={roomForm.type}
                  onChange={(value) => setRoomForm({ ...roomForm, type: value as any })}
                  options={[
                    { value: "vegetation", label: "Vegetación" },
                    { value: "flowering", label: "Floración" },

                    { value: "curing", label: "Secado" },
                    { value: "clones", label: "Esquejera/Clones" },
                    { value: "living_soil", label: "Agro/Living Soil" }
                  ]}
                />
              </FormGroup>

              <ModalActions>
                <Button $variant="secondary" onClick={handleCloseRoomModal}>Cancelar</Button>
                <Button onClick={handleCreateRoom} disabled={isCreatingRoom} $variant="primary">{isCreatingRoom ? 'Creando...' : 'Crear Sala'}</Button>
              </ModalActions>
            </Modal>
          </ModalOverlay>
        )}

      {/* Color Picker Modal */}
      {
        isColorPickerOpen && (
          <ModalOverlay>

            <Modal onClick={e => e.stopPropagation()} style={{ maxWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Elegir Color</h3>
                <button
                  onClick={() => setIsColorPickerOpen(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#a0aec0' }}
                >
                  &times;
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', padding: '1rem 0', flexWrap: 'wrap' }}>
                {['green', 'blue', 'purple', 'orange', 'red', 'pink', 'teal', 'cyan', 'yellow', 'gray'].map(color => (
                  <button
                    key={color}
                    onClick={() => handleUpdateColor(color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: getColorHex(color),
                      border: crop.color === color ? '3px solid #cbd5e0' : 'none',
                      cursor: 'pointer',
                      transform: crop.color === color ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Monthly View */}




      {
        isModalOpen && selectedDate && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>{format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}</h3>
                <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>

              <TabGroup>
                <Tab active={activeTab === 'task'} onClick={() => setActiveTab('task')}>Nueva Tarea</Tab>
                <Tab active={activeTab === 'log'} onClick={() => setActiveTab('log')}>Diario de Cultivo</Tab>
              </TabGroup>

              {activeTab === 'task' ? (
                <>
                  {/* Task List for the Day */}
                  {selectedDayTasks.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#718096' }}>Tareas Programadas:</h4>
                      {selectedDayTasks.map(task => (
                        <div key={task.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: '#f7fafc', padding: '0.5rem', borderRadius: '0.375rem', marginBottom: '0.5rem',
                          opacity: task.status === 'done' ? 0.7 : 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <button
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: task.status === 'done' ? '#38a169' : '#cbd5e0', padding: 0, display: 'flex' }}
                              title={task.status === 'done' ? 'Marcar como pendiente' : 'Marcar como completada'}
                            >
                              {task.status === 'done' ? <FaCheckCircle size={18} /> : <FaRegCircle size={18} />}
                            </button>
                            <span style={{
                              fontWeight: 500,
                              color: '#2d3748',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none'
                            }}>
                              {task.title}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditTask(task)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#4299e1' }}>
                              <FaEdit />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#e53e3e' }}>
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 1rem 0', color: '#2d3748' }}>
                    {editingTaskId ? 'Editar Tarea' : 'Agendar Nueva Tarea'}
                    {editingTaskId && <button onClick={() => { setEditingTaskId(null); setTaskForm({ title: '', type: 'info', description: '' }); }} style={{ marginLeft: '1rem', fontSize: '0.8rem', color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer' }}>Cancelar Edición</button>}
                  </h4>

                  <FormGroup>
                    <label>Tipo</label>
                    <select
                      value={taskForm.type}
                      onChange={e => {
                        const newType = e.target.value as any;

                        // Auto-set title based on type label
                        const typeLabels: { [key: string]: string } = {
                          'info': 'Nota Informativa',
                          'warning': 'Alerta',
                          'danger': 'Urgente',
                          'fertilizante': 'Fertilizante',
                          'defoliacion': 'Defoliación',
                          'poda_apical': 'Poda Apical',
                          'hst': 'HST (High Stress)',
                          'lst': 'LST (Low Stress)',
                          'enmienda': 'Enmienda',
                          'te_compost': 'Té de Compost',
                          'agua': 'Agua / Riego',
                          'esquejes': 'Esquejes'
                        };

                        setTaskForm(prevForm => ({
                          ...prevForm,
                          type: newType,
                          title: typeLabels[newType] || 'Tarea'
                        }));
                      }}
                    >
                      <option value="info">Info / Atención</option>
                      <option value="fertilizante">Fertilizante</option>
                      <option value="defoliacion">Defoliación</option>
                      <option value="poda_apical">Poda Apical</option>
                      <option value="hst">HST (High Stress Training)</option>
                      <option value="lst">LST (Low Stress Training)</option>
                      <option value="enmienda">Enmienda</option>
                      <option value="te_compost">Té de Compost</option>
                      <option value="agua">Agua / Riego</option>
                      <option value="esquejes">Esquejes</option>
                      <option value="warning">Alerta (Warning)</option>
                      <option value="danger">Urgente (Danger)</option>
                    </select>
                  </FormGroup>

                  <FormGroup>
                    <label>Descripción (Opcional)</label>
                    <textarea
                      value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </FormGroup>

                  {/* Recurrence Section */}
                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#2d3748', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={recurrenceEnabled}
                        onChange={e => setRecurrenceEnabled(e.target.checked)}
                        style={{ transform: 'scale(1.2)' }}
                      />
                      Repetir Tarea (Periodicidad)
                    </label>

                    {recurrenceEnabled && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '0.5rem', border: '1px solid #edf2f7' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#718096' }}>Repetir cada:</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="number"
                                min="1"
                                value={recurrenceConfig.interval}
                                onChange={e => setRecurrenceConfig(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                                style={{ width: '60px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e0' }}
                              />
                              <select
                                value={recurrenceConfig.unit}
                                onChange={e => setRecurrenceConfig(prev => ({ ...prev, unit: e.target.value as any, type: 'custom' }))}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e0' }}
                              >
                                <option value="day">Días</option>
                                <option value="week">Semanas</option>
                                <option value="month">Meses</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {recurrenceConfig.unit === 'week' && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: '#718096' }}>Se repite el:</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                                      width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                                      background: isSelected ? '#3182ce' : '#e2e8f0',
                                      color: isSelected ? 'white' : '#4a5568',
                                      fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem'
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
                    )}
                  </div>
                </>
              ) : (
                <FormGroup>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Notas del Día</label>
                    {existingLogId && (
                      <button onClick={handleDeleteLog} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                        <FaTrash /> Eliminar Registro
                      </button>
                    )}
                  </div>
                  <textarea
                    value={logForm.notes}
                    onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
                    placeholder="¿Cómo se ve la planta hoy? ¿Alguna plaga? ¿Crecimiento?"
                    style={{ minHeight: '200px' }}
                  />
                </FormGroup>
              )}

              <PrimaryButton onClick={handleSave}>Guardar</PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Finish Crop Modal */}
      {
        isFinishModalOpen && roomToFinish && (
          <ModalOverlay>
            <Modal onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h3>🎉 Finalizar Cultivo</h3>
                <CloseButton onClick={() => setIsFinishModalOpen(false)}>&times;</CloseButton>
              </ModalHeader>
              <div style={{ padding: '1rem', color: '#4a5568' }}>
                <p style={{ marginBottom: '1rem' }}>
                  ¡Felicitaciones! Estás a punto de cerrar el ciclo de la sala <strong>{roomToFinish.name}</strong>.
                  <br />Por favor, registra el rendimiento final obtenido.
                </p>

                <FormGroup>
                  <label>Rendimiento por Lote ({harvestForm.unit}) <span style={{ color: 'red' }}>*</span></label>

                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <select
                      value={harvestForm.unit}
                      onChange={(e) => setHarvestForm({ ...harvestForm, unit: e.target.value as 'g' | 'kg' })}
                      style={{ width: '80px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                    >
                      <option value="g">Gramos (g)</option>
                      <option value="kg">Kilos (kg)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {roomToFinish.batches && roomToFinish.batches.map((batch: any) => (
                      <div key={batch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f7fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #edf2f7' }}>
                        <div>
                          <strong style={{ color: '#2d3748', display: 'block' }}>{batch.name}</strong>
                          <small style={{ color: '#718096' }}>{batch.genetic?.name || 'Genética Desconocida'}</small>
                        </div>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={harvestForm.batchYields[batch.id] || ''}
                          onChange={(e) => setHarvestForm({
                            ...harvestForm,
                            batchYields: {
                              ...harvestForm.batchYields,
                              [batch.id]: e.target.value
                            }
                          })}
                          style={{ width: '100px', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e0' }}
                        />
                      </div>
                    ))}
                    {(!roomToFinish.batches || roomToFinish.batches.length === 0) && (
                      <p style={{ color: '#e53e3e', fontStyle: 'italic' }}>No hay lotes registrados en esta sala.</p>
                    )}
                  </div>
                </FormGroup>

                <FormGroup>
                  <label>Notas Adicionales (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Comentarios sobre la calidad, problemas, etc."
                    value={harvestForm.notes}
                    onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Foto del Producto Final (Opcional)</label>
                  <FileUploadBox onClick={() => document.getElementById('harvest-photo-upload')?.click()}>
                    {harvestPhoto ? (
                      <div style={{ color: 'green', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <FaCheckCircle /> {harvestPhoto.name}
                      </div>
                    ) : (
                      <div style={{ color: '#718096' }}>
                        <FaFileUpload size={24} style={{ marginBottom: '0.5rem' }} />
                        <p>Hacé click para subir foto</p>
                      </div>
                    )}
                    <input
                      id="harvest-photo-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setHarvestPhoto(e.target.files[0]);
                        }
                      }}
                    />
                  </FileUploadBox>
                </FormGroup>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <Button $variant="secondary" onClick={() => setIsFinishModalOpen(false)}>Cancelar</Button>
                  <Button $variant="primary" onClick={handleConfirmFinish} style={{ background: '#38a169', borderColor: '#38a169' }}>
                    ✅ Guardar y Finalizar
                  </Button>
                </div>
              </div>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Rename Modal */}
      <PromptModal
        isOpen={editModalOpen}
        title={editType === 'room' ? "Renombrar Sala" : "Renombrar Spot"}
        initialValue={editData?.name || ''}
        placeholder="Nuevo nombre..."
        onClose={() => setEditModalOpen(false)}
        onConfirm={handleConfirmEditName}
        confirmButtonColor="green"
      />

      {
        crop && (
          <DeleteProtectionModal
            isOpen={isDeleteProtectionOpen}
            itemType="Cultivo"
            itemName={crop.name}
            onClose={() => setIsDeleteProtectionOpen(false)}
            onConfirm={executeDeleteCrop}
          />
        )
      }

      <QRCodeModal
        isOpen={qrModalOpen}
        value={qrValue}
        title={qrTitle}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Confirm Delete Room Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Eliminar Sala"
        message={`¿Estás seguro de que deseas eliminar la sala "${roomToDelete?.name}"? Se perderán todos los datos asociados.`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDeleteRoom}
        confirmText="Eliminar"
        isDanger
        isLoading={isDeletingRoom}
      />

      {/* Confirm Delete Batch Modal */}
      <ConfirmModal
        isOpen={isDeleteBatchConfirmOpen}
        title="Eliminar Lote"
        message={`¿Estás seguro de que deseas eliminar el lote "${batchToDelete?.name}"? Esta acción no se puede deshacer.`}
        onClose={() => setIsDeleteBatchConfirmOpen(false)}
        onConfirm={executeDeleteBatch}
        confirmText="Eliminar Lote"
        isDanger
      />

      {/* Old Transplant Modal removed */}

      {/* Assign Clone Batch Modal */}
      {
        isAssignModalOpen && assignRoom && (
          <ModalOverlay>
            <Modal>
              <ModalHeader>
                <h3>Asignar Lote a {assignRoom.name}</h3>
                <CloseButton onClick={() => setIsAssignModalOpen(false)}><FaTimes /></CloseButton>
              </ModalHeader>
              <p style={{ color: '#718096', marginBottom: '1.5rem' }}>Selecciona un lote de esquejes disponible para mover a esta sala.</p>

              <FormGroup>
                <label>Lote de Esquejes</label>
                <select
                  value={selectedBatchId}
                  onChange={e => {
                    setSelectedBatchId(e.target.value);
                    const batch = availableCloneBatches.find(b => b.id === e.target.value);
                    if (batch) setAssignQuantity(batch.quantity);
                  }}
                >
                  <option value="">Seleccionar Lote...</option>
                  {availableCloneBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} - {b.genetic?.name || 'Genética Desconocida'} ({b.quantity}u)
                    </option>
                  ))}
                  {availableCloneBatches.length === 0 && <option disabled>No hay lotes de esquejes disponibles</option>}
                </select>
              </FormGroup>

              {selectedBatchId && (() => {
                const batch = availableCloneBatches.find(b => b.id === selectedBatchId);
                if (!batch) return null;
                return (
                  <FormGroup>
                    <label>Cantidad a Asignar (Total: {batch.quantity})</label>
                    <input
                      type="number"
                      min="1"
                      max={batch.quantity}
                      value={assignQuantity}
                      onChange={e => setAssignQuantity(Math.min(batch.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.25rem' }}>
                      {assignQuantity < batch.quantity
                        ? `Se moverán ${assignQuantity} esquejes. Quedarán ${batch.quantity - assignQuantity} en el lote original.`
                        : 'Se moverá todo el lote a la sala.'}
                    </div>
                  </FormGroup>
                );
              })()}

              <PrimaryButton onClick={handleConfirmAssign} disabled={!selectedBatchId || isAssigning}>
                {isAssigning ? 'Procesando...' : 'Confirmar Asignación'}
              </PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Success Modal (for assignment) */}
      {
        isSuccessModalOpen && (
          <ModalOverlay onClick={() => setIsSuccessModalOpen(false)}>
            <Modal style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: '#48bb78', fontSize: '3rem', marginBottom: '1rem' }}>
                <FaCheckCircle />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>¡Éxito!</h3>
              <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                El lote de esquejes ha sido asignado correctamente.
              </p>
              <PrimaryButton onClick={() => setIsSuccessModalOpen(false)} style={{ margin: '0 auto', width: 'fit-content', padding: '0.5rem 2rem' }}>
                Aceptar
              </PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Error Modal */}
      {
        isErrorModalOpen && (
          <ModalOverlay onClick={() => setIsErrorModalOpen(false)}>
            <Modal style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
              <div style={{ color: '#e53e3e', fontSize: '3rem', marginBottom: '1rem' }}>
                <FaTimes />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#2d3748', marginBottom: '0.5rem' }}>Error</h3>
              <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
                {errorMessage}
              </p>
              <PrimaryButton onClick={() => setIsErrorModalOpen(false)} style={{ margin: '0 auto', width: 'fit-content', padding: '0.5rem 2rem', background: '#e53e3e' }}>
                Cerrar
              </PrimaryButton>
            </Modal>
          </ModalOverlay>
        )
      }

      {/* Styled Change Stage Confirmation Modal */}
      {
        isConfirmModalOpen && pendingStageChange && (
          <ModalOverlay onClick={() => setIsConfirmModalOpen(false)}>
            <ConfirmModalContent onClick={e => e.stopPropagation()}>
              <h3>
                {pendingStageChange.nextStage === 'flowering' ? '🌺 Pasar a Floración' : '✂️ Pasar a Cosecha'}
              </h3>
              <p>
                ¿Estás seguro que deseas {pendingStageChange.nextStage === 'flowering' ? 'cambiar a fase de Floración' : 'cosechar esta sala'}?
                <br />
                Esta acción actualizará el estado y las fechas del ciclo.
              </p>
              <div className="actions">
                <button className="cancel" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                <button className="confirm" onClick={executeStageChange}>Confirmar</button>
              </div>
            </ConfirmModalContent>
          </ModalOverlay>
        )
      }

      {/* Toast Modal */}
      <ToastModal
        isOpen={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </Container >
  );
};

export default CropDetail;
