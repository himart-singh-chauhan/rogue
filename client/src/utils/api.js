// API base URL. Set VITE_API_URL (e.g. in client/.env or the hosting dashboard) to point the
// site at a different backend without code changes. Must end with /api.
const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = (import.meta.env.VITE_API_URL || (isLocalHost
  ? 'http://localhost:5000/api'
  : 'https://rogue-api.vercel.app/api')).replace(/\/$/, '');

export const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Check if the response is JSON before trying to parse it
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If it's not JSON (like a 404 HTML page), handle it gracefully
      if (!response.ok) {
        throw new Error(`API returned an error (${response.status}): Endpoint not found or invalid response`);
      }
      data = {}; // Fallback for non-JSON success responses
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

export const apiUpload = async (endpoint, formData, token = null) => {
  const headers = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method: 'POST',
    headers,
    body: formData,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      if (!response.ok) {
        throw new Error(`API upload error (${response.status})`);
      }
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }

    return data;
  } catch (error) {
    console.error('API upload error:', error);
    throw error;
  }
};

/**
 * Upload a file straight from the browser to Supabase Storage.
 * 1. asks the API for a signed upload URL (validates type/size and the user's permissions)
 * 2. PUTs the file directly to storage (the file never passes through our server)
 * Returns the public URL of the stored file.
 *
 * kind: 'record-video' | 'record-image' | 'evidence' | 'avatar' | 'admin-video' | 'admin-image'
 * onProgress: optional (percent: number) => void
 */
export const uploadDirect = async (file, kind, token, onProgress) => {
  if (!file) throw new Error('No file selected');
  const sign = await apiCall('/uploads/sign', 'POST', {
    kind,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  }, token);

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', sign.signedUrl);
    if (sign.apiKey) xhr.setRequestHeader('apikey', sign.apiKey);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body && (body.message || body.error)) message = body.message || body.error;
      } catch { /* non-JSON error body */ }
      if (xhr.status === 413 || /maximum allowed size|too large/i.test(message)) {
        message = `File is too large. Maximum size is ${Math.round((sign.maxBytes || 0) / 1048576)} MB.`;
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading. Please check your connection and try again.'));
    const body = new FormData();
    body.append('cacheControl', '3600');
    body.append('', file);
    xhr.send(body);
  });

  if (onProgress) onProgress(100);
  return sign.publicUrl;
};

// Dynamic Product Image Formatter
export const formatProductImage = (url) => {
  if (!url) return "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=600&q=80";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    const backendBase = API_URL.replace("/api", "");
    if (url.includes("localhost:5000")) {
      return url.replace("http://localhost:5000", backendBase);
    }
    if (url.includes("localhost:5001")) {
      return url.replace("http://localhost:5001", backendBase);
    }
    if (url.includes("localhost:5002")) {
      return url.replace("http://localhost:5002", backendBase);
    }
    return url;
  }
  // Files bundled with the website itself (client/public) are served by the site, not the API
  if (url.startsWith("/images/") || url.startsWith("/assets/")) return url;
  const backendBase = API_URL.replace("/api", "");
  return `${backendBase}${url.startsWith("/") ? "" : "/"}${url}`;
};
