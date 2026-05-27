/* ===============================
   列車管理システム app.js 完全版
   =============================== */

/* -------------------------------
   Firebase 初期化
-------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  databaseURL: "https://train-system-9622f-default-rtdb.firebaseio.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.firebasestorage.app",
  messagingSenderId: "1066598708695",
  appId: "1:1066598708695:web:e682df702e58caaaedc792",
  measurementId: "G-CKP4Z2F65W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* -------------------------------
   データ
-------------------------------- */
let trains = {};
const ADMIN_PASSWORD = "0829";

/* -------------------------------
   時刻 → 分
-------------------------------- */
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/* -------------------------------
   ページ切り替え
-------------------------------- */
function showPage(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* -------------------------------
   列車一覧
-------------------------------- */
function renderTrainList() {
  const body = document.getElementById("trainListBody");
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  body.innerHTML = "";

  Object.values(trains)
    .sort((a, b) => a.trainNumber.localeCompare(b.trainNumber, "ja"))
    .forEach(t => {
      const text = `${t.trainNumber} ${t.type} ${t.destination} ${t.origin}`.toLowerCase();
      if (keyword && !text.includes(keyword)) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.trainNumber}</td>
        <td>${t.type}</td>
        <td>${t.destination}</td>
        <td>${t.origin}</td>
        <td>${t.departure}</td>
        <td>${t.destination}</td>
        <td>${t.arrival}</td>
      `;
      tr.onclick = () => openDetail(t.trainNumber);
      body.appendChild(tr);
    });
}

/* -------------------------------
   列車詳細
-------------------------------- */
function openDetail(num) {
  const t = trains[num];
  if (!t) return;

  showPage("page-detail");

  document.getElementById("detailCard").innerHTML = `
    <h3>${t.trainNumber}（${t.type}）</h3>
    <div>${t.origin} → ${t.destination}</div>
    <div>始発 ${t.origin} ${t.departure} ／ 終着 ${t.destination} ${t.arrival}</div>
  `;

  const body = document.getElementById("detailTimetableBody");
  body.innerHTML = "";
  t.timetable.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arr ?? "-"}</td>
      <td>${s.dep ?? "-"}</td>
      <td>${s.track ?? "-"}</td>
    `;
    body.appendChild(tr);
  });
}

/* -------------------------------
   各駅時刻表
-------------------------------- */
function initStationSelect() {
  const set = new Set();
  Object.values(trains).forEach(t =>
    t.timetable.forEach(s => set.add(s.station))
  );

  const sel = document.getElementById("stationSelect");
  sel.innerHTML = "";
  [...set].sort().forEach(st => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = st;
    sel.appendChild(opt);
  });

  renderStationTable();
}

let currentDirection = "up";

function renderStationTable() {
  const station = document.getElementById("stationSelect").value;
  const body = document.getElementById("stationTableBody");
  body.innerHTML = "";

  Object.values(trains).forEach(t => {
    t.timetable.forEach(s => {
      if (s.station === station && s.direction === currentDirection) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.trainNumber}</td>
          <td>${t.type}</td>
          <td>${t.destination}</td>
          <td>${s.arr ?? "-"}</td>
          <td>${s.dep ?? "-"}</td>
        `;
        tr.onclick = () => openDetail(t.trainNumber);
        body.appendChild(tr);
      }
    });
  });
}

/* -------------------------------
   現在位置ロジック
-------------------------------- */
function getCurrentPositions(nowMinutes) {
  const map = new Map();

  Object.values(trains).forEach(t => {
    const tt = t.timetable;
    const dep0 = timeToMinutes(t.departure);
    const arrLast = timeToMinutes(t.arrival);

    if (nowMinutes < dep0 || nowMinutes > arrLast) return;

    for (let i = 0; i < tt.length; i++) {
      const s = tt[i];
      const arr = timeToMinutes(s.arr);
      const dep = timeToMinutes(s.dep);

      if (arr === nowMinutes || dep === nowMinutes) {
        const key = `station:${s.station}`;
        if (!map.has(key)) map.set(key, { label: s.station, trains: [] });
        map.get(key).trains.push(t.trainNumber);
        return;
      }

      if (dep !== null && i + 1 < tt.length) {
        const next = tt[i + 1];
        const nextArr = timeToMinutes(next.arr);
        if (nowMinutes > dep && nowMinutes < nextArr) {
          const label = `${s.station}〜${next.station}`;
          const key = `segment:${label}`;
          if (!map.has(key)) map.set(key, { label, trains: [] });
          map.get(key).trains.push(t.trainNumber);
          return;
        }
      }
    }
  });

  return [...map.values()];
}

/* -------------------------------
   現在位置描画
-------------------------------- */
function renderPosition() {
  const val = document.getElementById("nowTimeInput").value;
  if (!val) return;

  const nowMin = timeToMinutes(val);
  const pos = getCurrentPositions(nowMin);

  const left = document.getElementById("positionStationList");
  const right = document.getElementById("positionTrainList");
  left.innerHTML = "";
  right.innerHTML = "";

  pos.sort((a, b) => a.label.localeCompare(b.label, "ja"));

  pos.forEach(p => {
    const st = document.createElement("div");
    st.className = "station-node";
    st.textContent = `● ${p.label}`;
    st.onclick = () => openStationTimetable(p.label);
    left.appendChild(st);

    const line = document.createElement("div");
    line.className = "line";
    left.appendChild(line);

    const tr = document.createElement("div");
    tr.className = "train-node";
    p.trains.forEach(num => {
      const chip = document.createElement("span");
      chip.className = "train-chip";
      chip.textContent = num;
      chip.onclick = () => openDetail(num);
      tr.appendChild(chip);
    });
    right.appendChild(tr);
    right.appendChild(document.createElement("div"));
  });
}

/* -------------------------------
   駅タップ → 時刻表
-------------------------------- */
function openStationTimetable(station) {
  showPage("page-stations");
  document.getElementById("stationSelect").value = station;
  renderStationTable();
}

/* -------------------------------
   管理者モード
-------------------------------- */
function loginAdmin() {
  const pw = document.getElementById("adminPassword").value;
  const area = document.getElementById("adminArea");
  const status = document.getElementById("loginStatus");

  if (pw === ADMIN_PASSWORD) {
    area.classList.remove("hidden");
    status.textContent = "ログイン成功";
  } else {
    area.classList.add("hidden");
    status.textContent = "パスワードが違います";
  }
}

/* -------------------------------
   列車追加・編集・削除
-------------------------------- */
function getAdminForm() {
  return {
    trainNumber: document.getElementById("admTrainNumber").value,
    type: document.getElementById("admType").value,
    origin: document.getElementById("admOrigin").value,
    departure: document.getElementById("admDeparture").value,
    destination: document.getElementById("admDestination").value,
    arrival: document.getElementById("admArrival").value,
    timetable: []
  };
}

function addTrain() {
  const t = getAdminForm();
  trains[t.trainNumber] = t;
  renderTrainList();
  initStationSelect();
}

function updateTrain() {
  const t = getAdminForm();
  if (trains[t.trainNumber]) {
    t.timetable = trains[t.trainNumber].timetable;
    trains[t.trainNumber] = t;
    renderTrainList();
    initStationSelect();
  }
}

function deleteTrain() {
  const num = document.getElementById("admTrainNumber").value;
  delete trains[num];
  renderTrainList();
  initStationSelect();
}

/* -------------------------------
   Firebase 保存・受信
-------------------------------- */
function saveCloud() {
  db.ref("trains").set(trains)
    .then(() => alert("クラウドに保存しました"));
}

function loadCloud() {
  db.ref("trains").once("value").then(snap => {
    trains = snap.val() || {};
    renderTrainList();
    initStationSelect();
    alert("クラウドから読み込みました");
  });
}

/* -------------------------------
   初期化
-------------------------------- */
window.onload = () => {
  document.getElementById("searchInput").oninput = renderTrainList;

  document.getElementById("dirUp").onclick = () => {
    currentDirection = "up";
    renderStationTable();
  };
  document.getElementById("dirDown").onclick = () => {
    currentDirection = "down";
    renderStationTable();
  };

  document.getElementById("nowTimeSetBtn").onclick = () => {
    const now = new Date();
    document.getElementById("nowTimeInput").value =
      `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    renderPosition();
  };
  document.getElementById("nowTimeInput").onchange = renderPosition;

  document.getElementById("btnLogin").onclick = loginAdmin;
  document.getElementById("btnAddTrain").onclick = addTrain;
  document.getElementById("btnUpdateTrain").onclick = updateTrain;
  document.getElementById("btnDeleteTrain").onclick = deleteTrain;

  document.getElementById("btnSaveCloud").onclick = saveCloud;
  document.getElementById("btnLoadCloud").onclick = loadCloud;

  loadCloud();
};

