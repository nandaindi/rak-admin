/* =========================================
   RAKADMIN - JAVASCRIPT
   Dashboard Perpustakaan
========================================= */

/* =========================================
   HELPER
========================================= */

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function loadStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Gagal membaca:", key, error);
    return [];
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan:", key, error);
    alert("Data gagal disimpan.");
    return false;
  }
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLoanDate(dateString) {
  if (!dateString) return "-";

  const parts = dateString.split("-");

  if (parts.length !== 3) return "-";

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
  );

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "-";
  row.appendChild(cell);
  return cell;
}

function createActionButton(iconClass, title, callback, isDelete = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isDelete ? "action-btn delete" : "action-btn";
  button.title = title;

  const icon = document.createElement("i");
  icon.className = iconClass;

  button.appendChild(icon);
  button.addEventListener("click", callback);

  return button;
}

function createStatusBadge(status) {
  const badge = document.createElement("span");

  badge.className =
    status === "returned" ? "status returned" : "status borrowed";

  badge.textContent = status === "returned" ? "Dikembalikan" : "Dipinjam";

  return badge;
}

/* =========================================
   STORAGE DATA
========================================= */

const STORAGE_KEY = "rakAdminBooks";
const LOAN_STORAGE_KEY = "rakAdminLoans";
const MEMBER_STORAGE_KEY = "rakAdminMembers";

let books = loadStorage(STORAGE_KEY);
let loans = loadStorage(LOAN_STORAGE_KEY);
let members = loadStorage(MEMBER_STORAGE_KEY);

function saveBooks(data) {
  return saveStorage(STORAGE_KEY, data);
}

function saveLoans(data) {
  return saveStorage(LOAN_STORAGE_KEY, data);
}

function saveMembers(data) {
  return saveStorage(MEMBER_STORAGE_KEY, data);
}

/* =========================================
   CURRENT DATE
========================================= */

const currentDate = document.getElementById("currentDate");

if (currentDate) {
  currentDate.textContent = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* =========================================
   SIDEBAR TOGGLE
========================================= */

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("show");
  });
}

/* =========================================
   PAGE NAVIGATION
========================================= */

const menuItems = document.querySelectorAll(".menu-item[data-page]");

const pages = {
  dashboard: document.getElementById("dashboardPage"),
  books: document.getElementById("booksPage"),
  loans: document.getElementById("loansPage"),
  returns: document.getElementById("returnsPage"),
  members: document.getElementById("membersPage"),
  history: document.getElementById("historyPage"),
  reports: document.getElementById("reportsPage"),
};

const pageTitle = document.getElementById("pageTitle");

const pageTitles = {
  dashboard: "Dashboard",
  books: "Data Buku",
  loans: "Peminjaman",
  returns: "Pengembalian",
  members: "Data Anggota",
  history: "Riwayat Transaksi",
  reports: "Laporan Perpustakaan",
};

function showPage(page) {
  Object.keys(pages).forEach(function (key) {
    if (pages[key]) {
      pages[key].hidden = key !== page;
    }
  });

  menuItems.forEach(function (item) {
    item.classList.toggle("active", item.dataset.page === page);
  });

  if (pageTitle) {
    pageTitle.textContent = pageTitles[page] || "Dashboard";
  }

  if (sidebar) {
    sidebar.classList.remove("show");
  }

  if (page === "books") renderBooks();
  if (page === "loans") renderLoans();
  if (page === "returns") renderReturns();
  if (page === "members") renderMembers();
  if (page === "history") renderHistory();
  if (page === "reports") renderReports();
}

menuItems.forEach(function (item) {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    showPage(this.dataset.page);
  });
});

/* =========================================
   BOOK STATISTICS
========================================= */

function updateStatistics() {
  const totalBooks = document.getElementById("totalBooks");
  const totalStock = document.getElementById("totalStock");
  const dashboardTotalBooks = document.getElementById("dashboardTotalBooks");

  const stockCount = books.reduce(function (total, book) {
    return total + Number(book.stock || 0);
  }, 0);

  if (totalBooks) totalBooks.textContent = books.length;
  if (totalStock) totalStock.textContent = stockCount;

  if (dashboardTotalBooks) {
    dashboardTotalBooks.textContent = books.length;
  }
}

/* =========================================
   RENDER BOOK TABLE
========================================= */

function renderBooks() {
  const tableBody = document.getElementById("bookTableBody");
  const searchInput = document.getElementById("searchBook");

  updateStatistics();

  if (!tableBody) return;

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredBooks = books.filter(function (book) {
    return (
      String(book.code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(book.title || "")
        .toLowerCase()
        .includes(keyword) ||
      String(book.author || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  tableBody.replaceChildren();

  if (filteredBooks.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(
      row,
      keyword ? "Data buku tidak ditemukan." : "Belum ada data buku.",
    );

    cell.colSpan = 7;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredBooks.forEach(function (book, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      book.code,
      book.title,
      book.author,
      book.category,
      book.stock,
    ].forEach((value) => createCell(row, value));

    const actionCell = document.createElement("td");
    const container = document.createElement("div");

    container.className = "action-buttons";

    container.appendChild(
      createActionButton("bi bi-pencil", "Edit buku", () => editBook(book.id)),
    );

    container.appendChild(
      createActionButton(
        "bi bi-trash",
        "Hapus buku",
        () => deleteBook(book.id),
        true,
      ),
    );

    actionCell.appendChild(container);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   BOOK MODAL
========================================= */

const bookModal = document.getElementById("bookModal");
const bookForm = document.getElementById("bookForm");
const addBookBtn = document.getElementById("addBookBtn");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");
const editBookId = document.getElementById("editBookId");

function openBookModal() {
  if (!bookForm || !bookModal || !editBookId) return;

  bookForm.reset();
  editBookId.value = "";

  const title = document.getElementById("modalTitle");

  if (title) title.textContent = "Tambah Buku";

  bookModal.classList.add("show");

  const input = document.getElementById("bookCode");

  if (input) input.focus();
}

function hideBookModal() {
  if (bookModal) bookModal.classList.remove("show");
}

if (addBookBtn) addBookBtn.addEventListener("click", openBookModal);
if (closeModal) closeModal.addEventListener("click", hideBookModal);
if (cancelModal) cancelModal.addEventListener("click", hideBookModal);

if (bookModal) {
  bookModal.addEventListener("click", function (e) {
    if (e.target === bookModal) hideBookModal();
  });
}

/* =========================================
   ADD & EDIT BOOK
========================================= */

if (bookForm) {
  bookForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = editBookId.value;
    const code = document.getElementById("bookCode").value.trim();
    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const category = document.getElementById("bookCategory").value;
    const stockValue = document.getElementById("bookStock").value;
    const stock = Number(stockValue);

    if (!code || !title || !author || !category || stockValue === "") {
      alert("Mohon lengkapi seluruh data buku.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      alert("Stok harus berupa bilangan bulat minimal 0.");
      return;
    }

    const duplicate = books.some(function (book) {
      return (
        String(book.code).toLowerCase() === code.toLowerCase() && book.id !== id
      );
    });

    if (duplicate) {
      alert("Kode buku sudah digunakan!");
      return;
    }

    let updatedBooks;

    if (id) {
      updatedBooks = books.map(function (book) {
        return book.id === id
          ? { ...book, code, title, author, category, stock }
          : book;
      });
    } else {
      updatedBooks = [
        ...books,
        {
          id: generateId(),
          code,
          title,
          author,
          category,
          stock,
        },
      ];
    }

    if (!saveBooks(updatedBooks)) return;

    books = updatedBooks;

    renderBooks();
    populateLoanBooks();
    hideBookModal();

    alert(id ? "Data buku berhasil diperbarui!" : "Buku berhasil ditambahkan!");
  });
}

/* =========================================
   EDIT BOOK
========================================= */

function editBook(id) {
  const book = books.find((item) => item.id === id);

  if (!book) {
    alert("Data buku tidak ditemukan.");
    return;
  }

  editBookId.value = book.id;

  document.getElementById("bookCode").value = book.code;
  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookCategory").value = book.category;
  document.getElementById("bookStock").value = book.stock;
  document.getElementById("modalTitle").textContent = "Edit Buku";

  bookModal.classList.add("show");
}

/* =========================================
   DELETE BOOK
========================================= */

function deleteBook(id) {
  const hasActiveLoan = loans.some(function (loan) {
    return loan.bookId === id && loan.status === "borrowed";
  });

  if (hasActiveLoan) {
    alert("Buku tidak dapat dihapus karena masih memiliki peminjaman aktif.");
    return;
  }

  if (!confirm("Apakah kamu yakin ingin menghapus buku ini?")) return;

  const updatedBooks = books.filter((book) => book.id !== id);

  if (!saveBooks(updatedBooks)) return;

  books = updatedBooks;

  renderBooks();
  populateLoanBooks();

  alert("Data buku berhasil dihapus!");
}

/* =========================================
   SEARCH BOOK
========================================= */

const searchBook = document.getElementById("searchBook");

if (searchBook) {
  searchBook.addEventListener("input", renderBooks);
}

/* =========================================
   MEMBER OPTIONS FOR LOAN
========================================= */

const loanMember = document.getElementById("memberName");

function populateLoanMembers() {
  if (!loanMember) return;

  const selectedValue = loanMember.value;

  loanMember.replaceChildren();

  const defaultOption = document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "Pilih Anggota";

  loanMember.appendChild(defaultOption);

  members.forEach(function (member) {
    const option = document.createElement("option");

    option.value = member.id;
    option.textContent = `${member.code} - ${member.fullName}`;

    loanMember.appendChild(option);
  });

  if (members.some((member) => member.id === selectedValue)) {
    loanMember.value = selectedValue;
  }
}

/* =========================================
   MEMBER STATISTICS
========================================= */

function updateMemberStatistics() {
  const totalMembers = document.getElementById("totalMembers");

  if (totalMembers) {
    totalMembers.textContent = members.length;
  }
}

/* =========================================
   RENDER MEMBER TABLE
========================================= */

function renderMembers() {
  const tableBody = document.getElementById("memberTableBody");
  const searchInput = document.getElementById("searchMember");

  updateMemberStatistics();
  populateLoanMembers();

  if (!tableBody) return;

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredMembers = members.filter(function (member) {
    return (
      String(member.code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(member.fullName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(member.className || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  tableBody.replaceChildren();

  if (filteredMembers.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(
      row,
      keyword ? "Data anggota tidak ditemukan." : "Belum ada data anggota.",
    );

    cell.colSpan = 7;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredMembers.forEach(function (member, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      member.code,
      member.fullName,
      member.gender,
      member.className,
      member.phone,
    ].forEach((value) => createCell(row, value));

    const actionCell = document.createElement("td");
    const container = document.createElement("div");

    container.className = "action-buttons";

    container.appendChild(
      createActionButton("bi bi-pencil", "Edit anggota", () =>
        editMember(member.id),
      ),
    );

    container.appendChild(
      createActionButton(
        "bi bi-trash",
        "Hapus anggota",
        () => deleteMember(member.id),
        true,
      ),
    );

    actionCell.appendChild(container);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   MEMBER MODAL
========================================= */

const memberModal = document.getElementById("memberModal");
const memberForm = document.getElementById("memberForm");

const addMemberBtn = document.getElementById("addMemberBtn");
const closeMemberModal = document.getElementById("closeMemberModal");
const cancelMemberModal = document.getElementById("cancelMemberModal");
const editMemberId = document.getElementById("editMemberId");

function openMemberModal() {
  if (!memberForm || !memberModal || !editMemberId) return;

  memberForm.reset();
  editMemberId.value = "";

  const title = document.getElementById("memberModalTitle");

  if (title) title.textContent = "Tambah Anggota";

  memberModal.classList.add("show");

  const input = document.getElementById("memberCode");

  if (input) input.focus();
}

function hideMemberModal() {
  if (memberModal) memberModal.classList.remove("show");
}

if (addMemberBtn) {
  addMemberBtn.addEventListener("click", openMemberModal);
}

if (closeMemberModal) {
  closeMemberModal.addEventListener("click", hideMemberModal);
}

if (cancelMemberModal) {
  cancelMemberModal.addEventListener("click", hideMemberModal);
}

if (memberModal) {
  memberModal.addEventListener("click", function (e) {
    if (e.target === memberModal) hideMemberModal();
  });
}

/* =========================================
   ADD & EDIT MEMBER
========================================= */

if (memberForm) {
  memberForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = editMemberId.value;
    const code = document.getElementById("memberCode").value.trim();
    const fullName = document.getElementById("memberFullName").value.trim();
    const gender = document.getElementById("memberGender").value;
    const className = document.getElementById("memberClass").value.trim();
    const phone = document.getElementById("memberPhone").value.trim();

    if (!code || !fullName || !gender || !className || !phone) {
      alert("Mohon lengkapi seluruh data anggota.");
      return;
    }

    const duplicate = members.some(function (member) {
      return (
        String(member.code).toLowerCase() === code.toLowerCase() &&
        member.id !== id
      );
    });

    if (duplicate) {
      alert("ID anggota sudah digunakan!");
      return;
    }

    let updatedMembers;

    if (id) {
      updatedMembers = members.map(function (member) {
        return member.id === id
          ? { ...member, code, fullName, gender, className, phone }
          : member;
      });
    } else {
      updatedMembers = [
        ...members,
        {
          id: generateId(),
          code,
          fullName,
          gender,
          className,
          phone,
        },
      ];
    }

    if (!saveMembers(updatedMembers)) return;

    members = updatedMembers;

    renderMembers();
    hideMemberModal();

    alert(
      id
        ? "Data anggota berhasil diperbarui!"
        : "Anggota berhasil ditambahkan!",
    );
  });
}

/* =========================================
   EDIT MEMBER
========================================= */

function editMember(id) {
  const member = members.find((item) => item.id === id);

  if (!member) {
    alert("Data anggota tidak ditemukan.");
    return;
  }

  editMemberId.value = member.id;

  document.getElementById("memberCode").value = member.code;
  document.getElementById("memberFullName").value = member.fullName;
  document.getElementById("memberGender").value = member.gender;
  document.getElementById("memberClass").value = member.className;
  document.getElementById("memberPhone").value = member.phone;

  document.getElementById("memberModalTitle").textContent = "Edit Anggota";

  memberModal.classList.add("show");
}

/* =========================================
   DELETE MEMBER
========================================= */

function deleteMember(id) {
  const member = members.find((item) => item.id === id);

  if (!member) {
    alert("Data anggota tidak ditemukan.");
    return;
  }

  const hasActiveLoan = loans.some(function (loan) {
    const sameMember =
      loan.memberId === member.id ||
      String(loan.memberCode || "").toLowerCase() ===
        String(member.code || "").toLowerCase() ||
      (!loan.memberId &&
        !loan.memberCode &&
        String(loan.memberName || "").toLowerCase() ===
          String(member.fullName || "").toLowerCase());

    return sameMember && loan.status === "borrowed";
  });

  if (hasActiveLoan) {
    alert(
      "Anggota tidak dapat dihapus karena masih memiliki peminjaman aktif.",
    );
    return;
  }

  if (
    !confirm(`Apakah kamu yakin ingin menghapus anggota ${member.fullName}?`)
  ) {
    return;
  }

  const updatedMembers = members.filter((item) => item.id !== id);

  if (!saveMembers(updatedMembers)) return;

  members = updatedMembers;

  renderMembers();

  alert("Data anggota berhasil dihapus!");
}

/* =========================================
   SEARCH MEMBER
========================================= */

const searchMember = document.getElementById("searchMember");

if (searchMember) {
  searchMember.addEventListener("input", renderMembers);
}

/* =========================================
   BOOK OPTIONS FOR LOAN
========================================= */

const loanBook = document.getElementById("loanBook");

function populateLoanBooks() {
  if (!loanBook) return 0;

  const selectedValue = loanBook.value;

  loanBook.replaceChildren();

  const defaultOption = document.createElement("option");

  defaultOption.value = "";
  defaultOption.textContent = "Pilih buku";

  loanBook.appendChild(defaultOption);

  const availableBooks = books.filter(function (book) {
    return Number(book.stock) > 0;
  });

  availableBooks.forEach(function (book) {
    const option = document.createElement("option");

    option.value = book.id;
    option.textContent = `${book.title} - ${book.code} (Stok: ${book.stock})`;

    loanBook.appendChild(option);
  });

  if (availableBooks.some((book) => book.id === selectedValue)) {
    loanBook.value = selectedValue;
  }

  return availableBooks.length;
}

/* =========================================
   LOAN MODAL
========================================= */

const loanModal = document.getElementById("loanModal");
const loanForm = document.getElementById("loanForm");
const addLoanBtn = document.getElementById("addLoanBtn");

const closeLoanModal = document.getElementById("closeLoanModal");
const cancelLoanModal = document.getElementById("cancelLoanModal");

const borrowDate = document.getElementById("borrowDate");
const dueDate = document.getElementById("dueDate");

function openLoanModal() {
  if (!loanForm || !loanModal) return;

  if (members.length === 0) {
    alert("Belum ada anggota terdaftar. Tambahkan anggota terlebih dahulu.");
    return;
  }

  const availableCount = populateLoanBooks();

  if (availableCount === 0) {
    alert(
      "Belum ada buku dengan stok tersedia. Tambahkan stok buku terlebih dahulu.",
    );
    return;
  }

  populateLoanMembers();
  loanForm.reset();

  const currentDay = new Date();
  const nextWeek = new Date();

  nextWeek.setDate(nextWeek.getDate() + 7);

  if (borrowDate) {
    borrowDate.value = getLocalDateString(currentDay);
    borrowDate.min = getLocalDateString(currentDay);
  }

  if (dueDate) {
    dueDate.value = getLocalDateString(nextWeek);
    dueDate.min = borrowDate ? borrowDate.value : "";
  }

  loanModal.classList.add("show");

  if (loanMember) loanMember.focus();
}

function hideLoanModal() {
  if (loanModal) loanModal.classList.remove("show");
}

if (addLoanBtn) {
  addLoanBtn.addEventListener("click", openLoanModal);
}

if (closeLoanModal) {
  closeLoanModal.addEventListener("click", hideLoanModal);
}

if (cancelLoanModal) {
  cancelLoanModal.addEventListener("click", hideLoanModal);
}

if (loanModal) {
  loanModal.addEventListener("click", function (e) {
    if (e.target === loanModal) hideLoanModal();
  });
}

/* =========================================
   DATE VALIDATION
========================================= */

if (borrowDate && dueDate) {
  borrowDate.addEventListener("change", function () {
    dueDate.min = borrowDate.value;

    if (dueDate.value < borrowDate.value) {
      dueDate.value = borrowDate.value;
    }
  });
}

/* =========================================
   ADD LOAN TRANSACTION
========================================= */

if (loanForm) {
  loanForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const selectedMemberId = loanMember ? loanMember.value : "";

    const selectedMember = members.find(function (member) {
      return member.id === selectedMemberId;
    });

    const selectedBookId = loanBook ? loanBook.value : "";
    const selectedBorrowDate = borrowDate ? borrowDate.value : "";
    const selectedDueDate = dueDate ? dueDate.value : "";

    if (
      !selectedMember ||
      !selectedBookId ||
      !selectedBorrowDate ||
      !selectedDueDate
    ) {
      alert("Mohon lengkapi seluruh data peminjaman.");
      return;
    }

    if (selectedDueDate < selectedBorrowDate) {
      alert("Tanggal pengembalian tidak boleh lebih awal dari tanggal pinjam.");
      return;
    }

    const selectedBook = books.find(function (book) {
      return book.id === selectedBookId;
    });

    if (!selectedBook || Number(selectedBook.stock) < 1) {
      alert("Stok buku tidak tersedia.");
      return;
    }

    const newLoan = {
      id: generateId(),
      memberId: selectedMember.id,
      memberCode: selectedMember.code,
      memberName: selectedMember.fullName,
      bookId: selectedBook.id,
      bookCode: selectedBook.code,
      bookTitle: selectedBook.title,
      borrowDate: selectedBorrowDate,
      dueDate: selectedDueDate,
      status: "borrowed",
    };

    const updatedBooks = books.map(function (book) {
      return book.id === selectedBookId
        ? { ...book, stock: Number(book.stock) - 1 }
        : book;
    });

    const updatedLoans = [...loans, newLoan];

    if (!saveBooks(updatedBooks)) return;

    if (!saveLoans(updatedLoans)) {
      saveBooks(books);
      return;
    }

    books = updatedBooks;
    loans = updatedLoans;

    renderBooks();
    renderLoans();
    renderReturns();
    renderHistory();
    renderReports();

    hideLoanModal();
    loanForm.reset();

    alert("Transaksi peminjaman berhasil ditambahkan!");
  });
}

/* =========================================
   RENDER LOAN TABLE
========================================= */

function renderLoans() {
  const tableBody = document.getElementById("loanTableBody");
  const searchInput = document.getElementById("searchLoan");

  const totalActiveLoans = document.getElementById("totalActiveLoans");
  const totalLoanTransactions = document.getElementById(
    "totalLoanTransactions",
  );

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredLoans = loans.filter(function (loan) {
    return (
      String(loan.memberName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(loan.bookTitle || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const activeLoans = loans.filter((loan) => loan.status === "borrowed");

  if (totalActiveLoans) {
    totalActiveLoans.textContent = activeLoans.length;
  }

  if (totalLoanTransactions) {
    totalLoanTransactions.textContent = loans.length;
  }

  if (!tableBody) return;

  tableBody.replaceChildren();

  if (filteredLoans.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(
      row,
      keyword
        ? "Data peminjaman tidak ditemukan."
        : "Belum ada transaksi peminjaman.",
    );

    cell.colSpan = 6;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredLoans.forEach(function (loan, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      loan.memberName,
      loan.bookTitle,
      formatLoanDate(loan.borrowDate),
      formatLoanDate(loan.dueDate),
    ].forEach((value) => createCell(row, value));

    const statusCell = document.createElement("td");

    statusCell.appendChild(createStatusBadge(loan.status));

    row.appendChild(statusCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   SEARCH LOAN
========================================= */

const searchLoan = document.getElementById("searchLoan");

if (searchLoan) {
  searchLoan.addEventListener("input", renderLoans);
}

/* =========================================
   RETURN TABLE
========================================= */

function renderReturns() {
  const tableBody = document.getElementById("returnTableBody");
  const searchInput = document.getElementById("searchReturn");

  const pendingReturns = document.getElementById("pendingReturns");
  const completedReturns = document.getElementById("completedReturns");

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredLoans = loans.filter(function (loan) {
    return (
      String(loan.memberName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(loan.bookTitle || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const activeLoans = loans.filter((loan) => loan.status === "borrowed");

  const returnedLoans = loans.filter((loan) => loan.status === "returned");

  if (pendingReturns) pendingReturns.textContent = activeLoans.length;
  if (completedReturns) completedReturns.textContent = returnedLoans.length;

  if (!tableBody) return;

  tableBody.replaceChildren();

  if (filteredLoans.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(
      row,
      keyword
        ? "Data pengembalian tidak ditemukan."
        : "Belum ada transaksi pengembalian.",
    );

    cell.colSpan = 7;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredLoans.forEach(function (loan, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      loan.memberName,
      loan.bookTitle,
      formatLoanDate(loan.borrowDate),
      formatLoanDate(loan.dueDate),
    ].forEach((value) => createCell(row, value));

    const statusCell = document.createElement("td");

    const badge = document.createElement("span");

    badge.className =
      loan.status === "returned" ? "status returned" : "status borrowed";

    badge.textContent =
      loan.status === "returned" ? "Dikembalikan" : "Belum Kembali";

    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");

    if (loan.status === "borrowed") {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "btn-primary";
      button.textContent = "Kembalikan";

      button.addEventListener("click", function () {
        returnBook(loan.id);
      });

      actionCell.appendChild(button);
    } else {
      const text = document.createElement("span");

      text.className = "status returned";
      text.textContent = "Selesai";

      actionCell.appendChild(text);
    }

    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   HISTORY TRANSACTION
========================================= */

function renderHistory() {
  const tableBody = document.getElementById("historyTableBody");
  const searchInput = document.getElementById("searchHistory");

  const historyTotal = document.getElementById("historyTotal");
  const historyBorrowed = document.getElementById("historyBorrowed");
  const historyReturned = document.getElementById("historyReturned");

  const activeLoans = loans.filter((loan) => loan.status === "borrowed");

  const returnedLoans = loans.filter((loan) => loan.status === "returned");

  if (historyTotal) {
    historyTotal.textContent = loans.length;
  }

  if (historyBorrowed) {
    historyBorrowed.textContent = activeLoans.length;
  }

  if (historyReturned) {
    historyReturned.textContent = returnedLoans.length;
  }

  if (!tableBody) return;

  const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";

  const filteredLoans = loans.filter(function (loan) {
    return (
      String(loan.memberName || "")
        .toLowerCase()
        .includes(keyword) ||
      String(loan.memberCode || "")
        .toLowerCase()
        .includes(keyword) ||
      String(loan.bookTitle || "")
        .toLowerCase()
        .includes(keyword) ||
      String(loan.bookCode || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  filteredLoans.sort(function (a, b) {
    const dateA = a.borrowDate || "";
    const dateB = b.borrowDate || "";

    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }

    return String(b.id).localeCompare(String(a.id));
  });

  tableBody.replaceChildren();

  if (filteredLoans.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(
      row,
      keyword
        ? "Riwayat transaksi tidak ditemukan."
        : "Belum ada riwayat transaksi.",
    );

    cell.colSpan = 7;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredLoans.forEach(function (loan, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      loan.memberName,
      loan.bookTitle,
      formatLoanDate(loan.borrowDate),
      formatLoanDate(loan.dueDate),
      loan.status === "returned" ? formatLoanDate(loan.returnDate) : "-",
    ].forEach(function (value) {
      createCell(row, value);
    });

    const statusCell = document.createElement("td");

    statusCell.appendChild(createStatusBadge(loan.status));

    row.appendChild(statusCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   SEARCH HISTORY
========================================= */

const searchHistory = document.getElementById("searchHistory");

if (searchHistory) {
  searchHistory.addEventListener("input", renderHistory);
}

/* =========================================
   REPORTS - LAPORAN PERPUSTAKAAN
========================================= */

let reportFilters = {
  startDate: "",
  endDate: "",
  status: "all",
};

function getFilteredReportLoans() {
  return loans
    .filter(function (loan) {
      const matchesStart =
        !reportFilters.startDate ||
        String(loan.borrowDate || "") >= reportFilters.startDate;

      const matchesEnd =
        !reportFilters.endDate ||
        String(loan.borrowDate || "") <= reportFilters.endDate;

      const matchesStatus =
        reportFilters.status === "all" || loan.status === reportFilters.status;

      return matchesStart && matchesEnd && matchesStatus;
    })
    .sort(function (a, b) {
      return String(b.borrowDate || "").localeCompare(
        String(a.borrowDate || ""),
      );
    });
}

function renderReports() {
  const tableBody = document.getElementById("reportTableBody");

  const reportTotal = document.getElementById("reportTotal");
  const reportBorrowed = document.getElementById("reportBorrowed");
  const reportReturned = document.getElementById("reportReturned");
  const reportDescription = document.getElementById("reportDescription");

  if (!tableBody) return;

  const filteredLoans = getFilteredReportLoans();

  const activeLoans = filteredLoans.filter(
    (loan) => loan.status === "borrowed",
  );

  const returnedLoans = filteredLoans.filter(
    (loan) => loan.status === "returned",
  );

  if (reportTotal) reportTotal.textContent = filteredLoans.length;
  if (reportBorrowed) reportBorrowed.textContent = activeLoans.length;
  if (reportReturned) reportReturned.textContent = returnedLoans.length;

  if (reportDescription) {
    const startText = reportFilters.startDate
      ? formatLoanDate(reportFilters.startDate)
      : "Awal";

    const endText = reportFilters.endDate
      ? formatLoanDate(reportFilters.endDate)
      : "Sekarang";

    const statusText = {
      all: "Semua Status",
      borrowed: "Dipinjam",
      returned: "Dikembalikan",
    };

    reportDescription.textContent = `Periode ${startText} – ${endText} | ${statusText[reportFilters.status]}`;
  }

  tableBody.replaceChildren();

  if (filteredLoans.length === 0) {
    const row = document.createElement("tr");

    const cell = createCell(row, "Tidak ada transaksi pada filter ini.");

    cell.colSpan = 7;
    cell.className = "empty-data";

    tableBody.appendChild(row);
    return;
  }

  filteredLoans.forEach(function (loan, index) {
    const row = document.createElement("tr");

    [
      index + 1,
      loan.memberName,
      loan.bookTitle,
      formatLoanDate(loan.borrowDate),
      formatLoanDate(loan.dueDate),
      loan.status === "returned" ? formatLoanDate(loan.returnDate) : "-",
    ].forEach(function (value) {
      createCell(row, value);
    });

    const statusCell = document.createElement("td");
    statusCell.appendChild(createStatusBadge(loan.status));

    row.appendChild(statusCell);
    tableBody.appendChild(row);
  });
}

/* =========================================
   FILTER REPORT
========================================= */

const reportStartDate = document.getElementById("reportStartDate");
const reportEndDate = document.getElementById("reportEndDate");
const reportStatus = document.getElementById("reportStatus");

const filterReportBtn = document.getElementById("filterReportBtn");
const resetReportBtn = document.getElementById("resetReportBtn");

if (filterReportBtn) {
  filterReportBtn.addEventListener("click", function () {
    const startDate = reportStartDate ? reportStartDate.value : "";
    const endDate = reportEndDate ? reportEndDate.value : "";
    const status = reportStatus ? reportStatus.value : "all";

    if (startDate && endDate && startDate > endDate) {
      alert("Tanggal awal tidak boleh melebihi tanggal akhir.");
      return;
    }

    reportFilters = {
      startDate,
      endDate,
      status,
    };

    renderReports();
  });
}

if (resetReportBtn) {
  resetReportBtn.addEventListener("click", function () {
    if (reportStartDate) reportStartDate.value = "";
    if (reportEndDate) reportEndDate.value = "";
    if (reportStatus) reportStatus.value = "all";

    reportFilters = {
      startDate: "",
      endDate: "",
      status: "all",
    };

    renderReports();
  });
}

/* =========================================
   EXPORT REPORT TO EXCEL
========================================= */

const exportExcelBtn = document.getElementById("exportExcelBtn");

if (exportExcelBtn) {
  exportExcelBtn.addEventListener("click", function () {
    if (typeof XLSX === "undefined") {
      alert("Library Excel belum berhasil dimuat. Periksa koneksi internet.");
      return;
    }

    const filteredLoans = getFilteredReportLoans();

    if (filteredLoans.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const excelData = filteredLoans.map(function (loan, index) {
      return {
        No: index + 1,
        "Nama Anggota": loan.memberName || "-",
        "Kode Anggota": loan.memberCode || "-",
        "Judul Buku": loan.bookTitle || "-",
        "Kode Buku": loan.bookCode || "-",
        "Tanggal Pinjam": loan.borrowDate || "-",
        "Batas Pengembalian": loan.dueDate || "-",
        "Tanggal Kembali":
          loan.status === "returned" ? loan.returnDate || "-" : "-",
        Status: loan.status === "returned" ? "Dikembalikan" : "Dipinjam",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 16 },
      { wch: 30 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

    const fileName = `Laporan-RakAdmin-${getLocalDateString(new Date())}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  });
}

/* =========================================
   EXPORT REPORT TO PDF
========================================= */

const exportPdfBtn = document.getElementById("exportPdfBtn");

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", function () {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("Library PDF belum berhasil dimuat. Periksa koneksi internet.");
      return;
    }

    const filteredLoans = getFilteredReportLoans();

    if (filteredLoans.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor.");
      return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(18);
    doc.text("LAPORAN PERPUSTAKAAN RAKADMIN", 14, 18);

    doc.setFontSize(10);
    doc.text(
      `Tanggal Cetak: ${formatLoanDate(getLocalDateString(new Date()))}`,
      14,
      26,
    );

    const startText = reportFilters.startDate
      ? formatLoanDate(reportFilters.startDate)
      : "Awal";

    const endText = reportFilters.endDate
      ? formatLoanDate(reportFilters.endDate)
      : "Sekarang";

    const statusText = {
      all: "Semua Status",
      borrowed: "Dipinjam",
      returned: "Dikembalikan",
    };

    doc.text(
      `Periode: ${startText} - ${endText} | Status: ${statusText[reportFilters.status]}`,
      14,
      32,
    );

    doc.autoTable({
      startY: 39,
      head: [
        [
          "No",
          "Nama Anggota",
          "Judul Buku",
          "Tanggal Pinjam",
          "Batas Pengembalian",
          "Tanggal Kembali",
          "Status",
        ],
      ],
      body: filteredLoans.map(function (loan, index) {
        return [
          index + 1,
          loan.memberName || "-",
          loan.bookTitle || "-",
          formatLoanDate(loan.borrowDate),
          formatLoanDate(loan.dueDate),
          loan.status === "returned" ? formatLoanDate(loan.returnDate) : "-",
          loan.status === "returned" ? "Dikembalikan" : "Dipinjam",
        ];
      }),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [35, 125, 82],
      },
    });

    const fileName = `Laporan-RakAdmin-${getLocalDateString(new Date())}.pdf`;

    doc.save(fileName);
  });
}

/* =========================================
   RETURN BOOK TRANSACTION
========================================= */

function returnBook(loanId) {
  const loan = loans.find((item) => item.id === loanId);

  if (!loan) {
    alert("Transaksi peminjaman tidak ditemukan.");
    return;
  }

  if (loan.status === "returned") {
    alert("Buku ini sudah dikembalikan sebelumnya.");
    return;
  }

  if (
    !confirm(
      `Konfirmasi pengembalian buku "${loan.bookTitle}" dari ${loan.memberName}?`,
    )
  ) {
    return;
  }

  const book = books.find((item) => item.id === loan.bookId);

  if (!book) {
    alert("Data buku tidak ditemukan. Stok tidak dapat diperbarui.");
    return;
  }

  const updatedBooks = books.map(function (item) {
    return item.id === loan.bookId
      ? { ...item, stock: Number(item.stock) + 1 }
      : item;
  });

  const updatedLoans = loans.map(function (item) {
    return item.id === loanId
      ? {
          ...item,
          status: "returned",
          returnDate: getLocalDateString(new Date()),
        }
      : item;
  });

  if (!saveBooks(updatedBooks)) return;

  if (!saveLoans(updatedLoans)) {
    saveBooks(books);
    return;
  }

  books = updatedBooks;
  loans = updatedLoans;

  renderBooks();
  renderLoans();
  renderReturns();
  renderHistory();
  renderReports();

  alert("Buku berhasil dikembalikan! Stok buku telah diperbarui.");
}

/* =========================================
   SEARCH RETURN
========================================= */

const searchReturn = document.getElementById("searchReturn");

if (searchReturn) {
  searchReturn.addEventListener("input", renderReturns);
}

/* =========================================
   CLOSE MODALS WITH ESCAPE
========================================= */

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (bookModal && bookModal.classList.contains("show")) {
      hideBookModal();
    }

    if (loanModal && loanModal.classList.contains("show")) {
      hideLoanModal();
    }

    if (memberModal && memberModal.classList.contains("show")) {
      hideMemberModal();
    }
  }
});

/* =========================================
   INITIAL RENDER
========================================= */

updateStatistics();
updateMemberStatistics();

populateLoanBooks();
populateLoanMembers();

renderBooks();
renderLoans();
renderReturns();
renderMembers();
renderHistory();
renderReports();
