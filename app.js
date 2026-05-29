// ===============================
// ① Firebase 初期化
// ===============================
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  update
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.firebasestorage.app",
  messagingSenderId: "1066598708695",
  appId: "1:1066598708695:web:e682df702e58caaaedc792",
  measurementId: "G-CKP4Z2F65W",
  databaseURL: "https://train-system-9622f-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const trainsRef = ref(db, "trains");

// ===============================
// ② グローバル変数
// ===============================
let trains = [];
let selectedTrainNo = null;
let currentDirection = "down"; // 時刻表の上下線

// 固定駅（京王線 下り）
const DOWN_STATIONS = [
  "新宿", "笹塚", "代田橋", "明大前", "下高井戸", "桜上水",
  "上北沢", "八幡山", "芦花公園", "千歳烏山", "仙川", "つつじヶ丘",
  "柴崎", "国領", "布田", "調布", "西調布", "飛田給", "武蔵野台",
  "多磨霊園", "東府中", "府中", "分倍河原", "中河原", "聖蹟桜ヶ丘",
  "百草園", "高幡不動", "南平", "平山城址公園", "長沼", "北野", "京王八王子"
];

// 上りは逆順
const UP_STATIONS = [...DOWN_STATIONS].reverse();

// ===============================
// ③ ページ切り替え
// ===============================
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.querySelectorAll("nav div").forEach(m => m.classList.remove("active"));

  document.getElementById("page-" + page).style.display = "block";
  document.getElementById("menu-" + page).classList.add("active");

  if (page === "list") renderTable();
  if (page === "detail") renderDetail();
  if (page === "location") renderLocation();
  if (page === "timetable") {
    initStationSelect();
    renderStationTimetable();
  }
}
window.showPage = showPage;

// ===============================
// ④ スマホのメニュー開閉
// ===============================
function toggleMenu() {
  document.getElementById("mainNav").classList.toggle("show");
}
window.toggleMenu = toggleMenu;
// ===============================
// ⑤ 列車番号一覧（検索対応）
// ===============================
function renderTable() {
  const tbody = document.querySelector("#trainTable tbody");
  tbody.innerHTML = "";

  const search = document.getElementById("trainSearch").value.trim();

  const sorted = [...trains].sort((a, b) => a.no.localeCompare(b.no, "ja"));

  sorted
    .filter(t => !search || t.no.includes(search))
    .forEach(train => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a href="#" onclick="selectTrain('${train.no}')">${train.no}</a></td>
        <td>${train.type || ""}</td>
        <td>${train.dest || ""}</td>
        <td>${train.start || ""}</td>
        <td>${train.startTime || ""}</td>
        <td>${train.end || ""}</td>
        <td>${train.endTime || ""}</td>
      `;
      tbody.appendChild(row);
    });
}

function selectTrain(no) {
  selectedTrainNo = no;
  showPage("detail");
}
window.selectTrain = selectTrain;

function getSelectedTrain() {
  if (!selectedTrainNo) return null;
  return trains.find(t => t.no === selectedTrainNo) || null;
}
// ===============================
// ⑥ 列車詳細（中央＋右寄せ）
// ===============================
function renderDetail() {
  const train = getSelectedTrain();
  const div = document.getElementById("detailContent");

  if (!train) {
    div.innerText = "列車を選択してください";
    return;
  }

  let html = `
    <div class="detail-layout">

      <div class="detail-center">
        <h2>${train.no}</h2>
        <h3>${train.type}</h3>
        <p>行き先：${train.dest}</p>
        <p>${train.start}（${train.startTime} 発） → ${train.end}（${train.endTime} 着）</p>
        <p>方向：${train.direction === "down" ? "下り" : "上り"}</p>
        <p>現在ステータス：${train.status}</p>
      </div>

      <div class="detail-right">
        <h3>停車駅と時刻</h3>
        <table>
          <tr><th>駅名</th><th>時刻</th><th>番線</th></tr>
  `;

  train.stations.forEach(s => {
    let timeCell = "";
    if (s.pass) {
      timeCell = `通過 ${s.passTime}`;
    } else if (s.arr === s.dep) {
      timeCell = `停車なし（${s.arr}）`;
    } else {
      timeCell = `到着 ${s.arr} / 発車 ${s.dep}`;
    }

    html += `
      <tr>
        <td>${s.name}</td>
        <td>${timeCell}</td>
        <td>${s.track}</td>
      </tr>
    `;
  });

  html += `
        </table>
      </div>

    </div>
  `;

  div.innerHTML = html;
}
// ===============================
// ⑦ 現在位置（路線図スタイル）
// ===============================
function renderLocation() {
  const train = getSelectedTrain();
  const div = document.getElementById("locationContent");

  if (!train) {
    div.innerText = "列車を選択してください";
    return;
  }

  let html = `<h3>${train.no} の現在位置</h3>`;

  train.stations.forEach((s, i) => {
    const isHere = train.currentIndex === i && !train.moving;

    html += `
      <div class="location-row ${isHere ? "active" : ""}">
        <div class="time">
          ${s.pass ? s.passTime : (s.arr || s.dep || "")}
        </div>
        <div class="station">${s.name}</div>
        <div class="track">${s.track ? s.track + "番線" : ""}</div>
      </div>
    `;

    if (i < train.stations.length - 1) {
      html += `<div class="location-line"></div>`;
    }
  });

  div.innerHTML = html;
}
// ===============================
// ⑧ 自動進行（本物のダイヤ進行）
// ===============================
function nowTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function updateTrainStatus(train) {
  if (!train.stations || train.stations.length === 0) return;

  const st = train.stations[train.currentIndex];
  const time = nowTime();

  // --- 通過駅 ---
  if (st.pass === true) {
    if (time === st.passTime && train.status !== "通過中") {
      train.status = "通過中";
      update(ref(db, "trains/" + train.no), { status: train.status });

      setTimeout(() => {
        startMoving(train);
      }, 10000);
    }
    return;
  }

  // --- 停車なし ---
  if (st.arr && st.dep && st.arr === st.dep) {
    if (train.status !== "停車中") {
      train.status = "停車中";
      update(ref(db, "trains/" + train.no), { status: train.status });

      setTimeout(() => {
        startMoving(train);
      }, 30000);
    }
    return;
  }

  // --- 到着 ---
  if (st.arr && time === st.arr && train.status !== "停車中") {
    train.status = "停車中";
    update(ref(db, "trains/" + train.no), { status: train.status });
    return;
  }

  // --- 発車 ---
  if (st.dep && time === st.dep && train.status !== "走行中") {
    train.status = "走行中";
    update(ref(db, "trains/" + train.no), { status: train.status });
    startMoving(train);
    return;
  }
}

function startMoving(train) {
  if (train.currentIndex >= train.stations.length - 1) {
    train.moving = false;
    train.progress = 0;
    train.status = "終点到着";

    update(ref(db, "trains/" + train.no), {
      moving: false,
      progress: 0,
      status: train.status
    });
    return;
  }

  train.moving = true;
  train.progress = 0;

  update(ref(db, "trains/" + train.no), {
    moving: true,
    progress: 0,
    status: train.status
  });
}

// ===============================
// ⑨ 1秒ごとの進行
// ===============================
setInterval(() => {
  trains.forEach(train => {
    updateTrainStatus(train);

    if (!train.moving) return;

    train.progress += 0.02;

    if (train.progress >= 1) {
      train.progress = 0;
      train.currentIndex++;

      if (train.currentIndex >= train.stations.length - 1) {
        train.currentIndex = train.stations.length - 1;
        train.moving = false;
        train.status = "終点到着";
      } else {
        train.moving = false;
        updateTrainStatus(train);
      }
    }

    update(ref(db, "trains/" + train.no), {
      progress: train.progress,
      currentIndex: train.currentIndex,
      moving: train.moving,
      status: train.status
    });
  });

  renderLocation();
}, 1000);
// ===============================
// ⑩ 各駅時刻表（4〜25時）
// ===============================
function initStationSelect() {
  const sel = document.getElementById("stationSelect");
  if (!sel) return;

  sel.innerHTML = "";
  DOWN_STATIONS.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function setDirection(dir) {
  currentDirection = dir;
  const label = document.getElementById("directionLabel");
  label.textContent = dir === "down"
    ? "下り（新宿 → 京王八王子）"
    : "上り（京王八王子 → 新宿）";

  renderStationTimetable();
}
window.setDirection = setDirection;

function renderStationTimetable() {
  const div = document.getElementById("stationTimetableContent");
  if (!div) return;

  const station = document.getElementById("stationSelect").value;
  if (!station) {
    div.innerText = "駅が選択されていません";
    return;
  }

  // 4〜25時の枠を作る
  const hours = {};
  for (let h = 4; h <= 25; h++) hours[h] = [];

  // 列車データから抽出
  trains.forEach(train => {
    if (!train.stations) return;

    // 上下線フィルタ
    if (currentDirection === "down" && train.direction === "up") return;
    if (currentDirection === "up" && train.direction === "down") return;

    const st = train.stations.find(s => s.name === station);
    if (!st) return;

    let t = "";
    if (st.pass) t = st.passTime;
    else if (st.arr && st.dep && st.arr === st.dep) t = st.arr;
    else if (st.dep) t = st.dep;
    else if (st.arr) t = st.arr;

    if (!t) return;

    const [hh, mm] = t.split(":");
    let hNum = parseInt(hh, 10);
    const mNum = parseInt(mm, 10);

    if (hNum < 4) hNum += 24;
    if (hNum < 4 || hNum > 25) return;

    hours[hNum].push({
      no: train.no,
      minute: mNum,
      pass: st.pass
    });
  });

  // HTML生成
  let html = `<h3>${station} 各駅時刻表（${currentDirection === "down" ? "下り" : "上り"}）</h3>`;
  html += `<table><tr><th>時</th><th>列車・分</th></tr>`;

  for (let h = 4; h <= 25; h++) {
    const list = hours[h];
    list.sort((a, b) => a.minute - b.minute);

    const hourLabel = h >= 24 ? h - 24 : h;
    const hourStr = String(hourLabel).padStart(2, "0");

    const cell = list.map(x => {
      const mm = String(x.minute).padStart(2, "0");
      return `${x.no}：${mm}${x.pass ? "通" : ""}`;
    }).join(" / ");

    html += `<tr><td>${hourStr}</td><td>${cell}</td></tr>`;
  }

  html += `</table>`;
  div.innerHTML = html;
}
// ===============================
// ⑪ 列車追加（固定駅）
// ===============================
function checkPassword() {
  const pw = document.getElementById("passwordInput").value;
  if (pw !== "0829") {
    alert("パスワードが違います");
    return;
  }

  document.getElementById("addTrainArea").style.display = "block";

  const list = document.getElementById("stationList");
  list.innerHTML = "";

  const dir = document.getElementById("direction").value;
  const stations = dir === "down" ? DOWN_STATIONS : UP_STATIONS;

  stations.forEach(name => addStationBox(name));

  // 始発・終着駅を自動補完
  document.getElementById("startStation").value = stations[0];
  document.getElementById("endStation").value = stations[stations.length - 1];
}
window.checkPassword = checkPassword;

function addStationBox(name) {
  const box = document.createElement("div");
  box.className = "station-box";

  box.innerHTML = `
    <div class="flex-row">
      <input value="${name}" class="st-name" readonly>
      <label style="display:flex;align-items:center;gap:4px;">
        <input type="checkbox" class="st-pass" onchange="togglePass(this)">
        通過駅
      </label>
    </div>

    <div class="stop-fields flex-row">
      <input placeholder="到着（例：11:05）" class="st-arr">
      <input placeholder="発車（例：11:06）" class="st-dep">
    </div>

    <div class="pass-fields flex-row" style="display:none;">
      <input placeholder="通過（例：11:09）" class="st-passTime">
    </div>

    <div class="flex-row">
      <input placeholder="番線（例：1）" class="st-track">
    </div>
  `;

  document.getElementById("stationList").appendChild(box);
}
window.addStationBox = addStationBox;

function togglePass(checkbox) {
  const box = checkbox.closest(".station-box");
  const stopFields = box.querySelector(".stop-fields");
  const passFields = box.querySelector(".pass-fields");

  if (checkbox.checked) {
    stopFields.style.display = "none";
    passFields.style.display = "flex";
  } else {
    stopFields.style.display = "flex";
    passFields.style.display = "none";
  }
}
window.togglePass = togglePass;
// ===============================
// ⑫ 列車追加 → Firebase 保存
// ===============================
function addTrain() {
  const train = {
    no: document.getElementById("trainNo").value.trim(),
    type: document.getElementById("trainType").value.trim(),
    dest: document.getElementById("destination").value.trim(),
    start: document.getElementById("startStation").value.trim(),
    startTime: document.getElementById("startTime").value.trim(),
    end: document.getElementById("endStation").value.trim(),
    endTime: document.getElementById("endTime").value.trim(),
    direction: document.getElementById("direction").value,
    stations: [],
    currentIndex: 0,
    progress: 0,
    moving: false,
    status: "未出発"
  };

  if (!train.no) {
    alert("列車番号を入力してください");
    return;
  }

  document.querySelectorAll(".station-box").forEach(box => {
    const pass = box.querySelector(".st-pass").checked;

    train.stations.push({
      name: box.querySelector(".st-name").value,
      arr: pass ? "" : box.querySelector(".st-arr").value,
      dep: pass ? "" : box.querySelector(".st-dep").value,
      track: box.querySelector(".st-track").value,
      pass: pass,
      passTime: pass ? box.querySelector(".st-passTime").value : ""
    });
  });

  set(ref(db, "trains/" + train.no), train).then(() => {
    alert("列車を追加しました");
    showPage("list");
  });
}
window.addTrain = addTrain;
// ===============================
// ⑬ Firebase リアルタイム同期
// ===============================
function saveData() {
  const obj = {};
  trains.forEach(t => obj[t.no] = t);

  set(trainsRef, obj).then(() => {
    alert("クラウドに保存しました");
  });
}
window.saveData = saveData;

function loadData() {
  get(trainsRef).then(snap => {
    const val = snap.val();
    trains = val ? Object.values(val) : [];

    alert("クラウドから受信しました");

    renderTable();
    renderDetail();
    renderLocation();
    renderStationTimetable();
  });
}
window.loadData = loadData;

// リアルタイム反映
onValue(trainsRef, snap => {
  const val = snap.val();
  trains = val ? Object.values(val) : [];

  renderTable();
  renderDetail();
  renderLocation();
  renderStationTimetable();
});
