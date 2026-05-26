//------------------------------------------------------
// app.js（完全版・Firebase対応）
//------------------------------------------------------

//==============================
// 0. Firebase 設定
//==============================

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxx"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

//==============================
// 1. APIキーを自動入力
//==============================

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("api-key").value = firebaseConfig.apiKey;
});

//==============================
// 2. データ構造
//==============================

let trains = [];

const stations = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];

//==============================
// 3. 種別色
//==============================

const typeColors = {
  "各停": "#888888",
  "快速": "#007bff",
  "区急": "#ffdd00",
  "急行": "#00aa44",
  "特急": "#ff0000"
};

//==============================
// 4. 番線ルール
//==============================

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

//==============================
// 5. パスワード認証
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
// 6. 画面切り替え
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
// 7. 現在位置：方向
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
// 8. 駅リスト描画
//==============================

function renderStationList() {
  const container = document.getElementById("station-list");
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
// 9. 現在位置描画
//==============================

function renderCurrentPosition() {
  renderStationList();

  trains.forEach(train => drawTrain(train));

  document.querySelectorAll(".station-name").forEach(btn => {
    btn.addEventListener("click", () => openStationTimetable(btn.dataset.station));
  });
}

//==============================
// 10. 列車描画（駅）
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
// 11. 列車描画（駅間）
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
// 12. 列車ボックス生成
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
// 13. 駅時刻表
//==============================

function openStationTimetable(station) {
  document.querySelector('[data-view="view-timetable"]').click();
  document.getElementById("timetable-station-select").value = station;
  renderStationTimetable(station);
}

function renderStationTimetable(station) {
  const tbody = document.getElementById("timetable-body");
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
// 14. 列車番号一覧
//==============================

function renderTrainList() {
  const tbody = document.getElementById("train-list-body");
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
  tbody.innerHTML = "";

  trains
    .filter(t => t.number.includes(word))
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
  }
});

document.getElementById("btn-clear-local").addEventListener("click", () => {
  localStorage.removeItem("trains");
  alert("削除しました");
});

//==============================
// 17. デバッグ
//==============================

document.getElementById("btn-log-trains").addEventListener("click", () => {
  console.log(trains);
});
//==============================
// 18. クラウド保存（Firebase Realtime Database）
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
// 19. クラウド受信（Firebase Realtime Database）
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
// 20. スプレッドシート読み込み
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

    trains = convertSheetToTrains(json.values);
    renderCurrentPosition();
    alert("スプレッドシートを読み込みました");

  } catch (e) {
    console.error(e);
    alert("読み込みに失敗しました");
  }
});

//==============================
// 21. スプレッドシート → trains 変換
//==============================

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
