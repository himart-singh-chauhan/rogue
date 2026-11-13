// Challenge page: the record video must really be watched before "Challenge this record" opens.
// - 30 seconds of actual playback (or the whole video when it is shorter than 30 seconds)
// - only time spent playing counts; jumping ahead is undone (the player goes back to the furthest point watched)
// - a progress bar shows how much is left; the green "unlocked" note shows for a few seconds, then goes away
// Works for uploaded videos (<video>) and YouTube links (YouTube IFrame Player API).
// Give it a key per video (key={record.id}) so a new video starts from zero.
import { useEffect, useRef, useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";

const REQUIRED_SECONDS = 30;
const MAX_STEP = 1.5; // a playback step longer than this is a seek, not watching

const youtubeIdFrom = (src = "") => {
  const s = String(src);
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
};

let ytApiPromise = null;
const loadYouTubeApi = () => {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof previous === "function") previous(); resolve(window.YT); };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    });
  }
  return ytApiPromise;
};

function Badge({ color, border, children }) {
  return (
    <div style={{ position: "absolute", top: 16, left: 16, right: 16, maxWidth: 360, background: color, border: `1px solid ${border}`, padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.08em", zIndex: 3, pointerEvents: "none", transition: "opacity 0.6s" }}>
      {children}
    </div>
  );
}

export default function WatchToUnlockVideo({ src, onUnlock }) {
  const youtubeId = youtubeIdFrom(src);
  const videoRef = useRef(null);
  const ytHost = useRef(null);
  const state = useRef({ watched: 0, last: null, furthest: 0, duration: 0, unlocked: false });
  const [watched, setWatched] = useState(0);
  const [needed, setNeeded] = useState(REQUIRED_SECONDS);
  const [unlocked, setUnlocked] = useState(false);
  const [showUnlocked, setShowUnlocked] = useState(false);
  const onUnlockRef = useRef(onUnlock);
  useEffect(() => { onUnlockRef.current = onUnlock; }, [onUnlock]);

  const requiredFor = (duration) => (duration > 0 && duration < REQUIRED_SECONDS ? Math.max(duration - 0.5, 0.5) : REQUIRED_SECONDS);

  const unlock = () => {
    if (state.current.unlocked) return;
    state.current.unlocked = true;
    setUnlocked(true);
    setShowUnlocked(true);
    onUnlockRef.current?.();
  };

  // One playback step: count it if it is normal playback; undo it if it jumped ahead
  const step = (t, seek) => {
    const st = state.current;
    if (st.last === null) { st.last = t; return; }
    const delta = t - st.last;
    if (delta > MAX_STEP && t > st.furthest + MAX_STEP && !st.unlocked) {
      seek(st.furthest); // skipping ahead does not count: back to the furthest point really watched
      st.last = st.furthest;
      return;
    }
    if (delta > 0 && delta <= MAX_STEP) {
      st.watched += delta;
      st.furthest = Math.max(st.furthest, t);
      setWatched(st.watched);
      if (st.watched >= requiredFor(st.duration)) unlock();
    }
    st.last = t;
  };

  // Hide the green note a few seconds after unlocking
  useEffect(() => {
    if (!showUnlocked) return undefined;
    const t = setTimeout(() => setShowUnlocked(false), 3500);
    return () => clearTimeout(t);
  }, [showUnlocked]);

  // YouTube: read the play position twice a second while it plays
  useEffect(() => {
    if (!youtubeId) return undefined;
    let player = null; let timer = null; let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytHost.current) return;
      const mount = document.createElement("div");
      ytHost.current.innerHTML = "";
      ytHost.current.appendChild(mount);
      player = new YT.Player(mount, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            const playing = e.data === YT.PlayerState.PLAYING;
            if (playing && !timer) {
              const d = player.getDuration?.() || 0;
              state.current.duration = d;
              setNeeded(requiredFor(d));
              state.current.last = player.getCurrentTime?.() ?? null;
              timer = setInterval(() => step(player.getCurrentTime(), (to) => player.seekTo(to, true)), 500);
            } else if (!playing && timer) {
              clearInterval(timer); timer = null;
              state.current.last = null;
              if (e.data === YT.PlayerState.ENDED && state.current.watched >= requiredFor(state.current.duration) - 1) unlock();
            }
          },
        },
      });
    });
    return () => { cancelled = true; if (timer) clearInterval(timer); try { player?.destroy(); } catch { /* already gone */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  const pct = Math.min(100, Math.round((watched / needed) * 100));
  const left = Math.max(0, Math.ceil(needed - watched));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "black" }}>
      {youtubeId ? (
        <div ref={ytHost} style={{ position: "absolute", inset: 0 }} />
      ) : (
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          playsInline
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onLoadedMetadata={(e) => { state.current.duration = e.target.duration || 0; setNeeded(requiredFor(state.current.duration)); }}
          onPlay={(e) => { state.current.last = e.target.currentTime; }}
          onTimeUpdate={(e) => { if (!e.target.paused) step(e.target.currentTime, (to) => { e.target.currentTime = to; }); }}
          onSeeking={(e) => {
            const st = state.current;
            if (!st.unlocked && e.target.currentTime > st.furthest + MAX_STEP) e.target.currentTime = st.furthest;
            st.last = e.target.currentTime;
          }}
          onRateChange={(e) => { if (!state.current.unlocked && e.target.playbackRate > 1) e.target.playbackRate = 1; }}
          onEnded={() => { if (state.current.watched >= requiredFor(state.current.duration) - 1) unlock(); }}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}

      {!unlocked && (
        <Badge color="rgba(0,0,0,0.78)" border="#FF6A00">
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FF6A00" }}>
            <Lock size={12} /> {needed < REQUIRED_SECONDS ? "Watch the whole video to unlock the challenge" : `Watch ${REQUIRED_SECONDS} seconds to unlock the challenge`}
          </div>
          <div style={{ marginTop: 8, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#FF6A00", transition: "width 0.4s" }} />
          </div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>
            {watched > 0 ? `${left} s left` : "Press play to start"}
          </div>
        </Badge>
      )}
      {unlocked && (
        <div style={{ opacity: showUnlocked ? 1 : 0, transition: "opacity 0.6s" }}>
          <Badge color="rgba(34,197,94,0.95)" border="#22c55e">
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={12} /> Record watched - challenge unlocked</span>
          </Badge>
        </div>
      )}
    </div>
  );
}
