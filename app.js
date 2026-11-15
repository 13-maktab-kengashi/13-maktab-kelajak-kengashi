
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcWZnblOzUyUYbdZGGDWhU7-IAwaJhpbQ",
  authDomain: "maktab-kelajak-kengashi.firebaseapp.com",
  projectId: "maktab-kelajak-kengashi",
  storageBucket: "maktab-kelajak-kengashi.firebasestorage.app",
  messagingSenderId: "395026763457",
  appId: "1:395026763457:web:6bc4a2f6085addf93ace40"
};

// Firebase Authentication'dan olingan ADMIN UID:
const ADMIN_UID = "IyR327ZoxqPUKAGm9qFI6wVEMC12";
const DEMO_MODE = true;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentProfile = null;
let currentPage = "overview";

const $ = id => document.getElementById(id);

const titles = {
  overview: "Bosh sahifa",
  members: "A'zolar",
  tasks: "Vazifalarim",
  activities: "Faoliyat tarixi",
  awards: "Diplom va yutuqlar",
  meetings: "Yig‘ilishlar"
};

function isAdmin() {
  return currentUser?.uid === ADMIN_UID;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function dateText(value) {
  if (!value) return "Sana ko‘rsatilmagan";
  if (value.toDate) return value.toDate().toLocaleDateString("uz-UZ");
  return new Date(value).toLocaleDateString("uz-UZ");
}

async function getProfile(uid) {
  const snap = await getDoc(doc(db, "members", uid));
  return snap.exists() ? snap.data() : null;
}

async function getRecords(name) {
  let q;

  if (isAdmin()) {
    q = query(collection(db, name), orderBy("createdAt", "desc"));
  } else {
    q = query(
      collection(db, name),
      where("ownerUid", "==", currentUser.uid)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

function showLogin() {
  $("loginView").classList.remove("hidden");
  $("appView").classList.add("hidden");
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
}

async function loadApp() {
  showApp();

  const name = currentProfile?.name || currentUser.email;
  $("sideUser").innerHTML =
    `${escapeHTML(name)}<small>${isAdmin() ? "Administrator" : "Kengash a'zosi"}</small>`;

  $("avatar").textContent = name.charAt(0).toUpperCase();

  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !isAdmin());
  });

  await openPage("overview");
}

async function openPage(page) {
  if (!titles[page]) return;

  if (!isAdmin() && ["members", "meetings"].includes(page)) {
    page = "overview";
  }

  currentPage = page;
  $("pageTitle").textContent = titles[page];

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });

  const content = $("content");
  content.innerHTML = '<div class="empty">Ma’lumotlar yuklanmoqda...</div>';

  try {
    if (page === "overview") await renderOverview();
    if (page === "members") await renderMembers();
    if (page === "tasks") await renderTasks();
    if (page === "activities") await renderActivities();
    if (page === "awards") await renderAwards();
    if (page === "meetings") await renderMeetings();
  } catch (error) {
    console.error(error);
    content.innerHTML =
      '<div class="empty">Ma’lumotlarni yuklashda xatolik yuz berdi.</div>';
    toast(error.message);
  }
}

async function renderOverview() {
  const [tasks, activities] = await Promise.all([
    getRecords("tasks"),
    getRecords("activities")
  ]);

  $("content").innerHTML = `
    <div class="welcome">
      <p>13-MAKTAB · KELAJAK KENGASHI</p>
      <h3>Xush kelibsiz, ${escapeHTML(currentProfile?.name || "Foydalanuvchi")}!</h3>
      <p class="muted">Kengash faoliyatini boshqarish va kuzatish platformasi.</p>
    </div>

    <div class="stats">
      <div class="stat"><small>Jami vazifalar</small><strong>${tasks.length}</strong></div>
      <div class="stat"><small>Bajarilgan vazifalar</small><strong>${tasks.filter(x => x.status === "done").length}</strong></div>
      <div class="stat"><small>Faoliyatlar</small><strong>${activities.length}</strong></div>
      <div class="stat"><small>Hisob turi</small><strong style="font-size:17px">${isAdmin() ? "Admin" : "A'zo"}</strong></div>
    </div>

    <div class="grid-two">
      <div class="panel">
        <h3>Oxirgi vazifalar</h3>
        ${tasks.length ? tasks.slice(0, 5).map(x => `
          <div class="list-row">
            <div><b>${escapeHTML(x.title)}</b><small>${dateText(x.createdAt)}</small></div>
            <span class="pill ${x.status === "done" ? "done" : "pending"}">
              ${x.status === "done" ? "Bajarilgan" : "Jarayonda"}
            </span>
          </div>`).join("") : '<div class="empty">Hozircha vazifalar yo‘q.</div>'}
      </div>

      <div class="panel">
        <h3>Oxirgi faoliyatlar</h3>
        ${activities.length ? activities.slice(0, 5).map(x => `
          <div class="list-row">
            <div><b>${escapeHTML(x.title)}</b><small>${dateText(x.date)}</small></div>
          </div>`).join("") : '<div class="empty">Hozircha faoliyatlar yo‘q.</div>'}
      </div>
    </div>
  `;
}

async function renderMembers() {
  if (!isAdmin()) return;

  const snap = await getDocs(collection(db, "members"));
  const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  $("content").innerHTML = `
    <div class="toolbar">
      <h3>Kengash a'zolari</h3>
      <button class="primary" id="addMember">+ A'zo qo‘shish</button>
    </div>

    <div class="cards">
      ${members.map(m => `
        <div class="item-card">
          <h4>${escapeHTML(m.name || "Ismsiz a'zo")}</h4>
          <p>Lavozim: ${escapeHTML(m.role || "A'zo")}</p>
          <p>Sinf: ${escapeHTML(m.className || "—")}</p>
          <p>Email: ${escapeHTML(m.email || "—")}</p>
          <p>UID: ${escapeHTML(m.id)}</p>
        </div>
      `).join("") || '<div class="empty">A'zolar topilmadi.</div>'}
    </div>
  `;

  $("addMember").onclick = () => openForm("member");
}

async function renderTasks() {
  const items = await getRecords("tasks");

  $("content").innerHTML = `
    <div class="toolbar">
      <h3>${isAdmin() ? "Barcha vazifalar" : "Mening vazifalarim"}</h3>
      ${isAdmin() ? '<button class="primary" id="addTask">+ Vazifa berish</button>' : ""}
    </div>

    <div class="cards">
      ${items.map(x => `
        <div class="item-card">
          <h4>${escapeHTML(x.title)}</h4>
          <p>${escapeHTML(x.description || "")}</p>
          <p>Muddat: ${escapeHTML(x.deadline || "Belgilanmagan")}</p>
          <span class="pill ${x.status === "done" ? "done" : "pending"}">
            ${x.status === "done" ? "Bajarilgan" : "Jarayonda"}
          </span>
          ${!isAdmin() && x.status !== "done" ? `
            <div class="item-actions">
              <button class="primary" data-done="${x.id}">Bajarildi</button>
            </div>` : ""}
          ${isAdmin() ? `
            <div class="item-actions">
              <button class="secondary danger" data-delete-task="${x.id}">O‘chirish</button>
            </div>` : ""}
        </div>
      `).join("") || '<div class="empty">Hozircha vazifalar yo‘q.</div>'}
    </div>
  `;

  if (isAdmin()) $("addTask").onclick = () => openForm("task");

  document.querySelectorAll("[data-done]").forEach(btn => {
    btn.onclick = async () => {
      await updateDoc(doc(db, "tasks", btn.dataset.done), { status: "done" });
      toast("Vazifa bajarildi deb belgilandi.");
      openPage("tasks");
    };
  });

  document.querySelectorAll("[data-delete-task]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("Vazifani o‘chirmoqchimisiz?")) return;
      await deleteDoc(doc(db, "tasks", btn.dataset.deleteTask));
      toast("Vazifa o‘chirildi.");
      openPage("tasks");
    };
  });
}

async function renderActivities() {
  const items = await getRecords("activities");

  $("content").innerHTML = `
    <div class="toolbar">
      <h3>Faoliyat tarixi</h3>
      ${isAdmin() ? '<button class="primary" id="addActivity">+ Faoliyat qo‘shish</button>' : ""}
    </div>
    <div class="cards">
      ${items.map(x => `
        <div class="item-card">
          <h4>${escapeHTML(x.title)}</h4>
          <p>${escapeHTML(x.description || "")}</p>
          <p>Sana: ${dateText(x.date)}</p>
        </div>
      `).join("") || '<div class="empty">Hozircha faoliyatlar yo‘q.</div>'}
    </div>
  `;

  if (isAdmin()) $("addActivity").onclick = () => openForm("activity");
}

async function renderAwards() {
  const items = await getRecords("awards");

  $("content").innerHTML = `
    <div class="toolbar">
      <h3>Diplom va yutuqlar</h3>
      ${isAdmin() ? '<button class="primary" id="addAward">+ Yutuq qo‘shish</button>' : ""}
    </div>
    <div class="cards">
      ${items.map(x => `
        <div class="item-card">
          <h4>${escapeHTML(x.title)}</h4>
          <p>${escapeHTML(x.description || "")}</p>
          <p>Sana: ${dateText(x.date)}</p>
        </div>
      `).join("") || '<div class="empty">Hozircha yutuqlar yo‘q.</div>'}
    </div>
  `;

  if (isAdmin()) $("addAward").onclick = () => openForm("award");
}

async function renderMeetings() {
  if (!isAdmin()) return;

  const items = await getRecords("meetings");

  $("content").innerHTML = `
    <div class="toolbar">
      <h3>Yig‘ilishlar</h3>
      <button class="primary" id="addMeeting">+ Yig‘ilish qo‘shish</button>
    </div>
    <div class="cards">
      ${items.map(x => `
        <div class="item-card">
          <h4>${escapeHTML(x.title)}</h4>
          <p>${escapeHTML(x.description || "")}</p>
          <p>Sana: ${dateText(x.date)}</p>
        </div>
      `).join("") || '<div class="empty">Hozircha yig‘ilishlar yo‘q.</div>'}
    </div>
  `;

  $("addMeeting").onclick = () => openForm("meeting");
}

function openForm(type) {
  const forms = {
    member: {
      title: "Yangi a'zo",
      fields: [
        ["name", "Ism va familiya", "text"],
        ["email", "Email", "email"],
        ["role", "Lavozim", "text"],
        ["className", "Sinf", "text"],
        ["uid", "A'zoning Firebase UID raqami", "text"]
      ]
    },
    task: {
      title: "Yangi vazifa",
      fields: [
        ["title", "Vazifa nomi", "text"],
        ["description", "Tavsif", "textarea"],
        ["deadline", "Bajarish muddati", "date"],
        ["ownerUid", "A'zoning Firebase UID raqami", "text"]
      ]
    },
    activity: {
      title: "Yangi faoliyat",
      fields: [
        ["title", "Faoliyat nomi", "text"],
        ["description", "Tavsif", "textarea"],
        ["date", "Sana", "date"],
        ["ownerUid", "A'zoning Firebase UID raqami", "text"]
      ]
    },
    award: {
      title: "Yangi yutuq",
      fields: [
        ["title", "Yutuq nomi", "text"],
        ["description", "Tavsif", "textarea"],
        ["date", "Sana", "date"],
        ["ownerUid", "A'zoning Firebase UID raqami", "text"]
      ]
    },
    meeting: {
      title: "Yangi yig‘ilish",
      fields: [
        ["title", "Yig‘ilish nomi", "text"],
        ["description", "Kun tartibi va izoh", "textarea"],
        ["date", "Sana", "date"]
      ]
    }
  };

  const config = forms[type];
  if (!config) return;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";

  backdrop.innerHTML = `
    <form class="modal" id="dataForm">
      <h3>${config.title}</h3>
      ${config.fields.map(([name, label, inputType]) => `
        <label>${label}
          ${inputType === "textarea"
            ? `<textarea name="${name}" required></textarea>`
            : `<input name="${name}" type="${inputType}" ${name === "description" ? "" : "required"}>`}
        </label>
      `).join("")}
      <div class="modal-actions">
        <button type="button" class="secondary" id="cancelForm">Bekor qilish</button>
        <button type="submit" class="primary">Saqlash</button>
      </div>
    </form>
  `;

  document.body.appendChild(backdrop);

  $("cancelForm").onclick = () => backdrop.remove();

  backdrop.onclick = e => {
    if (e.target === backdrop) backdrop.remove();
  };

  $("dataForm").onsubmit = async e => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target).entries());

    try {
      if (type === "member") {
        const uid = data.uid.trim();
        delete data.uid;
        delete data.email;
        data.ownerUid = uid;
        await updateDoc(doc(db, "members", uid), data);
      } else {
        const ownerUid = isAdmin()
          ? (data.ownerUid || currentUser.uid).trim()
          : currentUser.uid;

        delete data.ownerUid;

        await addDoc(collection(db, type === "task" ? "tasks" :
          type === "activity" ? "activities" :
          type === "award" ? "awards" : "meetings"), {
          ...data,
          ownerUid,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }

      backdrop.remove();
      toast("Ma'lumot saqlandi.");
      await openPage(currentPage);
    } catch (error) {
      console.error(error);
      toast("Xatolik: " + error.message);
    }
  };
}

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginError").textContent = "";

  try {
    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );
  } catch (error) {
    $("loginError").textContent = "Email yoki parol noto‘g‘ri.";
  }
});

$("logoutBtn").onclick = () => signOut(auth);

$("nav").addEventListener("click", e => {
  const btn = e.target.closest("[data-page]");
  if (btn) openPage(btn.dataset.page);
});

onAuthStateChanged(auth, async user => {
  currentUser = user;

  if (!user) {
    currentProfile = null;
    showLogin();
    return;
  }

  try {
    if (user.uid !== ADMIN_UID) {
      currentProfile = await getProfile(user.uid);

      if (!currentProfile) {
        await signOut(auth);
        $("loginError").textContent =
          "Hisobingizga a'zo profili biriktirilmagan. Administratorga murojaat qiling.";
        return;
      }
    } else {
      currentProfile = await getProfile(user.uid);
      if (!currentProfile) {
        currentProfile = {
          name: user.email,
          role: "admin"
        };
      }
    }

    await loadApp();
  } catch (error) {
    console.error(error);
    toast("Profilni yuklashda xatolik: " + error.message);
  }
});
