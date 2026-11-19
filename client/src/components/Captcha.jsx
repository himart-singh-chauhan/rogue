// Security check on sign-up and sign-in (Cloudflare Turnstile, "managed" mode).
// Most visitors never see anything: Cloudflare only shows "Verify you are human" when the visit looks suspicious.
// The token it gives is sent with the form and checked by the server. Off until VITE_TURNSTILE_SITE_KEY is set.
//
// The form calls ref.getToken() when it is submitted: that waits for Cloudflare to finish (instead of making the
// visitor press the button twice), and says plainly what to do if a click is needed or the check failed.
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

// What the visitor is told when the form can't go ahead yet
export const captchaMessage = (status, action = "press the button again") => {
  if (status === "ask") return `Please tick "Verify you are human" below, then ${action}.`;
  if (status === "error") return `The security check didn't work. Press "Try the security check again" below, then ${action}.`;
  return `The security check is still running. Please wait a few seconds, then ${action}.`;
};

const Captcha = forwardRef(function Captcha({ onToken, theme = "dark" }, ref) {
  const box = useRef(null);
  const widget = useRef(null);
  const token = useRef("");
  const waiters = useRef([]);
  const statusRef = useRef("loading");
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;
  const [status, setStatusState] = useState("loading"); // loading | ready | ask | error
  const [errorCode, setErrorCode] = useState("");
  const setStatus = (s) => { statusRef.current = s; setStatusState(s); };

  const giveToken = (t) => {
    token.current = t || "";
    tokenCb.current?.(token.current);
    if (token.current) { const w = waiters.current; waiters.current = []; w.forEach((fn) => fn(token.current)); }
  };

  const retry = () => {
    giveToken("");
    setErrorCode("");
    setStatus("loading");
    if (widget.current != null && window.turnstile) { try { window.turnstile.reset(widget.current); } catch { /* gone */ } }
  };

  useImperativeHandle(ref, () => ({
    // a token works once: after every attempt the form asks for a fresh one
    reset: retry,
    status: () => statusRef.current,
    // resolves with a token, or "" if none arrived in time
    getToken: (timeoutMs = 15000) => new Promise((resolve) => {
      if (token.current) { resolve(token.current); return; }
      waiters.current.push(resolve);
      setTimeout(() => { waiters.current = waiters.current.filter((fn) => fn !== resolve); resolve(token.current); }, timeoutMs);
    }),
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
          callback: (tok) => { setStatus("ready"); giveToken(tok); },
          "expired-callback": () => { giveToken(""); setStatus("loading"); },
          "before-interactive-callback": () => setStatus("ask"),
          "after-interactive-callback": () => { if (statusRef.current === "ask") setStatus("loading"); },
          "error-callback": (code) => { giveToken(""); setErrorCode(String(code || "")); setStatus("error"); console.warn("[Security check] Cloudflare error", code); return true; },
          "unsupported-callback": () => { giveToken(""); setErrorCode("unsupported browser"); setStatus("error"); },
        });
      })
      .catch(() => { if (!gone) { setErrorCode("could not load"); setStatus("error"); } });
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
      {status === "ask" && (
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6 }}>
          Quick check: tick "Verify you are human" to continue.
        </div>
      )}
      {status === "error" && (
        <div role="alert" style={{ color: "#f87171", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
          The security check could not run{errorCode ? ` (Cloudflare error ${errorCode})` : ""}. Turning off ad blockers or VPNs for this site can help.{" "}
          <button type="button" onClick={retry} style={{ background: "none", border: "none", color: "#FF6A00", fontWeight: 900, cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: 0 }}>
            Try the security check again
          </button>
        </div>
      )}
    </div>
  );
});

export default Captcha;
