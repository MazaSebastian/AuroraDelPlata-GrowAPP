import { useState, useCallback, useEffect, useRef } from 'react';

interface GridPoint {
    row: number;
    col: number;
}

interface SelectionState {
    isDragging: boolean;
    dragStart: GridPoint | null;
    dragEnd: GridPoint | null;
    isAdditive: boolean; // True if Ctrl/Cmd was held on start
}

export const useGridSelection = () => {
    const [selectionState, setSelectionState] = useState<SelectionState>({
        isDragging: false,
        dragStart: null,
        dragEnd: null,
        isAdditive: false,
    });

    // We need to track the "anchor" for Shift+Click selections, which might persist across drag operations
    const lastAnchorRef = useRef<GridPoint | null>(null);

    const handleMouseDown = useCallback((row: number, col: number, e: React.MouseEvent | MouseEvent) => {
        // Prevent default text selection
        if ((e as React.MouseEvent).shiftKey || (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey) {
            e.preventDefault();
        }

        const isCtrl = (e as React.MouseEvent).ctrlKey || (e as React.MouseEvent).metaKey;
        // const isShift = (e as React.MouseEvent).shiftKey; // Used for anchor logic

        setSelectionState({
            isDragging: true,
            dragStart: { row, col },
            dragEnd: { row, col },
            isAdditive: isCtrl,
        });

        // if (!isShift) {
        //     lastAnchorRef.current = { row, col };
        // }
    }, []);

    const handleMouseEnter = useCallback((row: number, col: number) => {
        setSelectionState(prev => {
            if (!prev.isDragging) return prev;
            return { ...prev, dragEnd: { row, col } };
        });
    }, []);

    const handleMouseUp = useCallback(() => {
        setSelectionState(prev => {
            if (!prev.isDragging) return prev;
            return { ...prev, isDragging: false };
        });
    }, []);

    // Global mouse up to catch releases outside the grid
    useEffect(() => {
        const onGlobalMouseUp = () => {
            handleMouseUp();
        };
        window.addEventListener('mouseup', onGlobalMouseUp);
        return () => window.removeEventListener('mouseup', onGlobalMouseUp);
    }, [handleMouseUp]);

    // Helper to check if a cell is within the CURRENT drag box
    const isInDragBox = useCallback((row: number, col: number) => {
        const { dragStart, dragEnd, isDragging } = selectionState;
        if (!isDragging || !dragStart || !dragEnd) return false;

        const minRow = Math.min(dragStart.row, dragEnd.row);
        const maxRow = Math.max(dragStart.row, dragEnd.row);
        const minCol = Math.min(dragStart.col, dragEnd.col);
        const maxCol = Math.max(dragStart.col, dragEnd.col);

        return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    }, [selectionState]);

    // Helper to get the current selection coordinates as a standardized rect
    const getSelectionRect = useCallback(() => {
        const { dragStart, dragEnd } = selectionState;
        if (!dragStart || !dragEnd) return null;

        return {
            startRow: Math.min(dragStart.row, dragEnd.row),
            endRow: Math.max(dragStart.row, dragEnd.row),
            startCol: Math.min(dragStart.col, dragEnd.col),
            endCol: Math.max(dragStart.col, dragEnd.col),
        };
    }, [selectionState]);


    const reset = useCallback(() => {
        setSelectionState({
            isDragging: false,
            dragStart: null,
            dragEnd: null,
            isAdditive: false,
        });
        lastAnchorRef.current = null;
    }, []);

    return {
        isDragging: selectionState.isDragging,
        dragStart: selectionState.dragStart,
        dragEnd: selectionState.dragEnd,
        isAdditive: selectionState.isAdditive,
        handleMouseDown,
        handleMouseEnter,
        handleMouseUp,
        isInDragBox,
        getSelectionRect,
        reset
    };
};
