const CATEGORY_EMOJI = {
  'top': '👕', 'bottom': '👖', 'dupatta': '🧣', 'footwear': '👠',
  'accessory': '💍', 'outerwear': '🧥', 'full-outfit': '👗'
};

let currentRequest = null;
let excludedCombos = [];
let lockedItemIds = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await requireAuth();
    renderAvatar(session);
    
    const params = new URLSearchParams(window.location.search);
    const surprise = params.get('surprise');
    const buildAround = params.get('build_around');
    
    if (surprise || buildAround) {
      currentRequest = { isSurprise: true, style_type: 'Surprise', occasion: 'any', mood: 'surprise' };
      if (buildAround) {
        lockedItemIds.push(buildAround);
      }
      fetchOutfits();
      return;
    }
    
    const style = params.get('style');
    const occasion = params.get('occasion');
    const mood = params.get('mood');
    
    if (!style || !occasion || !mood) {
      window.location.href = 'index.html';
      return;
    }
    
    currentRequest = { style_type: style, occasion, mood, excluded_combos: excludedCombos };
    fetchOutfits();
    
  } catch (err) {
    console.error(err);
  }
});

async function fetchOutfits() {
  document.getElementById('loading-state').classList.remove('hidden');
  document.getElementById('results-section').classList.add('hidden');
  document.getElementById('error-state').classList.add('hidden');
  
  try {
    let data;
    if (currentRequest.isSurprise) {
      data = await apiPost('/outfits/surprise', { excluded_combos: excludedCombos, locked_items: lockedItemIds });
    } else {
      currentRequest.excluded_combos = excludedCombos;
      currentRequest.locked_items = lockedItemIds;
      data = await apiPost('/outfits/recommend', currentRequest);
    }
    renderResults(data);
  } catch (err) {
    showError(err.message || "Something went wrong generating your outfit.");
  }
}

function renderResults(data) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('results-section').classList.remove('hidden');
  
  const title = `Your ${currentRequest.mood} ${currentRequest.occasion} look`;
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = currentRequest.style_type;
  
  const container = document.getElementById('outfits-container');
  
  if (!data.outfits || data.outfits.length === 0) {
    showError("You don't have enough items in your closet for this combination. Try adding more!");
    return;
  }
  
  container.innerHTML = data.outfits.map((outfit, index) => {
    const suggestionId = data.suggestion_ids ? data.suggestion_ids[index] : null;

    // Build each clothing item as a very large portrait image, stacked vertically
    const itemsHtml = outfit.items.map(item => {
      const isLocked = lockedItemIds.includes(item.id);
      return `
      <div style="width: 100%; max-width: 450px; margin: 0 auto 1.5rem; text-align: center;">
        ${item.image_url
          ? `<img
               src="${item.image_url}"
               alt="${item.name}"
               style="
                 width: 100%;
                 max-height: 600px;
                 object-fit: contain;
                 border-radius: var(--radius-lg);
                 box-shadow: var(--shadow-md);
                 display: block;
                 margin: 0 auto;
                 background-color: var(--bg-surface);
               "
             >`
          : `<div style="
               width: 100%;
               aspect-ratio: 3/4;
               background: linear-gradient(135deg, var(--card-pink), var(--secondary));
               border-radius: var(--radius-lg);
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 6rem;
               box-shadow: var(--shadow-md);
               margin: 0 auto;
             ">${CATEGORY_EMOJI[item.category] || '👗'}</div>`
        }
        <p style="
          margin-top: 1rem;
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text);
          text-align: center;
        ">${item.name}</p>
        <p style="
          font-size: 0.9rem;
          color: var(--text-muted);
          text-align: center;
          text-transform: capitalize;
        ">${item.category}</p>
        
        <div style="display: flex; gap: 0.75rem; margin-top: 1.25rem; justify-content: center; flex-wrap: wrap;">
          <button class="btn ${isLocked ? 'btn-primary' : 'btn-outline'}" onclick="toggleLockItem('${item.id}', this)" style="flex: 1; min-width: 130px; font-weight: 600; box-shadow: var(--shadow-sm); transition: var(--transition);">
            ${isLocked ? '❤️ Kept' : '🤍 Keep It'}
          </button>
          <button class="btn btn-outline" onclick="nahh('${item.id}', this)" style="flex: 1; min-width: 130px; font-weight: 600; box-shadow: var(--shadow-sm); transition: var(--transition);">
            🔄 Nahh
          </button>
        </div>
      </div>
    `}).join('');

    // Calculate combo hash so we can exclude it if they click NAHH
    const itemIds = outfit.items.map(i => i.id).sort();
    const comboHash = itemIds.join('-');

    return `
      <div class="outfit-card fade-in" style="
        animation-delay: ${index * 0.1}s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 600px;
        margin: 0 auto 3rem;
      " data-combo-hash="${comboHash}">

        <!-- Vertically stacked very large images -->
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-bottom: 2rem;">
          ${itemsHtml}
        </div>

        <!-- AI styling tip -->
        <div class="outfit-quote" style="width: 100%; max-width: 450px; text-align: center; font-size: 1.1rem;">
          "${outfit.ai_description}"
        </div>

        <!-- Action buttons -->
        <div style="display: flex; gap: 1.5rem; margin-top: 2rem; justify-content: center; width: 100%;">
          ${suggestionId ? `
            <button class="btn btn-primary btn-lg" style="width: 100%; max-width: 300px;" onclick="likeIt('${suggestionId}', this)">
              💾 Save Final Outfit
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function nahh(rejectedItemId, btnElement) {
  // Find the card and its hash
  const card = btnElement.closest('.outfit-card');
  const hash = card.getAttribute('data-combo-hash');
  if (hash) {
    excludedCombos.push(hash);
    
    // Implicitly lock all other items currently displayed so only the rejected category changes
    const allItemIds = hash.split('-');
    for (const id of allItemIds) {
      if (id !== rejectedItemId && !lockedItemIds.includes(id)) {
        lockedItemIds.push(id);
      }
    }
  }
  // Fetch the next outfit (will use lockedItemIds automatically)
  fetchOutfits();
}

function toggleLockItem(itemId, btn) {
  const idx = lockedItemIds.indexOf(itemId);
  if (idx > -1) {
    lockedItemIds.splice(idx, 1);
    btn.innerHTML = '🤍 Keep It';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
  } else {
    lockedItemIds.push(itemId);
    btn.innerHTML = '❤️ Kept';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
  }
}

async function likeIt(suggestionId, btn) {
  try {
    // Save it to history automatically as worn today (per user preference "no manual date entry")
    const today = new Date().toISOString().split('T')[0];
    await apiPost('/history/', {
      outfit_id: suggestionId,
      worn_on: today
    });
    
    // Also save it to bookmarks
    await apiPatch(`/outfits/${suggestionId}/save?saved=true`, {});
    
    // Redirect to history to see the saved outfit
    window.location.href = 'history.html';
  } catch (err) {
    showToast('Failed to save outfit', 'error');
  }
}

async function saveOutfit(suggestionId, btn) {
  try {
    const isSaved = btn.textContent.includes('Saved');
    await apiPatch(`/outfits/${suggestionId}/save?saved=${!isSaved}`, {});
    
    if (isSaved) {
      btn.innerHTML = '💾 Save Outfit';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
      showToast('Outfit removed from saved', 'info');
    } else {
      btn.innerHTML = '💾 Saved';
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
      showToast('Outfit saved successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to save outfit', 'error');
  }
}

async function markAsWorn(suggestionId, btn) {
  try {
    const today = new Date().toISOString().split('T')[0];
    await apiPost('/history/', {
      outfit_id: suggestionId,
      worn_on: today
    });
    showToast('Marked as worn today!', 'success');
  } catch (err) {
    showToast('Failed to mark as worn', 'error');
  }
}

function tryAgain() {
  fetchOutfits();
}

function showError(msg) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('results-section').classList.add('hidden');
  const errorState = document.getElementById('error-state');
  errorState.classList.remove('hidden');
  document.getElementById('error-desc').textContent = msg;
}
