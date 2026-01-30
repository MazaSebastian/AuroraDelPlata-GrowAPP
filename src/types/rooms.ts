export type RoomType = 'vegetation' | 'flowering' | 'drying' | 'curing' | 'mother' | 'clones' | 'general';
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
    batches?: Batch[];
}

import { Genetic } from './genetics';

export interface Batch {
    id: string;
    name: string;
    strain?: string; // Legacy or fallback
    genetic_id?: string;
    quantity: number;
    parent_batch_id?: string; // For strict traceability (Mother -> Clone -> Plant)
    stage: BatchStage;
    start_date: string;
    current_room_id?: string;
    table_number?: number;
    notes?: string;
    created_at: string;

    // Joins (optional, depending on query)
    room?: Room;
    genetic?: Genetic;
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
