// Reusable SVG placeholder graphics for services and user accounts

export const DEFAULT_SERVICE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bgGrad)"/>
      <g transform="translate(250, 130)" fill="#64748B">
        <path d="M72 64a18 18 0 1 1-36 0 18 18 0 0 1 36 0z" opacity="0.85"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M20 10c-13.255 0-20 8.745-20 22v110c0 13.255 8.745 22 20 22h140c13.255 0 20-8.745 20-22V32c0-13.255-8.745-22-20-22H20zm140 12c5.523 0 8 3.477 8 10v72l-42.324-21.364a6 6 0 0 0-6.924 1.116l-41.52 41.52-30.92-20.264a6 6 0 0 0-7.56.744L10 132V32c0-6.523 3.477-10 8-10h142z"/>
      </g>
      <rect x="235" y="115" width="130" height="130" rx="14" stroke="#94A3B8" stroke-width="2" stroke-dasharray="6 6" fill="none"/>
      <text x="300" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="700" fill="#334155" text-anchor="middle">No Picture Uploaded</text>
      <text x="300" y="304" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">SerbisYou Service Placeholder</text>
    </svg>
  `);

export const DEFAULT_AVATAR_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none">
      <rect width="200" height="200" fill="#E2E8F0"/>
      <g fill="#94A3B8">
        <path d="M100 100a36 36 0 1 0 0-72 36 36 0 0 0 0 72zm-54 70c0-29.822 24.178-54 54-54s54 24.178 54 54H46z"/>
      </g>
    </svg>
  `);
