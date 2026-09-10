import './globals.css';
import { allSettings } from '@/lib/db';
import { Providers } from '@/components/Providers';

export const dynamic = 'force-dynamic';
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata() {
  const s = allSettings();
  const shop = s.shop || {};
  return {
    title: `${shop.name || 'Aadhis Cake Cafe'} — Live Cakes & Fresh Bakes`,
    description: shop.blurb || 'Fresh cakes, pastries and breads baked daily.',
  };
}

function themeCss(theme = {}) {
  const t = {
    primary: '#7a4a1d', accent: '#f0b429', bg: '#fdf6e8', surface: '#ffffff',
    text: '#3b2a17', muted: '#8a7860', success: '#1e8e5a', danger: '#d64545',
    radius: 18, font_heading: "'Fraunces', Georgia, serif", font_body: "'Nunito', system-ui, sans-serif",
    ...theme,
  };
  return `:root{
    --primary:${t.primary};--accent:${t.accent};--bg:${t.bg};--surface:${t.surface};
    --text:${t.text};--muted:${t.muted};--success:${t.success};--danger:${t.danger};
    --radius:${t.radius}px;--font-heading:${t.font_heading};--font-body:${t.font_body};
    --line:color-mix(in srgb, ${t.primary} 14%, transparent);
  }`;
}

export default function RootLayout({ children }) {
  const settings = allSettings();
  delete settings.admin;
  if (settings.payments) delete settings.payments.razorpay_key_secret;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,900&family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: themeCss(settings.theme) }} />
      </head>
      <body>
        <Providers initialSettings={settings}>{children}</Providers>
      </body>
    </html>
  );
}
