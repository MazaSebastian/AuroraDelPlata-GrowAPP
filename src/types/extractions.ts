export type ExtractionTechnique = 'Rosin' | 'BHO' | 'Ice' | 'Dry Sift';

export interface ExtractionParameters {
    // Rosin
    temperature?: number;
    pressure?: number;
    pressureUnit?: 'psi' | 'tons' | 'bar';
    timeSeconds?: number;
    micron?: number;

    // Ice / Bubble Hash
    washes?: number;
    iceType?: 'cubes' | 'crushed' | 'dry_ice';
    meshSizes?: number[]; // e.g. [25, 73, 120, 160]

    // BHO
    solvent?: 'Butane' | 'Propane' | 'Mix';
    purgeTimeHours?: number;
    vacuumPressure?: number;

    // Dry Sift
    screens?: number[];
    technique?: 'static' | 'carding' | 'tumbler';
}

export interface ExtractionRating {
    aroma: number; // 1-10
    texture: number; // 1-10
    potency: number; // 1-10
    color?: number; // 1-10
    overall?: number; // Calculated or manual
}

export interface Extraction {
    id: string;
    source_batch_id: string;
    technique: ExtractionTechnique;
    date: string; // ISO Date "YYYY-MM-DD"
    input_weight: number; // Grams
    output_weight: number; // Grams
    yield_percentage: number; // Calculated
    parameters: ExtractionParameters;
    ratings: ExtractionRating;
    notes?: string;
    created_at: string;
    created_by?: string;

    // Joined fields
    source_batch?: {
        id: string;
        strain_name: string;
        batch_code: string;
        quality_grade?: string;
        photo_url?: string;
    };
}
