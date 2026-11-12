// The event video: a Mux live stream (or its replay) with a signed token from the server,
// otherwise the event's YouTube / Vimeo / video link. Paid events only load for ticket holders.
import { Suspense, lazy, useEffect, useState } from "react";
import { apiCall } from "../utils/api";
import { embedUrlFor } from "./EvidencePreview";

const MuxPlayer = lazy(() => import("@mux/mux-player-react"));

const box = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", color: "white", background: "#050505" };

export default function StreamPlayer({ eventId, token, title, poster, onLocked }) {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    const load = () => {
      apiCall(`/events/${eventId}/playback`, "GET", null, token)
        .then((p) => {
          if (cancelled) return;
          setState({ loading: false, playback: p });
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

  if (state.loading) return <div style={box}><div style={{ opacity: 0.6, fontWeight: 800 }}>Loading stream…</div></div>;
  if (state.error) return <div style={box}><div style={{ fontWeight: 800, marginBottom: 8 }}>Stream unavailable</div><div style={{ opacity: 0.6, fontSize: 14 }}>{state.error}</div></div>;

  const p = state.playback || {};
  if (p.source === "mux" && p.playbackId) {
    return (
      <Suspense fallback={<div style={box}><div style={{ opacity: 0.6, fontWeight: 800 }}>Loading player…</div></div>}>
        <MuxPlayer
          playbackId={p.playbackId}
          tokens={{ playback: p.tokens?.video, thumbnail: p.tokens?.thumbnail }}
          streamType={p.isLive ? "live" : "on-demand"}
          autoPlay="muted"
          accentColor="#FF6A00"
          metadata={{ video_title: title || "AMPEX event" }}
          poster={poster || undefined}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", aspectRatio: "auto", "--media-object-fit": "contain" }}
        />
      </Suspense>
    );
  }

  const link = p.streamUrl || p.videoUrl || "";
  const embed = link ? embedUrlFor(link) : null;
  if (embed) {
    return <iframe title={title || "Event stream"} src={embed} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />;
  }
  if (/\.(mp4|webm|m3u8|mov)(\?|$)/i.test(link)) {
    return <video src={link} controls autoPlay muted playsInline poster={poster || undefined} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#000" }} />;
  }
  if (link) {
    return <iframe title={title || "Event stream"} src={link} allow="autoplay; encrypted-media; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />;
  }
  return (
    <div style={box}>
      <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8, textTransform: "uppercase" }}>The stream hasn't started yet</div>
      <div style={{ opacity: 0.6, fontSize: 14 }}>Come back at the event time. This page connects automatically once we go live.</div>
    </div>
  );
}
