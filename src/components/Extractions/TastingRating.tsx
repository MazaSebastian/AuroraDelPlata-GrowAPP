import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface RaterProps {
    label: string;
    value: number;
    onChange?: (val: number) => void;
    readonly?: boolean;
}

const StarRater: React.FC<RaterProps> = ({ label, value, onChange, readonly }) => {
    const [hover, setHover] = useState(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</label>
            <div style={{ display: 'flex', gap: '1px', alignItems: 'center' }}>
                {[...Array(10)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <FaStar
                            key={index}
                            size={14}
                            color={ratingValue <= (hover || value) ? "#d69e2e" : "#cbd5e0"}
                            style={{ cursor: readonly ? 'default' : 'pointer', transition: 'color 0.2s' }}
                            onMouseEnter={() => !readonly && setHover(ratingValue)}
                            onMouseLeave={() => !readonly && setHover(0)}
                            onClick={() => !readonly && onChange && onChange(ratingValue)}
                        />
                    );
                })}
                <span style={{ marginLeft: '0.25rem', fontSize: '0.8rem', color: '#d69e2e', fontWeight: 'bold' }}>
                    {value > 0 ? value : '-'}
                </span>
            </div>
        </div>
    );
};

interface TastingRatingProps {
    ratings: {
        aroma: number;
        texture: number;
        potency: number;
        color?: number;
        overall?: number;
    };
    onChange?: (newRatings: any) => void;
    readonly?: boolean;
}

export const TastingRating: React.FC<TastingRatingProps> = ({ ratings, onChange, readonly }) => {
    const handleChange = (field: string, val: number) => {
        if (onChange) {
            onChange({ ...ratings, [field]: val });
        }
    };

    return (
        <div style={{ background: '#f7fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
            <h4 style={{ color: '#2d3748', marginTop: 0, marginBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', fontSize: '1rem' }}>
                📊 Cata & Calidad
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <StarRater label="Aroma / Terpenos" value={ratings.aroma} onChange={(v) => handleChange('aroma', v)} readonly={readonly} />
                <StarRater label="Textura / Consistencia" value={ratings.texture} onChange={(v) => handleChange('texture', v)} readonly={readonly} />
                <StarRater label="Potencia / Efecto" value={ratings.potency} onChange={(v) => handleChange('potency', v)} readonly={readonly} />
                <StarRater label="Aspecto / Color" value={ratings.color || 0} onChange={(v) => handleChange('color', v)} readonly={readonly} />
            </div>
        </div>
    );
};
