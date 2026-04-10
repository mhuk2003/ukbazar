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
            overflow: hidden;
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
            width: 64px !important;
            height: 64px !important;
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
            color: #667eea !important;
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
            border-top-color: #667eea !important;
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
    if (productsTitle) productsTitle.textContent = 'هەموو کاڵاکان';
    
    loadApprovedProducts();
    loadVideos();
}

// ==================== Modal Triggers ====================
function showRequestModal() { showModal('requestModal'); }
function showAddProductModal() { showModal('addProductModal'); }
function showDeliveryModal() { showModal('deliveryModal'); }
function showFibModal() { showModal('fibModal'); }

// ==================== Admin Functions ====================
function showAdminLogin() {
    const username = prompt('ناوی بەکارهێنەر:');
    const password = prompt('وشەی تێپەڕ:');
    
    if (username === 'admin' && password === 'admin112233') {
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
        showNotification('هەڵە! ناوی بەکارهێنەر یان وشەی تێپەڕ هەڵەیە', 'error');
    }
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
    } else if (tab === 'addSlider') {
        showAddSliderForm();
    } else if (tab === 'videos') {
        showVideoAdminForm();
    } else if (tab === 'addProduct') {
        showAdminAddProductForm();
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
                products = JSON.parse(cachedProducts);
                
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
                    products.push({ ...val, firebaseId: child.key });
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
                showNotification(products.length + ' کاڵا بارکرا!');
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
                    newProducts.push({ ...val, firebaseId: child.key });
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
                const badgeBg = isCartOrder ? '#667eea' : '#f59e0b';
                const badgeText = isCartOrder ? '🛒 داواکاری کڕین' : '📋 داواکاری کاڵا';
                const waNum = (request.mobile || '').replace(/\D/g,'');
                html += `
                    <div class="pending-item" id="request-${key}" style="border-right:4px solid ${badgeBg};">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                            <h4 style="margin:0;color:#2d3748;">📦 ${escapeHtml(request.itemName || '—')}</h4>
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
        html += '<h3 style="margin:0 0 12px 0; color:#667eea; border-bottom:2px solid #667eea; padding-bottom:6px;"><i class="fas fa-shipping-fast"></i> داواکارییە کوردییەکان (' + kurdishItems.length + ')</h3>';
        html += '<div class="pending-items">';
        kurdishItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const qrText = encodeURIComponent(
                `پسولە: ${orderNum} | نێردەر: ${d.senderName||d.name||''} ${d.senderMobile||d.mobile||''} (${d.senderLocation||d.address||''}) | وەرگر: ${d.receiverName||''} ${d.receiverMobile||''} (${d.receiverLocation||''}) | کەلوپەل: ${d.packageName||d.details||''} x${d.packageQty||''} - ${d.packageKg||''}کگ`
            );
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrText}`;
            html += buildKurdishLabelHtml(d, key, orderNum, qrUrl);
        });
        html += '</div>';
    }

    if (ukItems.length > 0) {
        html += '<h3 style="margin:24px 0 12px 0; color:#d97706; border-bottom:2px solid #f0c040; padding-bottom:6px; direction:ltr; text-align:left;">UK Delivery Requests (' + ukItems.length + ')</h3>';
        html += '<div class="pending-items" style="direction:ltr;">';
        ukItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const fullAddress = [d.address1, d.address2, d.city, d.county, d.postcode, 'United Kingdom'].filter(Boolean).join(', ');
            const qrText = encodeURIComponent(`Order: ${orderNum} | To: ${d.fullName||''} | Tel: ${d.phone||''} | ${fullAddress} | Item: ${d.packageName||''}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrText}`;
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
            countEl.style.color = filtered.length > 0 ? '#667eea' : '#f56565';
        }

        // ئەگەر تەنها یەک ئەنجام — یەکسەر لەیبلەکە پیشان بدە و scroll بکە
        if (filtered.length === 1) {
            renderDeliveryItems(filtered);
            setTimeout(() => {
                const card = document.querySelector('.delivery-label-card');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    card.style.outline = '3px solid #667eea';
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
                <button class="btn btn-sm" onclick="editDeliveryLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#e6fffa;color:#276749;border:1.5px solid #68d391;border-radius:8px;cursor:pointer;" title="دەستکاریکردن">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm" onclick="shareDeliveryWhatsApp('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#f0fff4;color:#25d366;border:1.5px solid #25d366;border-radius:8px;cursor:pointer;" title="شێرکردن بە واتسئاپ">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn btn-sm" onclick="deleteDelivery('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#fff0f0;color:#e53e3e;border:1.5px solid #fc8181;border-radius:8px;cursor:pointer;" title="سڕینەوەی لەیبل">
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
                ${d.driverName||d.driverMobile ? `<div class="label-row label-driver-row"><span>🚗 شۆفیر:</span><strong>${escapeHtml(d.driverName||'—')} — ${escapeHtml(d.driverMobile||'')}</strong></div>` : ''}
                ${d.deliveryNote ? `<div class="label-row label-note-row"><span>📝 تیبینی:</span><strong>${escapeHtml(d.deliveryNote)}</strong></div>` : ''}
            </div>
            <div class="label-admin-edit">
                <div class="admin-edit-title"><i class="fas fa-pen"></i> شۆفیر و تیبینی</div>
                <div class="admin-edit-fields">
                    <div class="admin-edit-inputs">
                        <input type="text" id="driver-name-${key}" placeholder="👤 ناوی شۆفیر" value="${escapeHtml(d.driverName||'')}">
                        <input type="tel" id="driver-mobile-${key}" placeholder="📞 ژمارە" value="${escapeHtml(d.driverMobile||'')}">
                    </div>
                    <textarea id="delivery-note-${key}" placeholder="📝 تیبینی..." rows="3">${escapeHtml(d.deliveryNote||'')}</textarea>
                </div>
                <button class="btn btn-sm btn-primary admin-save-btn" onclick="saveDriverInfo('${key}')">
                    <i class="fas fa-save"></i> پاشەکەوتکردن
                </button>
            </div>
            <div class="label-qr-wrap">
                <img src="${qrUrl}" alt="QR" class="label-qr-img" loading="lazy">
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
            <span class="label-title-center" style="background:#fef3c7; color:#92400e; padding:4px 10px; border-radius:20px; font-size:13px;">UK Delivery</span>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                <button class="btn btn-sm btn-primary" onclick="printUkLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-sm" onclick="editDeliveryLabel('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#e6fffa;color:#276749;border:1.5px solid #68d391;border-radius:8px;cursor:pointer;" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm" onclick="shareDeliveryWhatsApp('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#f0fff4;color:#25d366;border:1.5px solid #25d366;border-radius:8px;cursor:pointer;" title="Share via WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn btn-sm" onclick="deleteDelivery('${key}')" style="padding:5px 10px;font-size:0.8rem;background:#fff0f0;color:#e53e3e;border:1.5px solid #fc8181;border-radius:8px;cursor:pointer;" title="Delete label">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        <div class="label-body-wrap" style="direction:ltr;">
            <div class="label-grid" style="direction:ltr;">
                <div class="label-section receiver-section" style="border-left:3px solid #f0c040; border-right:none;">
                    <div class="label-section-title" style="color:#92400e;">📦 Recipient</div>
                    <div class="label-row" style="direction:ltr;"><span>Name:</span><strong>${escapeHtml(d.fullName||'—')}</strong></div>
                    <div class="label-row" style="direction:ltr;"><span>Phone:</span><strong>${escapeHtml(d.phone||'—')}</strong></div>
                    ${d.receiverName ? `<div class="label-row" style="direction:ltr; background:#fffbeb;"><span>Receiver:</span><strong style="color:#d97706;">📬 ${escapeHtml(d.receiverName)}</strong></div>` : ''}
                    ${d.receiverPhone ? `<div class="label-row" style="direction:ltr; background:#fffbeb;"><span>Receiver Tel:</span><strong style="color:#d97706;">📞 ${escapeHtml(d.receiverPhone)}</strong></div>` : ''}
                    ${d.company ? `<div class="label-row" style="direction:ltr;"><span>Company:</span><strong>${escapeHtml(d.company)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Address:</span><strong>${escapeHtml(d.address1||'—')}</strong></div>
                    ${d.address2 ? `<div class="label-row" style="direction:ltr;"><span>Address 2:</span><strong>${escapeHtml(d.address2)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>City:</span><strong>${escapeHtml(d.city||'—')}</strong></div>
                    ${d.county ? `<div class="label-row" style="direction:ltr;"><span>County:</span><strong>${escapeHtml(d.county)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Postcode:</span><strong>${escapeHtml(d.postcode||'—')}</strong></div>
                    <div class="label-row" style="direction:ltr;"><span>Country:</span><strong>United Kingdom</strong></div>
                </div>
                <div class="label-section sender-section" style="border-right:none; border-left:3px solid #667eea;">
                    <div class="label-section-title" style="color:#667eea;">📬 Package</div>
                    <div class="label-row" style="direction:ltr;"><span>Item:</span><strong>${escapeHtml(d.packageName||'—')}</strong></div>
                    ${d.packageQty ? `<div class="label-row" style="direction:ltr;"><span>Qty:</span><strong>${escapeHtml(String(d.packageQty))} pcs</strong></div>` : ''}
                    ${d.packageKg  ? `<div class="label-row" style="direction:ltr;"><span>Weight:</span><strong>${escapeHtml(String(d.packageKg))} kg</strong></div>` : ''}
                    ${d.payment    ? `<div class="label-row" style="direction:ltr;background:#f0fff4;"><span>&#x1F4B3; Payment:</span><strong style="color:#276749;">${escapeHtml(d.payment)}</strong></div>` : ''}
                    ${d.deliveryNote ? `<div class="label-row" style="direction:ltr;"><span>Notes:</span><strong>${escapeHtml(d.deliveryNote)}</strong></div>` : ''}
                    <div class="label-row" style="direction:ltr;"><span>Date:</span><strong>${escapeHtml(d.timestamp||'—')}</strong></div>
                </div>
            </div>
            <div class="label-admin-edit" style="direction:ltr; text-align:left;">
                <div class="admin-edit-title" style="text-align:left;"><i class="fas fa-pen"></i> Driver & Notes</div>
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
                <img src="${qrUrl}" alt="QR" class="label-qr-img" loading="lazy">
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
                    <div style="display:flex;gap:10px;align-items:center;background:#fff;border-radius:14px;padding:10px 16px;border:2px solid #667eea;box-shadow:0 4px 16px rgba(102,126,234,0.13);">
                        <i class="fas fa-search" style="color:#667eea;font-size:1.1rem;flex-shrink:0;"></i>
                        <input
                            id="deliverySearchBox"
                            type="text"
                            placeholder="ناوی نێردەر، ژمارەی مۆبایل، کۆدی پسولە..."
                            oninput="liveDeliverySearch(this.value)"
                            style="flex:1;border:none;outline:none;font-size:1rem;font-family:inherit;color:#2d3748;direction:rtl;background:transparent;"
                            autocomplete="off"
                        >
                        <span id="deliverySearchCount" style="font-size:0.78rem;color:#667eea;font-weight:700;white-space:nowrap;min-width:40px;text-align:center;"></span>
                        <button onclick="document.getElementById('deliverySearchBox').value='';liveDeliverySearch('');"
                            style="background:none;border:none;cursor:pointer;color:#a0aec0;font-size:1.1rem;padding:0 2px;"
                            onmouseover="this.style.color='#f56565'" onmouseout="this.style.color='#a0aec0'" title="پاككردنەوە">
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

// ==================== Save Driver Info ====================
function saveDriverInfo(key) {
    const driverName   = (document.getElementById('driver-name-' + key) || {value:''}).value.trim();
    const driverMobile = (document.getElementById('driver-mobile-' + key) || {value:''}).value.trim();
    const deliveryNote = (document.getElementById('delivery-note-' + key) || {value:''}).value.trim();

    database.ref('delivery/' + key).update({ driverName, driverMobile, deliveryNote })
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
    const orderNum = card.querySelector('.label-order-num') ? card.querySelector('.label-order-num').textContent.trim() : '';
    const qrImg = card.querySelector('.label-qr-img');
    const qrSrc = qrImg ? qrImg.src : '';
    const rows = (selector) => Array.from(card.querySelectorAll(selector))
        .map(r => `<div class="row"><span>${r.querySelector('span').textContent}</span><strong>${r.querySelector('strong').textContent}</strong></div>`)
        .join('');
    const dateText = card.querySelector('.label-footer span') ? card.querySelector('.label-footer span').textContent : '';

    const printWin = window.open('', '_blank', 'width=640,height=560');
    printWin.document.write(`<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
<meta charset="UTF-8">
<title>لەیبلی گەیاندن ${orderNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Tahoma','Arial',sans-serif;direction:rtl;padding:16px;background:#fff;color:#1a202c}
.wrap{border:3px solid #2d3748;border-radius:12px;padding:16px;max-width:560px;margin:auto}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #667eea;padding-bottom:10px;margin-bottom:12px}
.top-title{font-size:16px;font-weight:bold;color:#667eea}
.top-num{font-size:22px;font-weight:bold;color:#2d3748;background:#eef2ff;padding:4px 14px;border-radius:8px;border:2px solid #667eea}
.top-date{font-size:11px;color:#718096;text-align:center;margin-top:3px}
.body-wrap{display:flex;gap:10px;align-items:flex-start}
.body-main{flex:1}
.cols{display:flex;gap:8px;margin-bottom:10px}
.col{flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:9px;background:#f7fafc}
.col.sender{border-right:3px solid #667eea}
.col.receiver{border-right:3px solid #48bb78}
.col-title{font-size:12px;font-weight:bold;color:#667eea;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:7px}
.col.receiver .col-title{color:#48bb78}
.row{display:flex;justify-content:space-between;font-size:12px;padding:2px 0;border-bottom:1px dotted #e2e8f0;gap:5px}
.row span{color:#718096;white-space:nowrap}.row strong{color:#2d3748}
.pkg{background:#edf2ff;border-radius:8px;padding:9px;margin-bottom:0}
.qr-box{display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f7fafc;min-width:130px}
.qr-box img{width:120px;height:120px}
.qr-box small{font-size:11px;color:#718096}
.foot{text-align:center;font-size:11px;color:#a0aec0;margin-top:10px;border-top:1px dashed #e2e8f0;padding-top:7px}
.info-box{display:flex;justify-content:space-between;font-size:12px;padding:5px 9px;margin-top:5px;border-radius:6px;gap:5px}
.driver-box{background:#ebf8ff;border:1px solid #bee3f8}
.note-box{background:#fefce8;border:1px solid #fde68a}
.info-box span{color:#718096;white-space:nowrap}
.info-box strong{color:#1a202c}
@media print{body{padding:0}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <div class="top-title">🚚 UK BAZAR — لەیبلی گەیاندن</div>
      <div class="top-date">${dateText}</div>
    </div>
    <div class="top-num">${orderNum}</div>
  </div>
  <div class="body-wrap">
    <div class="body-main">
      <div class="cols">
        <div class="col sender"><div class="col-title">📤 نێردەر</div>${rows('.sender-section .label-row')}</div>
        <div class="col receiver"><div class="col-title">📥 وەرگر</div>${rows('.receiver-section .label-row')}</div>
      </div>
      <div class="pkg">${rows('.label-package .label-row:not(.label-driver-row):not(.label-note-row)')}</div>
      ${(() => { const dr = card.querySelector('.label-driver-row'); return dr ? `<div class="info-box driver-box"><span>🚗 شۆفیر:</span><strong>${dr.querySelector('strong').textContent}</strong></div>` : ''; })()}
      ${(() => { const nr = card.querySelector('.label-note-row'); return nr ? `<div class="info-box note-box"><span>📝 تیبینی:</span><strong>${nr.querySelector('strong').textContent}</strong></div>` : ''; })()}
    </div>
    <div class="qr-box">
      <img src="${qrSrc}" alt="QR">
      <small>QR کۆد</small>
    </div>
  </div>
  <div class="foot">UK BAZAR — World Online Shopping</div>
</div>
<\/body><\/html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 600);
}


// ==================== Print UK Delivery Label ====================
function printUkLabel(key) {
    const card = document.getElementById('label-' + key);
    if (!card) return;

    // Read data from the card's label-row elements
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
    const item       = getVal('Item:');
    const qty        = getVal('Qty:').replace(' pcs','');
    const kg         = getVal('Weight:').replace(' kg','');
    const payment    = getVal('💳 Payment:');
    const notes      = getVal('Notes:');
    const dateText   = (card.querySelector('.label-footer span') || {}).textContent || '';
    const qrImg      = card.querySelector('.label-qr-img');
    const qrSrc      = qrImg ? qrImg.src : '';

    const printWin = window.open('', '_blank', 'width=680,height=620');
    printWin.document.write(`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>UK Delivery Label ${orderNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Arial',sans-serif;direction:ltr;padding:16px;background:#fff;color:#1a202c}
.wrap{border:3px solid #d97706;border-radius:12px;padding:16px;max-width:580px;margin:auto}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px dashed #f0c040;padding-bottom:10px;margin-bottom:14px}
.top-left{display:flex;flex-direction:column;gap:3px}
.top-brand{font-size:18px;font-weight:bold;color:#d97706;letter-spacing:1px}
.top-sub{font-size:12px;color:#92400e;background:#fef3c7;padding:2px 8px;border-radius:10px;display:inline-block}
.top-num{font-size:24px;font-weight:bold;color:#1a202c;background:#fef3c7;padding:5px 16px;border-radius:8px;border:2px solid #f0c040}
.body{display:flex;gap:12px;align-items:flex-start}
.body-main{flex:1;display:flex;flex-direction:column;gap:10px}
.section{border:1.5px solid #e2e8f0;border-radius:8px;padding:10px;background:#f8fafc}
.section.recipient{border-left:4px solid #f0c040}
.section.package{border-left:4px solid #667eea}
.section-title{font-size:12px;font-weight:700;color:#92400e;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px}
.section.package .section-title{color:#667eea}
.row{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px dotted #e2e8f0;gap:8px}
.row:last-child{border-bottom:none}
.row span{color:#718096;white-space:nowrap;min-width:70px}
.row strong{color:#1a202c;text-align:right}
.postcode-box{background:#1a1a2e;color:#f0c040;font-size:28px;font-weight:900;text-align:center;padding:10px;border-radius:8px;letter-spacing:4px;margin-top:6px}
.qr-box{display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f7fafc;min-width:130px}
.qr-box img{width:120px;height:120px}
.qr-box small{font-size:10px;color:#718096;text-align:center}
.foot{text-align:center;font-size:11px;color:#a0aec0;margin-top:12px;border-top:1px dashed #e2e8f0;padding-top:8px}
@media print{body{padding:0} .no-print{display:none}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div class="top-left">
      <div class="top-brand">🚚 UK POST</div>
      <div class="top-sub">UK Delivery Label</div>
    </div>
    <div class="top-num">${orderNum.replace('#','').trim()}</div>
  </div>
  <div class="body">
    <div class="body-main">
      <div class="section recipient">
        <div class="section-title">📦 Recipient</div>
        <div class="row"><span>Full Name</span><strong>${name}</strong></div>
        <div class="row"><span>Phone</span><strong>${phone}</strong></div>
        ${receiverName && receiverName !== '—' ? `<div class="row" style="background:#fffbeb;"><span style="color:#d97706;">📬 Receiver</span><strong style="color:#d97706;">${receiverName}</strong></div>` : ''}
        ${receiverPhone && receiverPhone !== '—' ? `<div class="row" style="background:#fffbeb;"><span style="color:#d97706;">📞 Rcvr Tel</span><strong style="color:#d97706;">${receiverPhone}</strong></div>` : ''}
        ${company && company !== '—' ? `<div class="row"><span>Company</span><strong>${company}</strong></div>` : ''}
        <div class="row"><span>Address 1</span><strong>${address1}</strong></div>
        ${address2 && address2 !== '—' ? `<div class="row"><span>Address 2</span><strong>${address2}</strong></div>` : ''}
        <div class="row"><span>City</span><strong>${city}</strong></div>
        ${county && county !== '—' ? `<div class="row"><span>County</span><strong>${county}</strong></div>` : ''}
        <div class="row"><span>Country</span><strong>United Kingdom</strong></div>
        <div class="postcode-box">${postcode}</div>
      </div>
      <div class="section package">
        <div class="section-title">📬 Package Info</div>
        <div class="row"><span>Item</span><strong>${item}</strong></div>
        ${qty && qty !== '—' ? `<div class="row"><span>Qty</span><strong>${qty} pcs</strong></div>` : ''}
        ${kg  && kg  !== '—' ? `<div class="row"><span>Weight</span><strong>${kg} kg</strong></div>` : ''}
        ${payment && payment !== '—' ? `<div class="row" style="background:#f0fff4;"><span style="color:#276749;">Payment</span><strong style="color:#276749;">${payment}</strong></div>` : ''}
        ${notes && notes !== '—' ? `<div class="row"><span>Notes</span><strong>${notes}</strong></div>` : ''}
        <div class="row"><span>Date</span><strong>${dateText.replace('📅','').trim()}</strong></div>
      </div>
    </div>
    <div class="qr-box">
      <img src="${qrSrc}" alt="QR Code">
      <small>Scan for delivery info</small>
    </div>
  </div>
  <div class="foot">UK POST— World Online Shopping |www. ukpost.online</div>
</div>
<\/body><\/html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 600);
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
        msg += `📮 Postcode: ${d.postcode||'—'}\n\n`;
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
                ${autoPhone ? `<div style="background:#f0fff4;border:1.5px solid #68d391;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:.85rem;color:#276749;"><i class="fas fa-check-circle"></i> ژمارەی خاوەنی پۆست ئۆتۆماتیکی دانراوە: <strong style="direction:ltr;display:inline-block;">${autoPhone}</strong></div>` : ''}
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
    const pass = prompt('🔐 وشەی تێپەڕی بەڕێوەبەر داخڵ بکە بۆ سڕینەوەی لەیبل:\n(Admin password required to delete label)');
    if (pass === null) return; // cancelled
    if (pass !== 'admin112233') {
        showNotification('❌ وشەی تێپەڕ هەڵەیە! تەنها بەڕێوەبەر دەتوانێت لەیبل بسڕێتەوە.', 'error');
        return;
    }
    database.ref('delivery/' + key).remove()
        .then(() => {
            showNotification('لەیبل بە سەرکەوتوویی سڕایەوە 🗑️');
            // سڕینەوەی کارتەکە بە ئەنیمەیشن
            const card = document.getElementById('label-' + key);
            if (card) {
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => card.remove(), 300);
            }
            // نوێکردنەوەی لیستی کاشی
            _allDeliveryItems = _allDeliveryItems.filter(i => i.key !== key);
        })
        .catch(() => showNotification('هەڵە لە سڕینەوە!', 'error'));
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
            const orderNum = String(result.snapshot.val()).padStart(2, '0');
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
    const categories = [
        'هەموو کاڵاکان',
        'مۆبایل',
        'لاپتۆپ',
        'کۆمپیوتەر',
        'ئایپاد',
        'ئوتومبێل',
        'ناوماڵ',
        'پاسکیل',
        'سکۆتەر',
        'کامێرا',
        'جوانکاری',
        'خانوو',
        'زەوی',
        'باخ',
        'ئاژەڵ',
        ' پیاوان',
        ' ئافرەتان',
        ' منداڵان'
    ];
    
    const container = document.getElementById('categoryButtons');
    if (!container) return;
    
    container.innerHTML = categories.map(cat => 
        `<button class="category-btn ${cat === 'هەموو کاڵاکان' ? 'active' : ''}" 
                 onclick="filterByCategory('${cat}')"
                 title="${cat}">${cat}</button>`
    ).join('');
}

function filterByCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category);
    });

    const productsTitle = document.getElementById('productsTitle');
    
    if (category === 'هەموو کاڵاکان') {
        renderProducts(products);
        if (productsTitle) productsTitle.textContent = 'هەموو کاڵاکان';
    } else {
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
        if (productsTitle) productsTitle.textContent = `کاڵاکانی ${category}`;
    }
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderProducts(products);
        const productsTitle = document.getElementById('productsTitle');
        if (productsTitle) productsTitle.textContent = 'هەموو کاڵاکان';
        return;
    }

    const results = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
    );

    if (results.length === 0) {
        showNotification('هیچ کاڵایەک نەدۆزرایەوە!', 'error');
        return;
    }

    renderProducts(results);
    const productsTitle = document.getElementById('productsTitle');
    if (productsTitle) productsTitle.textContent = `ئەنجامەکانی گەڕان: "${searchTerm}"`;
    showNotification(`${results.length} کاڵا دۆزرایەوە`);
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
        .pc-dot.active { background:#667eea; }
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
    const images = (product.images && product.images.length > 0) ? product.images : [DEFAULT_PRODUCT_IMAGE];
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
        '<div class="qty-row"><button class="qty-btn qty-minus" onclick="changeQty(\'' + safeId + '\', -1)">−</button><span class="qty-value" id="qtyval-' + safeId + '">1</span><button class="qty-btn qty-plus" onclick="changeQty(\'' + safeId + '\', 1)">+</button><span class="qty-label">دانە</span></div>' +
        '<button class="btn btn-confirm-cart" onclick="confirmAddToCart(\'' + safeId + '\', \'' + safeMobile + '\', \'' + safeName + '\')"><i class="fas fa-check"></i> زیادکردن بۆ سەبەتە</button></div>' +
        '<div class="product-actions">' +
        '<button class="btn btn-primary btn-small" onclick="showQtySelector(\'' + safeId + '\')"><i class="fas fa-cart-plus"></i> <span class="btn-text">سەبەتە</span></button>' +
        '<button class="btn btn-secondary btn-small" onclick="contactSellerWhatsApp(\'' + safeMobile + '\', \'' + safeName + '\')"><i class="fab fa-whatsapp"></i> <span class="btn-text">واتساپ</span></button>' +
        '</div></div></div>';
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
        : '<div style="width:60px;height:60px;background:#667eea;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">📦</div>';
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'buyerInfoModal';
    modal.style.zIndex = '99999';
    modal.innerHTML =
        '<div class="modal-content" style="max-width:440px;">' +
        '<div class="modal-header" style="background:linear-gradient(135deg,#667eea,#764ba2);">' +
        '<button class="close-modal" onclick="document.getElementById(\'buyerInfoModal\').remove()"><i class="fas fa-times"></i></button>' +
        '<h2 style="color:#fff;"><i class="fas fa-shopping-cart"></i> زانیاری کڕیار</h2>' +
        '</div>' +
        '<div style="padding:20px;">' +
        '<div style="background:#f8f9ff;border-radius:12px;padding:12px;margin-bottom:16px;display:flex;gap:12px;align-items:center;border:1.5px solid #e2e8f0;">' +
        thumbHtml +
        '<div><div style="font-weight:700;color:#2d3748;font-size:.95rem;">' + escapeHtml(product.name || '') + '</div>' +
        '<div style="color:#667eea;font-weight:700;font-size:.9rem;">' + escapeHtml(String(product.price || '')) + ' ' + escapeHtml(product.currency || 'IQD') + ' × ' + qty + ' دانە</div></div></div>' +
        '<div class="form-group"><label style="font-weight:700;">👤 ناوی تەواو <span style="color:#e53e3e;">*</span></label>' +
        '<input type="text" id="buyerName" placeholder="ناوت بنووسە..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📞 ژمارەی مۆبایل <span style="color:#e53e3e;">*</span></label>' +
        '<input type="tel" id="buyerMobile" placeholder="مەسەلە: 07701234567" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;direction:ltr;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📍 ناونیشان / شوێن <span style="color:#e53e3e;">*</span></label>' +
        '<input type="text" id="buyerAddress" placeholder="شار، شوێن..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;"></div>' +
        '<div class="form-group"><label style="font-weight:700;">📝 تێبینی (دڵخواز)</label>' +
        '<textarea id="buyerNote" placeholder="هەر تێبینییەک..." rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.95rem;box-sizing:border-box;resize:none;"></textarea></div>' +
        '<div style="display:flex;gap:10px;margin-top:4px;">' +
        '<button onclick="submitBuyerOrder(\'' + escapeHtml(product.firebaseId) + '\',\'' + (product.name||'').replace(/'/g,"\\'") + '\',\'' + (product.price||'') + '\',\'' + (product.currency||'IQD') + '\',' + qty + ',\'' + (sellerMobile||'') + '\')" ' +
        'style="flex:1;background:#25d366;color:#fff;border:none;border-radius:50px;padding:13px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;">' +
        '<i class="fab fa-whatsapp"></i> ناردن و پەیوەندی بە فرۆشیار</button>' +
        '<button onclick="document.getElementById(\'buyerInfoModal\').remove()" ' +
        'style="flex:1;background:#e2e8f0;color:#2d3748;border:none;border-radius:50px;padding:13px;font-family:inherit;font-size:1rem;font-weight:700;cursor:pointer;">✕ پاشگەزبوونەوە</button>' +
        '</div></div></div>';
    document.body.appendChild(modal);
    setTimeout(function() { var el = document.getElementById('buyerName'); if(el) el.focus(); }, 100);
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
        timestamp: new Date().toLocaleString('ku')
    };
    database.ref('requests').push(orderData)
        .then(function() {
            showNotification('✅ داواکارییەکەت نێردرا! بەریوبەر دەبینێتەوە.');
            var m = document.getElementById('buyerInfoModal');
            if (m) m.remove();
            if (sellerMobile) {
                var msg = 'سڵاو، کریارێک داوای کڕینی کاڵاکەت کردووە:\n\n📦 کاڵا: ' + productName +
                    '\n🔢 دانە: ' + qty + '\n💰 نرخ: ' + price + ' ' + currency +
                    '\n\n👤 کڕیار: ' + name + '\n📞 مۆبایل: ' + mobile +
                    '\n📍 ناونیشان: ' + address + (note ? '\n📝 تێبینی: ' + note : '') +
                    '\n\n⏰ داواکاری لە UK BAZAR';
                window.open('https://wa.me/' + sellerMobile.replace(/\D/g,'') + '?text=' + encodeURIComponent(msg), '_blank');
            }
        })
        .catch(function() { showNotification('هەڵە لە ناردن!', 'error'); });
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
                    const imageUrl = child.val().imageUrl;
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
    
    slidesWrapper.innerHTML = images.map(img => 
        '<div class="slide">' +
        '<img src="' + img.url + '" ' +
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
            const packageName     = document.getElementById('ukPackageName').value.trim();
            const packageQty      = (document.getElementById('ukPackageQty')||{value:''}).value.trim();
            const packageKg       = (document.getElementById('ukPackageKg')||{value:''}).value.trim();
            const payment         = (document.getElementById('ukPayment')||{value:''}).value.trim();
            const orderNumber = 'UK-' + Date.now().toString().slice(-6);
            const timestamp   = new Date().toLocaleString('en-GB');
            const deliveryData = {
                type: 'uk', orderNumber,
                fullName, phone, company, postcode, address1, address2, city, county, deliveryNote: note,
                receiverName, receiverPhone, receiverCompany,
                receiverPostcode: receiverPost, receiverAddress1: receiverAddr1, receiverAddress2: receiverAddr2,
                receiverCity, receiverCounty, receiverNote, receiverCountry,
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
        if (senderTab)  { senderTab.style.borderBottom  = '3px solid #667eea'; senderTab.style.color  = '#667eea'; }
        if (receiverTab){ receiverTab.style.borderBottom = '3px solid transparent'; receiverTab.style.color = '#718096'; }
    } else {
        if (senderPanel)   senderPanel.style.display   = 'none';
        if (receiverPanel) receiverPanel.style.display  = 'block';
        if (receiverTab){ receiverTab.style.borderBottom = '3px solid #667eea'; receiverTab.style.color = '#667eea'; }
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
    if (!modal || !grid) return;
    modal.style.cssText = 'display:flex!important;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:99999;align-items:center;justify-content:center;padding:16px;';
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
                if (v.status === 'approved') items.push({ key: child.key, ...v });
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
    const badgeColor = video.type === 'ریکلام' ? '#f56565' : video.type === 'فیرکاری' ? '#48bb78' : '#667eea';

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
    let overlay = document.getElementById('videoFullscreenOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'videoFullscreenOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.96);display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML =
            '<button onclick="closeVideoModal()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:1.4rem;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;">✕</button>' +
            '<div id="videoFullscreenInner" style="width:95vw;max-width:960px;"></div>';
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeVideoModal(); });
        document.body.appendChild(overlay);
    }
    const inner = document.getElementById('videoFullscreenInner');
    if (isYoutube) {
        inner.innerHTML = '<div style="position:relative;padding-top:56.25%;width:100%;"><iframe src="' + src + '&autoplay=1" frameborder="0" allowfullscreen allow="autoplay;encrypted-media" style="position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:8px;"></iframe></div>';
    } else {
        inner.innerHTML = '<video src="' + src + '" controls autoplay style="width:100%;max-height:85vh;border-radius:8px;display:block;"></video>';
    }
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const overlay = document.getElementById('videoFullscreenOverlay');
    if (!overlay) return;
    const inner = document.getElementById('videoFullscreenInner');
    if (inner) inner.innerHTML = '';
    overlay.style.display = 'none';
    document.body.style.overflow = '';
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
                    style="flex:1;padding:10px;border-radius:10px;border:2px solid #667eea;background:#667eea;color:#fff;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;">
                    <i class="fab fa-youtube"></i> YouTube لینک
                </button>
                <button type="button" id="srcUpload" onclick="switchVideoSource('upload')"
                    style="flex:1;padding:10px;border-radius:10px;border:2px solid #e2e8f0;background:#fff;color:#2d3748;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;">
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
                            <span style="font-size:.82rem;color:#667eea;font-weight:700;">بارکردن...</span>
                            <span id="uploadPct" style="font-size:.82rem;color:#667eea;font-weight:700;">0%</span>
                        </div>
                        <div style="background:#e2e8f0;border-radius:50px;height:8px;overflow:hidden;">
                            <div id="uploadBar" style="height:100%;background:linear-gradient(90deg,#667eea,#764ba2);width:0%;border-radius:50px;transition:width .2s;"></div>
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
        youtubeBtn.style.background = '#667eea'; youtubeBtn.style.color = '#fff'; youtubeBtn.style.borderColor = '#667eea';
        uploadBtn.style.background  = '#fff';    uploadBtn.style.color  = '#2d3748'; uploadBtn.style.borderColor = '#e2e8f0';
    } else {
        youtubePanel.style.display = 'none';
        uploadPanel.style.display  = 'block';
        uploadBtn.style.background  = '#667eea'; uploadBtn.style.color = '#fff'; uploadBtn.style.borderColor = '#667eea';
        youtubeBtn.style.background = '#fff';    youtubeBtn.style.color = '#2d3748'; youtubeBtn.style.borderColor = '#e2e8f0';
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
                const bc = v.type === '\u0695\u06CC\u06A9\u0644\u0627\u0645' ? '#f56565' : v.type === '\u0641\u06CC\u0631\u06A9\u0627\u0631\u06CC' ? '#48bb78' : '#667eea';
                const isYT = !!getYouTubeId(v.videoUrl);
                const srcIcon = isYT ? '<i class="fab fa-youtube" style="color:#f56565;"></i>' : '<i class="fas fa-file-video" style="color:#667eea;"></i>';
                const statusColor = v.status === 'approved' ? '#48bb78' : '#f59e0b';
                const statusLabel = v.status === 'approved' ? '✅' : '⏳';
                html += '<div style="display:flex;gap:12px;align-items:center;background:#f8f9ff;border-radius:12px;padding:12px;margin-bottom:10px;border:1.5px solid #e2e8f0;">';
                if (thumb) {
                    html += '<img src="' + thumb + '" style="width:80px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0;" onerror="this.style.display=\'none\'">';
                } else {
                    html += '<div style="width:80px;height:54px;background:#e2e8f0;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🎬</div>';
                }
                html += '<div style="flex:1;min-width:0;">';
                html += '<div style="font-weight:700;font-size:.9rem;color:#2d3748;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(v.title || 'ڤیدیۆ') + '</div>';
                html += '<div style="margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">';
                html += '<span style="background:' + bc + ';color:#fff;padding:2px 8px;border-radius:20px;font-size:.72rem;">' + escapeHtml(v.type || '') + '</span>';
                html += '<span style="background:' + statusColor + ';color:#fff;padding:2px 6px;border-radius:20px;font-size:.68rem;">' + statusLabel + ' ' + escapeHtml(v.status || 'pending') + '</span>';
                html += srcIcon + '</div>';
                html += '<div style="font-size:.75rem;color:#718096;margin-top:3px;">' + escapeHtml(v.uploaderName || '') + ' — ' + escapeHtml(v.timestamp || '') + '</div>';
                html += '</div>';
                html += '<button onclick="deleteVideo(\'' + v.key + '\')" style="background:#fff0f0;color:#e53e3e;border:1.5px solid #fc8181;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.82rem;flex-shrink:0;"><i class="fas fa-trash"></i></button>';
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
