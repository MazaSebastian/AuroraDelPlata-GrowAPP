// Predefined palette of soft, distinct colors suitable for backgrounds with dark text
const GENETIC_PALETTE = [
    '#F0FFF4', // Mint Green
    '#EBF8FF', // Light Blue
    '#FAF5FF', // Light Purple
    '#FFF5F5', // Light Red
    '#FFFFF0', // Ivory
    '#F0F5FF', // Indigo tint
    '#E6FFFA', // Teal tint
    '#FDF2F8', // Pink tint
    '#FFFAF0', // Floral White
    '#F7FAFC', // Grayish
    '#FEFCBF', // Light Yellow
    '#C6F6D5', // Green
    '#BEE3F8', // Blue
    '#E9D8FD', // Purple
    '#FED7D7', // Red
    '#FEEBC8', // Orange
    '#C4F1F9', // Cyan
    '#D6BCFA', // Lavender
    '#9AE6B4', // Emerald
    '#FBD38D', // Gold
    '#A3BFFA', // Indigo
    '#F687B3', // Pink
];

const BORDER_PALETTE = [
    '#48BB78', // Green
    '#4299E1', // Blue
    '#9F7AEA', // Purple
    '#F56565', // Red
    '#ECC94B', // Yellow
    '#667EEA', // Indigo
    '#38B2AC', // Teal
    '#ED64A6', // Pink
    '#ED8936', // Orange
    '#A0AEC0', // Gray
    '#D69E2E', // Dark Yellow
    '#2F855A', // Dark Green
    '#2B6CB0', // Dark Blue
    '#805AD5', // Dark Purple
    '#E53E3E', // Dark Red
    '#DD6B20', // Dark Orange
    '#0BC5EA', // Dark Cyan
    '#B794F4', // Dark Lavender
    '#68D391', // Dark Emerald
    '#D69E2E', // Dark Gold
    '#5A67D8', // Dark Indigo
    '#ED64A6', // Dark Pink
];

export const getGeneticColor = (name?: string) => {
    if (!name) return { bg: '#F0FFF4', border: '#48BB78' }; // Default Green

    let hash = 5381;
    for (let i = 0; i < name.length; i++) {
        // DJB2 hash variant
        hash = ((hash << 5) + hash) + name.charCodeAt(i); /* hash * 33 + c */
    }

    const index = Math.abs(hash) % GENETIC_PALETTE.length;
    return {
        bg: GENETIC_PALETTE[index],
        border: BORDER_PALETTE[index] || BORDER_PALETTE[index % BORDER_PALETTE.length]
    };
};
