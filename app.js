/* ============================
   ① 基本データ・変数
============================ */

let trains = [];
let editingIndex = -1;
let isAdmin = false;
let currentDirection = "up"; // 上りがデフォルト

/* 京王線（本線）駅リスト */
const stations_main_up = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];
const stations_main_down = [...stations_main_up].reverse();

/* 相模原線 駅リスト */
const stations_sagami_up = [
  "調布","京王多摩川","京王稲田堤","京王よみうりランド",
  "稲城","若葉台","京王永山","京王多摩センター",
  "京王堀之内","南大沢","多摩境","橋本"
];
const stations_sagami_down = [...stations_sagami_up].reverse();

/* 高尾線 駅リスト */
const stations_takao_up = [
  "北野","京王片倉","山田","めじろ台","狭間","高尾","高尾山口"
];
const stations_takao_down = [...stations_takao_up].reverse();

/* ============================
   ② 番線自動判定
============================ */

function autoTrack(station, direction) {
  const special34 = ["笹塚", "つつじヶ丘", "調布", "府中", "北野"];
  const special12 = ["京王八王子", "高尾山口"];

  const sagamiStations = [
    "京王多摩川","京王稲田堤","京王よみうりランド",
    "稲城","若葉台","京王永山","京王多摩センター",
    "京王堀之内","南大沢","多摩境","橋本"
  ];

  if (station === "新宿") return "1・2・3・4番線";

  if (station === "高幡不動") {
    return direction === "up" ? "4・5番線" : "2・3番線";
  }

  if (sagamiStations.includes(station)) {
    if (station === "若葉台" || station === "京王多摩センター") {
      return direction === "up" ? "3・4番線" : "1・2番線";
    }
    return "1・2番線";
  }

  if (direction === "up") {
    if (special34.includes(station)) return "3・4番線";
    if (special12.includes(station)) return "1・2番線";
    return "2番線";
  }

  if (direction === "down") {
    if (special34.includes(station)) return "1・2番線";
    if (special12.includes(station)) return "1・2番線";
    return "1番線";
  }

  return "";
}

/* ============================
   ③ 停車駅入力（番線手動対応）
============================ */

function addStopRow(station = "", arrive = "", depart = "", pass = false, track = "") {
  const div = document.createElement("div");
  div.className = "stop-row";

  div.innerHTML = `
    <input class="stop-station" placeholder="駅名" value="${station}">
    <input class="stop-arrive" type="time" value="${arrive}">
    <input class="stop-depart" type="time" value="${depart}">
    <input class="stop-track" placeholder="番線" value="${track}">
    <label>
      <input class="stop-pass" type="checkbox" ${pass ? "checked" : ""}> 通過
    </label>
    <button class="stop-del">削除</button>
  `;

  div.querySelector(".stop-del").onclick = () => div.remove();

  document.getElementById("stop-list").appendChild(div);
}

document.getElementById("btn-add-stop").onclick = () => {
  addStopRow();
};

document.getElementById("btn-save-train").onclick = () => {
  const number = document.getElementById("add-number").value;
  const type = document.getElementById("add-type").value;
  const line = document.getElementById("add-line").value;
  const direction = document.getElementById("add-direction").value;
  const dest = document.getElementById("add-dest").value;

  const stopDivs = document.querySelectorAll(".stop-row");
  const stops = [];

  stopDivs.forEach(div => {
    const station = div.querySelector(".stop-station").value;
    const arrive = div.querySelector(".stop-arrive").value;
    const depart = div.querySelector(".stop-depart").value;
    const pass = div.querySelector(".stop-pass").checked;
    let track = div.querySelector(".stop-track").value;

    if (!track) {
      track = autoTrack(station, direction);
    }

    stops.push({ station, arrive, depart, pass, track });
  });

  const train = { number, type, line, direction, dest, stops };

  if (editingIndex === -1) {
    trains.push(train);
  } else {
    trains[editingIndex] = train;
    editingIndex = -1;
  }

  saveLocal();
  renderTrainList();
  alert("保存しました");
};

function saveLocal() {
  localStorage.setItem("trains", JSON.stringify(trains));
}

function loadLocal() {
  const data = localStorage.getItem("trains");
  if (data) trains = JSON.parse(data);
}
loadLocal();

function editTrain(index) {
  editingIndex = index;
  const t = trains[index];

  document.getElementById("add-number").value = t.number;
  document.getElementById("add-type").value = t.type;
  document.getElementById("add-line").value = t.line;
  document.getElementById("add-direction").value = t.direction;
  document.getElementById("add-dest").value = t.dest;

  document.getElementById("stop-list").innerHTML = "";
  t.stops.forEach(s => {
    addStopRow(s.station, s.arrive, s.depart, s.pass, s.track);
  });

  showPage("settings");
}

/* ============================
   ④ ページ切替・列車一覧・詳細
============================ */

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  const nav = document.querySelector(`nav a[data-target="${id}"]`);
  if (nav) nav.classList.add("active");
}

document.querySelectorAll("nav a").forEach(a => {
  a.onclick = () => showPage(a.dataset.target);
});

function renderTrainList() {
  const tbody = document.querySelector("#train-table tbody");
  tbody.innerHTML = "";

  trains.forEach((t, i) => {
    const first = t.stops[0];
    const last = t.stops[t.stops.length - 1];

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.number}</td>
      <td>${t.type}</td>
      <td>${t.dest}</td>
      <td>${first?.station || ""}</td>
      <td>${first?.depart || ""}</td>
      <td>${last?.station || ""}</td>
      <td>${last?.arrive || ""}</td>
    `;

    tr.onclick = () => showTrainDetail(i);

    tbody.appendChild(tr);
  });
}

function showTrainDetail(index) {
  const t = trains[index];
  const box = document.getElementById("train-detail-box");

  box.innerHTML = `
    <h3>列車番号: ${t.number}</h3>
    <p>種類: ${t.type}</p>
    <p>方向: ${t.direction === "up" ? "上り" : "下り"}</p>
    <p>行先: ${t.dest}</p>

    <h3>各駅時刻</h3>
    <table class="detail-table">
      <thead>
        <tr>
          <th>駅名</th>
          <th>到着</th>
          <th>発車</th>
          <th>番線</th>
        </tr>
      </thead>
      <tbody id="detail-body"></tbody>
    </table>
  `;

  const tbody = document.getElementById("detail-body");

  t.stops.forEach(s => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arrive || "-"}</td>
      <td>${s.depart || "-"}</td>
      <td>${s.track || "-"}</td>
    `;

    tbody.appendChild(tr);
  });

  showPage("train-detail");
}

document.getElementById("search-number").oninput = function () {
  const word = this.value;
  const tbody = document.querySelector("#train-table tbody");

  tbody.querySelectorAll("tr").forEach(tr => {
    tr.style.display = tr.children[0].textContent.includes(word) ? "" : "none";
  });
};

renderTrainList();

/* ============================
   ⑤ 現在位置（本線＋相模原線＋高尾線）
============================ */

document.getElementById("btn-up").onclick = () => {
  currentDirection = "up";
  document.getElementById("btn-up").classList.add("active");
  document.getElementById("btn-down").classList.remove("active");
  renderVerticalLine();
  updateTrainPosition();
};

document.getElementById("btn-down").onclick = () => {
  currentDirection = "down";
  document.getElementById("btn-down").classList.add("active");
  document.getElementById("btn-up").classList.remove("active");
  renderVerticalLine();
  updateTrainPosition();
};

function renderVerticalLine() {
  const mainList = currentDirection === "up" ? stations_main_up : stations_main_down;
  const sagamiList = currentDirection === "up" ? stations_sagami_up : stations_sagami_down;
  const takaoList = currentDirection === "up" ? stations_takao_up : stations_takao_down;

  const mainBody = document.getElementById("line-main-body");
  const sagamiBody = document.getElementById("line-sagami-body");
  const takaoBody = document.getElementById("line-takao-body");

  mainBody.innerHTML = "";
  sagamiBody.innerHTML = "";
  takaoBody.innerHTML = "";

  function makeStationDiv(parent, list) {
    list.forEach((s, i) => {
      const div = document.createElement("div");
      div.className = "station-vertical";
      div.dataset.station = s;

      div.innerHTML = `
        <div class="station-row">
          <div class="station-name">${s}</div>
          <div class="station-center">
            <div class="station-dot"></div>
            ${i < list.length - 1 ? '<div class="line-vertical"></div>' : ''}
          </div>
          <div class="tracks">
            <div class="track-slot" data-track="1"></div>
            <div class="track-slot" data-track="2"></div>
            <div class="track-slot" data-track="3"></div>
            <div class="track-slot" data-track="4"></div>
          </div>
        </div>
      `;
      parent.appendChild(div);
    });
  }

  makeStationDiv(mainBody, mainList);
  makeStationDiv(sagamiBody, sagamiList);
  makeStationDiv(takaoBody, takaoList);
}

renderVerticalLine();

/* ============================
   ⑥ 現在時刻・時間処理
============================ */

function getNowTimeStr() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function toSec(t) {
  if (!t) return null;
  const [h, m, s = "0"] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("now-time").textContent = `現在時刻: ${hh}:${mm}`;
  updateTrainPosition();
}, 1000);

/* ============================
   ⑦ 種別→色クラス・カード生成
============================ */

function typeClass(type) {
  if (type.includes("特急")) return "train-ltd";
  if (type.includes("急行") || type.includes("快速") || type.includes("区急")) return "train-exp";
  return "train-local";
}

function createTrainCard(train, statusText) {
  const div = document.createElement("div");
  div.className = `train-card ${typeClass(train.type)}`;
  div.innerHTML = `
    <div>${train.number}</div>
    <div>${statusText}</div>
  `;
  return div;
}

/* ============================
   ⑧ 配置ヘルパー
============================ */

function placeCardAtTrack(card, station, trackStr) {
  const st = document.querySelector(`.station-vertical[data-station="${station}"]`);
  if (!st) return;

  const num = (trackStr || "").match(/\d/);
  const trackNum = num ? num[0] : "1";

  const slot = st.querySelector(`.track-slot[data-track="${trackNum}"]`);
  (slot || st).appendChild(card);
}

function placeCardBetweenStations(card, station) {
  const st = document.querySelector(`.station-vertical[data-station="${station}"]`);
  if (st) st.appendChild(card);
}

/* ============================
   ⑨ 現在位置ロジック
============================ */

function updateTrainPosition() {
  document.querySelectorAll(".train-card").forEach(e => e.remove());

  const nowStr = getNowTimeStr();
  const nowSec = toSec(nowStr);

  trains.forEach(t => {
    const stops = t.stops;
    if (!stops || stops.length === 0) return;

    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      const next = stops[i + 1];

      const arrSec = toSec(s.arrive);
      const depSec = toSec(s.depart);
      const nextArrSec = next ? toSec(next.arrive) : null;

      // 通過駅：到着時刻±10秒 → 駅で「通過中」
      if (s.pass && arrSec && Math.abs(nowSec - arrSec) <= 10) {
        const card = createTrainCard(t, "通過中");
        placeCardAtTrack(card, s.station, s.track);
        return;
      }

      // 停車駅：到着〜発車の間 → 「停車中」
      if (!s.pass && arrSec && depSec && arrSec <= nowSec && nowSec <= depSec) {
        const stay = depSec - arrSec;
        const limit = stay === 0 ? 30 : stay; // 到着＝発車なら30秒

        if (nowSec - arrSec <= limit) {
          const card = createTrainCard(t, "停車中");
          placeCardAtTrack(card, s.station, s.track);
        } else if (next && nextArrSec && nowSec < nextArrSec) {
          const card = createTrainCard(t, "走行中");
          placeCardBetweenStations(card, s.station);
        }
        return;
      }

      // 発車後〜次駅到着前 → 「走行中」
      if (next && depSec && nextArrSec && depSec < nowSec && nowSec < nextArrSec) {
        const card = createTrainCard(t, "走行中");
        placeCardBetweenStations(card, s.station);
        return;
      }
    }
  });
}

/* ============================
   ⑩ 時刻表
============================ */

function initTimetableStationList() {
  const sel = document.getElementById("timetable-station");
  sel.innerHTML = "";

  const allStations = [...stations_main_up, ...stations_sagami_up, ...stations_takao_up];
  const unique = [...new Set(allStations)];

  unique.forEach(st => {
    const op = document.createElement("option");
    op.value = st;
    op.textContent = st;
    sel.appendChild(op);
  });
}
initTimetableStationList();

document.getElementById("timetable-station").onchange = renderTimetable;

function renderTimetable() {
  const st = document.getElementById("timetable-station").value;
  const body = document.getElementById("timetable-body");
  body.innerHTML = "";

  const list = [];

  trains.forEach(t => {
    t.stops.forEach(s => {
      if (s.station === st) {
        list.push({
          number: t.number,
          type: t.type,
          dest: t.dest,
          arrive: s.arrive,
          depart: s.depart,
          pass: s.pass
        });
      }
    });
  });

  list.sort((a, b) => (a.arrive || a.depart || "").localeCompare(b.arrive || b.depart || ""));

  list.forEach(l => {
    const div = document.createElement("div");
    div.className = "timetable-row";

    const time = l.pass
      ? `${l.arrive || l.depart} 通過`
      : `${l.arrive || ""} - ${l.depart || ""}`;

    div.innerHTML = `
      <div class="tt-time">${time}</div>
      <div class="tt-num">${l.number}</div>
      <div class="tt-type">${l.type}</div>
      <div class="tt-dest">${l.dest}</div>
    `;

    body.appendChild(div);
  });
}

/* ============================
   ⑪ ログイン・クラウド保存
============================ */

document.getElementById("toggle-pass").onclick = () => {
  const input = document.getElementById("login-password");
  input.type = input.type === "password" ? "text" : "password";
};

document.getElementById("btn-login").onclick = () => {
  const pw = document.getElementById("login-password").value.trim();

  if (pw === "0829") {
    isAdmin = true;
    alert("管理者モードになりました");
    document.querySelectorAll(".admin-only").forEach(e => e.style.display = "");
  } else {
    alert("パスワードが違います");
  }
};

document.getElementById("btn-save-cloud").onclick = async () => {
  if (!isAdmin) return alert("管理者のみ");
  await db.collection("trains").doc("data").set({ trains });
  alert("クラウドに保存しました");
};

document.getElementById("btn-load-cloud").onclick = async () => {
  const doc = await db.collection("trains").doc("data").get();
  if (doc.exists) {
    trains = doc.data().trains;
    saveLocal();
    renderTrainList();
    renderVerticalLine();
    updateTrainPosition();
    alert("クラウドから受信しました");
  } else {
    alert("クラウドにデータがありません");
  }
};
