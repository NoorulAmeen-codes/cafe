'use client';

const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function Icon({ name, size = 20, style }) {
  const paths = {
    cake: <><path d="M3 20h18M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" {...P} /><path d="M12 8V5m0 0 1.2-1.2M12 5l-1.2-1.2" {...P} /><path d="M5 16c1.5 1 2.5-1 4-1s2.5 2 4 1 2.5-1 4 0" {...P} /></>,
    croissant: <><path d="M3 14c3-6 15-6 18 0-3 3-15 3-18 0Z" {...P} /><path d="M7 12.5 6 9m5 2.6V8m5 4.5 1-3.5" {...P} /></>,
    cookie: <><circle cx="12" cy="12" r="9" {...P} /><circle cx="9" cy="10" r="1" fill="currentColor" /><circle cx="14" cy="9" r="1" fill="currentColor" /><circle cx="13" cy="15" r="1" fill="currentColor" /><circle cx="8.5" cy="14.5" r="1" fill="currentColor" /></>,
    bread: <><path d="M4 10c0-3 3.5-4 8-4s8 1 8 4c0 1.5-1.5 2-2 2v6H6v-6c-.5 0-2-.5-2-2Z" {...P} /></>,
    cup: <><path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" {...P} /><path d="M9 5c0-1 .5-1.5 1-2m3 2c0-1 .5-1.5 1-2" {...P} /></>,
    search: <><circle cx="11" cy="11" r="7" {...P} /><path d="m20 20-3.5-3.5" {...P} /></>,
    user: <><circle cx="12" cy="8" r="3.6" {...P} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...P} /></>,
    basket: <><path d="M4 9h16l-1.4 9.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8L4 9Z" {...P} /><path d="m8.5 9 2-5m5 5-2-5" {...P} /></>,
    heart: <><path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" {...P} /></>,
    star: <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19l1-5.9L3.5 9l5.9-.8L12 3Z" fill="currentColor" />,
    clock: <><circle cx="12" cy="12" r="9" {...P} /><path d="M12 7v5l3.2 2" {...P} /></>,
    phone: <><path d="M6 3h3l2 5-2.2 1.4a12 12 0 0 0 5.8 5.8L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z" {...P} /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" {...P} /><path d="m4 7 8 6 8-6" {...P} /></>,
    pin: <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" {...P} /><circle cx="12" cy="10" r="2.6" {...P} /></>,
    bike: <><circle cx="6" cy="17" r="3" {...P} /><circle cx="18" cy="17" r="3" {...P} /><path d="M6 17 10 8h4l3 9M9 8h6" {...P} /></>,
    bag: <><path d="M6 8h12l1 12H5L6 8Z" {...P} /><path d="M9 8V6a3 3 0 0 1 6 0v2" {...P} /></>,
    leaf: <><path d="M4 20c0-8 6-14 16-14 0 10-6 14-13 14H4Z" {...P} /><path d="M8 16c2-3 5-5 8-6" {...P} /></>,
    egg: <><path d="M12 3c4 0 6 6 6 10a6 6 0 0 1-12 0c0-4 2-10 6-10Z" {...P} /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" {...P} /></>,
    arrow: <><path d="M5 12h14m-5-6 6 6-6 6" {...P} /></>,
    back: <><path d="M19 12H5m6 6-6-6 6-6" {...P} /></>,
    plus: <><path d="M12 5v14M5 12h14" {...P} /></>,
    minus: <><path d="M5 12h14" {...P} /></>,
    trash: <><path d="M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13" {...P} /></>,
    edit: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" {...P} /></>,
    check: <><path d="m5 13 4 4L19 7" {...P} /></>,
    close: <><path d="M6 6l12 12M18 6 6 18" {...P} /></>,
    chat: <><path d="M20 15a3 3 0 0 1-3 3H9l-4 3V6a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9Z" {...P} /></>,
    dash: <><rect x="3" y="3" width="8" height="8" rx="2" {...P} /><rect x="13" y="3" width="8" height="5" rx="2" {...P} /><rect x="13" y="10" width="8" height="11" rx="2" {...P} /><rect x="3" y="13" width="8" height="8" rx="2" {...P} /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" {...P} /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" {...P} /></>,
    users: <><circle cx="9" cy="8" r="3.2" {...P} /><path d="M3 19a6 6 0 0 1 12 0" {...P} /><path d="M16 6.5a3 3 0 0 1 0 5.6M17 19a6 6 0 0 0-1.5-4" {...P} /></>,
    slides: <><rect x="3" y="5" width="18" height="12" rx="2" {...P} /><path d="M8 21h8" {...P} /></>,
    palette: <><path d="M12 21a9 9 0 1 1 9-9c0 2-1.6 3-3 3h-1.5a2 2 0 0 0-1.3 3.5c.5.6.2 2.5-3.2 2.5Z" {...P} /><circle cx="7.5" cy="12" r="1.2" fill="currentColor" /><circle cx="10" cy="8" r="1.2" fill="currentColor" /><circle cx="15" cy="8.5" r="1.2" fill="currentColor" /></>,
    bug: <><path d="M8 8a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0V8Z" {...P} /><path d="M4 10h4m8 0h4M4 16h4m8 0h4M9 5 7.5 3.5M15 5l1.5-1.5M12 21v-2" {...P} /></>,
    gear: <><circle cx="12" cy="12" r="3" {...P} /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" {...P} /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" {...P} /><path d="m3 13 9 5 9-5" {...P} /></>,
    logout: <><path d="M15 12H4m4-4-4 4 4 4" {...P} /><path d="M11 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6" {...P} /></>,
    truck: <><path d="M3 7h11v9H3V7Z" {...P} /><path d="M14 10h4l3 3v3h-7v-6Z" {...P} /><circle cx="7" cy="18" r="2" {...P} /><circle cx="17" cy="18" r="2" {...P} /></>,
    rupee: <><path d="M7 4h10M7 9h10M16 4c0 4-3.5 5-7 5l7 11" {...P} /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden="true">
      {paths[name] || paths.cake}
    </svg>
  );
}

export function Stars({ value = 5, size = 13 }) {
  const full = Math.round(value);
  return (
    <span className="stars" style={{ display: 'inline-flex' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" style={{ opacity: i <= full ? 1 : 0.25 }}>
          <path d="m12 3 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8L6.8 19l1-5.9L3.5 9l5.9-.8L12 3Z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

export function GoogleG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4Z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8A13 13 0 1 0 16 3Zm0 23.7c-2 0-4-.5-5.7-1.6l-.4-.2-4 1 1.1-3.9-.3-.4A10.7 10.7 0 1 1 16 26.7Zm6-8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.8.2-.2.3-.8 1-1 1.2-.2.2-.4.3-.7.1a8.7 8.7 0 0 1-4.3-3.7c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.6-.5-.8-.6h-.7c-.2 0-.6.1-1 .5-.3.4-1.2 1.2-1.2 2.9s1.3 3.4 1.4 3.6c.2.2 2.5 3.9 6.1 5.4 2.3 1 3.2 1 4.3.9.7-.1 1.9-.8 2.2-1.6.3-.8.3-1.4.2-1.6-.1-.2-.3-.3-.6-.4Z" />
    </svg>
  );
}
