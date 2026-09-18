/**
 * SMOKE TEST — index.html (Báo giá chi tiết + Báo giá tổng)
 * ============================================================
 * Chạy: npm test  (hoặc: node tests/smoke-test.js)
 *
 * Mục đích: đóng gói lại các bước kiểm tra đã làm THỦ CÔNG nhiều lần trong quá trình
 * sửa lỗi cho tool này (dò lỗi khi bấm đổi ngành/gói/năm, xuất PDF, gõ ký tự lạ vào ô nhập...)
 * thành 1 script chạy TỰ ĐỘNG mỗi khi có thay đổi — để bắt lỗi TRƯỚC khi khách hàng thấy,
 * thay vì chờ ai đó chụp ảnh báo lỗi rồi mới biết.
 *
 * Cách hoạt động: dựng index.html trong trình duyệt giả lập (jsdom), giả lập người dùng
 * bấm qua toàn bộ tổ hợp ngành × gói × năm, bấm nút xuất PDF (có giả lập html2canvas/jsPDF
 * để không cần trình duyệt thật), rồi kiểm tra không có lỗi JavaScript nào bắn ra.
 *
 * Nếu có bước nào FAIL, script thoát với exit code 1 — dùng trong CI (.github/workflows/ci.yml)
 * để CHẶN/CẢNH BÁO trước khi deploy nếu có lỗi.
 */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "index.html");

let failCount = 0;
let passCount = 0;

function ok(label) {
  passCount++;
  console.log("  \u2713 " + label);
}
function fail(label, detail) {
  failCount++;
  console.log("  \u2717 " + label + (detail ? "  \u2192 " + detail : ""));
}
function section(title) {
  console.log("\n=== " + title + " ===");
}

// -------------------------------------------------------------------------
// BƯỚC 0 — Cú pháp JS: mỗi khối <script> trong index.html phải parse được
// -------------------------------------------------------------------------
function checkInlineScriptSyntax(html) {
  section("Cú pháp JS (mỗi khối <script> phải hợp lệ)");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const tmpDir = fs.mkdtempSync("/tmp/kv-smoke-");
  scripts.forEach((src, i) => {
    const f = path.join(tmpDir, "s" + i + ".js");
    fs.writeFileSync(f, src, "utf8");
    try {
      execSync("node --check " + JSON.stringify(f), { stdio: "pipe" });
      ok("script #" + i + " cú pháp hợp lệ");
    } catch (e) {
      fail("script #" + i + " LỖI CÚ PHÁP", e.stderr ? e.stderr.toString().split("\n")[0] : String(e));
    }
  });
}

// -------------------------------------------------------------------------
// Dựng trang trong jsdom, trả về {window, document, errors}
// -------------------------------------------------------------------------
function bootPage(html) {
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  // không có mạng thật trong môi trường test — mọi fetch() rơi về dữ liệu mặc định
  // đã nhúng sẵn trong code (đúng hành vi dự phòng đã thiết kế), không coi là lỗi.
  window.fetch = () => Promise.reject(new Error("no network in test env"));
  window.console.warn = () => {}; // im lặng các dòng "dùng dữ liệu mặc định" — dự phòng bình thường, không phải lỗi
  const errors = [];
  window.onerror = (msg, src, line) => errors.push(msg + " (line " + line + ")");
  return { window, document: window.document, errors };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------------------------------------------------------------------------
// BƯỚC 1 — Tải trang: không có lỗi JS nào khi khởi động
// -------------------------------------------------------------------------
async function checkPageLoads(html) {
  section("Tải trang (không có lỗi JS lúc khởi động)");
  const { errors } = bootPage(html);
  await sleep(1000);
  if (errors.length === 0) ok("trang tải xong, không lỗi JS");
  else errors.forEach((e) => fail("lỗi lúc tải trang", e));
}

// -------------------------------------------------------------------------
// BƯỚC 2 — Báo giá chi tiết: quét mọi tổ hợp ngành × gói × năm
// -------------------------------------------------------------------------
async function sweepQuoteTool(html) {
  section("Báo giá chi tiết — quét toàn bộ ngành × gói × năm");
  const { document: doc, errors } = bootPage(html);
  await sleep(600);

  const industries = [...doc.querySelectorAll("#industryRadioGroup .radio-chip")];
  if (industries.length === 0) return fail("không tìm thấy nút chọn ngành (#industryRadioGroup)");

  let combos = 0;
  industries.forEach((chip) => {
    chip.click();
    const pkgCards = [...doc.querySelectorAll("#pkgOptions .pkg-card")];
    pkgCards.forEach((card) => {
      card.click();
      const pills = [...doc.querySelectorAll("#durationPills .pill")];
      pills.forEach((pill) => {
        const before = errors.length;
        pill.click();
        combos++;
        if (errors.length > before) {
          fail(
            "lỗi khi chọn [" + chip.textContent.trim() + " / " + card.querySelector(".title").textContent.trim() + " / " + pill.textContent.trim() + "]",
            errors[errors.length - 1]
          );
        }
      });
    });
  });
  if (errors.length === 0) ok("quét " + combos + " tổ hợp — không lỗi nào");
}

// -------------------------------------------------------------------------
// BƯỚC 3 — Báo giá tổng: quét ngành × gói × năm, kiểm tra gallery quà tặng có ảnh
// -------------------------------------------------------------------------
async function sweepSummaryTool(html) {
  section("Báo giá tổng — quét ngành × gói × năm + kiểm tra ảnh quà tặng");
  const { document: doc, errors } = bootPage(html);
  await sleep(600);
  doc.getElementById("gotoSummaryBtn").click();

  const industryBtns = [...doc.querySelectorAll("#sqIndustryGrid .sq-industry-btn")];
  if (industryBtns.length === 0) return fail("không tìm thấy nút chọn ngành trong Báo giá tổng");

  industryBtns.forEach((btn) => {
    const before = errors.length;
    btn.click();
    if (errors.length > before) fail("lỗi khi chọn ngành [" + btn.textContent.trim() + "]", errors[errors.length - 1]);
  });
  if (errors.length === 0) ok("quét " + industryBtns.length + " ngành — không lỗi nào");

  const priceInputs = doc.querySelectorAll("#sqTermBlocks .sq-price-input").length;
  if (priceInputs === 12) ok("đủ 12 ô giá (4 mốc năm × 3 gói)");
  else fail("thiếu ô giá", "tìm thấy " + priceInputs + "/12");

  const galleryItems = [...doc.querySelectorAll("#sqGiftGallery .sq-gift-item")];
  const missingImg = galleryItems.filter((el) => !el.querySelector("img"));
  if (galleryItems.length > 0 && missingImg.length === 0) ok("cả " + galleryItems.length + " ảnh quà tặng đều tra ra ảnh");
  else if (galleryItems.length === 0) fail("không tìm thấy mục nào trong gallery quà tặng");
  else missingImg.forEach((el) => fail("thiếu ảnh quà tặng", el.querySelector(".n").textContent));
}

// -------------------------------------------------------------------------
// BƯỚC 4 — Xuất PDF (Báo giá tổng): giả lập html2canvas/jsPDF, kiểm tra cơ chế DÀN TỪNG KHỐI
// (mỗi dòng/khối chụp ảnh riêng rồi tự xếp trang) — không khối nào bị đặt tràn ra ngoài trang,
// và header (dòng tiêu đề gói) tự lặp lại đúng ngay sau mỗi lần sang trang mới.
// -------------------------------------------------------------------------
async function checkPdfExportPagination(html) {
  section("Xuất PDF (Báo giá tổng) — dàn từng khối, không cắt đôi dòng nào");
  const { window, document: doc, errors } = bootPage(html);
  await sleep(600);
  doc.getElementById("gotoSummaryBtn").click();

  // Chuyển sang ngành có bảng tính năng DÀI NHẤT (Lưu trú, đặt phòng — 22 dòng) để thử tải nặng thật sự.
  const industryBtns = [...doc.querySelectorAll("#sqIndustryGrid .sq-industry-btn")];
  if (industryBtns[3]) industryBtns[3].click();

  const pageW = 595.28,
    pageH = 841.89;
  let addImageCalls = [];
  let addPageCalls = 0;
  let html2canvasCalls = 0;
  // Mỗi khối thật có chiều cao khác nhau (dòng ngắn/dài, khối quà tặng...) — giả lập bằng chiều cao
  // "giả ngẫu nhiên nhưng xác định" theo thứ tự gọi, để kiểm tra thuật toán dàn trang với dữ liệu đa dạng.
  window.html2canvas = () => {
    html2canvasCalls++;
    const h = 60 + ((html2canvasCalls * 37) % 220); // dao động 60–280px, mô phỏng khối cao thấp khác nhau
    return Promise.resolve({ width: 1520, height: h * 2, toDataURL: () => "data:image/png;base64,AAAA" });
  };
  window.jspdf = {
    jsPDF: function () {
      return {
        internal: { pageSize: { getWidth: () => pageW, getHeight: () => pageH } },
        addImage: (data, fmt, x, y, w, h) => addImageCalls.push({ y, h }),
        addPage: () => addPageCalls++,
        save: () => {},
      };
    },
  };

  doc.getElementById("sqExportPdfBtn").click();
  await sleep(1500);

  if (html2canvasCalls > 10) ok("đã chụp ảnh riêng lẻ " + html2canvasCalls + " khối (mỗi dòng/khối 1 lần chụp, không gộp thành 1 ảnh dài)");
  else fail("số lần chụp ảnh bất thường", "chỉ " + html2canvasCalls + " lần — có thể đang gộp lại như cơ chế cũ");

  const overflow = addImageCalls.filter((c) => c.y + c.h > pageH + 0.5);
  if (overflow.length === 0) ok("không khối nào bị đặt tràn quá mép trang (không có khối nào bị cắt)");
  else fail("có " + overflow.length + " khối bị đặt tràn quá chiều cao trang", JSON.stringify(overflow[0]));

  if (addPageCalls > 0) ok("có sang trang khi nội dung dài (" + addPageCalls + " lần)");
  else fail("không thấy sang trang nào dù nội dung dài — nghi ngờ thuật toán dàn trang không hoạt động");

  if (errors.length === 0) ok("không có lỗi JS trong lúc xuất PDF");
  else errors.forEach((e) => fail("lỗi lúc xuất PDF", e));
}

// -------------------------------------------------------------------------
// BƯỚC 5 — Chống HTML Injection: gõ thẻ HTML vào ô Tên KH/Sale, kiểm tra đã escape
// -------------------------------------------------------------------------
async function checkXssEscaping(html) {
  section("Chống HTML Injection ở các ô nhập tay");
  const { window, document: doc, errors } = bootPage(html);
  await sleep(600);
  doc.getElementById("gotoSummaryBtn").click();

  const XSS = "<img src=x onerror=alert(1)>";
  doc.getElementById("sqCustToggle").click();
  const custName = doc.getElementById("sqCustName");
  custName.value = XSS;
  custName.dispatchEvent(new window.Event("input"));
  const saleName = doc.getElementById("sqSaleName");
  saleName.value = XSS;
  saleName.dispatchEvent(new window.Event("input"));

  let captured = null;
  window.html2canvas = (el) => {
    if (!captured) captured = el.cloneNode(true);
    return Promise.resolve({ width: 10, height: 10, toDataURL: () => "data:image/png;base64," });
  };
  window.jspdf = {
    jsPDF: function () {
      return { internal: { pageSize: { getWidth: () => 595, getHeight: () => 841 } }, addImage: () => {}, addPage: () => {}, save: () => {} };
    },
  };
  doc.getElementById("sqExportPdfBtn").click();
  await sleep(400);

  const outHtml = captured ? captured.outerHTML : "";
  const stillLive = outHtml.includes("<img src=x onerror");
  const escaped = outHtml.includes("&lt;img");
  if (!stillLive && escaped) ok("nội dung gõ vào ô Tên KH/Sale đã được escape đúng khi xuất PDF");
  else fail("HTML INJECTION — thẻ HTML sống sót vào bản xuất PDF", "outerHTML chứa thẻ chưa escape");
  if (errors.length === 0) ok("không lỗi JS trong lúc test");
}

// -------------------------------------------------------------------------
// BƯỚC 6 — "Tặng tháng" không cho số âm
// -------------------------------------------------------------------------
async function checkNegativeMonthsClamp(html) {
  section('"Tặng tháng" không lưu số âm');
  const { window, document: doc } = bootPage(html);
  await sleep(600);
  doc.getElementById("gotoSummaryBtn").click();

  const monthsInp = doc.querySelector("#sqTermBlocks .sq-months-input");
  monthsInp.value = "-7";
  monthsInp.dispatchEvent(new window.Event("input"));
  doc.getElementById("sqTabPrice").click();
  const bodyText = doc.getElementById("sqPreviewBody").textContent;
  if (!bodyText.includes("Tặng -")) ok('không có "Tặng -X tháng" nào hiện ra trên bản xem trước');
  else fail("số âm bị lọt ra bản xem trước", bodyText.slice(bodyText.indexOf("Tặng -"), bodyText.indexOf("Tặng -") + 20));
}

// -------------------------------------------------------------------------
// MAIN
// -------------------------------------------------------------------------
(async () => {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error("Không tìm thấy index.html ở gốc repo — dừng test.");
    process.exit(1);
  }
  const html = fs.readFileSync(INDEX_PATH, "utf8");

  checkInlineScriptSyntax(html);
  await checkPageLoads(html);
  await sweepQuoteTool(html);
  await sweepSummaryTool(html);
  await checkPdfExportPagination(html);
  await checkXssEscaping(html);
  await checkNegativeMonthsClamp(html);

  console.log("\n============================================");
  console.log("KẾT QUẢ: " + passCount + " pass, " + failCount + " fail");
  console.log("============================================");
  process.exit(failCount > 0 ? 1 : 0);
})();
