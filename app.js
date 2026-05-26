//------------------------------------------------------
// 列車運行シミュレータ app.js（前半）
// データ構造・駅リスト・番線定義・基本初期化
//------------------------------------------------------

//==============================
// 1. データ構造
//==============================

// 列車データ（追加・編集・削除で更新される）
let trains = [];

// 駅リスト（スプレッドシートと同じ順番でOK）
const stations = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];

//==============================
// 2. 駅ごとの番線定義
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

// その他駅は 1=下り, 2=上り
function getPlatforms(station, direction) {
  if (platformRules[station]) {
    return platformRules[station][direction];
  }
  return direction === "down" ? [1] : [2];
}

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
// 4. パスワード認証
//==============================

let isAdmin = false;
const ADMIN_PASS = "0829";

function checkPassword() {
  const input = document.getElementById("admin-password").value;
  const status = document.getElementById("auth-status");

  if (input === ADMIN_PASS) {
    isAdmin = true;
    status.textContent = "認証成功：編集機能が有効になりました。";
    enableAdminButtons();
  } else {
    status.textContent = "パスワードが違います。";
  }
}

function enableAdminButtons() {
  document.querySelectorAll(".need-auth").forEach(btn => {
    btn.disabled = false;
  });
}

//==============================
// 5. 現在位置の方向（上り/下り）
//==============================

let currentDirection = "down"; // 初期は下り

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
// 6. 駅リストの生成（現在位置）
//==============================

function renderStationList() {
  const container = document.getElementById("station-list");
  container.innerHTML = "";

  const list = currentDirection === "down" ? stations : [...stations].reverse();

  list.forEach((station, index) => {
    const block = document.createElement("div");
    block.className = "station-block";
    block.dataset.station = station;

    // 駅名
    block.innerHTML = `
      <div class="station-header">
        <span class="station-dot">〇</span>
        <button class="station-name" data-station="${station}">${station}</button>
      </div>
    `;

    // 番線
    const platforms = getPlatforms(station, currentDirection);
    const platformRow = document.createElement("div");
    platformRow.className = "platform-row";

    platforms.forEach(p => {
      const pf = document.createElement("div");
      pf.className = "platform";
      pf.dataset.platform = p;
      pf.innerHTML = `
        <div class="platform-label">${p}番線</div>
        <div class="train-slot"></div>
      `;
      platformRow.appendChild(pf);
    });

    block.appendChild(platformRow);

    // 駅間の縦線
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
// 7. 時計
//==============================

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("clock").textContent = `${hh}:${mm}:${ss}`;
}
setInterval(updateClock, 1000);
updateClock();

//==============================
// 8. 初期化
//==============================

document.getElementById("btn-auth").addEventListener("click", checkPassword);

renderStationList();
updateDirectionButtons();
//------------------------------------------------------
// app.js（中盤）
// 現在位置の列車描画・駅間走行・タップで詳細
//------------------------------------------------------

//==============================
// 9. 現在位置の描画
//==============================

function renderCurrentPosition() {
  renderStationList(); // 駅リストを描き直す

  // 列車ごとに位置を描画
  trains.forEach(train => {
    drawTrain(train);
  });

  // 駅名タップ → 時刻表へ
  document.querySelectorAll(".station-name").forEach(btn => {
    btn.addEventListener("click", () => {
      openStationTimetable(btn.dataset.station);
    });
  });
}

//==============================
// 10. 列車の描画
//==============================

function drawTrain(train) {
  const station = train.currentStation;
  const between = train.between; // { from: "笹塚", to: "代田橋" }

  // 駅に停車 or 通過
  if (station) {
    drawTrainAtStation(train);
  }

  // 駅間走行
  if (between) {
    drawTrainBetween(train);
  }
}

//==============================
// 11. 駅に停車・通過中の列車
//==============================

function drawTrainAtStation(train) {
  const stationBlock = document.querySelector(
    `.station-block[data-station="${train.currentStation}"]`
  );
  if (!stationBlock) return;

  const platform = train.platform;
  const slot = stationBlock.querySelector(
    `.platform[data-platform="${platform}"] .train-slot`
  );
  if (!slot) return;

  slot.appendChild(createTrainElement(train));
}

//==============================
// 12. 駅間走行中の列車
//==============================

function drawTrainBetween(train) {
  const from = train.between.from;
  const to = train.between.to;

  const fromBlock = document.querySelector(
    `.station-block[data-station="${from}"]`
  );
  if (!fromBlock) return;

  const line = fromBlock.querySelector(".station-line");
  if (!line) return;

  const el = createTrainElement(train);
  el.classList.add("train-between");

  line.appendChild(el);
}

//==============================
// 13. 列車の HTML 要素を作る
//==============================

function createTrainElement(train) {
  const wrapper = document.createElement("div");
  wrapper.className = "train-box";
  wrapper.dataset.trainNumber = train.number;

  // 上段：列車番号
  const top = document.createElement("div");
  top.className = "train-box-top";
  top.textContent = train.number;

  // 下段：行き先＋状態（色は種別）
  const bottom = document.createElement("div");
  bottom.className = "train-box-bottom";
  bottom.textContent = `${train.destination}｜${train.status}`;
  bottom.style.backgroundColor = typeColors[train.type] || "#ccc";

  wrapper.appendChild(top);
  wrapper.appendChild(bottom);

  // タップで詳細
  wrapper.addEventListener("click", () => {
    openTrainDetail(train.number);
  });

  return wrapper;
}

//==============================
// 14. 列車詳細を開く
//==============================

function openTrainDetail(trainNumber) {
  const train = trains.find(t => t.number == trainNumber);
  if (!train) return;

  const modal = document.getElementById("train-detail-modal");
  const body = document.getElementById("train-detail-body");

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
        : `${train.between.from} → ${train.between.to}（駅間）`
    }</p>
    <p><b>状態：</b> ${train.status}</p>
  `;

  modal.setAttribute("aria-hidden", "false");
  modal.style.display = "block";
}

document.getElementById("train-detail-close").addEventListener("click", () => {
  document.getElementById("train-detail-modal").style.display = "none";
});

//==============================
// 15. 駅の時刻表を開く
//==============================

function openStationTimetable(station) {
  document.querySelector('[data-view="view-timetable"]').click();

  document.getElementById("timetable-station-select").value = station;
  renderStationTimetable(station);
}
//------------------------------------------------------
// app.js（後半）
// 駅時刻表生成・保存機能・スプレッドシート読み込み
//------------------------------------------------------

//==============================
// 16. 駅の時刻表を生成
//==============================

function renderStationTimetable(station) {
  const tbody = document.getElementById("timetable-body");
  tbody.innerHTML = "";

  // この駅を通る列車を抽出
  const list = trains.filter(t => t.stops && t.stops[station]);

  // 時刻順に並べる
  list.sort((a, b) => {
    const ta = a.stops[station].time;
    const tb = b.stops[station].time;
    return ta.localeCompare(tb);
  });

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

    // 行クリックで詳細
    tr.addEventListener("click", () => openTrainDetail(train.number));

    tbody.appendChild(tr);
  });
}

// 駅選択変更
document.getElementById("timetable-station-select").addEventListener("change", e => {
  renderStationTimetable(e.target.value);
});

//==============================
// 17. ローカル保存
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
// 18. JSON読み込み
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

//==============================
// 19. JSONエクスポート
//==============================

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
// 20. スプレッドシート読み込み（認証後）
//==============================

document.getElementById("btn-load-sheet").addEventListener("click", async () => {
  if (!isAdmin) return alert("パスワード認証が必要です");

  const sheetId = document.getElementById("sheet-id").value;
  const apiKey = document.getElementById("api-key").value;

  if (!sheetId || !apiKey) {
    alert("シートIDとAPIキーを入力してください");
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z999?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    // ここでスプレッドシートの内容を trains に変換する
    trains = convertSheetToTrains(json.values);

    renderCurrentPosition();
    alert("スプレッドシートを読み込みました");
  } catch (e) {
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
      between: row[8]
        ? { from: row[8], to: row[9] }
        : null,
      platform: Number(row[10] || 1),
      status: row[11] || "走行中",
      stops: {} // 停車駅は別シートで管理するならここで追加
    });
  }

  return list;
}

//==============================
// 22. クラウド保存（パスワード不要）
//==============================

document.getElementById("btn-cloud-save").addEventListener("click", async () => {
  alert("クラウド保存はまだ未実装です（Firebase対応予定）");
});

//==============================
// 23. クラウド受信（パスワード不要）
//==============================

document.getElementById("btn-cloud-load").addEventListener("click", async () => {
  alert("クラウド受信はまだ未実装です（Firebase対応予定）");
});

//==============================
// 24. デバッグ
//==============================

document.getElementById("btn-log-trains").addEventListener("click", () => {
  console.log(trains);
});
//------------------------------------------------------
// app.js（最終）
// 画面切り替え・メニュー・初期化
//------------------------------------------------------

//==============================
// 25. 画面切り替え
//==============================

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;

    // メニューの active 切り替え
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // 画面切り替え
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(view).classList.add("active");

    // 特定画面の初期処理
    if (view === "view-current") {
      renderCurrentPosition();
    }
    if (view === "view-train-list") {
      renderTrainList();
    }
    if (view === "view-timetable") {
      fillStationSelect();
    }
  });
});

//==============================
// 26. 駅選択プルダウンを作る
//==============================

function fillStationSelect() {
  const sel = document.getElementById("timetable-station-select");
  sel.innerHTML = "";
  stations.forEach(st => {
    const op = document.createElement("option");
    op.value = st;
    op.textContent = st;
    sel.appendChild(op);
  });
}

//==============================
// 27. 列車番号一覧の描画
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

//==============================
// 28. 列車番号検索
//==============================

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
// 29. ハンバーガーメニュー（スマホ）
//==============================

document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("top-nav").classList.toggle("open");
});

//==============================
// 30. 現在時刻にジャンプ（今はダミー）
//==============================

document.getElementById("btn-now").addEventListener("click", () => {
  alert("現在時刻ジャンプは後で実装予定です");
});

//==============================
// 31. 初期化
//==============================

function init() {
  fillStationSelect();
  renderTrainList();
  renderCurrentPosition();
  updateDirectionButtons();
}

init();
