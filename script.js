// ============================================
// App State Management
// ============================================
const AppState = {
    currentMood: null,
    currentTags: [],
    entries: [],
    settings: {
        theme: 'light',
        reminders: false,
        reminderTime: '20:00'
    }
};

// ============================================
// Mood Data Configuration
// ============================================
const MOOD_DATA = {
    ecstatic: { emoji: '🤩', label: 'Extatique', color: '#FFD93D', value: 5 },
    happy: { emoji: '😊', label: 'Heureux', color: '#6BCB77', value: 4 },
    calm: { emoji: '😌', label: 'Calme', color: '#A8D8EA', value: 3 },
    neutral: { emoji: '😐', label: 'Neutre', color: '#C7C7C7', value: 2 },
    anxious: { emoji: '😰', label: 'Anxieux', color: '#FFA07A', value: 1 },
    sad: { emoji: '😢', label: 'Triste', color: '#9FA8DA', value: 0 },
    angry: { emoji: '😠', label: 'Énervé', color: '#FF6B6B', value: 0 },
    tired: { emoji: '😴', label: 'Fatigué', color: '#B4A7D6', value: 1 }
};

const TAG_EMOJIS = {
    gratitude: '🙏',
    stress: '😓',
    amour: '❤️',
    travail: '💼',
    famille: '👨‍👩‍👧‍👦',
    sante: '🏥',
    amis: '👥',
    hobby: '🎨',
    nature: '🌿',
    repos: '🛌'
};

// ============================================
// Local Storage Management
// ============================================
const Storage = {
    save: () => {
        localStorage.setItem('moodboard_entries', JSON.stringify(AppState.entries));
        localStorage.setItem('moodboard_settings', JSON.stringify(AppState.settings));
    },
    
    load: () => {
        const entries = localStorage.getItem('moodboard_entries');
        const settings = localStorage.getItem('moodboard_settings');
        
        if (entries) AppState.entries = JSON.parse(entries);
        if (settings) AppState.settings = JSON.parse(settings);
    },
    
    clear: () => {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes vos données ? Cette action est irréversible.')) {
            localStorage.clear();
            AppState.entries = [];
            AppState.currentMood = null;
            AppState.currentTags = [];
            showToast('Toutes les données ont été effacées');
            setTimeout(() => location.reload(), 1000);
        }
    },
    
    export: () => {
        const data = {
            entries: AppState.entries,
            settings: AppState.settings,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moodboard-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Données exportées avec succès');
    }
};

// ============================================
// Toast Notifications
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    const messageEl = toast.querySelector('.toast-message');
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Date Utilities
// ============================================
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('fr-FR', options);
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function updateTodayDate() {
    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = formatDate(new Date());
    }
}

// ============================================
// Navigation
// ============================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Update active view
            views.forEach(view => view.classList.remove('active'));
            document.getElementById(`${viewName}View`).classList.add('active');
            
            // Load view-specific data
            if (viewName === 'journal') loadJournalEntries();
            if (viewName === 'insights') loadInsights();
        });
    });
}

// ============================================
// Theme Toggle
// ============================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Load saved theme
    if (AppState.settings.theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    }
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        AppState.settings.theme = newTheme;
        Storage.save();
    });
}

// ============================================
// Mood Selection
// ============================================
function initMoodSelection() {
    const moodButtons = document.querySelectorAll('.mood-btn');
    const journalEntryCard = document.getElementById('journalEntryCard');
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mood = btn.dataset.mood;
            const color = btn.dataset.color;
            
            // Update selection
            moodButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            btn.style.color = color;
            
            // Save mood
            AppState.currentMood = mood;
            
            // Show journal entry card
            journalEntryCard.style.display = 'block';
            journalEntryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    });
}

// ============================================
// Tag Selection
// ============================================
function initTagSelection() {
    const tagChips = document.querySelectorAll('.tag-chip');
    
    tagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.tag;
            chip.classList.toggle('active');
            
            if (chip.classList.contains('active')) {
                AppState.currentTags.push(tag);
            } else {
                AppState.currentTags = AppState.currentTags.filter(t => t !== tag);
            }
        });
    });
}

// ============================================
// Save Entry
// ============================================
function initEntrySave() {
    const saveBtn = document.getElementById('saveEntry');
    const cancelBtn = document.getElementById('cancelEntry');
    const journalText = document.getElementById('journalText');
    const journalEntryCard = document.getElementById('journalEntryCard');
    
    saveBtn.addEventListener('click', () => {
        if (!AppState.currentMood) {
            showToast('Veuillez sélectionner une humeur');
            return;
        }
        
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mood: AppState.currentMood,
            text: journalText.value.trim(),
            tags: [...AppState.currentTags]
        };
        
        // Check if entry already exists for today
        const today = getTodayString();
        const existingIndex = AppState.entries.findIndex(e => 
            e.date.split('T')[0] === today
        );
        
        if (existingIndex !== -1) {
            AppState.entries[existingIndex] = entry;
            showToast('Entrée mise à jour');
        } else {
            AppState.entries.unshift(entry);
            showToast('Entrée sauvegardée avec succès');
        }
        
        Storage.save();
        resetEntryForm();
        updateStats();
    });
    
    cancelBtn.addEventListener('click', () => {
        resetEntryForm();
    });
}

function resetEntryForm() {
    AppState.currentMood = null;
    AppState.currentTags = [];
    document.getElementById('journalText').value = '';
    document.getElementById('journalEntryCard').style.display = 'none';
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.color = '';
    });
    document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.classList.remove('active');
    });
}

// ============================================
// Stats Update
// ============================================
function updateStats() {
    // Total entries
    document.getElementById('totalEntries').textContent = AppState.entries.length;
    
    // Calculate streak
    let streak = 0;
    const sortedDates = AppState.entries
        .map(e => e.date.split('T')[0])
        .sort()
        .reverse();
    
    const today = getTodayString();
    const uniqueDates = [...new Set(sortedDates)];
    
    if (uniqueDates.length > 0) {
        const lastDate = new Date(uniqueDates[0]);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
            streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const current = new Date(uniqueDates[i]);
                const previous = new Date(uniqueDates[i - 1]);
                const diff = Math.floor((previous - current) / (1000 * 60 * 60 * 24));
                
                if (diff === 1) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }
    
    document.getElementById('streakCount').textContent = streak;
}

// ============================================
// Journal Entries Display
// ============================================
function loadJournalEntries(filterMood = '', filterTag = '') {
    const container = document.getElementById('journalEntries');
    
    let filtered = AppState.entries;
    
    if (filterMood) {
        filtered = filtered.filter(e => e.mood === filterMood);
    }
    
    if (filterTag) {
        filtered = filtered.filter(e => e.tags.includes(filterTag));
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <p>Aucune entrée trouvée</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map((entry, index) => {
        const moodData = MOOD_DATA[entry.mood];
        return `
            <div class="journal-entry" style="animation-delay: ${index * 0.1}s">
                <div class="entry-header">
                    <div class="entry-mood">
                        <span>${moodData.emoji}</span>
                        <span class="entry-mood-label">${moodData.label}</span>
                    </div>
                    <span class="entry-date">${formatDate(entry.date)}</span>
                </div>
                ${entry.text ? `<div class="entry-content">${entry.text}</div>` : ''}
                ${entry.tags.length > 0 ? `
                    <div class="entry-tags">
                        ${entry.tags.map(tag => `
                            <span class="entry-tag">${TAG_EMOJIS[tag]} ${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="entry-actions-btns">
                    <button class="btn btn-small btn-danger" onclick="deleteEntry(${entry.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteEntry(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        AppState.entries = AppState.entries.filter(e => e.id !== id);
        Storage.save();
        loadJournalEntries();
        updateStats();
        showToast('Entrée supprimée');
    }
}

// Make deleteEntry available globally
window.deleteEntry = deleteEntry;

// ============================================
// Journal Filters
// ============================================
function initJournalFilters() {
    const filterMood = document.getElementById('filterMood');
    const filterTag = document.getElementById('filterTag');
    
    filterMood.addEventListener('change', () => {
        loadJournalEntries(filterMood.value, filterTag.value);
    });
    
    filterTag.addEventListener('change', () => {
        loadJournalEntries(filterMood.value, filterTag.value);
    });
}

// ============================================
// Insights & Charts
// ============================================
function loadInsights() {
    if (AppState.entries.length === 0) {
        return;
    }
    
    loadMoodChart();
    loadMoodDistribution();
    loadTagsStats();
    loadTrends();
}

function loadMoodChart() {
    const canvas = document.getElementById('moodChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const last30Days = [];
    const moodValues = [];
    
    // Get last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(dateStr);
        
        const entry = AppState.entries.find(e => e.date.split('T')[0] === dateStr);
        moodValues.push(entry ? MOOD_DATA[entry.mood].value : null);
    }
    
    // Simple line chart
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = 300 * 2;
    const padding = 40;
    
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF8FA3';
    ctx.fillStyle = 'rgba(255, 143, 163, 0.1)';
    
    ctx.beginPath();
    let hasData = false;
    
    moodValues.forEach((value, i) => {
        if (value !== null) {
            const x = padding + (i / 29) * (width - padding * 2);
            const y = height - padding - (value / 5) * (height - padding * 2);
            
            if (!hasData) {
                ctx.moveTo(x, y);
                hasData = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
    });
    
    ctx.stroke();
}

function loadMoodDistribution() {
    const canvas = document.getElementById('moodDistribution');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const moodCounts = {};
    
    AppState.entries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = 300 * 2;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    ctx.clearRect(0, 0, width, height);
    
    const total = AppState.entries.length;
    let currentAngle = -Math.PI / 2;
    
    Object.entries(moodCounts).forEach(([mood, count]) => {
        const sliceAngle = (count / total) * Math.PI * 2;
        
        ctx.beginPath();
        ctx.fillStyle = MOOD_DATA[mood].color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
}

function loadTagsStats() {
    const container = document.getElementById('tagsStats');
    const tagCounts = {};
    
    AppState.entries.forEach(entry => {
        entry.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    
    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state-small"><p>Pas encore de données</p></div>';
        return;
    }
    
    container.innerHTML = sorted.slice(0, 5).map(([tag, count]) => `
        <div class="tag-stat-item">
            <span class="tag-stat-label">${TAG_EMOJIS[tag]} ${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>
            <span class="tag-stat-count">${count} fois</span>
        </div>
    `).join('');
}

function loadTrends() {
    const container = document.getElementById('trendsList');
    const trends = [];
    
    if (AppState.entries.length < 7) {
        container.innerHTML = '<div class="empty-state-small"><p>Ajoutez plus d\'entrées pour voir les tendances</p></div>';
        return;
    }
    
    // Calculate average mood for last 7 days vs previous 7 days
    const last7 = AppState.entries.slice(0, 7);
    const previous7 = AppState.entries.slice(7, 14);
    
    if (previous7.length > 0) {
        const avgLast = last7.reduce((sum, e) => sum + MOOD_DATA[e.mood].value, 0) / last7.length;
        const avgPrev = previous7.reduce((sum, e) => sum + MOOD_DATA[e.mood].value, 0) / previous7.length;
        
        if (avgLast > avgPrev) {
            trends.push({
                title: '📈 Tendance positive',
                description: 'Votre humeur s\'améliore ces derniers jours'
            });
        } else if (avgLast < avgPrev) {
            trends.push({
                title: '📉 Attention',
                description: 'Votre humeur semble en baisse récemment'
            });
        }
    }
    
    // Most common mood
    const moodCounts = {};
    AppState.entries.forEach(e => {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });
    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    
    if (mostCommon) {
        trends.push({
            title: `${MOOD_DATA[mostCommon[0]].emoji} Humeur dominante`,
            description: `Vous vous sentez souvent ${MOOD_DATA[mostCommon[0]].label.toLowerCase()}`
        });
    }
    
    container.innerHTML = trends.map(trend => `
        <div class="trend-item">
            <div class="trend-title">${trend.title}</div>
            <div class="trend-description">${trend.description}</div>
        </div>
    `).join('');
}

// ============================================
// PDF Export
// ============================================
function initPdfExport() {
    const exportBtn = document.getElementById('exportPdfBtn');
    
    exportBtn.addEventListener('click', () => {
        showToast('Fonctionnalité d\'export PDF à venir');
        // In a real app, you'd use a library like jsPDF
    });
}

// ============================================
// Settings
// ============================================
function initSettings() {
    const reminderToggle = document.getElementById('reminderToggle');
    const reminderTime = document.getElementById('reminderTime');
    const reminderTimeContainer = document.getElementById('reminderTimeContainer');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    // Load settings
    reminderToggle.checked = AppState.settings.reminders;
    reminderTime.value = AppState.settings.reminderTime;
    reminderTimeContainer.style.display = AppState.settings.reminders ? 'flex' : 'none';
    
    reminderToggle.addEventListener('change', () => {
        AppState.settings.reminders = reminderToggle.checked;
        reminderTimeContainer.style.display = reminderToggle.checked ? 'flex' : 'none';
        Storage.save();
        
        if (reminderToggle.checked) {
            showToast('Rappels activés');
        } else {
            showToast('Rappels désactivés');
        }
    });
    
    reminderTime.addEventListener('change', () => {
        AppState.settings.reminderTime = reminderTime.value;
        Storage.save();
        showToast('Heure du rappel mise à jour');
    });
    
    exportDataBtn.addEventListener('click', () => {
        Storage.export();
    });
    
    clearDataBtn.addEventListener('click', () => {
        Storage.clear();
    });
}

// ============================================
// Initialization
// ============================================
function init() {
    // Load data
    Storage.load();
    
    // Initialize components
    updateTodayDate();
    initNavigation();
    initTheme();
    initMoodSelection();
    initTagSelection();
    initEntrySave();
    initJournalFilters();
    initPdfExport();
    initSettings();
    
    // Update stats
    updateStats();
    
    // Check if there's already an entry for today
    const today = getTodayString();
    const todayEntry = AppState.entries.find(e => e.date.split('T')[0] === today);
    
    if (todayEntry) {
        showToast('Vous avez déjà une entrée aujourd\'hui');
    }
}

// Start the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
