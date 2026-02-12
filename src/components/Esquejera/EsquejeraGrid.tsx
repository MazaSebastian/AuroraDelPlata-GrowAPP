import React from 'react';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import { Batch } from '../../types/rooms';
import { FaLeaf } from 'react-icons/fa';
import { getGeneticColor } from '../../utils/geneticColors';


// --- Styled Components ---

const GridContainer = styled.div<{ rows: number; cols: number }>`
  display: grid;
  grid-template-columns: 40px repeat(${p => p.cols}, minmax(80px, 1fr));
  grid-template-rows: 40px repeat(${p => p.rows}, minmax(80px, 1fr));
  gap: 0.5rem;
  overflow: auto;
  max-width: 100%;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
`;

const HeaderCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #718096;
  background: #edf2f7;
  border-radius: 0.5rem;
`;

const CellStyled = styled.div<{ $isOver?: boolean; $isOccupied?: boolean; $geneticColor?: string; $isPainting?: boolean; $isSelected?: boolean }>`
  background: ${p => p.$isSelected ? '#48bb78' : p.$isOccupied ? (p.$geneticColor || '#c6f6d5') : p.$isOver ? '#ebf8ff' : 'white'};
  border: ${p => p.$isSelected ? '3px solid #000' : '2px dashed ' + (p.$isOver ? '#3182ce' : p.$isOccupied ? 'transparent' : '#cbd5e0')};
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

const BatchItemStyled = styled.div`
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  &:active { transform: scale(0.98); }
`;

const BatchItem = ({ batch, onClick }: { batch: Batch; onClick?: (e: React.MouseEvent<HTMLDivElement>) => void }) => {
    return (
        <BatchItemStyled
            onClick={(e) => {
                console.log("BatchItem Clicked", batch.tracking_code);
                onClick?.(e);
            }}
            style={{ touchAction: 'manipulation' }}
        >
            <FaLeaf style={{ fontSize: '1.2rem', color: '#004c00', marginBottom: '0.2rem' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.1 }}>
                {batch.tracking_code || batch.name}
            </span>
            {batch.tracking_code && (
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
const GridCell = ({ row, col, batch, onClick, isPainting, isSelected, renderActions }: { row: number; col: number; batch?: Batch, onClick: (b: Batch | null) => void, isPainting?: boolean, isSelected?: boolean, renderActions?: (batch: Batch) => React.ReactNode }) => {
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
            <span style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.6rem', color: '#a0aec0', fontWeight: 'bold' }}>
                {positionId}
            </span>



            {batch && (
                <>
                    <BatchItem
                        batch={batch}
                        onClick={(e) => {
                            e?.stopPropagation(); // Prevent parent click
                            console.log("BatchItem Handler in GridCell Triggered");
                            onClick(batch);
                        }}
                    />
                    {renderActions && (
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
}

export const EsquejeraGrid: React.FC<EsquejeraGridProps> = ({ rows, cols, batches, onBatchClick, paintingMode = false, selectedBatchIds, selectionMode = false, renderCellActions }) => {
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

    // Headers
    const colHeaders = Array.from({ length: cols }, (_, i) => i + 1);
    const rowHeaders = Array.from({ length: rows }, (_, i) => getRowLabel(i));

    return (
        <GridContainer rows={rows} cols={cols}>
            {/* Top-Left Corner (Empty) */}
            <div />

            {/* Column Headers */}
            {colHeaders.map(c => <HeaderCell key={`h-${c}`}>{c}</HeaderCell>)}

            {/* Rows */}
            {rowHeaders.map((rLabel, rIndex) => (
                <React.Fragment key={`row-${rLabel}`}>
                    {/* Row Header */}
                    <HeaderCell>{rLabel}</HeaderCell>

                    {/* Cells */}
                    {colHeaders.map((_, cIndex) => {
                        const pos = `${rLabel}${cIndex + 1}`;
                        return (
                            <GridCell
                                key={pos}
                                row={rIndex}
                                col={cIndex}
                                batch={batchMap[pos]}
                                onClick={(batch) => onBatchClick(batch, pos)}
                                isPainting={paintingMode}
                                isSelected={selectedBatchIds?.has(batchMap[pos]?.id)}
                                renderActions={renderCellActions}
                            />
                        );
                    })}
                </React.Fragment>
            ))}
        </GridContainer>
    );
};
