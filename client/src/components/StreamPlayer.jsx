// The event video: a Mux live stream (or its replay) with a signed token from the server,
// otherwise the event's YouTube / Vimeo / video link. Paid events only load for pass holders; after a paid
// event ends, pass holders can watch the replay for 24 hours.
// Browsers only start video by itself with the sound off, so a "Tap for sound" button turns it on.
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { apiCall } from "../utils/api";
import { embedUrlFor } from "./EvidencePreview";

const MuxPlayer = lazy(() => import("@mux/mux-player-react"));

const box = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", color: "white", background: "#050505" };

function SoundButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 5, display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.72)", color: "white", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 100, padding: "14px 24px", fontSize: 15, fontWeight: 900, cursor: "pointer", backdropFilter: "blur(6px)" }}>
      <Volume2 size={20} /> Tap for sound
    </button>
  );
}

const withSound = (embed) => embed.replace("mute=1&", "mute=0&").replace("muted=1&", "muted=0&");

export default function StreamPlayer({ eventId, token, title, poster, onLocked, onReady }) {
  const [state, setState] = useState({ loading: true });
  const readySent = useRef(false);
  const [soundOn, setSoundOn] = useState(false);
  const muxRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const load = () => {
      apiCall(`/events/${eventId}/playback`, "GET", null, token)
        .then((p) => {
          if (cancelled) return;
          setState({ loading: false, playback: p });
          // tell the page once, only when there is something to actually watch
          if (!readySent.current && ((p?.source === "mux" && p?.playbackId) || p?.streamUrl || p?.videoUrl)) {
            readySent.current = true;
            onReady?.(p);
          }
          // Waiting for the broadcast: check again shortly. Tokens last a few hours: refresh them hourly.
          if (p?.waiting) timer = setTimeout(load, 20 * 1000);
          else if (p?.source === "mux") timer = setTimeout(load, 60 * 60 * 1000);
        })
        .catch((e) => {
          if (cancelled) return;
          if (/spectator pass|locked/i.test(e.message || "")) onLocked?.();
          setState({ loading: false, error: e.message || "The stream could not be loaded." });
        });
    };
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, token]);

  const turnSoundOn = () => {
    setSoundOn(true);
    const m = muxRef.current;
    if (m) { m.muted = false; m.volume = 1; m.play?.().catch(() => {}); }
    const v = videoRef.current;
    if (v) { v.muted = false; v.volume = 1; v.play?.().catch(() => {}); }
  };

  if (state.loading) return <div style={box}><div style={{ opacity: 0.6, fontWeight: 800 }}>Loading stream…</div></div>;
  if (state.error) return <div style={box}><div style={{ fontWeight: 800, marginBottom: 8 }}>Stream unavailable</div><div style={{ opacity: 0.6, fontSize: 14, maxWidth: 460 }}>{state.error}</div></div>;

  const p = state.playback || {};
  const replayNote = p.replayUntil && !p.isLive
    ? <div style={{ position: "absolute", left: 12, top: 12, zIndex: 4, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 800, color: "white" }}>Replay available until {new Date(p.replayUntil).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div>
    : null;

  if (p.source === "mux" && p.playbackId) {
    return (
      <Suspense fallback={<div style={box}><div style={{ opacity: 0.6, fontWeight: 800 }}>Loading player…</div></div>}>
        {replayNote}
        <MuxPlayer
          ref={muxRef}
          playbackId={p.playbackId}
          tokens={{ playback: p.tokens?.video, thumbnail: p.tokens?.thumbnail }}
          streamType={p.isLive ? "live" : "on-demand"}
          autoPlay="muted"
          accentColor="#FF6A00"
          metadata={{ video_title: title || "AMPEX event" }}
          poster={poster || undefined}
          onVolumeChange={(e) => { if (!e.target.muted) setSoundOn(true); }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", aspectRatio: "auto", "--media-object-fit": "contain" }}
        />
        {!soundOn && <SoundButton onClick={turnSoundOn} />}
      </Suspense>
    );
  }

  const link = p.streamUrl || p.videoUrl || "";
  const embed = link ? embedUrlFor(link) : null;
  if (embed) {
    return (
      <>
        {replayNote}
        <iframe key={soundOn ? "sound" : "muted"} title={title || "Event stream"} src={soundOn ? withSound(embed) : embed} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
        {!soundOn && <SoundButton onClick={() => setSoundOn(true)} />}
      </>
    );
  }
  if (/\.(mp4|webm|m3u8|mov)(\?|$)/i.test(link)) {
    return (
      <>
        {replayNote}
        <video ref={videoRef} src={link} controls autoPlay muted playsInline poster={poster || undefined} onVolumeChange={(e) => { if (!e.target.muted) setSoundOn(true); }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />
        {!soundOn && <SoundButton onClick={turnSoundOn} />}
      </>
    );
  }
  if (link) {
    return <iframe title={title || "Event stream"} src={link} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />;
  }
  return (
    <div style={box}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8, textTransform: "uppercase" }}>{p.ended ? "This event has ended" : "The stream hasn't started yet"}</div>
      <div style={{ opacity: 0.6, fontSize: 14 }}>{p.ended ? "The replay will appear here once it is ready." : "Come back at the event time. This page connects automatically once we go live."}</div>
    </div>
  );
}
