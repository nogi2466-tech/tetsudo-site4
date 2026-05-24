<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>列車管理システム</title>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f5f5f5;
}

/* ヘッダー */
header {
  background: #1f2933;
  color: white;
  padding: 10px 16px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ハンバーガー */
#menu-btn {
  font-size: 24px;
  cursor: pointer;
  display: none;
}

/* メニュー */
nav {
  background: #111827;
  display: flex;
  gap: 16px;
  padding: 8px 20px;
  flex-wrap: wrap;
}

nav a {
  color: #d1d5db;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 4px;
}

nav a.active {
  background: #2563eb;
  color: white;
}

/* ページ */
main {
  padding: 20px;
}

section {
  display: none;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

section.active {
  display: block;
}

/* テーブル */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
}

th {
  background: #2563eb;
  color: white;
}

/* 管理者専用 */
.admin-only {
  display: none;
}

/* 種別色 */
.type-local { color: #6b7280; }
.type-rapid { color: #2563eb; }
.type-semi-exp { color: #facc15; }
.type-exp { color: #22c55e; }
.type-ltd-exp { color: #ef4444; }

/* 各駅時刻表（駅ごとに横に広い枠） */
.station-row {
  display: flex;
  margin-bottom: 6px;
}
.station-name {
  width: 120px;
  font-weight: bold;
}
.station-trains {
  flex-grow: 1;
  min-height: 32px;
  border: 1px solid #ccc;
  padding: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.train-chip {
  padding: 2px 6px;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
}

/* スマホ対応 */
@media (max-width: 600px) {
  #menu-btn { display: block; }
  nav { display: none; flex-direction: column; }
  input, select, button { width: 100%; }
}
</style>
</head>

<body>

<header>
  <span>列車管理システム</span>
  <div id="menu-btn">☰</div>
</header>

<nav id="menu">
  <a href="#" class="active" data-target="train-list">列車一覧</a>
  <a href="#" data-target="train-detail">列車詳細</a>
  <a href="#" data-target="location">現在位置</a>
  <a href="#" data-target="settings">設定</a>
</nav>

<main>

<!-- 列車一覧 -->
<section id="train-list" class="active">
  <h2>列車一覧</h2>
  <input id="search-number" placeholder="列車番号で検索">

  <table id="train-table">
    <thead>
      <tr>
        <th>列車番号</th>
        <th>種別</th>
        <th>方向</th>
        <th>始発</th>
        <th>発車</th>
        <th>終着</th>
        <th>到着</th>
        <th class="admin-only">操作</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</section>

<!-- 列車詳細 -->
<section id="train-detail">
  <h2>列車詳細</h2>
  <div id="detail-basic"></div>

  <h3>各駅時刻</h3>
  <table>
    <thead>
      <tr>
        <th>駅名</th>
        <th>到着</th>
        <th>発車</th>
        <th>番線</th>
      </tr>
    </thead>
    <tbody id="detail-stops"></tbody>
  </table>
</section>

<!-- 現在位置 -->
<section id="location">
  <h2>現在位置</h2>

  <button id="btn-up">上り</button>
  <button id="btn-down">下り</button>

  <p id="now-time"></p>

  <h3>各駅ごとの列車位置</h3>
  <div id="station-rows"></div>
</section>

<!-- 設定 -->
<section id="settings">
  <h2>設定</h2>

  <button id="btn-save-cloud">クラウドに保存</button>
  <button id="btn-load-cloud">クラウドから受信</button>

  <h3>管理者ログイン</h3>

  <div style="display:flex; gap:8px; max-width:320px;">
    <input id="login-password" type="password" inputmode="numeric" placeholder="パスワード">
    <button id="toggle-pass">👁</button>
  </div>

  <button id="btn-login">ログイン</button>
  <button id="btn-logout" class="admin-only">ログアウト</button>

  <p id="login-status"></p>

  <hr>

  <h3>列車追加（管理者のみ）</h3>

  <div id="train-add-area" class="admin-only">

    <input id="add-number" placeholder="列車番号">

    <select id="add-type">
      <option value="">種別を選択</option>
      <option value="各停">各停</option>
      <option value="快速">快速</option>
      <option value="区急">区急</option>
      <option value="急行">急行</option>
      <option value="特急">特急</option>
    </select>

    <select id="add-direction">
      <option value="up">上り</option>
      <option value="down">下り</option>
    </select>

    <input id="add-dest" placeholder="行き先">

    <h4>停車駅</h4>
    <div id="stop-list"></div>
    <button id="btn-add-stop">停車駅を追加</button>

    <button id="btn-save-train">列車を保存</button>
  </div>
</section>

</main>
<script>
/* ==========================
   Firebase 初期化
========================== */
const firebaseConfig = {
  apiKey: "AIzaSyAxJVAX7CIK4U21QxL20n4yxagcI9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.firebasestorage.app",
  messagingSenderId: "1066598780695",
  appId: "1:1066598780695:web:e682df702e58caaaedc792",
  measurementId: "G-CKP42ZF65W"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ==========================
   変数
========================== */
let trains = [];
let currentDirection = "up";
let isAdmin = false;

const stations = [
  "新宿","初台","幡ヶ谷","笹塚","代田橋",
  "明大前","下高井戸","桜上水","京王八王子"
];

/* ==========================
   種別 → 色クラス
========================== */
function getTypeClass(type) {
  switch (type) {
    case "各停": return "type-local";
    case "快速": return "type-rapid";
    case "区急": return "type-semi-exp";
    case "急行": return "type-exp";
    case "特急": return "type-ltd-exp";
    default: return "";
  }
}

/* ==========================
   ハンバーガーメニュー
========================== */
document.getElementById("menu-btn").addEventListener("click", () => {
  const menu = document.getElementById("menu");
  menu.style.display = (menu.style.display === "flex") ? "none" : "flex";
});

/* ==========================
   ナビ切り替え
========================== */
document.querySelectorAll("nav a").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();

    document.querySelectorAll("nav a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");

    const id = a.dataset.target;
    document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (window.innerWidth <= 600) {
      document.getElementById("menu").style.display = "none";
    }
  });
});

/* ==========================
   列車一覧
========================== */
function renderTrainTable() {
  const tbody = document.querySelector("#train-table tbody");
  tbody.innerHTML = "";

  const keyword = document.getElementById("search-number").value.trim();
  let list = trains;

  if (keyword !== "") {
    list = trains.filter(t => String(t.number).includes(keyword));
  }

  list.sort((a, b) => a.number - b.number);

  list.forEach((train, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${train.number}</td>
      <td class="${getTypeClass(train.type)}">${train.type}</td>
      <td>${train.direction === "up" ? "上り" : "下り"}</td>
      <td>${train.start}</td>
      <td>${train.startTime}</td>
      <td>${train.end}</td>
      <td>${train.endTime}</td>
      <td class="admin-only"><button class="delete-btn" data-index="${index}">削除</button></td>
    `;

    tr.addEventListener("click", () => showTrainDetail(train));
    tbody.appendChild(tr);
  });

  if (isAdmin) {
    document.querySelectorAll("#train-table .admin-only").forEach(el => {
      el.style.display = "table-cell";
    });
  }

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = btn.dataset.index;
      if (confirm("削除しますか？")) {
        trains.splice(index, 1);
        renderTrainTable();
        updateLocation();
      }
    });
  });
}

document.getElementById("search-number").addEventListener("input", renderTrainTable);

/* ==========================
   列車詳細
========================== */
function showTrainDetail(train) {
  document.querySelector('nav a[data-target="train-detail"]').click();

  document.getElementById("detail-basic").innerHTML = `
    <p><strong>列車番号:</strong> ${train.number}</p>
    <p><strong>種別:</strong> <span class="${getTypeClass(train.type)}">${train.type}</span></p>
    <p><strong>方向:</strong> ${train.direction === "up" ? "上り" : "下り"}</p>
    <p><strong>行き先:</strong> ${train.destination}</p>
  `;

  const tbody = document.getElementById("detail-stops");
  tbody.innerHTML = "";
  train.stops.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arrive}</td>
      <td>${s.depart}</td>
      <td>${s.track}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ==========================
   停車駅追加
========================== */
document.getElementById("btn-add-stop").addEventListener("click", () => {
  if (!isAdmin) return;

  const div = document.createElement("div");
  div.style.marginBottom = "8px";

  div.innerHTML = `
    <select class="stop-station">
      ${stations.map(s => `<option value="${s}">${s}</option>`).join("")}
    </select>
    <input class="stop-arrive" placeholder="到着 (例: 09:15)">
    <input class="stop-depart" placeholder="発車 (例: 09:17)">
    <input class="stop-track" placeholder="番線 (例: 3)">
  `;

  document.getElementById("stop-list").appendChild(div);
});

/* ==========================
   列車追加
========================== */
document.getElementById("btn-save-train").addEventListener("click", () => {
  if (!isAdmin) {
    alert("管理者パスワードを入力してください");
    return;
  }

  const stops = [];
  document.querySelectorAll("#stop-list div").forEach(div => {
    const station = div.querySelector(".stop-station").value;
    const arrive = div.querySelector(".stop-arrive").value;
    const depart = div.querySelector(".stop-depart").value;
    const track = div.querySelector(".stop-track").value;

    if (station && (arrive || depart)) {
      stops.push({ station, arrive, depart, track });
    }
  });

  if (stops.length === 0) {
    alert("停車駅を1つ以上入力してください");
    return;
  }

  const newTrain = {
    number: Number(document.getElementById("add-number").value),
    type: document.getElementById("add-type").value,
    destination: document.getElementById("add-dest").value,
    direction: document.getElementById("add-direction").value,
    start: stops[0].station,
    startTime: stops[0].depart || stops[0].arrive,
    end: stops[stops.length - 1].station,
    endTime: stops[stops.length - 1].arrive || stops[stops.length - 1].depart,
    stops
  };

  trains.push(newTrain);
  renderTrainTable();
  updateLocation();
  alert("列車を追加しました");
});

/* ==========================
   現在位置（駅ごとに表示）
========================== */
document.getElementById("btn-up").addEventListener("click", () => {
  currentDirection = "up";
  updateLocation();
});

document.getElementById("btn-down").addEventListener("click", () => {
  currentDirection = "down";
  updateLocation();
});

function updateLocation() {
  const now = new Date();
  const nowStr = now.toTimeString().slice(0,5);
  document.getElementById("now-time").textContent = "現在時刻: " + nowStr;

  const stationMap = {};
  stations.forEach(st => stationMap[st] = []);

  trains
    .filter(t => t.direction === currentDirection)
    .forEach(train => {
      const stops = train.stops;

      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        const arrive = s.arrive;
        const depart = s.depart;

        if (nowStr === arrive || nowStr === depart) {
          stationMap[s.station].push({
            label: `${train.number} (${train.type}) 停車中`,
            type: train.type
          });
          return;
        }

        if (i < stops.length - 1) {
          const next = stops[i + 1];
          if (nowStr > depart && nowStr < next.arrive) {
            stationMap[s.station].push({
              label: `${train.number} (${train.type}) → ${s.station}〜${next.station}`,
              type: train.type
            });
            return;
          }
        }
      }
    });

  const container = document.getElementById("station-rows");
  container.innerHTML = "";

  stations.forEach(st => {
    const row = document.createElement("div");
    row.className = "station-row";

    const nameDiv = document.createElement("div");
    nameDiv.className = "station-name";
    nameDiv.textContent = "● " + st;

    const trainsDiv = document.createElement("div");
    trainsDiv.className = "station-trains";

    stationMap[st].forEach(info => {
      const chip = document.createElement("div");
      chip.className = "train-chip " + getTypeClass(info.type);
      chip.textContent = info.label;
      trainsDiv.appendChild(chip);
    });

    row.appendChild(nameDiv);
    row.appendChild(trainsDiv);
    container.appendChild(row);
  });
}

setInterval(updateLocation, 30000);
updateLocation();

/* ==========================
   クラウド保存
========================== */
document.getElementById("btn-save-cloud").addEventListener("click", () => {
  db.collection("trainData").doc("main").set({ trains })
    .then(() => alert("クラウドに保存しました"))
    .catch(() => alert("保存に失敗しました"));
});

/* ==========================
   クラウド受信
========================== */
document.getElementById("btn-load-cloud").addEventListener("click", () => {
  db.collection("trainData").doc("main").get()
    .then(doc => {
      if (doc.exists) {
        trains = doc.data().trains || [];
        renderTrainTable();
        updateLocation();
        alert("クラウドから受信しました");
      } else {
        alert("クラウドにデータがありません");
      }
    })
    .catch(() => alert("受信に失敗しました"));
});

/* ==========================
   管理者ログイン（0829）
========================== */
document.getElementById("btn-login").addEventListener("click", () => {
  const pass = document.getElementById("login-password").value;

  if (pass === "0829") {
    isAdmin = true;
    document.getElementById("login-status").textContent = "管理者モード：ON";

    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "block";
    });

    document.querySelectorAll("#train-table .admin-only").forEach(el => {
      el.style.display = "table-cell";
    });

    alert("管理者として編集できるようになりました");
  } else {
    isAdmin = false;
    document.getElementById("login-status").textContent = "パスワードが違います";

    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "none";
    });
    document.querySelectorAll("#train-table .admin-only").forEach(el => {
      el.style.display = "none";
    });
  }
});

/* Enterキーでログイン */
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("btn-login").click();
  }
});

/* パスワード表示切替 */
document.getElementById("toggle-pass").addEventListener("click", () => {
  const input = document.getElementById("login-password");
  input.type = (input.type === "password") ? "text" : "password";
});

/* ==========================
   ログアウト
========================== */
document.getElementById("btn-logout").addEventListener("click", () => {
  isAdmin = false;
  alert("ログアウトしました");

  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = "none";
  });
  document.querySelectorAll("#train-table .admin-only").forEach(el => {
    el.style.display = "none";
  });

  document.getElementById("login-status").textContent = "ログアウト済み";
});
</script>

</body>
</html>
