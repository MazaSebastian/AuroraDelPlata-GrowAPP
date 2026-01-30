export type GeneticType = 'automatic' | 'photoperiodic';

export interface Genetic {
    id: string;
    name: string;
    type: GeneticType;
    vegetative_weeks: number;
    flowering_weeks: number;
    breeder?: string;
    description?: string;
    acquisition_date?: string;
    thc_percent?: number;
    cbd_percent?: number;
    estimated_yield_g?: number;
    created_at: string;
}
