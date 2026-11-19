// Event tickets go through the normal shop cart (Cart.jsx). The server prices each ticket
// from events.ticket_price and issues it to the logged-in buyer after checkout.
const CART_KEY = "rogue_cart_items";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80";

// Only events saved in the database can be sold (sample events have ids like "tetris-showdown")
export const isRealEventId = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ""));

export const ticketPriceOf = (ev) => Number(ev?.ticketPrice ?? ev?.ticket_price) || 0;

// One rule for every page (homepage, Live Events, event page), the same one checkout uses on the server:
// passes are on sale for a paid event with a price until the event has ended or been cancelled.
export const isTicketOnSale = (ev) => {
  if (!ev || !isRealEventId(ev.id)) return false;
  if (!(ev.isPaid ?? ev.is_paid) || ticketPriceOf(ev) <= 0) return false;
  return eventPhaseOf(ev) !== "ended";
};

// live | upcoming | ended
export const eventPhaseOf = (ev) => {
  const status = String(ev?.rawStatus || ev?.status || "").toLowerCase();
  if (["completed", "cancelled", "past"].includes(status)) return "ended";
  if (ev?.isLive || ev?.is_live || status === "live") return "live";
  return "upcoming";
};

/**
 * What every page shows for an event: its state, whether it's free, the pass price, and the main button.
 * hasPass: the visitor already has a pass for it (paid events only).
 */
export const eventAccessOf = (ev, { hasPass = false } = {}) => {
  const phase = eventPhaseOf(ev);
  const isPaid = !!(ev?.isPaid ?? ev?.is_paid);
  const price = ticketPriceOf(ev);
  const onSale = isTicketOnSale(ev);
  const priceText = isPaid && price > 0 ? `$${price.toFixed(2)}` : "Free";
  let action; // "watch" | "pass" | "view" | "none"
  let label;
  if (!isPaid || hasPass) {
    action = phase === "upcoming" ? "view" : "watch";
    label = phase === "live" ? "Watch Live" : phase === "ended" ? "Watch Replay" : "View Event";
  } else if (onSale) {
    action = "pass";
    label = "Get a Spectator Pass";
  } else {
    action = "none";
    label = phase === "ended" ? "Event Ended" : "Passes Not On Sale Yet";
  }
  return { phase, isPaid, price, priceText, onSale, action, label };
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
