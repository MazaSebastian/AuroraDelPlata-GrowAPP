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

export const useGridSelection = (scrollContainerRef?: React.RefObject<HTMLElement>) => {
    const [selectionState, setSelectionState] = useState<SelectionState>({
        isDragging: false,
        dragStart: null,
        dragEnd: null,
        isAdditive: false,
    });

    // We need to track the "anchor" for Shift+Click selections, which might persist across drag operations
    const lastAnchorRef = useRef<GridPoint | null>(null);

    const handleMouseDown = useCallback((row: number, col: number, e: React.MouseEvent | MouseEvent) => {
        // Prevent default text selection and native drag behavior
        e.preventDefault();

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

    // Auto-scroll logic variables
    const scrollReqRef = useRef<number | null>(null);
    const mouseYRef = useRef<number | null>(null);

    // Function to handle auto-scrolling
    const performAutoScroll = useCallback(() => {
        if (!mouseYRef.current) return;

        const threshold = 100; // Distance from edge to start scrolling
        const maxSpeed = 30; // Max pixels per frame
        const y = mouseYRef.current;
        let scrollSpeed = 0;

        if (scrollContainerRef?.current) {
            // Container-based scrolling
            const container = scrollContainerRef.current;
            const rect = container.getBoundingClientRect();

            // Check distance from container top/bottom edges
            // y is clientY. rect.top and rect.bottom are client coords.

            const distTop = y - rect.top;
            const distBottom = rect.bottom - y;

            if (distTop < threshold && distTop > -50) { // Allow some slack outside
                // Scroll Up
                const ratio = 1 - (Math.max(0, distTop) / threshold);
                scrollSpeed = -maxSpeed * ratio;
            } else if (distBottom < threshold && distBottom > -50) {
                // Scroll Down
                const ratio = 1 - (Math.max(0, distBottom) / threshold);
                scrollSpeed = maxSpeed * ratio;
            }

            if (scrollSpeed !== 0) {
                container.scrollBy({ top: scrollSpeed, behavior: 'auto' });
                scrollReqRef.current = requestAnimationFrame(performAutoScroll);
            } else {
                scrollReqRef.current = null;
            }

        } else {
            // Window-based scrolling (Fallback)
            const viewportHeight = window.innerHeight;

            if (y < threshold) {
                const ratio = 1 - (y / threshold);
                scrollSpeed = -maxSpeed * ratio;
            } else if (y > viewportHeight - threshold) {
                const ratio = 1 - ((viewportHeight - y) / threshold);
                scrollSpeed = maxSpeed * ratio;
            }

            if (scrollSpeed !== 0) {
                window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
                scrollReqRef.current = requestAnimationFrame(performAutoScroll);
            } else {
                scrollReqRef.current = null;
            }
        }
    }, [scrollContainerRef]);

    // Start/Stop scroll loop based on mouse movement
    const handleWindowMouseMove = useCallback((e: MouseEvent) => {
        mouseYRef.current = e.clientY;

        // If we are dragging and not currently scrolling, check if we need to start
        if (selectionState.isDragging && !scrollReqRef.current) {
            scrollReqRef.current = requestAnimationFrame(performAutoScroll);
        }
    }, [selectionState.isDragging, performAutoScroll]);

    // Cleanup scroll on unmount or drag end
    useEffect(() => {
        if (!selectionState.isDragging) {
            if (scrollReqRef.current) {
                cancelAnimationFrame(scrollReqRef.current);
                scrollReqRef.current = null;
            }
            mouseYRef.current = null;
        }
    }, [selectionState.isDragging]);


    // Global mouse up to catch releases outside the grid AND mousemove for auto-scroll
    useEffect(() => {
        const onGlobalMouseUp = () => {
            handleMouseUp();
        };

        if (selectionState.isDragging) {
            window.addEventListener('mouseup', onGlobalMouseUp);
            window.addEventListener('mousemove', handleWindowMouseMove);
        }

        return () => {
            window.removeEventListener('mouseup', onGlobalMouseUp);
            window.removeEventListener('mousemove', handleWindowMouseMove);
            if (scrollReqRef.current) {
                cancelAnimationFrame(scrollReqRef.current);
                scrollReqRef.current = null;
            }
        };
    }, [selectionState.isDragging, handleMouseUp, handleWindowMouseMove]);

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
