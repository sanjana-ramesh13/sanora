document.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await requireAuth();
    renderAvatar(session);
    
    await loadHistory();
  } catch (err) {
    console.error(err);
  }
});

async function loadHistory() {
  try {
    const entries = await apiGet('/history/');
    document.getElementById('loading-state').classList.add('hidden');
    renderHistory(entries);
  } catch (err) {
    document.getElementById('loading-state').classList.add('hidden');
    showToast('Failed to load history', 'error');
  }
}

function renderHistory(entries) {
  const list = document.getElementById('history-list');
  const emptyState = document.getElementById('empty-state');
  
  document.getElementById('history-count').textContent = `(${entries.length} entries)`;
  
  if (entries.length === 0) {
    list.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  list.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  // Group by YYYY-MM
  const grouped = {};
  entries.forEach(entry => {
    const date = new Date(entry.worn_on);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  let html = '';
  
  Object.keys(grouped).sort().reverse().forEach(key => {
    const [year, month] = key.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    
    html += `
      <div style="margin-bottom: 2rem;">
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--primary-dark); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 1rem;">
          ${monthName} ${year}
        </h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
    `;
    
    grouped[key].sort((a,b) => new Date(b.worn_on) - new Date(a.worn_on)).forEach(entry => {
      const date = new Date(entry.worn_on);
      const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()].slice(0, 3)}, ${date.getFullYear()}`;
      
      let outfitImages = '';
      if (entry.clothing_items && entry.clothing_items.length > 0) {
        outfitImages = `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem;">`;
        entry.clothing_items.forEach(item => {
          if (item.image_url) {
            outfitImages += `<img src="${item.image_url}" alt="${item.name}" title="${item.name}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); object-fit: cover; box-shadow: var(--shadow-sm);">`;
          } else {
            outfitImages += `<div title="${item.name}" style="width: 50px; height: 50px; border-radius: var(--radius-sm); background: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: var(--shadow-sm); border: 1px solid var(--border);">👗</div>`;
          }
        });
        outfitImages += `</div>`;
      }
      
      html += `
        <div class="card fade-in" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 1.25rem;">
          <div>
            <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text);">${formattedDate}</div>
            <div style="color: var(--text-muted); font-size: 0.9rem;">
              ${entry.notes ? `<p style="margin-bottom: 0.5rem;"><em>"${entry.notes}"</em></p>` : ''}
              ${outfitImages}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="deleteEntry('${entry.id}')" title="Delete">
            🗑️
          </button>
        </div>
      `;
    });
    
    html += `</div></div>`;
  });
  
  list.innerHTML = html;
}

let itemToDelete = null;

function deleteEntry(id) {
  itemToDelete = id;
  document.getElementById('delete-modal').classList.add('active');
  const confirmBtn = document.getElementById('confirm-delete-btn');
  confirmBtn.onclick = confirmDelete;
}

function closeDeleteModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('delete-modal').classList.remove('active');
  itemToDelete = null;
}

async function confirmDelete() {
  if (!itemToDelete) return;
  const btn = document.getElementById('confirm-delete-btn');
  const originalText = btn.textContent;
  btn.textContent = 'Deleting...';
  btn.disabled = true;
  
  try {
    await apiDelete(`/history/${itemToDelete}`);
    showToast('Entry deleted', 'success');
    closeDeleteModal();
    loadHistory();
  } catch (err) {
    showToast('Failed to delete entry', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
