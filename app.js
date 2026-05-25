/* =========================================
   グローバル変数
========================================= */
let trains = [];
let editingIndex = -1;
let isAdmin = false;

/* =========================================
   ページ切り替え
========================================= */
document.querySelectorAll("nav a").forEach(a => {
  a.onclick = () => {
    document.querySelectorAll("nav a").forEach(x => x.classList.remove("active"));
    a.classList.add("active");

    const target = a.dataset.target;
    document.querySelectorAll("main .page").forEach(p => p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  };
});

/* =========================================
   現在時刻表示
========================================= */
setInterval(() => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  document.getElementById("now-time").textContent = `現在時刻: ${hh}:${mm}`;
}, 1000);

/* =========================================
   停車駅入力欄を作る
========================================= */
function createStopInput(line){
  const div = document.createElement("div");
  div.innerHTML = `
    <select class="stop-station"></select>
    <input class="stop-arrive" placeholder="着">
    <input class="stop-depart" placeholder="発">
    <select class="stop-track">
      <option value="1">1番</option>
      <option value="2">2番</option>
      <option value="3">3番</option>
      <option value="4">4番</option>
    </select>
    <label><input type="checkbox" class="stop-pass">通過</label>
    <button class="stop-del">削除</button>
  `;

  const stationSelect = div.querySelector(".stop-station");
  const stations = (line === "main")
    ? ["新宿","笹塚","明大前","桜上水","千歳烏山","仙川","つつじヶ丘","調布"]
    : ["調布","京王多摩川","京王稲田堤","京王よみうりランド","稲城","若葉台","京王永山","京王多摩センター","京王堀之内","南大沢","多摩境","橋本"];

  stations.forEach(s => {
    const op = document.createElement("option");
    op.textContent = s;
    stationSelect.appendChild(op);
  });

  div.querySelector(".stop-del").onclick = () => div.remove();
  return div;
}

/* =========================================
   停車駅追加
========================================= */
document.getElementById("btn-add-stop").onclick = () => {
  const line = document.getElementById("add-line").value;
  document.getElementById("stop-list").appendChild(createStopInput(line));
};

/* 路線変更時に停車駅リセット */
document.getElementById("add-line").onchange = () => {
  document.getElementById("stop-list").innerHTML = "";
};

/* =========================================
   列車保存
========================================= */
document.getElementById("btn-save-train").onclick = () => {
  const number = document.getElementById("add-number").value;
  const type = document.getElementById("add-type").value;
  const line = document.getElementById("add-line").value;
  const direction = document.getElementById("add-direction").value;
  const dest = document.getElementById("add-dest").value;

  const stops = [];
  document.querySelectorAll("#stop-list > div").forEach(div => {
    stops.push({
      station: div.querySelector(".stop-station").value,
      arrive: div.querySelector(".stop-arrive").value,
      depart: div.querySelector(".stop-depart").value,
      track: div.querySelector(".stop-track").value,
      pass: div.querySelector(".stop-pass").checked
    });
  });

  const train = { number, type, line, direction, destination: dest, stops };

  if(editingIndex >= 0){
    trains[editingIndex] = train;
    editingIndex = -1;
  } else {
    trains.push(train);
  }

  renderTrainTable();
  alert("保存しました");
};

/* =========================================
   列車一覧
========================================= */
function renderTrainTable(){
  const tbody = document.querySelector("#train-table tbody");
  tbody.innerHTML = "";

  trains.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.number}</td>
      <td>${t.type}</td>
      <td>${t.line === "main" ? "京王線" : "相模原線"}</td>
      <td>${t.direction === "up" ? "上り" : "下り"}</td>
      <td>${t.stops[0]?.station || ""}</td>
      <td>${t.stops[0]?.depart || ""}</td>
      <td>${t.stops[t.stops.length - 1]?.station || ""}</td>
      <td>${t.stops[t.stops.length - 1]?.arrive || ""}</td>
      <td class="admin-only" style="display:${isAdmin ? "table-cell" : "none"};">
        <button onclick="editTrain(${i})">編集</button>
        <button onclick="deleteTrain(${i})">削除</button>
      </td>
    `;
    tr.onclick = () => showTrainDetail(t);
    tbody.appendChild(tr);
  });
}

/* =========================================
   列車詳細
========================================= */
function showTrainDetail(train){
  const box = document.getElementById("train-detail-box");
  box.innerHTML = `
    <h3>${train.number}（${train.type}）</h3>
    <p>行き先：${train.destination}</p>
    <p>路線：${train.line === "main" ? "京王線" : "相模原線"}</p>
    <p>方向：${train.direction === "up" ? "上り" : "下り"}</p>
    <h4>停車駅</h4>
  `;

  train.stops.forEach(s => {
    box.innerHTML += `
      <div>
        <strong>${s.station}</strong>
        ${s.arrive || ""} → ${s.depart || ""}
        ${s.pass ? "(通過)" : ""}
      </div>
    `;
  });
}

/* =========================================
   編集
========================================= */
function editTrain(i){
  const t = trains[i];
  editingIndex = i;

  document.querySelector('nav a[data-target="train-add"]').click();

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
    div.querySelector(".stop-arrive").value = s.arrive;
    div.querySelector(".stop-depart").value = s.depart;
    div.querySelector(".stop-track").value = s.track;
    div.querySelector(".stop-pass").checked = s.pass;
    list.appendChild(div);
  });
}

/* =========================================
   削除
========================================= */
function deleteTrain(i){
  if(confirm("削除しますか？")){
    trains.splice(i, 1);
    renderTrainTable();
  }
}

/* =========================================
   現在位置（縦型路線図）
========================================= */
function renderVerticalLine(){
  const stations = [
    "新宿","笹塚","明大前","桜上水","千歳烏山","仙川","つつじヶ丘","調布"
  ];

  const body = document.getElementById("line-main-body");
  body.innerHTML = "";

  stations.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "station-vertical";
    div.innerHTML = `
      <div class="station-name">${s}</div>
      ${i < stations.length - 1 ? '<div class="line-vertical"></div>' : ''}
    `;
    body.appendChild(div);
  });
}

/* =========================================
   現在位置更新
========================================= */
function updateTrainPosition(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const nowTime = `${hh}:${mm}`;

  // リセット
  document.querySelectorAll(".station-name").forEach(e => {
    e.style.background = "";
    e.textContent = e.textContent.replace(/（.*）/, "");
  });
  document.querySelectorAll(".line-vertical").forEach(e => {
    e.style.background = "";
    e.textContent = "";
  });

  trains.forEach(t => {
    for(let i = 0; i < t.stops.length; i++){
      const s = t.stops[i];

      // 停車中
      if(s.arrive === nowTime || s.depart === nowTime){
        highlightStation(s.station, t.number);
        return;
      }

      // 移動中
      if(i < t.stops.length - 1){
        const next = t.stops[i+1];

        if(s.depart < nowTime && nowTime < next.arrive){
          highlightBetween(s.station, next.station, t.number);
          return;
        }
      }
    }
  });
}

function highlightStation(station, number){
  document.querySelectorAll(".station-name").forEach(e => {
    if(e.textContent === station){
      e.style.background = "yellow";
      e.textContent = `${station}（${number}）`;
    }
  });
}

function highlightBetween(st1, st2, number){
  const items = document.querySelectorAll(".station-vertical");

  for(let i = 0; i < items.length - 1; i++){
    const name = items[i].querySelector(".station-name").textContent;
    if(name === st1){
      const line = items[i].querySelector(".line-vertical");
      line.style.background = "yellow";
      line.textContent = number;
    }
  }
}

/* =========================================
   時刻表
========================================= */
function renderTimetableStationList(){
  const select = document.getElementById("timetable-station");
  select.innerHTML = "";

  const allStations = [
    "新宿","笹塚","明大前","桜上水","千歳烏山","仙川","つつじヶ丘","調布",
    "京王多摩川","京王稲田堤","京王よみうりランド","稲城","若葉台",
    "京王永山","京王多摩センター","京王堀之内","南大沢","多摩境","橋本"
  ];

  allStations.forEach(s => {
    const op = document.createElement("option");
    op.textContent = s;
    select.appendChild(op);
  });

  select.onchange = renderTimetable;
}

function renderTimetable(){
  const station = document.getElementById("timetable-station").value;
  const body = document.getElementById("timetable-body");
  body.innerHTML = "";

  const table = {};

  trains.forEach(t => {
    t.stops.forEach(s => {
      if(s.station === station && s.depart){
        const [h, m] = s.depart.split(":");
        if(!table[h]) table[h] = [];
        table[h].push({ min: m, type: t.type, dest: t.destination });
      }
    });
  });

  for(let h = 0; h < 24; h++){
    const hh = String(h).padStart(2, "0");
    const row = document.createElement("div");
    row.className = "timetable-row";

    row.innerHTML = `<div class="timetable-hour">${hh}</div>`;

    for(let m = 0; m < 60; m++){
      const mm = String(m).padStart(2, "0");
      const cell = document.createElement("div");
      cell.className = "timetable-cell empty";

      if(table[hh]){
        const hit = table[hh].find(x => x.min === mm);
        if(hit){
          cell.className = "timetable-cell type-local";
          cell.innerHTML = `
            <div>${mm}</div>
            <div class="timetable-dest">${hit.dest}</div>
          `;
        }
      }

      row.appendChild(cell);
    }

    body.appendChild(row);
  }
}

/* =========================================
   ログイン（列車追加ページへ移動）
========================================= */
document.getElementById("toggle-pass").onclick = () => {
  const pw = document.getElementById("login-password");
  pw.type = (pw.type === "password") ? "text" : "password";
};

document.getElementById("btn-login").onclick = () => {
  const pw = document.getElementById("login-password").value;

  if(pw === "0829"){
    isAdmin = true;

    document.querySelectorAll(".admin-only").forEach(e => e.style.display = "block");

    alert("ログイン成功");

    // 自動で列車追加ページへ
    document.querySelector('nav a[data-target="train-add"]').click();

    renderTrainTable();
  } else {
    alert("パスワードが違います");
  }
};

/* =========================================
   初期ロード
========================================= */
window.onload = () => {
  renderTrainTable();
  renderTimetableStationList();
  renderVerticalLine();
  setInterval(updateTrainPosition, 1000);
};
