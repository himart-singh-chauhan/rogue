// Security check on sign-up and sign-in (Cloudflare Turnstile, "managed" mode).
// Most visitors never see anything: Cloudflare only shows a check when the visit looks suspicious.
// The token it gives is sent with the form and checked by the server. Off until VITE_TURNSTILE_SITE_KEY is set.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
export const captchaOn = !!SITE_KEY;

let loader = null;
const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("not loaded")));
      s.onerror = () => { loader = null; reject(new Error("not loaded")); };
      document.head.appendChild(s);
    });
  }
  return loader;
};

const Captcha = forwardRef(function Captcha({ onToken, theme = "dark" }, ref) {
  const box = useRef(null);
  const widget = useRef(null);
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;
  const [failed, setFailed] = useState(false);

  // A token works once: after every sign-in attempt the form asks for a fresh one
  useImperativeHandle(ref, () => ({
    reset: () => {
      tokenCb.current?.("");
      if (widget.current != null && window.turnstile) { try { window.turnstile.reset(widget.current); } catch { /* already gone */ } }
    },
  }), []);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let gone = false;
    loadTurnstile()
      .then((t) => {
        if (gone || !box.current) return;
        widget.current = t.render(box.current, {
          sitekey: SITE_KEY,
          theme,
          appearance: "interaction-only", // shown only when Cloudflare needs the visitor to do something
          "refresh-expired": "auto",
          callback: (token) => tokenCb.current?.(token),
          "expired-callback": () => tokenCb.current?.(""),
          "error-callback": () => { tokenCb.current?.(""); },
        });
      })
      .catch(() => { if (!gone) setFailed(true); });
    return () => {
      gone = true;
      if (widget.current != null && window.turnstile) { try { window.turnstile.remove(widget.current); } catch { /* ignore */ } }
      widget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div>
      <div ref={box} style={{ display: "flex", justifyContent: "center" }} />
      {failed && (
        <div role="alert" style={{ color: "#f87171", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6 }}>
          The security check could not load. Please check your connection and refresh the page.
        </div>
      )}
    </div>
  );
});

export default Captcha;
