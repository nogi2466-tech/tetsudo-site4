/* ============================
   Firebase 初期化
============================ */
const firebaseConfig = {
  apiKey: "AIzaSyAxJVAX7CIK4U21QxL20n4yxagcI9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.firebasestorage.app",
  messagingSenderId: "1066598780695",
  appId: "1:1066598780695:web:e682df702e58caaaedc792"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ============================
   駅データ
============================ */
const stationsMain = [
  {name:"京王八王子",tracks:3},{name:"北野",tracks:3},{name:"長沼",tracks:2},
  {name:"平山城址公園",tracks:2},{name:"南平",tracks:2},{name:"高幡不動",tracks:4},
  {name:"百草園",tracks:2},{name:"聖蹟桜ヶ丘",tracks:3},{name:"中河原",tracks:2},
  {name:"分倍河原",tracks:2},{name:"府中",tracks:4},{name:"東府中",tracks:3},
  {name:"多磨霊園",tracks:2},{name:"武蔵野台",tracks:2},{name:"飛田給",tracks:2},
  {name:"西調布",tracks:2},{name:"調布",tracks:4},{name:"布田",tracks:2},
  {name:"国領",tracks:2},{name:"柴崎",tracks:2},{name:"つつじヶ丘",tracks:3},
  {name:"仙川",tracks:2},{name:"千歳烏山",tracks:4},{name:"芦花公園",tracks:2},
  {name:"八幡山",tracks:3},{name:"上北沢",tracks:2},{name:"桜上水",tracks:2},
  {name:"下高井戸",tracks:2},{name:"明大前",tracks:4},{name:"代田橋",tracks:2},
  {name:"笹塚",tracks:2},{name:"新宿",tracks:4}
];

const stationsSagami = [
  {name:"橋本",tracks:3},{name:"多摩境",tracks:2},{name:"南大沢",tracks:2},
  {name:"京王堀之内",tracks:2},{name:"京王多摩センター",tracks:3},
  {name:"京王永山",tracks:2},{name:"若葉台",tracks:2},{name:"稲城",tracks:2},
  {name:"京王よみうりランド",tracks:2},{name:"京王稲田堤",tracks:2},
  {name:"京王多摩川",tracks:2},{name:"調布",tracks:4}
];

/* ============================
   変数
============================ */
let trains = [];
let currentDirection = "up";
let isAdmin = false;
let editingIndex = null;

/* ============================
   共通関数
============================ */
function parseTimeToDate(hm){
  if(!hm) return null;
  const [h,m] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(h,m,0,0);
  return d;
}

function getTypeClass(type){
  switch(type){
    case "各停": return "type-local";
    case "快速": return "type-rapid";
    case "区急": return "type-semi-exp";
    case "急行": return "type-exp";
    case "特急": return "type-ltd-exp";
    default: return "";
  }
}

/* ============================
   メニュー切替
============================ */
document.getElementById("menu-btn").onclick = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display === "flex") ? "none" : "flex";
};

document.querySelectorAll("nav a").forEach(a => {
  a.onclick = e => {
    e.preventDefault();
    document.querySelectorAll("nav a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");

    const id = a.dataset.target;
    document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };
});

/* ============================
   列車一覧テーブル描画
============================ */
function renderTrainTable(){
  const tbody = document.querySelector("#train-table tbody");
  tbody.innerHTML = "";

  const kw = document.getElementById("search-number").value.trim();
  let list = trains;

  if(kw) list = list.filter(t => String(t.number).includes(kw));

  list.sort((a,b) => a.number - b.number);

  list.forEach((t,i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${t.number}</td>
      <td class="${getTypeClass(t.type)}">${t.type}</td>
      <td>${t.line === "main" ? "京王線" : "相模原線"}</td>
      <td>${t.direction === "up" ? "上り" : "下り"}</td>
      <td>${t.start}</td>
      <td>${t.startTime}</td>
      <td>${t.end}</td>
      <td>${t.endTime}</td>
      <td class="admin-only">
        <button class="edit-btn" data-i="${i}">編集</button>
        <button class="delete-btn" data-i="${i}">削除</button>
      </td>
    `;

    tr.onclick = () => showTrainDetail(t);
    tbody.appendChild(tr);
  });

  if(isAdmin){
    document.querySelectorAll("#train-table .admin-only").forEach(e => e.style.display = "table-cell");
  }

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const i = Number(btn.dataset.i);
      const t = trains[i];
      editingIndex = i;

      document.getElementById("add-number").value = t.number;
      document.getElementById("add-type").value = t.type;
      document.getElementById("add-line").value = t.line;
      document.getElementById("add-direction").value = t.direction;
      document.getElementById("add-dest").value = t.destination;

      const list = document.getElementById("stop-list");
      list.innerHTML = "";

      t.stops.forEach(s => {
        const div = createStopInput(t.line);
        div.querySelector(".stop-station").value = s.station;
        div.querySelector(".stop-arrive").value = s.arrive || "";
        div.querySelector(".stop-depart").value = s.depart || "";
        div.querySelector(".stop-track").value = s.track || "1";
        div.querySelector(".stop-pass").checked = !!s.pass;
        list.appendChild(div);
      });

      alert("編集モードになりました");
    };
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const i = Number(btn.dataset.i);
      if(confirm("削除しますか？")){
        trains.splice(i,1);
        renderTrainTable();
        updateLocation();
      }
    };
  });
}

document.getElementById("search-number").oninput = renderTrainTable;

/* ============================
   列車詳細表示
============================ */
function showTrainDetail(t){
  document.querySelector('nav a[data-target="train-detail"]').click();

  document.getElementById("detail-basic").innerHTML = `
    <p><b>列車番号:</b> ${t.number}</p>
    <p><b>種別:</b> <span class="${getTypeClass(t.type)}">${t.type}</span></p>
    <p><b>路線:</b> ${t.line === "main" ? "京王線" : "相模原線"}</p>
    <p><b>方向:</b> ${t.direction === "up" ? "上り" : "下り"}</p>
    <p><b>行き先:</b> ${t.destination}</p>
  `;

  const tbody = document.getElementById("detail-stops");
  tbody.innerHTML = "";

  t.stops.forEach(s => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arrive || ""}</td>
      <td>${s.depart || ""}</td>
      <td>${s.track || ""}</td>
      <td>${s.pass ? "通過" : ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ============================
   停車駅入力フォーム生成
============================ */
function createStopInput(line){
  const div = document.createElement("div");
  const sts = (line === "sagami" ? stationsSagami : stationsMain);

  div.style.marginBottom = "6px";

  div.innerHTML = `
    <select class="stop-station big-select">
      ${sts.map(s => `<option>${s.name}</option>`).join("")}
    </select>
    <input class="stop-arrive big-input" placeholder="到着 (HH:MM)">
    <input class="stop-depart big-input" placeholder="発車 (HH:MM)">
    <select class="stop-track big-select"></select>
    <label style="font-size:13px;display:block;margin-top:2px;">
      <input type="checkbox" class="stop-pass"> 通過
    </label>
  `;

  const stSel = div.querySelector(".stop-station");
  const trSel = div.querySelector(".stop-track");

  function updateTracks(){
    const st = sts.find(s => s.name === stSel.value);
    trSel.innerHTML = "";
    const n = st ? st.tracks : 1;
    for(let i=1;i<=n;i++){
      trSel.innerHTML += `<option>${i}</option>`;
    }
  }

  stSel.onchange = updateTracks;
  updateTracks();

  return div;
}

document.getElementById("btn-add-stop").onclick = () => {
  if(!isAdmin) return;
  const line = document.getElementById("add-line").value;
  document.getElementById("stop-list").appendChild(createStopInput(line));
};
/* ============================
   現在位置カード生成（四角いカード）
============================ */
function createStatusCard(train, text){
  const card = document.createElement("div");
  card.className = "train-card " + getTypeClass(train.type);

  card.innerHTML = `
    <div class="train-number">${train.number}</div>
    <div class="train-type">${train.type} ${train.destination}</div>
    <div class="train-status">${text}</div>
  `;

  card.onclick = () => showTrainDetail(train);
  return card;
}

/* ============================
   停車／通過／走行 判定ロジック
============================ */
function getTrainStatusAtStation(train, stationIndex, now){
  const stops = train.stops;
  const s = stops[stationIndex];
  const next = stops[stationIndex + 1];

  const arrive = parseTimeToDate(s.arrive);
  const depart = parseTimeToDate(s.depart);
  const pass = s.pass === true;

  /* ---- 1. 停車中 ---- */
  if(arrive && depart && now >= arrive && now <= depart){
    return { type: "停車", station: s.station };
  }

  /* ---- 2. 到着＝発車（同時） ---- */
  if(arrive && depart && s.arrive === s.depart){
    const diff = (now - arrive) / 1000;

    if(diff >= 0 && diff < 30){
      return { type: "停車", station: s.station };
    }

    if(next){
      const nextTime = parseTimeToDate(next.arrive || next.depart);
      if(nextTime && now < nextTime){
        return { type: "走行", from: s.station, to: next.station };
      }
    }
  }

  /* ---- 3. 通過 ---- */
  if(pass && arrive){
    const diff = (now - arrive) / 1000;

    if(diff >= 0 && diff < 10){
      return { type: "通過", station: s.station };
    }

    if(next){
      const nextTime = parseTimeToDate(next.arrive || next.depart);
      if(nextTime && now < nextTime){
        return { type: "走行", from: s.station, to: next.station };
      }
    }
  }

  /* ---- 4. 駅間走行 ---- */
  if(next){
    const d = parseTimeToDate(s.depart || s.arrive);
    const nextTime = parseTimeToDate(next.arrive || next.depart);

    if(d && nextTime && now > d && now < nextTime){
      return { type: "走行", from: s.station, to: next.station };
    }
  }

  return null;
}
/* ============================
   路線図への描画（四角いカード版）
============================ */
function updateLocation(){
  const now = new Date();
  const nowStr = now.toTimeString().slice(0,5);
  document.getElementById("now-time").textContent = "現在時刻: " + nowStr;

  renderLine("main", stationsMain, "line-main-body", now);
  renderLine("sagami", stationsSagami, "line-sagami-body", now);
}

function renderLine(lineId, stations, containerId, now){
  let order = stations.map(s => s.name);
  if(currentDirection === "down") order = order.slice().reverse();

  const box = document.getElementById(containerId);
  box.innerHTML = "";

  /* 駅ブロック生成 */
  order.forEach((stationName, i) => {
    const block = document.createElement("div");
    block.className = "station-block";

    block.innerHTML = `
      <div class="station-node"></div>
      <div class="station-name">${stationName}</div>
      <div class="train-list" id="${containerId}-tl-${i}"></div>
    `;

    box.appendChild(block);

    if(i < order.length - 1){
      const seg = document.createElement("div");
      seg.className = "line-segment";
      box.appendChild(seg);
    }
  });

  /* 路線の列車を抽出 */
  const listTrains = trains.filter(
    t => t.line === lineId && t.direction === currentDirection
  );

  /* 各列車の現在位置を判定してカード配置 */
  listTrains.forEach(train => {
    const stops = train.stops;

    for(let i = 0; i < stops.length; i++){
      const status = getTrainStatusAtStation(train, i, now);
      if(!status) continue;

      /* 停車中 */
      if(status.type === "停車"){
        const idx = order.indexOf(status.station);
        if(idx >= 0){
          const list = document.getElementById(`${containerId}-tl-${idx}`);
          list.appendChild(createStatusCard(train, `${status.station} 停車中`));
        }
        return;
      }

      /* 通過中 */
      if(status.type === "通過"){
        const idx = order.indexOf(status.station);
        if(idx >= 0){
          const list = document.getElementById(`${containerId}-tl-${idx}`);
          list.appendChild(createStatusCard(train, `${status.station} 通過中`));
        }
        return;
      }

      /* 駅間走行中 */
      if(status.type === "走行"){
        const idx = order.indexOf(status.from);
        if(idx >= 0){
          const list = document.getElementById(`${containerId}-tl-${idx}`);
          list.appendChild(
            createStatusCard(train, `${status.from} → ${status.to} 走行中`)
          );
        }
        return;
      }
    }
  });
}

/* 上り・下り切替 */
document.getElementById("btn-up").onclick = () => {
  currentDirection = "up";
  updateLocation();
};
document.getElementById("btn-down").onclick = () => {
  currentDirection = "down";
  updateLocation();
};

/* ============================
   クラウド保存・受信
============================ */
document.getElementById("btn-save-cloud").onclick = async () => {
  if(!isAdmin){
    alert("管理者のみ保存できます");
    return;
  }
  await db.collection("keio-trains").doc("data").set({ trains });
  alert("クラウドに保存しました");
};

document.getElementById("btn-load-cloud").onclick = async () => {
  const doc = await db.collection("keio-trains").doc("data").get();
  if(doc.exists){
    trains = doc.data().trains || [];
    renderTrainTable();
    updateLocation();
    alert("クラウドから受信しました");
  }else{
    alert("クラウドにデータがありません");
  }
};

/* ============================
   ログイン
============================ */
document.getElementById("toggle-pass").onclick = () => {
  const pw = document.getElementById("login-password");
  pw.type = (pw.type === "password") ? "text" : "password";
};

document.getElementById("btn-login").onclick = () => {
  const pw = document.getElementById("login-password").value;
  if(pw === "admin123"){
    isAdmin = true;
    document.getElementById("login-status").textContent = "ログイン済み（管理者）";

    document.querySelectorAll(".admin-only").forEach(e => {
      e.style.display = "inline-block";
    });

    renderTrainTable();
  }else{
    alert("パスワードが違います");
  }
};

/* ============================
   初期ロード
============================ */
window.onload = () => {
  renderTrainTable();
  updateLocation();
  setInterval(updateLocation, 30000);
};
