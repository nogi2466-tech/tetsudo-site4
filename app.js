//------------------------------------------------------
// app.js（完全版・Aブロック）
// Firebase設定 / 初期設定 / 画面切替
//------------------------------------------------------

//==============================
// 0. Firebase 設定
//==============================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:xxxxxxxxxxxxxx"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

//==============================
// 1. 初期処理
//==============================

let trains = [];

const stations = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];

const typeColors = {
  "各停": "#888888",
  "快速": "#007bff",
  "区急": "#ffdd00",
  "急行": "#00aa44",
  "特急": "#ff0000"
};

const platformRules = {
  "笹塚": { down: [1,2], up: [3,4] },
  "桜上水": { down: [1,2], up: [3,4] },
  "つつじヶ丘": { down: [1,2], up: [3,4] },
  "調布": { down: [1,2], up: [3,4] },
  "府中": { down: [1,2], up: [3,4] },
  "北野": { down: [1,2], up: [3,4] },
  "高幡不動": { down: [2,3], up: [4,5] },
  "東府中": { down: [2,3], up: [4] },
  "飛田給": { down: [1], up: [2,3] },
  "新宿": { down: [1,2,3,4], up: [1,2,3,4] }
};

function getPlatforms(station, direction) {
  if (platformRules[station]) return platformRules[station][direction];
  return direction === "down" ? [1] : [2];
}

document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key");
  if (apiKeyInput) apiKeyInput.value = firebaseConfig.apiKey;

  fillStationSelect();
  renderTrainList();
  updateClock();
  setInterval(updateClock, 1000);

  const btnNow = document.getElementById("btn-now");
  if (btnNow) btnNow.addEventListener("click", updateClock);
});

//==============================
// 2. パスワード認証
//==============================

let isAdmin = false;
const ADMIN_PASS = "0829";

document.getElementById("btn-auth").addEventListener("click", () => {
  const input = document.getElementById("admin-password").value;
  const status = document.getElementById("auth-status");

  if (input === ADMIN_PASS) {
    isAdmin = true;
    status.textContent = "認証成功：編集機能が有効になりました。";
    document.querySelectorAll(".need-auth").forEach(btn => btn.disabled = false);
  } else {
    status.textContent = "パスワードが違います。";
  }
});

//==============================
// 3. 画面切り替え（完全版）
//==============================

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(view).classList.add("active");

    if (view === "view-current") renderCurrentPosition();
    if (view === "view-train-list") renderTrainList();
    if (view === "view-timetable") fillStationSelect();
  });
});

//==============================
// 4. 時計
//==============================

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = `${hh}:${mm}:${ss}`;
}
//------------------------------------------------------
// app.js（完全版・Bブロック）
// 現在位置 / 駅リスト / 列車描画 / 時刻表
//------------------------------------------------------

//==============================
// 5. 現在位置：方向
//==============================

let currentDirection = "down";

document.getElementById("dir-down").addEventListener("click", () => {
  currentDirection = "down";
  updateDirectionButtons();
  renderCurrentPosition();
});

document.getElementById("dir-up").addEventListener("click", () => {
  currentDirection = "up";
  updateDirectionButtons();
  renderCurrentPosition();
});

function updateDirectionButtons() {
  document.getElementById("dir-down").classList.toggle("active", currentDirection === "down");
  document.getElementById("dir-up").classList.toggle("active", currentDirection === "up");
}

//==============================
// 6. 駅リスト描画
//==============================

function renderStationList() {
  const container = document.getElementById("station-list");
  if (!container) return;
  container.innerHTML = "";

  const list = currentDirection === "down" ? stations : [...stations].reverse();

  list.forEach((station, index) => {
    const block = document.createElement("div");
    block.className = "station-block";
    block.dataset.station = station;

    block.innerHTML = `
      <div class="station-header">
        <span class="station-dot">〇</span>
        <button class="station-name" data-station="${station}">${station}</button>
      </div>
    `;

    const platforms = getPlatforms(station, currentDirection);
    const row = document.createElement("div");
    row.className = "platform-row";

    platforms.forEach(p => {
      const pf = document.createElement("div");
      pf.className = "platform";
      pf.dataset.platform = p;
      pf.innerHTML = `
        <div class="platform-label">${p}番線</div>
        <div class="train-slot"></div>
      `;
      row.appendChild(pf);
    });

    block.appendChild(row);

    if (index < list.length - 1) {
      const line = document.createElement("div");
      line.className = "station-line";
      line.textContent = "｜";
      block.appendChild(line);
    }

    container.appendChild(block);
  });
}

//==============================
// 7. 現在位置描画
//==============================

function renderCurrentPosition() {
  renderStationList();

  trains.forEach(train => drawTrain(train));

  document.querySelectorAll(".station-name").forEach(btn => {
    btn.addEventListener("click", () => openStationTimetable(btn.dataset.station));
  });
}

//==============================
// 8. 列車描画（駅）
//==============================

function drawTrain(train) {
  if (train.currentStation) drawTrainAtStation(train);
  if (train.between) drawTrainBetween(train);
}

function drawTrainAtStation(train) {
  const block = document.querySelector(`.station-block[data-station="${train.currentStation}"]`);
  if (!block) return;

  const slot = block.querySelector(`.platform[data-platform="${train.platform}"] .train-slot`);
  if (!slot) return;

  slot.appendChild(createTrainElement(train));
}

//==============================
// 9. 列車描画（駅間）
//==============================

function drawTrainBetween(train) {
  const from = train.between.from;
  const block = document.querySelector(`.station-block[data-station="${from}"]`);
  if (!block) return;

  const line = block.querySelector(".station-line");
  if (!line) return;

  const el = createTrainElement(train);
  el.classList.add("train-between");
  line.appendChild(el);
}

//==============================
// 10. 列車ボックス生成
//==============================

function createTrainElement(train) {
  const wrap = document.createElement("div");
  wrap.className = "train-box";
  wrap.dataset.trainNumber = train.number;

  const top = document.createElement("div");
  top.className = "train-box-top";
  top.textContent = train.number;

  const bottom = document.createElement("div");
  bottom.className = "train-box-bottom";
  bottom.textContent = `${train.destination}｜${train.status}`;
  bottom.style.backgroundColor = typeColors[train.type] || "#ccc";

  wrap.appendChild(top);
  wrap.appendChild(bottom);

  wrap.addEventListener("click", () => openTrainDetail(train.number));

  return wrap;
}

//==============================
// 11. 列車詳細モーダル
//==============================

function openTrainDetail(num) {
  const train = trains.find(t => t.number == num);
  if (!train) return;

  const modal = document.getElementById("train-detail-modal");
  const body = document.getElementById("train-detail-body");
  if (!modal || !body) return;

  body.innerHTML = `
    <p><b>列車番号：</b> ${train.number}</p>
    <p><b>種別：</b> ${train.type}</p>
    <p><b>行き先：</b> ${train.destination}</p>
    <p><b>始発駅：</b> ${train.start}</p>
    <p><b>発車時刻：</b> ${train.startTime}</p>
    <p><b>終着駅：</b> ${train.end}</p>
    <p><b>到着時刻：</b> ${train.endTime}</p>
    <p><b>現在位置：</b> ${
      train.currentStation
        ? train.currentStation + "（駅）"
        : (train.between ? `${train.between.from} → ${train.between.to}（駅間）` : "不明")
    }</p>
    <p><b>状態：</b> ${train.status}</p>
  `;

  modal.style.display = "block";
}

document.getElementById("train-detail-close").addEventListener("click", () => {
  const modal = document.getElementById("train-detail-modal");
  if (modal) modal.style.display = "none";
});

//==============================
// 12. 駅時刻表
//==============================

function openStationTimetable(station) {
  const btn = document.querySelector('[data-view="view-timetable"]');
  if (btn) btn.click();
  const sel = document.getElementById("timetable-station-select");
  if (sel) sel.value = station;
  renderStationTimetable(station);
}

function renderStationTimetable(station) {
  const tbody = document.getElementById("timetable-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const list = trains.filter(t => t.stops && t.stops[station]);

  list.sort((a, b) => a.stops[station].time.localeCompare(b.stops[station].time));

  list.forEach(train => {
    const stop = train.stops[station];
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${stop.time}</td>
      <td>${train.number}</td>
      <td>${train.type}</td>
      <td>${train.destination}</td>
      <td>${stop.platform}</td>
      <td style="background:${typeColors[train.type]};"></td>
      <td>${stop.pass ? "通過" : "停車"}</td>
    `;

    tr.addEventListener("click", () => openTrainDetail(train.number));
    tbody.appendChild(tr);
  });
}

document.getElementById("timetable-station-select").addEventListener("change", e => {
  renderStationTimetable(e.target.value);
});

//==============================
// 13. 駅選択プルダウン
//==============================

function fillStationSelect() {
  const sel = document.getElementById("timetable-station-select");
  if (!sel) return;
  sel.innerHTML = "";
  stations.forEach(st => {
    const op = document.createElement("option");
    op.value = st;
    op.textContent = st;
    sel.appendChild(op);
  });
}
//------------------------------------------------------
// app.js（完全版・Cブロック）
// 検索 / JSON入出力 / ローカル保存 / クラウド保存
//------------------------------------------------------

//==============================
// 14. 列車番号一覧（検索）
//==============================

function renderTrainList() {
  const tbody = document.getElementById("train-list-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  trains.forEach(train => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${train.number}</td>
      <td>${train.type}</td>
      <td>${train.destination}</td>
      <td>${train.start}</td>
      <td>${train.startTime}</td>
      <td>${train.end}</td>
      <td>${train.endTime}</td>
    `;

    tr.addEventListener("click", () => openTrainDetail(train.number));
    tbody.appendChild(tr);
  });
}

document.getElementById("btn-train-search").addEventListener("click", () => {
  const word = document.getElementById("train-search").value;
  const tbody = document.getElementById("train-list-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  trains
    .filter(t => t.number && t.number.includes(word))
    .forEach(train => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${train.number}</td>
        <td>${train.type}</td>
        <td>${train.destination}</td>
        <td>${train.start}</td>
        <td>${train.startTime}</td>
        <td>${train.end}</td>
        <td>${train.endTime}</td>
      `;
      tr.addEventListener("click", () => openTrainDetail(train.number));
      tbody.appendChild(tr);
    });
});

document.getElementById("btn-train-search-clear").addEventListener("click", () => {
  document.getElementById("train-search").value = "";
  renderTrainList();
});

//==============================
// 15. JSON入出力
//==============================

document.getElementById("btn-load-json").addEventListener("click", () => {
  const file = document.getElementById("json-input").files[0];
  if (!file) return alert("ファイルを選択してください");

  const reader = new FileReader();
  reader.onload = () => {
    trains = JSON.parse(reader.result);
    renderCurrentPosition();
    alert("JSONを読み込みました");
  };
  reader.readAsText(file);
});

document.getElementById("btn-export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(trains, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "trains.json";
  a.click();

  URL.revokeObjectURL(url);
});

//==============================
// 16. ローカル保存
//==============================

document.getElementById("btn-save-local").addEventListener("click", () => {
  localStorage.setItem("trains", JSON.stringify(trains));
  alert("保存しました");
});

document.getElementById("btn-load-local").addEventListener("click", () => {
  const data = localStorage.getItem("trains");
  if (data) {
    trains = JSON.parse(data);
    renderCurrentPosition();
    alert("読み込みました");
  } else {
    alert("保存されたデータがありません");
  }
});

document.getElementById("btn-clear-local").addEventListener("click", () => {
  localStorage.removeItem("trains");
  alert("削除しました");
});

//==============================
// 17. クラウド保存（Firebase）
//==============================

document.getElementById("btn-cloud-save").addEventListener("click", () => {
  if (!isAdmin) {
    alert("パスワード認証が必要です");
    return;
  }

  db.ref("trains").set(trains)
    .then(() => {
      alert("クラウドに保存しました");
    })
    .catch(err => {
      console.error(err);
      alert("保存に失敗しました");
    });
});

//==============================
// 18. クラウド受信（Firebase）
//==============================

document.getElementById("btn-cloud-load").addEventListener("click", () => {
  db.ref("trains").once("value")
    .then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        alert("クラウドにデータがありません");
        return;
      }

      trains = data;
      renderCurrentPosition();
      alert("クラウドから読み込みました");
    })
    .catch(err => {
      console.error(err);
      alert("読み込みに失敗しました");
    });
});

//==============================
// 19. スプレッドシート読み込み
//==============================

document.getElementById("btn-load-sheet").addEventListener("click", async () => {
  if (!isAdmin) return alert("パスワード認証が必要です");

  const sheetId = document.getElementById("sheet-id").value;
  const apiKey = document.getElementById("api-key").value;

  if (!sheetId || !apiKey) return alert("シートIDとAPIキーを入力してください");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z999?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    trains = convertSheetToTrains(json.values || []);
    renderCurrentPosition();
    alert("スプレッドシートを読み込みました");

  } catch (e) {
    console.error(e);
    alert("読み込みに失敗しました");
  }
});

function convertSheetToTrains(values) {
  const list = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    list.push({
      number: row[0],
      type: row[1],
      destination: row[2],
      start: row[3],
      startTime: row[4],
      end: row[5],
      endTime: row[6],
      currentStation: row[7] || null,
      between: row[8] ? { from: row[8], to: row[9] } : null,
      platform: Number(row[10] || 1),
      status: row[11] || "走行中",
      stops: {}
    });
  }

  return list;
}

//==============================
// 20. デバッグ
//==============================

document.getElementById("btn-log-trains").addEventListener("click", () => {
  console.log(trains);
});
