const functions = require("firebase-functions");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");

admin.initializeApp();
const db = admin.database();
const bucket = admin.storage().bucket();

// ============================================================
// generateLabelPDF — وەرگرتنی داتای ئۆردەر → PDF → Storage URL
// POST /generateLabelPDF
// body: { orderKey: "xxx" }   یان   { html: "..." , fileName: "label-27" }
// ============================================================
exports.generateLabelPDF = functions
  .runWith({ memory: "1GB", timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {

    // CORS — هازەی هەر origin
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")   { res.status(405).send("Method Not Allowed"); return; }

    try {
      let html = "";
      let fileName = "label";

      // --- حالەتی ١: HTML ڕاستەوخۆ نێردراوە ---
      if (req.body.html) {
        html = req.body.html;
        fileName = req.body.fileName || "label";

      // --- حالەتی ٢: orderKey نێردراوە → داتا لە Firebase وەردەگیرێت ---
      } else if (req.body.orderKey) {
        const snap = await db.ref("orders/" + req.body.orderKey).once("value");
        if (!snap.exists()) {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        const order = snap.val();
        fileName = "label-" + (order.orderNumber || req.body.orderKey);
        html = buildLabelHtml(order);

      } else {
        res.status(400).json({ error: "html یان orderKey پێویستە" });
        return;
      }

      // --- Puppeteer: HTML → PDF ---
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

      const pdfBuffer = await page.pdf({
        format: "A5",
        printBackground: true,
        margin: { top: "5mm", bottom: "5mm", left: "5mm", right: "5mm" },
      });

      await browser.close();

      // --- Storage: PDF ذخیرەکردن ---
      const filePath = "labels/" + fileName + "-" + Date.now() + ".pdf";
      const file = bucket.file(filePath);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: "application/pdf",
          cacheControl: "public, max-age=3600",
        },
      });

      // URL بە مودەتی ١ کاتژمێر
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000,
      });

      res.status(200).json({ success: true, url, fileName: fileName + ".pdf" });

    } catch (err) {
      console.error("generateLabelPDF error:", err);
      res.status(500).json({ error: err.message });
    }
  });


// ============================================================
// buildLabelHtml — دروستکردنی HTML بۆ لەیبل لە داتای Firebase
// ============================================================
function buildLabelHtml(order) {
  const esc = (s) => String(s || "—")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const orderNum   = esc(order.orderNumber || order.id || "");
  const senderName = esc(order.senderName);
  const senderTel  = esc(order.senderMobile || order.senderPhone);
  const senderLoc  = esc(order.senderLocation || order.senderAddress);
  const recvName   = esc(order.receiverName || order.recipientName);
  const recvTel    = esc(order.receiverMobile || order.receiverPhone);
  const recvLoc    = esc(order.receiverLocation || order.receiverAddress);
  const pkg        = esc(order.packageName || order.itemName);
  const kg         = order.packageKg ? esc(order.packageKg) + "کگ" : "";
  const driver     = esc(order.driverName || order.driver);
  const note       = esc(order.deliveryNote || order.note);
  const status     = esc(order.status);
  const date       = esc(order.createdAt || order.date);

  const qrData = encodeURIComponent("پسولە:" + orderNum + "|نێردەر:" + senderName + "|وەرگر:" + recvName);
  const qrUrl  = "https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=4&data=" + qrData;

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<style>
  @page { size:A5; margin:5mm; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Tahoma,Arial,sans-serif; direction:rtl;
         background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .wrap  { border:2.5px solid #1a365d; border-radius:8px; overflow:hidden; }
  .hdr   { background:#1a365d; color:#fff; padding:7px 12px;
           display:flex; justify-content:space-between; align-items:center; }
  .hdr-t { font-size:.95rem; font-weight:900; }
  .hdr-n { font-size:.85rem; font-weight:700; opacity:.9; }
  .grid  { display:grid; grid-template-columns:1fr 1fr; border-bottom:1.5px solid #e2e8f0; }
  .col   { padding:8px 10px; border-left:1.5px solid #e2e8f0; }
  .col:last-child { border-left:none; }
  .lbl   { font-size:.62rem; color:#718096; margin-bottom:2px; }
  .val   { font-size:.88rem; font-weight:800; color:#1a202c; }
  .tel   { font-size:.75rem; color:#4a5568; margin-top:1px; }
  .loc   { font-size:.68rem; color:#a0aec0; margin-top:1px; }
  .pkg   { display:flex; justify-content:space-between; align-items:center;
           padding:8px 12px; background:#f7fafc; border-bottom:1.5px solid #e2e8f0; }
  .pkg-t { font-size:.85rem; font-weight:800; }
  .pkg-s { font-size:.72rem; color:#718096; margin-top:2px; }
  .ftr   { background:#1a365d; color:#fff; padding:5px 12px;
           display:flex; justify-content:space-between;
           font-size:.62rem; opacity:.9; }
</style>
</head><body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-t">پۆستی ناوخۆ — UK BAZAR</div>
    <div class="hdr-n"># ${orderNum}</div>
  </div>
  <div class="grid">
    <div class="col">
      <div class="lbl">📦 نێردەر</div>
      <div class="val">${senderName}</div>
      <div class="tel">📞 ${senderTel}</div>
      ${senderLoc !== "—" ? `<div class="loc">📍 ${senderLoc}</div>` : ""}
    </div>
    <div class="col">
      <div class="lbl">📬 وەرگر</div>
      <div class="val">${recvName}</div>
      <div class="tel">📞 ${recvTel}</div>
      ${recvLoc !== "—" ? `<div class="loc">📍 ${recvLoc}</div>` : ""}
    </div>
  </div>
  <div class="pkg">
    <div>
      <div class="lbl">📦 کاڵا</div>
      <div class="pkg-t">${pkg} ${kg ? "— " + kg : ""}</div>
      ${status !== "—" ? `<div class="pkg-s">📋 ${status}</div>` : ""}
      ${driver !== "—" ? `<div class="pkg-s">🚗 ${driver}</div>` : ""}
      ${note   !== "—" ? `<div class="pkg-s">📝 ${note}</div>`   : ""}
    </div>
    <img src="${qrUrl}" style="width:90px;height:90px;border-radius:6px;flex-shrink:0;">
  </div>
  <div class="ftr">
    <span>UK BAZAR — KING STREET — 07755436275</span>
    <span>${date}</span>
  </div>
</div>
</body></html>`;
}
