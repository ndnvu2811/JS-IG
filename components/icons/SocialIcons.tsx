import React from 'react';

export const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    // Corrected the malformed viewBox attribute in the svg tag, which had an extra quote causing a parsing error.
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <defs>
            <radialGradient id="instagram-gradient" cx="0.3" cy="1" r="1">
                <stop offset="0" stopColor="#F77737" />
                <stop offset="0.5" stopColor="#E1306C" />
                <stop offset="1" stopColor="#833AB4" />
            </radialGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#instagram-gradient)" fill="none" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#instagram-gradient)" fill="none" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#instagram-gradient)" fill="none" />
    </svg>
);
