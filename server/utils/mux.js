// Mux live streaming: one live stream per event, signed playback so paid streams can only be
// watched with a token this server hands to ticket holders, and the Mux webhook signature check.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const RTMP_URL = 'rtmps://global-live.mux.com:443/app';

const muxEnabled = () => !!(String(process.env.MUX_TOKEN_ID || '').trim() && String(process.env.MUX_TOKEN_SECRET || '').trim());
const signingEnabled = () => !!(String(process.env.MUX_SIGNING_KEY_ID || '').trim() && String(process.env.MUX_SIGNING_KEY_PRIVATE || '').trim());

const muxApi = async (method, path, body) => {
  if (!muxEnabled()) {
    const err = new Error('Live streaming (Mux) is not set up yet.');
    err.status = 503;
    throw err;
  }
  const auth = Buffer.from(`${process.env.MUX_TOKEN_ID.trim()}:${process.env.MUX_TOKEN_SECRET.trim()}`).toString('base64');
  const res = await fetch(`https://api.mux.com${path}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Mux: ${(json.error && (json.error.messages || []).join(' ')) || json.error?.type || res.statusText}`);
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }
  return json.data;
};

/** A new live stream; its recording is kept as a replay. Playback is always signed. */
const createLiveStream = (eventId) => muxApi('POST', '/video/v1/live-streams', {
  playback_policies: ['signed'],
  new_asset_settings: { playback_policies: ['signed'] },
  passthrough: String(eventId),
  reconnect_window: 60,
  latency_mode: 'low',
});
const getLiveStream = (id) => muxApi('GET', `/video/v1/live-streams/${encodeURIComponent(id)}`);
const deleteLiveStream = (id) => muxApi('DELETE', `/video/v1/live-streams/${encodeURIComponent(id)}`);
const resetStreamKey = (id) => muxApi('POST', `/video/v1/live-streams/${encodeURIComponent(id)}/reset-stream-key`);
const completeLiveStream = (id) => muxApi('PUT', `/video/v1/live-streams/${encodeURIComponent(id)}/complete`);

// The signing key's private part as PEM (Mux gives it base64-encoded; a pasted PEM also works).
const privateKeyPem = () => {
  const raw = String(process.env.MUX_SIGNING_KEY_PRIVATE || '').trim().replace(/^"|"$/g, '');
  if (raw.includes('-----BEGIN')) return raw.replace(/\\n/g, '\n');
  return Buffer.from(raw, 'base64').toString('utf8');
};

/** Tokens for one playback id: video ('v') and thumbnail ('t'), valid for `hours`. */
const playbackTokens = (playbackId, hours = 6) => {
  if (!signingEnabled()) {
    const err = new Error('Live stream playback keys are not set up yet.');
    err.status = 503;
    throw err;
  }
  const key = privateKeyPem();
  const exp = Math.floor(Date.now() / 1000) + hours * 3600;
  const opts = { algorithm: 'RS256', keyid: process.env.MUX_SIGNING_KEY_ID.trim(), noTimestamp: true };
  return {
    video: jwt.sign({ sub: playbackId, aud: 'v', exp }, key, opts),
    thumbnail: jwt.sign({ sub: playbackId, aud: 't', exp }, key, opts),
    expiresAt: new Date(exp * 1000).toISOString(),
  };
};

/** Mux-Signature: "t=<unix>,v1=<hex hmac of `${t}.${body}`>" */
const verifyWebhook = (rawBody, header, secret = process.env.MUX_WEBHOOK_SECRET, toleranceSec = 300) => {
  if (!secret || !rawBody || !header) return false;
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=').map((s) => s.trim())));
  const t = Number(parts.t);
  if (!t || !parts.v1 || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = crypto.createHmac('sha256', String(secret).trim()).update(`${t}.${rawBody.toString('utf8')}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(String(parts.v1), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  RTMP_URL, muxEnabled, signingEnabled, createLiveStream, getLiveStream, deleteLiveStream,
  resetStreamKey, completeLiveStream, playbackTokens, verifyWebhook,
};
