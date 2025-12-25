document.addEventListener('DOMContentLoaded', function() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('lang') === 'en') {
            params.delete('lang');
            const cleanedQuery = params.toString();
            const newUrl = window.location.pathname + (cleanedQuery ? '?' + cleanedQuery : '') + window.location.hash;
            window.history.replaceState({}, '', newUrl);
        }
        localStorage.setItem('preferredLanguage', 'en');
    } catch (error) {
        console.warn('Unable to persist language preference', error);
    }
    // Navigation buttons
    const btnPain = document.getElementById('btn-aci');
    const btnTypes = document.getElementById('btn-turler');
    const btnCare = document.getElementById('btn-bakim');
    const btnSupplies = document.getElementById('btn-malzemeler');
    const btnInsights = document.getElementById('btn-gercekler');
    const btnFaq = document.getElementById('btn-sss');
    const btnTracker = document.getElementById('btn-takip');

    // Hero actions
    const heroStartTracking = document.getElementById('hero-start-tracking');
    const heroSeePain = document.getElementById('hero-see-pain');
    const heroQuickTypes = document.getElementById('hero-quick-types');
    const heroQuickCare = document.getElementById('hero-quick-care');
    const heroQuickTracking = document.getElementById('hero-quick-tracking');

    console.log('Navigation buttons ready:', {
        btnPain,
        btnTypes,
        btnCare,
        btnSupplies,
        btnInsights,
        btnFaq,
        btnTracker,
        heroStartTracking,
        heroSeePain,
        heroQuickTypes,
        heroQuickCare,
        heroQuickTracking
    });
    
    // Attach nav events
    if (btnPain) {
        btnPain.addEventListener('click', function() {
            showSection('aci', this);
        });
    }
    
    if (btnTypes) {
        btnTypes.addEventListener('click', function() {
            showSection('turler', this);
        });
    }
    
    if (btnCare) {
        btnCare.addEventListener('click', function() {
            showSection('bakim', this);
        });
    }
    
    if (btnSupplies) {
        btnSupplies.addEventListener('click', function() {
            showSection('malzemeler', this);
        });
    }
    
    if (btnInsights) {
        btnInsights.addEventListener('click', function() {
            showSection('gercekler', this);
        });
    }
    
    if (btnFaq) {
        btnFaq.addEventListener('click', function() {
            console.log('FAQ button clicked');
            showSection('sss', this);
        });
    }

    if (btnTracker) {
        btnTracker.addEventListener('click', function() {
            console.log('Tracker button clicked');
            showSection('takip', this);
        });
    }

    // Hero quick actions
    if (heroStartTracking) {
        heroStartTracking.addEventListener('click', function() {
            showSection('takip', btnTracker || null);
        });
    }

    if (heroSeePain) {
        heroSeePain.addEventListener('click', function() {
            showSection('aci', btnPain || null);
        });
    }

    if (heroQuickTypes) {
        heroQuickTypes.addEventListener('click', function() {
            showSection('turler', btnTypes || null);
        });
    }

    if (heroQuickCare) {
        heroQuickCare.addEventListener('click', function() {
            showSection('bakim', btnCare || null);
        });
    }

    if (heroQuickTracking) {
        heroQuickTracking.addEventListener('click', function() {
            showSection('takip', btnTracker || null);
        });
    }
    
    // Section toggler
    function showSection(sectionId, clickedButton) {
        console.log('showSection called with:', sectionId);
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Reset nav button states
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Activate new section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');

            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            console.log('Section not found:', sectionId);
        }
        
        // Highlight button
        if (clickedButton) {
            clickedButton.classList.add('active');
        }
    }
    
    // Default section
    showSection('aci', btnPain);

    // Accordion behavior
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });

    // ========================================
    // PERSONAL TRACKER
    // ========================================
    
    let piercings = JSON.parse(localStorage.getItem('piercings')) || [];
    let editingId = null;

    // DOM nodes
    const addPiercingBtn = document.getElementById('add-piercing-btn');
    const piercingForm = document.getElementById('piercing-form');
    const savePiercingBtn = document.getElementById('save-piercing-btn');
    const cancelPiercingBtn = document.getElementById('cancel-piercing-btn');
    const piercingList = document.getElementById('piercing-list');
    const emptyState = document.getElementById('empty-state');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Form inputs
    const piercingType = document.getElementById('piercing-type');
    const piercingLocation = document.getElementById('piercing-location');
    const piercingDate = document.getElementById('piercing-date');
    const piercingPiercer = document.getElementById('piercing-piercer');
    const piercingNotes = document.getElementById('piercing-notes');

    // Guard clause for alternate pages without tracker
    if (addPiercingBtn && piercingForm && piercingDate) {
        // Limit date picker to today
        piercingDate.max = new Date().toISOString().split('T')[0];

        // Show/Hide form
        addPiercingBtn.addEventListener('click', function() {
            piercingForm.classList.remove('hidden');
            editingId = null;
            clearForm();
            piercingForm.scrollIntoView({ behavior: 'smooth' });
        });

        cancelPiercingBtn.addEventListener('click', function() {
            piercingForm.classList.add('hidden');
            editingId = null;
            clearForm();
        });

        // Save handler
        savePiercingBtn.addEventListener('click', function() {
            const type = piercingType.value.trim();
            const date = piercingDate.value;

            if (!type) {
                alert('❌ Please choose a piercing type.');
                return;
            }

            if (!date) {
                alert('❌ Please select the piercing date.');
                return;
            }

            const piercing = {
                id: editingId || Date.now(),
                type: type,
                location: piercingLocation.value.trim(),
                date: date,
                piercer: piercingPiercer.value.trim(),
                notes: piercingNotes.value.trim()
            };

            if (editingId) {
                const index = piercings.findIndex(p => p.id === editingId);
                piercings[index] = piercing;
            } else {
                piercings.push(piercing);
            }

            savePiercings();
            renderPiercings();
            piercingForm.classList.add('hidden');
            clearForm();
            editingId = null;
        });

        // Delete
        function deletePiercing(id) {
            if (confirm('❌ Delete this piercing record?')) {
                piercings = piercings.filter(p => p.id !== id);
                savePiercings();
                renderPiercings();
            }
        }

        // Edit
        function editPiercing(id) {
            const piercing = piercings.find(p => p.id === id);
            if (piercing) {
                editingId = id;
                piercingType.value = piercing.type;
                piercingLocation.value = piercing.location || '';
                piercingDate.value = piercing.date;
                piercingPiercer.value = piercing.piercer || '';
                piercingNotes.value = piercing.notes || '';
                piercingForm.classList.remove('hidden');
                piercingForm.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // Helpers
        function clearForm() {
            piercingType.value = '';
            piercingLocation.value = '';
            piercingDate.value = '';
            piercingPiercer.value = '';
            piercingNotes.value = '';
        }

        function savePiercings() {
            localStorage.setItem('piercings', JSON.stringify(piercings));
        }

        function calculateDaysSince(dateString) {
            const piercingDate = new Date(dateString);
            const today = new Date();
            const diffTime = Math.abs(today - piercingDate);
            return Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        function getTypeMeta(type) {
            const value = (type || '').toLowerCase();
            let icon = '💫';
            let colorClass = 'piercing-card--default';

            if (value.includes('ear') || value.includes('helix') || value.includes('tragus') || value.includes('daith') || value.includes('industrial')) {
                icon = '🦻';
                colorClass = 'piercing-card--ear';
            } else if (value.includes('nose') || value.includes('nostril') || value.includes('septum')) {
                icon = '👃';
                colorClass = 'piercing-card--nose';
            } else if (value.includes('tongue')) {
                icon = '👅';
                colorClass = 'piercing-card--tongue';
            } else if (value.includes('navel') || value.includes('belly')) {
                icon = '✨';
                colorClass = 'piercing-card--navel';
            } else if (value.includes('nipple') || value.includes('dermal') || value.includes('surface') || value.includes('body')) {
                icon = '💎';
                colorClass = 'piercing-card--body';
            }

            return { icon, colorClass };
        }

        function getStatusMeta(daysSince) {
            if (daysSince <= 3) {
                return { label: 'Critical', className: 'badge-warning' };
            }
            if (daysSince <= 14) {
                return { label: 'New', className: 'badge-new' };
            }
            if (daysSince <= 60) {
                return { label: 'Healing', className: 'badge-healing' };
            }
            return { label: 'Settled', className: 'badge-stable' };
        }

        function renderPiercings() {
            piercingList.innerHTML = '';

            if (piercings.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');

            const sortedPiercings = [...piercings].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedPiercings.forEach(piercing => {
                const daysSince = calculateDaysSince(piercing.date);
                const { icon, colorClass } = getTypeMeta(piercing.type);
                const status = getStatusMeta(daysSince);

                const card = document.createElement('div');
                card.className = `piercing-card ${colorClass}`;
                
                card.innerHTML = `
                    <div class="piercing-card-header">
                        <div class="piercing-card-title">
                            <h3>${icon} ${piercing.type}</h3>
                            ${piercing.location ? `<div class="location">📍 ${piercing.location}</div>` : ''}
                            <div class="piercing-card-meta">
                                <span class="piercing-badge ${status.className}">${status.label}</span>
                                <span class="days-since">⏱️ ${daysSince} days ago</span>
                            </div>
                        </div>
                        <div class="piercing-card-actions">
                            <button class="btn-edit" onclick="editPiercing(${piercing.id})">✏️ Edit</button>
                            <button class="btn-delete" onclick="deletePiercing(${piercing.id})">🗑️ Delete</button>
                        </div>
                    </div>

                    <div class="piercing-card-info">
                        <div class="info-row">
                            <strong>📅 Date</strong>
                            <span>${new Date(piercing.date).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</span>
                        </div>
                        ${piercing.piercer ? `
                        <div class="info-row">
                            <strong>👩‍⚕️ Piercer</strong>
                            <span>${piercing.piercer}</span>
                        </div>
                        ` : ''}
                    </div>

                    ${piercing.notes ? `
                    <div class="piercing-card-notes">
                        <h4>📝 Notes</h4>
                        <p>${piercing.notes}</p>
                    </div>
                    ` : ''}
                `;

                piercingList.appendChild(card);
            });
        }

        function downloadFile(filename, content, mimeType) {
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function exportAsJson() {
            if (!piercings.length) {
                alert('📭 No piercings have been logged yet.');
                return;
            }
            const data = JSON.stringify(piercings, null, 2);
            const todayStr = new Date().toISOString().split('T')[0];
            downloadFile(`piercings-${todayStr}.json`, data, 'application/json');
        }

        function toCsvRow(cells) {
            return cells
                .map(value => {
                    const v = String(value ?? '').replace(/\r?\n/g, ' ');
                    const escaped = v.replace(/"/g, '""');
                    return `"${escaped}"`;
                })
                .join(',');
        }

        function exportAsCsv() {
            if (!piercings.length) {
                alert('📭 No piercings have been logged yet.');
                return;
            }

            const header = ['ID', 'Type', 'Placement', 'Date', 'Piercer', 'Notes', 'Days Since'];
            const rows = piercings.map(p => {
                const days = calculateDaysSince(p.date);
                return [
                    p.id,
                    p.type,
                    p.location || '',
                    p.date,
                    p.piercer || '',
                    p.notes || '',
                    days
                ];
            });

            const csv = [
                toCsvRow(header),
                ...rows.map(toCsvRow)
            ].join('\n');

            const todayStr = new Date().toISOString().split('T')[0];
            downloadFile(`piercings-${todayStr}.csv`, csv, 'text/csv');
        }

        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', exportAsJson);
        }

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', exportAsCsv);
        }

        window.deletePiercing = deletePiercing;
        window.editPiercing = editPiercing;

        renderPiercings();
    }
});
