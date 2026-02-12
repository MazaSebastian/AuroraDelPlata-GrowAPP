
// Generates a unique HSL color based on a string (e.g., Batch ID or Genetic Name)
// Ensures high distinctiveness by using the full HSL spectrum.

export const getUniqueBatchColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to generate HSL values
    // Hue: 0-360 (Full spectrum)
    const h = Math.abs(hash) % 360;

    // Saturation: 60-90% (Vibrant but not neon)
    const s = 60 + (Math.abs(hash >> 8) % 30);

    // Lightness: 85-95% (Very light for background readability)
    const l = 85 + (Math.abs(hash >> 16) % 10);

    // Border color is darker version of the same hue
    const borderL = Math.max(40, l - 50); // Significantly darker for contrast

    return {
        bg: `hsl(${h}, ${s}%, ${l}%)`,
        border: `hsl(${h}, ${s}%, ${borderL}%)`
    };
};
