// style.js — Style selection page logic
// Runs on style.html
/* global requireAuth, signOut, showToast, getSession */

// ── Which style the user has currently selected ───────────────────
let selectedStyle = null;

// ── Maps each style card value → backend params ───────────────────
//
// The existing backend endpoint POST /outfits/recommend requires three
// fields: style_type, occasion, mood. Since we are letting the user pick
// ONE simple category, we map it to sensible defaults here.
//
// In Phase 3 we will redesign the recommendation flow further, but the
// mapping lives here so it is easy to change in one place.
//
// style_type must match values in clothing_items.style_type[] column:
//   traditional | western | indo-western
//
// occasion must match values in clothing_items.occasion[] column:
//   casual | festive | formal | party | work
//
// mood is used by the LLM styling tip (currently mock):
//   bold | minimal | romantic | dreamy | classic
//
const STYLE_PARAMS = {
  'traditional':  { style_type: 'traditional',  occasion: 'festive',  mood: 'classic'  },
  'western':      { style_type: 'western',       occasion: 'casual',   mood: 'minimal'  },
  'indo-western': { style_type: 'indo-western',  occasion: 'casual',   mood: 'bold'     },
  'casual':       { style_type: 'western',       occasion: 'casual',   mood: 'minimal'  },
  'college':      { style_type: 'western',       occasion: 'casual',   mood: 'minimal'  },
  'formal':       { style_type: 'western',       occasion: 'formal',   mood: 'classic'  },
  'party':        { style_type: 'western',       occasion: 'party',    mood: 'bold'     },
};

// ── Page init: protect this page — must be signed in ──────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // requireAuth() is defined in auth.js.
    // If no session → it redirects to /index.html automatically.
    // If session exists → it returns the session object.
    const session = await requireAuth();

    // Show the user's avatar in the nav
    renderAvatar(session);

  } catch (err) {
    // requireAuth already redirected; this just silences the thrown error
    console.error('Auth error:', err);
  }
});

// ── Called when a style card is clicked ───────────────────────────
//
// el    — the card DOM element that was clicked
// value — the style key string e.g. 'traditional', 'casual'
//
function selectStyle(el, value) {
  // 1. Deselect all cards
  document.querySelectorAll('.style-card').forEach(card => {
    card.classList.remove('selected');
  });

  // 2. Select the clicked card
  el.classList.add('selected');
  selectedStyle = value;

  // 3. Enable the "Find My Outfit" button now that a selection exists
  const btn = document.getElementById('find-outfit-btn');
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';

  // Update the helper text to confirm the selection
  const hint = document.getElementById('style-hint');
  if (hint) hint.textContent = `Great choice! Tap "Find My Outfit" to continue.`;
}

// ── Called when "Find My Outfit →" is clicked ─────────────────────
function goToOutfit() {
  if (!selectedStyle) {
    showToast('Please pick a style first!', 'error');
    return;
  }

  // Look up the backend params for this style
  const params = STYLE_PARAMS[selectedStyle];
  if (!params) {
    showToast('Unknown style selected. Please try again.', 'error');
    return;
  }

  // Build the URL query string and navigate to outfit.html
  // outfit.html reads these params and calls POST /outfits/recommend
  const query = new URLSearchParams({
    style:   params.style_type,
    occasion: params.occasion,
    mood:    params.mood,
    // Pass the original label too so outfit.html can display it nicely
    label:   selectedStyle,
  });

  window.location.href = `outfit.html?${query.toString()}`;
}

// ── Called when "Surprise Me" is clicked ─────────────────────
function goToSurpriseOutfit() {
  window.location.href = 'outfit.html?surprise=true';
}
