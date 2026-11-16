// Bổ sung các câu tiếng Việt còn thiếu cho Decap CMS.
// Bản dịch "vi" có sẵn của Decap thiếu một số câu (nút "Add … +", "Insert from URL", "Toggle preview"…),
// nên các chỗ đó hiện tiếng Anh xen giữa giao diện tiếng Việt. File này gộp thêm các câu còn thiếu
// vào bản "vi" có sẵn (KHÔNG thay thế) — câu nào Decap đã dịch thì giữ nguyên.
// BẮT BUỘC nạp SAU decap-cms.js và TRƯỚC CMS.init().
(function () {
  if (!window.CMS || !CMS.getLocale || !CMS.registerLocale) return;

  var patch = {
    app: {
      header: {
        deploys: 'Triển khai',
        deploysDeployed: 'Đã triển khai',
        deploysPublishing: 'Đang đăng…',
        deploysBuilding: 'Đang build',
        deploysFailed: 'Build lỗi',
      },
    },
    collection: {
      collectionTop: {
        viewAsList: 'Xem dạng danh sách',
        viewAsGrid: 'Xem dạng lưới',
        groupBy: 'Nhóm theo',
      },
      entries: { unpublishedHeader: 'Bản chưa công bố' },
      groups: { other: 'Khác', negateLabel: 'Không phải %{label}' },
    },
    editor: {
      editorControl: { field: { widgetLabel: 'Trường %{widgetLabel}' } },
      editorInterface: {
        togglePreview: 'Bật/tắt xem trước',
        toggleScrollSync: 'Cuộn đồng bộ',
        toggleNotes: 'Bật/tắt ghi chú',
        toggleI18n: 'Bật/tắt đa ngôn ngữ',
      },
      editorNotesPane: {
        title: 'Ghi chú',
        emptyState: 'Chưa có ghi chú nào. Thêm ghi chú đầu tiên ở bên dưới.',
        addNote: 'Thêm ghi chú',
        addPlaceholder: 'Thêm ghi chú…',
        editPlaceholder: 'Sửa ghi chú…',
        save: 'Lưu',
        cancel: 'Hủy',
        edit: 'Sửa',
        delete: 'Xóa',
        resolve: 'Đã xử lý',
        unresolve: 'Mở lại',
        confirmDelete: 'Bạn chắc chắn muốn xóa ghi chú này?',
        shortcut: 'Mẹo: nhấn Ctrl+Enter để thêm nhanh',
      },
      editorToolbar: {
        statusInfoTooltipDraft: 'Mục đang ở trạng thái nháp. Muốn gửi duyệt, hãy chuyển sang "Đang duyệt".',
        statusInfoTooltipInReview: 'Mục đang được duyệt, không cần làm gì thêm. Bạn vẫn có thể tiếp tục sửa.',
      },
      editorWidgets: {
        image: {
          chooseMultiple: 'Chọn nhiều hình',
          chooseUrl: 'Chèn từ đường dẫn (URL)',
          replaceUrl: 'Thay bằng đường dẫn (URL)',
          promptUrl: 'Nhập đường dẫn (URL) của hình',
          addMore: 'Thêm hình',
          removeAll: 'Xóa tất cả hình',
        },
        file: {
          chooseMultiple: 'Chọn nhiều tệp',
          chooseUrl: 'Chèn từ đường dẫn (URL)',
          replaceUrl: 'Thay bằng đường dẫn (URL)',
          promptUrl: 'Nhập đường dẫn (URL) của tệp',
          addMore: 'Thêm tệp',
          removeAll: 'Xóa tất cả tệp',
        },
        markdown: {
          bold: 'In đậm',
          italic: 'In nghiêng',
          strikethrough: 'Gạch ngang',
          code: 'Mã',
          link: 'Liên kết',
          linkPrompt: 'Nhập đường dẫn (URL) của liên kết',
          headings: 'Tiêu đề',
          quote: 'Trích dẫn',
          bulletedList: 'Danh sách gạch đầu dòng',
          numberedList: 'Danh sách đánh số',
          addComponent: 'Thêm thành phần',
          toggleMode: { rich: 'Chuyển sang soạn thảo trực quan', markdown: 'Chuyển sang soạn bằng Markdown' },
        },
        datetime: { setToNow: 'Đặt "%{fieldLabel}" là bây giờ' },
        list: { add: 'Thêm %{item}', addType: 'Thêm %{item}' },
        object: { expand: 'Mở rộng', collapse: 'Thu gọn' },
      },
    },
    mediaLibrary: {
      mediaLibraryCard: {
        copy: 'Sao chép',
        copyUrl: 'Sao chép URL',
        copyPath: 'Sao chép đường dẫn',
        copyName: 'Sao chép tên',
        copied: 'Đã sao chép',
      },
      mediaLibraryModal: { close: 'Đóng' },
    },
    ui: {
      settingsDropdown: { account: 'Tùy chọn tài khoản' },
      deploys: {
        heading: 'Triển khai',
        refresh: 'Làm mới',
        refreshing: 'Đang làm mới…',
        viewSite: 'Xem trang',
        summaryPublishing: 'Đang đăng %{count} thay đổi — chờ trang build xong.',
        summaryBuilding: 'Trang đang được build.',
        summaryLive: 'Thay đổi mới nhất đã lên trang. Triển khai %{time}.',
        summaryFailed: 'Lần build gần nhất bị lỗi. Thay đổi mới nhất chưa lên trang.',
        summaryUnknown: 'Chưa có thông tin triển khai nào cho trang này.',
        loadError: 'Không tải được danh sách triển khai: %{details}',
        columnState: 'Trạng thái',
        columnEntry: 'Mục đã lưu',
        columnWhere: 'Đăng lên',
        columnTarget: 'Báo từ',
        columnCommit: 'Commit',
        columnWhen: 'Thời gian',
        state: {
          pending: 'Đang chờ',
          building: 'Đang build',
          live: 'Đang chạy',
          deployed: 'Đã triển khai',
          failed: 'Lỗi',
          canceled: 'Bị thay thế',
          stalled: 'Không rõ',
        },
      },
      toast: {
        entryPublishing: 'Đã lưu · đang đăng…',
        entryLive: 'Thay đổi ở "%{entry}" đã lên trang',
        entriesLive: '%{count} thay đổi đã lên trang',
        entryDeployFailed: 'Trang build lỗi',
        viewSite: 'Xem',
        viewEntry: 'Xem mục',
        viewBuildLog: 'Xem log build',
        noteAdded: 'Đã thêm ghi chú',
        onFailToAddNote: 'Không thêm được ghi chú: %{details}',
        noteUpdated: 'Đã cập nhật ghi chú',
        onFailToUpdateNote: 'Không cập nhật được ghi chú: %{details}',
        noteDeleted: 'Đã xóa ghi chú',
        onFailToDeleteNote: 'Không xóa được ghi chú: %{details}',
        noteResolved: 'Đã đánh dấu xử lý',
        noteReopened: 'Đã mở lại ghi chú',
        onFailToToggleNote: 'Không đổi được trạng thái ghi chú: %{details}',
      },
    },
  };

  // Gộp sâu: câu đã có trong bản "vi" gốc được ưu tiên, chỉ điền chỗ trống.
  function fill(target, extra) {
    Object.keys(extra).forEach(function (k) {
      var v = extra[k];
      if (v && typeof v === 'object') {
        if (!target[k] || typeof target[k] !== 'object') target[k] = {};
        fill(target[k], v);
      } else if (target[k] === undefined) {
        target[k] = v;
      }
    });
    return target;
  }

  var vi = CMS.getLocale('vi');
  if (vi) CMS.registerLocale('vi', fill(vi, patch));
})();
