/* ===============================
   Firebase 初期化（v8 CDN）
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  databaseURL: "https://train-system-9622f-default-rtdb.firebaseio.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.appspot.com",
  messagingSenderId: "1066598708695",
  appId: "1:1066598708695:web:e682df702e58caaaedc792",
  measurementId: "G-CKP4Z2F65W"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ===============================
   定数・データ
================================ */
const ADMIN_PASSWORD = "0829";

const ALL_STATIONS = [
  // 本線
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子",
  // 相模原線
  "京王多摩川","京王稲田堤","京王よみうりランド","稲城","若葉台",
  "京王永山","京王多摩センター","京王堀之内","南大沢","多摩境","橋本",
  // 高尾線
  "京王片倉","山田","めじろ台","狭間","高尾","高尾山口"
];

const DEST_UP = [
  "高幡不動","北野","調布","つつじヶ丘",
  "桜上水","新宿","本八幡","若葉台"
];
const DEST_DOWN = [
  "桜上水","つつじヶ丘","高幡不動","高尾山口",
  "京王八王子","若葉台","京王多摩センター","橋本"
];

let trains = {};
let currentDirection = "up";

/* ===============================
   共通関数
================================ */
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getPlatforms(station, direction) {
  const specialA = [
    "笹塚","桜上水","つつじヶ丘","調布",
    "府中","北野","若葉台","京王多摩センター"
  ];
  if (specialA.includes(station)) {
    return direction === "up" ? [3,4] : [1,2];
  }
  if (station === "高幡不動") {
    return direction === "up" ? [4,5] : [2,3];
  }
  if (station === "東府中") {
    return direction === "up" ? [4] : [2,3];
  }
  if (station === "新宿") {
    return [1,2,3,4];
  }
  if (["京王八王子","高尾山口","橋本"].includes(station)) {
    return [1,2];
  }
  return direction === "up" ? [2] : [1];
}

/* ===============================
   列車一覧
================================ */
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

/* ===============================
   列車詳細
================================ */
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
  (t.timetable || []).forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arr ?? "-"}</td>
      <td>${s.dep ?? "-"}</td>
      <td>${s.platform ?? "-"}</td>
    `;
    body.appendChild(tr);
  });
}

/* ===============================
   各駅時刻表
================================ */
function initStationSelect() {
  const sel = document.getElementById("stationSelect");
  sel.innerHTML = "";
  ALL_STATIONS.forEach(st => {
    const opt = document.createElement("option");
    opt.value = opt.textContent = st;
    sel.appendChild(opt);
  });
  renderStationTable();
}

function renderStationTable() {
  const station = document.getElementById("stationSelect").value;
  const body = document.getElementById("stationTableBody");
  body.innerHTML = "";

  Object.values(trains).forEach(t => {
    (t.timetable || []).forEach(s => {
      if (s.station === station) {
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

/* ===============================
   現在位置ロジック
================================ */
function getCurrentPositions(nowMinutes) {
  const result = [];

  Object.values(trains).forEach(t => {
    const tt = t.timetable || [];
    for (let i = 0; i < tt.length; i++) {
      const s = tt[i];
      const arr = timeToMinutes(s.arr);
      const dep = timeToMinutes(s.dep);

      if (arr === null && dep === null) continue;

      // 駅にいる
      if ((arr && nowMinutes === arr) || (dep && nowMinutes === dep) ||
          (arr && dep && nowMinutes > arr && nowMinutes < dep)) {
        result.push({
          station: s.station,
          platform: s.platform,
          trainNumber: t.trainNumber,
          type: t.type,
          destination: t.destination
        });
        return;
      }

      // 区間走行（今回は番線なし・無視してもOK）
      if (dep && i + 1 < tt.length) {
        const next = tt[i + 1];
        const nextArr = timeToMinutes(next.arr);
        if (nextArr && nowMinutes > dep && nowMinutes < nextArr) {
          result.push({
            station: s.station, // 手前駅として扱う
            platform: s.platform,
            trainNumber: t.trainNumber,
            type: t.type,
            destination: t.destination
          });
          return;
        }
      }
    }
  });

  return result;
}

/* ===============================
   現在位置描画（駅＋番線枠）
================================ */
function makeTrainIcon(info) {
  const div = document.createElement("div");
  div.className = "train-car";

  if (info.type.includes("各停")) div.classList.add("train-local");
  if (info.type.includes("快速")) div.classList.add("train-rapid");
  if (info.type.includes("区急")) div.classList.add("train-semi-express");
  if (info.type.includes("急行")) div.classList.add("train-express");
  if (info.type.includes("特急")) div.classList.add("train-limited");

  div.innerHTML = `
    <div class="train-num">${info.trainNumber}</div>
    <div class="dest">${info.destination} 行</div>
  `;
  return div;
}

function renderPosition() {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const pos = getCurrentPositions(nowMin);

  const left = document.getElementById("positionStationList");
  const right = document.getElementById("positionTrainList");
  left.innerHTML = "";
  right.innerHTML = "";

  ALL_STATIONS.forEach(st => {
    // 左：駅名
    const stDiv = document.createElement("div");
    stDiv.className = "station-node";
    stDiv.textContent = st;
    left.appendChild(stDiv);

    const line = document.createElement("div");
    line.className = "line";
    left.appendChild(line);

    // 右：番線枠
    const container = document.createElement("div");
    container.className = "platform-container";

    const platforms = getPlatforms(st, currentDirection);
    platforms.forEach(p => {
      const box = document.createElement("div");
      box.className = "platform-box";
      box.innerHTML = `<div class="platform-label">${p}番線</div>`;

      pos
        .filter(x => x.station === st && String(x.platform) === String(p))
        .forEach(info => {
          box.appendChild(makeTrainIcon(info));
        });

      container.appendChild(box);
    });

    right.appendChild(container);
    right.appendChild(document.createElement("div"));
  });
}

/* ===============================
   時刻表編集 UI
================================ */
function buildTimetableEditor() {
  const container = document.getElementById("timetableEditor");
  container.innerHTML = "";

  ALL_STATIONS.forEach(st => {
    const row = document.createElement("div");
    row.className = "tt-row";

    const platforms = getPlatforms(st, "up"); // 編集時は上り基準で候補表示

    row.innerHTML = `
      <span class="tt-station">${st}</span>
      <input class="tt-arr" type="time">
      <input class="tt-dep" type="time">
      <select class="tt-platform">
        <option value="">-</option>
        ${platforms.map(p => `<option value="${p}">${p}番線</option>`).join("")}
      </select>
      <label><input type="checkbox" class="tt-pass"> 通過</label>
    `;

    container.appendChild(row);
  });
}

/* ===============================
   管理者モード
================================ */
function loginAdmin() {
  const pw = document.getElementById("adminPassword").value;
  const area = document.getElementById("adminArea");
  const status = document.getElementById("loginStatus");

  if (pw === ADMIN_PASSWORD) {
    area.classList.remove("hidden");
    status.textContent = "ログイン成功";
    buildTimetableEditor();
  } else {
    area.classList.add("hidden");
    status.textContent = "パスワードが違います";
  }
}

function getAdminForm() {
  return {
    trainNumber: document.getElementById("admTrainNumber").value,
    type: document.getElementById("admType").value,
    origin: document.getElementById("admOrigin").value,
    departure: document.getElementById("admDeparture").value,
    destination: document.getElementById("admDestination").value,
    arrival: document.getElementById("admArrival").value
  };
}

function readTimetableFromEditor() {
  const rows = document.querySelectorAll(".tt-row");
  const timetable = [];

  rows.forEach(row => {
    const station = row.querySelector(".tt-station").textContent;
    const arr = row.querySelector(".tt-arr").value;
    const dep = row.querySelector(".tt-dep").value;
    const platform = row.querySelector(".tt-platform").value;
    const pass = row.querySelector(".tt-pass").checked;

    timetable.push({
      station,
      arr: pass ? null : arr,
      dep: pass ? null : dep,
      platform: pass ? null : (platform || null),
      pass
    });
  });

  return timetable;
}

function addTrain() {
  const t = getAdminForm();
  const timetable = readTimetableFromEditor();
  t.timetable = timetable;
  trains[t.trainNumber] = t;
  renderTrainList();
  alert("列車を追加しました");
}

function updateTrain() {
  const t = getAdminForm();
  if (!trains[t.trainNumber]) return;
  t.timetable = readTimetableFromEditor();
  trains[t.trainNumber] = t;
  renderTrainList();
  alert("列車を編集しました");
}

function deleteTrain() {
  const num = document.getElementById("admTrainNumber").value;
  if (!num) return;
  delete trains[num];
  renderTrainList();
  alert("列車を削除しました");
}

document.getElementById("btnSaveTimetable").onclick = () => {
  const num = document.getElementById("admTrainNumber").value;
  if (!num || !trains[num]) {
    alert("先に列車番号を追加または選択してください");
    return;
  }
  trains[num].timetable = readTimetableFromEditor();
  alert("時刻表を保存しました");
};

/* ===============================
   Firebase 保存・受信
================================ */
function saveCloud() {
  db.ref("trains").set(trains)
    .then(() => alert("クラウドに保存しました"));
}

function loadCloud() {
  db.ref("trains").once("value").then(snap => {
    trains = snap.val() || {};
    renderTrainList();
    initStationSelect();
    renderPosition();
  });
}

/* ===============================
   ページ切り替え
================================ */
function showPage(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* ===============================
   初期化
================================ */
window.onload = () => {
  document.getElementById("searchInput").oninput = renderTrainList;

  document.getElementById("dirUp").onclick = () => {
    currentDirection = "up";
    document.getElementById("dirUp").classList.add("active");
    document.getElementById("dirDown").classList.remove("active");
    renderStationTable();
    renderPosition();
  };
  document.getElementById("dirDown").onclick = () => {
    currentDirection = "down";
    document.getElementById("dirDown").classList.add("active");
    document.getElementById("dirUp").classList.remove("active");
    renderStationTable();
    renderPosition();
  };

  document.getElementById("posUp").onclick = () => {
    currentDirection = "up";
    document.getElementById("posUp").classList.add("active");
    document.getElementById("posDown").classList.remove("active");
    renderPosition();
  };
  document.getElementById("posDown").onclick = () => {
    currentDirection = "down";
    document.getElementById("posDown").classList.add("active");
    document.getElementById("posUp").classList.remove("active");
    renderPosition();
  };

  document.getElementById("stationSelect").onchange = renderStationTable;

  document.getElementById("btnLogin").onclick = loginAdmin;
  document.getElementById("btnAddTrain").onclick = addTrain;
  document.getElementById("btnUpdateTrain").onclick = updateTrain;
  document.getElementById("btnDeleteTrain").onclick = deleteTrain;

  document.getElementById("btnSaveCloud").onclick = saveCloud;
  document.getElementById("btnLoadCloud").onclick = loadCloud;

  loadCloud();
};

