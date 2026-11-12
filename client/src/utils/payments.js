// Stripe Checkout helpers: members pay on Stripe's secure page and come back with
// ?payment=success&session_id=… (or ?payment=cancelled&ref=…). Card details never touch this site.
import { apiCall } from "./api";

export const goToCheckout = (url) => {
  window.location.assign(url);
};

export const readPaymentReturn = () => {
  const p = new URLSearchParams(window.location.search);
  return { status: p.get("payment"), sessionId: p.get("session_id"), ref: p.get("ref") };
};

// Remove the payment details from the address bar so a refresh doesn't repeat anything
export const clearPaymentReturn = () => {
  const url = new URL(window.location.href);
  ["payment", "session_id", "ref"].forEach((k) => url.searchParams.delete(k));
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Ask the server for the result of a checkout. Stripe can take a moment to confirm,
 * so a "pending" answer is checked again a few times.
 */
export const checkPayment = async (sessionId, token, tries = 6) => {
  let last = null;
  for (let i = 0; i < tries; i++) {
    last = await apiCall(`/payments/stripe/session/${encodeURIComponent(sessionId)}`, "GET", null, token);
    if (last?.payment?.status !== "pending") return last;
    await wait(1500);
  }
  return last;
};

export const cancelPayment = (ref, token) =>
  ref ? apiCall(`/payments/stripe/cancel/${encodeURIComponent(ref)}`, "POST", {}, token).catch(() => null) : Promise.resolve(null);

export const openBillingPortal = async (token) => {
  const { url } = await apiCall("/payments/stripe/portal", "POST", {}, token);
  window.location.assign(url);
};
