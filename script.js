document.addEventListener('DOMContentLoaded', function() {
    // Butonları seç
    const btnAci = document.getElementById('btn-aci');
    const btnTurler = document.getElementById('btn-turler');
    const btnBakim = document.getElementById('btn-bakim');
    const btnMalzemeler = document.getElementById('btn-malzemeler');
    const btnGercekler = document.getElementById('btn-gercekler');
    const btnSss = document.getElementById('btn-sss');
    const btnTakip = document.getElementById('btn-takip');

    // Hero butonları
    const heroStartTracking = document.getElementById('hero-start-tracking');
    const heroSeePain = document.getElementById('hero-see-pain');
    const heroQuickTypes = document.getElementById('hero-quick-types');
    const heroQuickCare = document.getElementById('hero-quick-care');
    const heroQuickTracking = document.getElementById('hero-quick-tracking');

    console.log('Navbar butonları:', {
        btnAci,
        btnTurler,
        btnBakim,
        btnMalzemeler,
        btnGercekler,
        btnSss,
        btnTakip,
        heroStartTracking,
        heroSeePain,
        heroQuickTypes,
        heroQuickCare,
        heroQuickTracking
    });
    
    // Her butona tıklama olayı ekle (buton varsa)
    if (btnAci) {
        btnAci.addEventListener('click', function() {
            showSection('aci', this);
        });
    }
    
    if (btnTurler) {
        btnTurler.addEventListener('click', function() {
            showSection('turler', this);
        });
    }
    
    if (btnBakim) {
        btnBakim.addEventListener('click', function() {
            showSection('bakim', this);
        });
    }
    
    if (btnMalzemeler) {
        btnMalzemeler.addEventListener('click', function() {
            showSection('malzemeler', this);
        });
    }
    
    if (btnGercekler) {
        btnGercekler.addEventListener('click', function() {
            showSection('gercekler', this);
        });
    }
    
    if (btnSss) {
        btnSss.addEventListener('click', function() {
            console.log('SSS butonu tıklandı!');
            showSection('sss', this);
        });
    }

    if (btnTakip) {
        btnTakip.addEventListener('click', function() {
            console.log('Takip butonu tıklandı!');
            showSection('takip', this);
        });
    }

    // Hero alanındaki butonlar
    if (heroStartTracking) {
        heroStartTracking.addEventListener('click', function() {
            showSection('takip', btnTakip || null);
        });
    }

    if (heroSeePain) {
        heroSeePain.addEventListener('click', function() {
            showSection('aci', btnAci || null);
        });
    }

    if (heroQuickTypes) {
        heroQuickTypes.addEventListener('click', function() {
            showSection('turler', btnTurler || null);
        });
    }

    if (heroQuickCare) {
        heroQuickCare.addEventListener('click', function() {
            showSection('bakim', btnBakim || null);
        });
    }

    if (heroQuickTracking) {
        heroQuickTracking.addEventListener('click', function() {
            showSection('takip', btnTakip || null);
        });
    }
    
    // Bölüm gösterme fonksiyonu
    function showSection(sectionId, clickedButton) {
        console.log('showSection çağrıldı:', sectionId);
        // Tüm bölümleri gizle
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Tüm butonlardan active sınıfını kaldır
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Seçilen bölümü göster
        const targetSection = document.getElementById(sectionId);
        console.log('Target section:', targetSection);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Active class eklendi');

            // Bölüm değiştiğinde ekranın ilgili kısma kaydırılması
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } else {
            console.log('HATA: Section bulunamadı!', sectionId);
        }
        
        // Tıklanan butona active sınıfı ekle
        if (clickedButton) {
            clickedButton.classList.add('active');
        }
    }
    
    // İlk yüklemede Acı Seviyeleri bölümünü göster
    showSection('aci', btnAci);

    // Accordion (Katlanır menü) fonksiyonu
    const accordionButtons = document.querySelectorAll('.accordion-button');
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Tıklanan butonun parent item'ını bul
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');
            
            // Tüm accordion itemları kapat
            document.querySelectorAll('.accordion-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Eğer tıklanan kapalıysa, aç
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });

    // ========================================
    // KİŞİSEL TAKİP SİSTEMİ
    // ========================================
    
    let piercings = JSON.parse(localStorage.getItem('piercings')) || [];
    let editingId = null;

    // DOM Elementleri
    const addPiercingBtn = document.getElementById('add-piercing-btn');
    const piercingForm = document.getElementById('piercing-form');
    const savePiercingBtn = document.getElementById('save-piercing-btn');
    const cancelPiercingBtn = document.getElementById('cancel-piercing-btn');
    const piercingList = document.getElementById('piercing-list');
    const emptyState = document.getElementById('empty-state');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');

    // Form Inputları
    const piercingType = document.getElementById('piercing-type');
    const piercingLocation = document.getElementById('piercing-location');
    const piercingDate = document.getElementById('piercing-date');
    const piercingPiercer = document.getElementById('piercing-piercer');
    const piercingNotes = document.getElementById('piercing-notes');

    // Takip sistemi elementleri varsa çalıştır
    if (addPiercingBtn && piercingForm && piercingDate) {
        
        // Bugünün tarihi için default değer
        piercingDate.max = new Date().toISOString().split('T')[0];

        // Form Göster/Gizle
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

    // Piercing Kaydet
    savePiercingBtn.addEventListener('click', function() {
        const type = piercingType.value.trim();
        const date = piercingDate.value;

        // Validasyon
        if (!type) {
            alert('❌ Lütfen piercing türünü seçin!');
            return;
        }

        if (!date) {
            alert('❌ Lütfen tarih seçin!');
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
            // Düzenleme
            const index = piercings.findIndex(p => p.id === editingId);
            piercings[index] = piercing;
        } else {
            // Yeni ekleme
            piercings.push(piercing);
        }

        savePiercings();
        renderPiercings();
        piercingForm.classList.add('hidden');
        clearForm();
        editingId = null;
    });

    // Piercing Sil
    function deletePiercing(id) {
        if (confirm('❌ Bu piercing kaydını silmek istediğinize emin misiniz?')) {
            piercings = piercings.filter(p => p.id !== id);
            savePiercings();
            renderPiercings();
        }
    }

    // Piercing Düzenle
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

    // Formu Temizle
    function clearForm() {
        piercingType.value = '';
        piercingLocation.value = '';
        piercingDate.value = '';
        piercingPiercer.value = '';
        piercingNotes.value = '';
    }

    // LocalStorage'a Kaydet
    function savePiercings() {
        localStorage.setItem('piercings', JSON.stringify(piercings));
    }

    // Gün Farkı Hesapla
    function calculateDaysSince(dateString) {
        const piercingDate = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - piercingDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Tür bazlı ikon ve renk bilgisi
    function getTypeMeta(type) {
        const value = (type || '').toLowerCase();
        let icon = '💫';
        let colorClass = 'piercing-card--default';

        if (value.includes('kulak') || value.includes('helix') || value.includes('tragus') || value.includes('daith') || value.includes('industrial')) {
            icon = '🦻';
            colorClass = 'piercing-card--ear';
        } else if (value.includes('burun') || value.includes('septum')) {
            icon = '👃';
            colorClass = 'piercing-card--nose';
        } else if (value.includes('dil')) {
            icon = '👅';
            colorClass = 'piercing-card--tongue';
        } else if (value.includes('göbek')) {
            icon = '✨';
            colorClass = 'piercing-card--navel';
        } else if (value.includes('meme')) {
            icon = '💎';
            colorClass = 'piercing-card--body';
        }

        return { icon, colorClass };
    }

    // Durum rozeti (badge) bilgisi
    function getStatusMeta(daysSince) {
        if (daysSince <= 3) {
            return { label: 'Dikkat', className: 'badge-warning' };
        }
        if (daysSince <= 14) {
            return { label: 'Yeni', className: 'badge-new' };
        }
        if (daysSince <= 60) {
            return { label: 'İyileşme', className: 'badge-healing' };
        }
        return { label: 'Oturmuş', className: 'badge-stable' };
    }

    // Piercingleri Listele
    function renderPiercings() {
        piercingList.innerHTML = '';

        if (piercings.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // Tarihe göre sırala (yeniden eskiye)
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
                            <span class="days-since">⏱️ ${daysSince} gün önce</span>
                        </div>
                    </div>
                    <div class="piercing-card-actions">
                        <button class="btn-edit" onclick="editPiercing(${piercing.id})">✏️ Düzenle</button>
                        <button class="btn-delete" onclick="deletePiercing(${piercing.id})">🗑️ Sil</button>
                    </div>
                </div>

                <div class="piercing-card-info">
                    <div class="info-row">
                        <strong>📅 Tarih:</strong>
                        <span>${new Date(piercing.date).toLocaleDateString('tr-TR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                    ${piercing.piercer ? `
                    <div class="info-row">
                        <strong>👨‍⚕️ Piercer:</strong>
                        <span>${piercing.piercer}</span>
                    </div>
                    ` : ''}
                </div>

                ${piercing.notes ? `
                <div class="piercing-card-notes">
                    <h4>📝 Notlar:</h4>
                    <p>${piercing.notes}</p>
                </div>
                ` : ''}
            `;

            piercingList.appendChild(card);
        });
    }

    // Dosya indirme yardımcı fonksiyonu
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
            alert('📭 Henüz kaydedilmiş piercing yok.');
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
            alert('📭 Henüz kaydedilmiş piercing yok.');
            return;
        }

        const header = ['ID', 'Tür', 'Konum', 'Tarih', 'Piercer', 'Notlar', 'Gün Farkı'];
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

    // Dışa aktarma butonları olayları
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportAsJson);
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportAsCsv);
    }

    // Global fonksiyonlar (HTML'den erişilebilir)
    window.deletePiercing = deletePiercing;
    window.editPiercing = editPiercing;

    // Sayfa yüklendiğinde piercingleri göster
    renderPiercings();
    
    } // if bloğu sonu - Takip sistemi elementleri varsa
});