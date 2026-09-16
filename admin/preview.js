/* preview.js — Preview đẹp cho Decap CMS (baogiakiotviet)
 * Nhúng file này vào admin/index.html, SAU thẻ <script> load decap-cms.js.
 * Dùng đúng 2 global mà Decap CMS cấp sẵn: createClass (tạo component) và h (tạo phần tử,
 * giống document.createElement nhưng cho React) — không cần build/compile gì thêm.
 */
(function () {
  // ==== Bảng màu/spacing lấy đúng theo trang báo giá thật (--primary v.v. trong file HTML chính) ====
  var COLOR = {
    primary: '#0047BB',
    primaryDark: '#013D9E',
    primary50: '#F0F5FE',
    primary100: '#DCE8FA',
    text: '#1F2937',
    dim: '#6B7280',
    border: '#E5E7EB',
    bg: '#F9FAFB',
    green: '#059669',
    red: '#DC2626',
  };

  function fmt(n) {
    return (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  }

  // Lấy toàn bộ data của entry dưới dạng object JS thường (dễ đọc/dễ duyệt hơn Immutable Map)
  function getData(entry) {
    var d = entry.get('data');
    return d ? d.toJS() : {};
  }

  // Bảng tên hiển thị cho mã quà tặng cố định (qua1/qua2/qua3) — khớp đúng options trong config.yml
  var GIFT_LABELS = {
    kv804: 'Máy in hóa đơn KV804',
    kv99: 'Màn hình hiển thị QR KV99',
    kv505: 'Máy in hóa đơn để bàn KV505',
    giay: 'Giấy in nhiệt (hóa đơn)',
    '365b': 'Máy in mã vạch 365B',
    xl6500a: 'Máy quét mã vạch XL-6500A',
  };

  var TIER_LABELS = { hotro: 'Gói Hỗ trợ', chuyennghiep: 'Gói Chuyên nghiệp', caocap: 'Gói Cao cấp' };
  var TIER_ICONS = { hotro: '🌱', chuyennghiep: '🚀', caocap: '👑' };
  var INDUSTRY_META = {
    banle: { icon: '🏪', label: 'Bán lẻ (Retail)' },
    anuong: { icon: '🍽️', label: 'Ăn uống (FnB)' },
    suckhoe: { icon: '💇', label: 'Sức khỏe / Salon' },
    luutru: { icon: '🏨', label: 'Lưu trú / Booking' },
  };
  // Khoá ngành trong data/pricing.json (đúng theo admin/config.yml hiện tại) khác với khoá
  // hiển thị ở trên (dùng chung với promotions.json) — ánh xạ để tái sử dụng INDUSTRY_META.
  var PRICING_INDUSTRY_MAP = { retail: 'banle', fnb: 'anuong', salon: 'suckhoe', booking: 'luutru' };

  // ---------------------------------------------------------------------------
  // 1) PREVIEW CHO "gia" (data/pricing.json) — file name trong config.yml là "pricing"
  // ---------------------------------------------------------------------------
  var PricingPreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      var logoSrc = null;
      if (data.logoUrl) {
        var asset = this.props.getAsset(data.logoUrl);
        logoSrc = asset ? asset.toString() : null;
      }

      function packageCard(key, title, icon, g) {
        if (!g) return null;
        var rows = (g.cacMucNam || []).map(function (m) {
          var giaCn1 = m.giaTron != null ? m.giaTron : m.giaChiNhanh1;
          return h(
            'tr',
            { key: m.soNam },
            h('td', {}, m.soNam + ' năm'),
            h('td', { className: 'kv-num' }, fmt(giaCn1)),
            m.giaChiNhanh2 != null ? h('td', { className: 'kv-num' }, fmt(m.giaChiNhanh2)) : null,
            h('td', { className: 'kv-num' }, '+' + (m.hoaDonTang || 0) + '/năm'),
            h('td', {}, (Array.isArray(m.quaTangMacDinh) && m.quaTangMacDinh.length) ? m.quaTangMacDinh.join(', ') : h('span', { className: 'kv-dim' }, 'tự đề xuất'))
          );
        });
        return h(
          'div',
          { className: 'kv-card kv-pkgcard', key: key },
          h('div', { className: 'kv-pkgcard-head' }, h('span', {}, icon), ' ', title),
          h('div', { className: 'kv-pkgcard-price' }, fmt(g.giaThangChiNhanh1) + ' / tháng (CN1)'),
          g.giaThangChiNhanh2
            ? h('div', { className: 'kv-pkgcard-sub' }, fmt(g.giaThangChiNhanh2) + ' / tháng (CN2 trở lên)')
            : null,
          h(
            'table',
            { className: 'kv-table' },
            h(
              'thead',
              {},
              h(
                'tr',
                {},
                h('th', {}, 'Thời hạn'),
                h('th', {}, 'Giá CN1'),
                g.giaChiNhanh2 !== undefined ? h('th', {}, 'Giá CN2+') : null,
                h('th', {}, 'HĐĐT tặng'),
                h('th', {}, 'Quà mặc định')
              )
            ),
            h('tbody', {}, rows)
          )
        );
      }

      var addons = data.addons || {};
      var hddtRows = (addons.hoaDonDienTuMuaThem || []).map(function (r, i) {
        return h(
          'tr',
          { key: i },
          h('td', {}, '+' + Number(r.soLuong || 0).toLocaleString('vi-VN') + ' số'),
          h('td', { className: 'kv-num' }, fmt(r.gia)),
          h('td', { className: 'kv-num' }, r.giaKhuyenMai ? fmt(r.giaKhuyenMai) : h('span', { className: 'kv-dim' }, '—'))
        );
      });

      // data/pricing.json (đúng theo admin/config.yml hiện tại) chia giá theo 4 ngành:
      // retail/fnb/salon/booking, mỗi ngành có 3 gói hotro/chuyennghiep/caocap.
      var industryBlocks = ['retail', 'fnb', 'salon', 'booking'].map(function (pKey) {
        var ind = data[pKey];
        if (!ind) return null;
        var meta = INDUSTRY_META[PRICING_INDUSTRY_MAP[pKey]] || { icon: '📦', label: pKey };
        return h(
          'div',
          { key: pKey, style: { marginBottom: '24px' } },
          h(
            'div',
            { className: 'kv-industry-head' },
            h('span', { className: 'kv-industry-icon' }, meta.icon),
            h('span', {}, meta.label)
          ),
          h(
            'div',
            { className: 'kv-pkggrid' },
            packageCard('hotro', 'Gói Hỗ trợ', '🌱', ind.hotro),
            packageCard('chuyennghiep', 'Gói Chuyên Nghiệp', '🚀', ind.chuyennghiep),
            packageCard('caocap', 'Gói Cao Cấp', '👑', ind.caocap)
          )
        );
      });

      return h(
        'div',
        { className: 'kv-preview' },
        h(
          'div',
          { className: 'kv-header' },
          logoSrc ? h('img', { className: 'kv-logo', src: logoSrc }) : null,
          h('div', {}, h('h1', {}, '💰 Bảng giá phần mềm KiotViet'), h('div', { className: 'kv-dim' }, 'Xem trước đúng bố cục sẽ hiển thị cho khách hàng — theo từng ngành'))
        ),
        industryBlocks,
        hddtRows.length
          ? h(
              'div',
              { className: 'kv-card' },
              h('div', { className: 'kv-section-title' }, '🧾 Hóa đơn điện tử mua thêm'),
              h(
                'table',
                { className: 'kv-table' },
                h('thead', {}, h('tr', {}, h('th', {}, 'Số lượng'), h('th', {}, 'Giá thường'), h('th', {}, 'Giá KM'))),
                h('tbody', {}, hddtRows)
              )
            )
          : null
      );
    },
  });
  CMS.registerPreviewTemplate('pricing_all_industries', PricingPreview);

  // ---------------------------------------------------------------------------
  // 2) PREVIEW CHO "thietbi" (data/hardware.json) — file name là "hardware"
  // ---------------------------------------------------------------------------
  var HardwarePreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      var groups = data.danhMuc || [];
      var self = this;

      return h(
        'div',
        { className: 'kv-preview' },
        h('div', { className: 'kv-header' }, h('h1', {}, '🖨️ Danh mục thiết bị'), h('div', { className: 'kv-dim' }, groups.length + ' nhóm thiết bị')),
        groups.map(function (g, gi) {
          return h(
            'div',
            { className: 'kv-group', key: gi },
            h('div', { className: 'kv-group-title' }, '📁 ' + g.nhom),
            h(
              'div',
              { className: 'kv-grid' },
              (g.items || []).map(function (item, ii) {
                var imgSrc = null;
                if (item.image) {
                  var asset = self.props.getAsset(item.image);
                  imgSrc = asset ? asset.toString() : null;
                }
                return h(
                  'div',
                  { className: 'kv-card kv-devicecard', key: ii },
                  imgSrc
                    ? h('img', { className: 'kv-device-img', src: imgSrc })
                    : h('div', { className: 'kv-device-img kv-noimg' }, '🖼️ Chưa có ảnh'),
                  h('div', { className: 'kv-device-name' }, item.name),
                  h('div', { className: 'kv-device-price' }, fmt(item.price)),
                  h(
                    'div',
                    { className: 'kv-device-meta' },
                    item.warranty ? h('span', {}, '🛡️ ' + item.warranty) : null,
                    item.unit ? h('span', {}, ' · 📏 ' + item.unit) : null
                  )
                );
              })
            )
          );
        })
      );
    },
  });
  CMS.registerPreviewTemplate('hardware', HardwarePreview);

  // ---------------------------------------------------------------------------
  // 3) PREVIEW CHO "khuyenmai" (data/promotions.json) — file name là "promotions"
  // ---------------------------------------------------------------------------
  var PromotionsPreview = createClass({
    render: function () {
      var data = getData(this.props.entry);
      var today = new Date().toISOString().slice(0, 10);
      var dangHieuLuc = data.active && data.tuNgay && data.denNgay && today >= data.tuNgay && today <= data.denNgay;

      function giftBadges(nam) {
        // quaThietBi (mới): mảng TÊN THIẾT BỊ THẬT trực tiếp. qua1/qua2/qua3 (cũ, dữ liệu sót lại):
        // mã rút gọn, tra qua GIFT_LABELS để ra tên hiển thị.
        var names = Array.isArray(nam.quaThietBi) && nam.quaThietBi.length
          ? nam.quaThietBi
          : [nam.qua1, nam.qua2, nam.qua3].filter(function (v) { return v && v !== 'none'; }).map(function (c) { return GIFT_LABELS[c] || c; });
        if (!names.length) return null;
        return h(
          'div',
          { className: 'kv-giftbadges' },
          names.map(function (n, i) {
            return h('span', { className: 'kv-badge', key: i }, '🎁 ' + n);
          })
        );
      }

      function tierTable(tierKey, tierObj) {
        if (!tierObj) return null;
        var years = ['nam1', 'nam2', 'nam3', 'nam5'];
        var rows = years
          .filter(function (y) {
            return tierObj[y];
          })
          .map(function (y) {
            var nam = tierObj[y];
            var soNam = y.replace('nam', '');
            return h(
              'tr',
              { key: y },
              h('td', {}, soNam + ' năm'),
              h('td', { className: 'kv-num kv-green' }, nam.giam ? '−' + fmt(nam.giam) : '—'),
              h('td', { className: 'kv-num' }, nam.thangTang ? '+' + nam.thangTang + ' tháng' : '—'),
              h('td', { className: 'kv-num' }, '+' + (nam.hddtNam || 0) + '/năm'),
              h('td', {}, nam.qua ? h('div', {}, nam.qua) : null, giftBadges(nam))
            );
          });
        return h(
          'div',
          { className: 'kv-tiertable', key: tierKey },
          h('div', { className: 'kv-tier-title' }, (TIER_ICONS[tierKey] || '') + ' ' + (TIER_LABELS[tierKey] || tierKey)),
          h(
            'table',
            { className: 'kv-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Thời hạn'), h('th', {}, 'Giảm giá'), h('th', {}, 'Hoặc tặng tháng'), h('th', {}, 'HĐĐT tặng thêm'), h('th', {}, 'Quà tặng'))),
            h('tbody', {}, rows)
          )
        );
      }

      var industryBlocks = ['retail', 'fnb', 'salon', 'booking'].map(function (key) {
        var ind = data[key];
        var meta = INDUSTRY_META[PRICING_INDUSTRY_MAP[key]] || { icon: '📦', label: key };
        if (!ind) return null;
        return h(
          'div',
          { className: 'kv-card kv-industry', key: key },
          h(
            'div',
            { className: 'kv-industry-head' },
            h('span', { className: 'kv-industry-icon' }, meta.icon),
            h('span', {}, meta.label),
            ind.khongCombo ? h('span', { className: 'kv-badge kv-badge-warn' }, '🚫 Tắt bán combo POS') : null
          ),
          tierTable('hotro', ind.hotro),
          tierTable('chuyennghiep', ind.chuyennghiep),
          tierTable('caocap', ind.caocap)
        );
      });

      return h(
        'div',
        { className: 'kv-preview' },
        h(
          'div',
          { className: 'kv-promo-banner ' + (dangHieuLuc ? 'kv-promo-on' : 'kv-promo-off') },
          h('div', { className: 'kv-promo-title' }, (dangHieuLuc ? '🎉 ĐANG ÁP DỤNG: ' : (data.active ? '⏳ Chưa/hết hiệu lực: ' : '⛔ ĐANG TẮT: ')) + (data.ten || '(chưa đặt tên)')),
          h('div', { className: 'kv-promo-dates' }, '📅 Từ ' + (data.tuNgay || '?') + ' đến ' + (data.denNgay || '?'))
        ),
        industryBlocks
      );
    },
  });
  CMS.registerPreviewTemplate('promotions', PromotionsPreview);

  // ---------------------------------------------------------------------------
  // CSS DÙNG CHUNG CHO CẢ 3 PREVIEW — bám theo màu thương hiệu của trang báo giá thật
  // ---------------------------------------------------------------------------
  CMS.registerPreviewStyle(
    [
      '.kv-preview{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:' + COLOR.text + ';padding:20px;max-width:900px;}',
      '.kv-header{display:flex;align-items:center;gap:14px;margin-bottom:20px;}',
      '.kv-header h1{font-size:20px;margin:0 0 2px;}',
      '.kv-logo{height:44px;width:auto;object-fit:contain;}',
      '.kv-dim{color:' + COLOR.dim + ';font-size:13px;}',
      '.kv-card{background:#fff;border:1px solid ' + COLOR.border + ';border-radius:12px;padding:16px;margin-bottom:16px;}',
      '.kv-pkggrid{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:16px;}',
      '.kv-pkgcard-head{font-weight:700;font-size:15px;margin-bottom:4px;}',
      '.kv-pkgcard-price{color:' + COLOR.primary + ';font-weight:700;font-size:18px;margin-bottom:2px;}',
      '.kv-pkgcard-sub{color:' + COLOR.dim + ';font-size:13px;margin-bottom:10px;}',
      '.kv-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;}',
      '.kv-table th{text-align:left;color:' + COLOR.dim + ';font-weight:600;font-size:12px;padding:6px 8px;border-bottom:2px solid ' + COLOR.border + ';}',
      '.kv-table td{padding:7px 8px;border-bottom:1px solid ' + COLOR.border + ';vertical-align:top;}',
      '.kv-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;}',
      '.kv-green{color:' + COLOR.green + ';font-weight:600;}',
      '.kv-section-title{font-weight:700;margin-bottom:4px;}',
      '.kv-group{margin-bottom:22px;}',
      '.kv-group-title{font-weight:700;font-size:15px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid ' + COLOR.primary100 + ';}',
      '.kv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}',
      '.kv-devicecard{padding:10px;text-align:center;margin-bottom:0;}',
      '.kv-device-img{width:100%;height:90px;object-fit:contain;border-radius:8px;background:' + COLOR.bg + ';margin-bottom:8px;}',
      '.kv-noimg{display:flex;align-items:center;justify-content:center;color:' + COLOR.dim + ';font-size:12px;border:1px dashed ' + COLOR.border + ';}',
      '.kv-device-name{font-weight:600;font-size:12.5px;line-height:1.3;margin-bottom:4px;min-height:32px;}',
      '.kv-device-price{color:' + COLOR.primary + ';font-weight:700;font-size:14px;}',
      '.kv-device-meta{color:' + COLOR.dim + ';font-size:11px;margin-top:4px;}',
      '.kv-promo-banner{border-radius:12px;padding:14px 16px;margin-bottom:18px;}',
      '.kv-promo-on{background:' + COLOR.primary50 + ';border:1px solid ' + COLOR.primary100 + ';}',
      '.kv-promo-off{background:' + COLOR.bg + ';border:1px solid ' + COLOR.border + ';}',
      '.kv-promo-title{font-weight:700;font-size:15px;color:' + COLOR.primaryDark + ';}',
      '.kv-promo-dates{color:' + COLOR.dim + ';font-size:12.5px;margin-top:2px;}',
      '.kv-industry{margin-bottom:16px;}',
      '.kv-industry-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:15px;margin-bottom:10px;}',
      '.kv-industry-icon{font-size:18px;}',
      '.kv-tier-title{font-weight:600;font-size:13px;color:' + COLOR.primaryDark + ';margin:12px 0 4px;}',
      '.kv-badge{display:inline-block;background:' + COLOR.primary100 + ';color:' + COLOR.primaryDark + ';border-radius:999px;padding:2px 8px;font-size:11px;margin:2px 4px 0 0;}',
      '.kv-badge-warn{background:#FEE2E2;color:' + COLOR.red + ';margin-left:8px;}',
      '.kv-giftbadges{margin-top:4px;}',
    ].join('\n'),
    { raw: true }
  );
})();
