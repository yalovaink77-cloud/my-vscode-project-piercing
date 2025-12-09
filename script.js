document.addEventListener('DOMContentLoaded', function() {
    // Butonları seç
    const btnAci = document.getElementById('btn-aci');
    const btnTurler = document.getElementById('btn-turler');
    const btnBakim = document.getElementById('btn-bakim');
    const btnMalzemeler = document.getElementById('btn-malzemeler');
    const btnGercekler = document.getElementById('btn-gercekler');
    const btnSss = document.getElementById('btn-sss');
    
    // Her butona tıklama olayı ekle
    btnAci.addEventListener('click', function() {
        showSection('aci', this);
    });
    
    btnTurler.addEventListener('click', function() {
        showSection('turler', this);
    });
    
    btnBakim.addEventListener('click', function() {
        showSection('bakim', this);
    });
    
    btnMalzemeler.addEventListener('click', function() {
        showSection('malzemeler', this);
    });
    
    btnGercekler.addEventListener('click', function() {
        showSection('gercekler', this);
    });
    
    btnSss.addEventListener('click', function() {
        console.log('SSS butonu tıklandı!');
        showSection('sss', this);
    });
    
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
});