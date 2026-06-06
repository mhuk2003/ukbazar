// ═══════════════════════════════════════════════════════════════
//  MOBILE PRINT FIX — چارەسەری پرینت و داونلۆد لە موبایل
//  جێگای printHtml() و _openPrintPage() لە index.html دابنێ
//  بەکارهێنانی html2canvas بۆ PNG + navigator.share بۆ Share
// ═══════════════════════════════════════════════════════════════

// ── بارکردنی html2canvas لە CDN ─────────────────────────────
(function loadHtml2Canvas() {
    if (window.html2canvas) return;
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.async = true;
    document.head.appendChild(s);
})();

// ── دیاریکردنی جۆری ئامێر ─────────────────────────────────
function _isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
        || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
}

// ── بارکردنی html2canvas ئەگەر هێشتا بار نەبووبێت ───────────
function _ensureHtml2Canvas() {
    return new Promise(function(resolve) {
        if (window.html2canvas) { resolve(); return; }
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = resolve;
        s.onerror = resolve; // ئەگەر هەڵە بوو، بەردەوام بە
        document.head.appendChild(s);
    });
}

// ═══════════════════════════════════════════════════════════════
//  printHtml() — ئەوەی index.html بەکاری دەهێنێت
//  لەسەر موبایل: PNG دروست دەکات + Share یان Download
//  لەسەر دێسکتۆپ: iframe + print() ئاساییەکەی
// ═══════════════════════════════════════════════════════════════
window.printHtml = function(htmlContent, fileName) {
    fileName = (fileName || 'label').replace(/\.pdf$/i, '').replace(/\.html$/i, '');

    // ── دێسکتۆپ: چارەسەرە ئاساییەکەی بەکاربهێنە ────────────
    if (!_isMobile()) {
        _desktopPrint(htmlContent, fileName);
        return;
    }

    // ── موبایل: PNG یان Share ────────────────────────────────
    _mobilePrintFlow(htmlContent, fileName);
};

// ── جێگای _openPrintPage ───────────────────────────────────
window._openPrintPage = function(htmlStr, filename) {
    window.printHtml(htmlStr, filename);
};

// ── جێگای _mobilePrint ─────────────────────────────────────
window._mobilePrint = function(htmlStr, filename) {
    window.printHtml(htmlStr, filename);
};

// ═══════════════════════════════════════════════════════════════
//  DESKTOP PRINT — iframe ئاساییەکە
// ═══════════════════════════════════════════════════════════════
function _desktopPrint(htmlContent, fileName) {
    var cleaned = htmlContent
        .replace(/backdrop-filter\s*:[^;"]+;?/gi, '')
        .replace(/-webkit-backdrop-filter\s*:[^;"]+;?/gi, '');

    var old = document.getElementById('_ukPO');
    if (old) old.remove();

    var iframe = document.createElement('iframe');
    iframe.id = '_ukPO';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads allow-modals allow-popups');
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:0;z-index:2147483646;background:#fff;display:block;';

    var closeCode = "try{window.parent.document.getElementById('_ukPO').remove();}catch(e){}";
    var fnStr = JSON.stringify(fileName);

    var sc = 'var _fn=' + fnStr + ';'
        + 'function _dl(){'
        + 'var b=new Blob([document.documentElement.outerHTML],{type:"text/html;charset=utf-8"});'
        + 'var u=URL.createObjectURL(b);var a=document.createElement("a");'
        + 'a.href=u;a.download=_fn+".html";document.body.appendChild(a);a.click();'
        + 'setTimeout(function(){URL.revokeObjectURL(u);a.remove();},5000);}';

    var bar = '<div id="_pbar" style="position:fixed;top:0;left:0;right:0;display:flex;gap:5px;padding:9px 10px;background:#1a365d;z-index:2147483647;">'
        + '<button onclick="window.print()" style="flex:1;padding:12px;background:#38a169;color:#fff;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">🖨 چاپ</button>'
        + '<button onclick="_dl()" style="flex:1;padding:12px;background:#3182ce;color:#fff;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">⬇ داونلۆد</button>'
        + '<button onclick="' + closeCode + '" style="flex:1;padding:12px;background:#e53e3e;color:#fff;border:none;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;">✕</button>'
        + '</div>';

    var css = '<style>@media screen{body{padding-top:60px!important;}}@media print{#_pbar{display:none!important;}body{padding-top:0!important;}}</style>';
    var injected = css + '<script>' + sc + '<\/script>';

    var final = cleaned;
    if (/<\/head>/i.test(final)) { final = final.replace(/<\/head>/i, injected + '</head>'); }
    else { final = injected + final; }
    if (/<body[^>]*>/i.test(final)) { final = final.replace(/(<body[^>]*>)/i, '$1' + bar); }
    else { final = bar + final; }

    document.body.appendChild(iframe);
    iframe.srcdoc = final;
}

// ═══════════════════════════════════════════════════════════════
//  MOBILE PRINT FLOW — پیشانی ئامرازبار + PNG + Share
// ═══════════════════════════════════════════════════════════════
function _mobilePrintFlow(htmlContent, fileName) {
    // ١. هیدن iframe دروست بکە بۆ ڕندەرکردنی HTML
    var existingBar = document.getElementById('_mbPrintBar');
    if (existingBar) existingBar.remove();

    // ٢. بار پیشان بدە
    var bar = document.createElement('div');
    bar.id = '_mbPrintBar';
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:linear-gradient(135deg,#1a365d,#2b6cb0);padding:12px 14px 20px;display:flex;gap:8px;box-shadow:0 -4px 20px rgba(0,0,0,0.3);border-radius:20px 20px 0 0;';
    bar.innerHTML = '<div style="width:100%;text-align:center;color:#fff;font-size:.78rem;font-weight:700;margin-bottom:8px;opacity:.8;">📄 پسولەکەت ئامادەیە</div>'
        + '<button id="_mbShareBtn" style="flex:1;padding:14px 8px;background:#38a169;color:#fff;border:none;border-radius:14px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<span style="font-size:1.2rem;">📤</span> شێرکردن</button>'
        + '<button id="_mbDownloadBtn" style="flex:1;padding:14px 8px;background:#667eea;color:#fff;border:none;border-radius:14px;font-size:.88rem;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<span style="font-size:1.2rem;">⬇</span> داونلۆد</button>'
        + '<button id="_mbCloseBtn" style="padding:14px 12px;background:rgba(255,255,255,0.15);color:#fff;border:none;border-radius:14px;font-size:1rem;cursor:pointer;">✕</button>';

    document.body.appendChild(bar);

    var cleanedHtml = htmlContent
        .replace(/backdrop-filter\s*:[^;"]+;?/gi, '')
        .replace(/-webkit-backdrop-filter\s*:[^;"]+;?/gi, '');

    // ٣. بوتنەکان
    var pngBlob = null; // PNG یەکجار دروست دەکات، دووبارە نەکات

    document.getElementById('_mbCloseBtn').onclick = function() { bar.remove(); };

    document.getElementById('_mbShareBtn').onclick = function() {
        _generateAndShare(cleanedHtml, fileName, bar, true);
    };

    document.getElementById('_mbDownloadBtn').onclick = function() {
        _generateAndShare(cleanedHtml, fileName, bar, false);
    };
}

// ── دروستکردنی PNG و Share یان Download ────────────────────
function _generateAndShare(html, fileName, bar, tryShare) {
    var btn = tryShare
        ? document.getElementById('_mbShareBtn')
        : document.getElementById('_mbDownloadBtn');
    if (btn) {
        btn.textContent = '⏳ چاوەڕوانی...';
        btn.disabled = true;
    }

    _ensureHtml2Canvas().then(function() {
        if (!window.html2canvas) {
            // fallback: HTML فایل داونلۆد بکە
            _downloadHtmlFile(html, fileName);
            if (bar) bar.remove();
            return;
        }

        // هیدن div دروست بکە بۆ ڕندەرکردن
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:390px;background:#fff;z-index:-1;';
        wrapper.innerHTML = _extractBodyContent(html);
        document.body.appendChild(wrapper);

        window.html2canvas(wrapper, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: 390,
            windowWidth: 390
        }).then(function(canvas) {
            document.body.removeChild(wrapper);
            canvas.toBlob(function(blob) {
                if (!blob) {
                    _downloadHtmlFile(html, fileName);
                    if (bar) bar.remove();
                    return;
                }

                if (tryShare && navigator.share && navigator.canShare) {
                    var file = new File([blob], fileName + '.png', { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({
                            files: [file],
                            title: 'UK BAZAR — ' + fileName
                        }).then(function() {
                            if (bar) bar.remove();
                        }).catch(function() {
                            // Share لاکرایەوە، PNG دابەزێنە
                            _savePngBlob(blob, fileName);
                            if (bar) bar.remove();
                        });
                        return;
                    }
                }

                // Download PNG
                _savePngBlob(blob, fileName);
                showNotification('✅ PNG پسولەکە پاشەکەوت کرا!');
                if (bar) bar.remove();

            }, 'image/png', 0.95);
        }).catch(function() {
            document.body.removeChild(wrapper);
            _downloadHtmlFile(html, fileName);
            if (bar) bar.remove();
        });
    });
}

// ── PNG بلۆب پاشەکەوت بکە ─────────────────────────────────
function _savePngBlob(blob, fileName) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 5000);
}

// ── HTML فایل داونلۆد — fallback ───────────────────────────
function _downloadHtmlFile(html, fileName) {
    try {
        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName + '.html';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 5000);
        showNotification('⬇ فایلی HTML پاشەکەوت کرا');
    } catch(e) {
        showNotification('❌ داونلۆد سەرکەوتوو نەبوو', 'error');
    }
}

// ── ناوەرۆکی <body> دەرهێنە ───────────────────────────────
function _extractBodyContent(html) {
    var match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (match) {
        // دوگمەکانی Print/Close یان action bar لادەبە
        return match[1]
            .replace(/<div[^>]*id="_pbar"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/<div[^>]*class="action-bar"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/<button[^>]*onclick="window\.close\(\)[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
    }
    return html;
}

// ── بارکردنی دەستکەوت: پرینت کراوەکانی هێشتا بەکاردێت ────
window._printHtmlIframe = function(f) { window.printHtml(f, 'label'); };

// ── پاڵنەرێکی گەیاندن: ئەگەر کیوئار ئامادەبوو، دوگمەی Share زیاد بکە ──
(function addShareToQrCodes() {
    // دوای ١ چرکە تاقیبکەرەوە — بۆ ئەوەی DOM دروست بێتەوە
    setTimeout(function() {
        document.querySelectorAll('.label-qr-img').forEach(function(img) {
            if (img.parentNode && !img.parentNode.querySelector('._qrShareBtn')) {
                var btn = document.createElement('button');
                btn.className = '_qrShareBtn';
                btn.style.cssText = 'display:block;width:100%;margin-top:6px;padding:7px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;';
                btn.textContent = '📤 شێر / داونلۆد';
                btn.onclick = function(e) {
                    e.stopPropagation();
                    // QR وێنە Share بکە
                    img.toBlob && img.toBlob(function(blob) {
                        if (!blob) return;
                        var file = new File([blob], 'qr-code.png', { type: 'image/png' });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                            navigator.share({ files: [file] }).catch(function(){});
                        } else {
                            _savePngBlob(blob, 'qr-code');
                        }
                    });
                };
                img.parentNode.appendChild(btn);
            }
        });
    }, 1500);
})();

console.log('✅ Mobile Print Fix loaded — UK BAZAR');
