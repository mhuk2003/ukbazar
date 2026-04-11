const UKBAZAR_TRANSLATIONS={ku:{videos:"ڤیدیۆکان",delivery_ku:"گەیاندن",delivery_uk:"UK گەیاندن",search_placeholder:"گەڕان بە کاڵا...",search_btn:"گەڕان",all_products:"هەموو کاڵاکان",videos_section:"ڤیدیۆکان",no_products:"هیچ کاڵایەک نەدۆزرایەوە",cart_btn:"سەبەتە",whatsapp_btn:"واتساپ",add_to_cart:"زیادکردن بۆ سەبەتە",pieces:"دانە",unknown:"نادیار",no_name:"بێ ناو",cat_all:"هەموو کاڵاکان",cat_mobile:"مۆبایل",cat_laptop:"لاپتۆپ",cat_computer:"کۆمپیوتەر",cat_ipad:"ئایپاد",cat_car:"ئوتومبێل",cat_home:"ناوماڵ",cat_bicycle:"پاسکیل",cat_scooter:"سکۆتەر",cat_camera:"کامێرا",cat_beauty:"جوانکاری",cat_house:"خانوو",cat_land:"زەوی",cat_garden:"باخ",cat_animals:"ئاژەڵ",cat_men:"پیاوان",cat_women:"ئافرەتان",cat_kids:"منداڵان",products_loaded:" کاڵا بارکرا!",loading:"چاوەڕوانی بکە...",no_results:"هیچ کاڵایەک نەدۆزرایەوە",search_results:"ئەنجامەکانی گەڕان بۆ: ",videos_modal_title:"ڤیدیۆکان",no_videos:"هیچ ڤیدیۆیەک نییە",delivery_title:"داواکاری گەیاندن",sender_info:"زانیاری نێردەر",receiver_info:"زانیاری وەرگر",sender_name:"ناوی نێردەر",sender_mobile:"مۆبایلی نێردەر",sender_mobile2:"مۆبایلی دووەم (ئەختیاری)",sender_location:"شوێنی نێردەر",receiver_name:"ناوی وەرگر",receiver_mobile:"مۆبایلی وەرگر",receiver_mobile2:"مۆبایلی دووەم (ئەختیاری)",receiver_location:"شوێنی وەرگر",package_name:"ناوی بستەکە",package_qty:"ژمارەی دانە",package_kg:"کیلۆگرام",submit_delivery:"نێردن ✅",cancel:"داخستن",loading_text:"تکایە چاوەڕێ بکە ...",site_title:"بازاڕی ئۆنلاین",dir:"rtl",lang:"ku"},en:{videos:"Videos",delivery_ku:"KU Delivery",delivery_uk:"UK Delivery",search_placeholder:"Search products...",search_btn:"Search",all_products:"All Products",videos_section:"Videos",no_products:"No products found",cart_btn:"Cart",whatsapp_btn:"WhatsApp",add_to_cart:"Add to Cart",pieces:"pcs",unknown:"Unknown",no_name:"No name",cat_all:"All Products",cat_mobile:"Mobile",cat_laptop:"Laptop",cat_computer:"Computer",cat_ipad:"iPad",cat_car:"Car",cat_home:"Home",cat_bicycle:"Bicycle",cat_scooter:"Scooter",cat_camera:"Camera",cat_beauty:"Beauty",cat_house:"House",cat_land:"Land",cat_garden:"Garden",cat_animals:"Animals",cat_men:"Men",cat_women:"Women",cat_kids:"Kids",products_loaded:" products loaded!",loading:"Please wait...",no_results:"No products found",search_results:"Search results for: ",videos_modal_title:"Videos",no_videos:"No videos available",delivery_title:"Delivery Request",sender_info:"Sender Information",receiver_info:"Receiver Information",sender_name:"Sender Name",sender_mobile:"Sender Mobile",sender_mobile2:"Second Mobile (optional)",sender_location:"Sender Location",receiver_name:"Receiver Name",receiver_mobile:"Receiver Mobile",receiver_mobile2:"Second Mobile (optional)",receiver_location:"Receiver Location",package_name:"Package Name",package_qty:"Quantity",package_kg:"Weight (kg)",submit_delivery:"Submit ✅",cancel:"Cancel",loading_text:"Please wait ...",site_title:"Online Market",dir:"ltr",lang:"en"},ar:{videos:"الفيديوهات",delivery_ku:"توصيل كردستان",delivery_uk:"توصيل UK",search_placeholder:"ابحث عن المنتجات...",search_btn:"بحث",all_products:"جميع المنتجات",videos_section:"الفيديوهات",no_products:"لم يتم العثور على منتجات",cart_btn:"السلة",whatsapp_btn:"واتساب",add_to_cart:"أضف إلى السلة",pieces:"قطع",unknown:"غير معروف",no_name:"بدون اسم",cat_all:"جميع المنتجات",cat_mobile:"الجوال",cat_laptop:"لابتوب",cat_computer:"كمبيوتر",cat_ipad:"آيباد",cat_car:"سيارة",cat_home:"المنزل",cat_bicycle:"دراجة",cat_scooter:"سكوتر",cat_camera:"كاميرا",cat_beauty:"جمال",cat_house:"بيت",cat_land:"أرض",cat_garden:"حديقة",cat_animals:"حيوانات",cat_men:"رجال",cat_women:"نساء",cat_kids:"أطفال",products_loaded:" منتج تم التحميل!",loading:"يرجى الانتظار...",no_results:"لم يتم العثور على منتجات",search_results:"نتائج البحث عن: ",videos_modal_title:"الفيديوهات",no_videos:"لا توجد فيديوهات",delivery_title:"طلب توصيل",sender_info:"معلومات المرسل",receiver_info:"معلومات المستلم",sender_name:"اسم المرسل",sender_mobile:"جوال المرسل",sender_mobile2:"جوال ثانٍ (اختياري)",sender_location:"موقع المرسل",receiver_name:"اسم المستلم",receiver_mobile:"جوال المستلم",receiver_mobile2:"جوال ثانٍ (اختياري)",receiver_location:"موقع المستلم",package_name:"اسم الطرد",package_qty:"الكمية",package_kg:"الوزن (كغ)",submit_delivery:"إرسال ✅",cancel:"إلغاء",loading_text:"يرجى الانتظار ...",site_title:"سوق أونلاين",dir:"rtl",lang:"ar"}};

let _currentLang="ku";

function _detectBrowserLang(){
  const e=(navigator.language||navigator.userLanguage||"ku").toLowerCase();
  return e.startsWith("ar")?"ar":e.startsWith("en")?"en":"ku";
}

function setLanguage(e){
  e=UKBAZAR_TRANSLATIONS[e]?e:"ku";
  _currentLang=e;
  try{localStorage.setItem("ukbazar_lang",e)}catch(e){}
  const t=UKBAZAR_TRANSLATIONS[e];

  // --- Document direction & title ---
  document.documentElement.lang=t.lang;
  document.documentElement.dir=t.dir;
  document.title="UK BAZAR - "+t.site_title;

  // --- Header always RTL ---
  const n=document.querySelector(".header-content");
  if(n) n.style.direction="rtl";

  // --- Nav buttons: سەنتەر + LTR ---
  const o=document.querySelector(".nav-buttons");
  if(o){
    o.style.direction="ltr";
    o.style.display="flex";
    o.style.alignItems="center";
    o.style.justifyContent="center";
    o.style.flexWrap="nowrap";
    o.style.width="100%";
  }

  // --- Videos دوگمە: رەنگی سوور ---
  const videosBtn=document.querySelector('[onclick="showVideosModal()"]');
  if(videosBtn){
    videosBtn.style.background="#e53e3e";
    videosBtn.style.backgroundColor="#e53e3e";
    videosBtn.style.color="#fff";
    videosBtn.style.border="none";
  }

  // --- Videos button ---
  const s=document.querySelector('[onclick="showVideosModal()"] span');
  if(s) s.textContent=t.videos;

  // --- Delivery buttons: چاککراوە - هەموو ڕێگاکانی گوازینەوە ---
  _updateDeliveryButtons(t);

  // --- Search ---
  const l=document.getElementById("searchInput");
  if(l) l.placeholder=t.search_placeholder;
  const d=document.querySelector(".search-box button span");
  if(d) d.textContent=t.search_btn;

  // --- Products title ---
  const i=document.getElementById("productsTitle");
  if(i) i.textContent=t.all_products;

  // --- Videos section title ---
  const c=document.querySelector(".videos-section .section-title");
  if(c) c.innerHTML='<span style="color:#f56565;">&#9654;</span> '+t.videos_section;

  // --- Loading text ---
  const u=document.querySelector(".loading-text");
  if(u) u.textContent=t.loading_text;

  // --- Videos modal title ---
  const m=document.querySelector("#videosModal h2");
  if(m) m.innerHTML='<span style="color:#f56565;">&#9654;</span> '+t.videos_modal_title;

  _refreshCategoryButtons();
  _refreshProductsLang();
  _updateLangSwitcherUI(e);
  _ensureLangSwitcher();
}

// ---- FIX: چاککراوە بۆ گوازینەوەی دوگمەی گەیاندن بە هەموو ڕێگاکان ----
function _updateDeliveryButtons(t){
  // ڕێگای ١: کلاسی تایبەت
  const ku1=document.querySelector(".btn-delivery-ku .btn-text");
  if(ku1) ku1.textContent=t.delivery_ku;
  const uk1=document.querySelector(".btn-delivery-uk .btn-text");
  if(uk1) uk1.textContent=t.delivery_uk;

  // ڕێگای ٢: data-delivery ئەتریبیوت
  document.querySelectorAll("[data-delivery='ku'] .btn-text, [data-delivery='ku'] span").forEach(el=>{el.textContent=t.delivery_ku;});
  document.querySelectorAll("[data-delivery='uk'] .btn-text, [data-delivery='uk'] span").forEach(el=>{el.textContent=t.delivery_uk;});

  // ڕێگای ٣: onclick ئەتریبیوت بۆ دۆزینەوەی دوگمەکان
  document.querySelectorAll("button[onclick*='Delivery'], button[onclick*='delivery']").forEach(btn=>{
    const oc=btn.getAttribute("onclick")||"";
    const sp=btn.querySelector(".btn-text")||btn.querySelector("span");
    if(!sp) return;
    if(oc.toLowerCase().includes("uk")) sp.textContent=t.delivery_uk;
    else if(oc.toLowerCase().includes("ku")) sp.textContent=t.delivery_ku;
  });

  // ڕێگای ٤: تێکست کانتێنت کۆنی دوگمەکان بۆ ناساندن
  document.querySelectorAll("button").forEach(btn=>{
    const sp=btn.querySelector(".btn-text")||btn.querySelector("span");
    if(!sp) return;
    const cur=sp.textContent.trim();
    // ئەگەر تێکستی کۆن یەکێک لەم وەشانانەیە، نوێ بکەوە
    const kuVariants=["گەیاندن","KU Delivery","توصيل كردستان","KU گەیاندن"];
    const ukVariants=["UK گەیاندن","UK Delivery","توصيل UK"];
    if(kuVariants.includes(cur)) sp.textContent=t.delivery_ku;
    else if(ukVariants.includes(cur)) sp.textContent=t.delivery_uk;
  });
}

function _updateLangSwitcherUI(e){
  document.querySelectorAll(".lang-btn").forEach(t=>{
    t.classList.toggle("lang-active",t.dataset.lang===e);
  });
}

function _ensureLangSwitcher(){
  if(!document.getElementById("langSwitcher")) _injectLangSwitcher();
  _updateLangSwitcherUI(_currentLang);
}

function _refreshCategoryButtons(){
  const e=UKBAZAR_TRANSLATIONS[_currentLang];
  const t={
    "هەموو کاڵاکان":e.cat_all,"All Products":e.cat_all,"جميع المنتجات":e.cat_all,
    "مۆبایل":e.cat_mobile,"لاپتۆپ":e.cat_laptop,"کۆمپیوتەر":e.cat_computer,
    "ئایپاد":e.cat_ipad,"ئوتومبێل":e.cat_car,"ناوماڵ":e.cat_home,
    "پاسکیل":e.cat_bicycle,"سکۆتەر":e.cat_scooter,"کامێرا":e.cat_camera,
    "جوانکاری":e.cat_beauty,"خانوو":e.cat_house,"زەوی":e.cat_land,
    "باخ":e.cat_garden,"ئاژەڵ":e.cat_animals," پیاوان":e.cat_men,
    " ئافرەتان":e.cat_women," منداڵان":e.cat_kids,
    Mobile:e.cat_mobile,Laptop:e.cat_laptop,Computer:e.cat_computer,
    iPad:e.cat_ipad,Car:e.cat_car,Home:e.cat_home,Bicycle:e.cat_bicycle,
    Scooter:e.cat_scooter,Camera:e.cat_camera,Beauty:e.cat_beauty,
    House:e.cat_house,Land:e.cat_land,Garden:e.cat_garden,
    Animals:e.cat_animals,Men:e.cat_men,Women:e.cat_women,Kids:e.cat_kids,
    "الجوال":e.cat_mobile,"لابتوب":e.cat_laptop,"كمبيوتر":e.cat_computer,
    "آيباد":e.cat_ipad,"سيارة":e.cat_car,"المنزل":e.cat_home,
    "دراجة":e.cat_bicycle,"سكوتر":e.cat_scooter,"كاميرا":e.cat_camera,
    "جمال":e.cat_beauty,"بيت":e.cat_house,"أرض":e.cat_land,
    "حديقة":e.cat_garden,"حيوانات":e.cat_animals,"رجال":e.cat_men,
    "نساء":e.cat_women,"أطفال":e.cat_kids
  };
  const n=["هەموو کاڵاکان","مۆبایل","لاپتۆپ","کۆمپیوتەر","ئایپاد","ئوتومبێل","ناوماڵ","پاسکیل","سکۆتەر","کامێرا","جوانکاری","خانوو","زەوی","باخ","ئاژەڵ"," پیاوان"," ئافرەتان"," منداڵان"];
  const o=document.getElementById("categoryButtons");
  if(!o) return;
  o.innerHTML=n.map(function(n){
    const o=t[n]||n;
    const s=n==="هەموو کاڵاکان";
    return'<button class="category-btn'+(s?" active":"")+'" onclick="filterByCategory(\''+n.replace(/'/g,"\\'")+'\')" data-ku-cat="'+n.trim()+'" title="'+o+'">'+o+"</button>";
  }).join("");
}

function _refreshProductsLang(){
  const e=UKBAZAR_TRANSLATIONS[_currentLang];
  document.querySelectorAll(".btn-text").forEach(t=>{
    const n=t.closest("button");
    if(n){
      if(n.querySelector(".fa-cart-plus")) t.textContent=e.cart_btn;
      if(n.querySelector(".fa-whatsapp")) t.textContent=e.whatsapp_btn;
    }
  });
  document.querySelectorAll(".qty-label").forEach(t=>{t.textContent=e.pieces;});
  document.querySelectorAll(".btn-confirm-cart").forEach(t=>{
    t.innerHTML='<i class="fas fa-check"></i> '+e.add_to_cart;
  });
  const t=document.getElementById("productsTitle");
  if(t) t.textContent=e.all_products;
}

function _injectLangSwitcher(){
  if(document.getElementById("langSwitcher")) return;
  if(!document.getElementById("lang-switcher-css")){
    const e=document.createElement("style");
    e.id="lang-switcher-css";
    e.textContent=`
/* ---- Lang Switcher + سەنتەر کردنی هەموو header ---- */
.header-content{text-align:center !important;}
.nav-buttons{justify-content:center !important;}
#langSwitcherWrap{
  display:flex;justify-content:center;align-items:center;
  width:100%;padding:8px 0 4px 0;direction:ltr;
}
/* دوگمەی ڤیدیۆکان: سوور */
[onclick="showVideosModal()"]{
  background:#e53e3e !important;
  background-color:#e53e3e !important;
  color:#fff !important;
  border:none !important;
}
#langSwitcher{
  display:inline-flex;align-items:center;gap:0;
  background:#e8e8e8;border-radius:50px;padding:4px;
  direction:ltr;box-shadow:0 1px 6px rgba(0,0,0,0.10);
}
.lang-btn{
  display:flex;align-items:center;justify-content:center;
  background:transparent;border:none;cursor:pointer;
  font-size:.88rem;font-weight:700;color:#666;
  padding:7px 18px;border-radius:50px;
  transition:all .18s ease;white-space:nowrap;
  font-family:inherit;line-height:1;letter-spacing:.5px;
  min-width:52px;
}
.lang-btn:hover{color:#333;}
.lang-btn.lang-active{
  background:#fff;color:#222;
  font-weight:800;box-shadow:0 1px 5px rgba(0,0,0,0.13);
}
@media(max-width:480px){
  .lang-btn{padding:6px 14px;font-size:.82rem;min-width:44px;}
}
    `;
    document.head.appendChild(e);
  }

  // Wrapper div بۆ ئەوەی سەنتەر بێت و دەرەوەی nav-buttons بێت
  const wrap=document.createElement("div");
  wrap.id="langSwitcherWrap";

  const el=document.createElement("div");
  el.id="langSwitcher";

  // KU - EN - AR
  [{lang:"ku",label:"KU"},{lang:"en",label:"EN"},{lang:"ar",label:"AR"}].forEach(item=>{
    const btn=document.createElement("button");
    btn.className="lang-btn";
    btn.dataset.lang=item.lang;
    btn.textContent=item.label;
    btn.addEventListener("click",function(){setLanguage(item.lang);});
    el.appendChild(btn);
  });
  wrap.appendChild(el);

  // بخرێتە سەرەوەی هەموو چیزێک لە header - پێش nav-buttons یان هەر شتی header
  const nav=document.querySelector(".nav-buttons");
  const header=document.querySelector(".header-content")||document.querySelector("header")||document.querySelector(".header");

  if(nav && nav.parentNode){
    // بخرێتە پێش nav-buttons، نە لەناویدا
    nav.parentNode.insertBefore(wrap, nav);
  } else if(header){
    header.insertBefore(wrap, header.firstChild);
  } else {
    // فالباک: لەسەر هەموو شتێک سەرەوەی body
    wrap.style.position="fixed";
    wrap.style.top="0";
    wrap.style.left="0";
    wrap.style.right="0";
    wrap.style.zIndex="99999";
    wrap.style.background="rgba(255,255,255,0.97)";
    document.body.insertBefore(wrap, document.body.firstChild);
  }
}

(function(){
  function init(){
    _injectLangSwitcher();
    let lang="ku";
    try{lang=localStorage.getItem("ukbazar_lang")||"ku";}catch(e){}
    if(!localStorage.getItem("ukbazar_lang")) lang=_detectBrowserLang();
    setLanguage(lang);
  }
  document.readyState==="loading"
    ?document.addEventListener("DOMContentLoaded",init)
    :init();
})();

window.setLanguage=setLanguage;
window._refreshCategoryButtons=_refreshCategoryButtons;
window.t=function(e){return(UKBAZAR_TRANSLATIONS[_currentLang]||UKBAZAR_TRANSLATIONS.ku)[e]||e;};
window.currentLang=function(){return _currentLang;};
