// api.js — Shared fetch wrapper
/* global BACKEND_URL, getSession */

async function apiRequest(path, options = {}) {
  const session = await getSession();
  const headers = { ...options.headers };
  
  if (session) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  const response = await fetch(`${BACKEND_URL}${path}`, config);
  
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errBody = await response.json();
      if (errBody.detail) errorDetail = errBody.detail;
    } catch (e) {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }
  
  if (response.status === 204) return null;
  
  return await response.json();
}

async function apiGet(path) {
  return apiRequest(path, { method: 'GET' });
}

async function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function apiPatch(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function apiDelete(path) {
  return apiRequest(path, { method: 'DELETE' });
}

async function apiUpload(path, formData) {
  // Omit Content-Type to let the browser set it automatically with boundaries
  return apiRequest(path, {
    method: 'POST',
    body: formData
  });
}
