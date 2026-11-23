// Security check on sign-up, sign-in and password reset.
//  - Google reCAPTCHA v2: the "I'm not a robot" checkbox, shown every time (VITE_RECAPTCHA_SITE_KEY). Used when set.
//  - otherwise Cloudflare Turnstile, which only asks when a visit looks suspicious (VITE_TURNSTILE_SITE_KEY).
// The token is sent with the form and checked by the server. The form calls ref.getToken() when it is
// submitted, and shows captchaMessage(ref.status()) when no token is available yet.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const RECAPTCHA_KEY = String(import.meta.env.VITE_RECAPTCHA_SITE_KEY || "").trim();
const TURNSTILE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
const PROVIDER = RECAPTCHA_KEY ? "recaptcha" : TURNSTILE_KEY ? "turnstile" : "";
export const captchaOn = !!PROVIDER;

const loaders = {};
const loadScript = (name, src, ready) => {
  if (ready()) return Promise.resolve(ready());
  if (!loaders[name]) {
    loaders[name] = new Promise((resolve, reject) => {
      const cb = `__ampexCaptcha_${name}`;
      window[cb] = () => resolve(ready());
      const s = document.createElement("script");
      s.src = src.replace("{cb}", cb);
      s.async = true;
      s.onerror = () => { loaders[name] = null; reject(new Error("not loaded")); };
      document.head.appendChild(s);
    });
  }
  return loaders[name];
};
const loadProvider = () => PROVIDER === "recaptcha"
  ? loadScript("recaptcha", "https://www.google.com/recaptcha/api.js?render=explicit&onload={cb}", () => window.grecaptcha?.render && window.grecaptcha)
  : loadScript("turnstile", "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload={cb}", () => window.turnstile);

// What the visitor is told when the form can't go ahead yet
export const captchaMessage = (status, action = "press the button again") => {
  if (status === "ask") return PROVIDER === "recaptcha" ? `Please tick "I'm not a robot" below, then ${action}.` : `Please tick "Verify you are human" below, then ${action}.`;
  if (status === "error") return `The security check didn't work. Press "Try the security check again" below, then ${action}.`;
  return `The security check is still loading. Please wait a few seconds, then ${action}.`;
};

const Captcha = forwardRef(function Captcha({ onToken, theme = "dark" }, ref) {
  const box = useRef(null);
  const widget = useRef(null);
  const token = useRef("");
  const waiters = useRef([]);
  // reCAPTCHA always needs the tick; Turnstile usually passes by itself
  const statusRef = useRef(PROVIDER === "recaptcha" ? "ask" : "loading");
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;
  const [status, setStatusState] = useState(statusRef.current);
  const [errorCode, setErrorCode] = useState("");
  const setStatus = (s) => { statusRef.current = s; setStatusState(s); };

  const giveToken = (t) => {
    token.current = t || "";
    tokenCb.current?.(token.current);
    if (token.current) { const w = waiters.current; waiters.current = []; w.forEach((fn) => fn(token.current)); }
  };
  const resetWidget = () => {
    try {
      if (widget.current == null) return;
      if (PROVIDER === "recaptcha") window.grecaptcha?.reset(widget.current);
      else window.turnstile?.reset(widget.current);
    } catch { /* gone */ }
  };
  const retry = () => {
    giveToken("");
    setErrorCode("");
    setStatus(PROVIDER === "recaptcha" ? "ask" : "loading");
    resetWidget();
  };

  useImperativeHandle(ref, () => ({
    // a token works once: after every attempt the form asks for a fresh one
    reset: retry,
    status: () => statusRef.current,
    // resolves with a token, or "" if none arrived in time (reCAPTCHA: answers at once, the tick can't be waited for)
    getToken: (timeoutMs = 15000) => new Promise((resolve) => {
      if (token.current) { resolve(token.current); return; }
      if (PROVIDER === "recaptcha") { resolve(""); return; }
      waiters.current.push(resolve);
      setTimeout(() => { waiters.current = waiters.current.filter((fn) => fn !== resolve); resolve(token.current); }, timeoutMs);
    }),
  }), []);

  useEffect(() => {
    if (!PROVIDER) return undefined;
    let gone = false;
    loadProvider()
      .then((api) => {
        if (gone || !box.current) return;
        if (PROVIDER === "recaptcha") {
          widget.current = api.render(box.current, {
            sitekey: RECAPTCHA_KEY,
            theme,
            callback: (tok) => { setStatus("ready"); giveToken(tok); },
            "expired-callback": () => { giveToken(""); setStatus("ask"); },
            "error-callback": () => { giveToken(""); setErrorCode("network"); setStatus("error"); },
          });
        } else {
          widget.current = api.render(box.current, {
            sitekey: TURNSTILE_KEY,
            theme,
            appearance: "interaction-only",
            "refresh-expired": "auto",
            callback: (tok) => { setStatus("ready"); giveToken(tok); },
            "expired-callback": () => { giveToken(""); setStatus("loading"); },
            "before-interactive-callback": () => setStatus("ask"),
            "after-interactive-callback": () => { if (statusRef.current === "ask") setStatus("loading"); },
            "error-callback": (code) => { giveToken(""); setErrorCode(String(code || "")); setStatus("error"); console.warn("[Security check] Cloudflare error", code); return true; },
            "unsupported-callback": () => { giveToken(""); setErrorCode("unsupported browser"); setStatus("error"); },
          });
        }
      })
      .catch(() => { if (!gone) { setErrorCode("could not load"); setStatus("error"); } });
    return () => {
      gone = true;
      if (widget.current != null && PROVIDER === "turnstile" && window.turnstile) { try { window.turnstile.remove(widget.current); } catch { /* ignore */ } }
      widget.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!PROVIDER) return null;
  return (
    <div>
      <div ref={box} style={{ display: "flex", justifyContent: "center", minHeight: PROVIDER === "recaptcha" ? 78 : 0 }} />
      {status === "ask" && PROVIDER === "turnstile" && (
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6 }}>
          Quick check: tick "Verify you are human" to continue.
        </div>
      )}
      {status === "error" && (
        <div role="alert" style={{ color: "#f87171", fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
          The security check could not run{errorCode ? ` (${errorCode})` : ""}. Turning off ad blockers or VPNs for this site can help.{" "}
          <button type="button" onClick={retry} style={{ background: "none", border: "none", color: "#FF6A00", fontWeight: 900, cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: 0 }}>
            Try the security check again
          </button>
        </div>
      )}
    </div>
  );
});

export default Captcha;
