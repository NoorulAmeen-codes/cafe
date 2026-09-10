'use client';

import { useEffect, useRef, useState } from 'react';

let leafletPromise = null;

function loadLeaflet() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Map library could not be loaded'));
    document.body.appendChild(script);
  });
  return leafletPromise;
}

/**
 * OpenStreetMap based map. Shows the shop, its delivery radius and (optionally)
 * a draggable pin the visitor or admin can drop on their exact spot.
 */
export default function MapView({
  lat, lng, zoom = 14, height = 340, radiusKm = 0,
  pin = null, draggable = false, onPinChange, className = '',
}) {
  const ref = useRef(null);
  const map = useRef(null);
  const shopMarker = useRef(null);
  const pinMarker = useRef(null);
  const circle = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !ref.current || map.current) return;
        map.current = L.map(ref.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map.current);

        const shopIcon = L.divIcon({
          className: '',
          html: `<div style="font-size:26px;line-height:1;transform:translate(-50%,-100%)">📍</div>`,
          iconSize: [1, 1],
        });
        shopMarker.current = L.marker([lat, lng], { icon: shopIcon }).addTo(map.current);

        if (draggable) {
          const pinIcon = L.divIcon({
            className: '',
            html: `<div style="font-size:26px;line-height:1;transform:translate(-50%,-100%)">🏠</div>`,
            iconSize: [1, 1],
          });
          const start = pin || { lat, lng };
          pinMarker.current = L.marker([start.lat, start.lng], { icon: pinIcon, draggable: true }).addTo(map.current);
          pinMarker.current.on('dragend', () => {
            const p = pinMarker.current.getLatLng();
            onPinChange?.({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
          });
          map.current.on('click', (e) => {
            pinMarker.current.setLatLng(e.latlng);
            onPinChange?.({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
          });
        }
      })
      .catch((e) => setError(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    if (!L || !map.current) return;
    shopMarker.current?.setLatLng([lat, lng]);
    map.current.setView([lat, lng], map.current.getZoom());
    if (circle.current) { circle.current.remove(); circle.current = null; }
    if (radiusKm > 0) {
      circle.current = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: 'var(--primary)', weight: 2, fillColor: '#f0b429', fillOpacity: 0.12,
      }).addTo(map.current);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    if (!pinMarker.current || !pin) return;
    pinMarker.current.setLatLng([pin.lat, pin.lng]);
  }, [pin?.lat, pin?.lng]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div
        ref={ref}
        style={{ height, width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden', zIndex: 1, background: '#e8e0d2' }}
      />
      {error && (
        <div className="alert alert-warn" style={{ marginTop: 8 }}>
          {error} — you can still enter your pincode manually.
        </div>
      )}
    </div>
  );
}
