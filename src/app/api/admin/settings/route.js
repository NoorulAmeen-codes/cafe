import { allSettings, setSetting, getSetting } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { handler, ok, fail, body } from '@/lib/api';

export const dynamic = 'force-dynamic';

const GROUPS = ['shop', 'delivery', 'payments', 'theme', 'layout', 'admin'];

export const GET = handler(async () => {
 await requireAdmin()

  const settings = allSettings();

  if (settings.payments) {
    delete settings.payments.razorpay_key_secret;
  }

  if (settings.admin) {
    delete settings.admin.password;
  }

  return ok({ settings });
});

export const PUT = handler(async (req) => {
  await requireAdmin()
  const b = await body(req);
  const group = String(b.group || '');
  if (!GROUPS.includes(group)) return fail('Unknown settings group');
  const current = getSetting(group, {});
  const next = { ...current, ...(b.value || {}) };

  if (group === 'delivery') {
    next.radius_km = Math.max(0.5, Math.min(100, Number(next.radius_km) || 5));
    next.base_charge = Math.max(0, Number(next.base_charge) || 0);
    next.per_km_charge = Math.max(0, Number(next.per_km_charge) || 0);
    next.free_above = Math.max(0, Number(next.free_above) || 0);
    next.min_order = Math.max(0, Number(next.min_order) || 0);
  }
  if (group === 'shop') {
    next.lat = Number(next.lat);
    next.lng = Number(next.lng);
   if (
  !Number.isFinite(next.lat) ||
  !Number.isFinite(next.lng) ||
  next.lat < -90 ||
  next.lat > 90 ||
  next.lng < -180 ||
  next.lng > 180
) {
  return fail('Pick a valid shop location on the map');
}
    next.whatsapp = String(next.whatsapp || '').replace(/\D/g, '');
  }
  if (group === 'admin') {
  next.username = String(next.username || '').trim();

  if (!next.username) {
    return fail('Admin username is required');
  }

  if (b.value?.password) {
    const newPassword = String(b.value.password);

    if (newPassword.length < 12) {
      return fail('Admin password must be at least 12 characters');
    }

    next.password = hashPassword(newPassword);
  } else {
    next.password = current.password;
  }
}

  setSetting(group, next);

const safeValue = { ...next };

if (group === 'payments') {
  delete safeValue.razorpay_key_secret;
}

if (group === 'admin') {
  delete safeValue.password;
}

return ok({ value: safeValue });
});
