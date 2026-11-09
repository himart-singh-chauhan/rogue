// One list of shop categories, used by the public Shop tabs and the Admin product forms,
// so a product saved in a category always shows up under that tab.
export const SHOP_CATEGORIES = [
  'Certificates',
  'Championship Belts',
  'Chains',
  'Medals',
  'Trophies',
  'Awards',
  'Apparel',
  'Accessories',
  'Equipment',
  'Supplements',
  'Tickets',
];

// Categories whose products need an administrator's approval per competitor before checkout.
export const AUTHORIZATION_CATEGORIES = ['Championship Belts'];

// Older products were saved with labels like "CERTIFICATE" or "Equipment": map them onto the list.
const ALIASES = {
  certificate: 'Certificates',
  certificates: 'Certificates',
  belt: 'Championship Belts',
  belts: 'Championship Belts',
  'championship belt': 'Championship Belts',
  'championship belts': 'Championship Belts',
  chain: 'Chains',
  chains: 'Chains',
  medal: 'Medals',
  medals: 'Medals',
  trophy: 'Trophies',
  trophies: 'Trophies',
  award: 'Awards',
  awards: 'Awards',
  apparel: 'Apparel',
  accessories: 'Accessories',
  equipment: 'Equipment',
  hardware: 'Equipment',
  supplements: 'Supplements',
  tickets: 'Tickets',
  ticket: 'Tickets',
};

export const normalizeShopCategory = (raw) => {
  const key = String(raw || '').trim().toLowerCase();
  return ALIASES[key] || (raw ? String(raw).trim() : 'Accessories');
};

export const categorySlug = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
