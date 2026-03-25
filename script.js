function ukSwitchTab(tab) {
        document.getElementById('ukPanel-sender').style.display   = tab==='sender'   ? 'block' : 'none';
        document.getElementById('ukPanel-receiver').style.display = tab==='receiver' ? 'block' : 'none';
        var s = document.getElementById('ukTab-sender');
        var r = document.getElementById('ukTab-receiver');
        s.style.borderBottom = tab==='sender'   ? '3px solid #667eea' : '3px solid transparent';
        s.style.color        = tab==='sender'   ? '#667eea' : '#718096';
        r.style.borderBottom = tab==='receiver' ? '3px solid #48bb78' : '3px solid transparent';
        r.style.color        = tab==='receiver' ? '#48bb78' : '#718096';
    }
    function ukGoToReceiver() {
        if (!document.getElementById('ukFullName').value.trim() ||
            !document.getElementById('ukPhone').value.trim() ||
            !document.getElementById('ukAddress1').value.trim() ||
            !document.getElementById('ukCity').value.trim() ||
            !document.getElementById('ukPostcode').value.trim()) {
            alert('Please fill in all required sender fields before continuing.');
            return;
        }
        ukSwitchTab('receiver');
    }

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
const database = firebase.database();
const storage = firebase.storage();

let products = [];
let cart = [];
let isAdmin = false;
let currentSlide = 0;
let totalSlides = 0;
let autoPlayInterval = null;

// وێنەی یەدەگ - بەکارهێنانی وێنەی SVG سادە
const DEFAULT_PRODUCT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Crect width=\'300\' height=\'300\' fill=\'%23667eea\'/%3E%3Ctext x=\'50\' y=\'150\' font-family=\'Arial\' font-size=\'24\' fill=\'%23ffffff\'%3EUK BAZAR%3C/text%3E%3C/svg%3E';
const DEFAULT_SLIDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'1200\' height=\'400\' viewBox=\'0 0 1200 400\'%3E%3Crect width=\'1200\' height=\'400\' fill=\'%23667eea\'/%3E%3Ctext x=\'400\' y=\'200\' font-family=\'Arial\' font-size=\'48\' fill=\'%23ffffff\'%3EUK BAZAR%3C/text%3E%3C/svg%3E';

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
            
            let html = '<div class="pending-items">';
            
            snapshot.forEach((child) => {
                const request = child.val();
                html += `
                    <div class="pending-item">
                        <h4>📋 ${escapeHtml(request.itemName)}</h4>
                        <p><strong>کەس:</strong> ${escapeHtml(request.name)} - ${escapeHtml(request.mobile)}</p>
                        <p><strong>وردەکاری:</strong> ${escapeHtml(request.details) || 'بەبەتاڵ'}</p>
                        <p><strong>بەروار:</strong> ${escapeHtml(request.timestamp)}</p>
                    </div>
                `;
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

// ==================== Improved Delivery Functions ====================

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
        html = '<p style="text-align:center;color:var(--gray);padding:40px 20px;">هیچ ئەنجامێک نەدۆزرایەوە</p>';
        resultsDiv.innerHTML = html;
        return;
    }

    if (kurdishItems.length > 0) {
        html += `
            <div class="delivery-section-header">
                <i class="fas fa-shipping-fast"></i> 
                <span>داواکارییە کوردییەکان (${kurdishItems.length})</span>
            </div>
            <div class="delivery-items-grid">
        `;
        kurdishItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const qrText = encodeURIComponent(
                `پسولە: ${orderNum} | نێردەر: ${d.senderName||d.name||''} ${d.senderMobile||d.mobile||''} (${d.senderLocation||d.address||''}) | وەرگر: ${d.receiverName||''} ${d.receiverMobile||''} (${d.receiverLocation||''}) | کەلوپەل: ${d.packageName||d.details||''} x${d.packageQty||''} - ${d.packageKg||''}کگ`
            );
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;
            html += buildImprovedKurdishLabelHtml(d, key, orderNum, qrUrl);
        });
        html += `</div>`;
    }

    if (ukItems.length > 0) {
        html += `
            <div class="delivery-section-header uk-header">
                <i class="fas fa-globe"></i> 
                <span>UK Delivery Requests (${ukItems.length})</span>
            </div>
            <div class="delivery-items-grid">
        `;
        ukItems.forEach((d) => {
            const key = d.key;
            const orderNum = d.orderNumber || '—';
            const fullAddress = [d.address1, d.address2, d.city, d.county, d.postcode, 'United Kingdom'].filter(Boolean).join(', ');
            const qrText = encodeURIComponent(`Order: ${orderNum} | To: ${d.fullName||''} | Tel: ${d.phone||''} | ${fullAddress} | Item: ${d.packageName||''}`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrText}`;
            html += buildImprovedUkLabelHtml(d, key, orderNum, qrUrl);
        });
        html += `</div>`;
    }

    resultsDiv.innerHTML = html;
}

function buildImprovedKurdishLabelHtml(d, key, orderNum, qrUrl) {
    return `
    <div class="delivery-label-card" id="label-${key}" data-order="${orderNum}">
        <div class="label-card-header">
            <div class="label-order-badge">
                <i class="fas fa-tag"></i>
                <span>#${orderNum}</span>
            </div>
            <div class="label-actions">
                <button class="label-action-btn print-btn" onclick="printLabel('${key}')" title="چاپکردن">
                    <i class="fas fa-print"></i>
                </button>
                <button class="label-action-btn delete-btn" onclick="deleteDeliveryItem('${key}')" title="سڕینەوە">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        
        <div class="label-card-body">
            <div class="label-grid">
                <div class="label-info-card sender-card">
                    <div class="info-card-title">
                        <i class="fas fa-user-circle"></i>
                        <span>نێردەر</span>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">ناو:</span>
                            <span class="info-value">${escapeHtml(d.senderName||d.name||'—')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ژمارە:</span>
                            <span class="info-value">${escapeHtml(d.senderMobile||d.mobile||'—')}</span>
                        </div>
                        ${d.senderMobile2 ? `<div class="info-row"><span class="info-label">ژمارە ٢:</span><span class="info-value">${escapeHtml(d.senderMobile2)}</span></div>` : ''}
                        <div class="info-row">
                            <span class="info-label">شوێن:</span>
                            <span class="info-value">${escapeHtml(d.senderLocation||d.address||'—')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="label-info-card receiver-card">
                    <div class="info-card-title">
                        <i class="fas fa-user-check"></i>
                        <span>وەرگر</span>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">ناو:</span>
                            <span class="info-value">${escapeHtml(d.receiverName||'—')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">ژمارە:</span>
                            <span class="info-value">${escapeHtml(d.receiverMobile||'—')}</span>
                        </div>
                        ${d.receiverMobile2 ? `<div class="info-row"><span class="info-label">ژمارە ٢:</span><span class="info-value">${escapeHtml(d.receiverMobile2)}</span></div>` : ''}
                        <div class="info-row">
                            <span class="info-label">شوێن:</span>
                            <span class="info-value">${escapeHtml(d.receiverLocation||'—')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="label-package-card">
                <div class="package-title">
                    <i class="fas fa-box"></i>
                    <span>زانیاری کەلوپەل</span>
                </div>
                <div class="package-details">
                    <div class="detail-item">
                        <span class="detail-label">ناوی کەلوپەل:</span>
                        <span class="detail-value">${escapeHtml(d.packageName||d.details||'—')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ژمارەی پارچە:</span>
                        <span class="detail-value">${escapeHtml(String(d.packageQty||'—'))}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">کیلۆ:</span>
                        <span class="detail-value">${escapeHtml(String(d.packageKg||'—'))} کگ</span>
                    </div>
                </div>
            </div>
            
            <div class="label-driver-card">
                <div class="driver-title">
                    <i class="fas fa-truck"></i>
                    <span>زانیاری گەیاندن</span>
                </div>
                <div class="driver-fields">
                    <div class="driver-inputs">
                        <div class="input-group">
                            <input type="text" id="driver-name-${key}" placeholder="ناوی شۆفیر" value="${escapeHtml(d.driverName||'')}">
                        </div>
                        <div class="input-group">
                            <input type="tel" id="driver-mobile-${key}" placeholder="ژمارەی مۆبایل" value="${escapeHtml(d.driverMobile||'')}">
                        </div>
                    </div>
                    <div class="input-group full-width">
                        <textarea id="delivery-note-${key}" placeholder="تیبینی..." rows="2">${escapeHtml(d.deliveryNote||'')}</textarea>
                    </div>
                    <button class="save-driver-btn" onclick="saveDriverInfo('${key}')">
                        <i class="fas fa-save"></i> پاشەکەوتکردن
                    </button>
                </div>
            </div>
            
            <div class="label-footer-info">
                <div class="label-qr">
                    <img src="${qrUrl}" alt="QR" class="qr-code-img" loading="lazy">
                    <span class="qr-label">QR کۆد</span>
                </div>
                <div class="label-timestamp">
                    <i class="far fa-calendar-alt"></i>
                    <span>${escapeHtml(d.timestamp||'')}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function buildImprovedUkLabelHtml(d, key, orderNum, qrUrl) {
    return `
    <div class="delivery-label-card uk-label" id="label-${key}" data-order="${orderNum}">
        <div class="label-card-header">
            <div class="label-order-badge uk-badge">
                <i class="fas fa-flag-uk"></i>
                <span>${orderNum}</span>
            </div>
            <div class="label-actions">
                <button class="label-action-btn print-btn" onclick="printUkLabel('${key}')" title="Print">
                    <i class="fas fa-print"></i>
                </button>
                <button class="label-action-btn delete-btn" onclick="deleteDeliveryItem('${key}')" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
        
        <div class="label-card-body">
            <div class="label-grid uk-grid">
                <div class="label-info-card receiver-card uk-receiver">
                    <div class="info-card-title">
                        <i class="fas fa-user-check"></i>
                        <span>Recipient</span>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${escapeHtml(d.fullName||'—')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${escapeHtml(d.phone||'—')}</span>
                        </div>
                        ${d.company ? `<div class="info-row"><span class="info-label">Company:</span><span class="info-value">${escapeHtml(d.company)}</span></div>` : ''}
                        <div class="info-row">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${escapeHtml(d.address1||'—')}</span>
                        </div>
                        ${d.address2 ? `<div class="info-row"><span class="info-label">Address 2:</span><span class="info-value">${escapeHtml(d.address2)}</span></div>` : ''}
                        <div class="info-row">
                            <span class="info-label">City:</span>
                            <span class="info-value">${escapeHtml(d.city||'—')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Postcode:</span>
                            <span class="info-value postcode-value">${escapeHtml(d.postcode||'—')}</span>
                        </div>
                    </div>
                </div>
                
                <div class="label-info-card sender-card uk-package">
                    <div class="info-card-title">
                        <i class="fas fa-box"></i>
                        <span>Package</span>
                    </div>
                    <div class="info-card-content">
                        <div class="info-row">
                            <span class="info-label">Item:</span>
                            <span class="info-value">${escapeHtml(d.packageName||'—')}</span>
                        </div>
                        ${d.receiverName ? `<div class="info-row"><span class="info-label">Receiver:</span><span class="info-value">${escapeHtml(d.receiverName)}</span></div>` : ''}
                        ${d.receiverPhone ? `<div class="info-row"><span class="info-label">Receiver Tel:</span><span class="info-value">${escapeHtml(d.receiverPhone)}</span></div>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="label-driver-card">
                <div class="driver-title">
                    <i class="fas fa-truck"></i>
                    <span>Driver Info</span>
                </div>
                <div class="driver-fields">
                    <div class="driver-inputs">
                        <div class="input-group">
                            <input type="text" id="driver-name-${key}" placeholder="Driver name" value="${escapeHtml(d.driverName||'')}">
                        </div>
                        <div class="input-group">
                            <input type="tel" id="driver-mobile-${key}" placeholder="Phone number" value="${escapeHtml(d.driverMobile||'')}">
                        </div>
                    </div>
                    <div class="input-group full-width">
                        <textarea id="delivery-note-${key}" placeholder="Notes..." rows="2">${escapeHtml(d.deliveryNote||'')}</textarea>
                    </div>
                    <button class="save-driver-btn" onclick="saveDriverInfo('${key}')">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            
            <div class="label-footer-info">
                <div class="label-qr">
                    <img src="${qrUrl}" alt="QR" class="qr-code-img" loading="lazy">
                    <span class="qr-label">QR Code</span>
                </div>
                <div class="label-timestamp">
                    <i class="far fa-calendar-alt"></i>
                    <span>${escapeHtml(d.timestamp||'')}</span>
                </div>
            </div>
        </div>
    </div>`;
}

// Delete delivery item function
function deleteDeliveryItem(key) {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم داواکاری گەیاندنە؟')) {
        database.ref('delivery/' + key).remove()
            .then(() => {
                showNotification('داواکاری گەیاندن بە سەرکەوتوویی سڕایەوە! 🗑️');
                loadDeliveryRequests();
            })
            .catch(() => {
                showNotification('هەڵە لە سڕینەوە!', 'error');
            });
    }
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
// ==================== Improved Print Functions ====================

function printLabel(key) {
    const card = document.getElementById('label-' + key);
    if (!card) return;
    
    // Extract all data from the card
    const orderNum = card.querySelector('.label-order-badge span')?.textContent.trim() || '';
    const timestamp = card.querySelector('.label-timestamp span')?.textContent.trim() || '';
    
    // Get sender info
    const senderName = getLabelValue(card, '.sender-card .info-row:first-child .info-value');
    const senderMobile = getLabelValue(card, '.sender-card .info-row:nth-child(2) .info-value');
    const senderMobile2 = getLabelValue(card, '.sender-card .info-row:nth-child(3) .info-value');
    const senderLocation = getLabelValue(card, '.sender-card .info-row:last-child .info-value');
    
    // Get receiver info
    const receiverName = getLabelValue(card, '.receiver-card .info-row:first-child .info-value');
    const receiverMobile = getLabelValue(card, '.receiver-card .info-row:nth-child(2) .info-value');
    const receiverMobile2 = getLabelValue(card, '.receiver-card .info-row:nth-child(3) .info-value');
    const receiverLocation = getLabelValue(card, '.receiver-card .info-row:last-child .info-value');
    
    // Get package info
    const packageName = getLabelValue(card, '.detail-item:first-child .detail-value');
    const packageQty = getLabelValue(card, '.detail-item:nth-child(2) .detail-value');
    const packageKg = getLabelValue(card, '.detail-item:last-child .detail-value');
    
    // Get driver info
    const driverName = document.getElementById('driver-name-' + key)?.value || '';
    const driverMobile = document.getElementById('driver-mobile-' + key)?.value || '';
    const deliveryNote = document.getElementById('delivery-note-' + key)?.value || '';
    
    // Get QR code image
    const qrImg = card.querySelector('.qr-code-img');
    const qrSrc = qrImg ? qrImg.src : '';
    
    const printWin = window.open('', '_blank', 'width=720,height=900');
    printWin.document.write(`<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
<meta charset="UTF-8">
<title>لەیبلی گەیاندن ${orderNum}</title>
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Tahoma', 'Arial', 'Noto Sans Arabic', sans-serif;
        direction: rtl;
        padding: 20px;
        background: #fff;
        color: #1a202c;
    }
    
    .print-container {
        max-width: 700px;
        margin: 0 auto;
        border: 2px solid #2d3748;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .print-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        text-align: center;
    }
    
    .print-header h1 {
        font-size: 24px;
        margin-bottom: 5px;
    }
    
    .print-header p {
        font-size: 12px;
        opacity: 0.9;
    }
    
    .order-badge {
        background: white;
        color: #667eea;
        display: inline-block;
        padding: 5px 15px;
        border-radius: 30px;
        font-weight: bold;
        margin-top: 10px;
        font-size: 18px;
    }
    
    .print-body {
        padding: 20px;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .info-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
    }
    
    .info-card-header {
        background: #f7fafc;
        padding: 10px 15px;
        font-weight: bold;
        border-bottom: 2px solid;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .info-card-header.sender {
        border-bottom-color: #667eea;
        color: #667eea;
    }
    
    .info-card-header.receiver {
        border-bottom-color: #48bb78;
        color: #48bb78;
    }
    
    .info-card-content {
        padding: 12px 15px;
    }
    
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 13px;
    }
    
    .info-row:last-child {
        border-bottom: none;
    }
    
    .info-label {
        color: #718096;
        font-weight: 500;
    }
    
    .info-value {
        font-weight: 600;
        color: #2d3748;
        text-align: left;
    }
    
    .package-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        margin-bottom: 20px;
        background: #fefce8;
    }
    
    .package-header {
        background: #fef3c7;
        padding: 10px 15px;
        font-weight: bold;
        color: #d97706;
        border-bottom: 1px solid #fde68a;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .package-details {
        padding: 12px 15px;
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .package-item {
        flex: 1;
        min-width: 120px;
    }
    
    .package-item-label {
        font-size: 11px;
        color: #718096;
        margin-bottom: 4px;
    }
    
    .package-item-value {
        font-size: 15px;
        font-weight: bold;
        color: #2d3748;
    }
    
    .driver-card {
        border: 1px solid #fed7aa;
        border-radius: 12px;
        margin-bottom: 20px;
        background: #fff7ed;
    }
    
    .driver-header {
        background: #fed7aa;
        padding: 10px 15px;
        font-weight: bold;
        color: #92400e;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .driver-content {
        padding: 12px 15px;
    }
    
    .driver-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
    }
    
    .note-box {
        background: #fef9e6;
        padding: 10px;
        border-radius: 8px;
        margin-top: 10px;
        font-size: 12px;
        border-right: 3px solid #f0c040;
    }
    
    .footer-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px dashed #e2e8f0;
    }
    
    .qr-code {
        text-align: center;
    }
    
    .qr-code img {
        width: 100px;
        height: 100px;
        border: 1px solid #e2e8f0;
        padding: 5px;
        border-radius: 8px;
    }
    
    .qr-label {
        font-size: 10px;
        color: #718096;
        margin-top: 5px;
        display: block;
    }
    
    .timestamp {
        font-size: 11px;
        color: #718096;
    }
    
    .print-footer {
        background: #f7fafc;
        padding: 12px;
        text-align: center;
        font-size: 11px;
        color: #718096;
        border-top: 1px solid #e2e8f0;
    }
    
    @media print {
        body {
            padding: 0;
            margin: 0;
        }
        .print-container {
            box-shadow: none;
            border: 1px solid #ddd;
        }
        .save-driver-btn, .label-action-btn {
            display: none;
        }
    }
</style>
</head>
<body>
    <div class="print-container">
        <div class="print-header">
            <h1>🚚 UK BAZAR</h1>
            <p>World Online Shopping - لەیبلی گەیاندن</p>
            <div class="order-badge">#${orderNum}</div>
        </div>
        
        <div class="print-body">
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header sender">
                        <i class="fas fa-user-circle"></i> 📤 نێردەر
                    </div>
                    <div class="info-card-content">
                        <div class="info-row"><span class="info-label">ناو:</span><span class="info-value">${escapeHtml(senderName)}</span></div>
                        <div class="info-row"><span class="info-label">ژمارە:</span><span class="info-value">${escapeHtml(senderMobile)}</span></div>
                        ${senderMobile2 && senderMobile2 !== '—' ? `<div class="info-row"><span class="info-label">ژمارە ٢:</span><span class="info-value">${escapeHtml(senderMobile2)}</span></div>` : ''}
                        <div class="info-row"><span class="info-label">شوێن:</span><span class="info-value">${escapeHtml(senderLocation)}</span></div>
                    </div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header receiver">
                        <i class="fas fa-user-check"></i> 📥 وەرگر
                    </div>
                    <div class="info-card-content">
                        <div class="info-row"><span class="info-label">ناو:</span><span class="info-value">${escapeHtml(receiverName)}</span></div>
                        <div class="info-row"><span class="info-label">ژمارە:</span><span class="info-value">${escapeHtml(receiverMobile)}</span></div>
                        ${receiverMobile2 && receiverMobile2 !== '—' ? `<div class="info-row"><span class="info-label">ژمارە ٢:</span><span class="info-value">${escapeHtml(receiverMobile2)}</span></div>` : ''}
                        <div class="info-row"><span class="info-label">شوێن:</span><span class="info-value">${escapeHtml(receiverLocation)}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="package-card">
                <div class="package-header">
                    <i class="fas fa-box"></i> 📦 زانیاری کەلوپەل
                </div>
                <div class="package-details">
                    <div class="package-item">
                        <div class="package-item-label">ناوی کەلوپەل</div>
                        <div class="package-item-value">${escapeHtml(packageName)}</div>
                    </div>
                    <div class="package-item">
                        <div class="package-item-label">ژمارەی پارچە</div>
                        <div class="package-item-value">${escapeHtml(packageQty)}</div>
                    </div>
                    <div class="package-item">
                        <div class="package-item-label">کیلۆ</div>
                        <div class="package-item-value">${escapeHtml(packageKg)}</div>
                    </div>
                </div>
            </div>
            
            <div class="driver-card">
                <div class="driver-header">
                    <i class="fas fa-truck"></i> 🚚 زانیاری گەیاندن
                </div>
                <div class="driver-content">
                    <div class="driver-row"><span class="info-label">👤 شۆفیر:</span><span class="info-value">${escapeHtml(driverName) || '—'}</span></div>
                    <div class="driver-row"><span class="info-label">📞 ژمارەی شۆفیر:</span><span class="info-value">${escapeHtml(driverMobile) || '—'}</span></div>
                    ${deliveryNote ? `<div class="note-box"><strong>📝 تیبینی:</strong><br>${escapeHtml(deliveryNote)}</div>` : ''}
                </div>
            </div>
            
            <div class="footer-section">
                <div class="qr-code">
                    ${qrSrc ? `<img src="${qrSrc}" alt="QR Code">` : '<div style="width:100px;height:100px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;">QR</div>'}
                    <span class="qr-label">QR کۆد بۆ سکانکردن</span>
                </div>
                <div class="timestamp">
                    <i class="far fa-calendar-alt"></i> ${escapeHtml(timestamp)}
                </div>
            </div>
        </div>
        
        <div class="print-footer">
            UK BAZAR - World Online Shopping | www.ukbazar.online | پەیوەندی: 07755436275
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 1000);
        };
    <\/script>
</body>
</html>`);
    printWin.document.close();
}

function printUkLabel(key) {
    const card = document.getElementById('label-' + key);
    if (!card) return;
    
    const orderNum = card.querySelector('.label-order-badge span')?.textContent.trim() || '';
    const timestamp = card.querySelector('.label-timestamp span')?.textContent.trim() || '';
    
    // Get recipient info
    const fullName = getLabelValue(card, '.uk-receiver .info-row:first-child .info-value');
    const phone = getLabelValue(card, '.uk-receiver .info-row:nth-child(2) .info-value');
    const company = getLabelValue(card, '.uk-receiver .info-row:nth-child(3) .info-value');
    const address1 = getLabelValue(card, '.uk-receiver .info-row:nth-child(4) .info-value');
    const address2 = getLabelValue(card, '.uk-receiver .info-row:nth-child(5) .info-value');
    const city = getLabelValue(card, '.uk-receiver .info-row:nth-child(6) .info-value');
    const postcode = getLabelValue(card, '.uk-receiver .info-row:last-child .info-value');
    
    // Get package info
    const packageName = getLabelValue(card, '.uk-package .info-row:first-child .info-value');
    const receiverName = getLabelValue(card, '.uk-package .info-row:nth-child(2) .info-value');
    const receiverPhone = getLabelValue(card, '.uk-package .info-row:nth-child(3) .info-value');
    
    // Get driver info
    const driverName = document.getElementById('driver-name-' + key)?.value || '';
    const driverMobile = document.getElementById('driver-mobile-' + key)?.value || '';
    const deliveryNote = document.getElementById('delivery-note-' + key)?.value || '';
    
    const qrImg = card.querySelector('.qr-code-img');
    const qrSrc = qrImg ? qrImg.src : '';
    
    const printWin = window.open('', '_blank', 'width=720,height=900');
    printWin.document.write(`<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<title>UK Delivery Label ${orderNum}</title>
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    body {
        font-family: 'Segoe UI', 'Arial', sans-serif;
        direction: ltr;
        padding: 20px;
        background: #fff;
        color: #1a202c;
    }
    
    .print-container {
        max-width: 700px;
        margin: 0 auto;
        border: 2px solid #d97706;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .print-header {
        background: linear-gradient(135deg, #f0c040, #d4a017);
        color: #1a1a1a;
        padding: 20px;
        text-align: center;
    }
    
    .print-header h1 {
        font-size: 24px;
        margin-bottom: 5px;
    }
    
    .print-header p {
        font-size: 12px;
        opacity: 0.8;
    }
    
    .order-badge {
        background: white;
        color: #d97706;
        display: inline-block;
        padding: 5px 15px;
        border-radius: 30px;
        font-weight: bold;
        margin-top: 10px;
        font-size: 18px;
    }
    
    .print-body {
        padding: 20px;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .info-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
    }
    
    .info-card-header {
        background: #f7fafc;
        padding: 10px 15px;
        font-weight: bold;
        border-bottom: 2px solid;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .info-card-header.recipient {
        border-bottom-color: #f0c040;
        color: #d97706;
    }
    
    .info-card-header.package {
        border-bottom-color: #667eea;
        color: #667eea;
    }
    
    .info-card-content {
        padding: 12px 15px;
    }
    
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px dotted #e2e8f0;
        font-size: 13px;
    }
    
    .info-row:last-child {
        border-bottom: none;
    }
    
    .info-label {
        color: #718096;
        font-weight: 500;
    }
    
    .info-value {
        font-weight: 600;
        color: #2d3748;
        text-align: right;
    }
    
    .postcode-highlight {
        background: #fef3c7;
        padding: 2px 8px;
        border-radius: 12px;
        font-family: monospace;
        font-weight: bold;
        font-size: 14px;
    }
    
    .driver-card {
        border: 1px solid #fed7aa;
        border-radius: 12px;
        margin-bottom: 20px;
        background: #fff7ed;
    }
    
    .driver-header {
        background: #fed7aa;
        padding: 10px 15px;
        font-weight: bold;
        color: #92400e;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .driver-content {
        padding: 12px 15px;
    }
    
    .driver-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
    }
    
    .note-box {
        background: #fef9e6;
        padding: 10px;
        border-radius: 8px;
        margin-top: 10px;
        font-size: 12px;
        border-left: 3px solid #f0c040;
    }
    
    .footer-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px dashed #e2e8f0;
    }
    
    .qr-code {
        text-align: center;
    }
    
    .qr-code img {
        width: 100px;
        height: 100px;
        border: 1px solid #e2e8f0;
        padding: 5px;
        border-radius: 8px;
    }
    
    .qr-label {
        font-size: 10px;
        color: #718096;
        margin-top: 5px;
        display: block;
    }
    
    .timestamp {
        font-size: 11px;
        color: #718096;
    }
    
    .print-footer {
        background: #f7fafc;
        padding: 12px;
        text-align: center;
        font-size: 11px;
        color: #718096;
        border-top: 1px solid #e2e8f0;
    }
    
    @media print {
        body {
            padding: 0;
            margin: 0;
        }
        .print-container {
            box-shadow: none;
            border: 1px solid #ddd;
        }
    }
</style>
</head>
<body>
    <div class="print-container">
        <div class="print-header">
            <h1>🚚 UK POST LTD</h1>
            <p>UK Delivery Label - UK BAZAR</p>
            <div class="order-badge">${orderNum}</div>
        </div>
        
        <div class="print-body">
            <div class="info-grid">
                <div class="info-card">
                    <div class="info-card-header recipient">
                        <i class="fas fa-user-check"></i> 📬 Recipient
                    </div>
                    <div class="info-card-content">
                        <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${escapeHtml(fullName)}</span></div>
                        <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${escapeHtml(phone)}</span></div>
                        ${company && company !== '—' ? `<div class="info-row"><span class="info-label">Company:</span><span class="info-value">${escapeHtml(company)}</span></div>` : ''}
                        <div class="info-row"><span class="info-label">Address 1:</span><span class="info-value">${escapeHtml(address1)}</span></div>
                        ${address2 && address2 !== '—' ? `<div class="info-row"><span class="info-label">Address 2:</span><span class="info-value">${escapeHtml(address2)}</span></div>` : ''}
                        <div class="info-row"><span class="info-label">City:</span><span class="info-value">${escapeHtml(city)}</span></div>
                        <div class="info-row"><span class="info-label">Postcode:</span><span class="info-value"><span class="postcode-highlight">${escapeHtml(postcode)}</span></span></div>
                    </div>
                </div>
                
                <div class="info-card">
                    <div class="info-card-header package">
                        <i class="fas fa-box"></i> 📦 Package Info
                    </div>
                    <div class="info-card-content">
                        <div class="info-row"><span class="info-label">Item:</span><span class="info-value">${escapeHtml(packageName)}</span></div>
                        ${receiverName && receiverName !== '—' ? `<div class="info-row"><span class="info-label">Receiver Name:</span><span class="info-value">${escapeHtml(receiverName)}</span></div>` : ''}
                        ${receiverPhone && receiverPhone !== '—' ? `<div class="info-row"><span class="info-label">Receiver Phone:</span><span class="info-value">${escapeHtml(receiverPhone)}</span></div>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="driver-card">
                <div class="driver-header">
                    <i class="fas fa-truck"></i> 🚚 Delivery Information
                </div>
                <div class="driver-content">
                    <div class="driver-row"><span class="info-label">👤 Driver Name:</span><span class="info-value">${escapeHtml(driverName) || '—'}</span></div>
                    <div class="driver-row"><span class="info-label">📞 Driver Phone:</span><span class="info-value">${escapeHtml(driverMobile) || '—'}</span></div>
                    ${deliveryNote ? `<div class="note-box"><strong>📝 Notes:</strong><br>${escapeHtml(deliveryNote)}</div>` : ''}
                </div>
            </div>
            
            <div class="footer-section">
                <div class="qr-code">
                    ${qrSrc ? `<img src="${qrSrc}" alt="QR Code">` : '<div style="width:100px;height:100px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:12px;">QR</div>'}
                    <span class="qr-label">Scan QR Code</span>
                </div>
                <div class="timestamp">
                    <i class="far fa-calendar-alt"></i> ${escapeHtml(timestamp)}
                </div>
            </div>
        </div>
        
        <div class="print-footer">
            UK POST LTD - UK BAZAR | www.ukbazar.online | Contact: 00447449218670
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 1000);
        };
    <\/script>
</body>
</html>`);
    printWin.document.close();
}

// Helper function to get value from label
function getLabelValue(card, selector) {
    const element = card.querySelector(selector);
    return element ? element.textContent.trim() : '—';
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
                        <option value="جلوبەرگی پیاوان">جلوبەرگی پیاوان</option>
                        <option value="جلوبەرگی ئافرەتان">جلوبەرگی ئافرەتان</option>
                        <option value="جلوبەرگی منداڵان">جلوبەرگی منداڵان</option>
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
            
            const productData = {
                name: document.getElementById('adminProductName').value,
                category: document.getElementById('adminProductCategory').value,
                description: document.getElementById('adminProductDescription').value,
                price: document.getElementById('adminProductPrice').value,
                currency: document.getElementById('adminProductCurrency').value,
                images: imageUrls,
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
        
        const productData = {
            name: document.getElementById('productName').value,
            category: (document.getElementById('adminProductCategory') || document.getElementById('productCategory') || {value:''}).value,
            description: document.getElementById('productDescription').value,
            price: document.getElementById('productPrice').value,
            currency: document.getElementById('productCurrency').value,
            images: imageUrls,
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

// Image Preview
document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'productImages') {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        preview.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.margin = '5px';
                preview.appendChild(img);
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
        'جلوبەرگی پیاوان',
        'جلوبەرگی ئافرەتان',
        'جلوبەرگی منداڵان'
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
function createProductCard(product) {
    let firstImage = DEFAULT_PRODUCT_IMAGE;
    if (product.images && product.images.length > 0 && product.images[0]) {
        firstImage = product.images[0];
    }

    const productName = product.name && product.name.length > 30 
        ? product.name.substring(0, 27) + '...' 
        : product.name || 'بێ ناو';

    const sellerName = product.sellerName && product.sellerName.length > 15 
        ? product.sellerName.substring(0, 12) + '...' 
        : product.sellerName || 'نادیار';
    
    const location = product.location && product.location.length > 20 
        ? product.location.substring(0, 17) + '...' 
        : product.location || 'نادیار';

    return '<div class="product-card">' +
        '<div class="product-image">' +
        '<img src="' + firstImage + '" ' +
        'alt="' + (product.name || 'product') + '" ' +
        'loading="lazy" ' +
        'onclick="openImageModal(\'' + firstImage.replace(/'/g, "\\'") + '\')" ' +
        'style="cursor: zoom-in;" ' +
        'onerror="this.onerror=null; this.src=\'' + DEFAULT_PRODUCT_IMAGE + '\'">' +
        '</div>' +
        '<div class="product-info">' +
        '<div class="product-category">' + (product.category || 'هەموویی') + '</div>' +
        '<h3 class="product-name" title="' + (product.name || '') + '">' + productName + '</h3>' +
        '<div class="product-price">' + (product.price || '0') + ' ' + (product.currency || 'IQD') + '</div>' +
        '<div class="product-seller">' +
        '<i class="fas fa-user"></i> ' + sellerName +
        '</div>' +
        '<div class="product-location" title="' + (product.location || '') + '">' +
        '<i class="fas fa-map-marker-alt"></i> ' + location +
        '</div>' +
        '<div class="product-actions">' +
        '<button class="btn btn-primary btn-small" onclick="addToCart(\'' + product.firebaseId + '\')">' +
        '<i class="fas fa-cart-plus"></i> <span class="btn-text">سەبەتە</span>' +
        '</button>' +
        '<button class="btn btn-secondary btn-small" onclick="contactSellerWhatsApp(\'' + (product.sellerMobile || '') + '\', \'' + (product.name || '').replace(/'/g, "\\'") + '\')">' +
        '<i class="fab fa-whatsapp"></i> <span class="btn-text">واتساپ</span>' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>';
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

// ==================== Image Modal ====================
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('zoomedImage');
    if (!modal || !img) return;
    
    img.src = imageSrc;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
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
            const orderNumber = 'UK-' + Date.now().toString().slice(-6);
            const timestamp   = new Date().toLocaleString('en-GB');
            const deliveryData = {
                type: 'uk', orderNumber,
                fullName, phone, company, postcode, address1, address2, city, county, deliveryNote: note,
                receiverName, receiverPhone, receiverCompany,
                receiverPostcode: receiverPost, receiverAddress1: receiverAddr1, receiverAddress2: receiverAddr2,
                receiverCity, receiverCounty, receiverNote, receiverCountry,
                packageName, country: 'United Kingdom', timestamp, sortKey: Date.now()
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
});
// Back to Top Button - scroll visibility only (click handled via onclick in HTML)
document.addEventListener('DOMContentLoaded', function() {
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            backToTopBtn.style.opacity = window.pageYOffset > 300 ? '1' : '0.4';
        });
    }
});
