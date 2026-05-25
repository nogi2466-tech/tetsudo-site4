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
   駅データ（番線は全駅 1〜2）
============================ */
function stationObj(name){
  return { name, tracks: 2 };
}

const stationsMain = [
  "京王八王子","北野","長沼","平山城址公園","南平","高幡不動",
  "百草園","聖蹟桜ヶ丘","中河原","分倍河原","府中","東府中",
  "多磨霊園","武蔵野台","飛田給","西調布","調布","布田",
  "国領","柴崎","つつじヶ丘","仙川","千歳烏山","芦花公園",
  "八幡山","上北沢","桜上水","下高井戸","明大前","代田橋",
  "笹塚","新宿"
].map(stationObj);

const stationsSagami = [
  "橋本","多摩境","南大沢","京王堀之内","京王多摩センター",
  "京王永山","若葉台","稲城","京王よみうりランド","京王稲田堤",
  "京王多摩川","調布"
].map(stationObj);

/* ============================
   変数
============================ */
let trains = [];
let currentDirection = "up";
let isAdmin = false;
let editingIndex = null;

/* ============================
   JST 現在時刻
============================ */
function nowJST(){
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function parseTimeToDate(hm){
  if(!hm) return null;
  const [h,m] = hm.split(":").map(Number);
  const d = nowJST();
  d.setHours(h,m,0,0);
  return d;
}

/* ============================
   種別カラー
============================ */
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
   ★ 各駅時刻表メニューの追加
============================ */
const timetableMenu = document.createElement("a");
timetableMenu.textContent = "各駅時刻表";
timetableMenu.dataset.target = "timetable";
document.querySelector("nav").appendChild(timetableMenu);
/* ============================
   停車駅入力フォーム生成
   ★ 上り/下りの駅順バグ修正済み
============================ */
function createStopInput(line){
  const div = document.createElement("div");

  const baseStations = (line === "sagami" ? stationsSagami : stationsMain);

  // ★ 正しい方向に修正
  // 上り → 新宿・調布方面（反転しない）
  // 下り → 八王子・橋本方面（反転する）
  const direction = document.getElementById("add-direction").value;
  const sts = (direction === "up" ? baseStations : baseStations.slice().reverse());

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
    for(let i=1;i<=st.tracks;i++){
      trSel.innerHTML += `<option>${i}</option>`;
    }
  }

  stSel.onchange = updateTracks;
  updateTracks();

  return div;
}

document.getElementById("btn-add-stop").onclick = () => {
  if(!isAdmin){
    alert("管理者のみ追加できます");
    return;
  }
  const line = document.getElementById("add-line").value;
  document.getElementById("stop-list").appendChild(createStopInput(line));
};

/* ============================
   列車保存（追加・編集）
   ★ ログイン後は自動で編集画面へ移動
============================ */
document.getElementById("btn-save-train").onclick = () => {
  if(!isAdmin){
    alert("管理者のみ保存できます");
    return;
  }

  const number = document.getElementById("add-number").value.trim();
  const type = document.getElementById("add-type").value;
  const line = document.getElementById("add-line").value;
  const direction = document.getElementById("add-direction").value;
  const dest = document.getElementById("add-dest").value.trim();

  if(!number || !dest){
    alert("列車番号と行き先は必須です");
    return;
  }

  const stopDivs = document.querySelectorAll("#stop-list > div");
  const stops = [];

  stopDivs.forEach(div => {
    stops.push({
      station: div.querySelector(".stop-station").value,
      arrive: div.querySelector(".stop-arrive").value,
      depart: div.querySelector(".stop-depart").value,
      track: div.querySelector(".stop-track").value,
      pass: div.querySelector(".stop-pass").checked
    });
  });

  const start = stops[0].station;
  const startTime = stops[0].depart || stops[0].arrive || "";
  const end = stops[stops.length - 1].station;
  const endTime = stops[stops.length - 1].arrive || stops[stops.length - 1].depart || "";

  const trainData = {
    number,
    type,
    line,
    direction,
    destination: dest,
    start,
    startTime,
    end,
    endTime,
    stops
  };

  if(editingIndex !== null){
    trains[editingIndex] = trainData;
    editingIndex = null;
    alert("列車を更新しました");
  }else{
    trains.push(trainData);
    alert("列車を追加しました");
  }

  renderTrainTable();
  updateLocation();

  // ★ 保存後に自動で「列車一覧」へ移動
  document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
  document.querySelector('nav a[data-target="train-list"]').classList.add("active");

  document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
  document.getElementById("train-list").classList.add("active");
};

/* ============================
   列車一覧テーブル描画
   ★ 詳細画面にも編集/削除ボタンを出す準備
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
    document.querySelectorAll("#train-table .admin-only").forEach(e => {
      e.style.display = "table-cell";
    });
  }

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if(!isAdmin){
        alert("管理者のみ編集できます");
        return;
      }

      const i = Number(btn.dataset.i);
      const t = trains[i];
      editingIndex = i;

      // ★ 編集画面へ自動移動
      document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
      document.querySelector('nav a[data-target="train-add"]').classList.add("active");

      document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
      document.getElementById("train-add").classList.add("active");

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
    };
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      if(!isAdmin){
        alert("管理者のみ削除できます");
        return;
      }

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
   現在位置カード生成（駅名なし）
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
   停車／通過／走行／終点 判定
============================ */
function getTrainStatusAtStation(train, stationIndex, now){
  const stops = train.stops;
  const s = stops[stationIndex];
  const next = stops[stationIndex + 1];

  const arrive = parseTimeToDate(s.arrive);
  const depart = parseTimeToDate(s.depart);
  const pass = s.pass === true;

  /* ---- 1. 通過判定（最優先） ---- */
  if(pass && arrive){
    const diff = (now - arrive) / 1000;
    if(diff >= 0 && diff < 10){
      return { type: "通過" };
    }
    if(next){
      const nextTime = parseTimeToDate(next.arrive || next.depart);
      if(nextTime && now < nextTime){
        return { type: "走行" };
      }
    }
  }

  /* ---- 2. 停車判定 ---- */
  if(arrive && depart && now >= arrive && now <= depart){
    return { type: "停車" };
  }

  /* ---- 3. 到着＝発車（同時） ---- */
  if(arrive && depart && s.arrive === s.depart){
    const diff = (now - arrive) / 1000;
    if(diff >= 0 && diff < 30){
      return { type: "停車" };
    }
    if(next){
      const nextTime = parseTimeToDate(next.arrive || next.depart);
      if(nextTime && now < nextTime){
        return { type: "走行" };
      }
    }
  }

  /* ---- 4. 駅間走行 ---- */
  if(next){
    const d = parseTimeToDate(s.depart || s.arrive);
    const nextTime = parseTimeToDate(next.arrive || next.depart);
    if(d && nextTime && now > d && now < nextTime){
      return { type: "走行" };
    }
  }

  /* ---- 5. 終点駅（30秒後に消す） ---- */
  if(!next && arrive){
    const diff = (now - arrive) / 1000;
    if(diff >= 0 && diff < 30){
      return { type: "停車" };
    } else {
      return { type: "終了" };
    }
  }

  return null;
}
/* ============================
   路線図描画（終点処理対応）
============================ */
function updateLocation(){
  const now = nowJST();
  const nowStr = now.toTimeString().slice(0,5);
  document.getElementById("now-time").textContent = "現在時刻: " + nowStr;

  renderLine("main", stationsMain, "line-main-body", now);
  renderLine("sagami", stationsSagami, "line-sagami-body", now);
}

function renderLine(lineId, stations, containerId, now){
  let order = stations.map(s => s.name);

  // ★ 上り＝新宿/調布方面 → そのまま
  // ★ 下り＝八王子/橋本方面 → 反転
  if(currentDirection === "down") order = order.slice().reverse();

  const box = document.getElementById(containerId);
  box.innerHTML = "";

  // 駅ブロック生成
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

  // この路線・方向の列車だけ抽出
  const listTrains = trains.filter(
    t => t.line === lineId && t.direction === currentDirection
  );

  // 各列車の現在位置を描画
  listTrains.forEach(train => {
    const stops = train.stops;

    for(let i = 0; i < stops.length; i++){
      const status = getTrainStatusAtStation(train, i, now);
      if(!status) continue;

      /* 終点 → 表示しない */
      if(status.type === "終了"){
        return;
      }

      /* 停車中 */
      if(status.type === "停車"){
        const idx = order.indexOf(stops[i].station);
        if(idx >= 0){
          document.getElementById(`${containerId}-tl-${idx}`)
            .appendChild(createStatusCard(train, "停車中"));
        }
        return;
      }

      /* 通過中 */
      if(status.type === "通過"){
        const idx = order.indexOf(stops[i].station);
        if(idx >= 0){
          document.getElementById(`${containerId}-tl-${idx}`)
            .appendChild(createStatusCard(train, "通過中"));
        }
        return;
      }

      /* 走行中（駅名なし） */
      if(status.type === "走行"){
        const idx = order.indexOf(stops[i].station);
        if(idx >= 0){
          document.getElementById(`${containerId}-tl-${idx}`)
            .appendChild(createStatusCard(train, "走行中"));
        }
        return;
      }
    }
  });
}

/* ============================
   上り・下り切替
============================ */
document.getElementById("btn-up").onclick = () => {
  currentDirection = "up";
  updateLocation();
};
document.getElementById("btn-down").onclick = () => {
  currentDirection = "down";
  updateLocation();
};
/* ============================
   ★ 各駅時刻表：駅リスト生成
============================ */
function renderTimetableStationList(){
  const select = document.getElementById("timetable-station");
  select.innerHTML = "";

  const allStations = [
    ...stationsMain.map(s => s.name),
    ...stationsSagami.map(s => s.name)
  ];

  allStations.forEach(st => {
    const op = document.createElement("option");
    op.value = st;
    op.textContent = st;
    select.appendChild(op);
  });

  select.onchange = () => {
    renderTimetable(select.value);
  };
}

/* ============================
   ★ 各駅時刻表：データ生成
============================ */
function generateTimetableData(station){
  const table = {}; // { "06": [ {min, type, dest}, ... ] }

  trains.forEach(train => {
    train.stops.forEach(stop => {
      if(stop.station !== station) return;
      if(stop.pass) return; // 通過は表示しない

      const time = stop.depart || stop.arrive;
      if(!time) return;

      const [h, m] = time.split(":");
      if(!table[h]) table[h] = [];

      table[h].push({
        min: Number(m),
        type: train.type,
        dest: train.destination
      });
    });
  });

  // 分順に並べる
  Object.keys(table).forEach(h => {
    table[h].sort((a,b) => a.min - b.min);
  });

  return table;
}

/* ============================
   ★ 各駅時刻表：描画
============================ */
function renderTimetable(station){
  const body = document.getElementById("timetable-body");
  body.innerHTML = "";

  const data = generateTimetableData(station);

  const hours = Object.keys(data).sort((a,b) => Number(a) - Number(b));

  hours.forEach(h => {
    const row = document.createElement("div");
    row.className = "timetable-row";

    let html = `<div class="timetable-hour">${h}</div>`;

    // 00〜59分を横に並べる
    for(let m = 0; m < 60; m++){
      const item = data[h].find(x => x.min === m);

      if(item){
        html += `
          <div class="timetable-cell ${getTypeClass(item.type)}">
            ${String(m).padStart(2,"0")}
            <div class="timetable-dest">${item.dest}</div>
          </div>
        `;
      }else{
        html += `<div class="timetable-cell empty"></div>`;
      }
    }

    row.innerHTML = html;
    body.appendChild(row);
  });
}
/* ============================
   ★ 列車詳細画面（編集/削除ボタン追加）
============================ */
function showTrainDetail(train){
  const box = document.getElementById("train-detail-box");
  box.innerHTML = "";

  let html = `
    <h3>${train.number}（${train.type}）</h3>
    <p>行き先：${train.destination}</p>
    <p>路線：${train.line === "main" ? "京王線" : "相模原線"}</p>
    <p>方向：${train.direction === "up" ? "上り" : "下り"}</p>
    <h4>停車駅</h4>
  `;

  train.stops.forEach(s => {
    html += `
      <div class="detail-stop">
        <strong>${s.station}</strong>
        <span>${s.arrive || ""}</span> →
        <span>${s.depart || ""}</span>
        ${s.pass ? "<span class='pass-label'>通過</span>" : ""}
      </div>
    `;
  });

  // ★ 管理者なら編集/削除ボタンを表示
  if(isAdmin){
    html += `
      <button id="detail-edit-btn">編集</button>
      <button id="detail-delete-btn">削除</button>
    `;
  }

  box.innerHTML = html;

  // 編集ボタン
  if(isAdmin){
    document.getElementById("detail-edit-btn").onclick = () => {
      const index = trains.indexOf(train);
      if(index >= 0){
        editingIndex = index;

        // 編集画面へ移動
        document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
        document.querySelector('nav a[data-target="train-add"]').classList.add("active");

        document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
        document.getElementById("train-add").classList.add("active");

        // フォームに反映
        document.getElementById("add-number").value = train.number;
        document.getElementById("add-type").value = train.type;
        document.getElementById("add-line").value = train.line;
        document.getElementById("add-direction").value = train.direction;
        document.getElementById("add-dest").value = train.destination;

        const list = document.getElementById("stop-list");
        list.innerHTML = "";

        train.stops.forEach(s => {
          const div = createStopInput(train.line);
          div.querySelector(".stop-station").value = s.station;
          div.querySelector(".stop-arrive").value = s.arrive || "";
          div.querySelector(".stop-depart").value = s.depart || "";
          div.querySelector(".stop-track").value = s.track || "1";
          div.querySelector(".stop-pass").checked = !!s.pass;
          list.appendChild(div);
        });
      }
    };

    // 削除ボタン
    document.getElementById("detail-delete-btn").onclick = () => {
      const index = trains.indexOf(train);
      if(index >= 0 && confirm("削除しますか？")){
        trains.splice(index, 1);
        renderTrainTable();
        updateLocation();
        alert("削除しました");
      }
    };
  }
}

/* ============================
   ★ クラウド保存・読み込み
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
   ★ ログイン（パスワード 0829）
   → 成功したら自動で管理画面へ移動
============================ */
document.getElementById("toggle-pass").onclick = () => {
  const pw = document.getElementById("login-password");
  pw.type = (pw.type === "password") ? "text" : "password";
};

document.getElementById("btn-login").onclick = () => {
  const pw = document.getElementById("login-password").value;

  if(pw === "0829"){
    isAdmin = true;
    document.getElementById("login-status").textContent = "ログイン済み（管理者）";

    document.querySelectorAll(".admin-only").forEach(e => {
      e.style.display = "block";
    });

    // ★ ログイン成功 → 列車追加画面へ移動
    document.querySelectorAll("nav a").forEach(a => a.classList.remove("active"));
    document.querySelector('nav a[data-target="train-add"]').classList.add("active");

    document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
    document.getElementById("train-add").classList.add("active");

    renderTrainTable();
  }else{
    alert("パスワードが違います");
  }
};

/* ============================
   ★ 初期ロード（自動クラウド読み込み）
============================ */
window.onload = async () => {
  // 起動時にクラウドから自動読み込み
  const doc = await db.collection("keio-trains").doc("data").get();
  if(doc.exists){
    trains = doc.data().trains || [];
  }

  renderTrainTable();
  updateLocation();
  renderTimetableStationList();

  setInterval(updateLocation, 30000);
};
