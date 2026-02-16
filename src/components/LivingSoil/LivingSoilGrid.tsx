import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import { Batch, BatchStage } from '../../types/rooms';
import { FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { getGeneticColor } from '../../utils/geneticColors';
import { useGridSelection } from '../../hooks/useGridSelection';

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
  gap: ${p => p.cellSize < 40 ? '1px' : '4px'}; /* Pixel Perfect Gap */
  overflow: auto;
  max-width: 100%;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  margin: 0 auto;
  
  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: #edf2f7;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
    &:hover {
      background: #a0aec0;
    }
  }

  @media print {
    overflow: visible !important;
    border: none;
    box-shadow: none;
    max-width: none;
    display: grid !important;
  }
`;

const HeaderCell = styled.div<{ cellSize: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #718096;
  background: #edf2f7;
  border-radius: ${p => p.cellSize < 40 ? '1px' : '0.375rem'};
  font-size: ${p => p.cellSize < 40 ? '0.6rem' : '0.85rem'};
  width: 100%;
  height: 100%;
  /* No margin needed with real grid-gap */
`;

const getStageBorderColor = (stage: BatchStage | undefined) => {
    switch (stage) {
        case 'seedling': return '#4299E1'; // Blue
        case 'vegetation': return '#48BB78'; // Green
        case 'flowering': return '#D53F8C'; // Magenta
        case 'drying': return '#ED8936'; // Orange
        case 'curing': return '#9F7AEA'; // Purple
        case 'completed': return '#718096'; // Grey
        default: return '#e2e8f0'; // Default gray
    }
}

// Keep getStageIcon for legacy or tooltips if needed, but we won't use it in the grid cell main view anymore.
// Or we can remove it if unused. Let's keep it for now in case we need it elsewhere.
// getStageIcon removed as it was unused.


// --- Styled Components ---

const CellStyled = styled.div<{ $isOver?: boolean; $isOccupied?: boolean; $stage?: BatchStage; $geneticColor?: string; $isSelected?: boolean; cellSize: number; $hasAlert?: boolean; $disableTransition?: boolean }>`
  /* Background Logic */
  background: ${p => p.$isSelected ? '#48bb78' : p.$isOccupied ? (p.$geneticColor || '#ffffff') : p.$isOver ? '#ebf8ff' : 'white'};
  
  /* Border Logic - Simplified for cleaner look with gap */
  border: ${p => p.$isSelected
        ? '2px solid #2f855a' // Darker green for selection
        : p.cellSize < 40
            ? '1px solid ' + (p.$isOccupied ? getStageBorderColor(p.$stage) : '#e2e8f0')
            : '2px ' + (p.$isOccupied ? 'solid ' + getStageBorderColor(p.$stage) : 'dashed #e2e8f0')
    };
  
  box-sizing: border-box;
  border-radius: ${p => p.cellSize < 40 ? '1px' : '0.5rem'}; /* Matches Gap */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: ${p => p.$disableTransition ? 'none' : 'transform 0.1s, box-shadow 0.1s'};
  cursor: ${p => p.$isOccupied ? 'pointer' : 'default'};
  opacity: ${p => p.$stage === 'completed' ? 0.6 : 1};
  width: 100%;
  height: 100%;
  overflow: hidden; /* visual polish: clip overflow content */
  
  /* Dynamic Font Sizing Base */
  font-size: ${p => Math.max(8, p.cellSize * 0.25)}px;

  /* Alert Overlay Logic */
  ${p => p.$hasAlert && `
    &::after {
      content: '';
      position: absolute;
      top: 2px; right: 2px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #e53e3e;
      box-shadow: 0 0 0 2px white;
      z-index: 5;
    }
  `}

  /* Drag Over State */
  ${p => p.$isOver && `
    border: 2px dashed #48bb78;
    background-color: #f0fff4;
    transform: scale(0.98);
    z-index: 20;
  `}

  /* Hover Effects */
  &:hover {
    z-index: 10; 
    transform: ${p => p.cellSize < 40 ? 'none' : 'translateY(-2px)'};
    box-shadow: ${p => p.cellSize < 40 ? 'none' : '0 4px 6px rgba(0,0,0,0.1)'};
    border-color: ${p => p.$isSelected ? '#276749' : '#3182ce'};
  }
`;

const BatchItemStyled = styled.div<{ cellSize: number }>`
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px;
  /* Top padding for positioning label space if needed, otherwise center */
  padding-top: ${p => p.cellSize >= 60 ? '12px' : '0'};
`;



const BatchItem = ({ batch, cellSize }: { batch: Batch; cellSize: number }) => {
    // Dynamic Scaled View
    // User Request: 100px = Full Detail (ID + Badge) - Icon Removed
    // As it gets smaller -> Compress/Hide.

    // Thresholds:
    // < 30px: Color only (Minesweeper)
    // 30px - 59px: Position ID Only (Handled in GridCell, BatchItem returns null)
    // >= 60px: ID (+ Badge at 75px)

    if (cellSize < 60) {
        return null;
    }

    return (
        <BatchItemStyled cellSize={cellSize}>
            {/* Tracking Code - Central Focus now */}
            <span style={{
                fontSize: cellSize < 75 ? '0.6em' : '0.55em',
                fontWeight: '700',
                textAlign: 'center',
                lineHeight: 1.1,
                color: '#2d3748',
                // Removed text-shadow for cleaner look
                // Added background pill for better contrast against genetic colors
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(1px)',
                padding: '1px 4px',
                borderRadius: '4px',

                // Fixed: Allow tracking code to be fully visible
                whiteSpace: cellSize >= 80 ? 'normal' : 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '2px',
                wordBreak: 'break-word',
                maxWidth: '95%'
            }}>
                {batch.tracking_code || batch.name}
            </span>

            {/* Genetic Badge - Visible >= 75px */}
            {cellSize >= 75 && (
                <div style={{
                    fontSize: '0.4em',
                    fontWeight: '600',
                    color: '#4a5568', // Darker text
                    backgroundColor: 'rgba(255,255,255,0.85)', // Lighter bg
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '999px',
                    padding: '2px 6px',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    letterSpacing: '0.01em',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    {batch.genetic?.name}
                </div>
            )}
        </BatchItemStyled>
    );
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
// --- Floating Tooltip Component ---

const FloatingTooltipContainer = styled.div<{ isVisible: boolean }>`
  position: fixed; /* Fixed to viewport */
  z-index: 9999; /* Highest priority */
  pointer-events: none; /* Do not block mouse events */
  background: #2D3748;
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  width: max-content;
  max-width: 250px;
  font-size: 0.75rem;
  line-height: 1.4;
  opacity: ${p => p.isVisible ? 1 : 0};
  transform: ${p => p.isVisible ? 'translateY(0)' : 'translateY(5px)'};
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  
  /* Arrow managed via dynamic styles or disregarded for floating simple view */
`;

const FloatingTooltip = ({ batch, x, y, isVisible }: { batch: Batch, x: number, y: number, isVisible: boolean }) => {
    // Determine position relative to viewport to avoid clipping
    // Default: Top-Centered relative to cursor/cell

    // Safety margin
    const margin = 10;
    const tooltipWidth = 220; // Approx
    const tooltipHeight = 150; // Approx max

    // Get viewport dimensions
    const vw = window.innerWidth;
    // const vh = window.innerHeight; // Unused

    let left = x - tooltipWidth / 2;
    let top = y - tooltipHeight - 10; // Default above

    // Horizontal Clamp
    if (left < margin) left = margin;
    if (left + tooltipWidth > vw - margin) left = vw - tooltipWidth - margin;

    // Vertical Flip if too close to top
    if (top < margin) {
        top = y + 20; // Move below
    }

    return createPortal(
        <FloatingTooltipContainer style={{ top: top, left: left }} isVisible={isVisible}>
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.25rem', borderBottom: '1px solid #4A5568', paddingBottom: '0.25rem', color: '#48bb78' }}>
                {batch.tracking_code || batch.name}
            </div>
            {batch.genetic?.name && (
                <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#48bb78', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    🧬 {batch.genetic.name}
                </div>
            )}
            <div style={{ color: '#A0AEC0' }}>
                📅 {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : 'N/A'}
            </div>
            <div style={{ color: '#A0AEC0', textTransform: 'capitalize' }}>
                🌱 {batch.stage}
            </div>
            {/* Notes / Alerts */}
            {(batch.notes) && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.25rem', borderTop: '1px dashed #4A5568', color: '#F6E05E', fontStyle: 'italic' }}>
                    ⚠️ {batch.notes}
                </div>
            )}
        </FloatingTooltipContainer>,
        document.body
    );
};

const GridCell = React.memo(({
    row,
    col,
    batch,
    onClick,
    isSelected,
    cellSize,
    onMouseEnter,
    onMouseLeave,
    disableTransition
}: {
    row: number;
    col: number;
    batch?: Batch,
    onClick: (b: Batch | null, pos: string) => void,
    isSelected?: boolean;
    cellSize: number;
    onMouseEnter: (e: React.MouseEvent, batch: Batch) => void;
    onMouseLeave: () => void;
    disableTransition?: boolean;
}) => {
    const positionId = `${getRowLabel(row)}${col + 1}`;

    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${positionId}`,
        data: { type: 'living-soil-cell', position: positionId }
    });

    const isSmallView = cellSize >= 30 && cellSize < 60;

    const handleEnter = (e: React.MouseEvent) => {
        if (batch) onMouseEnter(e, batch);
    };

    return (
        <CellStyled
            ref={setNodeRef}
            $isOver={isOver}
            $isOccupied={!!batch}
            $stage={batch?.stage}
            $geneticColor={batch ? getGeneticColor(batch.genetic?.name || batch.name).bg : undefined}
            $isSelected={isSelected}
            $hasAlert={!!batch?.notes}
            $disableTransition={disableTransition}
            cellSize={cellSize}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClick(batch || null, positionId);
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Position Label Logic */}
            {cellSize >= 30 && (
                <span style={isSmallView ? {
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '0.8em',
                    fontWeight: '800',
                    color: '#2d3748',
                    opacity: 0.9,
                    pointerEvents: 'none'
                } : {
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: '0.6rem',
                    color: '#718096',
                    fontWeight: 'bold',
                    opacity: 0.7
                }}>
                    {positionId}
                </span>
            )}

            {batch && <BatchItem batch={batch} cellSize={cellSize} />}
        </CellStyled>
    );
}, (prev, next) => {
    return (
        prev.isSelected === next.isSelected &&
        prev.cellSize === next.cellSize &&
        prev.batch === next.batch &&
        prev.onClick === next.onClick &&
        prev.disableTransition === next.disableTransition
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
    onToggleSelectionMode?: (enabled: boolean) => void; // New Prop
    mapId?: string;
}

export const LivingSoilGrid: React.FC<LivingSoilGridProps> = ({ rows, cols, batches, onBatchClick, selectedBatchIds, onSelectionChange, isSelectionMode, onToggleSelectionMode, mapId }) => {
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

    // Zoom Handlers
    const handleZoomIn = () => setCellSize(p => Math.min(p + 10, 120));
    const handleZoomOut = () => setCellSize(p => Math.max(p - 10, 15));

    // Ref to track if we've successfully loaded settings for the current map
    // This prevents overwriting saved data with defaults during initial render/switches
    const areZoomSettingsLoadedRef = useRef(false);

    // Effect 1: Load Zoom on Map Change
    useEffect(() => {
        // Reset loaded flag when map changes
        areZoomSettingsLoadedRef.current = false;

        if (!mapId) {
            console.log('[Zoom] No mapId provided. Skipping load.');
            return;
        }

        const key = `zoom_level_${mapId}`;
        const saved = localStorage.getItem(key);

        if (saved) {
            console.log(`[Zoom] Loaded saved zoom for map ${mapId}: ${saved}`);
            setCellSize(Number(saved));
        } else {
            console.log(`[Zoom] No saved zoom for map ${mapId}.Using default.`);
            // Calculate default based on current dimensions
            setCellSize(calculateZoom(cols, rows));
        }

        // Mark as loaded so subsequent changes (user interaction) can trigger saves
        areZoomSettingsLoadedRef.current = true;
    }, [mapId, cols, rows]);

    // Effect 2: Save on Zoom Change
    // We maintain a ref to mapId to allow saving without adding mapId as a dependency (which would trigger on map switch)
    const mapIdRef = useRef(mapId);
    useEffect(() => { mapIdRef.current = mapId; }, [mapId]);

    useEffect(() => {
        // Only save if we have a mapId AND we have finished the initial load sequence
        if (mapIdRef.current && areZoomSettingsLoadedRef.current) {
            console.log(`[Zoom] Saving zoom for map ${mapIdRef.current}: ${cellSize}`);
            localStorage.setItem(`zoom_level_${mapIdRef.current}`, cellSize.toString());
        } else {
            console.log(`[Zoom] Skipping save.MapId: ${mapIdRef.current}, Loaded: ${areZoomSettingsLoadedRef.current}, Value: ${cellSize}`);
        }
    }, [cellSize]);

    console.log('[LivingSoilGrid] Render:', { isSelectionMode, selectedCount: selectedBatchIds?.size });

    // --- Selection Logic (Refactored to use Hook) ---
    const {
        isDragging,
        dragStart,
        dragEnd,
        isAdditive,
        handleMouseDown,
        handleMouseEnter,
        getSelectionRect,
        reset
    } = useGridSelection();

    // Reset internal selection state when mode changes
    useEffect(() => {
        if (!isSelectionMode) {
            reset();
            setDragStartPx(null);
            setCurrentMousePx(null);
        }
    }, [isSelectionMode, reset]);

    // --- Smooth Pixel Selection State ---
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dragStartPx, setDragStartPx] = useState<{ x: number, y: number } | null>(null);
    const [currentMousePx, setCurrentMousePx] = useState<{ x: number, y: number } | null>(null);

    // Track if a drag occurred to prevent click-clear
    const hasDraggedRef = useRef(false);
    // Track if current drag is additive to manage visual state
    const isAdditiveDragRef = useRef(false);

    // Force update for instant masking
    const [, forceUpdate] = useState(0);

    const handleContainerMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;

        hasDraggedRef.current = false;

        // Calculate coordinates relative to container (including scroll)
        const rect = containerRef.current.getBoundingClientRect();
        const scrollLeft = containerRef.current.scrollLeft;
        const scrollTop = containerRef.current.scrollTop;

        const x = e.clientX - rect.left + scrollLeft;
        const y = e.clientY - rect.top + scrollTop;

        // If NOT in selection mode, track for potential auto-enable
        if (!isSelectionMode) {
            setPotentialDragStart({ x, y, clientX: e.clientX, clientY: e.clientY });
            return;
        }

        // --- Normal Selection Mode Logic ---
        const isAdditive = e.ctrlKey || e.metaKey || e.shiftKey;
        isAdditiveDragRef.current = isAdditive;

        // Force update to ensure isMaskingSelection reads the new ref value immediately if dragStartPx updates are batched/delayed
        forceUpdate(n => n + 1);

        if (!isAdditive && isSelectionMode) {
            console.log('[LivingSoilGrid] Clearing selection on new drag start (Logically + Visually masked)');
            onSelectionChange?.(new Set());
        }

        setDragStartPx({ x, y });
        setCurrentMousePx({ x, y });

        // Calculate initial logical cell
        const headerSize = 40;
        const padding = 16;
        const border = 1;

        const gap = cellSize < 40 ? 1 : 4;
        const offset = headerSize + padding + border + gap;
        const stride = cellSize + gap;

        const c = Math.floor((x - offset) / stride);
        const r = Math.floor((y - offset) / stride);

        // Pass to hook logic if within grid bounds (even if on header, maybe clamp?)
        if (c >= 0 && c < cols && r >= 0 && r < rows) {
            handleMouseDown(r, c, e); // Start hook logic
        } else {
            // If clicked on header, maybe just start logic at nearest? 
            // For now constant 0 or clamp.
            const clamppedC = Math.max(0, Math.min(c, cols - 1));
            const clamppedR = Math.max(0, Math.min(r, rows - 1));
            handleMouseDown(clamppedR, clamppedC, e);
        }
    };

    // Global listener for drag
    useEffect(() => {
        if (!dragStartPx) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            if (!dragStartPx || !containerRef.current) return;

            // Mark as dragged
            hasDraggedRef.current = true;

            const rect = containerRef.current.getBoundingClientRect();
            const scrollLeft = containerRef.current.scrollLeft;
            const scrollTop = containerRef.current.scrollTop;

            // Relative coordinates
            const x = e.clientX - rect.left + scrollLeft;
            const y = e.clientY - rect.top + scrollTop;

            setCurrentMousePx({ x, y });

            // Update Logical Selection
            const headerSize = 40;
            const padding = 16;
            const border = 1;

            const gap = cellSize < 40 ? 1 : 4;
            const offset = headerSize + padding + border + gap;
            const stride = cellSize + gap;

            const c = Math.floor((x - offset) / stride);
            const r = Math.floor((y - offset) / stride);

            // Clamp to grid
            const clamppedC = Math.max(0, Math.min(c, cols - 1));
            const clamppedR = Math.max(0, Math.min(r, rows - 1));

            handleMouseEnter(clamppedR, clamppedC);
        };

        const handleWindowMouseUp = () => {
            setDragStartPx(null);
            setCurrentMousePx(null);
            // Hook's handleMouseUp is attached to window by the hook itself usually?
            // Checking useGridSelection: "window.addEventListener('mouseup', handleMouseUp)". Yes.
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [dragStartPx, cellSize, cols, rows, handleMouseEnter]);



    const getBatchIdAt = useCallback((r: number, c: number) => {
        const pos = `${getRowLabel(r)}${c + 1}`;
        const batch = batches.find(b => b.grid_position === pos);
        return batch ? batch.id : null;
    }, [batches]);

    // --- Floating Tooltip Logic ---
    const [hoveredBatch, setHoveredBatch] = useState<{ batch: Batch, x: number, y: number } | null>(null);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleCellEnter = useCallback((e: React.MouseEvent, batch: Batch) => {
        if (isDragging) return; // Don't show tooltip while dragging

        // Clear pending hide
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Center top of the cell
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        setHoveredBatch({ batch, x, y });
        // Start hidden, then show next frame to trigger transition
        setTooltipVisible(false);
        requestAnimationFrame(() => {
            setTooltipVisible(true);
        });
    }, [isDragging]);

    const handleCellLeave = useCallback(() => {
        // Start fade out
        setTooltipVisible(false);
        // Delay clearing the data to allow animation to finish
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = setTimeout(() => {
            setHoveredBatch(null);
        }, 200); // Match transition duration
    }, []);

    // Hide tooltip on scroll to prevent detached Floating Tooltip
    useEffect(() => {
        const handleScroll = () => {
            setTooltipVisible(false);
            setHoveredBatch(null);
        };
        window.addEventListener('scroll', handleScroll, true); // Capture phase to catch all scrolls
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    // Effect to commit selection when dragging ends
    useEffect(() => {
        if (!isDragging && dragStart && dragEnd) {
            const rect = getSelectionRect();
            if (!rect) return;

            const { startRow, endRow, startCol, endCol } = rect;
            const selectionInRect = new Set<string>();

            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
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
    }, [isDragging, dragStart, dragEnd, isAdditive, selectedBatchIds, getBatchIdAt, onSelectionChange, getSelectionRect]);

    // --- Auto-Selection Trigger on Drag (Desktop Style) ---
    const [potentialDragStart, setPotentialDragStart] = useState<{ x: number, y: number, clientX: number, clientY: number } | null>(null);

    useEffect(() => {
        if (!potentialDragStart) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            if (!potentialDragStart) return;
            const dx = e.clientX - potentialDragStart.clientX;
            const dy = e.clientY - potentialDragStart.clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Threshold to trigger auto-selection
            if (dist > 5) {
                console.log('[AutoSelect] Threshold exceeded. Triggering selection mode.', { onToggleSelectionMode: !!onToggleSelectionMode });

                // Activate Selection Mode
                if (onToggleSelectionMode) {
                    onToggleSelectionMode(true);

                    // Immediately start dragging selection from the initial point
                    const { x, y } = potentialDragStart;

                    // Initialize Visual Drag State so the other effect picks it up
                    setDragStartPx({ x, y });

                    // Calculate current relative position
                    // We can approximate or recalculate. 
                    // x is relative to container (at start). 
                    // current x = start x + dx
                    const currentX = x + dx;
                    const currentY = y + dy;
                    setCurrentMousePx({ x: currentX, y: currentY });

                    const headerSize = 40;
                    const padding = 16;
                    const border = 1;

                    const gap = cellSize < 40 ? 1 : 4;
                    const offset = headerSize + padding + border + gap;
                    const stride = cellSize + gap;

                    const c = Math.floor((x - offset) / stride);
                    const r = Math.floor((y - offset) / stride);

                    // Clamp
                    const clamppedC = Math.max(0, Math.min(c, cols - 1));
                    const clamppedR = Math.max(0, Math.min(r, rows - 1));

                    // Call hook logic
                    handleMouseDown(clamppedR, clamppedC, { ...e, preventDefault: () => { } } as any);
                }
                setPotentialDragStart(null);
            }
        };

        const handleWindowMouseUp = () => {
            setPotentialDragStart(null);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [potentialDragStart, onToggleSelectionMode, cellSize, cols, rows, handleMouseDown]);

    // Calculate Selection Box Style (Pixel Perfect)
    const getSelectionBoxStyle = () => {
        // We prefer pixel state for smooth drag.
        if (dragStartPx && currentMousePx) {
            const left = Math.min(dragStartPx.x, currentMousePx.x);
            const top = Math.min(dragStartPx.y, currentMousePx.y);
            const width = Math.abs(currentMousePx.x - dragStartPx.x);
            const height = Math.abs(currentMousePx.y - dragStartPx.y);

            return {
                position: 'absolute' as 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: 'rgba(66, 153, 225, 0.3)',
                border: '1px solid #4299e1',
                pointerEvents: 'none' as 'none',
                zIndex: 100,
            };
        }
        return null;
    };

    // Stable Click Handler for GridCell
    const handleCellClick = useCallback((b: Batch | null, p: string) => {
        if (!isSelectionMode) onBatchClick(b, p);
    }, [isSelectionMode, onBatchClick]);


    // Memoize Batches Map
    const batchesMap = React.useMemo(() => {
        const map = new Map<string, Batch>();
        batches.forEach(b => {
            if (b.grid_position) map.set(b.grid_position, b);
        });
        return map;
    }, [batches]);

    // Construct Grid - Memoized to prevent re-renders during drag (overlay updates independently)


    // Construct Grid - Memoized to prevent re-renders during drag (overlay updates independently)
    // We re-render if dragStartPx changes to update the "masking" of old selection.

    const grid = React.useMemo(() => {
        const items = [];

        // If dragging NEW selection (not additive), visually hide old selection immediately
        const isMaskingSelection = dragStartPx && !isAdditiveDragRef.current;

        // Header Row (Column Numbers)
        items.push(<div key="corner" />); // Empty corner
        for (let c = 0; c < cols; c++) {
            items.push(<HeaderCell key={`h-col-${c}`} cellSize={cellSize}>{c + 1}</HeaderCell>);
        }

        for (let r = 0; r < rows; r++) {
            // Row Header (Letters)
            items.push(<HeaderCell key={`h-row-${r}`} cellSize={cellSize}>{getRowLabel(r)}</HeaderCell>);

            for (let c = 0; c < cols; c++) {
                const pos = `${getRowLabel(r)}${c + 1}`;
                const batch = batchesMap.get(pos);
                // Ensure selection is only shown if mode is active AND batch is in set
                // AND we are not currently masking it with a new non-additive drag
                const isSelected = !isMaskingSelection && isSelectionMode && batch && selectedBatchIds ? selectedBatchIds.has(batch.id) : false;

                items.push(
                    <GridCell
                        key={pos}
                        row={r}
                        col={c}
                        batch={batch}
                        onClick={handleCellClick}
                        isSelected={isSelected}
                        cellSize={cellSize}
                        onMouseEnter={handleCellEnter}
                        onMouseLeave={handleCellLeave}
                        disableTransition={isMaskingSelection ? true : false}
                    />
                );
            }
        }
        return items;
    }, [rows, cols, cellSize, batchesMap, selectedBatchIds, isSelectionMode, dragStartPx, handleCellClick, handleCellEnter, handleCellLeave]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '100%' // Ensure it takes height for click area
            }}
            onClick={(e) => {
                // Expanded Background Click Logic
                // If not clicking on a button or interactive element (handled by stopPropagation there),
                // and not dragging, clear selection.
                if (isSelectionMode && !hasDraggedRef.current) {
                    console.log('[LivingSoilGrid] Root Background Click - Clearing Selection');
                    onToggleSelectionMode?.(false);
                    onSelectionChange?.(new Set());
                }
            }}
            onMouseDown={(e) => {
                // Also handle mouse down here to reset drag ref if clicking outside grid
                if (e.target === e.currentTarget) {
                    hasDraggedRef.current = false;
                }
            }}
        >
            {/* Tooltip Portal */}
            {hoveredBatch && <FloatingTooltip batch={hoveredBatch.batch} x={hoveredBatch.x} y={hoveredBatch.y} isVisible={tooltipVisible} />}

            <ControlsContainer onClick={e => e.stopPropagation()}>
                <ZoomButton onClick={handleZoomOut} title="Alejar"><FaSearchMinus /></ZoomButton>
                <ZoomLabel>{cellSize}px</ZoomLabel>
                <ZoomButton onClick={handleZoomIn} title="Acercar"><FaSearchPlus /></ZoomButton>
            </ControlsContainer>

            <GridContainer
                ref={containerRef}
                rows={Number(rows)}
                cols={Number(cols)}
                cellSize={Number(cellSize)}
                className="noselect"
                style={{ position: 'relative' }}
                onMouseDown={handleContainerMouseDown}
                onClick={(e) => {
                    // Stop propagation so we don't trigger root click twice (though logic is same)
                    e.stopPropagation();

                    // Only if clicking directly on container (or bubbling from non-stopped children like empty space)
                    // GridCell stops propagation so it won't reach here.
                    if (isSelectionMode && !hasDraggedRef.current) {
                        console.log('[LivingSoilGrid] Grid Background Click - Clearing Selection');
                        onToggleSelectionMode?.(false);
                        onSelectionChange?.(new Set());
                    }
                }}
            >
                {/* Use internal state for Smooth Box, fallback to logical box if needed (optional, here we rely on pixel state) */}
                {dragStartPx && currentMousePx && (
                    <div style={getSelectionBoxStyle() || {}} />
                )}
                {grid}
            </GridContainer>
        </div>
    );
};
