let allItems = [];
let currentFilter = 'all';
let selectedImageFile = null;
let pillSelections = { style_type: [], season: ['all'], occasion: [] };
let editItemId = null;

// Keys match the lowercase values stored in the DB
const CATEGORY_EMOJI = {
  'top': '👕', 'bottom': '👖', 'dupatta': '🧣', 'footwear': '👠',
  'accessory': '💍', 'outerwear': '🧥', 'full-outfit': '👗'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const session = await requireAuth();
    renderAvatar(session);
    
    await loadItems();
  } catch (err) {
    console.error(err);
  }
});

async function loadItems() {
  try {
    allItems = await apiGet('/wardrobe/items');
    document.getElementById('loading-grid').classList.add('hidden');
    renderGrid();
  } catch (err) {
    showToast('Failed to load wardrobe', 'error');
  }
}

function renderGrid() {
  const grid = document.getElementById('clothing-grid');
  const emptyState = document.getElementById('empty-state');
  const countLabel = document.getElementById('item-count');
  
  const filtered = currentFilter === 'all' 
    ? allItems 
    : allItems.filter(item => item.category === currentFilter);
    
  countLabel.textContent = `(${filtered.length} items)`;
  
  if (filtered.length === 0) {
    grid.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('.empty-state-title').textContent = currentFilter === 'all' ? 'Your closet is empty' : `No ${currentFilter}s found`;
    return;
  }
  
  grid.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  grid.innerHTML = filtered.map(item => `
    <div class="clothing-card fade-in">
      ${item.image_url 
        ? `<img src="${item.image_url}" class="clothing-card-image" alt="${item.name}">` 
        : `<div class="clothing-card-placeholder">${CATEGORY_EMOJI[item.category] || '👗'}</div>`
      }
      <div class="clothing-card-body">
        <h4 class="clothing-card-name">${item.name}</h4>
        <div class="clothing-card-meta">
          <span class="badge">${item.category}</span>
          ${item.primary_color ? `<div class="color-dot" style="background-color: ${item.primary_color};" title="${item.primary_color}"></div>` : ''}
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="buildAround('${item.id}', event)" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; flex: 1;">
            🪄 Build Outfit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="editItem('${item.id}', event)" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            Edit
          </button>
          <button class="btn btn-secondary btn-sm" onclick="deleteItem('${item.id}', event)" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: #dc2626;">
            Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function setFilter(el, category) {
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  currentFilter = category;
  renderGrid();
}

async function deleteItem(id, event) {
  event.stopPropagation();
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  try {
    await apiDelete(`/wardrobe/items/${id}`);
    allItems = allItems.filter(item => item.id !== id);
    renderGrid();
    showToast('Item deleted successfully', 'success');
  } catch (err) {
    showToast('Failed to delete item', 'error');
  }
}

function buildAround(id, event) {
  event.stopPropagation();
  window.location.href = `outfit.html?build_around=${id}`;
}

function openModal() {
  document.getElementById('upload-modal').classList.add('active');
}

function closeModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('upload-modal').classList.remove('active');
  resetForm();
}

function triggerFileInput() {
  document.getElementById('file-input').click();
}

function previewImage(input) {
  if (input.files && input.files[0]) {
    selectedImageFile = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('upload-preview').src = e.target.result;
      document.getElementById('upload-preview').classList.remove('hidden');
      document.getElementById('upload-text').classList.add('hidden');
    }
    reader.readAsDataURL(input.files[0]);
  }
}

function handleDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('drag-over'); }
function handleDragLeave(e) { e.preventDefault(); document.getElementById('upload-zone').classList.remove('drag-over'); }
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    document.getElementById('file-input').files = e.dataTransfer.files;
    previewImage(document.getElementById('file-input'));
  }
}

function togglePill(el, group) {
  const label = el.textContent.trim();
  // Map display labels to backend-expected lowercase values
  const VALUE_MAP = {
    'All Season': 'all', 'Summer': 'summer', 'Winter': 'winter', 'Monsoon': 'monsoon',
    'Traditional': 'traditional', 'Western': 'western', 'Indo-Western': 'indo-western',
    'Casual': 'casual', 'Festive': 'festive', 'Formal': 'formal', 'Party': 'party', 'Work': 'work',
  };
  const value = VALUE_MAP[label] || label.toLowerCase();

  if (group === 'season' && value === 'all') {
    pillSelections.season = ['all'];
    document.querySelectorAll('#season-pills .pill').forEach(p => {
      p.classList.toggle('selected', p.textContent.trim() === 'All Season');
    });
    return;
  }

  if (group === 'season' && value !== 'all') {
    pillSelections.season = pillSelections.season.filter(v => v !== 'all');
    document.querySelector('#season-pills .pill').classList.remove('selected');
  }

  if (pillSelections[group].includes(value)) {
    pillSelections[group] = pillSelections[group].filter(v => v !== value);
    el.classList.remove('selected');
  } else {
    pillSelections[group].push(value);
    el.classList.add('selected');
  }
}

function updateColorSwatch(input) {
  const swatch = document.getElementById('color-swatch');
  swatch.style.backgroundColor = input.value || '#eee';
}

function resetForm() {
  document.getElementById('upload-form').reset();
  selectedImageFile = null;
  editItemId = null;
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('upload-text').classList.remove('hidden');
  updateColorSwatch({value: ''});

  pillSelections = { style_type: [], season: ['all'], occasion: [] };

  document.querySelectorAll('.pill-group .pill').forEach(p => p.classList.remove('selected'));
  document.querySelector('#season-pills .pill').classList.add('selected'); // 'All Season' pill
  document.getElementById('submit-btn').textContent = 'Add to Closet';
  document.querySelector('.modal-title').textContent = 'Add New Item';
}

function editItem(id, event) {
  event.stopPropagation();
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  
  editItemId = id;
  document.getElementById('item-name').value = item.name;
  document.getElementById('item-category').value = item.category;
  if (item.primary_color) {
    document.getElementById('item-color').value = item.primary_color;
    updateColorSwatch(document.getElementById('item-color'));
  }
  document.getElementById('item-tags').value = (item.tags || []).join(', ');
  
  if (item.image_url) {
    document.getElementById('upload-preview').src = item.image_url;
    document.getElementById('upload-preview').classList.remove('hidden');
    document.getElementById('upload-text').classList.add('hidden');
  }
  
  // Reset pills
  document.querySelectorAll('.pill-group .pill').forEach(p => p.classList.remove('selected'));
  pillSelections = { style_type: item.style_type || [], season: item.season || ['all'], occasion: item.occasion || [] };
  
  // Helper to re-select pills based on backend values
  const REVERSE_MAP = {
    'all': 'All Season', 'summer': 'Summer', 'winter': 'Winter', 'monsoon': 'Monsoon',
    'traditional': 'Traditional', 'western': 'Western', 'indo-western': 'Indo-Western',
    'casual': 'Casual', 'festive': 'Festive', 'formal': 'Formal', 'party': 'Party', 'work': 'Work'
  };
  
  for (const group of ['style_type', 'season', 'occasion']) {
    const values = pillSelections[group];
    values.forEach(val => {
      const displayLabel = REVERSE_MAP[val] || val;
      // Find the pill with this label and add 'selected'
      document.querySelectorAll(`#${group}-pills .pill`).forEach(p => {
        if (p.textContent.trim().toLowerCase() === displayLabel.toLowerCase()) {
          p.classList.add('selected');
        }
      });
    });
  }
  
  document.getElementById('submit-btn').textContent = 'Save Changes';
  document.querySelector('.modal-title').textContent = 'Edit Item';
  openModal();
}

async function submitItem(e) {
  e.preventDefault();
  
  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = editItemId ? 'Saving...' : 'Adding...';
  
  try {
    const name = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const color = document.getElementById('item-color').value;
    const tagsStr = document.getElementById('item-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const itemData = {
      name, category,
      style_type: pillSelections.style_type,
      season: pillSelections.season,
      occasion: pillSelections.occasion,
      primary_color: color,
      tags
    };
    
    let updatedItem;
    if (editItemId) {
      updatedItem = await apiPatch(`/wardrobe/items/${editItemId}`, itemData);
      
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        updatedItem = await apiUpload(`/wardrobe/items/${editItemId}/upload-image`, formData);
      }
      
      const idx = allItems.findIndex(i => i.id === editItemId);
      if (idx !== -1) allItems[idx] = updatedItem;
      
    } else {
      updatedItem = await apiPost('/wardrobe/items', itemData);
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        updatedItem = await apiUpload(`/wardrobe/items/${updatedItem.id}/upload-image`, formData);
      }
      allItems.unshift(updatedItem);
    }
    
    renderGrid();
    closeModal();
    showToast(editItemId ? 'Item updated successfully!' : 'Item added successfully!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to save item', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editItemId ? 'Save Changes' : 'Add to Closet';
  }
}
