import React from 'react';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import { Batch } from '../../types/rooms';
import { FaLeaf, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import { getGeneticColor } from '../../utils/geneticColors';
import { useGridSelection } from '../../hooks/useGridSelection';


// --- Styled Components ---

// Zoom Controls Components (copied/adapted from LivingSoilGrid)
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
  grid-template-columns: 40px repeat(${p => p.cols}, ${p => p.cellSize}px);
  grid-template-rows: 40px repeat(${p => p.rows}, ${p => p.cellSize}px);
  gap: 0.5rem;
  overflow: auto;
  max-width: 100%;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
`;

const HeaderCell = styled.div<{ cellSize: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #718096;
  background: #edf2f7;
  border-radius: 0.5rem;
  font-size: ${p => p.cellSize < 60 ? '0.7rem' : '1rem'};
`;

const CellStyled = styled.div<{ $isOver?: boolean; $isOccupied?: boolean; $geneticColor?: string; $isPainting?: boolean; $isSelected?: boolean }>`
  background: ${p => p.$isSelected ? '#48bb78' : p.$isOccupied ? (p.$geneticColor || '#c6f6d5') : p.$isOver ? '#ebf8ff' : 'white'};
  border: ${p => p.$isSelected ? '2px solid #000' : p.$isOccupied ? '1px solid rgba(0,0,0,0.1)' : '1px solid #e2e8f0'};
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
  cursor: ${p => p.$isOccupied || p.$isPainting ? 'pointer' : 'default'};

  &:hover {
    border-color: ${p => p.$isPainting && !p.$isOccupied ? '#48bb78' : '#3182ce'};
    background: ${p => p.$isPainting && !p.$isOccupied ? '#f0fff4' : p.$isOccupied ? (p.$geneticColor || '#c6f6d5') : p.$isOver ? '#ebf8ff' : 'white'};
    transform: ${p => p.$isOccupied || (p.$isPainting && !p.$isOccupied) ? 'scale(1.05)' : 'none'};
    z-index: 10;
    box-shadow: ${p => p.$isOccupied ? '0 4px 6px rgba(0,0,0,0.1)' : 'none'};
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
  padding: 0.25rem;
  
  &:active { transform: scale(0.98); }
`;

const BatchItem = ({ batch, onClick, cellSize }: { batch: Batch; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void; cellSize: number }) => {
    // Hide details if too small
    if (cellSize < 50) {
        return (
            <BatchItemStyled cellSize={cellSize} onClick={onClick} title={`${batch.tracking_code} - ${batch.genetic?.name}`}>
                <div style={{ width: '80%', height: '80%', background: getGeneticColor(batch.genetic?.name || '').bg, borderRadius: '50%' }} />
            </BatchItemStyled>
        );
    }

    return (
        <BatchItemStyled
            cellSize={cellSize}
            onClick={(e) => {
                console.log("BatchItem Clicked", batch.tracking_code);
                onClick?.(e);
            }}
            style={{ touchAction: 'manipulation' }}
        >
            <FaLeaf style={{ fontSize: cellSize < 70 ? '0.9rem' : '1.2rem', color: '#004c00', marginBottom: '0.2rem' }} />
            <span style={{ fontSize: cellSize < 70 ? '0.6rem' : '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>
                {batch.tracking_code || batch.name}
            </span>
            {batch.tracking_code && cellSize >= 70 && (
                <span style={{ fontSize: '0.6rem', color: '#4a5568', background: 'rgba(255,255,255,0.7)', borderRadius: '4px', padding: '0 2px', marginTop: '2px' }}>
                    {batch.genetic?.name?.substring(0, 10)}
                </span>
            )}
        </BatchItemStyled>
    );
};

// --- Helper Functions ---
const getRowLabel = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B...

// --- Cell Component ---
const GridCell = ({ row, col, batch, onClick, isPainting, isSelected, renderActions, cellSize }: { row: number; col: number; batch?: Batch, onClick: (b: Batch | null) => void, isPainting?: boolean, isSelected?: boolean, renderActions?: (batch: Batch) => React.ReactNode; cellSize: number }) => {
    const positionId = `${getRowLabel(row)}${col + 1}`; // "A1", "B2"

    const { setNodeRef, isOver } = useDroppable({
        id: `cell-${positionId}`,
        data: { type: 'grid-cell', position: positionId }
    });

    return (
        <CellStyled
            ref={setNodeRef}
            $isOver={isOver}
            $isOccupied={!!batch}
            $geneticColor={batch ? getGeneticColor(batch.genetic?.name || batch.name).bg : undefined}
            $isSelected={isSelected}
            onClick={() => {
                // In selection mode, click propagates up.
                if (batch || isSelected === false) onClick(batch || null); // Pass null if empty
            }}
            title={batch ? `${batch.tracking_code || batch.name} (${batch.genetic?.name || 'Desconocida'})` : `Vacío: ${positionId}`}
        >
            {/* Position Label (Top-Left) */}
            {cellSize >= 60 && (
                <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.6rem', color: '#a0aec0', fontWeight: 'bold' }}>
                    {positionId}
                </span>
            )}

            {batch && (
                <>
                    <BatchItem
                        batch={batch}
                        cellSize={cellSize}
                        onClick={(e) => {
                            e?.stopPropagation(); // Prevent parent click
                            console.log("BatchItem Handler in GridCell Triggered");
                            onClick(batch);
                        }}
                    />
                    {renderActions && cellSize >= 60 && (
                        <div style={{ position: 'absolute', top: 2, right: 2, zIndex: 20 }} onClick={e => e.stopPropagation()}>
                            {renderActions(batch)}
                        </div>
                    )}
                </>
            )}
        </CellStyled >
    );
};

interface EsquejeraGridProps {
    rows: number;
    cols: number;
    batches: Batch[];
    onBatchClick: (batch: Batch | null, position?: string) => void;
    paintingMode?: boolean;
    selectedBatchIds?: Set<string>;
    selectionMode?: boolean;
    renderCellActions?: (batch: Batch) => React.ReactNode;
    onSelectionChange?: (selectedIds: Set<string>) => void;
}

export const EsquejeraGrid: React.FC<EsquejeraGridProps> = ({ rows, cols, batches, onBatchClick, paintingMode = false, selectedBatchIds, selectionMode = false, renderCellActions, onSelectionChange }) => {
    // Map batches by position "A1" -> Batch
    const batchMap = React.useMemo(() => {
        const map: Record<string, Batch> = {};
        batches.forEach(b => {
            if (b.grid_position) {
                map[b.grid_position.trim().toUpperCase()] = b;
            }
        });
        return map;
    }, [batches]);

    // Use Grid Selection Hook
    const {
        isDragging,
        dragStart,
        dragEnd,
        isAdditive,
        handleMouseDown,
        handleMouseEnter,
        getSelectionRect
    } = useGridSelection();

    // Effect to commit selection
    React.useEffect(() => {
        if (!isDragging && dragStart && dragEnd && selectionMode) {
            const rect = getSelectionRect();
            if (!rect) return;

            const { startRow, endRow, startCol, endCol } = rect;
            const selectionInRect = new Set<string>();

            for (let r = startRow; r <= endRow; r++) {
                for (let c = startCol; c <= endCol; c++) {
                    const pos = `${getRowLabel(r)}${c + 1}`;
                    const batch = batchMap[pos];
                    if (batch) selectionInRect.add(batch.id);
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
    }, [isDragging, dragStart, dragEnd, isAdditive, selectedBatchIds, batchMap, onSelectionChange, selectionMode, getSelectionRect]);

    // Calculate Selection Box Style using CSS Grid Area
    const getSelectionBoxStyle = () => {
        const rect = getSelectionRect();
        if (!rect || !isDragging) return null;

        const { startRow, endRow, startCol, endCol } = rect;

        // Grid tracks:
        // Column 1 is header. Data starts at Column 2.
        // Row 1 is header. Data starts at Row 2.
        // Indices are 0-based.
        // grid-column-start: colIndex + 2
        // grid-column-end: colIndex + 2 + 1 (for 1 cell span) -> endCol + 3 for range

        const gridRowStart = startRow + 2;
        const gridColumnStart = startCol + 2;
        const gridRowEnd = endRow + 3; // +2 for offset, +1 for exclusive end line
        const gridColumnEnd = endCol + 3;

        return {
            gridArea: `${gridRowStart} / ${gridColumnStart} / ${gridRowEnd} / ${gridColumnEnd}`,
            backgroundColor: 'rgba(66, 153, 225, 0.3)',
            border: '2px solid #4299e1',
            borderRadius: '0.25rem',
            pointerEvents: 'none' as const,
            zIndex: 20, // Above cells
        };
    };

    const isInDragArea = (r: number, c: number) => {
        if (!isDragging || !dragStart || !dragEnd) return false;
        const minR = Math.min(dragStart.row, dragEnd.row);
        const maxR = Math.max(dragStart.row, dragEnd.row);
        const minC = Math.min(dragStart.col, dragEnd.col);
        const maxC = Math.max(dragStart.col, dragEnd.col);
        return r >= minR && r <= maxR && c >= minC && c <= maxC;
    };

    // Zoom State
    const [cellSize, setCellSize] = React.useState(80);
    const handleZoomIn = () => setCellSize(p => Math.min(p + 10, 150));
    const handleZoomOut = () => setCellSize(p => Math.max(p - 10, 30));

    // Headers
    const colHeaders = Array.from({ length: cols }, (_, i) => i + 1);
    const rowHeaders = Array.from({ length: rows }, (_, i) => getRowLabel(i));

    return (
        <div>
            <ControlsContainer>
                <ZoomButton onClick={handleZoomOut} title="Alejar"><FaSearchMinus /></ZoomButton>
                <ZoomLabel>{cellSize}px</ZoomLabel>
                <ZoomButton onClick={handleZoomIn} title="Acercar"><FaSearchPlus /></ZoomButton>
            </ControlsContainer>

            <GridContainer rows={rows} cols={cols} cellSize={cellSize} style={{ position: 'relative' }} className="noselect">
                {/* Selection Box Overlay */}
                {isDragging && dragStart && dragEnd && (
                    <div style={getSelectionBoxStyle() || {}} />
                )}

                {/* Top-Left Corner (Empty) - Explicitly placed */}
                <div style={{ gridRow: 1, gridColumn: 1 }} />

                {/* Column Headers - Explicitly placed */}
                {colHeaders.map((c, i) => (
                    <HeaderCell key={`h-${c}`} style={{ gridRow: 1, gridColumn: i + 2 }} cellSize={cellSize}>
                        {c}
                    </HeaderCell>
                ))}

                {/* Rows */}
                {rowHeaders.map((rLabel, rIndex) => (
                    <React.Fragment key={`row-${rLabel}`}>
                        {/* Row Header - Explicitly placed */}
                        <HeaderCell style={{ gridRow: rIndex + 2, gridColumn: 1 }} cellSize={cellSize}>
                            {rLabel}
                        </HeaderCell>

                        {/* Cells */}
                        {colHeaders.map((_, cIndex) => {
                            const pos = `${rLabel}${cIndex + 1}`;
                            const batch = batchMap[pos];
                            const inDrag = isInDragArea(rIndex, cIndex);
                            const isSel = selectedBatchIds?.has(batch?.id || '');

                            return (
                                <div
                                    key={pos}
                                    onMouseDown={(e) => selectionMode && handleMouseDown(rIndex, cIndex, e)}
                                    onMouseEnter={() => selectionMode && handleMouseEnter(rIndex, cIndex)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        gridRow: rIndex + 2,
                                        gridColumn: cIndex + 2
                                    }}
                                >
                                    <GridCell
                                        row={rIndex}
                                        col={cIndex}
                                        batch={batch}
                                        onClick={(batch) => onBatchClick(batch, pos)}
                                        // Highlight if selected OR if in drag area (visual feedback)
                                        isSelected={isSel || (inDrag && selectionMode)}
                                        renderActions={renderCellActions}
                                        cellSize={cellSize}
                                    />
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </GridContainer>
        </div>
    );
};
