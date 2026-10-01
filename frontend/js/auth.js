// auth.js — Supabase auth helpers (globals available to all pages)
/* global supabase, SUPABASE_URL, SUPABASE_ANON_KEY */

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getSession() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) {
    console.error("Error getting session:", error);
    return null;
  }
  return session;
}

async function signInWithGoogle() {
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/style.html' },
  });
  if (error) showToast('Sign-in failed. Please try again.', 'error');
}

async function signOut() {
  await supabaseClient.auth.signOut();
  window.location.href = '/index.html';
}

async function requireAuth() {
  const session = await getSession();
  if (!session) { 
    window.location.href = '/index.html'; 
    throw new Error('Unauthenticated'); 
  }
  return session;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function renderAvatar(session) {
  const container = document.getElementById('nav-avatar-container');
  if (!container) return;
  const initial = session.user.email.charAt(0).toUpperCase();
  container.innerHTML = `
    <div style="position: relative; display: inline-block;">
      <div class="avatar-placeholder" onclick="document.getElementById('profile-dropdown').classList.toggle('hidden')" style="cursor:pointer;" title="Profile">
        ${initial}
      </div>
      <div id="profile-dropdown" class="hidden" style="
        position: absolute; 
        right: 0; 
        top: 120%; 
        background: var(--bg-surface); 
        border: 1px solid var(--border); 
        border-radius: var(--radius-md); 
        box-shadow: var(--shadow-md); 
        padding: 0.5rem; 
        min-width: 150px; 
        z-index: 1000;
      ">
        <p style="padding: 0.5rem; margin: 0; font-size: 0.85rem; color: var(--text-muted); border-bottom: 1px solid var(--border); word-break: break-all;">
          ${session.user.email}
        </p>
        <button onclick="signOut()" style="
          width: 100%; 
          text-align: left; 
          padding: 0.5rem; 
          background: none; 
          border: none; 
          color: var(--text); 
          cursor: pointer;
          font-family: inherit;
        ">
          Sign out
        </button>
      </div>
    </div>
  `;

  // Close dropdown if clicked outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      const dropdown = document.getElementById('profile-dropdown');
      if (dropdown) dropdown.classList.add('hidden');
    }
  });
}
