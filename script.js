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
    if (spinner) spinner.style.display = 'none';
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

// ==================== Firebase Data Loaders ====================
function loadApprovedProducts() {
    Promise.all([
        database.ref('products').once('value'),
        database.ref('slider').once('value')
    ]).then(([productSnapshot, sliderSnapshot]) => {
        products = [];
        productSnapshot.forEach((child) => {
            const val = child.val();
            if (val.status === 'approved') {
                products.push({ ...val, firebaseId: child.key });
            }
        });
        renderProducts(products);
        hideLoading();
        createCategoryButtons();
        renderSliderDirect(sliderSnapshot);
        if (products.length > 0) {
            showNotification(products.length + ' کاڵا بارکرا!');
        }
    }).catch((error) => {
        console.error("Error:", error);
        hideLoading();
    });
}

function loadPendingProducts() {
    database.ref('products').orderByChild('status').equalTo('pending').once('value')
        .then((snapshot) => {
            const content = document.getElementById('adminContent');
            if (!content) return;
            
            let html = '<div class="pending-items">';
            
            snapshot.forEach((child) => {
                const product = child.val();
                const id = child.key;
                html += `
                    <div class="pending-item">
                        <h4>📦 ${product.name}</h4>
                        <p><strong>جۆر:</strong> ${product.category}</p>
                        <p><strong>نرخ:</strong> ${product.price} ${product.currency}</p>
                        <p><strong>فرۆشیار:</strong> ${product.sellerName} - ${product.sellerMobile}</p>
                        <p><strong>شوێن:</strong> ${product.location || 'نادیار'}</p>
                        <p><strong>وردەکاری:</strong> ${product.description || 'بەبەتاڵ'}</p>
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
            
            if (!snapshot.exists()) {
                html = '<p style="text-align: center; color: var(--gray);">هیچ کاڵایەکی چاوەڕوانی پەسەندکردن نییە</p>';
            }
            
            html += '</div>';
            content.innerHTML = html;
        });
}

function loadAllProducts() {
    database.ref('products').orderByChild('status').equalTo('approved').once('value')
        .then((snapshot) => {
            const content = document.getElementById('adminContent');
            if (!content) return;
            
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
                    html += '<img src="' + firstImage + '" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">';
                }
                html += '<h4>📦 ' + product.name + '</h4>';
                html += '<p><strong>جۆر:</strong> ' + product.category + '</p>';
                html += '<p><strong>نرخ:</strong> ' + product.price + ' ' + product.currency + '</p>';
                html += '<p><strong>فرۆشیار:</strong> ' + product.sellerName + ' - ' + product.sellerMobile + '</p>';
                html += '<p><strong>شوێن:</strong> ' + (product.location || 'نادیار') + '</p>';
                html += '<p><strong>وردەکاری:</strong> ' + (product.description || 'بەبەتاڵ') + '</p>';
                html += '<div class="actions">';
                html += '<button class="btn btn-danger btn-small" onclick="deleteProduct(\'' + id + '\')"><i class="fas fa-trash"></i> سڕینەوە</button>';
                html += '</div></div>';
            });
            
            html += '</div>';
            content.innerHTML = html;
        });
}

function loadRequests() {
    database.ref('requests').once('value')
        .then((snapshot) => {
            const content = document.getElementById('adminContent');
            if (!content) return;
            
            let html = '<div class="pending-items">';
            
            snapshot.forEach((child) => {
                const request = child.val();
                html += `
                    <div class="pending-item">
                        <h4>📋 ${request.itemName}</h4>
                        <p><strong>کەس:</strong> ${request.name} - ${request.mobile}</p>
                        <p><strong>وردەکاری:</strong> ${request.details || 'بەبەتاڵ'}</p>
                        <p><strong>بەروار:</strong> ${request.timestamp}</p>
                    </div>
                `;
            });
            
            if (!snapshot.exists()) {
                html = '<p style="text-align: center; color: var(--gray);">هیچ داواکارییەک نییە</p>';
            }
            
            html += '</div>';
            content.innerHTML = html;
        });
}

function loadDeliveryRequests() {
    database.ref('delivery').once('value')
        .then((snapshot) => {
            const content = document.getElementById('adminContent');
            if (!content) return;
            
            let html = '<div class="pending-items">';
            
            snapshot.forEach((child) => {
                const delivery = child.val();
                html += `
                    <div class="pending-item">
                        <h4>🚚 ${delivery.name}</h4>
                        <p><strong>ژمارە:</strong> ${delivery.mobile}</p>
                        <p><strong>ناونیشان:</strong> ${delivery.address}</p>
                        <p><strong>وردەکاری:</strong> ${delivery.details || 'بەبەتاڵ'}</p>
                        <p><strong>بەروار:</strong> ${delivery.timestamp}</p>
                    </div>
                `;
            });
            
            if (!snapshot.exists()) {
                html = '<p style="text-align: center; color: var(--gray);">هیچ داواکاری گەیاندنێک نییە</p>';
            }
            
            html += '</div>';
            content.innerHTML = html;
        });
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
                loadSliderImages();
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
                html += '<img src="' + slider.imageUrl + '" style="width: 150px; height: 100px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">';
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
            category: document.getElementById('productCategory').value,
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
        const deliveryData = {
            name: document.getElementById('deliveryName').value,
            mobile: document.getElementById('deliveryMobile').value,
            address: document.getElementById('deliveryAddress').value,
            details: document.getElementById('deliveryDetails').value,
            timestamp: new Date().toLocaleString('ku')
        };
        database.ref('delivery').push(deliveryData)
            .then(() => {
                showNotification('داواکاری گەیاندن نێردرا! ✅');
                closeModal('deliveryModal');
                document.getElementById('deliveryForm').reset();
            })
            .catch(() => { showNotification('هەڵە لە ناردن!', 'error'); });
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
                 onclick="filterByCategory('${cat}')">${cat}</button>`
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
    const firstImage = product.images && product.images[0] 
        ? product.images[0] 
        : 'https://via.placeholder.com/300x300?text=No+Image';

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
        'onclick="openImageModal(\'' + firstImage + '\')" ' +
        'style="cursor: zoom-in;" ' +
        'onerror="this.src=\'https://via.placeholder.com/300x300?text=Error\'">' +
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
        '<button class="btn btn-secondary btn-small" onclick="contactSellerWhatsApp(\'' + (product.sellerMobile || '') + '\', \'' + (product.name || '') + '\')">' +
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

// ==================== Slider Functions ====================
function renderSliderDirect(snapshot) {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    if (!slidesWrapper || !sliderDots) return;
    
    let images = [];
    if (snapshot && snapshot.exists()) {
        snapshot.forEach((child) => {
            images.push({ url: child.val().imageUrl, title: child.val().title || '' });
        });
        images.reverse();
    } else if (products.length > 0) {
        images = products.slice().reverse().slice(0, 8).map(p => ({
            url: p.images && p.images[0] ? p.images[0] : 'https://via.placeholder.com/1200x400',
            title: p.name
        }));
    }
    
    if (images.length === 0) return;
    
    totalSlides = images.length;
    slidesWrapper.innerHTML = images.map(img => 
        '<div class="slide"><img src="' + img.url + '" alt="' + img.title + '" loading="lazy"></div>'
    ).join('');
    
    sliderDots.innerHTML = images.map((_, i) => 
        '<div class="dot ' + (i === 0 ? 'active' : '') + '" onclick="goToSlide(' + i + ')"></div>'
    ).join('');
    
    startAutoPlay();
}

function loadSliderImages() {
    const slidesWrapper = document.getElementById('slidesWrapper');
    const sliderDots = document.getElementById('sliderDots');
    if (!slidesWrapper || !sliderDots) return;
    
    database.ref('slider').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                if (products.length === 0) return;
                
                const sliderProducts = products.slice().reverse().slice(0, 8);
                totalSlides = sliderProducts.length;

                slidesWrapper.innerHTML = sliderProducts.map(product => {
                    const img = product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/1200x400';
                    return `
                        <div class="slide">
                            <img src="${img}" alt="${product.name}" loading="lazy">
                        </div>
                    `;
                }).join('');

                sliderDots.innerHTML = sliderProducts.map((_, index) => 
                    `<div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
                ).join('');
                
                startAutoPlay();
                return;
            }
            
            const sliderImages = [];
            snapshot.forEach((child) => {
                sliderImages.push({
                    imageUrl: child.val().imageUrl,
                    title: child.val().title || 'سلایدەر'
                });
            });
            
            sliderImages.reverse();
            
            totalSlides = sliderImages.length;

            slidesWrapper.innerHTML = sliderImages.map(slider => {
                return `
                    <div class="slide">
                        <img src="${slider.imageUrl}" alt="${slider.title}" loading="lazy">
                    </div>
                `;
            }).join('');

            sliderDots.innerHTML = sliderImages.map((_, index) => 
                `<div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`
            ).join('');

            startAutoPlay();
        })
        .catch((error) => {
            console.error('Error loading slider:', error);
        });
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
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
}

function goToSlide(index) {
    currentSlide = index;
    updateSlider();
}

function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(nextSlide, 3000);
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
