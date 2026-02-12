import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import { Batch, BatchStage } from '../../types/rooms';
import { FaSeedling, FaLeaf, FaCannabis, FaCheckCircle, FaExclamationTriangle, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { getGeneticColor } from '../../utils/geneticColors';

// --- Styled Components ---

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  width: fit-content;
`;

const ZoomButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #718096;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  &:hover {
    background: #edf2f7;
    color: #2d3748;
  }
`;

const ZoomLabel = styled.span`
  font-size: 0.75rem;
  color: #718096;
  font-family: monospace;
  min-width: 3rem;
  text-align: center;
`;

const GridContainer = styled.div<{ rows: number; cols: number; cellSize: number }>`
  display: grid;
  grid-template-columns: 40px repeat(${p => Number(p.cols)}, ${p => Number(p.cellSize)}px);
  grid-template-rows: 40px repeat(${p => Number(p.rows)}, ${p => Number(p.cellSize)}px);
  grid-auto-rows: ${p => Number(p.cellSize)}px; 
  gap: ${p => p.cellSize < 40 ? '1px' : '0.5rem'};
  overflow: auto;
  max-width: 100%;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  margin: 0 auto;
`;

const HeaderCell = styled.div<{ cellSize: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #718096;
  background: #edf2f7;
  border-radius: ${p => p.cellSize < 40 ? '2px' : '0.5rem'};
  font-size: ${p => p.cellSize < 40 ? '0.6rem' : '1rem'};
`;

const getStageColor = (stage: BatchStage | undefined) => {
    switch (stage) {
        case 'seedling': return '#ebf8ff'; // Blue-ish
        case 'vegetation': return '#c6f6d5'; // Green
        case 'flowering': return '#fed7d7'; // Red/Pink
        case 'drying': return '#ed8936'; // Orange
        case 'completed': return '#cbd5e0'; // Grey
        default: return '#ffffff';
    }
}

const getStageIcon = (stage: BatchStage | undefined) => {
    switch (stage) {
        case 'seedling': return <FaSeedling style={{ color: '#2b6cb0' }} />;
        case 'vegetation': return <FaLeaf style={{ color: '#2f855a' }} />;
        case 'flowering': return <FaCannabis style={{ color: '#c53030' }} />;
        case 'completed': return <FaCheckCircle style={{ color: '#4a5568' }} />;
        default: return <FaExclamationTriangle style={{ color: '#ecc94b' }} />;
    }
}

const CellStyled = styled.div<{ $isOver?: boolean; $isOccupied?: boolean; $stage?: BatchStage; $geneticColor?: string; $isSelected?: boolean; cellSize: number }>`
  background: ${p => p.$isSelected ? '#48bb78' : p.$isOccupied ? (p.$geneticColor || getStageColor(p.$stage)) : p.$isOver ? '#ebf8ff' : 'white'};
  border: ${p => p.cellSize < 40
        ? (p.$isSelected ? '2px solid #000' : '1px solid ' + (p.$isOccupied ? 'rgba(0,0,0,0.1)' : '#e2e8f0'))
        : (p.$isSelected ? '3px solid #000' : '2px ' + (p.$isOccupied ? 'solid ' + (p.$stage === 'flowering' ? '#fc8181' : '#c6f6d5') : 'dashed #cbd5e0'))
    };
  border-radius: ${p => p.cellSize < 40 ? '2px' : '0.5rem'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.1s;
  cursor: ${p => p.$isOccupied ? 'pointer' : 'default'};
  opacity: ${p => p.$stage === 'completed' ? 0.6 : 1};
  width: 100%;
  height: 100%;
  overflow: hidden;

  &:hover {
    border-color: #3182ce;
    z-index: 10;
    transform: ${p => p.cellSize < 40 ? 'scale(1.2)' : p.$isOccupied ? 'scale(1.05)' : 'none'};
    box-shadow: ${p => p.cellSize < 40 ? '0 0 0 1px #3182ce' : p.$isOccupied ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'};
    overflow: visible; /* Show content on hover */
  }
`;

const BatchItemStyled = styled.div`
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
`;

const BatchItem = ({ batch, cellSize }: { batch: Batch; cellSize: number }) => {
    // Standard View - Increase threshold to avoid overlap
    if (cellSize >= 55) {
        return (
            <BatchItemStyled>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>
                    {getStageIcon(batch.stage)}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1, color: '#2d3748' }}>
                    {batch.tracking_code || batch.name}
                </span>
                <small style={{ fontSize: '0.6rem', color: '#4a5568', background: 'rgba(255,255,255,0.6)', borderRadius: '4px', padding: '0 2px' }}>
                    {batch.genetic?.name?.substring(0, 10)}
                </small>
            </BatchItemStyled>
        );
    }

    // Compact/Minesweeper View (Color Only)
    return <div style={{ width: '100%', height: '100%' }} />;
};

// --- Helper Functions ---
const getRowLabel = (index: number) => {
    // Support AA, AB, etc for large grids if needed, but for now A-Z is standard for small.
    // Enhanced Row Label for large grids: A..Z, AA..AZ, BA..BZ
    let label = "";
    let i = index;
    do {
        label = String.fromCharCode(65 + (i % 26)) + label;
        i = Math.floor(i / 26) - 1;
    } while (i >= 0);
    return label;
};

// --- Cell Component ---
const GridCell = React.memo(({ row, col, batch, onClick, isSelected, cellSize }: { row: number; col: number; batch?: Batch, onClick: (b: Batch | null, pos: string) => void, isSelected?: boolean; cellSize: number }) => {
    const positionId = `${getRowLabel(row)}${col + 1}`;

    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${positionId}`,
        data: { type: 'living-soil-cell', position: positionId }
    });

    return (
        <CellStyled
            ref={setNodeRef}
            $isOver={isOver}
            $isOccupied={!!batch}
            $stage={batch?.stage}
            $geneticColor={batch ? getGeneticColor(batch.genetic?.name || batch.name).bg : undefined}
            $isSelected={isSelected}
            cellSize={cellSize}
            onClick={() => onClick(batch || null, positionId)}
            title={batch ? `${batch.tracking_code || batch.name} - ${batch.genetic?.name || 'Clon'} - ${batch.stage}` : `Vacío: ${positionId}`}
        >
            {/* Position Label (Top-Left) - Hide in small mode */}
            {cellSize >= 40 && (
                <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.6rem', color: '#718096', fontWeight: 'bold', opacity: 0.7 }}>
                    {positionId}
                </span>
            )}

            {batch && <BatchItem batch={batch} cellSize={cellSize} />}
        </CellStyled>
    );
}, (prev, next) => {
    // Custom comparison for performance
    return (
        prev.isSelected === next.isSelected &&
        prev.cellSize === next.cellSize &&
        prev.batch === next.batch &&
        prev.onClick === next.onClick // Ensure onClick is stable!
    );
});

interface LivingSoilGridProps {
    rows: number;
    cols: number;
    batches: Batch[];
    onBatchClick: (batch: Batch | null, position?: string) => void;
    selectedBatchIds?: Set<string>;
    onSelectionChange?: (selectedIds: Set<string>) => void;
    isSelectionMode?: boolean;
    mapId?: string;
}

export const LivingSoilGrid: React.FC<LivingSoilGridProps> = ({ rows, cols, batches, onBatchClick, selectedBatchIds, onSelectionChange, isSelectionMode, mapId }) => {
    // Helper to calculate zoom based on grid size
    const calculateZoom = (c: number, r: number) => {
        if (c > 25) return 20; // High Density
        if (c > 15) return 50; // Medium
        return 80; // Standard
    };

    // Zoom State - Initialize with stored value or calculated default
    const [cellSize, setCellSize] = useState(() => {
        if (mapId) {
            const saved = localStorage.getItem(`zoom_level_${mapId}`);
            if (saved) return Number(saved);
        }
        return calculateZoom(cols, rows);
    });

    // Internal Selection State for Dragging
    const [isDraggingSelect, setIsDraggingSelect] = useState(false);
    const [dragStart, setDragStart] = useState<{ r: number, c: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ r: number, c: number } | null>(null);

    // Persist zoom changes
    useEffect(() => {
        if (mapId) {
            localStorage.setItem(`zoom_level_${mapId}`, String(cellSize));
        }
    }, [cellSize, mapId]);

    // Only reset zoom if map dimensions change drastically AND no saved pref exists?
    // Actually, if we have a saved pref, we should probably respect it unless the user explicitly resets?
    // Let's rely on the initializer.
    // If cols/rows change, we might want to *re-evaluate* default, but only if it wasn't manually set?
    // Current behavior: useEffect resets it. 
    // New behavior: If mapId changes, the component remounts or updates.
    // We should listen to mapId changes to reset state if needed, but the key prop usually handles remounts.

    // Removing the auto-reset effect based on cols/rows to prevent "reset on data reload"
    // Instead, rely on mapId change to re-initialize (if key changes) or effect.
    // If the component is NOT re-mounted when mapId changes (unlikely if key is proper), we need an effect.
    useEffect(() => {
        if (mapId) {
            const saved = localStorage.getItem(`zoom_level_${mapId}`);
            if (saved) {
                setCellSize(Number(saved));
                return;
            }
        }
        // Fallback or if no saved data, ensure meaningful default
        // But do NOT force reset if we just refreshed data with same cols/rows
    }, [mapId]); // Only triggered when map changes, not when cols/rows update with same mapId


    // Zoom Handlers
    const handleZoomIn = () => setCellSize(p => Math.min(p + 10, 120));
    const handleZoomOut = () => setCellSize(p => Math.max(p - 10, 15));

    // --- Selection Logic ---

    const getBatchIdAt = useCallback((r: number, c: number) => {
        const pos = `${getRowLabel(r)}${c + 1}`;
        const batch = batches.find(b => b.grid_position === pos);
        return batch ? batch.id : null;
    }, [batches]);

    const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
        if (!isSelectionMode) return;
        // Prevent text selection
        e.preventDefault();

        // Capture modifier key state if needed for "click" logic vs drag
        setIsDraggingSelect(true);
        setDragStart({ r, c });
        setDragEnd({ r, c });
    };

    const handleMouseEnter = (r: number, c: number) => {
        if (!isDraggingSelect || !isSelectionMode) return;
        setDragEnd({ r, c });
    };

    // Global Mouse Up
    useEffect(() => {
        const onGlobalMouseUp = (e: MouseEvent) => {
            if (isDraggingSelect) {
                // We can check modifiers here!
                const isAdditive = e.shiftKey || e.metaKey || e.ctrlKey;

                if (!dragStart || !dragEnd) return;

                const minR = Math.min(dragStart.r, dragEnd.r);
                const maxR = Math.max(dragStart.r, dragEnd.r);
                const minC = Math.min(dragStart.c, dragEnd.c);
                const maxC = Math.max(dragStart.c, dragEnd.c);

                const selectionInRect = new Set<string>();
                for (let r = minR; r <= maxR; r++) {
                    for (let c = minC; c <= maxC; c++) {
                        const bId = getBatchIdAt(r, c);
                        if (bId) selectionInRect.add(bId);
                    }
                }

                if (isAdditive && selectedBatchIds) {
                    const combined = new Set(selectedBatchIds);
                    selectionInRect.forEach(id => combined.add(id));
                    onSelectionChange?.(combined);
                } else {
                    onSelectionChange?.(selectionInRect);
                }
            }

            setIsDraggingSelect(false);
            setDragStart(null);
            setDragEnd(null);
        };

        window.addEventListener('mouseup', onGlobalMouseUp);
        return () => window.removeEventListener('mouseup', onGlobalMouseUp);
    }, [isDraggingSelect, dragStart, dragEnd, selectedBatchIds, batches, getBatchIdAt, onSelectionChange]); // Dep array updated



    // Calculate Selection Box Style
    const getSelectionBoxStyle = () => {
        if (!dragStart || !dragEnd) return null;

        const minR = Math.min(dragStart.r, dragEnd.r);
        const maxR = Math.max(dragStart.r, dragEnd.r);
        const minC = Math.min(dragStart.c, dragEnd.c);
        const maxC = Math.max(dragStart.c, dragEnd.c);

        const headerSize = 40;
        const gap = cellSize < 40 ? 1 : 8; // 0.5rem approx 8px

        const top = headerSize + minR * (cellSize + gap);
        const left = headerSize + minC * (cellSize + gap);
        const width = (maxC - minC + 1) * cellSize + (maxC - minC) * gap;
        const height = (maxR - minR + 1) * cellSize + (maxR - minR) * gap;

        return {
            position: 'absolute' as 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            backgroundColor: 'rgba(66, 153, 225, 0.3)',
            border: '1px solid #4299e1',
            pointerEvents: 'none' as 'none', // Allow clicks to pass through if needed, but mainly visual
            zIndex: 100,
        };
    };

    // Stable Click Handler for GridCell
    const handleCellClick = useCallback((b: Batch | null, p: string) => {
        if (!isSelectionMode) onBatchClick(b, p);
    }, [isSelectionMode, onBatchClick]);


    // Grid Construction
    const grid = [];

    // Header Row (Column Numbers)
    grid.push(<div key="corner" />); // Empty corner
    for (let c = 0; c < cols; c++) {
        grid.push(<HeaderCell key={`h-col-${c}`} cellSize={cellSize}>{c + 1}</HeaderCell>);
    }

    const batchesMap = new Map<string, Batch>();
    batches.forEach(b => {
        if (b.grid_position) batchesMap.set(b.grid_position, b);
    });

    for (let r = 0; r < rows; r++) {
        // Row Header (Letters)
        grid.push(<HeaderCell key={`h-row-${r}`} cellSize={cellSize}>{getRowLabel(r)}</HeaderCell>);

        for (let c = 0; c < cols; c++) {
            const pos = `${getRowLabel(r)}${c + 1}`;
            const batch = batchesMap.get(pos);
            const isSelected = batch && selectedBatchIds ? selectedBatchIds.has(batch.id) : false;

            grid.push(
                <div
                    key={pos}
                    onMouseDown={(e) => handleMouseDown(r, c, e)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    style={{ width: '100%', height: '100%' }} // Wrapper for events
                >
                    <GridCell
                        row={r}
                        col={c}
                        batch={batch}
                        onClick={handleCellClick}
                        isSelected={isSelected}
                        cellSize={cellSize}
                    />
                </div>
            );
        }
    }

    return (
        <div>
            {/* Zoom Controls */}
            <ControlsContainer>
                <ZoomButton onClick={handleZoomOut} title="Alejar"><FaSearchMinus /></ZoomButton>
                <ZoomLabel>{cellSize}px</ZoomLabel>
                <ZoomButton onClick={handleZoomIn} title="Acercar"><FaSearchPlus /></ZoomButton>
            </ControlsContainer>

            <GridContainer rows={Number(rows)} cols={Number(cols)} cellSize={Number(cellSize)} className="noselect" style={{ position: 'relative' }}>
                {isDraggingSelect && dragStart && dragEnd && (
                    <div style={getSelectionBoxStyle() || {}} />
                )}
                {grid}
            </GridContainer>
        </div>
    );
};
