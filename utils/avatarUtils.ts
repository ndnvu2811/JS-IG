
export const generateAvatar = (seed: string): string => {
  const colors = [
    '#F77737', // Instagram Orange
    '#E1306C', // Instagram Red
    '#833AB4', // Instagram Purple
    '#405DE6', // Instagram Blue
    '#2ECC71', // Green
    '#3498DB', // Blue
    '#9B59B6', // Purple
    '#F1C40F', // Yellow
  ];
  
  // Simple hash function to pick a color
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  
  const letter = seed.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() || '?';
  
  // SVG Data URI
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold" font-size="50" fill="white" text-anchor="middle" dy=".35em">${letter}</text>
</svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
