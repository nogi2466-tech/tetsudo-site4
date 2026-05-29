/* ===============================
   Firebase 初期化
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
   駅リスト（分岐構造）
================================ */
const MAIN = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];

const SAGAMI = [
  "調布","京王多摩川","京王稲田堤","京王よみうりランド","稲城","若葉台",
  "京王永山","京王多摩センター","京王堀之内","南大沢","多摩境","橋本"
];

const TAKAO = [
  "北野","京王片倉","山田","めじろ台","狭間","高尾","高尾山口"
];

const ALL_STATIONS = [
  ...MAIN,
  ...SAGAMI.filter(s => !MAIN.includes(s)),
  ...TAKAO.filter(s => !MAIN.includes(s))
];

let trains = {};
let currentDirection = "up";

/* ===============================
   時刻 → ミリ秒
================================ */
function timeToMs(t) {
  if (!t) return null;
  return new Date(`2000-01-01T${t}:00`).getTime();
}

/* ===============================
   現在位置：位置計算
================================ */
function getCurrentPositions(nowMs) {
  const result = [];

  Object.values(trains).forEach(t => {
    const tt = t.timetable || [];

    for (let i = 0; i < tt.length; i++) {
      const s = tt[i];
      const arrMs = timeToMs(s.arr);
      const depMs = timeToMs(s.dep);

      // 停車中
      if (arrMs && depMs && nowMs >= arrMs && nowMs < depMs) {
        result.push({
          station: s.station,
          platform: s.platform,
          between: false,
          trainNumber: t.trainNumber,
          type: t.type,
          destination: t.destination
        });
        return;
      }

      // 駅間走行
      if (depMs && i + 1 < tt.length) {
        const nextArrMs = timeToMs(tt[i + 1].arr);
        if (nextArrMs && nowMs > depMs && nowMs < nextArrMs) {
          result.push({
            station: s.station,
            nextStation: tt[i + 1].station,
            between: true,
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
   列車アイコン（えれサイト風）
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

  div.onclick = (e) => {
    e.stopPropagation();
    openDetail(info.trainNumber);
  };

  return div;
}

/* ===============================
   レーン描画（本線・相模原線・高尾線）
================================ */
function renderLane(containerId, stationList, pos) {
  const lane = document.getElementById(containerId);
  lane.innerHTML = "";

  let list = [...stationList];

  if (currentDirection === "down") list.reverse();

  list.forEach(st => {
    const row = document.createElement("div");
    row.className = "position-row";

    const stDiv = document.createElement("div");
    stDiv.className = "station-node";
    stDiv.textContent = st;
    stDiv.onclick = () => {
      document.getElementById("stationSelect").value = st;
      showPage("page-stations");
      renderStationTable();
    };

    const line = document.createElement("div");
    line.className = "line";

    const platformsDiv = document.createElement("div");
    platformsDiv.className = "platform-container";

    const platforms = [1,2,3,4];

    platforms.forEach(p => {
      const box = document.createElement("div");
      box.className = "platform-box";
      box.innerHTML = `<div class="platform-label">${p}番線</div>`;

      pos
        .filter(x => !x.between && x.station === st && String(x.platform) === String(p))
        .forEach(info => box.appendChild(makeTrainIcon(info)));

      platformsDiv.appendChild(box);
    });

    row.appendChild(stDiv);
    row.appendChild(line);
    row.appendChild(platformsDiv);
    lane.appendChild(row);
  });
}

/* ===============================
   現在位置：3レーン描画
================================ */
function renderPosition() {
  const nowMs = Date.now();
  const pos = getCurrentPositions(nowMs);

  renderLane("lane-main", MAIN, pos);
  renderLane("lane-right", SAGAMI, pos);
  renderLane("lane-left", TAKAO, pos);
}

/* ===============================
   列車一覧
================================ */
function renderTrainList() {
  const body = document.getElementById("trainListBody");
  const keyword = (document.getElementById("searchInput").value || "").toLowerCase();
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
      if (s.station === station && !s.pass) {
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
   管理者モード
================================ */
const ADMIN_PASSWORD = "0829";

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

  if (!t.trainNumber) {
    alert("列車番号を入力してください");
    return;
  }

  trains[t.trainNumber] = t;
  renderTrainList();
  alert("列車を追加しました");
}

function updateTrain() {
  const t = getAdminForm();
  if (!trains[t.trainNumber]) {
    alert("その列車番号は存在しません");
    return;
  }
  t.timetable = readTimetableFromEditor();
  trains[t.trainNumber] = t;
  renderTrainList();
  alert("列車を編集しました");
}

function deleteTrain() {
  const num = document.getElementById("admTrainNumber").value;
  if (!num) return;
  if (!trains[num]) {
    alert("その列車番号は存在しません");
    return;
  }
  delete trains[num];
  renderTrainList();
  alert("列車を削除しました");
}

/* ===============================
   Firebase 保存・受信
================================ */
function saveCloud() {
  db.ref("trains").set(trains)
    .then(() => alert("クラウドに保存しました"));
}

function loadCloud() {
  db.ref("trains").once("value")
    .then(snap => {
      trains = snap.val() || {};
      renderTrainList();
      initStationSelect();
      renderPosition();
      alert("クラウドから受信しました");
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

  document.getElementById("posUp").onclick = () => {
    currentDirection = "up";
    renderPosition();
  };
  document.getElementById("posDown").onclick = () => {
    currentDirection = "down";
    renderPosition();
  };

  document.getElementById("stationSelect").onchange = renderStationTable;

  document.getElementById("btnLogin").onclick = loginAdmin;
  document.getElementById("btnAddTrain").onclick = addTrain;
  document.getElementById("btnUpdateTrain").onclick = updateTrain;
  document.getElementById("btnDeleteTrain").onclick = deleteTrain;

  document.getElementById("btnSaveCloud").onclick = saveCloud;
  document.getElementById("btnLoadCloud").onclick = loadCloud;

  initStationSelect();
  renderTrainList();
  renderPosition();
};
