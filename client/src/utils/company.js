// Company details and social links from Admin → System → Company & social links (loaded once per visit).
import { useEffect, useState } from "react";
import { apiCall } from "./api";

let cached = null;
let loading = null;
export const loadCompany = () => {
  if (cached) return Promise.resolve(cached);
  if (!loading) loading = apiCall("/settings/company", "GET").then((c) => { cached = c; return c; }).catch(() => { loading = null; return null; });
  return loading;
};
export const clearCompanyCache = () => { cached = null; loading = null; };

export const useCompany = () => {
  const [company, setCompany] = useState(cached);
  useEffect(() => { let on = true; loadCompany().then((c) => { if (on && c) setCompany(c); }); return () => { on = false; }; }, []);
  return company;
};

export const SOCIALS = [
  ["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["youtube", "YouTube"], ["x", "X"],
];
