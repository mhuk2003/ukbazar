// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTXwymNyHqLHVqYL7XN6FYSOeL1V_dNwo",
    authDomain: "ukbazar-15eda.firebaseapp.com",
    databaseURL: "https://ukbazar-15eda-default-rtdb.firebaseio.com",
    projectId: "ukbazar-15eda",
    storageBucket: "ukbazar-15eda.firebasestorage.app",
    messagingSenderId: "94941429314",
    appId: "1:94941429314:web:ea88463794d693cc1ff7db"
};

firebase.initializeApp(firebaseConfig);

let database, storage;
try {
    database = firebase.database();
} catch(e) {
    console.error('Firebase Database error:', e);
    database = {
        ref: () => ({ once: () => Promise.resolve({ val: () => null, forEach: () => {} }),
                      push: () => Promise.resolve(), on: () => {}, off: () => {} })
    };
}
try {
    storage = firebase.storage();
} catch(e) {
    console.error('Firebase Storage error:', e);
    storage = { ref: () => ({ put: () => Promise.resolve(), getDownloadURL: () => Promise.resolve('') }) };
}

let products = [];
let cart = [];
let isAdmin = false;
let currentSlide = 0;
let totalSlides = 0;
let autoPlayInterval = null;

// ==================== HTTP → HTTPS فیکسەر ====================
// وێنەکانی Firebase کەواتە http:// ذخیرە کراون — یەکسەر بگۆڕێن بۆ https://
function safeUrl(url) {
    if (!url || typeof url !== 'string') return url;
    return url.replace(/^http:\/\//i, 'https://');
}

// پاکردنەوەی ئۆبجێکتی کاڵا — هەموو URLی وێنەکان درووست بکە
function sanitizeProduct(p) {
    if (!p) return p;
    if (Array.isArray(p.images)) {
        p.images = p.images.map(safeUrl);
    }
    if (p.image)    p.image    = safeUrl(p.image);
    if (p.thumbUrl) p.thumbUrl = safeUrl(p.thumbUrl);
    if (p.videoUrl) p.videoUrl = safeUrl(p.videoUrl);
    return p;
}

// وێنەی یەدەگ - بەکارهێنانی وێنەی SVG سادە
const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Crect width=\'300\' height=\'300\' fill=\'%23667eea\'/%3E%3Ctext x=\'50\' y=\'150\' font-family=\'Arial\' font-size=\'24\' fill=\'%23ffffff\'%3EUK BAZAR%3C/text%3E%3C/svg%3E';
const DEFAULT_SLIDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1200\' height=\'400\' viewBox=\'0 0 1200 400\'%3E%3Crect width=\'1200\' height=\'400\' fill=\'%23667eea\'/%3E%3Ctext x=\'400\' y=\'200\' font-family=\'Arial\' font-size=\'48\' fill=\'%23ffffff\'%3EUK BAZAR%3C/text%3E%3C/svg%3E';

// ==================== Inject Compact Label CSS for Mobile ====================
(function injectLabelStyles() {
    if (document.getElementById('delivery-label-compact-css')) return;
    const style = document.createElement('style');
    style.id = 'delivery-label-compact-css';
    style.textContent = `
        /* ===== Ultra-Compact Delivery Label — Mobile First ===== */
        .delivery-label-card {
            border-radius: 10px !important;
            overflow: visible;
            box-shadow: 0 2px 8px rgba(102,126,234,0.12);
            margin-bottom: 10px !important;
            font-size: 0.82rem;
            border: 1.5px solid #e2e8f0;
        }
        .label-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 5px !important;
            padding: 6px 10px !important;
            flex-wrap: nowrap !important;
            min-height: unset !important;
        }
        .label-order-num {
            font-size: 0.9rem !important;
            font-weight: 800;
            flex-shrink: 0;
        }
        .label-title-center {
            font-size: 0.72rem !important;
            flex: 1;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .label-body-wrap {
            padding: 6px 8px !important;
        }
        .label-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 5px !important;
            margin-bottom: 5px !important;
        }
        .label-section {
            padding: 5px 7px !important;
            border-radius: 7px !important;
        }
        .label-section-title {
            font-size: 0.72rem !important;
            font-weight: 700 !important;
            margin-bottom: 3px !important;
            padding-bottom: 3px !important;
        }
        .label-row {
            font-size: 0.72rem !important;
            padding: 1px 0 !important;
            gap: 3px !important;
        }
        .label-row span { font-size: 0.68rem !important; }
        .label-row strong { font-size: 0.72rem !important; }
        .label-package {
            padding: 5px 7px !important;
            border-radius: 7px !important;
            margin-bottom: 5px !important;
        }
        /* بەشی شۆفیر — دابخرێت بۆ ئەوەی بچووکتر بێت */
        .label-admin-edit {
            padding: 6px 8px !important;
            border-radius: 8px !important;
            margin-bottom: 5px !important;
        }
        .admin-edit-title {
            font-size: 0.72rem !important;
            margin-bottom: 4px !important;
        }
        .admin-edit-inputs {
            display: flex !important;
            gap: 4px !important;
            margin-bottom: 4px !important;
        }
        .admin-edit-inputs input,
        .label-admin-edit textarea {
            font-size: 0.75rem !important;
            padding: 5px 7px !important;
            border-radius: 6px !important;
        }
        .label-admin-edit textarea {
            rows: 2 !important;
            min-height: 40px !important;
            max-height: 60px !important;
            resize: none !important;
        }
        .admin-save-btn {
            padding: 5px 12px !important;
            font-size: 0.75rem !important;
            border-radius: 6px !important;
        }
        /* QR بچووکتر */
        .label-qr-wrap {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            padding: 4px 0 !important;
        }
        .label-qr-img {
            width: 100px !important;
            height: 100px !important;
        }
        .label-qr-hint {
            font-size: 0.65rem !important;
            margin-top: 1px !important;
            color: #718096;
        }
        .label-footer {
            padding: 4px 10px !important;
            font-size: 0.68rem !important;
        }
        /* موبایل: ستوون یەک */
        @media (max-width: 500px) {
            .label-grid {
                grid-template-columns: 1fr !important;
                gap: 4px !important;
            }
        }

        /* ===== Loading Screen — بچووکتر و خێراتر ===== */
        .loading-spinner {
            position: fixed !important;
            inset: 0 !important;
            z-index: 9999 !important;
            background: #fff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: opacity 0.25s !important;
        }
        .spinner-banner {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 24px 20px !important;
            max-width: 280px !important;
            width: 90% !important;
        }
        /* لۆگۆی سەرەوە — بچووکتر */
        .spinner-banner .banner-logo {
            width: 52px !important;
            height: 52px !important;
            border-radius: 14px !important;
            object-fit: contain !important;
        }
        /* ناوی سایت */
        .spinner-banner .banner-title {
            font-size: 1.3rem !important;
            font-weight: 800 !important;
            color: #D40511 !important;
            margin: 0 !important;
        }
        .spinner-banner .banner-slogan {
            font-size: 0.78rem !important;
            color: #718096 !important;
            margin: 0 !important;
        }
        /* وێنەی باندەر — بسڕێتەوە */
        .spinner-banner .banner-image {
            display: none !important;
        }
        /* spinner */
        .spinner-small {
            width: 32px !important;
            height: 32px !important;
            border: 3px solid #e2e8f0 !important;
            border-top-color: #D40511 !important;
            border-radius: 50% !important;
            animation: spin 0.7s linear infinite !important;
            margin-top: 6px !important;
        }
        .loading-text {
            font-size: 0.8rem !important;
            color: #a0aec0 !important;
            margin: 0 !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
})();

// ==================== Helper Functions ====================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const notificationIcon = document.getElementById('notificationIcon');
    
    if (notification && notificationMessage) {
        notificationMessage.textContent = message;
        notificationMessage.style.color = '#ffffff';
        
        if (notificationIcon) {
            if (type === 'error') notificationIcon.textContent = '❌';
            else if (type === 'info') notificationIcon.textContent = 'ℹ️';
            else notificationIcon.textContent = '✅';
        }
        
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.opacity = '0';
        spinner.style.pointerEvents = 'none';
        setTimeout(() => {
            spinner.style.display = 'none';
        }, 300);
    }
}

function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'flex';
        spinner.style.opacity = '1';
        spinner.style.pointerEvents = 'all';
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        if (modalId === 'imageModal') {
            document.body.style.overflow = 'auto';
        }
    }
}

function openPrivacyPage() {
    var p = document.getElementById('privacyPage');
    if (p) {
        p.style.display = 'block';
        p.scrollTop = 0;
    }
}
function closePrivacyPage() {
    var p = document.getElementById('privacyPage');
    if (p) p.style.display = 'none';
}

function showHomePage() {
    const adminPanel = document.getElementById('adminPanel');
    const productsSection = document.querySelector('.products-section');
    const sliderSection = document.querySelector('.slider-section');
    const categorySection = document.querySelector('.category-filter-section');
    const productsTitle = document.getElementById('productsTitle');
    
    if (adminPanel) adminPanel.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
    if (sliderSection) sliderSection.style.display = 'block';
    if (categorySection) categorySection.style.display = 'block';
    if (productsTitle) productsTitle.textContent = window.t ? window.t('all_products') : 'هەموو کاڵاکان';
    
    loadApprovedProducts();
    loadVideos();
}

// ==================== Modal Triggers ====================
function showRequestModal() { showModal('requestModal'); }
function showAddProductModal() { showModal('addProductModal'); }
function showDeliveryModal() { showModal('deliveryModal'); }

// ═══════════════════════════════════════════════════════════
//  TRACKING WIDGET — چاودێری کاڵا (inline section)
// ═══════════════════════════════════════════════════════════

function toggleTrackingWidget() {
    const body = document.getElementById('trackingWidgetBody');
    const chevron = document.getElementById('trackingChevron');
    if (!body) return;
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    if (!isOpen) {
        setTimeout(() => {
            const inp = document.getElementById('trackingPhoneInput');
            if (inp) inp.focus();
        }, 200);
    }
}

function showDeliveryChoiceModal() { showModal('deliveryModal'); }
function openDeliveryAdmin()       { showModal('deliveryModal'); }
function openCustomerTracking()    {
    const body = document.getElementById('trackingWidgetBody');
    const chevron = document.getElementById('trackingChevron');
    if (body) { body.style.display = 'block'; }
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    const section = document.getElementById('trackingSection');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
        const inp = document.getElementById('trackingPhoneInput');
        if (inp) inp.focus();
    }, 400);
}
function checkDeliveryAdminPass()  {}

// ───────────────────────────────────────────────────────────
//  CUSTOMER ORDER SEARCH — گەڕان بە ژمارەی مۆبایل
// ───────────────────────────────────────────────────────────
function searchCustomerOrders() {
    const phoneInp  = document.getElementById('trackingPhoneInput');
    const resultsEl = document.getElementById('trackingResults');
    const errEl     = document.getElementById('trackingErr');
    if (!phoneInp || !resultsEl) return;

    const raw = phoneInp.value.trim();
    if (!raw || raw.length < 4) {
        if (errEl) { errEl.textContent = 'تکایە ژمارەی مۆبایل یان کۆدی پسولە بنووسە'; errEl.style.display = 'block'; }
        return;
    }
    if (errEl) errEl.style.display = 'none';

    // دیاریکردنی جۆری گەڕان: کۆد (پیتی+ژمارە) یان مۆبایل
    const upperRaw = raw.toUpperCase();
    const isCode = /^[A-Z]{2,}[0-9]{2,}/.test(upperRaw) || /^[A-Z0-9]{6,10}$/.test(upperRaw);
    const phone  = raw.replace(/\s+/g, '');

    resultsEl.innerHTML = '<div style="text-align:center;padding:20px;color:#D40511;"><i class="fas fa-spinner fa-spin"></i> چاوەڕوانی بکە...</div>';

    var noSnap = { exists: function(){ return false; }, forEach: function(){} };
    var safeOnce = function(ref) { return database.ref(ref).once('value').catch(function(){ return noSnap; }); };
    Promise.all([
        safeOnce('delivery'),
        safeOnce('intlPost')
    ]).then(([deliverySnap, intlSnap]) => {
        const matches = [];

        // KU + UK گەیاندن
        if (deliverySnap.exists()) {
            deliverySnap.forEach(child => {
                const d = child.val();
                const isUk = d.type === 'uk';
                const orderNum = (d.orderNumber || '').toUpperCase();

                let matched = false;
                if (isCode) {
                    // گەڕان بە کۆدی پسولە تەنها
                    matched = orderNum === upperRaw || orderNum.includes(upperRaw) || upperRaw.includes(orderNum);
                } else {
                    // گەڕان بە مۆبایل تەنها
                    const phones = isUk
                        ? [d.phone, d.receiverPhone, d.receiverTel]
                        : [d.senderMobile, d.senderMobile2, d.receiverMobile, d.receiverMobile2];
                    const phoneList = phones.filter(Boolean).map(p => p.replace(/\s+/g,''));
                    matched = phoneList.some(p => p.includes(phone) || phone.includes(p));
                }
                if (matched) matches.push({ key: child.key, type: isUk ? 'uk' : 'ku', ...d });
            });
        }

        // پۆستی نێودەوڵەتی
        if (intlSnap.exists()) {
            intlSnap.forEach(child => {
                const d = child.val();
                const s = d.sender || {};
                const r = d.recipient || {};
                const orderNum = (d.orderNumber || '').toUpperCase();

                let matched = false;
                if (isCode) {
                    matched = orderNum === upperRaw || orderNum.includes(upperRaw) || upperRaw.includes(orderNum);
                } else {
                    const phones = [s.tel, r.tel, d.driverMobile]
                        .filter(Boolean).map(p => p.replace(/\s+/g,''));
                    matched = phones.some(p => p.includes(phone) || phone.includes(p));
                }
                if (matched) matches.push({ key: child.key, type: 'intl', ...d });
            });
        }

        if (matches.length === 0) {
            resultsEl.innerHTML = `
                <div style="text-align:center;padding:24px;background:#fff8f8;border-radius:14px;border:2px dashed #FF8A80;">
                    <div style="font-size:2rem;margin-bottom:8px;">🔍</div>
                    <div style="font-weight:700;color:#D40511;margin-bottom:4px;">هیچ کاڵایەک نەدۆزرایەوە</div>
                    <div style="font-size:.82rem;color:#718096;margin-bottom:4px;">ژمارەی مۆبایل یان کۆدی پسولە هەڵەیە</div>
                    <div style="font-size:.78rem;color:#a0aec0;">دووبارە بپشکنە: <strong>${escapeHtml(raw)}</strong></div>
                </div>`;
            return;
        }

        // ستاتەسەکان بە ترتیب
        const STATUS_LIST = [
            { key: 'registered',  label: 'تۆماركراو',       en: 'Registered',        icon: '📋', color: '#D40511' },
            { key: 'picked_up',   label: 'وەرگیراو',        en: 'Picked Up',         icon: '🚗', color: '#FFCC00' },
            { key: 'loading',     label: 'بارکردنی کاڵا',  en: 'Loading Warehouse', icon: '🏭', color: '#E6B800' },
            { key: 'in_transit',  label: 'لە ڕێگادایە',     en: 'In Transit',        icon: '🚛', color: '#D40511' },
            { key: 'sorting',     label: 'کاڵا دابەشکردن',en: 'Sorting Warehouse', icon: '📦', color: '#D40511' },
            { key: 'delivered',   label: 'گەیشتووە',        en: 'Delivered',         icon: '✅', color: '#FFCC00' },
        ];

        let html = `<div style="font-size:.82rem;color:#718096;margin-bottom:10px;text-align:center;">${matches.length} کاڵا دۆزرایەوە</div>`;

        matches.forEach(d => {
            // ── International Post ──────────────────────────────────────────
            if (d.type === 'intl') {
                const s = d.sender || {};
                const r = d.recipient || {};
                const orderNum = d.orderNumber || d.key || '—';
                const flagPart = d.country ? d.country.split(' ')[0] : '🌍';
                const cname = d.country ? d.country.split(' ').slice(1).join(' ') : '—';
                const date = d.timestamp || '';
                const hasDriver = d.driverName || d.driverMobile;

                html += `
                <div style="border:2px solid #D4051122;border-radius:16px;overflow:hidden;margin-bottom:14px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.07);">
                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#D40511,#A50008);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                        <div style="color:#fff;font-weight:800;font-size:.95rem;">🌍 پۆستی نێودەوڵەتی</div>
                        <div style="color:#fff;font-size:.75rem;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-weight:700;">${flagPart} ${cname} — ${orderNum}</div>
                    </div>
                    <!-- Shipment date -->
                    ${date ? `<div style="background:#FFF9C4;padding:7px 14px;font-size:.78rem;color:#D40511;font-weight:700;border-bottom:1px solid #FFE082;display:flex;align-items:center;gap:6px;"><span>📅 بەرواری ناردن:</span><strong>${date}</strong></div>` : ''}
                    <!-- Intl Status Steps -->
                    ${(function(){
                        var ISTEPS = [
                            { key:'registered', ku:'تۆماركراوە',   icon:'📋', color:'#D40511' },
                            { key:'loading',    ku:'بارکراوە',      icon:'🏭', color:'#E6B800' },
                            { key:'in_transit', ku:'لەڕێگادایە',   icon:'🚛', color:'#D40511' },
                            { key:'delivered',  ku:'گەیشتووە',     icon:'✅', color:'#FFCC00' },
                            { key:'sorting',    ku:'دابەشکردن',    icon:'📦', color:'#D40511' },
                        ];
                        var ist = d.status || 'registered';
                        var isi = ISTEPS.findIndex(function(s){ return s.key === ist; });
                        if (isi < 0) isi = 0;
                        var stepsH = ISTEPS.map(function(s, i) {
                            var done = i <= isi; var active = i === isi;
                            return '<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">'
                              + '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;'
                              + 'background:' + (done ? s.color : '#e2e8f0') + ';color:' + (done ? '#fff' : '#a0aec0') + ';'
                              + 'border:' + (active ? '3px solid ' + s.color : '2px solid ' + (done ? s.color : '#e2e8f0')) + ';'
                              + 'box-shadow:' + (active ? '0 0 0 4px ' + s.color + '22' : 'none') + ';'
                              + 'font-weight:' + (active ? '900' : '600') + ';transition:all .3s;">'
                              + (done ? (active ? s.icon : '✓') : (i+1))
                              + '</div>'
                              + '<div style="font-size:.52rem;color:' + (done ? s.color : '#a0aec0') + ';text-align:center;font-weight:' + (active ? '700':'400') + ';line-height:1.2;max-width:38px;">' + s.ku + '</div>'
                              + '</div>';
                        }).join('<div style="flex:1;height:2px;background:linear-gradient(90deg,' + (ISTEPS[isi]||ISTEPS[0]).color + ',#e2e8f0);margin-top:13px;border-radius:2px;"></div>');
                        var curS = ISTEPS[isi] || ISTEPS[0];
                        var badgeDots = ISTEPS.map(function(s,i){ return '<span style="width:8px;height:8px;border-radius:50%;background:' + (i<=isi?s.color:'#e2e8f0') + ';display:inline-block;' + (i===isi?'box-shadow:0 0 0 3px '+s.color+'33;':'') + '"></span>'; }).join('');
                        var badgeBar = '<div style="background:#fff;padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:8px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:.78rem;font-weight:700;color:#718096;">📊 ستاتەسی کاڵا:</span><span style="background:'+curS.color+';color:#fff;padding:5px 14px;border-radius:20px;font-size:.82rem;font-weight:800;">'+curS.icon+' '+curS.ku+'</span></div><div style="display:flex;gap:6px;">' + badgeDots + '</div></div>';
                        return badgeBar + '<div style="padding:12px 8px 10px;background:#FFFDE7;border-bottom:1px solid #e2e8f0;"><div style="display:flex;align-items:flex-start;justify-content:space-between;">' + stepsH + '</div></div>';
                    })()}
                    <!-- Sender & Recipient — تەنها ناو، بەبێ مۆبایل/کیلۆ -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #e2e8f0;">
                        <div style="padding:10px 12px;border-left:1px solid #e2e8f0;">
                            <div style="font-size:.7rem;font-weight:800;color:#718096;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">📤 نێردەر</div>
                            ${s.name ? `<div style="font-size:.82rem;font-weight:700;color:#1C1C1C;">👤 ${escapeHtml(s.name)}</div>` : '<div style="font-size:.8rem;color:#a0aec0;">—</div>'}
                        </div>
                        <div style="padding:10px 12px;">
                            <div style="font-size:.7rem;font-weight:800;color:#718096;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">📬 وەرگر</div>
                            ${r.name ? `<div style="font-size:.82rem;font-weight:700;color:#1C1C1C;">👤 ${escapeHtml(r.name)}</div>` : '<div style="font-size:.8rem;color:#a0aec0;">—</div>'}
                        </div>
                    </div>
                    <!-- Driver info — تەنها ناوی شۆفیر -->
                    ${hasDriver ? `
                    <div style="background:#FFFDE7;padding:9px 14px;border-top:2px dashed #FFE082;display:flex;align-items:center;gap:8px;">
                        <div style="font-size:1.2rem;">🚗</div>
                        <div>
                            <div style="font-size:.7rem;font-weight:800;color:#E6B800;margin-bottom:1px;">شۆفیری گەیاندن</div>
                            ${d.driverName ? `<div style="font-size:.85rem;font-weight:700;color:#1C1C1C;">👤 ${escapeHtml(d.driverName)}</div>` : ''}
                        </div>
                    </div>` : `
                    <div style="background:#fffaf0;padding:8px 14px;border-top:1px solid #fbd38d;font-size:.75rem;color:#C49A00;text-align:center;">
                        ⏳ هێشتا شۆفیر دیاری نەکراوە
                    </div>`}
                </div>`;
                return;
            }

            // ── KU / UK delivery ─────────────────────────────────────────
            const status = (d.status || 'registered').toLowerCase().replace(/\s+/g, '_');
            const si = STATUS_LIST.findIndex(s => s.key === status);
            const curStatus = STATUS_LIST[si] || STATUS_LIST[0];

            const isUk = d.type === 'uk';
            const orderNum = d.orderNumber || d.key || '—';
            const name = isUk
                ? (d.fullName || d.name || '—')
                : (d.senderName || d.name || '—');
            const dest = isUk
                ? (d.destinationCity || d.city || '—')
                : (d.receiverLocation || '—');
            const date = d.timestamp || d.date || '';
            const hasDriver = d.driverName; // show only driver name, no phone

            const stepsHtml = STATUS_LIST.map((s, i) => {
                const done = i <= si;
                const active = i === si;
                return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">
                    <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;
                        background:${done ? s.color : '#e2e8f0'};color:${done ? '#fff' : '#a0aec0'};
                        border:${active ? '3px solid ' + s.color : '2px solid ' + (done ? s.color : '#e2e8f0')};
                        box-shadow:${active ? '0 0 0 4px ' + s.color + '22' : 'none'};
                        font-weight:${active ? '900' : '600'};transition:all .3s;">
                        ${done ? (i === si ? s.icon : '✓') : (i + 1)}
                    </div>
                    <div style="font-size:.55rem;color:${done ? s.color : '#a0aec0'};text-align:center;font-weight:${active ? '700' : '400'};line-height:1.2;max-width:40px;">${s.label}</div>
                </div>`;
            }).join(`<div style="flex:1;height:2px;background:linear-gradient(90deg,${si >= 0 ? curStatus.color : '#e2e8f0'},#e2e8f0);margin-top:13px;border-radius:2px;"></div>`);

            html += `
            <div style="border:2px solid ${curStatus.color}22;border-radius:16px;overflow:hidden;margin-bottom:14px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.07);">
                <!-- Header -->
                <div style="background:${curStatus.color};padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                    <div style="color:#fff;font-weight:800;font-size:.95rem;">${curStatus.icon} ${curStatus.label}</div>
                    <div style="color:#fff;font-size:.75rem;background:rgba(255,255,255,.2);padding:3px 10px;border-radius:20px;font-weight:700;">${isUk ? '🇬🇧 UK' : '🇮🇶 کوردستان'} — ${orderNum}</div>
                </div>
                <!-- Status Badge Bar -->
                <div style="background:#fff;padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:.78rem;font-weight:700;color:#718096;">📊 ستاتەسی کاڵا:</span>
                        <span style="background:${curStatus.color};color:#fff;padding:5px 14px;border-radius:20px;font-size:.82rem;font-weight:800;display:flex;align-items:center;gap:5px;box-shadow:0 2px 8px ${curStatus.color}44;">
                            ${curStatus.icon} ${curStatus.label}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        ${STATUS_LIST.map((s, i) => `<span style="width:8px;height:8px;border-radius:50%;background:${i <= si ? s.color : '#e2e8f0'};display:inline-block;${i === si ? 'box-shadow:0 0 0 3px ' + s.color + '33;' : ''}"></span>`).join('')}
                    </div>
                </div>
                <!-- Steps -->
                <div style="padding:14px 10px 10px;background:#FFFDE7;">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                        ${stepsHtml}
                    </div>
                </div>
                <!-- Info — تەنها ناو و شوێن، بەبێ کیلۆ/پارە/مۆبایل -->
                <div style="padding:12px 14px;border-top:1px solid #e2e8f0;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                        <div style="font-size:.8rem;"><span style="color:#718096;">👤 ناو:</span> <strong>${escapeHtml(name)}</strong></div>
                        <div style="font-size:.8rem;"><span style="color:#718096;">📍 شوێن:</span> <strong>${escapeHtml(dest)}</strong></div>
                    </div>
                    ${date ? `<div style="font-size:.72rem;color:#a0aec0;margin-top:6px;text-align:center;">📅 ${date}</div>` : ''}
                </div>
                <!-- Driver info — تەنها ناوی شۆفیر، بەبێ ژمارەی مۆبایل -->
                ${hasDriver ? `
                <div style="background:#FFFDE7;padding:9px 14px;border-top:2px dashed #FFE082;display:flex;align-items:center;gap:8px;">
                    <div style="font-size:1.2rem;">🚗</div>
                    <div>
                        <div style="font-size:.7rem;font-weight:800;color:#E6B800;margin-bottom:1px;">شۆفیری گەیاندن</div>
                        <div style="font-size:.85rem;font-weight:700;color:#1C1C1C;">👤 ${escapeHtml(d.driverName)}</div>
                    </div>
                </div>` : ''}
            </div>`;
        });

        resultsEl.innerHTML = html;
    }).catch(err => {
        console.error(err);
        resultsEl.innerHTML = '<div style="text-align:center;color:#D40511;padding:16px;">هەڵە لە بارکردن، دووبارە هەوڵ بدە</div>';
    });
}
function showFibModal() { showModal('fibModal'); }

// ==================== Admin Functions ====================
// وشەی تێپەڕی بەڕێوەبەر بە hash پاراستراوە — نەک بە تەکست ئاشکرا
var _ADMIN_H = 'aa5ff7ddeca7848ed7eb16270306d14ba2f7b65171ca0e700ec2e2adda115b83';
function _checkAdminPass(p) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(p))
    .then(function(b){ return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0');}).join('') === _ADMIN_H; });
}

function showAdminLogin() {
    // سڕینەوەی modal ی کۆن ئەگەر هەبوو
    var old = document.getElementById('_adminLoginModal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = '_adminLoginModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:20px;padding:0;width:100%;max-width:380px;overflow:hidden;box-shadow:0 16px 50px rgba(0,0,0,.3);">
        <!-- هێدەر -->
        <div style="background:linear-gradient(135deg,#D40511,#A50008);padding:22px 20px 18px;text-align:center;">
          <div style="font-size:2rem;margin-bottom:6px;">🔐</div>
          <div style="color:#fff;font-weight:900;font-size:1.1rem;">داشبۆردی بەڕێوەبەر</div>
          <div style="color:rgba(255,255,255,.75);font-size:.8rem;margin-top:3px;">UK BAZAR — Admin Panel</div>
        </div>
        <!-- فۆرم -->
        <div style="padding:22px 20px 20px;">
          <div style="margin-bottom:14px;">
            <label style="font-size:.82rem;font-weight:700;color:#4a5568;display:block;margin-bottom:6px;">👤 ناوی بەکارهێنەر</label>
            <input id="_adminUser" type="text" placeholder="Username" autocomplete="username"
              style="width:100%;padding:11px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:.95rem;font-family:inherit;box-sizing:border-box;outline:none;direction:ltr;"
              onfocus="this.style.borderColor='#D40511'" onblur="this.style.borderColor='#e2e8f0'"
              onkeydown="if(event.key==='Enter')document.getElementById('_adminPass').focus()">
          </div>
          <div style="margin-bottom:6px;">
            <label style="font-size:.82rem;font-weight:700;color:#4a5568;display:block;margin-bottom:6px;">🔑 وشەی تێپەڕ</label>
            <div style="position:relative;">
              <input id="_adminPass" type="password" placeholder="Password" autocomplete="current-password"
                style="width:100%;padding:11px 44px 11px 14px;border:2px solid #e2e8f0;border-radius:12px;font-size:.95rem;font-family:inherit;box-sizing:border-box;outline:none;direction:ltr;"
                onfocus="this.style.borderColor='#D40511'" onblur="this.style.borderColor='#e2e8f0'"
                onkeydown="if(event.key==='Enter')_doAdminLogin()">
              <button type="button" onclick="(function(b){var i=document.getElementById('_adminPass');if(i.type==='password'){i.type='text';b.innerHTML='🙈';}else{i.type='password';b.innerHTML='👁';}})(this)"
                style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1rem;padding:4px;line-height:1;">👁</button>
            </div>
          </div>
          <div id="_adminLoginErr" style="display:none;color:#D40511;font-size:.8rem;margin-bottom:10px;padding:7px 10px;background:#FFF8F8;border-radius:8px;border:1px solid #FFCDD2;"></div>
          <div style="display:flex;gap:8px;margin-top:16px;">
            <button onclick="document.getElementById('_adminLoginModal').remove()"
              style="flex:1;padding:12px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:12px;font-size:.95rem;font-weight:700;cursor:pointer;font-family:inherit;">داخستن</button>
            <button onclick="_doAdminLogin()"
              style="flex:2;padding:12px;background:linear-gradient(135deg,#D40511,#A50008);color:#fff;border:none;border-radius:12px;font-size:.95rem;font-weight:800;cursor:pointer;font-family:inherit;">
              <i class="fas fa-sign-in-alt"></i> داخلبوون
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
    setTimeout(function(){ var u=document.getElementById('_adminUser'); if(u) u.focus(); }, 80);
}

function _doAdminLogin() {
    var username = (document.getElementById('_adminUser')||{}).value || '';
    var password = (document.getElementById('_adminPass')||{}).value || '';
    var errEl = document.getElementById('_adminLoginErr');
    if (!username || !password) {
        if(errEl){ errEl.textContent='تکایە هەردوو خانەکان پڕبکەرەوە'; errEl.style.display='block'; }
        return;
    }
    _checkAdminPass(password).then(function(ok) {
      if (username === 'admin' && ok) {
        var m = document.getElementById('_adminLoginModal');
        if(m) m.remove();
        isAdmin = true;
        const adminPanel = document.getElementById('adminPanel');
        const productsSection = document.querySelector('.products-section');
        const sliderSection = document.querySelector('.slider-section');
        const categorySection = document.querySelector('.category-filter-section');

        if (adminPanel) adminPanel.style.display = 'block';
        if (productsSection) productsSection.style.display = 'none';
        if (sliderSection) sliderSection.style.display = 'none';
        if (categorySection) categorySection.style.display = 'none';

        showNotification('بەخێربێیت بەڕێوەبەر! 🔐');
        showAdminTab('products');
      } else {
        if(errEl){ errEl.textContent='هەڵە! ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە ❌'; errEl.style.display='block'; }
        var passEl = document.getElementById('_adminPass');
        if(passEl){ passEl.value=''; passEl.focus(); }
      }
    });
}

function logout() {
    isAdmin = false;
    const adminPanel = document.getElementById('adminPanel');
    const productsSection = document.querySelector('.products-section');
    const sliderSection = document.querySelector('.slider-section');
    const categorySection = document.querySelector('.category-filter-section');
    
    if (adminPanel) adminPanel.style.display = 'none';
    if (productsSection) productsSection.style.display = 'block';
    if (sliderSection) sliderSection.style.display = 'block';
    if (categorySection) categorySection.style.display = 'block';
    
    showNotification('بە سەرکەوتوویی دەرچوویت');
    showHomePage();
}

function showAdminTab(tab) {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    if (tab === 'products') {
        loadPendingProducts();
    } else if (tab === 'allProducts') {
        loadAllProducts();
    } else if (tab === 'requests') {
        loadRequests();
    } else if (tab === 'delivery') {
        loadDeliveryRequests();
    } else if (tab === 'intlPost') {
        loadIntlPost();
    } else if (tab === 'addSlider') {
        showAddSliderForm();
    } else if (tab === 'videos') {
        showVideoAdminForm();
    } else if (tab === 'addProduct') {
        showAdminAddProductForm();
    } else if (tab === 'drivers') {
        loadDriversAdmin();
    } else if (tab === 'balance') {
        loadBalanceAdmin();
    } else if (tab === 'reports') {
        loadReportsAdmin();
    } else if (tab === 'users') {
        loadUsersAdmin();
    }
}

// ==================== About Us Function ====================
function showAboutUs() {
    const aboutMessage = `🏢 *دەربارەی UK BAZAR*

UK BAZAR پلاتفۆرمێکی بازرگانی ئۆنلاینە کە بازاڕێکی ئاسان و متمانەپێکراو دابین دەکات بۆ کڕین و فرۆشتنی کاڵا لە نێوان کوردستان و شانشینی یەکگرتوو.

✨ *تایبەتمەندیەکان:*
• کڕین و فرۆشتنی ئاسان
• داواکاری کاڵا
• گەیاندنی کاڵا
• پارەدان لە ڕێگەی FIB
• پەیوەندی ڕاستەوخۆ لەگەڵ فرۆشیار

📞 *پەیوەندی:*
• کوردستان: 07755436275 | 07507472656
• UK: 00447449218670
• ئیمەیل: Info@ukbazar.online

🌐 وێبسایت: www.ukbazar.online

سوپاس بۆ متمانە پێدان! 🙏`;

    showNotification('دەربارەی UK BAZAR - تکایە سەیری واتساپ بکە', 'info');
    
    const whatsappUrl = `https://wa.me/9647700000000?text=${encodeURIComponent(aboutMessage)}`;
    window.open(whatsappUrl, '_blank');
}

// ==================== Load Products with Cache ====================
function loadApprovedProducts() {
    showLoading();
    
    // یەکسەر سلایدەر دەست پێ بکە بە وێنەی یەدەگ
    initializeSlider();
    
    const cachedProducts = localStorage.getItem('ukbazar_products');
    const cacheTime = localStorage.getItem('ukbazar_cache_time');
    
    if (cachedProducts && cacheTime) {
        const now = Date.now();
        const timeDiff = now - parseInt(cacheTime);
        
        if (timeDiff < 10 * 60 * 1000) {
            try {
                products = JSON.parse(cachedProducts).map(sanitizeProduct);
                
                renderProducts(products);
                createCategoryButtons();
                
                setTimeout(() => {
                    hideLoading();
                }, 300);
                
                // سلایدەر بار بکە
                loadRealSliderImages();
                // لە پشتەوە داتا نوێ بکەرەوە
                refreshProductsFromFirebase();
                return;
                
            } catch (e) {
                console.log('Cache error, loading from Firebase');
            }
        }
    }
    
    loadProductsFromFirebase();
}

function loadProductsFromFirebase() {
    database.ref('products').once('value')
        .then((productSnapshot) => {
            products = [];
            
            productSnapshot.forEach((child) => {
                const val = child.val();
                if (val.status === 'approved') {
                    products.push(sanitizeProduct({ ...val, firebaseId: child.key }));
                }
            });
            
            try {
                localStorage.setItem('ukbazar_products', JSON.stringify(products));
                localStorage.setItem('ukbazar_cache_time', Date.now().toString());
            } catch (e) {
                console.log('Cache save failed');
            }
            
            renderProducts(products);
            createCategoryButtons();
            
            setTimeout(() => {
                hideLoading();
            }, 500);
            
            if (products.length > 0) {
                showNotification(products.length + (window.t ? window.t('products_loaded') : ' کاڵا بارکرا!'));
            }
            
        }).catch((error) => {
            console.error("Error:", error);
            
            const cachedProducts = localStorage.getItem('ukbazar_products');
            if (cachedProducts) {
                try {
                    products = JSON.parse(cachedProducts);
                    renderProducts(products);
                    createCategoryButtons();
                    showNotification('پیشاندانی داتای کاشکراو', 'info');
                } catch (e) {}
            }
            
            setTimeout(() => {
                hideLoading();
            }, 500);
        });
}

function refreshProductsFromFirebase() {
    setTimeout(() => {
        database.ref('products').once('value').then((snapshot) => {
            const newProducts = [];
            snapshot.forEach((child) => {
                const val = child.val();
                if (val.status === 'approved') {
                    newProducts.push(sanitizeProduct({ ...val, firebaseId: child.key }));
                }
            });
            
            if (JSON.stringify(newProducts) !== JSON.stringify(products)) {
                products = newProducts;
                try {
                    localStorage.setItem('ukbazar_products', JSON.stringify(products));
                } catch (e) {}
                renderProducts(products);
                showNotification('کاڵا نوێ کرانەوە!');
            }
        }).catch(() => {});
        
        // سلایدەریش نوێ بکەرەوە
        loadRealSliderImages();
    }, 5000);
}

// ==================== Admin Functions with Error Handling ====================
function loadPendingProducts() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = '<p style="text-align: center;">چاوەڕوانی بکە...</p>';
    
    database.ref('products').orderByChild('status').equalTo('pending').once('value')
        .then((snapshot) => {
            let html = '<div class="pending-items">';
            
            if (!snapshot.exists()) {
                html = '<p style="text-align: center; color: var(--gray);">هیچ کاڵایەکی چاوەڕوانی پەسەندکردن نییە</p>';
                content.innerHTML = html;
                return;
            }
            
            snapshot.forEach((child) => {
                const product = child.val();
                const id = child.key;
                const firstImage = product.images && product.images[0] ? product.images[0] : '';
                
                html += `
                    <div class="pending-item">
                        ${firstImage ? '<img src="' + firstImage + '" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" onerror="this.style.display=\'none\'">' : ''}
                        <h4>📦 ${escapeHtml(product.name)}</h4>
                        <p><strong>جۆر:</strong> ${escapeHtml(product.category)}</p>
                        <p><strong>نرخ:</strong> ${escapeHtml(product.price)} ${escapeHtml(product.currency)}</p>
                        <p><strong>فرۆشیار:</strong> ${escapeHtml(product.sellerName)} - ${escapeHtml(product.sellerMobile)}</p>
                        <p><strong>شوێن:</strong> ${escapeHtml(product.location) || 'نادیار'}</p>
                        <p><strong>وردەکاری:</strong> ${escapeHtml(product.description) || 'بەبەتاڵ'}</p>
                        <div class="actions">
                            <button class="btn btn-secondary btn-small" onclick="approveProduct('${id}')">
                                <i class="fas fa-check"></i> پەسەندکردن
                            </button>
                            <button class="btn btn-danger btn-small" onclick="rejectProduct('${id}')">
                                <i class="fas fa-times"></i> ڕەتکردنەوە
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            content.innerHTML = html;
        })
        .catch((error) => {
            console.error("Error loading pending products:", error);
            content.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

function loadAllProducts() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = '<p style="text-align: center;">چاوەڕوانی بکە...</p>';
    
    database.ref('products').orderByChild('status').equalTo('approved').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                content.innerHTML = '<p style="text-align: center; color: var(--gray);">هیچ کاڵایەک نییە</p>';
                return;
            }
            
            const allProducts = [];
            snapshot.forEach((child) => {
                allProducts.push({
                    data: child.val(),
                    id: child.key
                });
            });
            
            allProducts.reverse();
            
            let html = '<div class="pending-items">';
            
            allProducts.forEach((item) => {
                const product = item.data;
                const id = item.id;
                const firstImage = product.images && product.images[0] ? product.images[0] : '';
                
                html += '<div class="pending-item">';
                if (firstImage) {
                    html += '<img src="' + firstImage + '" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" onerror="this.style.display=\'none\'">';
                }
                html += '<h4>📦 ' + escapeHtml(product.name) + '</h4>';
                html += '<p><strong>جۆر:</strong> ' + escapeHtml(product.category) + '</p>';
                html += '<p><strong>نرخ:</strong> ' + escapeHtml(product.price) + ' ' + escapeHtml(product.currency) + '</p>';
                html += '<p><strong>فرۆشیار:</strong> ' + escapeHtml(product.sellerName) + ' - ' + escapeHtml(product.sellerMobile) + '</p>';
                html += '<p><strong>شوێن:</strong> ' + escapeHtml(product.location || 'نادیار') + '</p>';
                html += '<p><strong>وردەکاری:</strong> ' + escapeHtml(product.description || 'بەبەتاڵ') + '</p>';
                html += '<div class="actions">';
                html += '<button class="btn btn-danger btn-small" onclick="deleteProduct(\'' + id + '\')"><i class="fas fa-trash"></i> سڕینەوە</button>';
                html += '</div></div>';
            });
            
            html += '</div>';
            content.innerHTML = html;
        })
        .catch((error) => {
            console.error("Error loading all products:", error);
            content.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

function loadRequests() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<p style="text-align: center;">چاوەڕوانی بکە...</p>';
    database.ref('requests').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                content.innerHTML = '<p style="text-align: center; color: var(--gray);">هیچ داواکارییەک نییە</p>';
                return;
            }
            const items = [];
            snapshot.forEach(child => items.push({ key: child.key, ...child.val() }));
            items.reverse();
            let html = '<div class="pending-items">';
            items.forEach(request => {
                const key = request.key;
                const isCartOrder = request.type === 'cart-order';
                const badgeBg = isCartOrder ? '#D40511' : '#f59e0b';
                const badgeText = isCartOrder ? '🛒 داواکاری کڕین' : '📋 داواکاری کاڵا';
                const waNum = (request.mobile || '').replace(/\D/g,'');
                html += `
                    <div class="pending-item" id="request-${key}" style="border-right:4px solid ${badgeBg};">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                            <h4 style="margin:0;color:#1C1C1C;">📦 ${escapeHtml(request.itemName || '—')}</h4>
                            <span style="background:${badgeBg};color:#fff;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:700;">${badgeText}</span>
                        </div>
                        <div style="background:#f8f9ff;border-radius:10px;padding:10px 12px;margin-bottom:8px;font-size:.88rem;display:grid;gap:5px;">
                            <div><strong>👤 ناو:</strong> ${escapeHtml(request.name || '—')}</div>
                            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                <strong>📞 مۆبایل:</strong> ${escapeHtml(request.mobile || '—')}
                                ${waNum ? `<a href="https://wa.me/${waNum}" target="_blank" style="background:#25d366;color:#fff;padding:2px 10px;border-radius:10px;font-size:.75rem;text-decoration:none;"><i class="fab fa-whatsapp"></i> پەیوەندی</a>` : ''}
                            </div>
                            ${request.address ? `<div><strong>📍 ناونیشان:</strong> ${escapeHtml(request.address)}</div>` : ''}
                            ${request.qty ? `<div><strong>🔢 دانە:</strong> ${escapeHtml(String(request.qty))} × ${escapeHtml(String(request.price||''))} ${escapeHtml(request.currency||'IQD')}</div>` : ''}
                            <div><strong>📝 وردەکاری:</strong> ${escapeHtml(request.details || '—')}</div>
                            <div style="color:#718096;font-size:.78rem;"><strong>⏰ بەروار:</strong> ${escapeHtml(request.timestamp || '—')}</div>
                        </div>
                        <div class="actions">
                            <button class="btn btn-danger btn-small" onclick="deleteRequest('${key}')">
                                <i class="fas fa-trash"></i> سڕینەوە
                            </button>
                        </div>
                    </div>`;
            });
            html += '</div>';
            content.innerHTML = html;
        })
        .catch((error) => {
            console.error("Error loading requests:", error);
            content.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

// ==================== Delivery Search ====================
let _allDeliveryItems = [];

function renderDeliveryItems(items) {
    const content = document.getElementById('adminContent');
    if (!content) return;

    const searchBox = document.getElementById('deliverySearchBox');
    const searchVal = searchBox ? searchBox.value : '';

    const kurdishItems = items.filter(d => d.type !== 'uk' && !(d.orderNumber||'').startsWith('UK-'));
    const ukItems      = items.filter(d => d.type === 'uk' || (d.orderNumber||'').startsWith('UK-'));

    const resultsDiv = document.getElementById('deliveryResultsWrap');
    if (!resultsDiv) return;

    let html = '';

    if (kurdishItems.length === 0 && ukItems.length === 0) {
        html = '<p style="text-align:center;color:var(--gray);padding:20px 0;">هیچ ئەنجامێک نەدۆزرایەوە</p>';
        resultsDiv.innerHTML = html;
        return;
    }

    if (kurdishItems.length > 0) {
        html += '<h3 style="margin:0 0 12px 0; color:#D40511; border-bottom:2px solid #D40511; padding-bottom:6px;"><i class="fas fa-shipping-fast"></i> داواکارییە کوردییەکان (' + kurdishItems.length + ')</h3>';
        html += '<div class="pending-items">';
        kurdishItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const qrText = encodeURIComponent(
                `پسولە: ${orderNum} | نێردەر: ${d.senderName||d.name||''} ${d.senderMobile||d.mobile||''} (${d.senderLocation||d.address||''}) | وەرگر: ${d.receiverName||''} ${d.receiverMobile||''} (${d.receiverLocation||''}) | کەلوپەل: ${d.packageName||d.details||''} x${d.packageQty||''} - ${d.packageKg||''}کگ`
            );
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${qrText}`;
            html += buildKurdishLabelHtml(d, key, orderNum, qrUrl);
        });
        html += '</div>';
    }

    if (ukItems.length > 0) {
        html += '<h3 style="margin:24px 0 12px 0; color:#E6B800; border-bottom:2px solid #FFCC00; padding-bottom:6px; direction:ltr; text-align:left;">UK Delivery Requests (' + ukItems.length + ')</h3>';
        html += '<div class="pending-items" style="direction:ltr;">';
        ukItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const fullAddress = [d.address1, d.address2, d.city, d.county, d.postcode, 'United Kingdom'].filter(Boolean).join(', ');
            const qrText = encodeURIComponent(`Order: ${orderNum} | To: ${d.fullName||''} | Tel: ${d.phone||''} | ${fullAddress} | Item: ${d.packageName||''}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${qrText}`;
            html += buildUkLabelHtml(d, key, orderNum, qrUrl);
        });
        html += '</div>';
    }

    resultsDiv.innerHTML = html;
}

function _matchesDeliverySearch(d, val) {
    if (!val) return true;

    const rawNum   = (d.orderNumber || '').toLowerCase().trim();
    // کۆدی پسولە: exact یان prefix — نه substring
    // مەسەلەن "08" تەنها # 08 دۆزێتەوە، نەک # 083 یان # 108
    const numClean  = rawNum.replace(/^0+/, '');   // 08 → 8
    const valClean  = val.replace(/^0+/, '');       // 08 → 8
    const orderMatch = rawNum === val                // exact
        || rawNum === valClean
        || numClean === valClean
        || rawNum.startsWith(val)                   // prefix
        || ('uk-' + valClean) === rawNum;           // uk-894133

    // ناو: substring باشە
    const sender   = (d.senderName   || d.name     || '').toLowerCase();
    const receiver = (d.receiverName || d.fullName || '').toLowerCase();
    const nameMatch = sender.includes(val) || receiver.includes(val);

    // مۆبایل: suffix match بۆ کۆدی وڵات
    const valDigits = val.replace(/\D/g, '');
    const mobMatch = (raw) => {
        if (!valDigits || valDigits.length < 4) return false;
        const mob = (raw || '').replace(/\D/g, '');
        if (!mob) return false;
        const suffix = valDigits.replace(/^0+/, '');
        return mob === valDigits || mob.endsWith(suffix) || mob.includes(valDigits);
    };
    const mobileMatch = mobMatch(d.senderMobile  || d.mobile)
        || mobMatch(d.senderMobile2)
        || mobMatch(d.receiverMobile || d.phone)
        || mobMatch(d.receiverMobile2);

    const pkg = (d.packageName || d.details || '').toLowerCase();
    const pkgMatch = pkg.includes(val);

    return orderMatch || nameMatch || mobileMatch || pkgMatch;
}

let _searchDebounce = null;

function liveDeliverySearch(raw) {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
        const val = raw.trim().toLowerCase();
        const countEl = document.getElementById('deliverySearchCount');

        // ئەگەر بەتاڵ بوو — هەموو پیشان بدە، highlight لادەبە
        if (!val) {
            renderDeliveryItems(_allDeliveryItems);
            if (countEl) countEl.textContent = '';
            _clearDeliveryHighlight();
            return;
        }

        const filtered = _allDeliveryItems.filter(d => _matchesDeliverySearch(d, val));

        if (countEl) {
            countEl.textContent = filtered.length > 0 ? filtered.length + ' ئەنجام' : 'نەدۆزرایەوە';
            countEl.style.color = filtered.length > 0 ? '#D40511' : '#FF4444';
        }

        // ئەگەر تەنها یەک ئەنجام — یەکسەر لەیبلەکە پیشان بدە و scroll بکە
        if (filtered.length === 1) {
            renderDeliveryItems(filtered);
            setTimeout(() => {
                const card = document.querySelector('.delivery-label-card');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    card.style.outline = '3px solid #D40511';
                    card.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.25)';
                }
            }, 80);
            return;
        }

        // ئەگەر چەند ئەنجام — هەموو پیشان بدە و highlight بکە
        renderDeliveryItems(filtered);
        setTimeout(() => _highlightDeliveryCards(), 80);

    }, 120); // 120ms debounce — خیرا و بەبێ lag
}

function _highlightDeliveryCards() {
    // کارتی یەکەم scroll دەکات بۆ سەرەوە
    const first = document.querySelector('.delivery-label-card');
    if (first) {
        first.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function _clearDeliveryHighlight() {
    document.querySelectorAll('.delivery-label-card').forEach(c => {
        c.style.outline = '';
        c.style.boxShadow = '';
    });
}

// کۆن — پاراستراوە بۆ پاراستنی هاوئاهەنگی
function filterDeliverySearch() {
    liveDeliverySearch(document.getElementById('deliverySearchBox')?.value || '');
}

function buildKurdishLabelHtml(d, key, orderNum, qrUrl) {
    return `
    <div class="pending-item delivery-label-card" id="label-${key}">
        <div class="label-header">
            <span class="label-order-num"># ${orderNum}</span>
            <span class="label-title-center"><i class="fas fa-shipping-fast"></i> لەیبلی گەیاندن</span>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                <button class="btn btn-sm btn-primary" onclick="printLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;">
                    <i class="fas fa-print"></i> چاپ
                </button>
                <button class="btn btn-sm" onclick="editDeliveryLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#e6fffa;color:#E6B800;border:1.5px solid #FFE082;border-radius:8px;cursor:pointer;" title="دەستکاریکردن">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm" onclick="shareDeliveryWhatsApp('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#FFFDE7;color:#25d366;border:1.5px solid #25d366;border-radius:8px;cursor:pointer;" title="شێرکردن بە واتسئاپ">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn btn-sm" onclick="deleteDelivery('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#fff0f0;color:#D40511;border:1.5px solid #FF8A80;border-radius:8px;cursor:pointer;" title="سڕینەوەی لەیبل">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="label-body-wrap">
            <div class="label-grid">
                <div class="label-section sender-section">
                    <div class="label-section-title">📤 نێردەر</div>
                    <div class="label-row"><span>ناو:</span><strong>${escapeHtml(d.senderName||d.name||'—')}</strong></div>
                    <div class="label-row"><span>ژمارە:</span><strong>${escapeHtml(d.senderMobile||d.mobile||'—')}</strong></div>
                    ${d.senderMobile2 ? `<div class="label-row"><span>ژمارە ٢:</span><strong>${escapeHtml(d.senderMobile2)}</strong></div>` : ''}
                    <div class="label-row"><span>شوێن:</span><strong>${escapeHtml(d.senderLocation||d.address||'—')}</strong></div>
                </div>
                <div class="label-section receiver-section">
                    <div class="label-section-title">📥 وەرگر</div>
                    <div class="label-row"><span>ناو:</span><strong>${escapeHtml(d.receiverName||'—')}</strong></div>
                    <div class="label-row"><span>ژمارە:</span><strong>${escapeHtml(d.receiverMobile||'—')}</strong></div>
                    ${d.receiverMobile2 ? `<div class="label-row"><span>ژمارە ٢:</span><strong>${escapeHtml(d.receiverMobile2)}</strong></div>` : ''}
                    <div class="label-row"><span>شوێن:</span><strong>${escapeHtml(d.receiverLocation||'—')}</strong></div>
                </div>
            </div>
            <div class="label-package">
                <div class="label-row"><span>📦 کەلوپەل:</span><strong>${escapeHtml(d.packageName||d.details||'—')}</strong></div>
                <div class="label-row"><span>🔢 پارچە:</span><strong>${escapeHtml(String(d.packageQty||'—'))}</strong></div>
                <div class="label-row"><span>⚖️ کیلۆ:</span><strong>${escapeHtml(String(d.packageKg||'—'))} کگ</strong></div>
                ${d.itemPrice ? `<div class="label-row"><span>💰 نرخی کاڵا:</span><strong>${escapeHtml(d.itemPrice)}</strong></div>` : ''}
                ${d.deliveryPricePerKg ? `<div class="label-row"><span>🚚 نرخی گەیاندن:</span><strong>${escapeHtml(d.deliveryPricePerKg)}</strong></div>` : ''}
                ${d.driverName||d.driverMobile ? `<div class="label-row label-driver-row"><span>🚗 شۆفیر:</span><strong>${escapeHtml(d.driverName||'—')} — ${escapeHtml(d.driverMobile||'')}</strong></div>` : ''}
                ${d.deliveryNote ? `<div class="label-row label-note-row"><span>📝 تیبینی:</span><strong>${escapeHtml(d.deliveryNote)}</strong></div>` : ''}
            </div>
            <div class="label-admin-edit">
                <div class="admin-edit-title"><i class="fas fa-pen"></i> شۆفیر و تیبینی</div>
                <!-- Status Changer -->
                <div style="margin-bottom:10px;background:#f0f4ff;border-radius:10px;padding:10px;">
                    <label style="font-size:.82rem;font-weight:700;color:#D40511;display:block;margin-bottom:6px;">📊 ستاتەسی کاڵا:</label>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <select id="status-select-${key}" onchange="updateDeliveryStatus('${key}', this.value, 'delivery')"
                            style="flex:1;padding:8px 10px;border:2px solid #D40511;border-radius:10px;font-family:inherit;font-size:.88rem;background:#fff;color:#1C1C1C;cursor:pointer;outline:none;">
                            <option value="registered"  ${(d.status||'registered')==='registered'  ? 'selected':''}>📋 تۆماركراو — Registered</option>
                            <option value="picked_up"   ${(d.status||'')==='picked_up'   ? 'selected':''}>🚗 وەرگیراو — Picked Up</option>
                            <option value="loading"     ${(d.status||'')==='loading'     ? 'selected':''}>🏭 بارکردنی کەلەک — Loading Warehouse</option>
                            <option value="in_transit"  ${(d.status||'')==='in_transit'  ? 'selected':''}>🚛 لە ڕێگادایە — In Transit</option>
                            <option value="sorting"     ${(d.status||'')==='sorting'     ? 'selected':''}>📦 کەلەکی دابەشکردن — Sorting Warehouse</option>
                            <option value="delivered"   ${(d.status||'')==='delivered'   ? 'selected':''}>✅ گەیشتووە — Delivered</option>
                        </select>
                    </div>
                </div>
                <div class="admin-edit-fields">
                    <div class="admin-edit-inputs">
                        <input type="text" id="driver-name-${key}" placeholder="👤 ناوی شۆفیر" value="${escapeHtml(d.driverName||'')}">
                        <input type="tel" id="driver-mobile-${key}" placeholder="📞 ژمارە" value="${escapeHtml(d.driverMobile||'')}">
                    </div>
                    <textarea id="delivery-note-${key}" placeholder="📝 تیبینی..." rows="3">${escapeHtml(d.deliveryNote||'')}</textarea>
                    <div class="admin-edit-inputs" style="margin-top:6px;">
                        <input type="text" id="item-price-${key}" placeholder="💰 نرخی کاڵا" value="${escapeHtml(d.itemPrice||'')}">
                        <input type="text" id="delivery-price-${key}" placeholder="🚚 نرخی گەیاندن" value="${escapeHtml(d.deliveryPricePerKg||'')}">
                    </div>
                </div>
                <button class="btn btn-sm btn-primary admin-save-btn" onclick="saveDriverInfo('${key}')">
                    <i class="fas fa-save"></i> پاشەکەوتکردن
                </button>
            </div>
            <div class="label-qr-wrap">
                <img src="${qrUrl}" alt="QR" class="label-qr-img" loading="eager">
                <div class="label-qr-hint">QR کۆد</div>
            </div>
        </div>
        <div class="label-footer">
            <span>📅 ${escapeHtml(d.timestamp||'')}</span>
        </div>
    </div>`;
}

function buildUkLabelHtml(d, key, orderNum, qrUrl) {
    return `
    <div class="pending-item delivery-label-card" id="label-${key}" style="direction:ltr; text-align:left; font-family:'Segoe UI',Arial,sans-serif;">
        <div class="label-header" style="direction:ltr;">
            <span class="label-order-num"># ${orderNum}</span>
            <span class="label-title-center" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:center;">
                <span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-size:13px;">UK Delivery</span>
                <span id="status-badge-${key}" style="padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${({'registered':'#D40511','picked_up':'#FFCC00','loading':'#E6B800','in_transit':'#D40511','sorting':'#D40511','delivered':'#FFCC00'})[d.status||'registered']||'#D40511'}">${({'registered':'📋 Registered','picked_up':'🚗 Picked Up','loading':'🏭 Loading','in_transit':'🚛 In Transit','sorting':'📦 Sorting','delivered':'✅ Delivered'})[d.status||'registered']||'📋 Registered'}</span>
            </span>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                <button class="btn btn-sm btn-primary" onclick="printUkLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-sm" onclick="editDeliveryLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#e6fffa;color:#E6B800;border:1.5px solid #FFE082;border-radius:8px;cursor:pointer;" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm" onclick="shareDeliveryWhatsApp('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#FFFDE7;color:#25d366;border:1.5px solid #25d366;border-radius:8px;cursor:pointer;" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn btn-sm" onclick="deleteDelivery('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#fff0f0;color:#D40511;border:1.5px solid #FF8A80;border-radius:8px;cursor:pointer;" title="Delete label">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="label-body-wrap" style="direction:ltr;">
            <div class="label-grid" style="direction:ltr;">
                <div class="label-section receiver-section" style="border-left:3px solid #FFCC00; border-right:none;">
                    <div class="label-section-title" style="color:#92400e;">📦 Recipient</div>
                    <div class="label-row" style="direction:ltr;"><span>Name:</span><strong>${escapeHtml(d.fullName||'—')}</strong></div>
                    <div class="label-row" style="direction:ltr;"><span>Phone:</span><strong>${escapeHtml(d.phone||'—')}</strong></div>
                    ${d.receiverName ? `<div class="label-row" style="direction:ltr; background:#FFFDE7;"><span>Receiver:</span><strong style="color:#E6B800;">📬 ${escapeHtml(d.receiverName)}</strong></div>` : ''}
                    ${d.receiverPhone ? `<div class="label-row" style="direction:ltr; background:#FFFDE7;"><span>Receiver Tel:</span><strong style="color:#E6B800;">📞 ${escapeHtml(d.receiverPhone)}</strong></div>` : ''}
                    ${d.company ? `<div class="label-row" style="direction:ltr;"><span>Company:</span><strong>${escapeHtml(d.company)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Address:</span><strong>${escapeHtml(d.address1||'—')}</strong></div>
                    ${d.address2 ? `<div class="label-row" style="direction:ltr;"><span>Address 2:</span><strong>${escapeHtml(d.address2)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>City:</span><strong>${escapeHtml(d.city||'—')}</strong></div>
                    ${d.county ? `<div class="label-row" style="direction:ltr;"><span>County:</span><strong>${escapeHtml(d.county)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Postcode:</span><strong>${escapeHtml(d.postcode||'—')}</strong></div>
                    <div class="label-row" style="direction:ltr;"><span>Country:</span><strong>United Kingdom</strong></div>
                    ${d.destinationCity ? `<div class="label-row" style="direction:ltr;background:#e0f2fe;border-radius:6px;"><span>🏙️ Destination:</span><strong style="color:#0c5da5;font-size:1rem;">${escapeHtml(d.destinationCity)}</strong></div>` : ''}
                </div>
                <div class="label-section sender-section" style="border-right:none; border-left:3px solid #D40511;">
                    <div class="label-section-title" style="color:#D40511;">📬 Package</div>
                    <div class="label-row" style="direction:ltr;"><span>Item:</span><strong>${escapeHtml(d.packageName||'—')}</strong></div>
                    ${d.packageQty ? `<div class="label-row" style="direction:ltr;"><span>Qty:</span><strong>${escapeHtml(String(d.packageQty))} pcs</strong></div>` : ''}
                    ${d.packageKg  ? `<div class="label-row" style="direction:ltr;"><span>Weight:</span><strong>${escapeHtml(String(d.packageKg))} kg</strong></div>` : ''}
                    ${d.payment    ? `<div class="label-row" style="direction:ltr;background:#FFFDE7;"><span>&#x1F4B3; Payment:</span><strong style="color:#E6B800;">${escapeHtml(d.payment)}</strong></div>` : ''}
                    ${d.deliveryNote ? `<div class="label-row" style="direction:ltr;"><span>Notes:</span><strong>${escapeHtml(d.deliveryNote)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Date:</span><strong>${escapeHtml(d.timestamp||'—')}</strong></div>
                </div>
            </div>
            <div class="label-admin-edit" style="direction:ltr; text-align:left;">
                <div class="admin-edit-title" style="text-align:left;"><i class="fas fa-pen"></i> Driver & Notes</div>
                <!-- Status Changer UK -->
                <div style="margin-bottom:10px;background:#fff8e7;border-radius:10px;padding:10px;border:1px solid #FFCC00;">
                    <label style="font-size:.82rem;font-weight:700;color:#E6B800;display:block;margin-bottom:6px;">📊 Package Status:</label>
                    <select id="status-select-${key}" onchange="updateDeliveryStatus('${key}', this.value, 'uk')"
                        style="width:100%;padding:8px 10px;border:2px solid #FFCC00;border-radius:10px;font-family:inherit;font-size:.88rem;background:#fff;color:#1C1C1C;cursor:pointer;outline:none;direction:ltr;">
                        <option value="registered"  ${(d.status||'registered')==='registered'  ? 'selected':''}>📋 Registered — تۆماركراو</option>
                        <option value="picked_up"   ${(d.status||'')==='picked_up'   ? 'selected':''}>🚗 Picked Up — وەرگیراو</option>
                        <option value="loading"     ${(d.status||'')==='loading'     ? 'selected':''}>🏭 Loading Warehouse — بارکردن</option>
                        <option value="in_transit"  ${(d.status||'')==='in_transit'  ? 'selected':''}>🚛 In Transit — لە ڕێگادایە</option>
                        <option value="sorting"     ${(d.status||'')==='sorting'     ? 'selected':''}>📦 Sorting Warehouse — دابەشکردن</option>
                        <option value="delivered"   ${(d.status||'')==='delivered'   ? 'selected':''}>✅ Delivered — گەیشتووە</option>
                    </select>
                </div>
                <div class="admin-edit-fields">
                    <div class="admin-edit-inputs">
                        <input type="text" id="driver-name-${key}" placeholder="👤 Driver name" value="${escapeHtml(d.driverName||'')}">
                        <input type="tel" id="driver-mobile-${key}" placeholder="📞 Phone" value="${escapeHtml(d.driverMobile||'')}">
                    </div>
                    <textarea id="delivery-note-${key}" placeholder="📝 Notes..." rows="3" style="direction:ltr;">${escapeHtml(d.deliveryNote||'')}</textarea>
                </div>
                <button class="btn btn-sm btn-primary admin-save-btn" onclick="saveDriverInfo('${key}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
            <div class="label-qr-wrap">
                <img src="${qrUrl}" alt="QR" class="label-qr-img" loading="eager">
                <div class="label-qr-hint">QR Code</div>
            </div>
        </div>
        <div class="label-footer" style="direction:ltr; text-align:left;">
            <span>📅 ${escapeHtml(d.timestamp||'')}</span>
        </div>
    </div>`;
}

function loadDeliveryRequests() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = '<p style="text-align: center;">چاوەڕوانی بکە...</p>';
    
    database.ref('delivery').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                content.innerHTML = '<p style="text-align: center; color: var(--gray);">هیچ داواکاری گەیاندنێک نییە</p>';
                return;
            }

            const items = [];
            snapshot.forEach((child) => {
                items.push({ key: child.key, ...child.val() });
            });
            items.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
            _allDeliveryItems = items;

               // Render search box + results container
            content.innerHTML = `
                <div style="position:sticky;top:56px;z-index:50;background:#f4f6ff;padding:10px 0 4px;margin-bottom:12px;">
                    <div style="display:flex;gap:10px;align-items:center;background:#fff;border-radius:14px;padding:10px 16px;border:2px solid #D40511;box-shadow:0 4px 16px rgba(102,126,234,0.13);">
                        <i class="fas fa-search" style="color:#D40511;font-size:1.1rem;flex-shrink:0;"></i>
                        <input
                            id="deliverySearchBox"
                            type="text"
                            placeholder="ناوی نێردەر، ژمارەی مۆبایل، کۆدی پسولە..."
                            oninput="liveDeliverySearch(this.value)"
                            style="flex:1;border:none;outline:none;font-size:1rem;font-family:inherit;color:#1C1C1C;direction:rtl;background:transparent;"
                            autocomplete="off"
                        >
                        <span id="deliverySearchCount" style="font-size:0.78rem;color:#D40511;font-weight:700;white-space:nowrap;min-width:40px;text-align:center;"></span>
                        <button onclick="document.getElementById('deliverySearchBox').value='';liveDeliverySearch('');"
                            style="background:none;border:none;cursor:pointer;color:#a0aec0;font-size:1.1rem;padding:0 2px;"
                            onmouseover="this.style.color='#FF4444'" onmouseout="this.style.color='#a0aec0'" title="پاككردنەوە">
                            <i class="fas fa-times-circle"></i>
                        </button>
                    </div>
                </div>
                <div id="deliveryResultsWrap"></div>
            `;

            renderDeliveryItems(items);
        })
        .catch((error) => {
            console.error("Error loading delivery requests:", error);
            content.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

// ==================== OLD delivery block replaced — keep only new functions above ====================


// ==================== Helper Function for Security ====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Update Delivery Status ====================

function updateIntlStatus(key, status) {
    database.ref('intlPost/' + key).update({ status: status, statusUpdated: new Date().toLocaleString() })
        .then(function() { showNotification('ستاتەس نوێ کرایەوە ✅'); })
        .catch(function() { showNotification('هەڵە لە نوێکردنەوەی ستاتەس!', 'error'); });
}

function saveIntlDriverInfo(key) {
    var driverName   = (document.getElementById('ip-driver-name-' + key) || {value:''}).value.trim();
    var driverMobile = (document.getElementById('ip-driver-mobile-' + key) || {value:''}).value.trim();
    database.ref('intlPost/' + key).update({ driverName: driverName, driverMobile: driverMobile })
        .then(function() {
            showNotification('زانیاری شۆفیر پاشەکەوت کرا ✅');
            loadIntlPost();
        })
        .catch(function() { showNotification('هەڵە لە پاشەکەوتکردن!', 'error'); });
}

function updateDeliveryStatus(key, status, dbPath) {
    // هەموو UK + KU delivery داتا لە delivery/ نۆددایە
    const ref = database.ref('delivery/' + key);
    ref.update({ status })
        .then(() => {
            showNotification('ستاتەس نوێ کرایەوە ✅');
            // نوێکردنەوەی بادگەی سەرووەکە بە جێجێ
            var STATUS_COLORS = {registered:'#D40511',picked_up:'#FFCC00',loading:'#E6B800',in_transit:'#D40511',sorting:'#D40511',delivered:'#FFCC00'};
            var STATUS_LABELS = {registered:'📋 Registered',picked_up:'🚗 Picked Up',loading:'🏭 Loading',in_transit:'🚛 In Transit',sorting:'📦 Sorting',delivered:'✅ Delivered'};
            var badge = document.getElementById('status-badge-' + key);
            if (badge) {
                badge.style.background = STATUS_COLORS[status] || '#D40511';
                badge.textContent = STATUS_LABELS[status] || status;
            }
        })
        .catch(() => showNotification('هەڵە لە نوێکردنەوەی ستاتەس!', 'error'));
}

// ==================== Save Driver Info ====================
function saveDriverInfo(key) {
    const driverName   = (document.getElementById('driver-name-' + key) || {value:''}).value.trim();
    const driverMobile = (document.getElementById('driver-mobile-' + key) || {value:''}).value.trim();
    const deliveryNote = (document.getElementById('delivery-note-' + key) || {value:''}).value.trim();
    const itemPrice    = (document.getElementById('item-price-' + key) || {value:''}).value.trim();
    const deliveryPricePerKg = (document.getElementById('delivery-price-' + key) || {value:''}).value.trim();

    database.ref('delivery/' + key).update({ driverName, driverMobile, deliveryNote, itemPrice, deliveryPricePerKg })
        .then(() => {
            showNotification('زانیاری شۆفیر پاشەکەوت کرا ✅');
            loadDeliveryRequests();
        })
        .catch(() => showNotification('هەڵە لە پاشەکەوتکردن!', 'error'));
}

// ==================== Print Delivery Label ====================
function printLabel(key) {
    const card = document.getElementById('label-' + key);
    if (!card) return;

    const orderNum  = card.querySelector('.label-order-num') ? card.querySelector('.label-order-num').textContent.trim() : '';
    const qrImg     = card.querySelector('.label-qr-img');
    const qrSrc     = qrImg ? qrImg.src : '';
    const dateText  = card.querySelector('.label-footer span') ? card.querySelector('.label-footer span').textContent : '';
    const drRow     = card.querySelector('.label-driver-row');
    const nrRow     = card.querySelector('.label-note-row');

    const getRows = (selector) => Array.from(card.querySelectorAll(selector)).map(r => {
        const sp = r.querySelector('span'); const st = r.querySelector('strong');
        if (!sp || !st) return '';
        const v = st.textContent.trim();
        if (!v || v === '—') return '';
        return '<tr><td style="padding:3px 7px;border:1.5px solid #aaa;width:38%;font-size:.82rem;font-weight:800;color:#333;">' + sp.textContent + '</td>'
             + '<td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:700;color:#111;">' + v + '</td></tr>';
    }).join('');

    const boxHtml = (title, rowsHtml, showQr) =>
        '<div class="no-break" style="border:2px solid #A50008;border-radius:6px;margin-bottom:10px;overflow:hidden;">'
      + '<div style="background:#A50008;color:#fff;padding:5px 10px;font-size:.85rem;font-weight:900;display:flex;justify-content:space-between;align-items:center;">'
      + '<span>' + title + '</span></div>'
      + '<table style="width:100%;border-collapse:collapse;">' + rowsHtml + '</table>'
      + (showQr && qrSrc ? '<div style="display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 14px;background:#FFFDE7;border-top:1px solid #e2e8f0;">'
         + '<img id="nauxo-qr-img" src="' + qrSrc + '" style="width:80px;height:80px;display:block;border-radius:6px;" alt="QR">'
         + '<div style="text-align:center;"><div style="font-size:.75rem;font-weight:900;color:#A50008;letter-spacing:.5px;">QR CODE</div>'
         + '<div style="font-size:.68rem;color:#718096;margin-top:3px;">' + orderNum + '</div></div></div>' : '')
      + '<div style="background:#A50008;color:#fff;padding:5px 10px;font-size:.72rem;display:flex;justify-content:space-between;align-items:center;">'
      + '<span>KING STREET - UK POST &nbsp;&nbsp; 07755436275 / 07507472656</span>'
      + '<img src="https://flagcdn.com/h20/gb.png" style="height:14px;" alt="GB"></div></div>';

    const senderRows   = getRows('.sender-section .label-row');
    const receiverRows = getRows('.receiver-section .label-row');
    const pkgRows      = getRows('.label-package .label-row:not(.label-driver-row):not(.label-note-row)');
    const driverVal    = drRow ? drRow.querySelector('strong').textContent.trim() : '';
    const noteVal      = nrRow ? nrRow.querySelector('strong').textContent.trim() : '';
    const extraRows    = (driverVal ? '<tr><td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:800;color:#333;">🚗 شۆفیر</td><td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:700;color:#111;">' + driverVal + '</td></tr>' : '')
                       + (noteVal  ? '<tr><td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:800;color:#333;">📝 تیبینی</td><td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:700;color:#111;">' + noteVal  + '</td></tr>' : '');

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
        + '<style>'
        + '@page{size:A5;margin:5mm;}'
        + '*{box-sizing:border-box;}'
        + 'body{font-family:Arial,sans-serif;margin:0;padding:4px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        + 'img{display:inline-block;}'
        + '.no-break{page-break-inside:avoid;break-inside:avoid;}'
        + '@media print{#dl-btn{display:none !important;}}'
        + '</style>'
        + '</head><body>'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:2px solid #A50008;padding-bottom:5px;">'
        + '<span style="font-size:1.1rem;font-weight:900;color:#A50008;">' + orderNum + '</span>'
        + '<div style="text-align:right;">'
        + '<div style="font-size:.95rem;font-weight:900;color:#A50008;white-space:nowrap;">UK POST - KING STREET</div>'
        + '<div style="font-size:.7rem;color:#718096;">' + dateText + '</div>'
        + '</div></div>'
        + boxHtml('SENDER &nbsp;—&nbsp; نێردەر', senderRows, false)
        + boxHtml('recipient &nbsp;--&nbsp; وەرگر', receiverRows + pkgRows + extraRows, true)
        + '</body></html>';

    // موبایل APK: Firebase Function بانگ بکە → PDF URL → داونلۆد
    var isMobileApk = /Android/i.test(navigator.userAgent);
    if (isMobileApk) {
        _serverPdf(html, 'label-' + orderNum.replace(/[^a-zA-Z0-9-]/g,''));
    } else {
        _smartPrint(html, 'label-' + orderNum.replace(/[^a-zA-Z0-9-]/g,''));
    }
}

// ============================================================
// _serverPdf — HTML بنێرە بۆ Firebase Function → PDF داونلۆد بکە
// ============================================================
function _serverPdf(html, fileName) {
    // پیشاندانی ئاگادارکردنەوەی بارکردن
    var prog = document.createElement('div');
    prog.id = '_ukPdfProg';
    prog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
        + 'background:rgba(26,54,93,.96);color:#fff;padding:22px 32px;border-radius:16px;'
        + 'font-size:1rem;font-weight:800;z-index:2147483647;text-align:center;'
        + 'font-family:Tahoma,Arial,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4);min-width:200px;';
    prog.innerHTML = '⏳ PDF ئامادە دەکرێت...';
    document.body.appendChild(prog);

    // URL ی Firebase Function — پرۆژەکەت
    var FUNC_URL = 'https://us-central1-ukbazar-15eda.cloudfunctions.net/generateLabelPDF';

    fetch(FUNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: html, fileName: fileName })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        var p = document.getElementById('_ukPdfProg');
        if (p) p.remove();

        if (!data.url) throw new Error(data.error || 'هەڵە');

        // PDF URL بە <a> داونلۆد بکە
        var a = document.createElement('a');
        a.href = data.url;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { a.remove(); }, 3000);

        showNotification('✅ PDF ئامادەیە — دابگرە!');
    })
    .catch(function(err) {
        var p = document.getElementById('_ukPdfProg');
        if (p) p.remove();
        console.error('_serverPdf error:', err);
        showNotification('هەڵە: ' + err.message, 'error');
        // fallback بۆ overlay
        _printFallbackIframe(html, fileName);
    });
}



function _printLabelFallback(key) {
    // fallback بۆ ئەگەر #printArea نەبوو
    const card = document.getElementById('label-' + key);
    if (!card) return;
    const pw = window.open('', '_blank', 'width=640,height=560');
    if (!pw) return;
    pw.document.write('<html><head><meta charset="UTF-8"></head><body>' + card.outerHTML + '</body></html>');
    pw.document.close();
    setTimeout(() => pw.print(), 800);
}


// ==================== Print UK Delivery Label ====================
function printUkLabel(key) {
    const card = document.getElementById('label-' + key);
    if (!card) return;

    const getVal = (label) => {
        const rows = card.querySelectorAll('.label-row');
        for (const r of rows) {
            const sp = r.querySelector('span');
            const st = r.querySelector('strong');
            if (sp && st && sp.textContent.trim().toLowerCase().startsWith(label.toLowerCase())) {
                return st.textContent.trim();
            }
        }
        return '—';
    };

    const orderNum   = (card.querySelector('.label-order-num') || {}).textContent || '';
    const name       = getVal('Name:');
    const phone      = getVal('Phone:');
    const receiverName  = getVal('Receiver:').replace(/^📬\s*/, '');
    const receiverPhone = getVal('Receiver Tel:').replace(/^📞\s*/, '');
    const company    = getVal('Company:');
    const address1   = getVal('Address:');
    const address2   = getVal('Address 2:');
    const city       = getVal('City:');
    const county     = getVal('County:');
    const postcode   = getVal('Postcode:');
    const destinationCity = getVal('🏙️ Destination:');
    const item       = getVal('Item:');
    const qty        = getVal('Qty:').replace(' pcs','');
    const kg         = getVal('Weight:').replace(' kg','');
    const payment    = getVal('💳 Payment:');
    const notes      = getVal('Notes:');
    const dateText   = (card.querySelector('.label-footer span') || {}).textContent || '';
    const qrImg      = card.querySelector('.label-qr-img');
    const qrSrc      = qrImg ? qrImg.src : '';

    const html = `
    <div style="font-family:'Segoe UI','Arial',sans-serif;direction:ltr;padding:12px;background:#fff;color:#1C1C1C;">
    <style>
    .pru-wrap{border:3px solid #E6B800;border-radius:12px;padding:14px;max-width:100%;}
    .pru-top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #FFCC00;padding-bottom:8px;margin-bottom:12px;}
    .pru-brand{font-size:16px;font-weight:bold;color:#E6B800;}
    .pru-sub{font-size:11px;color:#92400e;background:#fef3c7;padding:2px 7px;border-radius:10px;display:inline-block;margin-top:2px;}
    .pru-num{font-size:22px;font-weight:bold;color:#1C1C1C;background:#fef3c7;padding:4px 14px;border-radius:8px;border:2px solid #FFCC00;}
    .pru-body{display:flex;gap:10px;align-items:flex-start;}
    .pru-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;}
    .pru-sec{border:1.5px solid #e2e8f0;border-radius:8px;padding:9px;background:#FFFDE7;}
    .pru-sec.rec{border-left:4px solid #FFCC00;}
    .pru-sec.pkg{border-left:4px solid #D40511;}
    .pru-sec-title{font-size:11px;font-weight:700;color:#92400e;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;}
    .pru-sec.pkg .pru-sec-title{color:#D40511;}
    .pru-row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;gap:6px;word-break:break-word;}
    .pru-row:last-child{border-bottom:none;}
    .pru-row span{color:#718096;white-space:nowrap;min-width:60px;flex-shrink:0;}
    .pru-row strong{color:#1C1C1C;text-align:right;}
    .pru-postcode{background:#1a1a2e;color:#FFCC00;font-size:24px;font-weight:900;text-align:center;padding:8px;border-radius:8px;letter-spacing:4px;margin-top:5px;}
    .pru-qr{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;background:#FFFDE7;flex-shrink:0;}
    .pru-qr img{width:110px;height:110px;display:block;}
    .pru-qr small{font-size:10px;color:#718096;text-align:center;}
    .pru-foot{text-align:center;font-size:10px;color:#a0aec0;margin-top:10px;border-top:1px dashed #e2e8f0;padding-top:6px;}
    </style>
    <div style="position:fixed;top:10px;right:10px;z-index:9999;">
      <button onclick="try{window.close();}catch(e){} history.length>1?history.back():(window.location.href='about:blank');" style="background:linear-gradient(135deg,#FF4444,#D40511);border:none;color:#fff;border-radius:50px;padding:11px 26px;font-size:1rem;font-weight:900;cursor:pointer;touch-action:manipulation;box-shadow:0 3px 12px rgba(229,62,62,.5);white-space:nowrap;">✕ داخستن</button>
    </div>
    <div class="pru-wrap">
      <div class="pru-top">
        <div>
          <div class="pru-brand">🚚 UK POST / KING STREET</div>
          <div class="pru-sub">UK Delivery Label</div>
        </div>
        <div class="pru-num">${orderNum.replace('#','').trim()}</div>
      </div>
      <div class="pru-body">
        <div class="pru-main">
          <div class="pru-sec rec">
            <div class="pru-sec-title">📦 Recipient</div>
            <div class="pru-row"><span>Full Name</span><strong>${name}</strong></div>
            <div class="pru-row"><span>Phone</span><strong>${phone}</strong></div>
            ${receiverName && receiverName !== '—' ? `<div class="pru-row" style="background:#FFFDE7;"><span style="color:#E6B800;">📬 Receiver</span><strong style="color:#E6B800;">${receiverName}</strong></div>` : ''}
            ${receiverPhone && receiverPhone !== '—' ? `<div class="pru-row" style="background:#FFFDE7;"><span style="color:#E6B800;">📞 Rcvr Tel</span><strong style="color:#E6B800;">${receiverPhone}</strong></div>` : ''}
            ${company && company !== '—' ? `<div class="pru-row"><span>Company</span><strong>${company}</strong></div>` : ''}
            <div class="pru-row"><span>Address 1</span><strong>${address1}</strong></div>
            ${address2 && address2 !== '—' ? `<div class="pru-row"><span>Address 2</span><strong>${address2}</strong></div>` : ''}
            <div class="pru-row"><span>City</span><strong>${city}</strong></div>
            ${county && county !== '—' ? `<div class="pru-row"><span>County</span><strong>${county}</strong></div>` : ''}
            <div class="pru-row"><span>Country</span><strong>United Kingdom</strong></div>
            ${destinationCity && destinationCity !== '—' ? `<div class="pru-row" style="background:#e0f2fe;border-radius:6px;"><span style="color:#0c5da5;font-weight:700;">🏙️ Destination</span><strong style="color:#0c5da5;font-size:14px;font-weight:900;">${destinationCity}</strong></div>` : ''}
            <div class="pru-postcode">${postcode}</div>
          </div>
          <div class="pru-sec pkg">
            <div class="pru-sec-title">📬 Package Info</div>
            <div class="pru-row"><span>Item</span><strong>${item}</strong></div>
            ${qty && qty !== '—' ? `<div class="pru-row"><span>Qty</span><strong>${qty} pcs</strong></div>` : ''}
            ${kg  && kg  !== '—' ? `<div class="pru-row"><span>Weight</span><strong>${kg} kg</strong></div>` : ''}
            ${payment && payment !== '—' ? `<div class="pru-row" style="background:#FFFDE7;"><span style="color:#E6B800;">Payment</span><strong style="color:#E6B800;">${payment}</strong></div>` : ''}
            ${notes && notes !== '—' ? `<div class="pru-row"><span>Notes</span><strong>${notes}</strong></div>` : ''}
            <div class="pru-row"><span>Date</span><strong>${dateText.replace('📅','').trim()}</strong></div>
          </div>
        </div>
        <div class="pru-qr">
          <img src="${qrSrc}" alt="QR Code">
          <small>Scan for info</small>
        </div>
      </div>
      <div class="pru-foot">UK POST — World Online Shopping | www.ukpost.online</div>
    </div>

    <!-- ───── Kurdish / Local Delivery Section ───── -->
    <div style="margin-top:14px;border:3px solid #1C1C1C;border-radius:12px;padding:14px;font-family:'Tahoma','Arial',sans-serif;direction:rtl;background:#fff;color:#1C1C1C;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #D40511;padding-bottom:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:15px;font-weight:bold;color:#D40511;">🚚 لەیبلی گەیاندن / KING STREET</div>
          <div style="font-size:10px;color:#E6B800;font-weight:700;margin-top:2px;">UK POST / KING STREET</div>
          <div style="font-size:10px;color:#718096;margin-top:2px;">${dateText.replace('📅','').trim()}</div>
        </div>
        <div style="font-size:20px;font-weight:bold;color:#1C1C1C;background:#eef2ff;padding:3px 12px;border-radius:8px;border:2px solid #D40511;">${orderNum.replace('#','').trim()}</div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:7px;margin-bottom:8px;">
            <!-- Sender col -->
            <div style="flex:1;border:1.5px solid #e2e8f0;border-right:3px solid #D40511;border-radius:8px;padding:8px;background:#FFFDE7;min-width:0;">
              <div style="font-size:11px;font-weight:bold;color:#D40511;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;">📤 نێردەر / SENDER</div>
              <div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">ناو:</span><strong>${name}</strong></div>
              <div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">تەلەفۆن:</span><strong>${phone}</strong></div>
              <div style="font-size:11px;padding:2px 0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">کاڵا:</span><strong>${item}</strong></div>
            </div>
            <!-- Receiver col -->
            <div style="flex:1;border:1.5px solid #e2e8f0;border-right:3px solid #FFD54F;border-radius:8px;padding:8px;background:#FFFDE7;min-width:0;">
              <div style="font-size:11px;font-weight:bold;color:#FFD54F;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:5px;">📥 وەرگر / RECIPIENT</div>
              ${receiverName && receiverName !== '—' ? `<div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">ناو:</span><strong>${receiverName}</strong></div>` : `<div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">ناو:</span><strong>${name}</strong></div>`}
              ${receiverPhone && receiverPhone !== '—' ? `<div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">تەلەفۆن:</span><strong>${receiverPhone}</strong></div>` : `<div style="font-size:11px;padding:2px 0;border-bottom:1px dotted #e2e8f0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">تەلەفۆن:</span><strong>${phone}</strong></div>`}
              ${destinationCity && destinationCity !== '—' ? `<div style="font-size:11px;padding:2px 0;display:flex;justify-content:space-between;gap:4px;"><span style="color:#718096;white-space:nowrap;">شار:</span><strong style="color:#0c5da5;font-weight:900;">${destinationCity}</strong></div>` : ''}
            </div>
          </div>
          <!-- Package info Kurdish -->
          <div style="background:#edf2ff;border-radius:8px;padding:8px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted #c7d2fe;gap:4px;"><span style="color:#718096;">📦 کاڵا:</span><strong>${item}</strong></div>
            ${qty && qty !== '—' ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted #c7d2fe;gap:4px;"><span style="color:#718096;">🔢 ژمارە:</span><strong>${qty} دانە</strong></div>` : ''}
            ${kg && kg !== '—' ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px dotted #c7d2fe;gap:4px;"><span style="color:#718096;">⚖️ کێش:</span><strong>${kg} کگ</strong></div>` : ''}
            ${payment && payment !== '—' ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;gap:4px;background:#FFFDE7;border-radius:4px;padding:3px 5px;"><span style="color:#E6B800;">💳 پارەدان:</span><strong style="color:#E6B800;">${payment}</strong></div>` : ''}
          </div>
        </div>
        <!-- QR code repeated -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;background:#FFFDE7;flex-shrink:0;">
          <img src="${qrSrc}" alt="QR" style="width:90px;height:90px;display:block;">
          <small style="font-size:10px;color:#718096;">QR کۆد</small>
        </div>
      </div>
      <div style="text-align:center;font-size:10px;color:#a0aec0;margin-top:8px;border-top:1px dashed #e2e8f0;padding-top:6px;">KING STREET — UK POST &nbsp;|&nbsp; 07755436275 / 07507472656</div>
    </div>

    </div>`;

    const printArea = document.getElementById('printArea');
    if (!printArea) { _printUkFallback(html); return; }

    printArea.innerHTML = html;
    printArea.style.display = 'block';

    const doPrint = () => {
        // iframe بەکاربهێنە تا مۆدالەکان نەشارێتەوە
        let iframe = document.getElementById('_printIframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = '_printIframe';
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
            document.body.appendChild(iframe);
        }
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:"Segoe UI",Arial,sans-serif;margin:0;padding:10px;background:#fff;}img{max-width:100%;}</style></head><body>' + html + '</body></html>');
        doc.close();
        const iframeQr = doc.querySelector('.pru-qr img');
        const execPrint = () => {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    printArea.style.display = 'none';
                    printArea.innerHTML = '';
                }, 1000);
            }, 300);
        };
        if (iframeQr && !iframeQr.complete) {
            let done = false;
            iframeQr.onload = () => { if (!done) { done = true; execPrint(); } };
            iframeQr.onerror = () => { if (!done) { done = true; execPrint(); } };
            setTimeout(() => { if (!done) { done = true; execPrint(); } }, 2500);
        } else {
            execPrint();
        }
    };

    const qrEl = printArea.querySelector('.pru-qr img');
    if (qrEl && !qrEl.complete) {
        let fired = false;
        const fire = () => { if (!fired) { fired = true; doPrint(); } };
        qrEl.onload = fire;
        qrEl.onerror = fire;
        setTimeout(fire, 2500);
    } else {
        doPrint();
    }
}

function _printUkFallback(html) {
    const pw = window.open('', '_blank', 'width=680,height=620');
    if (!pw) return;
    pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>' + html + '</body></html>');
    pw.document.close();
    setTimeout(() => pw.print(), 800);
}

// ==================== Admin Actions ====================
function approveProduct(productId) {
    if (confirm('دڵنیایت لە پەسەندکردنی ئەم کاڵایە؟')) {
        database.ref(`products/${productId}`).update({ status: 'approved' })
            .then(() => {
                showNotification('کاڵا بە سەرکەوتوویی پەسەند کرا! ✅');
                loadPendingProducts();
                loadApprovedProducts();
            });
    }
}

function rejectProduct(productId) {
    if (confirm('دڵنیایت لە ڕەتکردنەوەی ئەم کاڵایە؟')) {
        database.ref(`products/${productId}`).remove()
            .then(() => {
                showNotification('کاڵا ڕەتکرایەوە', 'error');
                loadPendingProducts();
            });
    }
}

function deleteProduct(productId) {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کاڵایە؟')) {
        database.ref('products/' + productId).remove()
            .then(() => {
                showNotification('کاڵا بە سەرکەوتوویی سڕایەوە! 🗑️');
                loadAllProducts();
                loadApprovedProducts();
            })
            .catch(() => {
                showNotification('هەڵە لە سڕینەوە!', 'error');
            });
    }
}

function deleteSliderImage(sliderId) {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم وێنەیە؟')) {
        database.ref('slider/' + sliderId).remove()
            .then(() => {
                showNotification('وێنە بە سەرکەوتوویی سڕایەوە! 🗑️');
                loadSliderManagement();
                loadRealSliderImages();
            })
            .catch(() => {
                showNotification('هەڵە لە سڕینەوە!', 'error');
            });
    }
}

// ==================== Delete Request ====================
function deleteRequest(key) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم داواکارییە؟')) return;
    database.ref('requests/' + key).remove()
        .then(() => {
            showNotification('داواکاری بە سەرکەوتوویی سڕایەوە 🗑️');
            const item = document.getElementById('request-' + key);
            if (item) {
                item.style.transition = 'opacity 0.3s, transform 0.3s';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.95)';
                setTimeout(() => item.remove(), 300);
            }
        })
        .catch(() => showNotification('هەڵە لە سڕینەوە!', 'error'));
}

// ==================== Edit Delivery Label ====================
function editDeliveryLabel(key) {
    const item = _allDeliveryItems.find(i => i.key === key);
    if (!item) { showNotification('زانیاری نەدۆزرایەوە!', 'error'); return; }
    const d = item;
    const isUk = !!d.fullName; // UK labels have fullName field

    // Remove existing modal if any
    const existingModal = document.getElementById('editDeliveryModal');
    if (existingModal) existingModal.remove();

    let formFields = '';
    if (isUk) {
        formFields = `
            <div class="form-group"><label style="font-weight:700;">Full Name *</label><input type="text" id="edit-fullName" value="${escapeHtml(d.fullName||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Phone *</label><input type="tel" id="edit-phone" value="${escapeHtml(d.phone||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Receiver Name</label><input type="text" id="edit-receiverName" value="${escapeHtml(d.receiverName||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Receiver Phone</label><input type="tel" id="edit-receiverPhone" value="${escapeHtml(d.receiverPhone||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Address 1 *</label><input type="text" id="edit-address1" value="${escapeHtml(d.address1||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Address 2</label><input type="text" id="edit-address2" value="${escapeHtml(d.address2||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">City *</label><input type="text" id="edit-city" value="${escapeHtml(d.city||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">County</label><input type="text" id="edit-county" value="${escapeHtml(d.county||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Postcode *</label><input type="text" id="edit-postcode" value="${escapeHtml(d.postcode||'')}" style="direction:ltr;text-transform:uppercase;"></div>
            <div class="form-group"><label style="font-weight:700;">Package / Item *</label><input type="text" id="edit-packageName" value="${escapeHtml(d.packageName||'')}" style="direction:ltr;"></div>
            <div style="display:flex;gap:10px;">
                <div class="form-group" style="flex:1;"><label style="font-weight:700;">Qty</label><input type="number" id="edit-packageQty" value="${escapeHtml(String(d.packageQty||''))}" style="direction:ltr;"></div>
                <div class="form-group" style="flex:1;"><label style="font-weight:700;">Weight (kg)</label><input type="number" id="edit-packageKg" value="${escapeHtml(String(d.packageKg||''))}" step="0.1" style="direction:ltr;"></div>
            </div>
            <div class="form-group"><label style="font-weight:700;">Payment</label><input type="text" id="edit-payment" value="${escapeHtml(d.payment||'')}" style="direction:ltr;"></div>
            <div class="form-group"><label style="font-weight:700;">Notes</label><textarea id="edit-deliveryNote" rows="3" style="direction:ltr;">${escapeHtml(d.deliveryNote||'')}</textarea></div>
        `;
    } else {
        formFields = `
            <div class="form-group"><label>ناوی نێردەر *</label><input type="text" id="edit-senderName" value="${escapeHtml(d.senderName||d.name||'')}"></div>
            <div class="form-group"><label>ژمارەی نێردەر *</label><input type="tel" id="edit-senderMobile" value="${escapeHtml(d.senderMobile||d.mobile||'')}"></div>
            <div class="form-group"><label>ژمارەی نێردەر ٢</label><input type="tel" id="edit-senderMobile2" value="${escapeHtml(d.senderMobile2||'')}"></div>
            <div class="form-group"><label>شوێنی نێردەر *</label><input type="text" id="edit-senderLocation" value="${escapeHtml(d.senderLocation||d.address||'')}"></div>
            <div class="form-group"><label>ناوی وەرگر *</label><input type="text" id="edit-receiverName" value="${escapeHtml(d.receiverName||'')}"></div>
            <div class="form-group"><label>ژمارەی وەرگر *</label><input type="tel" id="edit-receiverMobile" value="${escapeHtml(d.receiverMobile||'')}"></div>
            <div class="form-group"><label>ژمارەی وەرگر ٢</label><input type="tel" id="edit-receiverMobile2" value="${escapeHtml(d.receiverMobile2||'')}"></div>
            <div class="form-group"><label>شوێنی وەرگر *</label><input type="text" id="edit-receiverLocation" value="${escapeHtml(d.receiverLocation||'')}"></div>
            <div class="form-group"><label>ناوی کەلوپەل *</label><input type="text" id="edit-packageName" value="${escapeHtml(d.packageName||d.details||'')}"></div>
            <div style="display:flex;gap:10px;">
                <div class="form-group" style="flex:1;"><label>ژمارەی پارچە</label><input type="number" id="edit-packageQty" value="${escapeHtml(String(d.packageQty||''))}" min="1"></div>
                <div class="form-group" style="flex:1;"><label>کیلۆ</label><input type="number" id="edit-packageKg" value="${escapeHtml(String(d.packageKg||''))}" step="0.1" min="0"></div>
            </div>
            <div class="form-group"><label>تیبینی</label><textarea id="edit-deliveryNote" rows="3">${escapeHtml(d.deliveryNote||'')}</textarea></div>
        `;
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'editDeliveryModal';
    modal.style.zIndex = '99999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;${isUk?'direction:ltr;text-align:left;font-family:Segoe UI,Arial,sans-serif;':''}">
            <div class="modal-header" style="${isUk?'direction:ltr;':''}">
                <button class="close-modal" onclick="document.getElementById('editDeliveryModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h2><i class="fas fa-edit"></i> ${isUk ? 'Edit Label' : 'دەستکاریکردنی لەیبل'}</h2>
            </div>
            <div style="padding:16px;max-height:70vh;overflow-y:auto;">
                ${formFields}
            </div>
            <div class="form-actions" style="padding:0 16px 16px;gap:10px;">
                <button class="btn btn-primary" onclick="saveEditedDelivery('${key}', ${isUk})" style="flex:1;">
                    <i class="fas fa-save"></i> ${isUk ? 'Save Changes' : 'پاشەکەوتکردن'}
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('editDeliveryModal').remove()" style="flex:1;">
                    ${isUk ? 'Cancel' : 'داخستن'}
                </button>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

function saveEditedDelivery(key, isUk) {
    const g = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    let updates = {};
    if (isUk) {
        if (!g('edit-fullName') || !g('edit-address1') || !g('edit-city')) {
            showNotification('Please fill in required fields!', 'error'); return;
        }
        updates = {
            fullName: g('edit-fullName'), phone: g('edit-phone'),
            receiverName: g('edit-receiverName'), receiverPhone: g('edit-receiverPhone'),
            address1: g('edit-address1'), address2: g('edit-address2'),
            city: g('edit-city'), county: g('edit-county'), postcode: g('edit-postcode'),
            packageName: g('edit-packageName'), packageQty: g('edit-packageQty'),
            packageKg: g('edit-packageKg'), payment: g('edit-payment'),
            deliveryNote: g('edit-deliveryNote')
        };
    } else {
        if (!g('edit-senderName') || !g('edit-senderMobile') || !g('edit-receiverName') || !g('edit-receiverMobile')) {
            showNotification('تکایە خانەی پێویست پڕبکەوە!', 'error'); return;
        }
        updates = {
            senderName: g('edit-senderName'), senderMobile: g('edit-senderMobile'),
            senderMobile2: g('edit-senderMobile2'), senderLocation: g('edit-senderLocation'),
            receiverName: g('edit-receiverName'), receiverMobile: g('edit-receiverMobile'),
            receiverMobile2: g('edit-receiverMobile2'), receiverLocation: g('edit-receiverLocation'),
            packageName: g('edit-packageName'), packageQty: g('edit-packageQty'),
            packageKg: g('edit-packageKg'), deliveryNote: g('edit-deliveryNote')
        };
    }
    database.ref('delivery/' + key).update(updates)
        .then(() => {
            showNotification(isUk ? 'Label updated successfully ✅' : 'لەیبل نوێکرایەوە ✅');
            document.getElementById('editDeliveryModal')?.remove();
            loadDeliveryRequests();
        })
        .catch(() => showNotification(isUk ? 'Error saving!' : 'هەڵە لە پاشەکەوتکردن!', 'error'));
}

// ==================== Share Delivery Label via WhatsApp ====================
function shareDeliveryWhatsApp(key) {
    const item = _allDeliveryItems.find(i => i.key === key);
    if (!item) { showNotification('زانیاری نەدۆزرایەوە!', 'error'); return; }
    const d = item;
    const isUk = !!d.fullName;
    const card = document.getElementById('label-' + key);
    const orderNum = card ? (card.querySelector('.label-order-num') || {}).textContent : '';

    // Build message text
    let msg = '';
    if (isUk) {
        msg = `🚚 *UK BAZAR — UK Delivery Label*\n`;
        msg += `📋 Order: *${orderNum}*\n\n`;
        msg += `📦 *Recipient:*\n`;
        msg += `👤 Name: ${d.fullName||'—'}\n`;
        msg += `📞 Phone: ${d.phone||'—'}\n`;
        if (d.receiverName) msg += `📬 Receiver: ${d.receiverName}\n`;
        if (d.receiverPhone) msg += `📞 Receiver Tel: ${d.receiverPhone}\n`;
        msg += `🏠 Address: ${d.address1||'—'}${d.address2?', '+d.address2:''}\n`;
        msg += `🏙️ City: ${d.city||'—'}\n`;
        if (d.county) msg += `County: ${d.county}\n`;
        msg += `📮 Postcode: ${d.postcode||'—'}\n`;
        if (d.destinationCity) msg += `🏙️ *Destination: ${d.destinationCity}*\n`;
        msg += `\n`;
        msg += `📦 *Package:*\n`;
        msg += `Item: ${d.packageName||'—'}\n`;
        if (d.packageQty) msg += `Qty: ${d.packageQty} pcs\n`;
        if (d.packageKg)  msg += `Weight: ${d.packageKg} kg\n`;
        if (d.payment)    msg += `💳 Payment: ${d.payment}\n`;
        if (d.deliveryNote) msg += `📝 Notes: ${d.deliveryNote}\n`;
        msg += `\n🌐 ukbazar.online`;
    } else {
        msg = `🚚 *UK BAZAR — لەیبلی گەیاندن*\n`;
        msg += `📋 پسولە: *${orderNum}*\n\n`;
        msg += `📤 *نێردەر:*\n`;
        msg += `👤 ناو: ${d.senderName||d.name||'—'}\n`;
        msg += `📞 ژمارە: ${d.senderMobile||d.mobile||'—'}\n`;
        if (d.senderMobile2) msg += `📞 ژمارە ٢: ${d.senderMobile2}\n`;
        msg += `📍 شوێن: ${d.senderLocation||d.address||'—'}\n\n`;
        msg += `📥 *وەرگر:*\n`;
        msg += `👤 ناو: ${d.receiverName||'—'}\n`;
        msg += `📞 ژمارە: ${d.receiverMobile||'—'}\n`;
        if (d.receiverMobile2) msg += `📞 ژمارە ٢: ${d.receiverMobile2}\n`;
        msg += `📍 شوێن: ${d.receiverLocation||'—'}\n\n`;
        msg += `📦 *کەلوپەل:*\n`;
        msg += `${d.packageName||d.details||'—'}`;
        if (d.packageQty) msg += ` | ${d.packageQty} پارچە`;
        if (d.packageKg)  msg += ` | ${d.packageKg} کگ`;
        if (d.driverName) msg += `\n🚗 شۆفیر: ${d.driverName} ${d.driverMobile||''}`;
        if (d.deliveryNote) msg += `\n📝 تیبینی: ${d.deliveryNote}`;
        msg += `\n\n🌐 ukbazar.online`;
    }

    // Ask for phone number — ئۆتۆماتیکی ژمارەی خاوەنی پۆست دادەنێت
    const existingShareModal = document.getElementById('whatsappShareModal');
    if (existingShareModal) existingShareModal.remove();

    const autoPhone = (d.phone || d.senderMobile || d.mobile || '').replace(/\D/g,'');

    const shareModal = document.createElement('div');
    shareModal.className = 'modal show';
    shareModal.id = 'whatsappShareModal';
    shareModal.style.zIndex = '99999';
    shareModal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="modal-header">
                <button class="close-modal" onclick="document.getElementById('whatsappShareModal').remove()">
                    <i class="fas fa-times"></i>
                </button>
                <h2><i class="fab fa-whatsapp" style="color:#25d366;"></i> شێرکردن بە واتسئاپ</h2>
            </div>
            <div style="padding:20px;">
                ${autoPhone ? `<div style="background:#FFFDE7;border:1.5px solid #FFE082;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.85rem;color:#E6B800;"><i class="fas fa-check-circle"></i> ژمارەی خاوەنی پۆست ئۆتۆماتیکی دانراوە: <strong style="direction:ltr;display:inline-block;">${autoPhone}</strong></div>` : ''}
                <div class="form-group">
                    <label style="font-weight:700;font-size:1rem;">📞 ژمارەی مۆبایلی وەرگر</label>
                    <p style="font-size:0.8rem;color:#718096;margin-bottom:8px;">ژمارەکە بنووسە — کۆدی وڵات زیادبکە گەرنەخۆش</p>
                    <input type="tel" id="waSharePhone" placeholder="مەسەلە: 9647701234567 یان +447501234567"
                        value="${autoPhone}"
                        style="font-size:1rem;direction:ltr;letter-spacing:1px;" autocomplete="off">
                </div>
                <div style="display:flex;gap:10px;margin-top:8px;">
                    <button class="btn btn-primary" onclick="sendWhatsAppLabel('${encodeURIComponent(msg)}')" style="flex:1;background:#25d366;border-color:#25d366;">
                        <i class="fab fa-whatsapp"></i> ناردن
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('whatsappShareModal').remove()" style="flex:1;">داخستن</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(shareModal);
    setTimeout(() => { const el = document.getElementById('waSharePhone'); if(el) el.focus(); }, 100);
}

function sendWhatsAppLabel(encodedMsg) {
    let phone = (document.getElementById('waSharePhone') || {value:''}).value.trim().replace(/\s+/g,'').replace(/^\+/,'');
    if (!phone) { showNotification('تکایە ژمارەکە بنووسە!', 'error'); return; }
    // Remove leading zeros for international format
    if (phone.startsWith('0') && phone.length <= 11) {
        showNotification('کۆدی وڵات زیادبکە — بۆ نموونە: 964 یان 44', 'info'); return;
    }
    document.getElementById('whatsappShareModal')?.remove();
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
}

// ==================== Delete Delivery Label ====================
function deleteDelivery(key) {
    var old = document.getElementById('_delLabelModal');
    if(old) old.remove();
    var modal = document.createElement('div');
    modal.id = '_delLabelModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:22px;width:100%;max-width:360px;box-shadow:0 12px 40px rgba(0,0,0,.25);">
        <div style="font-weight:900;color:#A50008;font-size:1rem;margin-bottom:6px;">🗑️ سڕینەوەی لەیبل</div>
        <div style="font-size:.82rem;color:#718096;margin-bottom:14px;">وشەی تێپەڕی بەڕێوەبەر داخڵ بکە بۆ سڕینەوە.</div>
        <div style="position:relative;margin-bottom:14px;">
          <input id="_delLabelPass" type="password" placeholder="وشەی تێپەڕ..."
            style="width:100%;padding:11px 44px 11px 14px;border:2px solid #FFCDD2;border-radius:10px;font-size:.95rem;font-family:inherit;box-sizing:border-box;direction:ltr;"
            onfocus="this.style.borderColor='#FF8A80'" onblur="this.style.borderColor='#FFCDD2'"
            onkeydown="if(event.key==='Enter')_doDeleteLabel('${key}')">
          <button type="button" onclick="(function(b){var i=document.getElementById('_delLabelPass');if(i.type==='password'){i.type='text';b.innerHTML='🙈';}else{i.type='password';b.innerHTML='👁';}})(this)"
            style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;">👁</button>
        </div>
        <div id="_delLabelErr" style="display:none;color:#D40511;font-size:.8rem;margin-bottom:10px;padding:7px;background:#FFF8F8;border-radius:8px;"></div>
        <div style="display:flex;gap:8px;">
          <button onclick="document.getElementById('_delLabelModal').remove()"
            style="flex:1;padding:10px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;">پاشگەزبوونەوە</button>
          <button onclick="_doDeleteLabel('${key}')"
            style="flex:2;padding:10px;background:linear-gradient(135deg,#D40511,#A50008);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;">🗑️ سڕینەوە</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
    setTimeout(function(){var i=document.getElementById('_delLabelPass');if(i)i.focus();},80);
}

function _doDeleteLabel(key) {
    var inp = document.getElementById('_delLabelPass');
    var pass = inp ? inp.value : '';
    var errEl = document.getElementById('_delLabelErr');
    if (!pass) { if(errEl){errEl.textContent='وشەی تێپەڕ بنووسە!';errEl.style.display='block';} return; }
    _checkAdminPass(pass).then(function(ok) {
      if (!ok) {
          if(errEl){errEl.textContent='❌ وشەی تێپەڕ هەڵەیە!';errEl.style.display='block';}
          if(inp){inp.value='';inp.focus();}
          return;
      }
      var m = document.getElementById('_delLabelModal');
      if(m) m.remove();
      database.ref('delivery/' + key).remove()
        .then(() => {
            showNotification('لەیبل بە سەرکەوتوویی سڕایەوە 🗑️');
            const card = document.getElementById('label-' + key);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            }
            _allDeliveryItems = _allDeliveryItems.filter(i => i.key !== key);
        })
        .catch(() => showNotification('هەڵە لە سڕینەوە!', 'error'));
    });
}

// ==================== Admin Forms ====================
function showAddSliderForm() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="margin-bottom: 20px; color: var(--primary);">🖼️ زیادکردنی وێنە بە سلایدەر</h3>
            <form id="adminSliderForm">
                <div class="form-group">
                    <label>وێنەکان (دەتوانیت چەندین وێنە هەڵبژێریت):</label>
                    <input type="file" id="sliderImages" accept="image/*" multiple required>
                    <div class="image-preview" id="sliderPreview"></div>
                </div>
                <div class="form-group">
                    <label>ناونیشان (دڵخواز):</label>
                    <input type="text" id="sliderTitle" placeholder="ناونیشانی وێنە...">
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-upload"></i> زیادکردنی وێنە بە سلایدەر
                </button>
            </form>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 12px;">
            <h3 style="margin-bottom: 20px; color: var(--danger);">🗑️ بەڕێوەبردنی وێنەکانی سلایدەر</h3>
            <div id="sliderImagesList" style="display: grid; gap: 15px;">
                <p style="text-align: center; color: var(--gray);">چاوەڕوانی بکە...</p>
            </div>
        </div>
    `;

    const sliderImages = document.getElementById('sliderImages');
    if (sliderImages) {
        sliderImages.addEventListener('change', function(e) {
            const preview = document.getElementById('sliderPreview');
            if (!preview) return;
            preview.innerHTML = '';
            
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    const adminSliderForm = document.getElementById('adminSliderForm');
    if (adminSliderForm) {
        adminSliderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            showNotification('تکایە چاوەڕێ بکە، وێنەکان بارکراوە...');
            
            const images = document.getElementById('sliderImages').files;
            const title = document.getElementById('sliderTitle').value;
            
            for (let i = 0; i < images.length; i++) {
                const imageRef = storage.ref(`slider/${Date.now()}_${i}`);
                const snapshot = await imageRef.put(images[i]);
                const url = await snapshot.ref.getDownloadURL();
                
                await database.ref('slider').push({
                    imageUrl: url,
                    title: title || 'سلایدەر',
                    timestamp: new Date().toLocaleString('ku')
                });
            }
            
            showNotification('وێنەکان بە سەرکەوتوویی زیادکران! 🎉');
            adminSliderForm.reset();
            const preview = document.getElementById('sliderPreview');
            if (preview) preview.innerHTML = '';
            loadSliderManagement();
            loadRealSliderImages();
        });
    }
    
    loadSliderManagement();
}

function loadSliderManagement() {
    database.ref('slider').once('value')
        .then((snapshot) => {
            const listContainer = document.getElementById('sliderImagesList');
            if (!listContainer) return;
            
            if (!snapshot.exists()) {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--gray);">هیچ وێنەیەکی سلایدەر نییە</p>';
                return;
            }
            
            const sliderImages = [];
            snapshot.forEach((child) => {
                sliderImages.push({
                    data: child.val(),
                    id: child.key
                });
            });
            
            sliderImages.reverse();
            
            let html = '';
            sliderImages.forEach((item) => {
                const slider = item.data;
                const id = item.id;
                
                html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; gap: 15px; align-items: center;">';
                html += '<img src="' + slider.imageUrl + '" style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.src=\'' + DEFAULT_PRODUCT_IMAGE + '\'">';
                html += '<div style="flex: 1;">';
                html += '<h4 style="margin: 0 0 5px 0; color: var(--dark);">' + (slider.title || 'سلایدەر') + '</h4>';
                html += '<p style="margin: 0; color: var(--gray); font-size: 0.85rem;">بەرواری زیادکردن: ' + (slider.timestamp || 'نادیار') + '</p>';
                html += '</div>';
                html += '<button class="btn btn-danger btn-small" onclick="deleteSliderImage(\'' + id + '\')" style="flex-shrink: 0;">';
                html += '<i class="fas fa-trash"></i> سڕینەوە';
                html += '</button>';
                html += '</div>';
            });
            
            listContainer.innerHTML = html;
        })
        .catch((error) => {
            console.error('Error loading slider images:', error);
            const listContainer = document.getElementById('sliderImagesList');
            if (listContainer) {
                listContainer.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردنی وێنەکان!</p>';
            }
        });
}

function showAdminAddProductForm() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    
    content.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px;">
            <h3 style="margin-bottom: 20px; color: var(--primary);">📦 زیادکردنی کاڵا (بە ڕاستەوخۆ)</h3>
            <form id="adminProductForm">
                <div class="form-group">
                    <label>ناوی کاڵا:</label>
                    <input type="text" id="adminProductName" required>
                </div>
                <div class="form-group">
                    <label>جۆری کاڵا:</label>
                    <select id="adminProductCategory" required>
                        <option value="">هەڵبژێرە...</option>
                        <option value="مۆبایل">مۆبایل</option>
                        <option value="لاپتۆپ">لاپتۆپ</option>
                        <option value="کۆمپیوتەر">کۆمپیوتەر</option>
                        <option value="ئایپاد">ئایپاد</option>
                        <option value="ئوتومبێل">ئوتومبێل</option>
                        <option value="ناوماڵ">ناوماڵ</option>
                        <option value="پاسکیل">پاسکیل</option>
                        <option value="سکۆتەر">سکۆتەر</option>
                        <option value="کامێرا">کامێرا</option>
                        <option value="جوانکاری">جوانکاری</option>
                        <option value="خانوو">خانوو</option>
                        <option value="زەوی">زەوی</option>
                        <option value="باخ">باخ</option>
                        <option value="ئاژەڵ">ئاژەڵ</option>
                        <option value=" پیاوان"> پیاوان</option>
                        <option value=" ئافرەتان"> ئافرەتان</option>
                        <option value=" منداڵان"> منداڵان</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>وردەکاری:</label>
                    <textarea id="adminProductDescription"></textarea>
                </div>
                <div class="form-group" style="display:flex; gap:10px;">
                    <div style="flex:1;">
                        <label>نرخ:</label>
                        <input type="number" id="adminProductPrice" required>
                    </div>
                    <div style="flex:1;">
                        <label>دراو:</label>
                        <select id="adminProductCurrency" required>
                            <option value="IQD">دینار</option>
                            <option value="USD">دۆلار</option>
                            <option value="GBP">پاوەند</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>وێنەکان:</label>
                    <input type="file" id="adminProductImages" accept="image/*" multiple required>
                    <div class="image-preview" id="adminProductPreview"></div>
                </div>
                <div class="form-group">
                    <label>ناوی فرۆشیار:</label>
                    <input type="text" id="adminSellerName" required>
                </div>
                <div class="form-group">
                    <label>ژمارەی مۆبایلی فرۆشیار:</label>
                    <input type="tel" id="adminSellerMobile" required>
                </div>
                <div class="form-group">
                    <label>شوێن:</label>
                    <input type="text" id="adminProductLocation" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-secondary">
                        <i class="fas fa-check-circle"></i> زیادکردنی کاڵا (پەسەندکراو)
                    </button>
                    <button type="button" class="btn btn-danger" onclick="showAdminTab('products')">
                        <i class="fas fa-times"></i> پاشگەزبوونەوە
                    </button>
                </div>
            </form>
        </div>
    `;

    const adminProductImages = document.getElementById('adminProductImages');
    if (adminProductImages) {
        adminProductImages.addEventListener('change', function(e) {
            const preview = document.getElementById('adminProductPreview');
            if (!preview) return;
            preview.innerHTML = '';
            
            Array.from(e.target.files).forEach(function(file, i) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;margin:6px 4px;width:110px;';
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.cssText = 'width:100px;height:100px;object-fit:cover;border-radius:8px;border:2px solid #e2e8f0;';
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.placeholder = 'وردەکاری وێنە ' + (i + 1);
                    inp.className = 'admin-img-desc-input';
                    inp.dataset.imgIdx = i;
                    inp.style.cssText = 'width:100px;font-size:0.72rem;padding:4px 6px;border:1.5px solid #e2e8f0;border-radius:6px;text-align:center;';
                    wrap.appendChild(img);
                    wrap.appendChild(inp);
                    preview.appendChild(wrap);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    const adminProductForm = document.getElementById('adminProductForm');
    if (adminProductForm) {
        adminProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            showNotification('تکایە چاوەڕێ بکە، کاڵا دەنێردرێت...');
            
            const images = document.getElementById('adminProductImages').files;
            const imageUrls = [];
            
            for (let i = 0; i < images.length; i++) {
                const imageRef = storage.ref(`products/${Date.now()}_${i}`);
                const snapshot = await imageRef.put(images[i]);
                const url = await snapshot.ref.getDownloadURL();
                imageUrls.push(url);
            }

            // Collect per-image descriptions
            const adminDescInputs = document.querySelectorAll('#adminProductPreview .admin-img-desc-input');
            const imageDescriptions = Array.from(adminDescInputs).map(inp => inp.value.trim());
            
            const productData = {
                name: document.getElementById('adminProductName').value,
                category: document.getElementById('adminProductCategory').value,
                description: document.getElementById('adminProductDescription').value,
                price: document.getElementById('adminProductPrice').value,
                currency: document.getElementById('adminProductCurrency').value,
                images: imageUrls,
                imageDescriptions: imageDescriptions,
                sellerName: document.getElementById('adminSellerName').value,
                sellerMobile: document.getElementById('adminSellerMobile').value,
                location: document.getElementById('adminProductLocation').value,
                status: 'approved',
                timestamp: new Date().toLocaleString('ku')
            };
            
            await database.ref('products').push(productData);
            
            showNotification('کاڵا بە سەرکەوتوویی زیادکرا! ✅');
            adminProductForm.reset();
            const preview = document.getElementById('adminProductPreview');
            if (preview) preview.innerHTML = '';
            
            showAdminTab('allProducts');
            loadApprovedProducts();
        });
    }
}

// ==================== Form Submissions ====================
document.addEventListener('submit', async function(e) {
    // Request Form
    if (e.target && e.target.id === 'requestForm') {
        e.preventDefault();
        const requestData = {
            itemName: document.getElementById('requestItemName').value,
            details: document.getElementById('requestDetails').value,
            name: document.getElementById('requestName').value,
            mobile: document.getElementById('requestMobile').value,
            timestamp: new Date().toLocaleString('ku')
        };
        database.ref('requests').push(requestData)
            .then(() => {
                showNotification('داواکاریەکەت بە سەرکەوتوویی نێردرا! ✅');
                closeModal('requestModal');
                document.getElementById('requestForm').reset();
            })
            .catch(() => { showNotification('هەڵە لە ناردن!', 'error'); });
    }

    // Add Product Form
    if (e.target && e.target.id === 'addProductForm') {
        e.preventDefault();
        showNotification('تکایە چاوەڕێ بکە، کاڵا دەنێردرێت...');
        
        const images = document.getElementById('productImages').files;
        const imageUrls = [];
        
        for (let i = 0; i < images.length; i++) {
            const imageRef = storage.ref(`products/${Date.now()}_${i}`);
            const snapshot = await imageRef.put(images[i]);
            const url = await snapshot.ref.getDownloadURL();
            imageUrls.push(url);
        }

        // Collect per-image descriptions
        const descInputs = document.querySelectorAll('#imagePreview .img-desc-input');
        const imageDescriptions = Array.from(descInputs).map(inp => inp.value.trim());
        
        const productData = {
            name: document.getElementById('productName').value,
            category: (document.getElementById('adminProductCategory') || document.getElementById('productCategory') || {value:''}).value,
            description: document.getElementById('productDescription').value,
            price: document.getElementById('productPrice').value,
            currency: document.getElementById('productCurrency').value,
            images: imageUrls,
            imageDescriptions: imageDescriptions,
            sellerName: document.getElementById('sellerName').value,
            sellerMobile: document.getElementById('sellerMobile').value,
            location: document.getElementById('productLocation').value,
            status: 'pending',
            timestamp: new Date().toLocaleString('ku')
        };
        
        database.ref('products').push(productData)
            .then(() => {
                showNotification('کاڵاکەت نێردرا! چاوەڕوانی پەسەندکردنی بەڕێوەبەر بکە 📦');
                closeModal('addProductModal');
                document.getElementById('addProductForm').reset();
                document.getElementById('imagePreview').innerHTML = '';
            })
            .catch(() => { showNotification('هەڵە لە ناردن!', 'error'); });
    }

    // Delivery Form
    if (e.target && e.target.id === 'deliveryForm') {
        e.preventDefault();
        showNotification('تکایە چاوەڕێ بکە...');

        // ژمارەی پسولە بەرزبکەوە
        database.ref('deliveryCounter').transaction((current) => {
            return (current || 0) + 1;
        }).then((result) => {
            const orderNum = 'KU-' + String(result.snapshot.val()).padStart(4, '0');
            const deliveryData = {
                orderNumber:      orderNum,
                senderName:       document.getElementById('senderName').value,
                senderMobile:     document.getElementById('senderMobile').value,
                senderMobile2:    document.getElementById('senderMobile2').value,
                senderLocation:   document.getElementById('senderLocation').value,
                receiverName:     document.getElementById('receiverName').value,
                receiverMobile:   document.getElementById('receiverMobile').value,
                receiverMobile2:  document.getElementById('receiverMobile2').value,
                receiverLocation: document.getElementById('receiverLocation').value,
                packageName:      document.getElementById('packageName').value,
                packageQty:       document.getElementById('packageQty').value,
                packageKg:        document.getElementById('packageKg').value,
                timestamp:        new Date().toLocaleString('ku'),
                sortKey:          Date.now()
            };
            return database.ref('delivery').push(deliveryData);
        }).then(() => {
            showNotification('داواکاری گەیاندن نێردرا! ✅');
            closeModal('deliveryModal');
            document.getElementById('deliveryForm').reset();
        }).catch(() => { showNotification('هەڵە لە ناردن!', 'error'); });
    }
});

// Image Preview — with per-image description inputs
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'productImages') {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        preview.innerHTML = '';
        Array.from(e.target.files).forEach(function(file, i) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;margin:6px 4px;width:110px;';
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.cssText = 'width:100px;height:100px;object-fit:cover;border-radius:8px;border:2px solid #e2e8f0;';
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.placeholder = 'وردەکاری وێنە ' + (i + 1);
                inp.className = 'img-desc-input';
                inp.dataset.imgIdx = i;
                inp.style.cssText = 'width:100px;font-size:0.72rem;padding:4px 6px;border:1.5px solid #e2e8f0;border-radius:6px;text-align:center;';
                wrap.appendChild(img);
                wrap.appendChild(inp);
                preview.appendChild(wrap);
            };
            reader.readAsDataURL(file);
        });
    }
});

// ==================== Category & Search ====================
function createCategoryButtons() {
    // ئەم کارە ئێستا لە i18n.js دەکرێت بە _refreshCategoryButtons()
    // ئەگەر i18n بارنەکرابوو، یەکسەر بە کوردی دروست بکە
    if (window._refreshCategoryButtons) {
        window._refreshCategoryButtons();
        return;
    }
    // Fallback کوردی
    const categories = [
        'هەموو کاڵاکان','مۆبایل','لاپتۆپ','کۆمپیوتەر','ئایپاد','ئوتومبێل',
        'ناوماڵ','پاسکیل','سکۆتەر','کامێرا','جوانکاری','خانوو','زەوی',
        'باخ','ئاژەڵ',' پیاوان',' ئافرەتان',' منداڵان'
    ];
    const container = document.getElementById('categoryButtons');
    if (!container) return;
    container.innerHTML = categories.map(cat =>
        '<button class="category-btn ' + (cat === 'هەموو کاڵاکان' ? 'active' : '') + '" ' +
        'onclick="filterByCategory(\'' + cat.replace(/'/g,"\\'") + '\')" ' +
        'data-ku-cat="' + cat.trim() + '" title="' + cat + '">' + cat + '</button>'
    ).join('');
}

function filterByCategory(category) {
    // category هەمیشە بە کوردییە (key) — دوگمەکان data-ku-cat بەکار دەهێنن
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.kuCat === category.trim() || btn.dataset.kuCat === category);
    });

    const productsTitle = document.getElementById('productsTitle');
    const t = window.t;

    if (category.trim() === 'هەموو کاڵاکان') {
        renderProducts(products);
        if (productsTitle) productsTitle.textContent = t ? t('all_products') : 'هەموو کاڵاکان';
    } else {
        const filtered = products.filter(p => p.category === category.trim() || p.category === category);
        renderProducts(filtered);
        if (productsTitle) productsTitle.textContent = filtered.length + (t ? (' ' + t('products_loaded')) : ' کاڵا') ;
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProducts(products);
        const productsTitle = document.getElementById('productsTitle');
        if (productsTitle) productsTitle.textContent = window.t ? window.t('all_products') : 'هەموو کاڵاکان';
        return;
    }

    const results = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
    );

    if (results.length === 0) {
        showNotification(window.t ? window.t('no_results') : 'هیچ کاڵایەک نەدۆزرایەوە!', 'error');
        return;
    }

    renderProducts(results);
    const productsTitle = document.getElementById('productsTitle');
    if (productsTitle) productsTitle.textContent = (window.t ? window.t('search_results') : 'ئەنجامەکانی گەڕان: ') + '"' + searchTerm + '"';
    showNotification(results.length + (window.t ? (' ' + window.t('products_loaded')) : ' کاڵا دۆزرایەوە'));
}

// ==================== Product Card & Rendering ====================

// Inject product carousel CSS once
(function injectProductCarouselCSS() {
    if (document.getElementById('product-carousel-css')) return;
    const s = document.createElement('style');
    s.id = 'product-carousel-css';
    s.textContent = `
        .pc-carousel { position:relative; overflow:hidden; background:#f0f2f5; border-radius:12px 12px 0 0; }
        .pc-slides { display:flex; transition:transform 0.35s cubic-bezier(.4,0,.2,1); will-change:transform; }
        .pc-slide { min-width:100%; position:relative; }
        .pc-slide img { width:100%; aspect-ratio:1/1; object-fit:cover; display:block; cursor:zoom-in; }
        .pc-img-caption { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.52); color:#fff; font-size:.75rem; padding:5px 10px; text-align:center; pointer-events:none; min-height:0; max-height:56px; overflow:hidden; display:none; }
        .pc-img-caption.has-text { display:block; }
        .pc-arrow { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.85); border:none; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:.8rem; color:#333; z-index:2; box-shadow:0 2px 6px rgba(0,0,0,0.18); }
        .pc-arrow.left { right:6px; }
        .pc-arrow.right { left:6px; }
        .pc-dots { display:flex; justify-content:center; gap:5px; padding:5px 0 3px; background:#f0f2f5; }
        .pc-dot { width:7px; height:7px; border-radius:50%; background:#ccc; cursor:pointer; transition:background .2s; flex-shrink:0; }
        .pc-dot.active { background:#D40511; }
        /* Gallery Modal */
        .gallery-modal { position:fixed; inset:0; background:rgba(0,0,0,0.94); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .gallery-modal.hidden { display:none; }
        .gallery-close { position:absolute; top:14px; right:16px; background:rgba(255,255,255,0.15); border:none; color:#fff; font-size:1.3rem; border-radius:50%; width:38px; height:38px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:2; }
        .gallery-img-wrap { position:relative; max-width:96vw; max-height:72vh; display:flex; align-items:center; justify-content:center; }
        .gallery-img-wrap img { max-width:96vw; max-height:72vh; object-fit:contain; border-radius:8px; user-select:none; }
        .gallery-caption { color:#e2e8f0; font-size:.92rem; text-align:center; padding:10px 20px 4px; max-width:480px; min-height:28px; }
        .gallery-dots { display:flex; gap:8px; justify-content:center; padding:8px 0; }
        .gallery-dot { width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.3); cursor:pointer; transition:background .2s; }
        .gallery-dot.active { background:#fff; }
        .gallery-nav { position:absolute; top:50%; transform:translateY(-50%); background:rgba(255,255,255,0.18); border:none; color:#fff; border-radius:50%; width:42px; height:42px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1.2rem; z-index:2; }
        .gallery-nav.left { right:4px; }
        .gallery-nav.right { left:4px; }
        .gallery-counter { position:absolute; top:14px; left:16px; background:rgba(0,0,0,0.45); color:#fff; font-size:.78rem; padding:3px 10px; border-radius:20px; }
    `;
    document.head.appendChild(s);
    // Create gallery modal DOM once
    const m = document.createElement('div');
    m.id = 'productGalleryModal';
    m.className = 'gallery-modal hidden';
    m.innerHTML = `
        <span class="gallery-counter" id="gCounter"></span>
        <button class="gallery-close" onclick="closeProductGallery()"><i class="fas fa-times"></i></button>
        <div class="gallery-img-wrap" style="position:relative;">
            <button class="gallery-nav right" onclick="galleryNav(-1)"><i class="fas fa-chevron-right"></i></button>
            <img id="gMainImg" src="" alt="">
            <button class="gallery-nav left" onclick="galleryNav(1)"><i class="fas fa-chevron-left"></i></button>
        </div>
        <div class="gallery-caption" id="gCaption"></div>
        <div class="gallery-dots" id="gDots"></div>
    `;
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) closeProductGallery(); });
})();

let _galleryImages = [], _galleryDescs = [], _galleryIdx = 0;

function openProductGallery(images, descs, startIdx) {
    _galleryImages = images;
    _galleryDescs  = descs || [];
    _galleryIdx    = startIdx || 0;
    const modal = document.getElementById('productGalleryModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    _renderGallery();
}
function closeProductGallery() {
    const modal = document.getElementById('productGalleryModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}
function _renderGallery() {
    const img = document.getElementById('gMainImg');
    const cap = document.getElementById('gCaption');
    const dots = document.getElementById('gDots');
    const counter = document.getElementById('gCounter');
    if (!img) return;
    img.src = _galleryImages[_galleryIdx] || '';
    cap.textContent = (_galleryDescs[_galleryIdx] || '');
    counter.textContent = (_galleryIdx + 1) + ' / ' + _galleryImages.length;
    dots.innerHTML = _galleryImages.map((_, i) =>
        '<div class="gallery-dot' + (i === _galleryIdx ? ' active' : '') + '" onclick="galleryGoTo(' + i + ')"></div>'
    ).join('');
}
function galleryNav(delta) {
    _galleryIdx = (_galleryIdx + delta + _galleryImages.length) % _galleryImages.length;
    _renderGallery();
}
function galleryGoTo(i) { _galleryIdx = i; _renderGallery(); }

// Swipe support for gallery
(function attachGallerySwipe() {
    let sx = 0;
    document.addEventListener('touchstart', function(e) {
        const m = document.getElementById('productGalleryModal');
        if (m && !m.classList.contains('hidden')) sx = e.touches[0].clientX;
    }, {passive:true});
    document.addEventListener('touchend', function(e) {
        const m = document.getElementById('productGalleryModal');
        if (m && !m.classList.contains('hidden')) {
            const dx = e.changedTouches[0].clientX - sx;
            if (Math.abs(dx) > 40) galleryNav(dx > 0 ? 1 : -1);
        }
    }, {passive:true});
})();

function createProductCard(product) {
    const images = (product.images && product.images.length > 0) ? product.images.map(safeUrl) : [DEFAULT_PRODUCT_IMAGE];
    const descs  = product.imageDescriptions || [];
    const productName = product.name && product.name.length > 30 ? product.name.substring(0, 27) + '...' : product.name || 'بێ ناو';
    const sellerName = product.sellerName && product.sellerName.length > 15 ? product.sellerName.substring(0, 12) + '...' : product.sellerName || 'نادیار';
    const location = product.location && product.location.length > 20 ? product.location.substring(0, 17) + '...' : product.location || 'نادیار';
    const safeId = product.firebaseId;
    const safeName = (product.name || '').replace(/'/g, "\\'");
    const safeMobile = (product.sellerMobile || '');

    // Build carousel slides
    const slidesHtml = images.map(function(imgUrl, i) {
        const safeImgUrl = (imgUrl || DEFAULT_PRODUCT_IMAGE).replace(/'/g, "\\'");
        const desc = descs[i] || '';
        const safeDesc = escapeHtml(desc);
        return '<div class="pc-slide">' +
            '<img src="' + (imgUrl || DEFAULT_PRODUCT_IMAGE) + '" alt="" loading="lazy" ' +
            'onclick="openProductGallery(JSON.parse(this.closest(\'.product-card\').dataset.images), JSON.parse(this.closest(\'.product-card\').dataset.descs), ' + i + ')" ' +
            'onerror="this.onerror=null;this.src=\'' + DEFAULT_PRODUCT_IMAGE + '\'">' +
            (desc ? '<div class="pc-img-caption has-text">' + safeDesc + '</div>' : '<div class="pc-img-caption"></div>') +
            '</div>';
    }).join('');

    const dotsHtml = images.length > 1 ? images.map(function(_, i) {
        return '<div class="pc-dot' + (i === 0 ? ' active' : '') + '" onclick="pcGoTo(\'' + safeId + '\',' + i + ')"></div>';
    }).join('') : '';

    const arrowsHtml = images.length > 1 ?
        '<button class="pc-arrow left" onclick="pcNav(\'' + safeId + '\',-1)"><i class="fas fa-chevron-right"></i></button>' +
        '<button class="pc-arrow right" onclick="pcNav(\'' + safeId + '\',1)"><i class="fas fa-chevron-left"></i></button>' : '';

    const dotsRow = images.length > 1 ? '<div class="pc-dots" id="pcdots-' + safeId + '">' + dotsHtml + '</div>' : '';

    const safeImagesJson = JSON.stringify(images).replace(/"/g, '&quot;');
    const safeDescsJson  = JSON.stringify(descs).replace(/"/g, '&quot;');

    return '<div class="product-card" id="card-' + safeId + '" data-images="' + safeImagesJson + '" data-descs="' + safeDescsJson + '" data-pcidx="0">' +
        '<div class="pc-carousel" id="pc-' + safeId + '">' +
        '<div class="pc-slides" id="pcslides-' + safeId + '">' + slidesHtml + '</div>' +
        arrowsHtml +
        '</div>' +
        dotsRow +
        '<div class="product-info">' +
        '<div class="product-category">' + (product.category || 'هەموویی') + '</div>' +
        '<h3 class="product-name" title="' + (product.name || '') + '">' + productName + '</h3>' +
        '<div class="product-price">' + (product.price || '0') + ' ' + (product.currency || 'IQD') + '</div>' +
        '<div class="product-seller"><i class="fas fa-user"></i> ' + sellerName + '</div>' +
        '<div class="product-location" title="' + (product.location || '') + '"><i class="fas fa-map-marker-alt"></i> ' + location + '</div>' +
        '<div class="qty-selector" id="qty-' + safeId + '" style="display:none;">' +
        '<div class="qty-row"><button class="qty-btn qty-minus" onclick="changeQty(\'' + safeId + '\', -1)">−</button><span class="qty-value" id="qtyval-' + safeId + '">1</span><button class="qty-btn qty-plus" onclick="changeQty(\'' + safeId + '\', 1)">+</button><span class="qty-label">' + (window.t ? window.t('pieces') : 'دانە') + '</span></div>' +
        '<button class="btn btn-confirm-cart" onclick="confirmAddToCart(\'' + safeId + '\', \'' + safeMobile + '\', \'' + safeName + '\')"><i class="fas fa-check"></i> ' + (window.t ? window.t('add_to_cart') : 'زیادکردن بۆ سەبەتە') + '</button></div>' +
        // دوگمەی خێرا ژێر کاڵا — سەبەتە، دڵخواز، FIB
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px;">' +
        '<button onclick="showQtySelector(\'' + safeId + '\')" style="padding:9px;background:linear-gradient(135deg,#D40511,#A50008);color:#fff;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="fas fa-shopping-cart"></i> سەبەتە</button>' +
        '<button id="wl2-' + safeId + '" onclick="toggleWishlist(\'' + safeId + '\')" style="padding:9px;background:#fff0f0;color:#D40511;border:1.5px solid #FFCDD2;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="far fa-heart" id="wl2-icon-' + safeId + '"></i> دڵخواز</button>' +
        '</div>' +
        '<div style="margin-top:6px;">' +
        '<button onclick="showFibModal()" style="width:100%;padding:9px;background:linear-gradient(135deg,#A50008,#D40511);color:#fff;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;"><i class="fas fa-credit-card"></i> FIB پارەدان</button>' +
        '</div>' +
        '</div></div>';
}

// Product card carousel navigation helpers
function _pcGetData(cardId) {
    const card = document.getElementById('card-' + cardId);
    if (!card) return null;
    const slides = document.getElementById('pcslides-' + cardId);
    const dotsContainer = document.getElementById('pcdots-' + cardId);
    const total = slides ? slides.children.length : 0;
    const idx = parseInt(card.dataset.pcidx) || 0;
    return { card, slides, dotsContainer, total, idx };
}
function pcNav(cardId, delta) {
    const d = _pcGetData(cardId);
    if (!d || d.total < 2) return;
    const newIdx = (d.idx + delta + d.total) % d.total;
    d.card.dataset.pcidx = newIdx;
    d.slides.style.transform = 'translateX(-' + (newIdx * 100) + '%)';
    if (d.dotsContainer) {
        d.dotsContainer.querySelectorAll('.pc-dot').forEach(function(dot, i) {
            dot.classList.toggle('active', i === newIdx);
        });
    }
}
function pcGoTo(cardId, idx) {
    const d = _pcGetData(cardId);
    if (!d) return;
    d.card.dataset.pcidx = idx;
    d.slides.style.transform = 'translateX(-' + (idx * 100) + '%)';
    if (d.dotsContainer) {
        d.dotsContainer.querySelectorAll('.pc-dot').forEach(function(dot, i) {
            dot.classList.toggle('active', i === idx);
        });
    }
}

// Touch swipe on product cards
(function attachCardSwipe() {
    let startX = 0, activeCard = null;
    document.addEventListener('touchstart', function(e) {
        const card = e.target.closest('.pc-carousel');
        if (card) { startX = e.touches[0].clientX; activeCard = card; }
        else activeCard = null;
    }, {passive:true});
    document.addEventListener('touchend', function(e) {
        if (!activeCard) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) {
            const cardEl = activeCard.closest('.product-card');
            if (cardEl) {
                const cardId = cardEl.id.replace('card-', '');
                pcNav(cardId, dx > 0 ? 1 : -1);
            }
        }
        activeCard = null;
    }, {passive:true});
})();
function showQtySelector(productId) {
    const qtyDiv = document.getElementById('qty-' + productId);
    if (!qtyDiv) return;
    const isVisible = qtyDiv.style.display !== 'none';
    document.querySelectorAll('.qty-selector').forEach(el => el.style.display = 'none');
    if (!isVisible) { qtyDiv.style.display = 'block'; qtyDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}
function changeQty(productId, delta) {
    const valEl = document.getElementById('qtyval-' + productId);
    if (!valEl) return;
    valEl.textContent = Math.max(1, (parseInt(valEl.textContent) || 1) + delta);
}
function confirmAddToCart(productId, sellerMobile, productName) {
    const valEl = document.getElementById('qtyval-' + productId);
    const qty = valEl ? (parseInt(valEl.textContent) || 1) : 1;
    const product = products.find(p => p.firebaseId === productId);
    if (!product) return;
    // داخستنی qty selector
    const qtyDiv = document.getElementById('qty-' + productId);
    if (qtyDiv) qtyDiv.style.display = 'none';
    // نیشاندانی فۆرمی زانیاری کڕیار
    showBuyerInfoModal(product, qty, sellerMobile);
}

function showBuyerInfoModal(product, qty, sellerMobile) {
    const existing = document.getElementById('buyerInfoModal');
    if (existing) existing.remove();
    const thumbHtml = (product.images && product.images[0])
        ? '<img src="' + escapeHtml(product.images[0]) + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.display=\'none\'">'
        : '<div style="width:60px;height:60px;background:#D40511;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">📦</div>';
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'buyerInfoModal';
    modal.style.zIndex = '99999';
    modal.innerHTML =
        '<div class="modal-content" style="max-width:440px;">' +
        '<div class="modal-header" style="background:linear-gradient(135deg,#D40511,#A50008);">' +
        '<button class="close-modal" onclick="document.getElementById(\'buyerInfoModal\').remove()"><i class="fas fa-times"></i></button>' +
        '<h2 style="color:#fff;"><i class="fas fa-shopping-cart"></i> زانیاری کڕیار</h2>' +
        '</div>' +
        '<div style="padding:20px;">' +
        '<div style="background:#f8f9ff;border-radius:12px;padding:12px;margin-bottom:16px;display:flex;gap:12px;align-items:center;border:1.5px solid #e2e8f0;">' +
        thumbHtml +
        '<div><div style="font-weight:700;color:#1C1C1C;font-size:.95rem;">' + escapeHtml(product.name || '') + '</div>' +
        '<div style="color:#D40511;font-weight:700;font-size:.9rem;">' + escapeHtml(String(product.price || '')) + ' ' + escapeHtml(product.currency || 'IQD') + ' × ' + qty + ' دانە</div></div></div>' +
        '<div class="form-group"><label style="font-weight:700;">👤 ناوی تەواو <span style="color:#D40511;">*</span></label>' +
        '<input type="text" id="buyerName" placeholder="ناوت بنووسە..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📞 ژمارەی مۆبایل <span style="color:#D40511;">*</span></label>' +
        '<input type="tel" id="buyerMobile" placeholder="مەسەلە: 07701234567" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;direction:ltr;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📍 ناونیشان / شوێن <span style="color:#D40511;">*</span></label>' +
        '<input type="text" id="buyerAddress" placeholder="شار، شوێن..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📝 تێبینی (دڵخواز)</label>' +
        '<textarea id="buyerNote" placeholder="هەر تێبینییەک..." rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;resize:none;"></textarea></div>' +
        '<div style="display:flex;gap:10px;margin-top:4px;">' +
        '<button onclick="submitBuyerOrder(\'' + escapeHtml(product.firebaseId) + '\',\'' + (product.name||'').replace(/'/g,"\\'") + '\',\'' + (product.price||'') + '\',\'' + (product.currency||'IQD') + '\',' + qty + ',\'' + (sellerMobile||'') + '\')" ' +
        'style="flex:1;background:#25d366;color:#fff;border:none;border-radius:50px;padding:13px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;">' +
        '<i class="fab fa-whatsapp"></i> ناردن و پەیوەندی بە فرۆشیار</button>' +
        '<button onclick="document.getElementById(\'buyerInfoModal\').remove()" ' +
        'style="flex:1;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:50px;padding:13px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;">✕ پاشگەزبوونەوە</button>' +
        '</div></div></div>';
    document.body.appendChild(modal);
    // ئەگەر بەکارهێنەر چووەژوورەوە بوو — خۆکارانە پڕ بکەرەوە
    setTimeout(function() {
        if (_currentUser) {
            var nameEl = document.getElementById('buyerName');
            if (nameEl && !nameEl.value) nameEl.value = _currentUser.name || _currentUser.username || '';
        }
        var el = document.getElementById('buyerName');
        if (el) el.focus();
    }, 100);
}

function submitBuyerOrder(productId, productName, price, currency, qty, sellerMobile) {
    var name    = (document.getElementById('buyerName')    || {value:''}).value.trim();
    var mobile  = (document.getElementById('buyerMobile')  || {value:''}).value.trim();
    var address = (document.getElementById('buyerAddress') || {value:''}).value.trim();
    var note    = (document.getElementById('buyerNote')    || {value:''}).value.trim();
    if (!name)    { showNotification('تکایە ناوت بنووسە!', 'error'); return; }
    if (!mobile)  { showNotification('تکایە ژمارەی مۆبایل بنووسە!', 'error'); return; }
    if (!address) { showNotification('تکایە ناونیشانەکەت بنووسە!', 'error'); return; }

    var orderData = {
        itemName:  productName,
        name:      name,
        mobile:    mobile,
        address:   address,
        details:   'دانە: ' + qty + ' | نرخ: ' + price + ' ' + currency + (note ? ' | تێبینی: ' + note : ''),
        productId: productId,
        qty:       qty,
        price:     price,
        currency:  currency,
        type:      'cart-order',
        status:    'pending',
        timestamp: new Date().toLocaleString('ku'),
        userKey:   _currentUser ? (_currentUser.key || '') : '',
        userName:  _currentUser ? (_currentUser.name || _currentUser.username || '') : ''
    };

    // واتساپ پێشتر بکەرەوە (بلۆک نەبێت)
    function _openWhatsApp() {
        if (!sellerMobile) return;
        var msg = 'سڵاو، کریارێک داوای کڕینی کاڵاکەت کردووە:\n\n'
            + '📦 کاڵا: ' + productName
            + '\n🔢 دانە: ' + qty
            + '\n💰 نرخ: ' + price + ' ' + currency
            + '\n\n👤 کڕیار: ' + name
            + '\n📞 مۆبایل: ' + mobile
            + '\n📍 ناونیشان: ' + address
            + (note ? '\n📝 تێبینی: ' + note : '')
            + '\n\n⏰ داواکاری لە UK BAZAR';
        window.open('https://wa.me/' + sellerMobile.replace(/\D/g,'') + '?text=' + encodeURIComponent(msg), '_blank');
    }

    // داخستنی مۆدال
    var m = document.getElementById('buyerInfoModal');
    if (m) m.remove();

    // پاشەکەوتکردن لە Firebase
    if (!_isFileProtocol()) {
        database.ref('requests').push(orderData)
            .then(function() {
                showNotification('✅ داواکارییەکەت نێردرا و پاشەکەوت کرا!');
                _openWhatsApp();
            })
            .catch(function() {
                // ئەگەر Firebase سەرکەوتوو نەبوو — واتساپ بکەرەوە بەهەر حاڵ
                showNotification('واتساپ کراوەتەوە — داواکاری پاشەکەوت نەکرا', 'error');
                _openWhatsApp();
            });
    } else {
        // file:// — localStorage پاشەکەوت بکە و واتساپ بکەرەوە
        try {
            var lsOrders = JSON.parse(localStorage.getItem('ukbazar_orders') || '[]');
            orderData._key = 'lo_' + Date.now();
            lsOrders.push(orderData);
            localStorage.setItem('ukbazar_orders', JSON.stringify(lsOrders));
        } catch(e) {}
        showNotification('✅ داواکارییەکەت نێردرا!');
        _openWhatsApp();
    }
}

function renderProducts(productsList) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (productsList.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--gray); grid-column: 1/-1;">هیچ کاڵایەک نییە</p>';
        return;
    }
    const reversedList = productsList.slice().reverse();
    grid.innerHTML = reversedList.map(p => createProductCard(p)).join('');
    // نوێکردنەوەی ئایکۆنی دڵخواز
    setTimeout(function() { if (typeof _refreshWishlistIcons === 'function') _refreshWishlistIcons(); }, 50);
}

// ==================== Cart Functions ====================
function addToCart(productId) {
    const product = products.find(p => p.firebaseId === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            currency: product.currency,
            image: product.images ? product.images[0] : null,
            quantity: 1
        });
    }

    updateCartBadge();
    showNotification('کاڵا زیادکرا بە سەبەتە!');
}

function updateCartBadge() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) cartBadge.textContent = totalItems;
}

function showCartModal() {
    if (cart.length === 0) {
        showNotification('سەبەتەکەت بەتاڵە!', 'error');
        return;
    }
    
    let message = "🛒 *داواکاری کڕین لە UK BAZAR*\n\n";
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n   نرخ: ${item.price} ${item.currency} × ${item.quantity}\n\n`;
    });
    
    const whatsappUrl = `https://wa.me/9647755436275?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// ==================== WhatsApp Contact ====================
function contactSellerWhatsApp(mobile, productName) {
    if (!mobile) {
        showNotification('ژمارەی مۆبایل بوونی نییە!', 'error');
        return;
    }
    const message = `سڵاو، من ئارەزووم لە کڕینی: ${productName}`;
    const whatsappUrl = `https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function contactFibWhatsApp() {
    const message = 'سڵاو، من ئارەزووم پارەدان بکەم بۆ کاڵاکانی UK BAZAR';
    const whatsappUrl = 'https://wa.me/9647769654490?text=' + encodeURIComponent(message);
    window.open(whatsappUrl, '_blank');
}

function copyFibNumber() {
    const fibNumber = '7769654490';
    
    navigator.clipboard.writeText(fibNumber).then(function() {
        showNotification('ژمارەی FIB کۆپی کرا: ' + fibNumber + ' ✅');
    }).catch(function() {
        const textarea = document.createElement('textarea');
        textarea.value = fibNumber;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('ژمارەی FIB کۆپی کرا: ' + fibNumber + ' ✅');
    });
}

// ==================== Slider Functions - Quick Loading ====================
function initializeSlider() {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!slidesWrapper || !sliderDots) return;
    
    // یەکسەر وێنەی یەدەگ پیشان بدە
    slidesWrapper.innerHTML = `
        <div class="slide">
            <img src="${DEFAULT_SLIDER_IMAGE}" alt="UK BAZAR" loading="eager">
        </div>
    `;
    
    sliderDots.innerHTML = '<div class="dot active" onclick="goToSlide(0)"></div>';
    
    totalSlides = 1;
    currentSlide = 0;
    startAutoPlay();
    
    // لە پشتەوە وێنە ڕاستەقینەکان بار بکە
    loadRealSliderImages();
}

function loadRealSliderImages() {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    if (!slidesWrapper || !sliderDots) return;

    database.ref('slider').once('value')
        .then((snapshot) => {
            let images = [];

            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const imageUrl = safeUrl(child.val().imageUrl);
                    if (imageUrl && imageUrl.trim() !== '') {
                        images.push({
                            url: imageUrl,
                            title: child.val().title || 'سلایدەر'
                        });
                    }
                });
                if (images.length > 0) images.reverse();
            }

            if (images.length > 0) {
                // وێنەی سلایدەر هەیە — پیشانی بدە
                updateSliderWithImages(images);
            } else if (products.length > 0) {
                // وێنەی سلایدەر نییە — لە کاڵاکان وەربگرە
                images = products.slice().reverse().slice(0, 5).map(p => ({
                    url: p.images && p.images[0] ? p.images[0] : DEFAULT_SLIDER_IMAGE,
                    title: p.name || 'کاڵا'
                }));
                updateSliderWithImages(images);
            } else {
                // هەردووکیان خاوێنن — وێنەی یەدەگ پیشان بدە
                updateSliderWithImages([{ url: DEFAULT_SLIDER_IMAGE, title: 'UK BAZAR' }]);
                // کاتێک کاڵاکان بار بون، دووبارە هەوڵ بدە
                setTimeout(() => {
                    if (products.length > 0) {
                        const fallback = products.slice().reverse().slice(0, 5).map(p => ({
                            url: p.images && p.images[0] ? p.images[0] : DEFAULT_SLIDER_IMAGE,
                            title: p.name || 'کاڵا'
                        }));
                        updateSliderWithImages(fallback);
                    }
                }, 3000);
            }
        })
        .catch((error) => {
            console.error('Error loading slider:', error);
            // هەڵە — وێنەی یەدەگ پیشان بدە
            updateSliderWithImages([{ url: DEFAULT_SLIDER_IMAGE, title: 'UK BAZAR' }]);
        });
}

function updateSliderWithImages(images) {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!slidesWrapper || !sliderDots || !images || images.length === 0) return;
    
    totalSlides = images.length;
    currentSlide = 0;

    // wrapper بمێنێتەوە 100% — هەر slide min-width:100% ە
    slidesWrapper.style.width = '';
    slidesWrapper.style.transform = 'translateX(0)';
    
    // store images array for lightbox navigation
    window._sliderImages = images;

    slidesWrapper.innerHTML = images.map((img, idx) => 
        '<div class="slide" onclick="openSliderLightbox(' + idx + ')" style="cursor:zoom-in;">' +
        '<img src="' + safeUrl(img.url) + '" ' +
        'alt="' + img.title + '" ' +
        'loading="lazy" ' +
        'onerror="this.onerror=null; this.src=\'' + DEFAULT_SLIDER_IMAGE + '\'">' +
        '</div>'
    ).join('');
    
    sliderDots.innerHTML = images.map((_, i) => 
        '<div class="dot ' + (i === 0 ? 'active' : '') + '" onclick="goToSlide(' + i + ')"></div>'
    ).join('');

    startAutoPlay();
}

function updateSlider() {
    const slidesWrapper = document.getElementById('slidesWrapper');
    if (slidesWrapper) {
        // هەر slide = 100% پانی container — translateX(-N*100%)
        slidesWrapper.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    }
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide() {
    if (totalSlides > 0) {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }
}

function prevSlide() {
    if (totalSlides > 0) {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    }
}

function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
        currentSlide = index;
        updateSlider();
    }
}

function startAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
    }
    autoPlayInterval = setInterval(nextSlide, 4000);
}

// ==================== Slider Lightbox ====================
function openSliderLightbox(index) {
    const images = window._sliderImages || [];
    if (!images.length) return;

    // ئۆتۆپلەی ڕابگرێت
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }

    // لایتبۆکس دروست بکە ئەگەر نەبوو
    let lb = document.getElementById('sliderLightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'sliderLightbox';
        lb.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;flex-direction:column;';
        lb.innerHTML = '<button id="sliderLbClose" onclick="closeSliderLightbox()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;color:#fff;font-size:1.8rem;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">&times;</button>'
            + '<div style="position:relative;max-width:98vw;max-height:90vh;display:flex;align-items:center;justify-content:center;">'
            + '<button onclick="prevSliderLightbox()" style="position:absolute;right:-14px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.18);border:none;color:#fff;font-size:1.4rem;width:42px;height:42px;border-radius:50%;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;"><i class="fas fa-chevron-right"></i></button>'
            + '<img id="sliderLbImg" src="" style="max-width:92vw;max-height:86vh;object-fit:contain;border-radius:10px;box-shadow:0 8px 40px rgba(0,0,0,0.5);transition:opacity 0.2s;">'
            + '<button onclick="nextSliderLightbox()" style="position:absolute;left:-14px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.18);border:none;color:#fff;font-size:1.4rem;width:42px;height:42px;border-radius:50%;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;"><i class="fas fa-chevron-left"></i></button>'
            + '</div>'
            + '<p id="sliderLbTitle" style="color:rgba(255,255,255,0.7);margin-top:12px;font-size:0.9rem;text-align:center;padding:0 16px;"></p>'
            + '<p id="sliderLbCounter" style="color:rgba(255,255,255,0.4);font-size:0.8rem;margin-top:4px;"></p>';
        lb.addEventListener('click', function(e) {
            if (e.target === lb) closeSliderLightbox();
        });
        // Keyboard support
        document.addEventListener('keydown', function(e) {
            const lb2 = document.getElementById('sliderLightbox');
            if (!lb2 || lb2.style.display === 'none') return;
            if (e.key === 'ArrowLeft') nextSliderLightbox();
            else if (e.key === 'ArrowRight') prevSliderLightbox();
            else if (e.key === 'Escape') closeSliderLightbox();
        });
        document.body.appendChild(lb);
    }

    window._sliderLbIndex = index;
    _updateSliderLightbox();
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function _updateSliderLightbox() {
    const images = window._sliderImages || [];
    const idx = window._sliderLbIndex || 0;
    const img = images[idx];
    if (!img) return;
    const el = document.getElementById('sliderLbImg');
    if (el) {
        el.style.opacity = '0';
        setTimeout(function() {
            el.src = safeUrl(img.url);
            el.style.opacity = '1';
        }, 150);
    }
    const title = document.getElementById('sliderLbTitle');
    if (title) title.textContent = img.title || '';
    const counter = document.getElementById('sliderLbCounter');
    if (counter) counter.textContent = (idx + 1) + ' / ' + images.length;
}

function nextSliderLightbox() {
    const images = window._sliderImages || [];
    window._sliderLbIndex = ((window._sliderLbIndex || 0) + 1) % images.length;
    _updateSliderLightbox();
}

function prevSliderLightbox() {
    const images = window._sliderImages || [];
    window._sliderLbIndex = ((window._sliderLbIndex || 0) - 1 + images.length) % images.length;
    _updateSliderLightbox();
}

function closeSliderLightbox() {
    var lb = document.getElementById('sliderLightbox');
    if (lb) lb.style.display = 'none';
    document.body.style.overflow = 'auto';
    // ئۆتۆپلەی دووبارە دەستپێبکات
    startAutoPlay();
}

// ==================== Image Modal (kept for backward compat) ====================
function openImageModal(imageSrc) {
    // Open as a single-image gallery
    openProductGallery([imageSrc], [], 0);
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = ['requestModal', 'addProductModal', 'deliveryModal', 'fibModal', 'imageModal', 'ukDeliveryModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (event.target === modal) {
            closeModal(id);
        }
    });
}

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modals = ['requestModal', 'addProductModal', 'deliveryModal', 'fibModal', 'imageModal', 'ukDeliveryModal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && modal.classList.contains('show')) {
                closeModal(id);
            }
        });
    }
});

function onUkCountryChange(val) {
    var note = document.getElementById('ukCountryNote');
    if (!note) return;
    note.style.display = (val && val !== 'United Kingdom') ? 'block' : 'none';
}

function showUkDeliveryModal() { showModal('ukDeliveryModal'); }

// ==================== UK Delivery Form Submission ====================
document.addEventListener('DOMContentLoaded', function() {
    const ukForm = document.getElementById('ukDeliveryForm');
    if (ukForm) {
        ukForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullName    = document.getElementById('ukFullName').value.trim();
            const phone       = document.getElementById('ukPhone').value.trim();
            const company     = document.getElementById('ukCompany').value.trim();
            const postcode    = document.getElementById('ukPostcode').value.trim().toUpperCase();
            const address1    = document.getElementById('ukAddress1').value.trim();
            const address2    = document.getElementById('ukAddress2').value.trim();
            const city        = document.getElementById('ukCity').value.trim();
            const county      = document.getElementById('ukCounty').value.trim();
            const note        = document.getElementById('ukDeliveryNote').value.trim();
            const receiverName    = document.getElementById('ukReceiverName').value.trim();
            const receiverPhone   = document.getElementById('ukReceiverPhone').value.trim();
            const receiverCompany = (document.getElementById('ukReceiverCompany')||{value:''}).value.trim();
            const receiverPost    = (document.getElementById('ukReceiverPostcode')||{value:''}).value.trim().toUpperCase();
            const receiverAddr1   = (document.getElementById('ukReceiverAddress1')||{value:''}).value.trim();
            const receiverAddr2   = (document.getElementById('ukReceiverAddress2')||{value:''}).value.trim();
            const receiverCity    = (document.getElementById('ukReceiverCity')||{value:''}).value.trim();
            const receiverCounty  = (document.getElementById('ukReceiverCounty')||{value:''}).value.trim();
            const receiverNote    = (document.getElementById('ukReceiverNote')||{value:''}).value.trim();
            const receiverCountry = (document.getElementById('ukReceiverCountry')||{value:'United Kingdom'}).value.trim();
            const destinationCity = (document.getElementById('ukDestinationCity')||{value:''}).value.trim();
            const packageName     = document.getElementById('ukPackageName').value.trim();
            const packageQty      = (document.getElementById('ukPackageQty')||{value:''}).value.trim();
            const packageKg       = (document.getElementById('ukPackageKg')||{value:''}).value.trim();
            const payment         = (document.getElementById('ukPayment')||{value:''}).value.trim();
            if (!destinationCity) {
                const el = document.getElementById('ukDestinationCity');
                if (el) el.focus();
                showNotification('تکایە شارەکەی مەبەست هەڵبژێرە / Please select a destination city', 'error');
                return;
            }
            const orderNumber = 'UK-' + Date.now().toString().slice(-6);
            const timestamp   = new Date().toLocaleString('en-GB');
            const deliveryData = {
                type: 'uk', orderNumber,
                fullName, phone, company, postcode, address1, address2, city, county, deliveryNote: note,
                receiverName, receiverPhone, receiverCompany,
                receiverPostcode: receiverPost, receiverAddress1: receiverAddr1, receiverAddress2: receiverAddr2,
                receiverCity, receiverCounty, receiverNote, receiverCountry, destinationCity,
                packageName, packageQty, packageKg, payment, country: 'United Kingdom', timestamp, sortKey: Date.now()
            };
            showLoading();
            database.ref('delivery').push(deliveryData)
                .then(() => {
                    hideLoading();
                    closeModal('ukDeliveryModal');
                    ukForm.reset();
                    ukSwitchTab('sender');
                    showNotification(`✅ UK delivery request submitted! Order: ${orderNumber}`);
                })
                .catch((err) => {
                    hideLoading();
                    console.error('UK delivery error:', err);
                    showNotification('❌ Error submitting request. Please try again.', 'error');
                });
        });
    }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', function() {
    // ---- پاکردنەوەی کاشی کۆن کە URLی http:// تێدایە ----
    try {
        const cached = localStorage.getItem('ukbazar_products');
        if (cached && cached.includes('"http://')) {
            localStorage.removeItem('ukbazar_products');
            localStorage.removeItem('ukbazar_cache_time');
            console.log('Cache cleared: old http:// URLs removed');
        }
    } catch(e) {}

    loadApprovedProducts();
    updateCartBadge();
    loadVideos();

    // Back to Top scroll visibility
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            backToTopBtn.style.opacity = window.pageYOffset > 300 ? '1' : '0.4';
        });
    }

    // سەیف-گارد: ئەگەر لۆدینگ سکرین پاش 4 چرکە هێشتا بوو — بیشارەوە
    setTimeout(() => {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.opacity = '0';
            spinner.style.pointerEvents = 'none';
            spinner.style.display = 'none';
        }
    }, 4000);
});
// ==================== UK Delivery Tab Switching ====================
function ukSwitchTab(tab) {
    const senderPanel   = document.getElementById('ukPanel-sender');
    const receiverPanel = document.getElementById('ukPanel-receiver');
    const senderTab     = document.getElementById('ukTab-sender');
    const receiverTab   = document.getElementById('ukTab-receiver');

    if (tab === 'sender') {
        if (senderPanel)   senderPanel.style.display   = 'block';
        if (receiverPanel) receiverPanel.style.display  = 'none';
        if (senderTab)  { senderTab.style.borderBottom  = '3px solid #D40511'; senderTab.style.color  = '#D40511'; }
        if (receiverTab){ receiverTab.style.borderBottom = '3px solid transparent'; receiverTab.style.color = '#718096'; }
    } else {
        if (senderPanel)   senderPanel.style.display   = 'none';
        if (receiverPanel) receiverPanel.style.display  = 'block';
        if (receiverTab){ receiverTab.style.borderBottom = '3px solid #D40511'; receiverTab.style.color = '#D40511'; }
        if (senderTab)  { senderTab.style.borderBottom  = '3px solid transparent'; senderTab.style.color = '#718096'; }
    }
}

function ukGoToReceiver() {
    const fields = [
        { id: 'ukFullName', msg: 'تکایە ناوی تەواو داخڵ بکە' },
        { id: 'ukPhone',    msg: 'تکایە ژمارەی تەلەفۆن داخڵ بکە' },
        { id: 'ukPostcode', msg: 'تکایە Postcode داخڵ بکە' },
        { id: 'ukAddress1', msg: 'تکایە ناونیشان داخڵ بکە' },
        { id: 'ukCity',     msg: 'تکایە شار داخڵ بکە' },
    ];
    for (const f of fields) {
        const el = document.getElementById(f.id);
        if (!el || !el.value.trim()) {
            if (el) el.focus();
            showNotification(f.msg, 'error');
            return;
        }
    }
    ukSwitchTab('receiver');
}

// ==================== VIDEO SECTION ====================
function getYouTubeId(url) {
    if (!url) return null;
    const p = [/youtu\.be\/([^?&]+)/,/youtube\.com\/watch\?v=([^&]+)/,/youtube\.com\/embed\/([^?&]+)/,/youtube\.com\/shorts\/([^?&]+)/];
    for (const r of p) { const m = url.match(r); if (m) return m[1]; }
    return null;
}
function getYouTubeEmbed(url) {
    const id = getYouTubeId(url);
    return id ? 'https://www.youtube.com/embed/' + id + '?rel=0&modestbranding=1' : null;
}
function getYouTubeThumbnail(url) {
    const id = getYouTubeId(url);
    return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : null;
}

function loadVideos() {
    const section = document.getElementById('videosSection');
    if (section) section.style.display = 'none';
}

function showVideosModal() {
    const modal = document.getElementById('videosModal');
    const grid = document.getElementById('videosModalGrid');
    if (!modal || !grid) { console.error('videosModal not found!'); return; }

    // دڵنیابە display:flex کارا بێت
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.zIndex = '999999';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(0,0,0,0.75)';
    document.body.style.overflow = 'hidden';

    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#aaa;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><p style="margin-top:10px;">چاوەڕوان بکە...</p></div>';
    database.ref('videos').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                grid.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">هیچ ڤیدیۆیەک نییە</p>';
                return;
            }
            const items = [];
            snapshot.forEach(child => {
                const v = child.val();
                if (v.status === 'approved') items.push(sanitizeProduct({ key: child.key, ...v }));
            });
            items.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));
            if (!items.length) {
                grid.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">هیچ ڤیدیۆیەک نییە</p>';
                return;
            }
            grid.innerHTML = items.map(v => createVideoCard(v)).join('');
        })
        .catch((err) => {
            grid.innerHTML = '<p style="text-align:center;color:red;padding:30px;">هەڵە: ' + err.message + '</p>';
        });
}

function closeVideosModal() {
    const modal = document.getElementById('videosModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    modal.querySelectorAll('video').forEach(v => v.pause());
}

function createVideoCard(video) {
    const isYoutube = getYouTubeId(video.videoUrl);
    const thumb = isYoutube ? getYouTubeThumbnail(video.videoUrl) : (video.thumbUrl || '');
    const embedUrl = isYoutube ? getYouTubeEmbed(video.videoUrl) : null;
    const safeTitle = escapeHtml(video.title || 'ڤیدیۆ');
    const safeDesc = escapeHtml(video.description || '');
    const safeName = escapeHtml(video.uploaderName || '');
    const badgeColor = video.type === 'ریکلام' ? '#FF4444' : video.type === 'فیرکاری' ? '#FFD54F' : '#D40511';

    let mediaHtml = '';
    if (embedUrl) {
        const safeEmbed = embedUrl.replace(/'/g, "\\'");
        mediaHtml = '<div class="video-thumb-wrap" onclick="expandVideo(this,\'' + safeEmbed + '\')">' +
            '<img src="' + (thumb||'') + '" alt="' + safeTitle + '" class="video-thumb" onerror="this.src=\'' + DEFAULT_PRODUCT_IMAGE + '\'">' +
            '<div class="video-play-btn"><i class="fas fa-play"></i></div></div>';
    } else if (video.videoUrl) {
        // راستەوخۆ ڤیدیۆ لە Firebase Storage
        mediaHtml = '<div class="video-thumb-wrap direct-video-wrap">' +
            (thumb ? '<img src="' + thumb + '" alt="' + safeTitle + '" class="video-thumb" id="vthumb-' + video.key + '">' : '') +
            '<video class="video-player" id="vplayer-' + video.key + '" preload="none" controls style="display:none;position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;">' +
            '<source src="' + escapeHtml(video.videoUrl) + '" type="video/mp4">' +
            '</video>' +
            '<div class="video-play-btn" onclick="playDirectVideo(\'' + video.key + '\')" id="vplaybtn-' + video.key + '"><i class="fas fa-play"></i></div>' +
            '</div>';
    }

    return '<div class="video-card">' +
        '<div class="video-badge" style="background:' + badgeColor + '">' + escapeHtml(video.type || 'ڤیدیۆ') + '</div>' +
        mediaHtml +
        '<div class="video-info">' +
        '<div class="video-title">' + safeTitle + '</div>' +
        (safeDesc ? '<div class="video-desc">' + safeDesc + '</div>' : '') +
        (safeName ? '<div class="video-uploader"><i class="fas fa-user"></i> ' + safeName + '</div>' : '') +
        '</div></div>';
}

function playDirectVideo(key) {
    const player = document.getElementById('vplayer-' + key);
    const src = player ? player.querySelector('source').src : '';
    openVideoModal(src, false);
}

function expandVideo(wrapper, embedUrl) {
    openVideoModal(embedUrl, true);
}

function openVideoModal(src, isYoutube) {
    var vm = document.getElementById('videosModal');
    if (vm) vm.style.zIndex = '9998';
    var overlay = document.getElementById('videoFullscreenOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'videoFullscreenOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999999;background:rgba(0,0,0,0.96);display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = '<button onclick="closeVideoModal()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.18);border:none;color:#fff;width:48px;height:48px;border-radius:50%;font-size:1.5rem;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;">&#x2715;</button><div id="videoFullscreenInner" style="width:95vw;max-width:960px;"></div>';
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeVideoModal(); });
        document.body.appendChild(overlay);
    }
    var inner = document.getElementById('videoFullscreenInner');
    if (isYoutube) {
        inner.innerHTML = '<div style="position:relative;padding-top:56.25%;width:100%;"><iframe src="' + src + '&autoplay=1&rel=0" frameborder="0" allowfullscreen allow="autoplay;encrypted-media;fullscreen" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:8px;"></iframe></div>';
    } else {
        inner.innerHTML = '<video src="' + src + '" controls autoplay playsinline style="width:100%;max-height:85vh;border-radius:8px;display:block;background:#000;"></video>';
        setTimeout(function() { var v = inner.querySelector('video'); if (v) v.play().catch(function(){}); }, 80);
    }
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    var overlay = document.getElementById('videoFullscreenOverlay');
    if (!overlay) return;
    var inner = document.getElementById('videoFullscreenInner');
    if (inner) inner.innerHTML = '';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    var vm = document.getElementById('videosModal');
    if (vm && vm.style.display === 'flex') vm.style.zIndex = '999999';
}

// ==================== Admin: Video Management ====================
function showVideoAdminForm() {
    const content = document.getElementById('adminContent');
    if (!content) return;

    content.innerHTML = `
    <div style="background:#fff;padding:20px;border-radius:14px;margin-bottom:16px;">
        <h3 style="color:var(--primary);margin-bottom:16px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-video"></i> زیادکردنی ڤیدیۆ
        </h3>

        <!-- جۆری سەرچاوە -->
        <div class="form-group">
            <label>جۆری سەرچاوەی ڤیدیۆ:</label>
            <div style="display:flex;gap:10px;margin-top:6px;">
                <button type="button" id="srcYoutube" onclick="switchVideoSource('youtube')"
                    style="flex:1;padding:10px;border-radius:10px;border:2px solid #D40511;background:#D40511;color:#fff;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;">
                    <i class="fab fa-youtube"></i> YouTube لینک
                </button>
                <button type="button" id="srcUpload" onclick="switchVideoSource('upload')"
                    style="flex:1;padding:10px;border-radius:10px;border:2px solid #e2e8f0;background:#fff;color:#1C1C1C;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;">
                    <i class="fas fa-upload"></i> ئەپلۆد کردن
                </button>
            </div>
        </div>

        <form id="videoAdminForm">
            <div class="form-group">
                <label>جۆری ڤیدیۆ:</label>
                <select id="videoType" style="width:100%;padding:10px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;">
                    <option value="فرۆشیار">📦 فرۆشیار — کاڵا نیشان دەدات</option>
                    <option value="ریکلام">📣 ریکلام</option>
                    <option value="فیرکاری">📚 فیرکاری</option>
                </select>
            </div>
            <div class="form-group">
                <label>ناونیشانی ڤیدیۆ:</label>
                <input type="text" id="videoTitle" placeholder="بنووسە..." required>
            </div>

            <!-- YouTube panel -->
            <div id="youtubePanel">
                <div class="form-group">
                    <label>لینکی YouTube:</label>
                    <input type="url" id="videoUrl" placeholder="https://youtube.com/watch?v=..." style="direction:ltr;">
                    <div id="videoPreviewWrap" style="margin-top:8px;display:none;border-radius:10px;overflow:hidden;">
                        <img id="videoPreviewThumb" src="" style="width:100%;max-height:160px;object-fit:cover;">
                    </div>
                </div>
            </div>

            <!-- Upload panel -->
            <div id="uploadPanel" style="display:none;">
                <div class="form-group">
                    <label>فایلی ڤیدیۆ هەڵبژێرە: <span style="color:#718096;font-size:.8rem;">(MP4, MOV, AVI)</span></label>
                    <input type="file" id="videoFile" accept="video/*">
                    <div id="uploadProgress" style="display:none;margin-top:10px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-size:.82rem;color:#D40511;font-weight:700;">بارکردن...</span>
                            <span id="uploadPct" style="font-size:.82rem;color:#D40511;font-weight:700;">0%</span>
                        </div>
                        <div style="background:#e2e8f0;border-radius:50px;height:8px;overflow:hidden;">
                            <div id="uploadBar" style="height:100%;background:linear-gradient(90deg,#D40511,#A50008);width:0%;border-radius:50px;transition:width .2s;"></div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>وێنەی کەڤەر (دڵخواز): <span style="color:#718096;font-size:.8rem;">thumbnail</span></label>
                    <input type="file" id="videoThumb" accept="image/*">
                    <div id="thumbPreviewWrap" style="display:none;margin-top:8px;">
                        <img id="thumbPreviewImg" src="" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;">
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>وردەکاری (دڵخواز):</label>
                <textarea id="videoDescription" placeholder="دەربارەی ڤیدیۆ..." rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>ناوی بارکەر:</label>
                <input type="text" id="videoUploaderName" placeholder="ناوت بنووسە...">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-secondary" id="videoSubmitBtn">
                    <i class="fas fa-upload"></i> زیادکردن
                </button>
                <button type="button" class="btn btn-danger" onclick="showAdminTab('products')">
                    <i class="fas fa-times"></i> پاشگەزبوونەوە
                </button>
            </div>
        </form>
    </div>

    <div style="background:#fff;padding:20px;border-radius:14px;">
        <h3 style="color:var(--danger);margin-bottom:14px;"><i class="fas fa-list"></i> هەموو ڤیدیۆکان</h3>
        <div id="videoListAdmin"><p style="text-align:center;color:var(--gray);">چاوەڕوانی بکە...</p></div>
    </div>`;

    // YouTube live preview
    const urlInput = document.getElementById('videoUrl');
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            const thumb = getYouTubeThumbnail(this.value.trim());
            const wrap = document.getElementById('videoPreviewWrap');
            const img  = document.getElementById('videoPreviewThumb');
            if (thumb) { img.src = thumb; wrap.style.display = 'block'; }
            else { wrap.style.display = 'none'; }
        });
    }

    // Thumbnail preview
    const thumbInput = document.getElementById('videoThumb');
    if (thumbInput) {
        thumbInput.addEventListener('change', function() {
            if (!this.files[0]) return;
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('thumbPreviewImg').src = e.target.result;
                document.getElementById('thumbPreviewWrap').style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        });
    }

    // Form submit
    const form = document.getElementById('videoAdminForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const sourceMode = document.getElementById('uploadPanel').style.display === 'block' ? 'upload' : 'youtube';
            const btn = document.getElementById('videoSubmitBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> چاوەڕوانی...';

            let finalVideoUrl = '';
            let finalThumbUrl = '';

            try {
                if (sourceMode === 'youtube') {
                    finalVideoUrl = (document.getElementById('videoUrl').value || '').trim();
                    if (!finalVideoUrl) { showNotification('لینکی YouTube داخڵ بکە!', 'error'); btn.disabled=false; btn.innerHTML='<i class="fas fa-upload"></i> زیادکردن'; return; }
                } else {
                    // Upload video file
                    const videoFile = document.getElementById('videoFile').files[0];
                    if (!videoFile) { showNotification('فایلی ڤیدیۆ هەڵبژێرە!', 'error'); btn.disabled=false; btn.innerHTML='<i class="fas fa-upload"></i> زیادکردن'; return; }

                    // Show progress bar
                    document.getElementById('uploadProgress').style.display = 'block';

                    const videoRef = storage.ref('videos/' + Date.now() + '_' + videoFile.name.replace(/\s/g,'_'));
                    const uploadTask = videoRef.put(videoFile);

                    finalVideoUrl = await new Promise((resolve, reject) => {
                        uploadTask.on('state_changed',
                            (snap) => {
                                const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                                document.getElementById('uploadBar').style.width = pct + '%';
                                document.getElementById('uploadPct').textContent = pct + '%';
                            },
                            reject,
                            async () => { resolve(await uploadTask.snapshot.ref.getDownloadURL()); }
                        );
                    });

                    // Upload thumbnail if provided
                    const thumbFile = document.getElementById('videoThumb').files[0];
                    if (thumbFile) {
                        const thumbRef = storage.ref('video-thumbs/' + Date.now() + '_' + thumbFile.name.replace(/\s/g,'_'));
                        const tSnap = await thumbRef.put(thumbFile);
                        finalThumbUrl = await tSnap.ref.getDownloadURL();
                    }
                }

                const videoData = {
                    type:         document.getElementById('videoType').value,
                    title:        document.getElementById('videoTitle').value.trim(),
                    videoUrl:     finalVideoUrl,
                    thumbUrl:     finalThumbUrl,
                    description:  document.getElementById('videoDescription').value.trim(),
                    uploaderName: document.getElementById('videoUploaderName').value.trim(),
                    status:       'approved',
                    timestamp:    new Date().toLocaleString('ku'),
                    sortKey:      Date.now()
                };

                await database.ref('videos').push(videoData);
                showNotification('✅ ڤیدیۆ بە سەرکەوتوویی زیادکرا!');
                form.reset();
                document.getElementById('videoPreviewWrap').style.display = 'none';
                document.getElementById('thumbPreviewWrap').style.display = 'none';
                document.getElementById('uploadProgress').style.display = 'none';
                document.getElementById('uploadBar').style.width = '0%';
                loadVideoListAdmin();
                loadVideos();

            } catch(err) {
                console.error(err);
                showNotification('هەڵە لە بارکردن: ' + err.message, 'error');
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload"></i> زیادکردن';
        });
    }

    loadVideoListAdmin();
}

function switchVideoSource(mode) {
    const youtubeBtn = document.getElementById('srcYoutube');
    const uploadBtn  = document.getElementById('srcUpload');
    const youtubePanel = document.getElementById('youtubePanel');
    const uploadPanel  = document.getElementById('uploadPanel');
    if (mode === 'youtube') {
        youtubePanel.style.display = 'block';
        uploadPanel.style.display  = 'none';
        youtubeBtn.style.background = '#D40511'; youtubeBtn.style.color = '#fff'; youtubeBtn.style.borderColor = '#D40511';
        uploadBtn.style.background  = '#fff';    uploadBtn.style.color  = '#1C1C1C'; uploadBtn.style.borderColor = '#e2e8f0';
    } else {
        youtubePanel.style.display = 'none';
        uploadPanel.style.display  = 'block';
        uploadBtn.style.background  = '#D40511'; uploadBtn.style.color = '#fff'; uploadBtn.style.borderColor = '#D40511';
        youtubeBtn.style.background = '#fff';    youtubeBtn.style.color = '#1C1C1C'; youtubeBtn.style.borderColor = '#e2e8f0';
    }
}

function loadVideoListAdmin() {
    const container = document.getElementById('videoListAdmin');
    if (!container) return;
    container.style.maxHeight = 'none';
    container.style.overflow = 'visible';

    database.ref('videos').once('value')
        .then(function(snapshot) {
            if (!snapshot.exists()) {
                container.innerHTML = '<p style="text-align:center;color:var(--gray);">هیچ ڤیدیۆیەک نییە</p>';
                return;
            }
            const items = [];
            snapshot.forEach(function(child) {
                items.push({ key: child.key, ...child.val() });
            });
            items.sort(function(a, b) { return (b.sortKey || 0) - (a.sortKey || 0); });

            let html = '<p style="font-size:.82rem;color:#718096;margin-bottom:10px;">کۆی ڤیدیۆکان: <strong>' + items.length + '</strong></p>';
            items.forEach(function(v) {
                const thumb = v.thumbUrl || getYouTubeThumbnail(v.videoUrl) || '';
                const bc = v.type === '\u0695\u06CC\u06A9\u0644\u0627\u0645' ? '#FF4444' : v.type === '\u0641\u06CC\u0631\u06A9\u0627\u0631\u06CC' ? '#FFD54F' : '#D40511';
                const isYT = !!getYouTubeId(v.videoUrl);
                const srcIcon = isYT ? '<i class="fab fa-youtube" style="color:#FF4444;"></i>' : '<i class="fas fa-file-video" style="color:#D40511;"></i>';
                const statusColor = v.status === 'approved' ? '#FFD54F' : '#f59e0b';
                const statusLabel = v.status === 'approved' ? '✅' : '⏳';
                html += '<div style="display:flex;gap:12px;align-items:center;background:#f8f9ff;border-radius:12px;padding:12px;margin-bottom:10px;border:1.5px solid #e2e8f0;">';
                if (thumb) {
                    html += '<img src="' + thumb + '" style="width:80px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.display=\'none\'">';
                } else {
                    html += '<div style="width:80px;height:54px;background:#e2e8f0;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🎬</div>';
                }
                html += '<div style="flex:1;min-width:0;">';
                html += '<div style="font-weight:700;font-size:.9rem;color:#1C1C1C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(v.title || 'ڤیدیۆ') + '</div>';
                html += '<div style="margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">';
                html += '<span style="background:' + bc + ';color:#fff;padding:2px 8px;border-radius:20px;font-size:.72rem;">' + escapeHtml(v.type || '') + '</span>';
                html += '<span style="background:' + statusColor + ';color:#fff;padding:2px 6px;border-radius:20px;font-size:.68rem;">' + statusLabel + ' ' + escapeHtml(v.status || 'pending') + '</span>';
                html += srcIcon + '</div>';
                html += '<div style="font-size:.75rem;color:#718096;margin-top:3px;">' + escapeHtml(v.uploaderName || '') + ' — ' + escapeHtml(v.timestamp || '') + '</div>';
                html += '</div>';
                html += '<button onclick="deleteVideo(\'' + v.key + '\')" style="background:#fff0f0;color:#D40511;border:1.5px solid #FF8A80;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.82rem;flex-shrink:0;"><i class="fas fa-trash"></i></button>';
                html += '</div>';
            });
            container.innerHTML = html;
        })
        .catch(function(err) {
            console.error('loadVideoListAdmin error:', err);
            container.innerHTML = '<p style="text-align:center;color:var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

function deleteVideo(key) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم ڤیدیۆیە؟')) return;
    database.ref('videos/' + key).remove()
        .then(() => { showNotification('ڤیدیۆ سڕایەوە 🗑️'); loadVideoListAdmin(); loadVideos(); })
        .catch(() => showNotification('هەڵە لە سڕینەوە!', 'error'));
}

// ==================== International Post ====================

const INTL_COUNTRIES = [
  {name:'United Kingdom', flag:'🇬🇧', code:'gb'}, {name:'Germany', flag:'🇩🇪', code:'de'}, {name:'France', flag:'🇫🇷', code:'fr'},
  {name:'Netherlands', flag:'🇳🇱', code:'nl'}, {name:'Belgium', flag:'🇧🇪', code:'be'}, {name:'Sweden', flag:'🇸🇪', code:'se'},
  {name:'Norway', flag:'🇳🇴', code:'no'}, {name:'Denmark', flag:'🇩🇰', code:'dk'}, {name:'Finland', flag:'🇫🇮', code:'fi'},
  {name:'Austria', flag:'🇦🇹', code:'at'}, {name:'Switzerland', flag:'🇨🇭', code:'ch'}, {name:'Italy', flag:'🇮🇹', code:'it'},
  {name:'Spain', flag:'🇪🇸', code:'es'}, {name:'Poland', flag:'🇵🇱', code:'pl'}, {name:'Czech Republic', flag:'🇨🇿', code:'cz'},
  {name:'USA', flag:'🇺🇸', code:'us'}, {name:'Canada', flag:'🇨🇦', code:'ca'}, {name:'Australia', flag:'🇦🇺', code:'au'},
  {name:'UAE', flag:'🇦🇪', code:'ae'}, {name:'Turkey', flag:'🇹🇷', code:'tr'}, {name:'Kuwait', flag:'🇰🇼', code:'kw'},
  {name:'Saudi Arabia', flag:'🇸🇦', code:'sa'}, {name:'Qatar', flag:'🇶🇦', code:'qa'}, {name:'Bahrain', flag:'🇧🇭', code:'bh'},
  {name:'Jordan', flag:'🇯🇴', code:'jo'}, {name:'Lebanon', flag:'🇱🇧', code:'lb'}, {name:'Egypt', flag:'🇪🇬', code:'eg'},
  {name:'Iraq', flag:'🇮🇶', code:'iq'}, {name:'Iran', flag:'🇮🇷', code:'ir'}, {name:'Greece', flag:'🇬🇷', code:'gr'},
  {name:'Portugal', flag:'🇵🇹', code:'pt'}, {name:'Romania', flag:'🇷🇴', code:'ro'}, {name:'Hungary', flag:'🇭🇺', code:'hu'},
  {name:'Japan', flag:'🇯🇵', code:'jp'}, {name:'South Korea', flag:'🇰🇷', code:'kr'}, {name:'China', flag:'🇨🇳', code:'cn'},
  {name:'India', flag:'🇮🇳', code:'in'}, {name:'Pakistan', flag:'🇵🇰', code:'pk'}, {name:'Bangladesh', flag:'🇧🇩', code:'bd'},
  {name:'Malaysia', flag:'🇲🇾', code:'my'}, {name:'Singapore', flag:'🇸🇬', code:'sg'}, {name:'New Zealand', flag:'🇳🇿', code:'nz'},
  {name:'South Africa', flag:'🇿🇦', code:'za'}, {name:'Brazil', flag:'🇧🇷', code:'br'}, {name:'Mexico', flag:'🇲🇽', code:'mx'}
];

function loadIntlPost() {
    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<p style="text-align:center;">چاوەڕوانی بکە...</p>';

    const IS = 'width:100%;padding:5px 8px;border:1px solid #e2e8f0;border-radius:5px;font-size:.8rem;margin-bottom:6px;box-sizing:border-box;';

    const countryOptions = INTL_COUNTRIES.map(c =>
        '<option value="' + c.flag + ' ' + c.name + '">' + c.flag + ' ' + c.name + '</option>'
    ).join('');

    const formHtml = '<div id="intl-form-box" style="background:#fff;border:1.5px solid #FFE082;border-radius:10px;padding:14px;margin-bottom:16px;">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #FFE082;padding-bottom:6px;margin-bottom:12px;">'
        + '<h4 style="color:#D40511;margin:0;">✉️ New Shipment — بارناستەی تازە</h4>'
        + '<button onclick="toggleIntlForm()" id="intl-form-toggle" style="background:#FFF9C4;color:#D40511;border:1.5px solid #FFE082;border-radius:6px;padding:4px 12px;font-size:.8rem;cursor:pointer;">🔽 داخستن</button>'
        + '</div>'
        + '<div id="intl-form-fields">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
        + '<div style="border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;background:#FFFDE7;">'
        + '<div style="font-weight:700;color:#1C1C1C;margin-bottom:8px;font-size:.9rem;">📤 SENDER — نێردەر</div>'
        + '<label style="font-size:.75rem;color:#718096;">NAME</label><input id="ip-s-name" type="text" placeholder="Sender name" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">KALA/</label><input id="ip-s-kala" type="text" placeholder="Item / کاڵا" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">POST CODE + CITY</label><input id="ip-s-postcode" type="text" placeholder="Post code + City" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">TEL</label><input id="ip-s-tel" type="tel" placeholder="Phone number" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">ADDRESS</label><input id="ip-s-address" type="text" placeholder="Full address" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">WEIGHT + BOX</label><input id="ip-s-weight" type="text" placeholder="e.g. 2kg / Box 30x20x10" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">Notes and payments</label><input id="ip-s-notes" type="text" placeholder="Notes / Amount paid" style="' + IS + '">'
        + '</div>'
        + '<div style="border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;background:#FFFDE7;">'
        + '<div style="font-weight:700;color:#1C1C1C;margin-bottom:8px;font-size:.9rem;">📬 RECIPIENT — وەرگر</div>'
        + '<label style="font-size:.75rem;color:#718096;">NAME</label><input id="ip-r-name" type="text" placeholder="Recipient name" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">KALA/</label><input id="ip-r-kala" type="text" placeholder="Item / کاڵا" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">POST CODE + CITY</label><input id="ip-r-postcode" type="text" placeholder="Post code + City" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">TEL</label><input id="ip-r-tel" type="tel" placeholder="Phone number" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">ADDRESS</label><input id="ip-r-address" type="text" placeholder="Full address" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">WEIGHT + BOX</label><input id="ip-r-weight" type="text" placeholder="e.g. 2kg / Box 30x20x10" style="' + IS + '">'
        + '<label style="font-size:.75rem;color:#718096;">Notes and payments</label><input id="ip-r-notes" type="text" placeholder="Notes / Amount paid" style="' + IS + '">'
        + '</div></div>'
        + '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
        + '<label style="font-weight:700;color:#1C1C1C;">🌍 Destination Country:</label>'
        + '<select id="ip-country" style="padding:6px 10px;border:1.5px solid #FFE082;border-radius:6px;font-size:.9rem;background:#fff;">'
        + '<option value="">-- Select Country --</option>'
        + countryOptions
        + '</select></div>'
        + '<div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">'
        + '<button onclick="saveIntlPost()" style="background:#D40511;color:#fff;border:none;border-radius:7px;padding:8px 20px;font-size:.9rem;font-weight:700;cursor:pointer;">💾 پاشەکەوتکردن</button>'
        + '<button onclick="clearIntlForm()" style="background:#e2e8f0;color:#1C1C1C;border:none;border-radius:7px;padding:8px 16px;font-size:.85rem;cursor:pointer;">🗑️ سڕینەوە</button>'
        + '</div></div></div>';

    database.ref('intlPost').once('value').then(snapshot => {
        let listHtml = '';
        if (!snapshot.exists()) {
            listHtml = '<p style="text-align:center;color:#aaa;padding:20px;">هیچ تۆمارێک نییە.</p>';
        } else {
            const items = [];
            snapshot.forEach(function(ch) {
                var v = ch.val();
                if (v && typeof v === 'object') {
                    items.push(Object.assign({key: ch.key}, v));
                }
            });
            console.log('items after forEach:', items.length);
            listHtml = '<h3 style="color:#D40511;border-bottom:2px solid #FFE082;padding-bottom:6px;margin:0 0 12px;">🌍 تۆمارەکان (' + items.length + ')</h3>';
            listHtml += '<div style="display:flex;flex-direction:column;gap:10px;">';
            var INTL_STATUS_FORM = [
                { key: 'registered',  ku: 'تۆماركراوە',      icon: '📋', color: '#D40511' },
                { key: 'loading',     ku: 'بارکراوە',         icon: '🏭', color: '#E6B800' },
                { key: 'in_transit',  ku: 'لەڕێگادایە',      icon: '🚛', color: '#D40511' },
                { key: 'delivered',   ku: 'گەیشتووە',        icon: '✅', color: '#FFCC00' },
                { key: 'sorting',     ku: 'دابەشکردن',       icon: '📦', color: '#D40511' },
            ];

            items.forEach(function(d) {
                var flag = d.country ? d.country.split(' ')[0] : '🌍';
                var cname = d.country ? d.country.split(' ').slice(1).join(' ') : '—';
                var orderNum = d.orderNumber || '—';
                var curStatus = d.status || 'registered';
                var si = INTL_STATUS_FORM.findIndex(function(s){ return s.key === curStatus; });
                if (si < 0) si = 0;
                var st = INTL_STATUS_FORM[si];
                var statusOptions = INTL_STATUS_FORM.map(function(s) {
                    return '<option value="' + s.key + '"' + (s.key === curStatus ? ' selected' : '') + '>' + s.icon + ' ' + s.ku + '</option>';
                }).join('');

                listHtml += '<div style="border:2px solid ' + st.color + '44;border-radius:10px;background:#fff;overflow:hidden;font-family:\'Segoe UI\',Arial,sans-serif;direction:ltr;">'
                  + '<div style="background:' + st.color + ';color:#fff;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">'
                  + '<span style="font-weight:900;font-size:.95rem;letter-spacing:1px;"># ' + orderNum + '</span>'
                  + '<span style="font-weight:700;font-size:.8rem;">' + flag + ' ' + cname + ' — ' + (d.timestamp||'') + '</span>'
                  + '<div style="display:flex;gap:6px;">'
                  + '<button onclick="printIntlPost(\'' + d.key + '\')" style="background:#fff;color:#D40511;border:none;border-radius:5px;padding:3px 10px;font-size:.75rem;font-weight:700;cursor:pointer;">🖨️ Print</button>'
                  + '<button onclick="editIntlPost(\'' + d.key + '\')" style="background:#FFFDE7;color:#E6B800;border:none;border-radius:5px;padding:3px 10px;font-size:.75rem;font-weight:700;cursor:pointer;">✏️ Edit</button>'
                  + '<button onclick="deleteIntlPost(\'' + d.key + '\')" style="background:#FFCDD2;color:#A50008;border:none;border-radius:5px;padding:3px 8px;font-size:.75rem;cursor:pointer;">🗑️</button>'
                  + '</div></div>'
                  + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">'
                  + intlSideHtml('📤 SENDER', d.sender)
                  + intlSideHtml('📬 RECIPIENT', d.recipient)
                  + '</div>'
                  + '<div style="padding:8px 12px;border-top:1px solid #e2e8f0;background:#FFFDE7;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
                  + '<span style="font-size:.78rem;font-weight:700;color:#4a5568;">📊 ستاتەسی کاڵا:</span>'
                  + '<select onchange="updateIntlStatus(\'' + d.key + '\', this.value)" style="flex:1;min-width:180px;padding:6px 10px;border:2px solid ' + st.color + ';border-radius:8px;font-size:.82rem;cursor:pointer;font-family:inherit;background:#fff;color:#1C1C1C;font-weight:600;">'
                  + statusOptions
                  + '</select>'
                  + '</div>'
                  + '<div style="padding:8px 12px;border-top:1px solid #e2e8f0;background:#FFFDE7;">'
                  + '<div style="font-size:.75rem;font-weight:800;color:#E6B800;margin-bottom:5px;">🚗 شۆفیر و گەیاندن</div>'
                  + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
                  + '<input id="ip-driver-name-' + d.key + '" type="text" placeholder="👤 ناوی شۆفیر" value="' + (d.driverName||'') + '" style="flex:1;min-width:120px;padding:5px 8px;border:1.5px solid #9ae6b4;border-radius:7px;font-size:.78rem;">'
                  + '<input id="ip-driver-mobile-' + d.key + '" type="tel" placeholder="📞 ژمارەی مۆبایل" value="' + (d.driverMobile||'') + '" style="flex:1;min-width:120px;padding:5px 8px;border:1.5px solid #9ae6b4;border-radius:7px;font-size:.78rem;">'
                  + '<button onclick="saveIntlDriverInfo(\'' + d.key + '\')" style="padding:5px 14px;background:#FFCC00;color:#fff;border:none;border-radius:7px;font-size:.78rem;font-weight:700;cursor:pointer;">💾 پاشەکەوت</button>'
                  + '</div></div>'
                  + '</div>';
            });
            listHtml += '</div>';
        }

        content.innerHTML = '<div id="intl-form-top" style="direction:ltr;font-family:\'Segoe UI\',Arial,sans-serif;padding:10px;">'
            + '<h3 style="text-align:center;color:#A50008;margin-bottom:16px;">🌍 International Post — پۆستی نێودەوڵەتی</h3>'
            + formHtml
            + '<div id="intl-list">' + listHtml + '</div>'
            + '</div>';

    }).catch(err => {
        console.error('loadIntlPost error:', err);
        content.innerHTML = '<p style="text-align:center;color:red;">هەڵە لە بارکردن!</p>';
    });
}

function toggleIntlForm() {
    const fields = document.getElementById('intl-form-fields');
    const btn = document.getElementById('intl-form-toggle');
    if (!fields || !btn) return;
    if (fields.style.display === 'none') {
        fields.style.display = 'block';
        btn.textContent = '🔼 داخستن';
        const top = document.getElementById('intl-form-top');
        if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        fields.style.display = 'none';
        btn.textContent = '➕ تۆماری تازە';
    }
}


function ipInput() {
    return 'width:100%;padding:5px 8px;border:1px solid #e2e8f0;border-radius:5px;font-size:.8rem;margin-bottom:6px;box-sizing:border-box;';
}

function clearIntlForm() {
    ['ip-s-name','ip-s-kala','ip-s-postcode','ip-s-tel','ip-s-address','ip-s-weight','ip-s-notes',
     'ip-r-name','ip-r-kala','ip-r-postcode','ip-r-tel','ip-r-address','ip-r-weight','ip-r-notes']
    .forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
    const ct = document.getElementById('ip-country'); if(ct) ct.value='';
}

function g(id) { return (document.getElementById(id)||{value:''}).value.trim(); }

function saveIntlPost() {
    const data = {
        sender:    { name:g('ip-s-name'), kala:g('ip-s-kala'), postcode:g('ip-s-postcode'), tel:g('ip-s-tel'), address:g('ip-s-address'), weight:g('ip-s-weight'), notes:g('ip-s-notes') },
        recipient: { name:g('ip-r-name'), kala:g('ip-r-kala'), postcode:g('ip-r-postcode'), tel:g('ip-r-tel'), address:g('ip-r-address'), weight:g('ip-r-weight'), notes:g('ip-r-notes') },
        country:   g('ip-country'),
        timestamp: new Date().toLocaleString(),
        sortKey:   Date.now()
    };
    if (!data.sender.name && !data.recipient.name) { showNotification('تکایە زانیاری بنووسە!', 'error'); return; }

    // ژمارەی پسولە
    database.ref('intlCounter').transaction((current) => {
        return (current || 0) + 1;
    }).then((result) => {
        data.orderNumber = 'IP-' + String(result.snapshot.val()).padStart(3, '0');
        return database.ref('intlPost').push(data);
    }).then(() => {
            showNotification('پاشەکەوت کرا ✅');
            clearIntlForm();
            loadIntlPost();
            setTimeout(() => {
                const list = document.getElementById('intl-list');
                if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 600);
        })
        .catch(() => showNotification('هەڵە!', 'error'));
}

function loadIntlList() {
    var container = document.getElementById('intl-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#718096;">بارکردن...</p>';
    database.ref('intlPost').once('value', function(snap) {
        if (!snap.exists()) {
            container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">هیچ تۆمارێک نییە.</p>';
            return;
        }
        var items = [];
        snap.forEach(function(ch) { items.push(Object.assign({key: ch.key}, ch.val())); });
        items.sort(function(a,b) {
            var na = parseInt((a.orderNumber||'').replace(/[^0-9]/g,'')) || 0;
            var nb = parseInt((b.orderNumber||'').replace(/[^0-9]/g,'')) || 0;
            return nb - na || (b.sortKey||0) - (a.sortKey||0);
        });

        var INTL_STATUS = [
            { key: 'registered',   ku: 'تۆماركراوە',      icon: '📋', color: '#D40511' },
            { key: 'loading',      ku: 'بارکراوە',         icon: '🏭', color: '#E6B800' },
            { key: 'in_transit',   ku: 'لەڕێگادایە',      icon: '🚛', color: '#D40511' },
            { key: 'delivered',    ku: 'گەیشتووە',        icon: '✅', color: '#FFCC00' },
            { key: 'sorting',      ku: 'دابەشکردن',       icon: '📦', color: '#D40511' },
        ];

        var html = '<h3 style="color:#D40511;border-bottom:2px solid #FFE082;padding-bottom:6px;margin:0 0 12px;">🌍 تۆمارەکان (' + items.length + ')</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:10px;">';
        items.forEach(function(d) {
            var flag = d.country ? d.country.split(' ')[0] : '🌍';
            var cname = d.country ? d.country.split(' ').slice(1).join(' ') : '—';
            var orderNum = d.orderNumber || '—';
            var curStatus = d.status || 'registered';
            var si = INTL_STATUS.findIndex(function(s){ return s.key === curStatus; });
            if (si < 0) si = 0;
            var st = INTL_STATUS[si];

            var statusOptions = INTL_STATUS.map(function(s) {
                return '<option value="' + s.key + '"' + (s.key === curStatus ? ' selected' : '') + '>' + s.icon + ' ' + s.ku + '</option>';
            }).join('');

            html += '<div style="border:2px solid ' + st.color + '44;border-radius:10px;background:#fff;overflow:hidden;font-family:\'Segoe UI\',Arial,sans-serif;direction:ltr;margin-bottom:2px;">'
              // Header
              + '<div style="background:' + st.color + ';color:#fff;padding:7px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">'
              + '<span style="font-weight:900;font-size:.95rem;letter-spacing:1px;"># ' + orderNum + '</span>'
              + '<span style="font-weight:700;font-size:.8rem;">' + flag + ' ' + cname + ' — ' + (d.timestamp||'') + '</span>'
              + '<div style="display:flex;gap:6px;">'
              + '<button onclick="printIntlPost(\'' + d.key + '\')" style="background:#fff;color:#D40511;border:none;border-radius:5px;padding:3px 10px;font-size:.75rem;font-weight:700;cursor:pointer;">🖨️ Print</button>'
              + '<button onclick="deleteIntlPost(\'' + d.key + '\')" style="background:#FFCDD2;color:#A50008;border:none;border-radius:5px;padding:3px 8px;font-size:.75rem;cursor:pointer;">🗑️</button>'
              + '</div></div>'
              // Sender / Recipient
              + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">'
              + intlSideHtml('📤 SENDER', d.sender)
              + intlSideHtml('📬 RECIPIENT', d.recipient)
              + '</div>'
              // Status selector
              + '<div style="padding:8px 12px;border-top:1px solid #e2e8f0;background:#FFFDE7;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
              + '<span style="font-size:.78rem;font-weight:700;color:#4a5568;">📍 ستاتەس:</span>'
              + '<select onchange="updateIntlStatus(\'' + d.key + '\', this.value)" style="flex:1;min-width:160px;padding:5px 8px;border:1.5px solid #FFE082;border-radius:7px;font-size:.8rem;cursor:pointer;font-family:inherit;">'
              + statusOptions
              + '</select>'
              + '</div>'
              // Driver
              + '<div style="padding:8px 12px;border-top:1px solid #e2e8f0;background:#FFFDE7;">'
              + '<div style="font-size:.75rem;font-weight:800;color:#E6B800;margin-bottom:5px;">🚗 شۆفیر و گەیاندن</div>'
              + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
              + '<input id="ip-driver-name-' + d.key + '" type="text" placeholder="👤 ناوی شۆفیر" value="' + (d.driverName||'') + '" style="flex:1;min-width:120px;padding:5px 8px;border:1.5px solid #9ae6b4;border-radius:7px;font-size:.78rem;">'
              + '<input id="ip-driver-mobile-' + d.key + '" type="tel" placeholder="📞 ژمارەی مۆبایل" value="' + (d.driverMobile||'') + '" style="flex:1;min-width:120px;padding:5px 8px;border:1.5px solid #9ae6b4;border-radius:7px;font-size:.78rem;">'
              + '<button onclick="saveIntlDriverInfo(\'' + d.key + '\')" style="padding:5px 14px;background:#FFCC00;color:#fff;border:none;border-radius:7px;font-size:.78rem;font-weight:700;cursor:pointer;">💾 پاشەکەوت</button>'
              + '</div></div>'
              + '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    });
}

function intlSideHtml(title, s) {
    if (!s || typeof s !== 'object') return `<div style="padding:8px 12px;border-right:1px solid #e2e8f0;"><b style="color:#D40511;font-size:.8rem;">${title}</b><p style="color:#aaa;font-size:.75rem;margin:4px 0;">—</p></div>`;
    const row = (l,v) => v ? `<div style="display:flex;border-bottom:1px dotted #e2e8f0;font-size:.75rem;padding:2px 0;"><span style="color:#718096;width:110px;flex-shrink:0;">${l}</span><span style="color:#1C1C1C;font-weight:600;">${v}</span></div>` : '';
    return `<div style="padding:8px 12px;border-right:1px solid #e2e8f0;">
      <div style="font-weight:700;color:#D40511;margin-bottom:6px;font-size:.8rem;">${title}</div>
      ${row('NAME:', s.name)} ${row('KALA/', s.kala)} ${row('POST CODE+CITY:', s.postcode)}
      ${row('TEL:', s.tel)} ${row('ADDRESS:', s.address)} ${row('WEIGHT+BOX:', s.weight)} ${row('Notes/Pay:', s.notes)}
    </div>`;
}

function deleteIntlPost(key) {
    if (!confirm('دڵنیایت لە سڕینەوە؟')) return;
    database.ref('intlPost/' + key).remove()
        .then(() => { showNotification('سڕایەوە 🗑️'); loadIntlPost(); })
        .catch(() => showNotification('هەڵە!', 'error'));
}

function printIntlPost(key) {
    database.ref('intlPost/' + key).once('value', snap => {
        if (!snap.exists()) return;
        const d = snap.val();
        const s = d.sender || {};
        const r = d.recipient || {};
        const flag = d.country ? d.country.split(' ')[0] : '🌍';
        const cname = d.country ? d.country.split(' ').slice(1).join(' ') : '';

        // دۆزینەوەی country code بۆ وینەی ئەلا
        const countryObj = INTL_COUNTRIES.find(c => c.name === cname || c.flag === flag);
        const code = countryObj ? countryObj.code : '';
        const flagImg = code
            ? '<img src="https://flagcdn.com/h40/' + code + '.png" style="height:32px;width:auto;border-radius:3px;border:1px solid rgba(255,255,255,.3);" alt="' + cname + '">'
            : '<span style="font-size:2.8rem;line-height:1;">' + flag + '</span>';

        const row = (l, v) => '<tr><td class="lbl" style="padding:3px 7px;color:#333;border:1.5px solid #aaa;width:38%;font-size:.82rem;font-weight:800;">' + l + '</td><td style="padding:3px 7px;border:1.5px solid #aaa;font-size:.82rem;font-weight:700;color:#111;">' + (v||'') + '</td></tr>';

        const box = (title, person, showQr) => '<div class="no-break" style="border:2px solid #A50008;border-radius:6px;margin-bottom:10px;overflow:hidden;">'
          + '<div style="background:#A50008;color:#fff;padding:5px 10px;font-size:.85rem;font-weight:900;display:flex;justify-content:space-between;align-items:center;">'
          + '<span>' + title + '</span>'
          + '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">'
          + flagImg
          + '<span style="font-size:.65rem;color:#FFE082;letter-spacing:.5px;font-weight:700;">' + cname.toUpperCase() + '</span>'
          + '</div></div>'
          + '<table style="width:100%;border-collapse:collapse;">'
          + row('NAME:', person.name)
          + row('KALA/', person.kala)
          + row('POST CODE +CITY', person.postcode)
          + row('TEL', person.tel)
          + row('ADDRESS', person.address)
          + row('WEIGHT+BOX', person.weight)
          + row('Notes and payments', person.notes)
          + '</table>'
          + (showQr ? '<div style="display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 14px;background:#FFFDE7;border-top:1px solid #e2e8f0;">'
            + '<img id="intl-qr-img" src="' + qrUrl + '" style="width:80px;height:80px;display:block;border-radius:6px;" alt="QR">'
            + '<div style="text-align:center;">'
            + '<div style="font-size:.75rem;font-weight:900;color:#A50008;letter-spacing:.5px;">QR CODE</div>'
            + '<div style="font-size:.68rem;color:#718096;margin-top:3px;">' + (d.orderNumber||'') + '</div>'
            + '</div></div>' : '')
          + '<div style="background:#A50008;color:#fff;padding:5px 14px;font-size:.72rem;display:flex;justify-content:space-between;align-items:center;">'
          + '<span>KING STREET - UK POST &nbsp;&nbsp; 07755436275 / 07507472656 / 07449218670</span>'
          + (code ? '<img src="https://flagcdn.com/h20/gb.png" style="height:14px;" alt="GB">' : '<span>🇬🇧</span>')
          + '</div></div>';

        const qrData = encodeURIComponent('# ' + (d.orderNumber||'') + ' | SENDER: ' + (s.name||'') + ' ' + (s.tel||'') + ' | RECIPIENT: ' + (r.name||'') + ' ' + (r.tel||'') + ' | ' + cname);
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=' + qrData;

      const html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
          + '<style>'
          + '@page{size:A5;margin:5mm;}'
          + '*{box-sizing:border-box;}'
          + 'body{font-family:Arial,sans-serif;margin:0;padding:4px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
          + 'img{display:inline-block;}'
          + '.no-break{page-break-inside:avoid;break-inside:avoid;}'
          + 'td{font-size:.82rem !important;font-weight:700 !important;color:#111 !important;}'
          + '.lbl{font-size:.82rem !important;font-weight:800 !important;color:#333 !important;}'
          + '@media print{#dl-btn{display:none !important;}}'
          + '</style>'
          + '</head><body>'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;border-bottom:2px solid #A50008;padding-bottom:6px;">'
          + '<div style="display:flex;align-items:center;gap:6px;">'
          + '<img src="data:image/png;base64,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" style="height:52px;width:auto;object-fit:contain;" alt="King Street">'
          + '<img src="data:image/jpeg;base64,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" style="height:52px;width:auto;object-fit:contain;" alt="UK Post">'
          + '</div>'
          + '<div style="text-align:center;">'
          + '<div style="font-size:1rem;font-weight:900;color:#A50008;white-space:nowrap;"># ' + (d.orderNumber||'—') + '</div>'
          + '<div style="font-size:.78rem;font-weight:800;color:#A50008;">UK POST - KING STREET</div>'
          + '<div style="font-size:.65rem;color:#718096;">' + (d.timestamp||'') + '</div>'
          + '</div>'
          + '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:3px;">'
          + (code ? '<img src="https://flagcdn.com/h40/' + code + '.png" style="height:28px;border-radius:2px;" alt="' + cname + '">' : '<span style="font-size:1.8rem;">' + flag + '</span>')
          + '<div style="font-size:.65rem;color:#A50008;font-weight:800;">' + cname.toUpperCase() + '</div>'
          + '<div style="font-size:.65rem;color:#E6B800;font-weight:800;">📞 07449218670</div>'
          + '</div></div>'
          + box('SENDER &nbsp;—&nbsp; نێردەر', s)
          + box('recipient &nbsp;--&nbsp; وەرگر', r, true)

          + '<script>'
          + 'var qrImg = document.getElementById("intl-qr-img");'
          + 'function doPrint(){ window.focus(); window.print(); }'
          + 'if(qrImg.complete){ setTimeout(doPrint, 300); }'
          + 'else { qrImg.onload = function(){ setTimeout(doPrint, 300); }; qrImg.onerror = function(){ setTimeout(doPrint, 300); }; }'
          + '<\/script>'
          + '</body></html>';

        // Mobile-friendly: blob URL approach
        _mobilePrint(html, 'label-' + (d.orderNumber||'IP'));
    });
}

// ==================== Edit Intl Post ====================
function editIntlPost(key) {
    database.ref('intlPost/' + key).once('value', function(snap) {
        if (!snap.exists()) { showNotification('تۆمار نەدۆزرایەوە', 'error'); return; }
        var d = snap.val();
        var s = d.sender || {};
        var r = d.recipient || {};

        var modal = document.createElement('div');
        modal.id = 'editIntlModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:12px;';

        var inp = function(id, val, ph) {
            return '<input id="eip-' + id + '" type="text" value="' + (val||'').replace(/"/g,'&quot;') + '" placeholder="' + ph + '" style="width:100%;padding:6px 8px;border:1.5px solid #FFE082;border-radius:7px;font-size:.82rem;box-sizing:border-box;margin-bottom:6px;font-family:inherit;">';
        };

        modal.innerHTML = '<div style="background:#fff;border-radius:14px;padding:18px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.2);">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">'
          + '<h3 style="margin:0;color:#A50008;font-size:1rem;">✏️ دەستکاری پۆستی نێودەوڵەتی</h3>'
          + '<button onclick="document.getElementById(\'editIntlModal\').remove()" style="background:#FFCDD2;color:#A50008;border:none;border-radius:7px;padding:5px 10px;cursor:pointer;font-size:.9rem;">✕</button>'
          + '</div>'
          + '<div style="background:#FFF9C4;border-radius:8px;padding:10px 12px;margin-bottom:12px;">'
          + '<div style="font-size:.75rem;font-weight:800;color:#D40511;margin-bottom:6px;">📤 SENDER — نێردەر</div>'
          + inp('s-name', s.name, 'Name') + inp('s-kala', s.kala, 'Kala') + inp('s-postcode', s.postcode, 'Post Code + City') + inp('s-tel', s.tel, 'Tel') + inp('s-address', s.address, 'Address') + inp('s-weight', s.weight, 'Weight+Box') + inp('s-notes', s.notes, 'Notes')
          + '</div>'
          + '<div style="background:#FFFDE7;border-radius:8px;padding:10px 12px;margin-bottom:14px;">'
          + '<div style="font-size:.75rem;font-weight:800;color:#E6B800;margin-bottom:6px;">📬 RECIPIENT — وەرگر</div>'
          + inp('r-name', r.name, 'Name') + inp('r-kala', r.kala, 'Kala') + inp('r-postcode', r.postcode, 'Post Code + City') + inp('r-tel', r.tel, 'Tel') + inp('r-address', r.address, 'Address') + inp('r-weight', r.weight, 'Weight+Box') + inp('r-notes', r.notes, 'Notes')
          + '</div>'
          + '<div style="display:flex;gap:8px;">'
          + '<button onclick="saveEditIntlPost(\'' + key + '\')" style="flex:1;padding:10px;background:linear-gradient(135deg,#A50008,#D40511);color:#fff;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;">💾 پاشەکەوتکردن</button>'
          + '<button onclick="document.getElementById(\'editIntlModal\').remove()" style="padding:10px 16px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.85rem;cursor:pointer;">داخستن</button>'
          + '</div>'
          + '</div>';

        document.body.appendChild(modal);
        modal.addEventListener('click', function(e){ if(e.target===modal) modal.remove(); });
    });
}

function saveEditIntlPost(key) {
    var g2 = function(id){ var el = document.getElementById('eip-' + id); return el ? el.value.trim() : ''; };
    var updated = {
        sender:    { name:g2('s-name'), kala:g2('s-kala'), postcode:g2('s-postcode'), tel:g2('s-tel'), address:g2('s-address'), weight:g2('s-weight'), notes:g2('s-notes') },
        recipient: { name:g2('r-name'), kala:g2('r-kala'), postcode:g2('r-postcode'), tel:g2('r-tel'), address:g2('r-address'), weight:g2('r-weight'), notes:g2('r-notes') }
    };
    database.ref('intlPost/' + key).update(updated).then(function() {
        showNotification('نوێکرایەوە ✅');
        var m = document.getElementById('editIntlModal');
        if (m) m.remove();
        loadIntlPost();
    }).catch(function() { showNotification('هەڵە لە پاشەکەوتکردن!', 'error'); });
}

// ============================================================
//  ADMIN: Driver Management — بەڕێوەبردنی شۆفیرەکان
// ============================================================
function loadDriversAdmin() {
    var content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<p style="text-align:center;padding:20px;color:#718096;">بارکردن...</p>';

    function renderDriversPage(drivers) {

        var formHtml = `
        <div style="background:#fff;border-radius:14px;padding:18px;margin-bottom:18px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:2px solid #FFE082;">
          <h3 style="color:#A50008;margin:0 0 14px;font-size:1rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-user-plus"></i> زیادکردنی شۆفیری نوێ</h3>
          <!-- وێنەی شۆفیر -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;padding:10px;background:#FFFDE7;border-radius:10px;border:1.5px dashed #FFE082;">
            <div id="newDriverPhotoPreview" style="width:64px;height:64px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:2rem;overflow:hidden;flex-shrink:0;">🚗</div>
            <div style="flex:1;">
              <label style="font-size:.75rem;font-weight:700;color:#4a5568;display:block;margin-bottom:4px;">📷 وێنەی شۆفیر</label>
              <input type="file" id="newDriverPhoto" accept="image/*" onchange="previewDriverPhoto(this,'newDriverPhotoPreview')" style="width:100%;font-size:.8rem;font-family:inherit;">
              <div style="font-size:.68rem;color:#a0aec0;margin-top:3px;">JPG, PNG — زیاتر لە 1MB مەبێت</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div>
              <label style="font-size:.75rem;font-weight:700;color:#4a5568;display:block;margin-bottom:4px;">👤 ناوی شۆفیر</label>
              <input type="text" id="newDriverName" placeholder="ناوی تەواو..." style="width:100%;padding:9px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:#4a5568;display:block;margin-bottom:4px;">📱 ژمارەی مۆبایل</label>
              <input type="tel" id="newDriverMobile" placeholder="07xxxxxxxxx" style="width:100%;padding:9px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;direction:ltr;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:#4a5568;display:block;margin-bottom:4px;">🔑 ناوی بەکارهێنەر (username)</label>
              <input type="text" id="newDriverUsername" placeholder="driver1..." style="width:100%;padding:9px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;direction:ltr;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:700;color:#4a5568;display:block;margin-bottom:4px;">🔒 وشەی تێپەڕ</label>
              <input type="text" id="newDriverPassword" placeholder="وشەی تێپەڕ..." style="width:100%;padding:9px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.85rem;font-family:inherit;outline:none;direction:ltr;box-sizing:border-box;">
            </div>
          </div>
          <button onclick="saveNewDriver()" style="padding:10px 20px;background:linear-gradient(135deg,#A50008,#D40511);color:#fff;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;">
            <i class="fas fa-save"></i> زیادکردن
          </button>
        </div>`;

        var listHtml = '<h3 style="color:#D40511;margin:0 0 12px;font-size:.95rem;border-bottom:2px solid #FFE082;padding-bottom:8px;">🚗 شۆفیرەکان (' + drivers.length + ')</h3>';
        if (drivers.length === 0) {
            listHtml += '<div style="text-align:center;padding:24px;color:#a0aec0;">هیچ شۆفیرێک تۆمار نەکراوە</div>';
        } else {
            listHtml += '<div style="display:flex;flex-direction:column;gap:10px;">';
            drivers.forEach(function(d) {
                listHtml += '<div style="background:#fff;border-radius:12px;padding:14px;border:1.5px solid #e2e8f0;box-shadow:0 1px 6px rgba(0,0,0,.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
                  + '<div style="display:flex;align-items:center;gap:12px;">'
                    + (d.photo ? '<img src="' + d.photo + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #FFE082;">' : '<div style="width:44px;height:44px;background:linear-gradient(135deg,#A50008,#D40511);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;flex-shrink:0;">🚗</div>')
                    + '<div>'
                      + '<div style="font-weight:800;font-size:.9rem;color:#1C1C1C;">' + escapeHtml(d.name || '—') + '</div>'
                      + '<div style="font-size:.75rem;color:#718096;">📱 ' + escapeHtml(d.mobile || '—') + ' &nbsp;|&nbsp; 👤 ' + escapeHtml(d.username || '—') + '</div>'
                    + '</div>'
                  + '</div>'
                  + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
                    + '<button onclick="viewDriver(\'' + d.key + '\')" style="padding:5px 12px;background:#FFF9C4;color:#D40511;border:1.5px solid #FFE082;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">👁️ بینین</button>'
                    + '<button onclick="printDriver(\'' + d.key + '\')" style="padding:5px 12px;background:#FFFDE7;color:#E6B800;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;">🖨️ چاپ</button>'
                    + '<button onclick="resetDriverPassword(\'' + d.key + '\')" style="padding:5px 12px;background:#FFFDE7;color:#E6B800;border:1.5px solid #FFCC00;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-key"></i> وشە</button>'
                    + '<button onclick="deleteDriver(\'' + d.key + '\')" style="padding:5px 12px;background:#FFF8F8;color:#A50008;border:1.5px solid #FFCDD2;border-radius:8px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-trash"></i></button>'
                  + '</div>'
                + '</div>';
            });
            listHtml += '</div>';
        }

        content.innerHTML = '<div style="padding:4px;">' + formHtml + listHtml + '</div>';
    }

    // بە هەر حاڵێک فۆرمەکە پیشان بدە — ئەگەر Firebase کار نەکرد لیستی بەتاڵ نیشان بدە
    try {
        database.ref('drivers').once('value').then(function(snap) {
            var drivers = [];
            if (snap.exists()) snap.forEach(function(ch) { drivers.push(Object.assign({ key: ch.key }, ch.val())); });
            renderDriversPage(drivers);
        }).catch(function() {
            renderDriversPage([]); // فۆرمەکە پیشان بدە حتی ئەگەر هەڵە هەبوو
        });
    } catch(e) {
        renderDriversPage([]);
    }
}

function saveNewDriver() {
    var name     = ((document.getElementById('newDriverName') || {}).value || '').trim();
    var mobile   = ((document.getElementById('newDriverMobile') || {}).value || '').trim();
    var username = ((document.getElementById('newDriverUsername') || {}).value || '').trim();
    var password = ((document.getElementById('newDriverPassword') || {}).value || '').trim();
    if (!name || !username || !password) { showNotification('تکایە هەموو خانەکان پڕبکەرەوە!', 'error'); return; }

    var photoFile = (document.getElementById('newDriverPhoto') || {}).files && document.getElementById('newDriverPhoto').files[0];
    function doSave(photoBase64) {
        var data = { name: name, mobile: mobile, username: username, password: password, kuBalance: 0, createdAt: new Date().toLocaleString() };
        if (photoBase64) data.photo = photoBase64;
        database.ref('drivers').push(data)
            .then(function() { showNotification('شۆفیر زیادکرا ✅'); loadDriversAdmin(); })
            .catch(function() { showNotification('هەڵە لە زیادکردن!', 'error'); });
    }

    if (photoFile) {
        if (photoFile.size > 1024 * 1024) { showNotification('وێنەکە زۆر گەورەیە! زیاتر لە 1MB مەبێت', 'error'); return; }
        var reader = new FileReader();
        reader.onload = function(e) { doSave(e.target.result); };
        reader.readAsDataURL(photoFile);
    } else {
        doSave(null);
    }
}

function previewDriverPhoto(input, previewId) {
    var preview = document.getElementById(previewId);
    if (!preview || !input.files || !input.files[0]) return;
    if (input.files[0].size > 1024 * 1024) { showNotification('وێنەکە زۆر گەورەیە! زیاتر لە 1MB مەبێت', 'error'); input.value=''; return; }
    var reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
    };
    reader.readAsDataURL(input.files[0]);
}

function deleteDriver(key) {
    if (!confirm('دڵنیایت لە سڕینەوەی شۆفیر؟')) return;
    database.ref('drivers/' + key).remove()
        .then(function() { showNotification('سڕایەوە 🗑️'); loadDriversAdmin(); })
        .catch(function() { showNotification('هەڵە!', 'error'); });
}

function resetDriverPassword(key) {
    var old = document.getElementById('_resetPassModal');
    if(old) old.remove();
    var modal = document.createElement('div');
    modal.id = '_resetPassModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:22px;width:100%;max-width:340px;box-shadow:0 12px 40px rgba(0,0,0,.2);">
        <div style="font-weight:900;color:#A50008;font-size:1rem;margin-bottom:14px;">🔑 گۆڕینی وشەی تێپەڕ</div>
        <div style="position:relative;margin-bottom:14px;">
          <input id="_newPassInput" type="password" placeholder="وشەی تێپەڕی نوێ..."
            style="width:100%;padding:11px 44px 11px 14px;border:2px solid #FFE082;border-radius:10px;font-size:.95rem;font-family:inherit;box-sizing:border-box;direction:ltr;"
            onkeydown="if(event.key==='Enter')_doResetPass('${key}')">
          <button type="button" onclick="(function(b){var i=document.getElementById('_newPassInput');if(i.type==='password'){i.type='text';b.innerHTML='🙈';}else{i.type='password';b.innerHTML='👁';}})(this)"
            style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1rem;">👁</button>
        </div>
        <div style="display:flex;gap:8px;">
          <button onclick="document.getElementById('_resetPassModal').remove()"
            style="flex:1;padding:10px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;">پاشگەزبوونەوە</button>
          <button onclick="_doResetPass('${key}')"
            style="flex:2;padding:10px;background:linear-gradient(135deg,#E6B800,#f59e0b);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;">پاشەکەوتکردن</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
    setTimeout(function(){var i=document.getElementById('_newPassInput');if(i)i.focus();},80);
}
function _doResetPass(key) {
    var inp = document.getElementById('_newPassInput');
    var newPass = inp ? inp.value.trim() : '';
    if (!newPass) { showNotification('وشەی تێپەڕ بنووسە!', 'error'); return; }
    database.ref('drivers/' + key).update({ password: newPass })
        .then(function() { showNotification('وشەی تێپەڕ گۆڕایەوە ✅'); var m=document.getElementById('_resetPassModal');if(m)m.remove(); })
        .catch(function() { showNotification('هەڵە!', 'error'); });
}


// ==================== Balance & Expenses Admin ====================

var _EXP_CAT_ICONS = {
    'کرێ':'🏠','مووچە':'👤','گواستنەوە':'🚚','کاڵا':'📦',
    'پارەی پارک':'🅿️','خۆراک':'🍽️','تەکنەلۆجیا':'💻',
    'ئەندازیاری':'🔧','بڕوانامە':'📋','تر':'📌'
};
var _EXP_CAT_COLORS = {
    'کرێ':'#D40511','مووچە':'#FFCC00','گواستنەوە':'#D40511','کاڵا':'#D40511',
    'پارەی پارک':'#38b2ac','خۆراک':'#D40511','تەکنەلۆجیا':'#D40511',
    'ئەندازیاری':'#E6B800','بڕوانامە':'#E6B800','تر':'#718096'
};

function _expFmt(amount, currency) {
    var n = parseFloat(amount || 0);
    if (currency === 'IQD') return n.toLocaleString('en') + ' IQD';
    var sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return sym + n.toFixed(2);
}

function _expSumByCurrency(list) {
    var t = {};
    list.forEach(function(e) {
        var c = e.currency || 'GBP';
        t[c] = (t[c] || 0) + (parseFloat(e.amount) || 0);
    });
    return t;
}

function _expFmtTotals(totals) {
    var parts = [];
    if (totals['GBP']) parts.push('£' + totals['GBP'].toFixed(2));
    if (totals['EUR']) parts.push('€' + totals['EUR'].toFixed(2));
    if (totals['USD']) parts.push('$' + totals['USD'].toFixed(2));
    if (totals['IQD']) parts.push(Math.round(totals['IQD']).toLocaleString() + ' IQD');
    return parts.length ? parts.join(' + ') : '—';
}

function loadBalanceAdmin() {
    var content = document.getElementById('adminContent');
    if (!content) return;

    var catOptions = Object.keys(_EXP_CAT_ICONS).map(function(k) {
        return '<option value="' + k + '">' + _EXP_CAT_ICONS[k] + ' ' + k + '</option>';
    }).join('');

    content.innerHTML = '<div style="padding:16px;max-width:900px;margin:0 auto;direction:rtl;">'

        // ── کارتەکانی پوخت ──
        + '<div id="bal-summary" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px;"></div>'

        // ── فۆرمی زیادکردن ──
        + '<div style="background:#fff;border:2px solid #E6B800;border-radius:14px;padding:16px;margin-bottom:16px;">'
          + '<div style="font-size:1rem;font-weight:900;color:#E6B800;margin-bottom:12px;"><i class="fas fa-plus-circle"></i> خەرجیی نوێ زیاد بکە</div>'
          + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
            + '<div>'
              + '<label style="font-size:.78rem;font-weight:700;color:#555;display:block;margin-bottom:4px;">١ — ناوی خەرجی</label>'
              + '<input id="exp-name" type="text" placeholder="بۆ نموونە: کرێی مەخزەن" style="width:100%;padding:8px 10px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.85rem;font-family:inherit;box-sizing:border-box;">'
            + '</div>'
            + '<div>'
              + '<label style="font-size:.78rem;font-weight:700;color:#555;display:block;margin-bottom:4px;">٢ — بری پارە</label>'
              + '<div style="display:flex;gap:5px;">'
                + '<select id="exp-currency" style="padding:8px 6px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.82rem;font-family:inherit;background:#fff;min-width:70px;flex-shrink:0;">'
                  + '<option value="GBP">£ GBP</option><option value="EUR">€ EUR</option>'
                  + '<option value="USD">$ USD</option><option value="IQD">IQD دینار</option>'
                + '</select>'
                + '<input id="exp-amount" type="number" min="0" step="0.01" placeholder="0.00" style="flex:1;padding:8px 10px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.85rem;font-family:inherit;box-sizing:border-box;">'
              + '</div>'
            + '</div>'
            + '<div>'
              + '<label style="font-size:.78rem;font-weight:700;color:#555;display:block;margin-bottom:4px;">٣ — بابەت / جۆر</label>'
              + '<select id="exp-category" style="width:100%;padding:8px 10px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.85rem;font-family:inherit;box-sizing:border-box;background:#fff;">'
                + '<option value="">— جۆری خەرجی هەڵبژێرە —</option>' + catOptions
              + '</select>'
            + '</div>'
            + '<div>'
              + '<label style="font-size:.78rem;font-weight:700;color:#555;display:block;margin-bottom:4px;">٤ — بەروار</label>'
              + '<input id="exp-date" type="date" style="width:100%;padding:8px 10px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.85rem;font-family:inherit;box-sizing:border-box;">'
            + '</div>'
          + '</div>'
          + '<div style="margin-top:10px;">'
            + '<label style="font-size:.78rem;font-weight:700;color:#555;display:block;margin-bottom:4px;">تێبینی (ئارەزوومەندانە)</label>'
            + '<input id="exp-note" type="text" placeholder="تێبینی..." style="width:100%;padding:8px 10px;border:1.5px solid #FFF9C4;border-radius:8px;font-size:.85rem;font-family:inherit;box-sizing:border-box;">'
          + '</div>'
          + '<div style="margin-top:12px;display:flex;gap:8px;">'
            + '<button onclick="saveExpense()" style="flex:1;padding:10px;background:linear-gradient(135deg,#E6B800,#FFCC00);color:#fff;border:none;border-radius:10px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;"><i class="fas fa-save"></i> پاشەکەوتکردن</button>'
            + '<button onclick="clearExpenseForm()" style="padding:10px 16px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.85rem;cursor:pointer;font-family:inherit;">پاككردنەوە</button>'
          + '</div>'
        + '</div>'

        // ── فیلتەر ──
        + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
          + '<input id="exp-search" type="text" placeholder="🔍 گەڕان بە ناو یان تێبینی..." oninput="filterExpenses()" style="flex:1;min-width:140px;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.82rem;font-family:inherit;">'
          + '<select id="exp-filter-cat" onchange="filterExpenses()" style="padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.82rem;font-family:inherit;background:#fff;">'
            + '<option value="">هەموو جۆرەکان</option>' + catOptions
          + '</select>'
          + '<select id="exp-filter-month" onchange="filterExpenses()" style="padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.82rem;font-family:inherit;background:#fff;">'
            + '<option value="">هەموو مانگەکان</option>'
            + '<option value="01">کانوونی دووەم</option><option value="02">شوبات</option>'
            + '<option value="03">ئازار</option><option value="04">نیسان</option>'
            + '<option value="05">ئایار</option><option value="06">حوزەیران</option>'
            + '<option value="07">تەممووز</option><option value="08">ئاب</option>'
            + '<option value="09">ئەیلوول</option><option value="10">تشرینی یەکەم</option>'
            + '<option value="11">تشرینی دووەم</option><option value="12">کانوونی یەکەم</option>'
          + '</select>'
        + '</div>'

        // ── ئەنجامی فیلتەر ──
        + '<div id="exp-filter-bar" style="display:none;background:#FFF9C4;border:1.5px solid #FFE082;border-radius:10px;padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">'
          + '<span id="exp-filter-info" style="font-size:.78rem;color:#D40511;font-weight:700;"></span>'
          + '<button onclick="_expClearFilters()" style="background:none;border:none;color:#D40511;cursor:pointer;font-family:inherit;font-size:.78rem;font-weight:700;">✕ پاككردنەوەی فیلتەر</button>'
        + '</div>'

        // ── دوگمەی Excel ──
        + '<div style="display:flex;justify-content:flex-start;margin-bottom:10px;">'
          + '<button onclick="exportExpensesToExcel()" style="display:flex;align-items:center;gap:7px;background:linear-gradient(135deg,#1d6f42,#217346);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(29,111,66,.3);">'
            + '<i class="fas fa-file-excel" style="font-size:1rem;"></i>'
            + ' داگرتنی Excel — هەموو خەرجیەکان'
          + '</button>'
        + '</div>'

        // ── لیست ──
        + '<div id="exp-list" style="display:flex;flex-direction:column;gap:8px;"></div>'

        // ── پانێلی وردەکاری (چەپ بە ژێر) ──
        + '<div id="exp-detail-panel" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;overflow-y:auto;padding:16px;" onclick="_expCloseDetail(event)">'
          + '<div id="exp-detail-inner" style="background:#fff;border-radius:18px;max-width:480px;margin:0 auto;overflow:hidden;direction:rtl;" onclick="event.stopPropagation()">'
          + '</div>'
        + '</div>'

    + '</div>';

    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
    _loadExpensesFromDB();
}

function _loadExpensesFromDB() {
    var listEl = document.getElementById('exp-list');
    if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#D40511;"><i class="fas fa-spinner fa-spin"></i> بارەکەیە...</div>';

    database.ref('expenses').orderByChild('timestamp').once('value', function(snap) {
        window._expensesCache = [];
        snap.forEach(function(ch) {
            window._expensesCache.unshift({ key: ch.key, ...ch.val() });
        });
        _renderExpenses(window._expensesCache);
        _renderBalanceSummary(window._expensesCache);
    }, function() {
        if (listEl) listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#D40511;">هەڵەی بارکردن</div>';
    });
}

function _renderBalanceSummary(list) {
    var el = document.getElementById('bal-summary');
    if (!el) return;

    var today = new Date().toISOString().split('T')[0];
    var m = new Date().toISOString().slice(0,7);
    var todayItems = list.filter(function(e){ return (e.date||'').startsWith(today); });
    var monthItems = list.filter(function(e){ return (e.date||'').startsWith(m); });

    var cards = [
        { icon:'fas fa-list',         label:'کۆی تۆمارەکان', val: list.length + ' تۆمار',                          color:'#A50008', bg:'#FFF9C4' },
        { icon:'fas fa-coins',        label:'کۆی گشتی',       val: _expFmtTotals(_expSumByCurrency(list)),          color:'#E6B800', bg:'#FFFDE7' },
        { icon:'fas fa-calendar-day', label:'خەرجی ئەمرۆ',    val: _expFmtTotals(_expSumByCurrency(todayItems))||'—', color:'#E6B800', bg:'#FFFDE7' },
        { icon:'fas fa-calendar-alt', label:'خەرجی ئەم مانگە',val: _expFmtTotals(_expSumByCurrency(monthItems))||'—',color:'#A50008', bg:'#FFF8F8' },
    ];
    el.innerHTML = cards.map(function(c) {
        return '<div style="background:' + c.bg + ';border:1.5px solid ' + c.color + '33;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:8px;">'
            + '<i class="' + c.icon + '" style="font-size:1.1rem;color:' + c.color + ';flex-shrink:0;"></i>'
            + '<div>'
              + '<div style="font-size:.65rem;color:#718096;font-weight:700;line-height:1.2;">' + c.label + '</div>'
              + '<div style="font-size:.84rem;font-weight:900;color:' + c.color + ';line-height:1.3;">' + c.val + '</div>'
            + '</div>'
          + '</div>';
    }).join('');
}

function _renderExpenses(list) {
    var el = document.getElementById('exp-list');
    if (!el) return;

    // نوێکردنەوەی بارەی فیلتەر
    var bar = document.getElementById('exp-filter-bar');
    var info = document.getElementById('exp-filter-info');
    var q   = (document.getElementById('exp-search') ? document.getElementById('exp-search').value : '') || '';
    var cat = (document.getElementById('exp-filter-cat') ? document.getElementById('exp-filter-cat').value : '') || '';
    var mon = (document.getElementById('exp-filter-month') ? document.getElementById('exp-filter-month').value : '') || '';
    var isFiltered = q || cat || mon;
    if (bar) bar.style.display = isFiltered ? 'flex' : 'none';
    if (info && isFiltered) {
        info.textContent = list.length + ' تۆمار دۆزراوە — کۆی: ' + _expFmtTotals(_expSumByCurrency(list));
    }

    if (!list.length) {
        el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#a0aec0;">'
            + '<div style="font-size:2.2rem;margin-bottom:8px;">🔍</div>'
            + '<div style="font-weight:700;font-size:.9rem;">هیچ خەرجیەک نەدۆزرایەوە</div>'
            + '</div>';
        return;
    }

    el.innerHTML = list.map(function(e) {
        var cat  = e.category || 'تر';
        var icon = _EXP_CAT_ICONS[cat]  || '📌';
        var clr  = _EXP_CAT_COLORS[cat] || '#718096';
        var amt  = _expFmt(e.amount, e.currency);

        return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:13px;padding:12px 14px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:box-shadow .15s;" '
            + 'onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.1)\'" '
            + 'onmouseout="this.style.boxShadow=\'none\'" '
            + 'onclick="viewExpense(\'' + e.key + '\')">'

            // ئایکۆن + بری پارە
            + '<div style="background:' + clr + '18;border:1.5px solid ' + clr + '44;border-radius:10px;padding:8px 10px;text-align:center;min-width:58px;flex-shrink:0;">'
              + '<div style="font-size:1.25rem;line-height:1;">' + icon + '</div>'
              + '<div style="font-size:.82rem;font-weight:900;color:' + clr + ';margin-top:2px;white-space:nowrap;">' + amt + '</div>'
            + '</div>'

            // زانیاریەکان
            + '<div style="flex:1;min-width:0;">'
              + '<div style="font-size:.9rem;font-weight:800;color:#1C1C1C;margin-bottom:3px;">' + escapeHtml(e.name||'—') + '</div>'
              + '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">'
                + '<span style="background:' + clr + '18;color:' + clr + ';border-radius:6px;padding:1px 8px;font-size:.7rem;font-weight:700;">' + cat + '</span>'
                + (e.date ? '<span style="font-size:.72rem;color:#a0aec0;">' + escapeHtml(e.date) + '</span>' : '')
                + (e.note ? '<span style="font-size:.72rem;color:#718096;font-style:italic;">— ' + escapeHtml(e.note) + '</span>' : '')
              + '</div>'
            + '</div>'

            // دوگمەکان
            + '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">'
              + '<button onclick="event.stopPropagation();printExpense(\'' + e.key + '\')" style="background:#FFFDE7;color:#E6B800;border:none;border-radius:7px;padding:5px 9px;font-size:.75rem;cursor:pointer;">🖨️</button>'
              + '<button onclick="event.stopPropagation();deleteExpense(\'' + e.key + '\')" style="background:#FFCDD2;color:#A50008;border:none;border-radius:7px;padding:5px 9px;font-size:.75rem;cursor:pointer;">🗑️</button>'
            + '</div>'

            + '<div style="color:#d1d5db;font-size:1.1rem;flex-shrink:0;">›</div>'
        + '</div>';
    }).join('');
}

function filterExpenses() {
    if (!window._expensesCache) return;
    var q   = ((document.getElementById('exp-search')||{}).value||'').toLowerCase();
    var cat = (document.getElementById('exp-filter-cat')||{}).value||'';
    var mon = (document.getElementById('exp-filter-month')||{}).value||'';
    var list = window._expensesCache.filter(function(e) {
        var mQ   = !q   || (e.name||'').toLowerCase().includes(q) || (e.note||'').toLowerCase().includes(q);
        var mCat = !cat || e.category === cat;
        var mMon = !mon || (e.date||'').slice(5,7) === mon;
        return mQ && mCat && mMon;
    });
    _renderExpenses(list);
    _renderBalanceSummary(list);
}

function _expClearFilters() {
    var s = document.getElementById('exp-search'); if(s) s.value = '';
    var c = document.getElementById('exp-filter-cat'); if(c) c.value = '';
    var m = document.getElementById('exp-filter-month'); if(m) m.value = '';
    filterExpenses();
}

function saveExpense() {
    var name     = ((document.getElementById('exp-name')||{}).value||'').trim();
    var amount   = parseFloat((document.getElementById('exp-amount')||{}).value||'0');
    var currency = (document.getElementById('exp-currency')||{value:'GBP'}).value || 'GBP';
    var category = (document.getElementById('exp-category')||{}).value||'';
    var date     = (document.getElementById('exp-date')||{}).value||'';
    var note     = ((document.getElementById('exp-note')||{}).value||'').trim();

    if (!name)     { showNotification('ناوی خەرجی بنووسە!', 'error'); return; }
    if (!amount)   { showNotification('بری پارە بنووسە!', 'error'); return; }
    if (!category) { showNotification('بابەتی خەرجی هەڵبژێرە!', 'error'); return; }
    if (!date)     { showNotification('بەروار دیاری بکە!', 'error'); return; }

    var data = { name: name, amount: amount, currency: currency, category: category, date: date, note: note, timestamp: Date.now() };
    database.ref('expenses').push(data).then(function() {
        showNotification('خەرجی زیادکرا ✅');
        clearExpenseForm();
        _loadExpensesFromDB();
    }).catch(function() { showNotification('هەڵە!', 'error'); });
}

function clearExpenseForm() {
    ['exp-name','exp-note'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
    var a=document.getElementById('exp-amount'); if(a) a.value='';
    var cur=document.getElementById('exp-currency'); if(cur) cur.value='GBP';
    var c=document.getElementById('exp-category'); if(c) c.value='';
    var d=document.getElementById('exp-date'); if(d) d.value=new Date().toISOString().split('T')[0];
}

function deleteExpense(key) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم خەرجیە؟')) return;
    database.ref('expenses/' + key).remove().then(function() {
        showNotification('سڕایەوە ✅');
        _loadExpensesFromDB();
    }).catch(function() { showNotification('هەڵە!', 'error'); });
}

// ── پانێلی وردەکاری (ئوڤەرلەی) ──
function viewExpense(key) {
    var e = (window._expensesCache||[]).find(function(x){ return x.key === key; });
    if (!e) return;

    var panel = document.getElementById('exp-detail-panel');
    var inner = document.getElementById('exp-detail-inner');
    if (!panel || !inner) return;

    var cat  = e.category || 'تر';
    var icon = _EXP_CAT_ICONS[cat]  || '📌';
    var clr  = _EXP_CAT_COLORS[cat] || '#718096';
    var amt  = _expFmt(e.amount, e.currency);

    // خەرجیی هاوشێوە (هەمان جۆر، جگە لە خۆی)
    var similar = (window._expensesCache||[]).filter(function(x){ return x.category === cat && x.key !== key; }).slice(0,4);
    var similarHtml = '';
    if (similar.length) {
        similarHtml = '<div style="margin:0 16px 16px;">'
          + '<div style="font-size:.78rem;font-weight:800;color:#4a5568;margin-bottom:8px;">' + icon + ' خەرجیی هاوشێوەی تر (' + cat + ')</div>'
          + '<div style="background:#FFFDE7;border:1.5px solid #e2e8f0;border-radius:10px;overflow:hidden;">'
          + similar.map(function(x, i) {
              return '<div onclick="viewExpense(\'' + x.key + '\')" style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;'
                  + (i < similar.length-1 ? 'border-bottom:1px solid #edf2f7;' : '') + 'cursor:pointer;">'
                + '<div>'
                  + '<div style="font-size:.82rem;font-weight:700;color:#1C1C1C;">' + escapeHtml(x.name||'—') + '</div>'
                  + '<div style="font-size:.7rem;color:#a0aec0;">' + (x.date||'') + '</div>'
                + '</div>'
                + '<span style="font-size:.85rem;font-weight:900;color:' + clr + ';">' + _expFmt(x.amount, x.currency) + '</span>'
              + '</div>';
          }).join('')
          + '</div></div>';
    }

    inner.innerHTML =
        // هێدەر
        '<div style="background:' + clr + ';padding:16px 18px;display:flex;justify-content:space-between;align-items:center;">'
          + '<div style="color:#fff;font-size:1rem;font-weight:900;">' + icon + ' وردەکاری خەرجی</div>'
          + '<button onclick="_expCloseDetail()" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;font-size:.9rem;font-weight:700;">✕ داخستن</button>'
        + '</div>'

        // بری پارەی گەورە
        + '<div style="text-align:center;padding:22px 18px 14px;border-bottom:1.5px solid #e2e8f0;">'
          + '<div style="font-size:2.5rem;font-weight:900;color:' + clr + ';">' + amt + '</div>'
          + '<div style="font-size:1rem;font-weight:800;color:#1C1C1C;margin-top:4px;">' + escapeHtml(e.name||'—') + '</div>'
          + '<div style="display:inline-flex;align-items:center;gap:5px;background:' + clr + '18;color:' + clr + ';border-radius:20px;padding:3px 14px;font-size:.78rem;font-weight:700;margin-top:6px;">' + icon + ' ' + cat + '</div>'
        + '</div>'

        // ڕیزەکان
        + '<div style="padding:14px 16px;display:flex;flex-direction:column;gap:8px;">'

          + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#FFFDE7;border-radius:8px;">'
            + '<span style="font-size:.82rem;font-weight:700;color:#718096;">📅 بەروار</span>'
            + '<span style="font-size:.84rem;font-weight:800;color:#1C1C1C;">' + escapeHtml(e.date||'—') + '</span>'
          + '</div>'

          + '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:#FFFDE7;border-radius:8px;">'
            + '<span style="font-size:.82rem;font-weight:700;color:#718096;">💱 جۆری دراو</span>'
            + '<span style="font-size:.84rem;font-weight:800;color:#1C1C1C;">' + (e.currency||'GBP') + '</span>'
          + '</div>'

          + (e.note ? '<div style="padding:9px 12px;background:#FFFDE7;border-radius:8px;border:1px solid #fde68a;">'
              + '<div style="font-size:.72rem;font-weight:700;color:#E6B800;margin-bottom:3px;">📝 تێبینی</div>'
              + '<div style="font-size:.84rem;font-weight:700;color:#1C1C1C;">' + escapeHtml(e.note) + '</div>'
            + '</div>' : '')

          + '<div style="padding:9px 12px;background:#FFFDE7;border-radius:8px;">'
            + '<div style="font-size:.7rem;color:#a0aec0;margin-bottom:2px;">🕐 کاتی تۆمارکردن</div>'
            + '<div style="font-size:.78rem;font-weight:700;color:#718096;">' + (e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB') : '—') + '</div>'
          + '</div>'

          // کارتی کۆی جۆر
          + (function(){
              var sameAll = (window._expensesCache||[]).filter(function(x){ return x.category === cat; });
              var total = _expFmtTotals(_expSumByCurrency(sameAll));
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:' + clr + '12;border:1.5px solid ' + clr + '33;border-radius:8px;">'
                + '<span style="font-size:.8rem;font-weight:700;color:' + clr + ';">کۆی خەرجی ' + cat + ' (' + sameAll.length + ' تۆمار)</span>'
                + '<span style="font-size:.85rem;font-weight:900;color:' + clr + ';">' + total + '</span>'
              + '</div>';
          })()

        + '</div>'

        // دوگمەکان
        + '<div style="padding:12px 16px;display:flex;gap:8px;border-top:1.5px solid #e2e8f0;">'
          + '<button onclick="printExpense(\'' + key + '\');_expCloseDetail()" style="flex:1;padding:10px;background:linear-gradient(135deg,#E6B800,#FFCC00);color:#fff;border:none;border-radius:10px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;"><i class="fas fa-print"></i> چاپکردن</button>'
          + '<button onclick="deleteExpense(\'' + key + '\');_expCloseDetail()" style="padding:10px 14px;background:#FFF8F8;color:#A50008;border:1.5px solid #FFCDD2;border-radius:10px;font-size:.85rem;cursor:pointer;font-family:inherit;"><i class="fas fa-trash"></i></button>'
          + '<button onclick="_expCloseDetail()" style="padding:10px 14px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.85rem;cursor:pointer;font-family:inherit;">داخستن</button>'
        + '</div>'

        + similarHtml;

    panel.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function _expCloseDetail(ev) {
    if (ev && ev.target !== document.getElementById('exp-detail-panel')) return;
    var panel = document.getElementById('exp-detail-panel');
    if (panel) panel.style.display = 'none';
    document.body.style.overflow = '';
}

function printExpense(key) {
    var e = (window._expensesCache||[]).find(function(x){ return x.key === key; });
    if (!e) return;
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<style>'
    + '@page{size:A5 portrait;margin:10mm;}'
    + 'body{font-family:Arial,sans-serif;direction:rtl;margin:0;padding:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
    + '.header{background:#E6B800;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;}'
    + '.amount{text-align:center;padding:18px;border-bottom:2px dashed #FFF9C4;}'
    + '.rows{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}'
    + '.row{display:flex;justify-content:space-between;padding:7px 10px;background:#FFFDE7;border-radius:7px;font-size:.85rem;}'
    + '.row span{color:#666;font-weight:700;}'
    + '.row strong{color:#111;}'
    + '.footer{text-align:center;font-size:.72rem;color:#aaa;margin-top:16px;border-top:1px dashed #e2e8f0;padding-top:8px;}'
    + '@media print{button{display:none!important;}}'
    + '</style></head><body>'
    + '<div style="border:2px solid #E6B800;border-radius:8px;max-width:400px;margin:0 auto;">'
      + '<div class="header">'
        + '<div style="font-size:.95rem;font-weight:900;">🏢 UK POST — KING STREET</div>'
        + '<div style="font-size:.8rem;opacity:.85;">' + (e.date||'') + '</div>'
      + '</div>'
      + '<div class="amount">'
        + '<div style="font-size:2rem;font-weight:900;color:#E6B800;">' + _expFmt(e.amount, e.currency) + '</div>'
        + '<div style="font-size:1rem;font-weight:800;margin-top:5px;">' + (e.name||'—') + '</div>'
      + '</div>'
      + '<div class="rows">'
        + '<div class="row"><span>📂 بابەت:</span><strong>' + (e.category||'تر') + '</strong></div>'
        + '<div class="row"><span>📅 بەروار:</span><strong>' + (e.date||'—') + '</strong></div>'
        + (e.note ? '<div class="row" style="background:#FFFDE7;"><span>📝 تێبینی:</span><strong>' + e.note + '</strong></div>' : '')
        + '<div class="row"><span>🕐 تۆمارکرا:</span><strong>' + (e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB') : '—') + '</strong></div>'
      + '</div>'
      + '<div class="footer">UK POST - KING STREET &nbsp;|&nbsp; 07755436275 / 07507472656</div>'
    + '</div>'
    + '<script>window.onload=function(){window.print();}<\/script>'
    + '</body></html>';
    _mobilePrint(html, 'expense-' + (e.name||key));
}

// ============================================================
// exportExpensesToExcel — داگرتنی هەموو خەرجیەکان بۆ Excel
// ============================================================
function exportExpensesToExcel() {
    var list = window._expensesCache || [];
    if (!list.length) { showNotification('هیچ خەرجیەک نییە بۆ داگرتن!', 'error'); return; }

    // ── کۆکردنەوەی کۆی هەر دراوێک ──
    var totals = {};
    list.forEach(function(e) {
        var c = e.currency || 'GBP';
        totals[c] = (totals[c] || 0) + (parseFloat(e.amount) || 0);
    });

    // ── ساتەکانی پوخت (خانەکانی کۆ) ──
    var summaryRows = [
        ['📊 پوختەی خەرجیەکان — UK POST KING STREET'],
        ['بەرواری داگرتن:', new Date().toLocaleString('en-GB')],
        ['کۆی تۆمارەکان:', list.length + ' تۆمار'],
        [],
        ['💷 کۆی هەر دراوێک:'],
    ];
    if (totals['GBP']) summaryRows.push(['GBP (£)', '£' + totals['GBP'].toFixed(2)]);
    if (totals['EUR']) summaryRows.push(['EUR (€)', '€' + totals['EUR'].toFixed(2)]);
    if (totals['USD']) summaryRows.push(['USD ($)', '$' + totals['USD'].toFixed(2)]);
    if (totals['IQD']) summaryRows.push(['IQD (دینار)', Math.round(totals['IQD']).toLocaleString() + ' IQD']);
    summaryRows.push([]);

    // ── کۆکردنەوە بە جۆر ──
    var byCat = {};
    list.forEach(function(e) {
        var cat = e.category || 'تر';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(e);
    });
    summaryRows.push(['📂 کۆی هەر جۆرێک:']);
    summaryRows.push(['جۆر', 'ژمارەی تۆمار', 'کۆی بری']);
    Object.keys(byCat).forEach(function(cat) {
        var items = byCat[cat];
        var catTotals = {};
        items.forEach(function(e) {
            var c = e.currency || 'GBP';
            catTotals[c] = (catTotals[c] || 0) + (parseFloat(e.amount) || 0);
        });
        var totalStr = Object.keys(catTotals).map(function(c) {
            if (c === 'IQD') return Math.round(catTotals[c]).toLocaleString() + ' IQD';
            var s = c === 'EUR' ? '€' : c === 'USD' ? '$' : '£';
            return s + catTotals[c].toFixed(2);
        }).join(' + ');
        summaryRows.push([(_EXP_CAT_ICONS[cat]||'') + ' ' + cat, items.length, totalStr]);
    });

    // ── هێڵی سەرەوەی لیست ──
    var headers = ['#', 'ناوی خەرجی', 'بری پارە', 'دراو', 'جۆر', 'بەروار', 'تێبینی', 'کاتی تۆمارکردن'];

    // ── ڕیزەکانی لیست ──
    var dataRows = list.map(function(e, i) {
        return [
            i + 1,
            e.name || '—',
            parseFloat(e.amount || 0),
            e.currency || 'GBP',
            ((_EXP_CAT_ICONS[e.category] || '') + ' ' + (e.category || 'تر')).trim(),
            e.date || '—',
            e.note || '',
            e.timestamp ? new Date(e.timestamp).toLocaleString('en-GB') : '—'
        ];
    });

    // ── دروستکردنی فایلی Excel (XML Spreadsheet) ──
    var nl = '\r\n';
    var xmlRows = '';

    // زیادکردنی ڕیزەکانی پوخت
    summaryRows.forEach(function(row) {
        xmlRows += '<Row>' + (row.length ? row.map(function(cell) {
            var val = (cell === null || cell === undefined) ? '' : cell;
            var isNum = typeof val === 'number';
            return '<Cell><Data ss:Type="' + (isNum ? 'Number' : 'String') + '">' + String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</Data></Cell>';
        }).join('') : '') + '</Row>' + nl;
    });

    // هێڵی سەرووی لیست
    xmlRows += '<Row>'
        + headers.map(function(h) {
            return '<Cell ss:StyleID="header"><Data ss:Type="String">' + h + '</Data></Cell>';
        }).join('')
        + '</Row>' + nl;

    // داتای لیست
    dataRows.forEach(function(row) {
        xmlRows += '<Row>' + row.map(function(cell, ci) {
            var val = (cell === null || cell === undefined) ? '' : cell;
            var isNum = (ci === 0 || ci === 2);
            return '<Cell' + (ci === 0 ? ' ss:StyleID="num"' : ci === 2 ? ' ss:StyleID="bold"' : '') + '>'
                + '<Data ss:Type="' + (isNum ? 'Number' : 'String') + '">'
                + String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                + '</Data></Cell>';
        }).join('') + '</Row>' + nl;
    });

    var xml = '<?xml version="1.0" encoding="UTF-8"?>' + nl
        + '<?mso-application progid="Excel.Sheet"?>' + nl
        + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' + nl
        + ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' + nl
        + '<Styles>' + nl
        + '<Style ss:ID="header"><Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/><Interior ss:Color="#E6B800" ss:Pattern="Solid"/></Style>' + nl
        + '<Style ss:ID="bold"><Font ss:Bold="1"/></Style>' + nl
        + '<Style ss:ID="num"><Alignment ss:Horizontal="Center"/></Style>' + nl
        + '</Styles>' + nl
        + '<Worksheet ss:Name="خەرجیەکان">' + nl
        + '<Table ss:DefaultColumnWidth="100">' + nl
        + '<Column ss:Width="35"/>'   // #
        + '<Column ss:Width="160"/>'  // ناو
        + '<Column ss:Width="80"/>'   // بری
        + '<Column ss:Width="55"/>'   // دراو
        + '<Column ss:Width="100"/>'  // جۆر
        + '<Column ss:Width="90"/>'   // بەروار
        + '<Column ss:Width="160"/>'  // تێبینی
        + '<Column ss:Width="140"/>'  // کات
        + nl
        + xmlRows
        + '</Table>' + nl
        + '</Worksheet>' + nl
        + '</Workbook>';

    // ── داگرتن ──
    var blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    var dateStr = new Date().toISOString().slice(0,10);
    a.href     = url;
    a.download = 'UK-POST-خەرجیەکان-' + dateStr + '.xls';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);

    showNotification('Excel داگیرا ✅ — ' + list.length + ' تۆمار');
}

// ============================================================
// printHtml — html2canvas + jsPDF بۆ موبایل / iframe بۆ دێسکتۆپ
// ============================================================
function printHtml(htmlContent, fileName) {
    // هەموو ئامێرەکان (براوسەر + ئەپ + موبایل) — یەک رێگا
    fileName = (fileName || 'label').replace(/\.pdf$/i, '');
    _printFallbackIframe(htmlContent, fileName);
}

function _printFallbackIframe(htmlContent, fileName) {
    // هەموو iframe و window.open سڕاوەتەوە — overlay ڕاستەوخۆ لە پەیجەکەدا
    var cleaned = htmlContent
        .replace(/backdrop-filter\s*:[^;"]+;?/gi, '')
        .replace(/-webkit-backdrop-filter\s*:[^;"]+;?/gi, '');

    // بەشی ناوەرۆک — body تەنها
    var bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    var bodyContent = bodyMatch ? bodyMatch[1] : cleaned;

    // سڕینەوەی دوگمەکانی کۆن ئەگەر هەبوون
    var old = document.getElementById('_ukPO');
    if (old) old.remove();

    // overlay ی سەرەوە
    var overlay = document.createElement('div');
    overlay.id = '_ukPO';
    overlay.style.cssText = [
        'position:fixed','top:0','left:0','width:100%','height:100%',
        'z-index:2147483646','background:#fff',
        'overflow-y:auto','-webkit-overflow-scrolling:touch',
        'display:flex','flex-direction:column'
    ].join(';') + ';';

    // بار ی دوگمەکان
    var bar = document.createElement('div');
    bar.style.cssText = [
        'position:sticky','top:0','left:0','right:0',
        'display:flex','gap:6px','padding:10px',
        'background:#A50008','z-index:1',
        'box-shadow:0 3px 10px rgba(0,0,0,.4)',
        'flex-shrink:0'
    ].join(';') + ';';

    var btnStyle = 'flex:1;padding:14px 4px;border:none;border-radius:10px;'
        + 'font-size:.92rem;font-weight:800;cursor:pointer;'
        + 'font-family:Tahoma,Arial,sans-serif;-webkit-tap-highlight-color:transparent;';

    var pbtn = document.createElement('button');
    pbtn.style.cssText = btnStyle + 'background:#FFCC00;color:#fff;';
    pbtn.innerHTML = '🖨 چاپ';
    pbtn.onclick = function(){ window.print(); };

    var dbtn = document.createElement('button');
    dbtn.style.cssText = btnStyle + 'background:#D40511;color:#fff;';
    dbtn.innerHTML = '⬇ داونلۆد';
    dbtn.onclick = function(){
        try {
            var b = new Blob([cleaned], {type:'text/html;charset=utf-8'});
            var u = URL.createObjectURL(b);
            var a = document.createElement('a');
            a.href = u; a.download = (fileName||'label') + '.html';
            document.body.appendChild(a); a.click();
            setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); }, 5000);
        } catch(e) {
            var enc = encodeURIComponent(cleaned);
            var a2 = document.createElement('a');
            a2.href = 'data:text/html;charset=utf-8,' + enc;
            a2.download = (fileName||'label') + '.html';
            document.body.appendChild(a2); a2.click();
            setTimeout(function(){ a2.remove(); }, 3000);
        }
    };

    var cbtn = document.createElement('button');
    cbtn.style.cssText = btnStyle + 'background:#D40511;color:#fff;';
    cbtn.innerHTML = '✕ داخستن';
    cbtn.onclick = function(){ overlay.remove(); };

    bar.appendChild(pbtn);
    bar.appendChild(dbtn);
    bar.appendChild(cbtn);

    // ناوەرۆکی لەیبل
    var content = document.createElement('div');
    content.style.cssText = 'padding:12px;flex:1;direction:rtl;font-family:Tahoma,Arial,sans-serif;';
    content.innerHTML = bodyContent;

    overlay.appendChild(bar);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // print style — دوگمەکان بنووشێ
    var ps = document.createElement('style');
    ps.id = '_ukPrintStyle';
    ps.textContent = '@media print{#_ukPO>div:first-child{display:none!important;}body>*:not(#_ukPO){display:none!important;}#_ukPO{position:static!important;overflow:visible!important;height:auto!important;}}';
    document.head.appendChild(ps);
    overlay.addEventListener('remove', function(){ var s=document.getElementById('_ukPrintStyle'); if(s)s.remove(); });
    // cleanup وەختی داخستن
    cbtn.onclick = function(){
        var s = document.getElementById('_ukPrintStyle');
        if (s) s.remove();
        overlay.remove();
    };
}

// ============================================================
// _smartPrint — موبایل: html2canvas → PNG → Share Sheet
//               دێسکتۆپ: overlay ی ئاساسی
// ============================================================
function _smartPrint(htmlContent, fileName) {
    fileName = (fileName || 'label').replace(/\.pdf$/i, '');

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
        // دێسکتۆپ — overlay ئاساسی
        _printFallbackIframe(htmlContent, fileName);
        return;
    }

    // موبایل — html2canvas بە تایبەتمەندی
    if (typeof html2canvas === 'undefined') {
        _printFallbackIframe(htmlContent, fileName);
        return;
    }

    // نمایشی پرۆگرەس
    var prog = document.createElement('div');
    prog.id = '_ukProgMsg';
    prog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);'
        + 'background:rgba(26,54,93,.95);color:#fff;padding:20px 32px;border-radius:16px;'
        + 'font-size:1rem;font-weight:800;z-index:2147483647;text-align:center;'
        + 'font-family:Tahoma,Arial,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4);';
    prog.innerHTML = '⏳ ئامادەدەکرێت...';
    document.body.appendChild(prog);

    // پارچەکردنی HTML بۆ body ی تەنها
    var bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    var bodyHtml = bodyMatch ? bodyMatch[1] : htmlContent;

    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;width:600px;'
        + 'background:#fff;padding:16px;direction:rtl;'
        + 'font-family:Tahoma,Arial,sans-serif;z-index:-9999;';
    tempDiv.innerHTML = bodyHtml;
    document.body.appendChild(tempDiv);

    // چاوەڕوان بکە وێنەکان بار ببن
    var imgs = tempDiv.querySelectorAll('img');
    var imgPromises = Array.from(imgs).map(function(img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function(res) {
            img.onload = res; img.onerror = res;
            setTimeout(res, 3000);
        });
    });

    Promise.all(imgPromises).then(function() {
        return html2canvas(tempDiv, {
            scale: 2.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0, scrollY: 0,
            width: 600,
            windowWidth: 600
        });
    }).then(function(canvas) {
        document.body.removeChild(tempDiv);

        // PNG Blob
        canvas.toBlob(function(pngBlob) {
            var progEl = document.getElementById('_ukProgMsg');
            if (progEl) progEl.remove();

            // Share API هەیە و موبایلە — Share Sheet کردنەوە
            if (navigator.share && navigator.canShare) {
                var shareFile = new File([pngBlob], fileName + '.png', { type: 'image/png' });
                if (navigator.canShare({ files: [shareFile] })) {
                    navigator.share({
                        title: fileName,
                        files: [shareFile]
                    }).catch(function(err) {
                        // بەکارهێنەر کەنسەلی کرد — باشە
                        if (err.name !== 'AbortError') _fallbackShowImage(canvas, pngBlob, fileName);
                    });
                    return;
                }
            }

            // Share API نییە — وێنەکە نیشانبدە لە overlay
            _fallbackShowImage(canvas, pngBlob, fileName);

        }, 'image/png', 1.0);

    }).catch(function(err) {
        var progEl = document.getElementById('_ukProgMsg');
        if (progEl) progEl.remove();
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        console.error('html2canvas:', err);
        // fallback بۆ overlay
        _printFallbackIframe(htmlContent, fileName);
    });
}

// نیشاندانی وێنە لە overlay — بۆ ئەگەر Share نەبوو
function _fallbackShowImage(canvas, pngBlob, fileName) {
    var old = document.getElementById('_ukPO');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = '_ukPO';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;'
        + 'z-index:2147483646;background:#A50008;overflow-y:auto;'
        + '-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;';

    // بار
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:6px;padding:10px;background:#A50008;'
        + 'flex-shrink:0;position:sticky;top:0;z-index:1;';

    var btnS = 'flex:1;padding:14px 4px;border:none;border-radius:10px;'
        + 'font-size:.88rem;font-weight:800;cursor:pointer;font-family:Tahoma,Arial,sans-serif;';

    // دوگمەی پێش هێنان/شێرکردن
    var sbtn = document.createElement('button');
    sbtn.style.cssText = btnS + 'background:#FFCC00;color:#fff;';
    sbtn.innerHTML = '📤 شێرکردن';
    sbtn.onclick = function() {
        if (navigator.share && pngBlob) {
            var f = new File([pngBlob], fileName + '.png', { type: 'image/png' });
            navigator.share({ files: [f] }).catch(function(){});
        } else {
            // داونلۆدی ڕاستەوخۆ
            var u = URL.createObjectURL(pngBlob);
            var a = document.createElement('a');
            a.href = u; a.download = fileName + '.png';
            document.body.appendChild(a); a.click();
            setTimeout(function() { URL.revokeObjectURL(u); a.remove(); }, 3000);
        }
    };

    var dbtn = document.createElement('button');
    dbtn.style.cssText = btnS + 'background:#D40511;color:#fff;';
    dbtn.innerHTML = '⬇ داونلۆد';
    dbtn.onclick = function() {
        var u = URL.createObjectURL(pngBlob);
        var a = document.createElement('a');
        a.href = u; a.download = fileName + '.png';
        document.body.appendChild(a); a.click();
        setTimeout(function() { URL.revokeObjectURL(u); a.remove(); }, 3000);
    };

    var cbtn = document.createElement('button');
    cbtn.style.cssText = btnS + 'background:#D40511;color:#fff;';
    cbtn.innerHTML = '✕ داخستن';
    cbtn.onclick = function() { overlay.remove(); };

    bar.appendChild(sbtn);
    bar.appendChild(dbtn);
    bar.appendChild(cbtn);

    // وێنەی لەیبل
    var imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'flex:1;display:flex;align-items:flex-start;justify-content:center;'
        + 'padding:10px;background:#FFFDE7;';
    var img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.cssText = 'max-width:100%;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,.3);';
    imgWrap.appendChild(img);

    overlay.appendChild(bar);
    overlay.appendChild(imgWrap);
    document.body.appendChild(overlay);
}

function _printHtmlIframe(final) { printHtml(final, 'label'); }
function _mobilePrint(html, filename) { printHtml(html, filename); }

// ==================== View & Print Driver ====================
function viewDriver(key) {
    database.ref('drivers/' + key).once('value', function(snap) {
        if (!snap.exists()) { showNotification('نەدۆزرایەوە', 'error'); return; }
        var d = Object.assign({ key: key }, snap.val());

        var modal = document.createElement('div');
        modal.id = 'driverViewModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
        modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:400px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.25);">
          <!-- هێدەر -->
          <div style="background:linear-gradient(135deg,#A50008,#D40511);padding:16px 18px;display:flex;justify-content:space-between;align-items:center;">
            <div style="color:#fff;font-size:1rem;font-weight:900;">🚗 وردەکاری شۆفیر</div>
            <button onclick="document.getElementById('driverViewModal').remove()" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;">✕</button>
          </div>
          <!-- ئایکۆن و ناو -->
          <div style="text-align:center;padding:20px 18px 10px;border-bottom:1.5px solid #e2e8f0;">
            ${d.photo ? '<img src="'+d.photo+'" style="width:72px;height:72px;border-radius:50%;object-fit:cover;margin:0 auto 10px;display:block;border:3px solid #FFE082;">' : '<div style="width:72px;height:72px;background:linear-gradient(135deg,#A50008,#D40511);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 10px;">🚗</div>'}
            <div style="font-size:1.1rem;font-weight:900;color:#1C1C1C;">${d.name||'—'}</div>
          </div>
          <!-- وردەکاریەکان -->
          <div style="padding:14px 18px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#FFFDE7;border-radius:8px;">
              <span style="font-size:.82rem;font-weight:700;color:#718096;">📱 مۆبایل</span>
              <span style="font-size:.82rem;font-weight:800;color:#1C1C1C;direction:ltr;">${d.mobile||'—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#FFFDE7;border-radius:8px;">
              <span style="font-size:.82rem;font-weight:700;color:#718096;">👤 Username</span>
              <span style="font-size:.82rem;font-weight:800;color:#1C1C1C;direction:ltr;">${d.username||'—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#FFFDE7;border-radius:8px;border:1px solid #fde68a;">
              <span style="font-size:.82rem;font-weight:700;color:#E6B800;">🔑 وشەی تێپەڕ</span>
              <div style="display:flex;align-items:center;gap:8px;">
                <span id="driverViewPass_${key}" style="font-size:.82rem;font-weight:800;color:#E6B800;direction:ltr;letter-spacing:2px;">••••••••</span>
                <button onclick="(function(){var s=document.getElementById('driverViewPass_${key}');var b=document.getElementById('driverViewPassBtn_${key}');if(s.dataset.shown==='1'){s.textContent='••••••••';s.dataset.shown='0';b.textContent='👁';}else{s.textContent='${d.password||'—'}';s.dataset.shown='1';b.textContent='🙈';}})()" id="driverViewPassBtn_${key}" style="background:#fef3c7;border:1px solid #fde68a;border-radius:6px;padding:2px 7px;font-size:.78rem;cursor:pointer;">👁</button>
              </div>
            </div>
            ${d.kuBalance !== undefined ? `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#FFFDE7;border-radius:8px;border:1px solid #FFF9C4;">
              <span style="font-size:.82rem;font-weight:700;color:#E6B800;">💰 بالانس</span>
              <span style="font-size:.82rem;font-weight:900;color:#E6B800;">${d.kuBalance||0}</span>
            </div>` : ''}
            ${d.createdAt ? `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#FFFDE7;border-radius:8px;">
              <span style="font-size:.78rem;font-weight:700;color:#a0aec0;">🕐 تۆمارکرا</span>
              <span style="font-size:.78rem;color:#a0aec0;">${d.createdAt}</span>
            </div>` : ''}
          </div>
          <!-- دوگمەکان -->
          <div style="padding:12px 18px;display:flex;gap:8px;border-top:1.5px solid #e2e8f0;">
            <button onclick="printDriver('${key}');document.getElementById('driverViewModal').remove();" style="flex:1;padding:10px;background:linear-gradient(135deg,#A50008,#D40511);color:#fff;border:none;border-radius:10px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;">🖨️ چاپکردن</button>
            <button onclick="document.getElementById('driverViewModal').remove()" style="padding:10px 16px;background:#e2e8f0;color:#1C1C1C;border:none;border-radius:10px;font-size:.85rem;cursor:pointer;font-family:inherit;">داخستن</button>
          </div>
        </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(ev){ if(ev.target===modal) modal.remove(); });
    });
}

function printDriver(key) {
    database.ref('drivers/' + key).once('value', function(snap) {
        if (!snap.exists()) return;
        var d = Object.assign({ key: key }, snap.val());
        var html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          @page{size:A5 portrait;margin:10mm;}
          body{font-family:Arial,sans-serif;direction:rtl;margin:0;padding:0;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
          .header{background:#A50008;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;border-radius:8px 8px 0 0;}
          .rows{padding:12px 16px;display:flex;flex-direction:column;gap:8px;}
          .row{display:flex;justify-content:space-between;padding:7px 10px;background:#FFFDE7;border-radius:7px;font-size:.85rem;}
          .row span{color:#666;font-weight:700;}
          .row strong{color:#111;direction:ltr;}
          .footer{text-align:center;font-size:.72rem;color:#aaa;margin-top:16px;border-top:1px dashed #e2e8f0;padding-top:8px;}
          @media print{button{display:none!important;}}
        </style>
        </head><body>
        <div style="border:2px solid #A50008;border-radius:8px;max-width:380px;margin:0 auto;">
          <div class="header">
            <div style="font-size:.95rem;font-weight:900;">🚗 UK POST — KING STREET</div>
            <div style="font-size:.8rem;opacity:.85;">کارتی شۆفیر</div>
          </div>
          <div style="text-align:center;padding:16px;border-bottom:2px dashed #FFE082;">
            ${d.photo ? '<img src="'+d.photo+'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #FFE082;display:block;margin:0 auto 8px;">' : '<div style="font-size:2.5rem;margin-bottom:8px;">🚗</div>'}
            <div style="font-size:1.1rem;font-weight:900;color:#A50008;">${d.name||'—'}</div>
          </div>
          <div class="rows">
            <div class="row"><span>📱 مۆبایل:</span><strong>${d.mobile||'—'}</strong></div>
            <div class="row"><span>👤 Username:</span><strong>${d.username||'—'}</strong></div>
            ${d.kuBalance !== undefined ? `<div class="row" style="background:#FFFDE7;"><span>💰 بالانس:</span><strong style="color:#E6B800;">${d.kuBalance||0}</strong></div>` : ''}
            ${d.createdAt ? `<div class="row"><span>🕐 تۆمارکرا:</span><strong>${d.createdAt}</strong></div>` : ''}
          </div>
          <div class="footer">UK POST - KING STREET &nbsp;|&nbsp; 07755436275 / 07507472656</div>
        </div>
        </body></html>`;
        _mobilePrint(html, 'driver-' + (d.name||key));
    });
}

// ══════════════════════════════════════════════════════════
//  راپۆرتی گشتی — loadReportsAdmin
// ══════════════════════════════════════════════════════════
function loadReportsAdmin() {
    var content = document.getElementById('adminContent');
    if (!content) return;

    content.innerHTML = '<div style="padding:20px;text-align:center;color:#D40511;font-size:1rem;"><i class="fas fa-spinner fa-spin"></i> راپۆرتەکان بار دەکرێن...</div>';

    var promises = [
        database.ref('products').once('value'),
        database.ref('requests').once('value'),
        database.ref('delivery').once('value'),
        database.ref('intlPost').once('value'),
        database.ref('drivers').once('value'),
        database.ref('expenses').once('value'),
        database.ref('slider').once('value'),
        database.ref('videos').once('value'),
        database.ref('siteUsers').once('value'),
    ];

    Promise.all(promises).then(function(snaps) {
        var productsSnap   = snaps[0];
        var requestsSnap   = snaps[1];
        var deliveriesSnap = snaps[2];
        var intlSnap       = snaps[3];
        var driversSnap    = snaps[4];
        var expensesSnap   = snaps[5];
        var slidersSnap    = snaps[6];
        var videosSnap     = snaps[7];
        var usersSnap      = snaps[8];

        // ── کاڵاکان ──
        var totalProducts = 0, pendingProducts = 0, approvedProducts = 0;
        if (productsSnap.exists()) {
            productsSnap.forEach(function(c) {
                c.forEach(function(p) {
                    totalProducts++;
                    var v = p.val();
                    if (v.status === 'pending') pendingProducts++;
                    else if (v.status === 'approved') approvedProducts++;
                });
            });
        }

        // ── داواکاریەکان ──
        var totalRequests = 0, pendingRequests = 0;
        if (requestsSnap.exists()) {
            requestsSnap.forEach(function(r) {
                totalRequests++;
                if ((r.val().status || 'pending') === 'pending') pendingRequests++;
            });
        }

        // ── گەیاندنی ناوخۆ ──
        var totalDeliveries = 0, pendingDeliveries = 0, deliveredCount = 0;
        if (deliveriesSnap.exists()) {
            deliveriesSnap.forEach(function(d) {
                totalDeliveries++;
                var st = d.val().status || 'pending';
                if (st === 'pending') pendingDeliveries++;
                else if (st === 'delivered') deliveredCount++;
            });
        }

        // ── پۆستی نێودەوڵەتی ──
        var totalIntl = 0, pendingIntl = 0;
        if (intlSnap.exists()) {
            intlSnap.forEach(function(i) {
                totalIntl++;
                if ((i.val().status || 'pending') === 'pending') pendingIntl++;
            });
        }

        // ── شۆفیرەکان ──
        var totalDrivers = 0, activeDrivers = 0;
        if (driversSnap.exists()) {
            driversSnap.forEach(function(d) {
                totalDrivers++;
                if (d.val().active !== false) activeDrivers++;
            });
        }

        // ── خەرجیەکان ──
        var totalExpenses = 0, expensesIQD = 0, expensesGBP = 0;
        if (expensesSnap.exists()) {
            expensesSnap.forEach(function(e) {
                totalExpenses++;
                var v = e.val();
                var amt = parseFloat(v.amount) || 0;
                if (v.currency === 'IQD') expensesIQD += amt;
                else if (v.currency === 'GBP') expensesGBP += amt;
            });
        }

        // ── سلایدەر و ڤیدیۆ ──
        var totalSliders = slidersSnap.exists() ? (Object.keys(slidersSnap.val() || {}).length) : 0;
        var totalVideos  = videosSnap.exists()  ? (Object.keys(videosSnap.val()  || {}).length) : 0;

        // ── بەکارهێنەران ──
        var totalUsers = 0;
        // Firebase
        if (usersSnap && usersSnap.exists()) {
            totalUsers += Object.keys(usersSnap.val() || {}).length;
        }
        // localStorage (بەبێ دووبارەبوون)
        try {
            var lsU = JSON.parse(localStorage.getItem('ukbazar_siteUsers') || '{}');
            var fbKeys = (usersSnap && usersSnap.exists()) ? Object.keys(usersSnap.val() || {}) : [];
            Object.keys(lsU).forEach(function(k) {
                if (fbKeys.indexOf(k) === -1) totalUsers++;
            });
        } catch(e) {}

        // ── کارتەکانی پوخت ──
        var cards = [
            { icon:'fas fa-boxes',          label:'هەموو کاڵاکان',         value: totalProducts,      sub: approvedProducts+' پەسەندکراو / '+pendingProducts+' چاوەڕوان',   color:'#D40511', bg:'#f0f0ff' },
            { icon:'fas fa-clipboard-list', label:'داواکاریەکان',          value: totalRequests,      sub: pendingRequests+' چاوەڕوانی وەڵام',                              color:'#FFCC00', bg:'#fffaf0' },
            { icon:'fas fa-shipping-fast',  label:'گەیاندنی ناوخۆ',       value: totalDeliveries,    sub: deliveredCount+' گەیاو / '+pendingDeliveries+' چاوەڕوان',         color:'#FFCC00', bg:'#FFFDE7' },
            { icon:'fas fa-globe',          label:'پۆستی نێودەوڵەتی',     value: totalIntl,          sub: pendingIntl+' چاوەڕوانی پرۆسەس',                                 color:'#D40511', bg:'#FFF9C4' },
            { icon:'fas fa-truck',          label:'شۆفیرەکان',            value: totalDrivers,       sub: activeDrivers+' چالاک',                                          color:'#D40511', bg:'#FFF9C4' },
            { icon:'fas fa-users',          label:'بەکارهێنەران',         value: totalUsers,         sub: 'ئەکاونتی تۆمارکراو',                                            color:'#E6B800', bg:'#fffaf0' },
            { icon:'fas fa-wallet',         label:'خەرجیەکان',            value: totalExpenses+' تۆمار', sub:'£'+expensesGBP.toFixed(0)+' GBP / '+Math.round(expensesIQD).toLocaleString()+' IQD', color:'#D40511', bg:'#FFF8F8' },
            { icon:'fas fa-images',         label:'سلایدەرەکان',          value: totalSliders,       sub:'فایلی پیشاندان',                                                 color:'#D40511', bg:'#faf5ff' },
            { icon:'fas fa-video',          label:'ڤیدیۆکان',             value: totalVideos,        sub:'ڤیدیۆی بارکراو',                                                 color:'#FF4444', bg:'#FFF8F8' },
        ];

        var cardsHtml = cards.map(function(c) {
            return '<div style="background:'+c.bg+';border:2px solid '+c.color+'33;border-radius:16px;padding:16px 14px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 10px '+c.color+'18;">'
                + '<div style="display:flex;align-items:center;gap:8px;">'
                +   '<div style="width:38px;height:38px;background:'+c.color+';border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
                +     '<i class="'+c.icon+'" style="color:#fff;font-size:1rem;"></i>'
                +   '</div>'
                +   '<span style="font-size:.82rem;font-weight:700;color:#1C1C1C;">'+c.label+'</span>'
                + '</div>'
                + '<div style="font-size:1.7rem;font-weight:900;color:'+c.color+';">'+c.value+'</div>'
                + '<div style="font-size:.72rem;color:#718096;">'+c.sub+'</div>'
                + '</div>';
        }).join('');

        // ── چارتی بارەکان ──
        var chartMax = Math.max(totalProducts, totalRequests, totalDeliveries, totalIntl, totalDrivers, totalUsers, 1);
        var chartBars = [
            { label:'کاڵاکان',      value: totalProducts,   color:'#D40511' },
            { label:'داواکاری',    value: totalRequests,   color:'#FFCC00' },
            { label:'گەیاندن',     value: totalDeliveries, color:'#FFCC00' },
            { label:'نێودەوڵەتی',  value: totalIntl,       color:'#D40511' },
            { label:'شۆفیر',       value: totalDrivers,    color:'#D40511' },
            { label:'بەکارهێنەر', value: totalUsers,      color:'#E6B800' },
        ];
        var barsHtml = chartBars.map(function(b) {
            var pct = chartMax > 0 ? Math.round((b.value / chartMax) * 100) : 0;
            return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
                + '<div style="width:80px;font-size:.78rem;font-weight:700;color:#4a5568;text-align:right;flex-shrink:0;">'+b.label+'</div>'
                + '<div style="flex:1;background:#f0f0f0;border-radius:20px;height:22px;overflow:hidden;">'
                +   '<div style="width:'+pct+'%;height:100%;background:'+b.color+';border-radius:20px;transition:width .6s;display:flex;align-items:center;justify-content:flex-end;padding-left:8px;">'
                +     (pct > 10 ? '<span style="color:#fff;font-size:.72rem;font-weight:700;padding-left:8px;">'+b.value+'</span>' : '')
                +   '</div>'
                + '</div>'
                + (pct <= 10 ? '<span style="font-size:.72rem;font-weight:700;color:#4a5568;flex-shrink:0;">'+b.value+'</span>' : '')
                + '</div>';
        }).join('');

        // ── گەیاندن پای چارت ──
        var gTotal = totalDeliveries || 1;
        var gDelivered = deliveredCount;
        var gPend = pendingDeliveries;
        var gOther = gTotal - gDelivered - gPend;
        var pieHtml = '<div style="display:flex;flex-direction:column;gap:8px;justify-content:center;">'
            + _reportPieRow('گەیاو','#FFCC00', gDelivered, gTotal)
            + _reportPieRow('چاوەڕوان','#FFCC00', gPend, gTotal)
            + _reportPieRow('تر','#a0aec0', gOther > 0 ? gOther : 0, gTotal)
            + '</div>';

        var now = new Date().toLocaleString('en-GB');

        content.innerHTML = '<div style="padding:14px;max-width:960px;margin:0 auto;direction:rtl;">'

            // سەرپەڕە
            + '<div style="background:linear-gradient(135deg,#A50008,#D40511);border-radius:16px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">'
            +   '<div>'
            +     '<div style="color:#fff;font-size:1.1rem;font-weight:900;"><i class="fas fa-chart-bar"></i> راپۆرتی گشتی سایت</div>'
            +     '<div style="color:rgba(255,255,255,.8);font-size:.75rem;margin-top:3px;">UK BAZAR — Control Panel</div>'
            +   '</div>'
            +   '<div style="background:rgba(255,255,255,.15);border-radius:10px;padding:6px 14px;color:#fff;font-size:.75rem;">🕐 نوێکراوەتەوە: '+now+'</div>'
            + '</div>'

            // کارتەکان
            + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px;">'
            + cardsHtml
            + '</div>'

            // چارت
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">'

            // بار چارت
            +   '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px;">'
            +     '<div style="font-size:.9rem;font-weight:900;color:#1C1C1C;margin-bottom:14px;"><i class="fas fa-chart-bar" style="color:#D40511;"></i> بەراوردی بەشەکان</div>'
            +     barsHtml
            +   '</div>'

            // پای چارت / گەیاندن
            +   '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px;">'
            +     '<div style="font-size:.9rem;font-weight:900;color:#1C1C1C;margin-bottom:14px;"><i class="fas fa-shipping-fast" style="color:#FFCC00;"></i> بارودۆخی گەیاندن</div>'
            +     pieHtml
            +   '</div>'

            + '</div>'

            // خەرجی پوخت
            + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:16px;">'
            +   '<div style="font-size:.9rem;font-weight:900;color:#1C1C1C;margin-bottom:14px;"><i class="fas fa-wallet" style="color:#D40511;"></i> پوختی خەرجیەکان</div>'
            +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">'
            +     _reportMiniCard('هەموو تۆمارەکان', totalExpenses, '#4a5568', 'تۆمار')
            +     _reportMiniCard('£ GBP', expensesGBP.toFixed(2), '#D40511', 'پاوەند')
            +     _reportMiniCard('IQD دینار', Math.round(expensesIQD).toLocaleString(), '#E6B800', 'دینار')
            +   '</div>'
            + '</div>'

            // بەکارهێنەران پوخت
            + '<div style="background:#fff;border:1.5px solid #fed7aa;border-radius:14px;padding:16px;margin-bottom:16px;">'
            +   '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">'
            +     '<div style="font-size:.9rem;font-weight:900;color:#1C1C1C;"><i class="fas fa-users" style="color:#E6B800;"></i> بەکارهێنەران</div>'
            +     '<button onclick="showAdminTab(\'users\')" style="padding:6px 16px;background:linear-gradient(135deg,#C49A00,#E6B800);color:#fff;border:none;border-radius:20px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fas fa-arrow-left"></i> بینینی هەموو</button>'
            +   '</div>'
            +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
            +     _reportMiniCard('کۆی بەکارهێنەران', totalUsers, '#E6B800', 'ئەکاونت')
            +     _reportMiniCard('تۆمارکراو', totalUsers > 0 ? '✅' : '—', '#E6B800', totalUsers > 0 ? 'چالاک' : 'بەتاڵ')
            +   '</div>'
            + '</div>'

            // دوگمەی نوێکردنەوە
            + '<div style="text-align:center;margin-top:10px;">'
            +   '<button onclick="loadReportsAdmin()" style="padding:10px 28px;background:linear-gradient(135deg,#A50008,#D40511);color:#fff;border:none;border-radius:30px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(107,70,193,.35);"><i class="fas fa-sync-alt"></i> نوێکردنەوەی راپۆرت</button>'
            + '</div>'

        + '</div>';

    }).catch(function(e) {
        content.innerHTML = '<div style="padding:20px;text-align:center;color:#D40511;">هەڵە لە بارکردنی داتا: ' + e.message + '</div>';
    });
}

function _reportPieRow(label, color, value, total) {
    var pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px;background:#f9f9fb;border-radius:10px;">'
        + '<div style="width:14px;height:14px;border-radius:50%;background:'+color+';flex-shrink:0;"></div>'
        + '<div style="flex:1;font-size:.8rem;font-weight:700;color:#1C1C1C;">'+label+'</div>'
        + '<div style="font-size:.85rem;font-weight:900;color:'+color+';">'+value+'</div>'
        + '<div style="font-size:.72rem;color:#a0aec0;min-width:36px;text-align:left;">'+pct+'%</div>'
        + '</div>';
}

function _reportMiniCard(label, value, color, unit) {
    return '<div style="background:#f9f9fb;border-radius:12px;padding:12px;text-align:center;border:1.5px solid #e2e8f0;">'
        + '<div style="font-size:.72rem;color:#718096;margin-bottom:4px;">'+label+'</div>'
        + '<div style="font-size:1.2rem;font-weight:900;color:'+color+';">'+value+'</div>'
        + '<div style="font-size:.68rem;color:#a0aec0;margin-top:2px;">'+unit+'</div>'
        + '</div>';
}

// ════════════════════════════════════════════════════════════════
//  USER PROFILE SYSTEM — سیستەمی پرۆفایل بەکارهێنەر
// ════════════════════════════════════════════════════════════════

var _currentUser = null; // بەکارهێنەری ئێستا
var _userAuthTab = 'login';

// ════════════════════════════════
// SESSION KEY — هەر جهازێک یەکسانە
// ════════════════════════════════
var _SESSION_KEY = 'ukbazar_user';

// بارکردنی سێشن لە سەرەتا
(function initUserSession() {
  try {
    var saved = localStorage.getItem(_SESSION_KEY);
    if (saved) {
      var u = JSON.parse(saved);
      // پشکنین ئایا هێشتا دروستە — بەرواری تەمەن ٣٠ ڕۆژ
      var age = Date.now() - (u._savedAt || 0);
      if (age < 30 * 24 * 60 * 60 * 1000) {
        _currentUser = u;
        // نوێکردنەوەی زانیاری لە Firebase
        if (!_isFileProtocol() && u.key) {
          database.ref('siteUsers/' + u.key).once('value').then(function(snap) {
            if (snap.exists()) {
              _currentUser = Object.assign({ key: u.key }, snap.val(), { _savedAt: Date.now() });
              _saveUserSession();
            }
          }).catch(function() {});
        }
        _applyUserSession();
      } else {
        // تەمەن تێپەڕیوە — پاک بکەرەوە
        localStorage.removeItem(_SESSION_KEY);
      }
    }
  } catch(e) { localStorage.removeItem(_SESSION_KEY); }
})();

function showUserProfileModal() {
  document.getElementById('userProfileModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  if (_currentUser) {
    _renderUserProfilePanel();
  } else {
    switchUserTab('login');
    _renderUserProfilePanel();
  }
}

function closeUserProfileModal() {
  document.getElementById('userProfileModal').style.display = 'none';
  document.body.style.overflow = '';
}

function switchUserTab(tab) {
  _userAuthTab = tab;
  var loginBtn = document.getElementById('tabLoginBtn');
  var regBtn = document.getElementById('tabRegisterBtn');
  var nameField = document.getElementById('userNameField');
  var submitBtn = document.getElementById('userAuthSubmitBtn');
  var errDiv = document.getElementById('userAuthError');
  if (errDiv) errDiv.style.display = 'none';

  if (tab === 'login') {
    loginBtn.style.background = '#fff';
    loginBtn.style.color = '#A50008';
    regBtn.style.background = 'transparent';
    regBtn.style.color = 'rgba(255,255,255,.45)';
    nameField.style.display = 'none';
    var mf = document.getElementById('userMobileField'); if (mf) mf.style.display = 'none';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span id="userAuthSubmitText">چوونەژوورەوە</span>';
  } else {
    regBtn.style.background = '#fff';
    regBtn.style.color = '#A50008';
    loginBtn.style.background = 'transparent';
    loginBtn.style.color = 'rgba(255,255,255,.45)';
    nameField.style.display = 'block';
    var mf2 = document.getElementById('userMobileField'); if (mf2) mf2.style.display = 'block';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span id="userAuthSubmitText">تۆمارکردن</span>';
  }
}

function toggleUserPassVisibility() {
  var inp = document.getElementById('userPasswordInput');
  var icon = document.getElementById('userPassEyeIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

function _showUserError(msg) {
  var d = document.getElementById('userAuthError');
  d.textContent = msg;
  d.style.display = 'block';
}

// تۆمارکردن یان چوونەژوورەوە
function submitUserAuth() {
  var emailVal = (document.getElementById('userEmailInput').value || '').trim();
  var passVal  = (document.getElementById('userPasswordInput').value || '').trim();
  var nameVal  = (document.getElementById('userNameInput') ? document.getElementById('userNameInput').value.trim() : '');
  var errDiv   = document.getElementById('userAuthError');
  errDiv.style.display = 'none';

  if (!emailVal) { _showUserError('تکایە ئیمەیل یان ناوی بەکارهێنەر بنووسە'); return; }
  if (!passVal || passVal.length < 4) { _showUserError('وشەی نهینی دەبێت کەمێک لە ٤ پیت زیاتر بێت'); return; }

  var btn = document.getElementById('userAuthSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> چاوەڕێ بکە...';

  if (_userAuthTab === 'register') {
    if (!nameVal) { _showUserError('تکایە ناوی تەواوت بنووسە'); btn.disabled=false; switchUserTab('register'); return; }
    _registerUser(nameVal, emailVal, passVal);
  } else {
    _loginUser(emailVal, passVal);
  }
}

// hash سادەی وشەی نهینی (SHA-256 نییە — تەنها بۆ پرۆژەی سادە)
function _hashPass(pass) {
  var h = 0, i, chr;
  for (i = 0; i < pass.length; i++) {
    chr = pass.charCodeAt(i);
    h = ((h << 5) - h) + chr;
    h |= 0;
  }
  return 'h' + Math.abs(h).toString(16);
}

function _isFileProtocol() {
  return window.location.protocol === 'file:';
}

function _lsGetUsers() {
  try { return JSON.parse(localStorage.getItem('ukbazar_siteUsers') || '{}'); } catch(e) { return {}; }
}
function _lsSaveUsers(users) {
  try { localStorage.setItem('ukbazar_siteUsers', JSON.stringify(users)); } catch(e) {}
}

function _registerUser(name, emailOrUser, pass) {
  var mobileVal = (document.getElementById('userMobileInput') ? document.getElementById('userMobileInput').value.trim() : '');
  var hashVal = _hashPass(pass);
  var newUserData = {
    name: name,
    mobile: mobileVal,
    email: emailOrUser.includes('@') ? emailOrUser : '',
    username: emailOrUser.includes('@') ? emailOrUser.split('@')[0] : emailOrUser,
    passHash: hashVal,
    joinedAt: new Date().toLocaleString(),
    joinedTs: Date.now()
  };

  function _finishRegister(userWithKey) {
    // هەمیشە localStorage backup
    try {
      var lsU = _lsGetUsers();
      lsU[userWithKey.key] = userWithKey;
      _lsSaveUsers(lsU);
    } catch(e) {}
    _currentUser = userWithKey;
    _saveUserSession();
    _applyUserSession();
    _renderUserProfilePanel();
    showNotification('بەخێربێیت ' + name + ' 🎉');
  }

  // ئەگەر file:// — تەنها localStorage
  if (_isFileProtocol()) {
    var users = _lsGetUsers();
    var exists = Object.values(users).some(function(u) {
      return (u.email||'').toLowerCase() === emailOrUser.toLowerCase() ||
             (u.username||'').toLowerCase() === emailOrUser.toLowerCase();
    });
    if (exists) { _resetAuthBtn(); _showUserError('ئەم ناوی بەکارهێنەر یان ئیمەیلە پێشتر تۆمار کراوە'); return; }
    var key = 'u' + Date.now();
    _finishRegister(Object.assign({ key: key }, newUserData));
    return;
  }

  // هەمیشە Firebase
  var usersRef = database.ref('siteUsers');
  usersRef.once('value').then(function(snap) {
    var exists = false;
    if (snap.exists()) {
      snap.forEach(function(ch) {
        var u = ch.val();
        if ((u.email || '').toLowerCase() === emailOrUser.toLowerCase() ||
            (u.username || '').toLowerCase() === emailOrUser.toLowerCase()) {
          exists = true;
        }
      });
    }
    // ئەگەر لە localStorage ش هەبوو
    try {
      var lsU = _lsGetUsers();
      Object.values(lsU).forEach(function(u) {
        if ((u.email||'').toLowerCase() === emailOrUser.toLowerCase() ||
            (u.username||'').toLowerCase() === emailOrUser.toLowerCase()) {
          exists = true;
        }
      });
    } catch(e) {}

    if (exists) {
      _resetAuthBtn();
      _showUserError('ئەم ناوی بەکارهێنەر یان ئیمەیلە پێشتر تۆمار کراوە');
      return;
    }
    usersRef.push(newUserData).then(function(ref) {
      _finishRegister(Object.assign({ key: ref.key }, newUserData));
    }).catch(function(err) {
      // Firebase سەرکەوتوو نەبوو — localStorage backup
      var key = 'u' + Date.now();
      _finishRegister(Object.assign({ key: key }, newUserData));
      showNotification('⚠️ تۆمارکرا — بەڵام پەیوەندی Firebase نییە', 'warning');
    });
  }).catch(function() {
    // Firebase کێشە — localStorage بەکاربێ
    var key = 'u' + Date.now();
    _finishRegister(Object.assign({ key: key }, newUserData));
  });
}

function _loginUser(emailOrUser, pass) {
  // ئەگەر بەکارهێنەرێکی تر چووەژوورەوە بوو — پێشتر دەرببە
  if (_currentUser) {
    var curId = (_currentUser.email || _currentUser.username || '').toLowerCase();
    if (curId !== emailOrUser.toLowerCase()) {
      _currentUser = null;
      try { localStorage.removeItem('ukbazar_user'); } catch(e) {}
    }
  }

  var hashVal = _hashPass(pass);

  // هەمیشە localStorage پشکنین بکە (بۆ هەر پرۆتۆکۆلێک)
  function checkLocalStorage() {
    try {
      var lsUsers = _lsGetUsers();
      var found = null;
      Object.values(lsUsers).forEach(function(u) {
        var matchId = (u.email||'').toLowerCase() === emailOrUser.toLowerCase() ||
                      (u.username||'').toLowerCase() === emailOrUser.toLowerCase() ||
                      (u.name||'').toLowerCase() === emailOrUser.toLowerCase();
        if (matchId && u.passHash === hashVal) found = u;
      });
      return found;
    } catch(e) { return null; }
  }

  if (_isFileProtocol()) {
    var found = checkLocalStorage();
    if (!found) { _resetAuthBtn(); _showUserError('ناوی بەکارهێنەر یان وشەی نهینی هەڵەیە'); return; }
    _currentUser = found;
    _saveUserSession();
    _applyUserSession();
    _renderUserProfilePanel();
    showNotification('بەخێربێیت دووبارە، ' + (found.name || found.username) + ' 👋');
    return;
  }

  // Firebase + localStorage هەردووکیان
  database.ref('siteUsers').once('value').then(function(snap) {
    var found = null;

    // ١. گەڕان لە Firebase
    if (snap.exists()) {
      snap.forEach(function(ch) {
        var u = ch.val();
        var matchId = (u.email || '').toLowerCase() === emailOrUser.toLowerCase() ||
                      (u.username || '').toLowerCase() === emailOrUser.toLowerCase() ||
                      (u.name || '').toLowerCase() === emailOrUser.toLowerCase();
        if (matchId && u.passHash === hashVal) {
          found = Object.assign({ key: ch.key }, u);
        }
      });
    }

    // ٢. ئەگەر لە Firebase نەدۆزرا — localStorage چێک بکە
    if (!found) {
      found = checkLocalStorage();
    }

    if (!found) {
      _resetAuthBtn();
      _showUserError('ناوی بەکارهێنەر یان وشەی نهینی هەڵەیە');
      return;
    }
    _currentUser = found;
    _saveUserSession();
    // backup لە localStorage بۆ cross-device
    try {
      var lsU = _lsGetUsers();
      lsU[found.key || ('u'+Date.now())] = found;
      _lsSaveUsers(lsU);
    } catch(e) {}
    _applyUserSession();
    _renderUserProfilePanel();
    showNotification('بەخێربێیت دووبارە، ' + (found.name || found.username) + ' 👋');
  }).catch(function() {
    // ئەگەر Firebase سەرکەوتوو نەبوو — localStorage تەنها تێست بکە
    var found = checkLocalStorage();
    if (found) {
      _currentUser = found;
      _saveUserSession();
      _applyUserSession();
      _renderUserProfilePanel();
      showNotification('بەخێربێیت دووبارە، ' + (found.name || found.username) + ' 👋');
    } else {
      _resetAuthBtn();
      _showUserError('هەڵەی پەیوەندی — دووبارە هەوڵ بدەوە');
    }
  });
}

function logoutUser() {
  if (!confirm('دڵنیایت دەتەوێت دەربچیت؟')) return;

  _currentUser = null;

  // پاکردنەوەی هەموو سێشنەکان
  try {
    localStorage.removeItem(_SESSION_KEY);
    sessionStorage.clear();
    // تەنها کلیلەکانی پرۆفایل پاک بکەرەوە — نەک هەموویان
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (k.startsWith('ukbazar_wl_') || k === _SESSION_KEY)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
  } catch(e) {}

  _applyUserSession();
  showNotification('سەرکەوتووانە دەرچوویت 👋');

  // دوگمەکی مۆدال دابخە
  var modal = document.getElementById('userProfileModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';

  // ڕیفرێش بۆ پاکترکردنی هەموو حاڵەت — نیم چرکە دواکەوتن
  setTimeout(function() { window.location.reload(); }, 800);
}

function _saveUserSession() {
  try {
    var toSave = Object.assign({}, _currentUser, { _savedAt: Date.now() });
    localStorage.setItem(_SESSION_KEY, JSON.stringify(toSave));
  } catch(e) {}
}

// جێبەجێکردنی دەرئەنجامی چوونەژوورەوە لەسەر UI هێدەر
function _applyUserSession() {
  var bnSvg     = document.getElementById('bottomNavProfileSvg');
  var bnInitial = document.getElementById('bottomNavProfileInitial');

  if (_currentUser) {
    var initial = (_currentUser.name || _currentUser.username || 'U').charAt(0).toUpperCase();
    if (bnSvg)     bnSvg.style.display     = 'none';
    if (bnInitial) { bnInitial.textContent = initial; bnInitial.style.display = 'flex'; }
    _updateProfileBadgeCounts();
  } else {
    if (bnSvg)     bnSvg.style.display     = 'block';
    if (bnInitial) bnInitial.style.display = 'none';
  }
}

function _updateProfileBadgeCounts() {
  if (!_currentUser) return;
  var wlCount = _getWishlist().length;
  var label = document.getElementById('userProfileBtnLabel');
  if (!label) return;
  var name = _currentUser.name || _currentUser.username || 'پرۆفایل';
  var extras = [];
  if (wlCount > 0) extras.push('❤️' + wlCount);
  label.textContent = name + (extras.length ? ' · ' + extras.join(' ') : '');
}

function _resetAuthBtn() {
  var btn = document.getElementById('userAuthSubmitBtn');
  if (!btn) return;
  btn.disabled = false;
  var txt = _userAuthTab === 'login' ? 'چوونەژوورەوە' : 'تۆمارکردن';
  var ico = _userAuthTab === 'login' ? 'fa-sign-in-alt' : 'fa-user-plus';
  btn.innerHTML = '<i class="fas ' + ico + '"></i> <span id="userAuthSubmitText">' + txt + '</span>';
}

function _renderUserProfilePanel() {
  var authForm   = document.getElementById('userAuthForm');
  var profilePanel = document.getElementById('userProfilePanel');
  var headerName = document.getElementById('userProfileNameDisplay');
  var headerSub  = document.getElementById('userProfileSubDisplay');
  var avatarLg   = document.getElementById('userProfileAvatarLg');
  var tips       = document.getElementById('userAuthTips');

  // ئەگەر مۆدال هێشتا لە DOM نییە — وەستە
  if (!authForm || !profilePanel || !headerName) return;

  if (_currentUser) {
    authForm.style.display = 'none';
    profilePanel.style.display = 'block';
    if (tips) tips.style.display = 'none';

    var name    = _currentUser.name || _currentUser.username || 'بەکارهێنەر';
    var initial = name.charAt(0).toUpperCase();
    var wlCount = _getWishlist().length;

    headerName.textContent = '👋 بەخێربێیت، ' + name + '!';
    if (headerSub) headerSub.innerHTML = wlCount > 0
      ? '<span style="background:rgba(255,255,255,.2);padding:2px 10px;border-radius:20px;">❤️ ' + wlCount + ' دڵخواز</span>'
      : '<span style="opacity:.75;">پرۆفایلەکەت بەڕێوەببە</span>';

    if (avatarLg) {
      avatarLg.textContent    = initial;
      avatarLg.style.background  = 'rgba(255,255,255,.3)';
      avatarLg.style.fontWeight  = '900';
      avatarLg.style.fontSize    = '1.8rem';
      avatarLg.style.color       = '#fff';
    }

    var panelName = document.getElementById('userPanelName');
    var panelEmail = document.getElementById('userPanelEmail');
    var panelInitial = document.getElementById('userPanelInitial');
    var panelJoined = document.getElementById('userPanelJoined');
    var mobileEl = document.getElementById('userPanelMobile');

    if (panelName)    panelName.textContent    = name;
    if (panelEmail)   panelEmail.textContent   = _currentUser.email || _currentUser.username || '';
    if (panelInitial) panelInitial.textContent = initial;
    if (panelJoined)  panelJoined.textContent  = _currentUser.joinedAt || '—';
    if (mobileEl && _currentUser.mobile) {
      mobileEl.textContent  = '📱 ' + _currentUser.mobile;
      mobileEl.style.display = 'block';
    }

    var wlBtn = document.querySelector('[onclick="showUserWishlist()"]');
    if (wlBtn) wlBtn.innerHTML = '<i class="fas fa-heart" style="color:#D40511;"></i> دڵخوازەکانم'
      + (wlCount > 0 ? ' <span style="background:#D40511;color:#fff;border-radius:20px;padding:1px 7px;font-size:.72rem;">' + wlCount + '</span>' : '');

  } else {
    authForm.style.display   = 'block';
    profilePanel.style.display = 'none';
    if (tips)      tips.style.display      = 'flex';
    if (headerSub) headerSub.textContent   = '';
    headerName.textContent = 'بەخێربێیت!';
    if (avatarLg) { avatarLg.textContent = '👤'; avatarLg.style.fontWeight = 'normal'; avatarLg.style.fontSize = '2rem'; }

    var ei = document.getElementById('userEmailInput');
    var pi = document.getElementById('userPasswordInput');
    var ni = document.getElementById('userNameInput');
    var mi = document.getElementById('userMobileInput');
    var er = document.getElementById('userAuthError');
    if (ei) ei.value = '';
    if (pi) pi.value = '';
    if (ni) ni.value = '';
    if (mi) mi.value = '';
    if (er) er.style.display = 'none';
    switchUserTab('login');
  }
}

// ════════════════════════════════════════════════════════════════
//  WISHLIST SYSTEM — سیستەمی دڵخوازەکان
// ════════════════════════════════════════════════════════════════

function _getWishlist() {
  if (!_currentUser) return [];
  try {
    var key = 'ukbazar_wl_' + (_currentUser.key || _currentUser.username);
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch(e) { return []; }
}

function _saveWishlist(list) {
  if (!_currentUser) return;
  try {
    var key = 'ukbazar_wl_' + (_currentUser.key || _currentUser.username);
    localStorage.setItem(key, JSON.stringify(list));
  } catch(e) {}
}

function _refreshWishlistIcons() {
  var wl = _getWishlist();
  var ids = wl.map(function(i) { return i.productId; });
  document.querySelectorAll('[id^="wl-icon-"]').forEach(function(icon) {
    var pid = icon.id.replace('wl-icon-', '');
    var btn = document.getElementById('wl-' + pid);
    var inWl = ids.indexOf(pid) !== -1;
    icon.className = inWl ? 'fas fa-heart' : 'far fa-heart';
    if (btn) { btn.style.background = inWl ? '#ffe4e6' : '#fff0f0'; btn.style.borderColor = inWl ? '#FF8A80' : '#FFCDD2'; }
  });
  // دوگمەکانی ژێر کاڵا
  document.querySelectorAll('[id^="wl2-icon-"]').forEach(function(icon) {
    var pid = icon.id.replace('wl2-icon-', '');
    var btn = document.getElementById('wl2-' + pid);
    var inWl = ids.indexOf(pid) !== -1;
    icon.className = inWl ? 'fas fa-heart' : 'far fa-heart';
    if (btn) {
      btn.style.background = inWl ? '#ffe4e6' : '#fff0f0';
      btn.style.borderColor = inWl ? '#FF8A80' : '#FFCDD2';
      btn.innerHTML = '<i class="' + (inWl ? 'fas' : 'far') + ' fa-heart" id="wl2-icon-' + pid + '"></i> ' + (inWl ? 'دڵخوازکرا ❤️' : 'دڵخواز');
    }
  });
}

// toggle زیاد / سڕینەوە لە دڵخواز
function toggleWishlist(productId) {
  if (!_currentUser) {
    showNotification('تکایە پێشتر بچووبە ژوورەوە! 🔑', 'error');
    showUserProfileModal();
    return;
  }
  var product = products.find(function(p) { return p.firebaseId === productId; });
  if (!product) { showNotification('کاڵا نەدۆزرایەوە', 'error'); return; }

  var wl = _getWishlist();
  var idx = wl.findIndex(function(i) { return i.productId === productId; });
  if (idx !== -1) {
    wl.splice(idx, 1);
    showNotification('لە دڵخواز سڕایەوە 💔');
  } else {
    wl.push({
      productId: productId,
      name: product.name || '',
      price: product.price || '',
      currency: product.currency || 'IQD',
      image: (product.images && product.images[0]) ? product.images[0] : '',
      category: product.category || '',
      sellerName: product.sellerName || '',
      addedAt: new Date().toLocaleString()
    });
    showNotification('زیادکرا بۆ دڵخواز ❤️');
  }
  _saveWishlist(wl);
  _refreshWishlistIcons();
  if (typeof _updateProfileBadgeCounts === 'function') _updateProfileBadgeCounts();
}

// ════════════════════════════════════════════════════════════════
//  ORDERS MODAL — داواکارییەکانم
// ════════════════════════════════════════════════════════════════

function showUserOrders() {
  if (!_currentUser) { showUserProfileModal(); return; }
  document.getElementById('userOrdersModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  _loadUserOrders();
}

function closeUserOrdersModal() {
  document.getElementById('userOrdersModal').style.display = 'none';
  document.body.style.overflow = '';
}

function _loadUserOrders() {
  var list = document.getElementById('userOrdersList');
  var countEl = document.getElementById('userOrdersCount');
  list.innerHTML = '<div style="text-align:center;padding:40px 0;color:#a0aec0;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i></div>';

  // گەڕان بەپێی مۆبایل یان ناوی بەکارهێنەر
  var userName = (_currentUser.name || _currentUser.username || '').toLowerCase();
  var userKey  = _currentUser.key || '';

  // ئەگەر file:// بوو، localStorage check بکە
  if (_isFileProtocol()) {
    try {
      var lsOrders = JSON.parse(localStorage.getItem('ukbazar_orders') || '[]');
      var myLsOrders = lsOrders.filter(function(r) {
        var rName = (r.name || r.userName || '').toLowerCase();
        var rKey  = r.userKey || '';
        return rName === userName || (userKey && rKey === userKey);
      });
      myLsOrders.reverse();
      countEl.textContent = myLsOrders.length + ' داواکاری';
      if (myLsOrders.length === 0) {
        list.innerHTML = _buildOrdersEmptyHtml('داواکارییەک نییە — کاڵایەک بکڕە تا ئێرە دەردەکەوێت');
      } else {
        list.innerHTML = myLsOrders.map(_buildOrderCard).join('');
      }
    } catch(e) {
      list.innerHTML = _buildOrdersEmptyHtml();
    }
    return;
  }

  database.ref('requests').once('value').then(function(snap) {
    var myOrders = [];
    if (snap.exists()) {
      snap.forEach(function(ch) {
        var r = ch.val();
        // بەراوردکردن بە ناو یان مۆبایل
        var rName = (r.name || r.userName || '').toLowerCase();
        var rKey  = r.userKey || '';
        if (rName === userName || (userKey && rKey === userKey)) {
          myOrders.push(Object.assign({ _key: ch.key }, r));
        }
      });
    }
    myOrders.reverse();
    countEl.textContent = myOrders.length + ' داواکاری';

    if (myOrders.length === 0) {
      list.innerHTML = _buildOrdersEmptyHtml();
      return;
    }
    list.innerHTML = myOrders.map(_buildOrderCard).join('');
  }).catch(function() {
    list.innerHTML = '<div style="text-align:center;padding:30px;color:#D40511;">هەڵەی پەیوەندی</div>';
  });
}

function _buildOrdersEmptyHtml(msg) {
  return '<div style="text-align:center;padding:50px 20px;color:#a0aec0;">'
    + '<div style="font-size:3rem;margin-bottom:12px;">📦</div>'
    + '<div style="font-weight:700;font-size:.95rem;color:#4a5568;margin-bottom:6px;">هیچ داواکارییەک نییە</div>'
    + '<div style="font-size:.8rem;">' + (msg || 'کاڵایەک بکڕە — داواکارییەکەت ئێرە دەردەکەوێت') + '</div>'
    + '</div>';
}

function _buildOrderCard(r) {
  var statusMap = {
    pending:   { label: '⏳ چاوەڕێ',     bg: '#fefcbf', color: '#744210', border: '#f6e05e' },
    approved:  { label: '✅ پەسەندکرا',  bg: '#FFFDE7', color: '#E6B800', border: '#FFE082' },
    delivered: { label: '🎉 گەیشتووە',   bg: '#e6fffa', color: '#234e52', border: '#4fd1c5' },
    rejected:  { label: '❌ ردکرا',      bg: '#FFF8F8', color: '#742a2a', border: '#FF8A80' }
  };
  var st = statusMap[r.status] || statusMap['pending'];
  var isCart = r.type === 'cart-order';
  var badge = isCart ? '🛒 سەبەتە' : '📋 کاڵا';
  var badgeBg = isCart ? '#D40511' : '#FFCC00';

  return '<div style="background:#fff;border:1.5px solid ' + st.border + ';border-radius:14px;margin-bottom:12px;overflow:hidden;">'
    // هێدر
    + '<div style="background:' + st.bg + ';padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">'
      + '<span style="font-weight:900;font-size:.9rem;color:' + st.color + ';">' + escapeHtml(r.itemName || r._key || '—') + '</span>'
      + '<div style="display:flex;gap:6px;align-items:center;">'
        + '<span style="background:' + badgeBg + ';color:#fff;font-size:.65rem;padding:2px 8px;border-radius:20px;font-weight:700;">' + badge + '</span>'
        + '<span style="background:' + st.border + ';color:' + st.color + ';font-size:.7rem;padding:2px 9px;border-radius:20px;font-weight:700;">' + st.label + '</span>'
      + '</div>'
    + '</div>'
    // جەستە
    + '<div style="padding:12px 14px;font-size:.82rem;color:#4a5568;">'
      + (r.qty ? '<div style="margin-bottom:4px;">🔢 دانە: <strong>' + escapeHtml(String(r.qty)) + '</strong> × ' + escapeHtml(String(r.price||'')) + ' ' + escapeHtml(r.currency||'IQD') + '</div>' : '')
      + (r.address ? '<div style="margin-bottom:4px;">📍 ' + escapeHtml(r.address) + '</div>' : '')
      + (r.details ? '<div style="margin-bottom:4px;color:#718096;">📝 ' + escapeHtml(r.details) + '</div>' : '')
      + '<div style="font-size:.72rem;color:#a0aec0;margin-top:6px;">⏰ ' + escapeHtml(r.timestamp||'') + '</div>'
    + '</div>'
  + '</div>';
}

// ════════════════════════════════════════════════════════════════
//  WISHLIST MODAL — دڵخوازەکانم
// ════════════════════════════════════════════════════════════════

function showUserWishlist() {
  if (!_currentUser) { showUserProfileModal(); return; }
  document.getElementById('userWishlistModal').style.display = 'block';
  document.body.style.overflow = 'hidden';
  _renderWishlistModal();
}

function closeUserWishlistModal() {
  document.getElementById('userWishlistModal').style.display = 'none';
  document.body.style.overflow = '';
}

function _renderWishlistModal() {
  var grid = document.getElementById('userWishlistGrid');
  var countEl = document.getElementById('userWishlistCount');
  var wl = _getWishlist();
  countEl.textContent = wl.length + ' کاڵا';

  if (wl.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:50px 20px;color:#a0aec0;">'
      + '<div style="font-size:3rem;margin-bottom:12px;">❤️</div>'
      + '<div style="font-weight:700;font-size:.95rem;color:#4a5568;margin-bottom:6px;">هیچ کاڵایەک نییە</div>'
      + '<div style="font-size:.8rem;">کاڵا ببینە و ❤️ بکە تا ئێرە پاشەکەوت بکرێت</div>'
      + '</div>';
    return;
  }

  grid.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'
    + wl.map(function(item) { return _buildWishlistCard(item); }).join('')
    + '</div>';
}

function _buildWishlistCard(item) {
  var imgHtml = item.image
    ? '<img src="' + escapeHtml(item.image) + '" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px;" onerror="this.style.display=\'none\'">'
    : '<div style="width:100%;height:80px;background:linear-gradient(135deg,#D40511,#A50008);border-radius:10px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;">📦</div>';

  return '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:10px;position:relative;">'
    // دوگمەی سڕینەوە
    + '<button onclick="removeFromWishlist(\'' + escapeHtml(item.productId) + '\')" style="position:absolute;top:8px;left:8px;background:#fff;border:1.5px solid #FFCDD2;color:#D40511;width:26px;height:26px;border-radius:50%;font-size:.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;">✕</button>'
    + imgHtml
    + '<div style="font-weight:700;font-size:.82rem;color:#1C1C1C;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(item.name) + '</div>'
    + '<div style="font-size:.75rem;color:#D40511;font-weight:700;margin-bottom:8px;">' + escapeHtml(String(item.price)) + ' ' + escapeHtml(item.currency) + '</div>'
    + '<button onclick="addToCartFromWishlist(\'' + escapeHtml(item.productId) + '\')" style="width:100%;padding:7px;background:linear-gradient(135deg,#D40511,#A50008);color:#fff;border:none;border-radius:9px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;"><i class="fas fa-cart-plus"></i> سەبەتە</button>'
  + '</div>';
}

function removeFromWishlist(productId) {
  var wl = _getWishlist();
  _saveWishlist(wl.filter(function(i) { return i.productId !== productId; }));
  _refreshWishlistIcons();
  _renderWishlistModal();
  showNotification('لە دڵخواز سڕایەوە 💔');
}

function addToCartFromWishlist(productId) {
  addToCart(productId);
  closeUserWishlistModal();
}

// ── هەڵگرتن ئایکۆنەکان کاتی بارکردنی کاڵاکان ──
var _origRenderProducts = window.renderProducts;
// نوێکردنەوەی ئایکۆنەکان پاش render
document.addEventListener('ukbazar:productsRendered', function() {
  if (_currentUser) _refreshWishlistIcons();
});

// backdrop close for sub-modals
document.addEventListener('click', function(e) {
  if (e.target === document.getElementById('userOrdersModal'))   closeUserOrdersModal();
  if (e.target === document.getElementById('userWishlistModal')) closeUserWishlistModal();
});

// ════════════════════════════════════════════════════════════════
//  ADMIN — بەکارهێنەران
// ════════════════════════════════════════════════════════════════

function loadUsersAdmin() {
    var content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><div style="margin-top:10px;">بارکردن...</div></div>';

    function renderUsers(usersObj, requestsObj) {
        var users = [];
        if (usersObj) {
            Object.keys(usersObj).forEach(function(k) {
                users.push(Object.assign({ _key: k }, usersObj[k]));
            });
        }
        try {
            var lsUsers = JSON.parse(localStorage.getItem('ukbazar_siteUsers') || '{}');
            Object.keys(lsUsers).forEach(function(k) {
                if (!users.find(function(u){ return u._key === k; })) {
                    users.push(Object.assign({ _key: k, _local: true }, lsUsers[k]));
                }
            });
        } catch(e) {}

        users.sort(function(a, b) { return (b.joinedTs || 0) - (a.joinedTs || 0); });

        if (users.length === 0) {
            content.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#a0aec0;">'
                + '<div style="font-size:3rem;margin-bottom:12px;">👥</div>'
                + '<div style="font-size:1rem;font-weight:700;color:#4a5568;">هیچ بەکارهێنەرێک تۆمار نەکراوە</div>'
                + '</div>';
            return;
        }

        // ژمارەی داواکاری بۆ هەر بەکارهێنەر
        var orderCounts = {};
        if (requestsObj) {
            Object.values(requestsObj).forEach(function(r) {
                var rKey  = r.userKey  || '';
                var rName = (r.userName || r.name || '').toLowerCase();
                users.forEach(function(u) {
                    var uName = (u.name || u.username || '').toLowerCase();
                    if ((rKey && rKey === u._key) || (uName && uName === rName)) {
                        orderCounts[u._key] = (orderCounts[u._key] || 0) + 1;
                    }
                });
            });
        }
        // localStorage orders
        try {
            var lsOrders = JSON.parse(localStorage.getItem('ukbazar_orders') || '[]');
            lsOrders.forEach(function(r) {
                var rKey  = r.userKey  || '';
                var rName = (r.userName || r.name || '').toLowerCase();
                users.forEach(function(u) {
                    var uName = (u.name || u.username || '').toLowerCase();
                    if ((rKey && rKey === u._key) || (uName && uName === rName)) {
                        orderCounts[u._key] = (orderCounts[u._key] || 0) + 1;
                    }
                });
            });
        } catch(e) {}

        // ژمارەی دڵخواز لە localStorage
        function getWlCount(u) {
            try {
                var wlKey = 'ukbazar_wl_' + (u._key || u.username || '');
                var wl = JSON.parse(localStorage.getItem(wlKey) || '[]');
                return wl.length;
            } catch(e) { return 0; }
        }

        var html = '<div style="padding:4px 0 14px;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">'
            + '<div style="font-weight:900;font-size:1.1rem;color:#1C1C1C;"><i class="fas fa-users" style="color:#E6B800;margin-left:6px;"></i> بەکارهێنەران <span style="background:#E6B800;color:#fff;border-radius:20px;padding:2px 10px;font-size:.8rem;">' + users.length + '</span></div>'
            + '<input onkeyup="filterUsersAdmin(this.value)" placeholder="🔍 گەڕان..." style="padding:8px 14px;border:1.5px solid #e2e8f0;border-radius:20px;font-size:.85rem;font-family:inherit;outline:none;min-width:180px;">'
            + '</div>'
            + '<div id="usersAdminList">';

        users.forEach(function(u) {
            var initial = (u.name || u.username || '?').charAt(0).toUpperCase();
            var colors  = ['#D40511','#FFCC00','#D40511','#E6B800','#D40511','#E6B800','#D40511'];
            var clr     = colors[initial.charCodeAt(0) % colors.length];
            var badge   = u._local
                ? '<span style="background:#e2e8f0;color:#718096;font-size:.65rem;padding:1px 7px;border-radius:10px;">Local</span>'
                : '<span style="background:#FFF9C4;color:#E6B800;font-size:.65rem;padding:1px 7px;border-radius:10px;">Firebase</span>';

            var ordCount = orderCounts[u._key] || 0;
            var wlCount  = getWlCount(u);

            html += '<div class="user-admin-card" data-name="' + escapeHtml((u.name||'') + ' ' + (u.username||'') + ' ' + (u.mobile||'') + ' ' + (u.email||'')).toLowerCase() + '" '
                + 'style="background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:10px;">'

                + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">'
                // ئەواتار
                + '<div style="width:46px;height:46px;background:' + clr + ';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900;color:#fff;flex-shrink:0;">' + initial + '</div>'
                // زانیاری
                + '<div style="flex:1;min-width:120px;">'
                + '<div style="font-weight:900;font-size:.95rem;color:#1C1C1C;">' + escapeHtml(u.name || u.username || '—') + ' ' + badge + '</div>'
                + '<div style="font-size:.78rem;color:#718096;margin-top:2px;">'
                + (u.username ? '<span style="margin-left:10px;">👤 ' + escapeHtml(u.username) + '</span>' : '')
                + (u.email    ? '<span style="margin-left:10px;">📧 ' + escapeHtml(u.email)    + '</span>' : '')
                + (u.mobile   ? '<span style="margin-left:10px;">📱 ' + escapeHtml(u.mobile)   + '</span>' : '')
                + '</div>'
                + '<div style="font-size:.72rem;color:#a0aec0;margin-top:3px;">📅 ' + escapeHtml(u.joinedAt || '—') + '</div>'
                + '</div>'
                // دوگمەی سڕینەوە
                + '<button onclick="deleteUserAdmin(\'' + escapeHtml(u._key) + '\', \'' + (u._local ? 'local' : 'firebase') + '\', \'' + escapeHtml(u.name || u.username || '') + '\')" '
                + 'style="padding:7px 14px;background:#FFF8F8;color:#A50008;border:1.5px solid #FFCDD2;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;">'
                + '<i class="fas fa-trash"></i> سڕینەوە</button>'
                + '</div>'

                // ── ژمارەی داواکاری و دڵخواز ──
                + '<div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0f0;">'
                + '<span style="background:#FFFDE7;color:#E6B800;border:1px solid #FFF9C4;border-radius:20px;padding:3px 12px;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:4px;">'
                + '<i class="fas fa-box" style="font-size:.7rem;"></i> داواکاری: <strong>' + ordCount + '</strong></span>'
                + '<span style="background:#FFF8F8;color:#A50008;border:1px solid #FFCDD2;border-radius:20px;padding:3px 12px;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:4px;">'
                + '<i class="fas fa-heart" style="font-size:.7rem;"></i> دڵخواز: <strong>' + wlCount + '</strong></span>'
                + '</div>'

                + '</div>';
        });

        html += '</div></div>';
        content.innerHTML = html;
    }

    // هەمیشە Firebase تێست بکە — file:// ش
    function fetchAndRender() {
        content.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i><div style="margin-top:10px;">بارکردن...</div></div>';
        Promise.all([
            database.ref('siteUsers').once('value'),
            database.ref('requests').once('value')
        ]).then(function(snaps) {
            renderUsers(
                snaps[0].exists() ? snaps[0].val() : null,
                snaps[1].exists() ? snaps[1].val() : null
            );
        }).catch(function(err) {
            // Firebase کێشەی هەیە — localStorage تەنها + دوگمەی دووبارەهەوڵدان
            renderUsers(null, null);
            var listEl = document.getElementById('usersAdminList');
            if (listEl) {
                var warn = document.createElement('div');
                warn.style.cssText = 'background:#FFFDE7;border:1px solid #f6e05e;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.82rem;color:#744210;display:flex;align-items:center;justify-content:space-between;gap:10px;';
                warn.innerHTML = '<span>⚠️ Firebase پەیوەندی نییە — تەنها Local نیشاندەدرێت</span>'
                    + '<button onclick="loadUsersAdmin()" style="padding:5px 14px;background:#E6B800;color:#fff;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;">🔄 دووبارە</button>';
                listEl.insertBefore(warn, listEl.firstChild);
            }
        });
    }
    fetchAndRender();
}

function filterUsersAdmin(val) {
    var v = val.toLowerCase();
    document.querySelectorAll('.user-admin-card').forEach(function(card) {
        card.style.display = (v === '' || card.dataset.name.includes(v)) ? '' : 'none';
    });
}

function deleteUserAdmin(key, source, name) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەکاونتی «' + name + '»؟\nئەم کارە گەڕاندنەوەی نییە.')) return;

    function afterDelete() {
        showNotification('ئەکاونتی ' + name + ' سڕایەوە 🗑️');
        loadUsersAdmin();
    }

    // لە localStorage سڕەوە
    try {
        var lsUsers = JSON.parse(localStorage.getItem('ukbazar_siteUsers') || '{}');
        if (lsUsers[key]) {
            delete lsUsers[key];
            localStorage.setItem('ukbazar_siteUsers', JSON.stringify(lsUsers));
        }
    } catch(e) {}

    if (source === 'firebase' && !_isFileProtocol()) {
        database.ref('siteUsers/' + key).remove()
            .then(afterDelete)
            .catch(function() { showNotification('هەڵە لە سڕینەوە', 'error'); });
    } else {
        afterDelete();
    }
}
