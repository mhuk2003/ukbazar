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
    
    if (notification && notificationMessage) {
        notificationMessage.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
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

            // کۆکردنەوە و ڕیزکردن — نوێترین سەرەوە
            const items = [];
            snapshot.forEach((child) => {
                items.push({ key: child.key, ...child.val() });
            });
            items.sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));

            let html = '<div class="pending-items">';

            items.forEach((d) => {
                const key = d.key;
                const orderNum = d.orderNumber || '—';
                // QR ناوەڕۆک
                const qrText = encodeURIComponent(
                    `پسولە: ${orderNum} | نێردەر: ${d.senderName||d.name||''} ${d.senderMobile||d.mobile||''} (${d.senderLocation||d.address||''}) | وەرگر: ${d.receiverName||''} ${d.receiverMobile||''} (${d.receiverLocation||''}) | کەلوپەل: ${d.packageName||d.details||''} x${d.packageQty||''} - ${d.packageKg||''}کگ`
                );
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrText}`;

                html += `
                <div class="pending-item delivery-label-card" id="label-${key}">
                    <div class="label-header">
                        <span class="label-order-num"># ${orderNum}</span>
                        <span class="label-title-center"><i class="fas fa-shipping-fast"></i> لەیبلی گەیاندن</span>
                        <button class="btn btn-sm btn-primary" onclick="printLabel('${key}')">
                            <i class="fas fa-print"></i> چاپ
                        </button>
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
            });

            html += '</div>';
            content.innerHTML = html;
        })
        .catch((error) => {
            console.error("Error loading delivery requests:", error);
            content.innerHTML = '<p style="text-align: center; color: var(--danger);">هەڵە لە بارکردن!</p>';
        });
}

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
</body></html>`);
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
        '<button class="btn btn-fib btn-small" onclick="showFibModal()">' +
        '<i class="fas fa-credit-card"></i> <span class="btn-text">FIB</span>' +
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
    
    // هەوڵی وەرگرتن لە کاش
    const cachedSlider = localStorage.getItem('ukbazar_slider');
    
    if (cachedSlider) {
        try {
            const sliderData = JSON.parse(cachedSlider);
            if (sliderData && sliderData.length > 0) {
                updateSliderWithImages(sliderData);
                return;
            }
        } catch (e) {}
    }
    
    // وەرگرتن لە فایربەیس
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
                
                if (images.length > 0) {
                    images.reverse(); // نوێترین یەکەم
                }
            }
            
            // ئەگەر وێنەی سلایدەر نەبوو، لە کاڵاکان وەربگرە
            if (images.length === 0 && products.length > 0) {
                images = products.slice().reverse().slice(0, 5).map(p => ({
                    url: p.images && p.images[0] ? p.images[0] : DEFAULT_SLIDER_IMAGE,
                    title: p.name || 'کاڵا'
                }));
            }
            
            if (images.length > 0) {
                // پاشەکەوتکردن لە کاش
                try {
                    localStorage.setItem('ukbazar_slider', JSON.stringify(images));
                } catch (e) {}
                
                updateSliderWithImages(images);
            }
        })
        .catch((error) => {
            console.error('Error loading slider:', error);
        });
}

function updateSliderWithImages(images) {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    
    if (!slidesWrapper || !sliderDots || !images || images.length === 0) return;
    
    totalSlides = images.length;
    currentSlide = 0;
    
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
}

function updateSlider() {
    const slidesWrapper = document.getElementById('slidesWrapper');
    if (slidesWrapper) {
        slidesWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
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
    const modals = ['requestModal', 'addProductModal', 'deliveryModal', 'fibModal', 'imageModal'];
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
        const modals = ['requestModal', 'addProductModal', 'deliveryModal', 'fibModal', 'imageModal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && modal.classList.contains('show')) {
                closeModal(id);
            }
        });
    }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', function() {
    loadApprovedProducts();
    updateCartBadge();
});
