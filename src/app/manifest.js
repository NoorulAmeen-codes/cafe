export default function manifest() {
  return {
    name: 'Aadhis Cake Cafe',
    short_name: 'Aadhis Cafe',
    description: 'Fresh cakes and bakes from Aadhis Cake Cafe',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffaf0',
    theme_color: '#7a4a1d',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}