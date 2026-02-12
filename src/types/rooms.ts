export type RoomType = 'vegetation' | 'flowering' | 'drying' | 'curing' | 'mother' | 'clones' | 'general' | 'germination';
export type BatchStage = 'seedling' | 'vegetation' | 'flowering' | 'drying' | 'curing' | 'completed';

export interface Room {
    id: string;
    name: string;
    type: RoomType;
    medium?: 'maceta' | 'bandeja' | 'bunker';
    capacity: number;
    current_temperature?: number;
    current_humidity?: number;
    spot_id?: string;
    created_at: string;
    start_date?: string; // Added for user-defined start date
    operational_days?: number; // Configured duration in days
    order_index?: number; // Added for custom ordering
    grid_rows?: number; // For Esquejera (Clones) Battleship Grid
    grid_columns?: number; // For Esquejera (Clones) Battleship Grid
    batches?: Batch[];
    clone_maps?: CloneMap[]; // Added for maps
    spot?: { name: string }; // Joined Crop Info
}

export interface CloneMap {
    id: string;
    room_id: string;
    name: string;
    grid_rows: number;
    grid_columns: number;
    position_x?: number; // For Freestyle Layout (Vegetation)
    position_y?: number; // For Freestyle Layout (Vegetation)
    created_at?: string;
}

import { Genetic } from './genetics';

export interface Batch {
    id: string;
    name: string;
    strain?: string; // Legacy or fallback
    genetic_id?: string;
    quantity: number;
    tracking_code?: string; // Unique lifecycle identifier
    parent_batch_id?: string; // For strict traceability (Mother -> Clone -> Plant)
    stage: BatchStage;
    start_date: string;
    current_room_id?: string;
    clone_map_id?: string; // Link to CloneMap
    grid_position?: string; // E.g., "A1", "B5" for Esquejera Grid
    table_number?: number;
    notes?: string;
    created_at: string;
    discarded_at?: string | null;
    discard_reason?: string | null;

    // Joins (optional, depending on query)
    room?: Room;
    genetic?: Genetic;
    parent_batch?: { name: string };
}

export interface BatchMovement {
    id: string;
    batch_id: string;
    from_room_id?: string;
    to_room_id?: string;
    current_room_id?: string;
    table_number?: number;
    moved_at: string;
    notes?: string;
    created_by?: string;
    created_at: string;

    // Joins
    from_room?: Room;
    to_room?: Room;
}
