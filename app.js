
const $ = id => document.getElementById(id);

const titles = {
  overview: "Bosh sahifa",
  members: "A'zolar",
  tasks: "Vazifalarim",
  activities: "Faoliyat tarixi",
  awards: "Diplom va yutuqlar",
  meetings: "Yig‘ilishlar"
};

let currentPage = "overview";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
}

function showLogin() {
  $("loginView").classList.remove("hidden");
  $("appView").classList.add("hidden");
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function isAdmin() {
  return false;
}

function getRecords(name) {
  return [];
}

async function loadApp() {
  showApp();

  const name = "Demo foydalanuvchi";

  $("sideUser").innerHTML =
    `${name}<small>Demo rejimi</small>`;

  $("avatar").textContent = "D";

  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.add("hidden");
  });

  await openPage("overview");
}

async function openPage(page) {
  if (!titles[page]) return;

  if (["members", "meetings"].includes(page)) {
    toast("Bu bo‘lim demo rejimida yopiq.");
    return;
  }

  currentPage = page;
  $("pageTitle").textContent = titles[page];

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const content = $("content");

  const sections = {
    overview: `
      <div class="welcome">
        <p>13-MAKTAB · KELAJAK KENGASHI</p>
        <h3>Xush kelibsiz!</h3>
        <p class="muted">
          13-Maktab Kelajak Kengashi boshqaruv platformasiga xush kelibsiz.
        </p>
      </div>

      <div class="stats">
        <div class="stat">
          <small>Jami vazifalar</small>
          <strong>0</strong>
        </div>
        <div class="stat">
          <small>Bajarilgan vazifalar</small>
          <strong>0</strong>
        </div>
        <div class="stat">
          <small>Faoliyatlar</small>
          <strong>0</strong>
        </div>
        <div class="stat">
          <small>Hisob turi</small>
          <strong style="font-size:17px">Demo</strong>
        </div>
      </div>

      <div class="grid-two">
        <div class="panel">
          <h3>Oxirgi vazifalar</h3>
          <div class="empty">Hozircha vazifalar yo‘q.</div>
        </div>
        <div class="panel">
          <h3>Oxirgi faoliyatlar</h3>
          <div class="empty">Hozircha faoliyatlar yo‘q.</div>
        </div>
      </div>
    `,

    tasks: `
      <div class="toolbar">
        <h3>Mening vazifalarim</h3>
      </div>
      <div class="empty">Hozircha vazifalar mavjud emas.</div>
    `,

    activities: `
      <div class="toolbar">
        <h3>Faoliyat tarixi</h3>
      </div>
      <div class="empty">Hozircha faoliyatlar mavjud emas.</div>
    `,

    awards: `
      <div class="toolbar">
        <h3>Diplom va yutuqlar</h3>
      </div>
      <div class="empty">Hozircha yutuqlar mavjud emas.</div>
    `
  };

  content.innerHTML = sections[page] || `
    <div class="empty">Bu bo‘lim mavjud emas.</div>
  `;
}

// Demo rejimida parolsiz kirish
$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  await loadApp();
});

// Demo rejimida darhol ilovani ochish
$("loginError").textContent = "";
loadApp();

// Menyu
$("nav").addEventListener("click", e => {
  const btn = e.target.closest("[data-page]");
  if (btn) openPage(btn.dataset.page);
});

// Chiqish
$("logoutBtn").onclick = () => {
  showLogin();
  $("loginForm").reset();
};
