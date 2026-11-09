// Event tickets go through the normal shop cart (Cart.jsx). The server prices each ticket
// from events.ticket_price and issues it to the logged-in buyer after checkout.
const CART_KEY = "rogue_cart_items";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80";

// Only events saved in the database can be sold (sample events have ids like "tetris-showdown")
export const isRealEventId = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ""));

export const ticketPriceOf = (ev) => Number(ev?.ticketPrice ?? ev?.ticket_price) || 0;

// Upcoming, paid, real events: the ones a fan can buy a ticket for
export const isTicketOnSale = (ev) => {
  if (!ev || !isRealEventId(ev.id)) return false;
  if (!(ev.isPaid ?? ev.is_paid) || ticketPriceOf(ev) <= 0) return false;
  const status = String(ev.rawStatus || ev.status || "").toLowerCase();
  if (["completed", "cancelled", "past"].includes(status)) return false;
  const when = ev.rawDate || ev.date;
  // allow the event day itself (live events stay on sale)
  return !when || new Date(when).getTime() > Date.now() - 24 * 60 * 60 * 1000;
};

const readCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

// Adds one ticket (or one more of the same) and returns { ok, qty } or { ok: false, reason }
export const addTicketToCart = (ev) => {
  if (!isRealEventId(ev?.id)) return { ok: false, reason: "Tickets for this event are not on sale yet." };
  const price = ticketPriceOf(ev);
  if (price <= 0) return { ok: false, reason: "This event is free to watch. No ticket is needed." };

  const items = readCart();
  const id = `ticket-${ev.id}`;
  const existing = items.find((i) => i.id === id);
  let qty = 1;
  if (existing) {
    existing.qty = Math.min(100, (Number(existing.qty) || 1) + 1);
    existing.price = price;
    qty = existing.qty;
  } else {
    items.push({
      id,
      type: "ticket",
      eventId: ev.id,
      title: `${ev.title} — Spectator Ticket`,
      price,
      img: ev.imageUrl || ev.image || ev.img || FALLBACK_IMG,
      qty: 1,
      eventDate: ev.rawDate || ev.date || null,
    });
  }
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    return { ok: false, reason: "Your browser blocked the cart. Please allow site storage and try again." };
  }
  return { ok: true, qty };
};
