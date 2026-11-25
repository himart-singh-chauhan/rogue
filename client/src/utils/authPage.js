// Login / Sign Up page picture and title, set in Admin → Homepage Control → "Login & Sign Up pages".
// Remembered in this browser so the page doesn't flash the old picture on the next visit.
import { useEffect, useState } from "react";
import { apiCall, formatProductImage } from "./api";

export const AUTH_PAGE_DEFAULT = {
  loginImage: "", loginKicker: "AMPEX WORLD RECORDS", loginTitle: "PUSH\nBEYOND\nLIMITS",
  signupImage: "", signupTitle: "JOIN THE\nELITE",
};
const KEY = "ampex_auth_page";
const remembered = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
let request = null;

export const useAuthPage = () => {
  const [page, setPage] = useState(() => ({ ...AUTH_PAGE_DEFAULT, ...(remembered() || {}) }));
  useEffect(() => {
    let on = true;
    if (!request) request = apiCall("/settings/auth-page", "GET").catch(() => { request = null; return null; });
    request.then((p) => {
      if (!on || !p) return;
      setPage({ ...AUTH_PAGE_DEFAULT, ...p });
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ }
    });
    return () => { on = false; };
  }, []);
  return page;
};
export const clearAuthPageCache = () => { request = null; try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
export const imageSrc = (v, fallback) => (v ? formatProductImage(v) : fallback);
