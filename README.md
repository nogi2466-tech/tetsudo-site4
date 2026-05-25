<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>列車管理システム（縦路線図版）</title>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<style>
/* ========================== 全体デザイン ========================== */
body { margin:0; font-family:system-ui,sans-serif; background:#f5f5f5; }
header {
  background:#1f2933; color:white; padding:10px 16px;
  font-size:18px; font-weight:bold; display:flex;
  justify-content:space-between; align-items:center;
}
#menu-btn { font-size:24px; cursor:pointer; display:none; }
nav {
  background:#111827; display:flex; gap:16px;
  padding:8px 20px; flex-wrap:wrap;
}
nav a {
  color:#d1d5db; text-decoration:none; padding:6px 10px; border-radius:4px;
}
nav a.active { background:#2563eb; color:white; }
main { padding:20px; }
section {
  display:none; background:white; padding:20px; border-radius:8px;
}
section.active { display:block; }
table { width:100%; border-collapse:collapse; margin-top:10px; }
th,td { padding:8px; border-bottom:1px solid #ddd; }
th { background:#2563eb; color:white; }
.admin-only { display:none; }
.big-input,.big-select {
  width:100%; padding:14px; font-size:18px; margin:6px 0;
  border-radius:8px; border:1px solid #ccc;
}
.cloud-btn {
  display:inline-block; padding:14px 22px; margin:8px 6px;
  font-size:18px; font-weight:bold; border-radius:10px;
  border:none; cursor:pointer; color:white;
}
.cloud-save { background:#16a34a; }
.cloud-load { background:#2563eb; }

/* ========================== 縦路線図 UI ========================== */
#line-container { width:100%; padding:10px; margin-top:20px; }
.station-block {
  display:flex; align-items:center; margin:10px 0;
}
.station-node {
  width:18px; height:18px; background:#d0006f;
  border-radius:50%; margin-right:10px;
}
.station-name {
  width:80px; font-weight:bold; font-size:15px;
}
.train-list {
  flex-grow:1; display:flex; flex-wrap:wrap; gap:6px;
}
.line-segment {
  width:4px; height:40px; background:#d0006f; margin-left:7px;
}

/* 列車カード */
.train-card {
  background:white; border:2px solid #d0006f;
  border-radius:6px; padding:4px 6px; font-size:12px;
  min-width:80px; display:flex; flex-direction:column;
}
.train-number { font-weight:bold; font-size:13px; }
.train-type { font-size:11px; opacity:0.9; }

/* 種別色 */
.type-local { color:#6b7280; }
.type-rapid { color:#2563eb; }
.type-semi-exp { color:#facc15; }
.type-exp { color:#22c55e; }
.type-ltd-exp { color:#ef4444; }

/* 駅間アニメーション */
.track-bar {
  height:6px; background:#ccc; margin:4px 0;
  border-radius:3px; position:relative;
}
.train-marker {
  width:14px; height:14px; background:red;
  border-radius:50%; position:absolute; top:-4px;
  transition:left 1s linear;
}

/* スマホ対応 */
@media (max-width:600px){
  #menu-btn{display:block;}
  nav{display:none; flex-direction:column;}
  input,select,button{width:100%;}
  .station-name{width:60px; font-size:13px;}
  .train-card{min-width:70px;}
}
</style>
</head>

<body>

<header>
  <span>列車管理システム（縦路線図）</span>
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
  <input id="search-number" class="big-input" placeholder="列車番号で検索">

  <table id="train-table">
    <thead>
      <tr>
        <th>列車番号</th><th>種別</th><th>方向</th>
        <th>始発</th><th>発車</th><th>終着</th><th>到着</th>
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
      <tr><th>駅名</th><th>到着</th><th>発車</th><th>番線</th></tr>
    </thead>
    <tbody id="detail-stops"></tbody>
  </table>
</section>

<!-- 現在位置 -->
<section id="location">
  <h2>現在位置（縦路線図）</h2>

  <button id="btn-up" class="cloud-btn cloud-load">上り</button>
  <button id="btn-down" class="cloud-btn cloud-load">下り</button>

  <p id="now-time"></p>
  <div id="line-container"></div>
</section>

<!-- 設定 -->
<section id="settings">
  <h2>設定</h2>

  <div style="margin-bottom:16px;">
    <button id="btn-save-cloud" class="cloud-btn cloud-save">☁ 保存</button>
    <button id="btn-load-cloud" class="cloud-btn cloud-load">⬇ 受信</button>
  </div>

  <h3>管理者ログイン</h3>
  <div style="display:flex; gap:8px; max-width:320px;">
    <input id="login-password" class="big-input" type="password" placeholder="パスワード">
    <button id="toggle-pass">👁</button>
  </div>

  <button id="btn-login" class="cloud-btn cloud-load">ログイン</button>
  <p id="login-status"></p>

  <hr>

  <h3>列車追加（管理者のみ）</h3>
  <div id="train-add-area" class="admin-only">

    <input id="add-number" class="big-input" placeholder="列車番号">

    <select id="add-type" class="big-select">
      <option value="">種別を選択</option>
      <option value="各停">各停</option>
      <option value="快速">快速</option>
      <option value="区急">区急</option>
      <option value="急行">急行</option>
      <option value="特急">特急</option>
    </select>

    <select id="add-direction" class="big-select">
      <option value="up">上り</option>
      <option value="down">下り</option>
    </select>

    <input id="add-dest" class="big-input" placeholder="行き先">

    <h4>停車駅</h4>
    <div id="stop-list"></div>
    <button id="btn-add-stop" class="cloud-btn cloud-load">停車駅を追加</button>

    <button id="btn-save-train" class="cloud-btn cloud-save">列車を保存</button>
  </div>
</section>

</main>

<!-- ========================== JavaScript（Part2で続く） ========================== -->
<script>
/* ========================== Firebase ========================== */
const firebaseConfig = {
  apiKey:"AIzaSyAxJVAX7CIK4U21QxL20n4yxagcI9dfItE",
  authDomain:"train-system-9622f.firebaseapp.com",
  projectId:"train-system-9622f",
  storageBucket:"train-system-9622f.firebasestorage.app",
  messagingSenderId:"1066598780695",
  appId:"1:1066598780695:web:e682df702e58caaaedc792"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ========================== データ ========================== */
let trains = [];

/* ★ 聖介の希望：京王線＋相模原線（上り方向） */
let stations = [
  { name:"京王八王子", tracks:3 },
  { name:"北野", tracks:3 },
  { name:"長沼", tracks:2 },
  { name:"平山城址公園", tracks:2 },
  { name:"南平", tracks:2 },
  { name:"高幡不動", tracks:4 },
  { name:"百草園", tracks:2 },
  { name:"聖蹟桜ヶ丘", tracks:3 },
  { name:"中河原", tracks:2 },
  { name:"分倍河原", tracks:2 },
  { name:"府中", tracks:4 },
  { name:"東府中", tracks:3 },
  { name:"多磨霊園", tracks:2 },
  { name:"武蔵野台", tracks:2 },
  { name:"飛田給", tracks:2 },
  { name:"西調布", tracks:2 },
  { name:"調布", tracks:4 },

  /* 相模原線（上り：橋本 → 調布） */
  { name:"橋本", tracks:3 },
  { name:"多摩境", tracks:2 },
  { name:"南大沢", tracks:2 },
  { name:"京王堀之内", tracks:2 },
  { name:"京王多摩センター", tracks:3 },
  { name:"京王永山", tracks:2 },
  { name:"若葉台", tracks:2 },
  { name:"稲城", tracks:2 },
  { name:"京王よみうりランド", tracks:2 },
  { name:"京王稲田堤", tracks:2 },
  { name:"京王多摩川", tracks:2 },

  /* 調布 → 新宿 */
  { name:"布田", tracks:2 },
  { name:"国領", tracks:2 },
  { name:"柴崎", tracks:2 },
  { name:"つつじヶ丘", tracks:3 },
  { name:"仙川", tracks:2 },
  { name:"千歳烏山", tracks:4 },
  { name:"芦花公園", tracks:2 },
  { name:"八幡山", tracks:3 },
  { name:"上北沢", tracks:2 },
  { name:"桜上水", tracks:2 },
  { name:"下高井戸", tracks:2 },
  { name:"明大前", tracks:4 },
  { name:"代田橋", tracks:2 },
  { name:"笹塚", tracks:2 },
  { name:"新宿", tracks:4 }
];

let currentDirection = "up";
let isAdmin = false;
let editingIndex = null;

/* ========================== 時刻変換 ========================== */
function toMinutes(t){
  if(!t) return null;
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
}

/* ========================== 種別色 ========================== */
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

/* ========================== メニュー ========================== */
document.getElementById("menu-btn").onclick = () => {
  const m = document.getElementById("menu");
  m.style.display = (m.style.display==="flex") ? "none" : "flex";
};

/* ========================== ナビ切替 ========================== */
document.querySelectorAll("nav a").forEach(a=>{
  a.onclick = e => {
    e.preventDefault();
    document.querySelectorAll("nav a").forEach(x=>x.classList.remove("active"));
    a.classList.add("active");

    const id = a.dataset.target;
    document.querySelectorAll("main section").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };
});

/* ========================== 列車一覧 ========================== */
function renderTrainTable(){
  const tbody = document.querySelector("#train-table tbody");
  tbody.innerHTML = "";

  trains.forEach((t,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.number}</td>
      <td class="${getTypeClass(t.type)}">${t.type}</td>
      <td>${t.direction==="up"?"上り":"下り"}</td>
      <td>${t.start}</td>
      <td>${t.startTime}</td>
      <td>${t.end}</td>
      <td>${t.endTime}</td>
      <td class="admin-only">
        <button class="edit-btn" data-i="${i}">編集</button>
        <button class="delete-btn" data-i="${i}">削除</button>
      </td>`;
    tr.onclick = () => showTrainDetail(t);
    tbody.appendChild(tr);
  });
}

/* ========================== 列車詳細 ========================== */
function showTrainDetail(t){
  document.querySelector('nav a[data-target="train-detail"]').click();

  document.getElementById("detail-basic").innerHTML = `
    <p><b>列車番号:</b> ${t.number}</p>
    <p><b>種別:</b> ${t.type}</p>
    <p><b>方向:</b> ${t.direction==="up"?"上り":"下り"}</p>
    <p><b>行き先:</b> ${t.destination}</p>
  `;

  const tbody = document.getElementById("detail-stops");
  tbody.innerHTML = "";
  t.stops.forEach(s=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.station}</td>
      <td>${s.arrive}</td>
      <td>${s.depart}</td>
      <td>${s.track}</td>`;
    tbody.appendChild(tr);
  });
}

/* ========================== 停車駅入力 ========================== */
function createStopInput(){
  const div = document.createElement("div");
  div.innerHTML = `
    <select class="stop-station big-select">
      ${stations.map(s=>`<option>${s.name}</option>`).join("")}
    </select>
    <input class="stop-arrive big-input" placeholder="到着">
    <input class="stop-depart big-input" placeholder="発車">
    <select class="stop-track big-select"></select>
  `;

  const stSel = div.querySelector(".stop-station");
  const trSel = div.querySelector(".stop-track");

  function updateTracks(){
    const st = stations.find(s=>s.name===stSel.value);
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
  if(!isAdmin) return;
  document.getElementById("stop-list").appendChild(createStopInput());
};

/* ========================== 列車保存 ========================== */
document.getElementById("btn-save-train").onclick = () => {
  if(!isAdmin){ alert("管理者のみ"); return; }

  const stops = [];
  document.querySelectorAll("#stop-list div").forEach(d=>{
    const st = d.querySelector(".stop-station").value;
    const ar = d.querySelector(".stop-arrive").value;
    const dp = d.querySelector(".stop-depart").value;
    const tr = d.querySelector(".stop-track").value;
    if(st && (ar||dp)) stops.push({station:st,arrive:ar,depart:dp,track:tr});
  });

  const t = {
    number:Number(document.getElementById("add-number").value),
    type:document.getElementById("add-type").value,
    destination:document.getElementById("add-dest").value,
    direction:document.getElementById("add-direction").value,
    start:stops[0].station,
    startTime:stops[0].depart||stops[0].arrive,
    end:stops[stops.length-1].station,
    endTime:stops[stops.length-1].arrive||stops[stops.length-1].depart,
    stops
  };

  trains.push(t);
  renderTrainTable();
  updateLocation();
  alert("保存しました");
};

/* ========================== 現在位置 ========================== */
function updateLocation(){
  const now = new Date();
  const nowStr = now.toTimeString().slice(0,5);
  const nowMin = toMinutes(nowStr);

  document.getElementById("now-time").textContent = "現在時刻: " + nowStr;

  let order = stations.map(s=>s.name);
  if(currentDirection==="down") order.reverse();

  const map = {};
  order.forEach(s=>map[s]=[]);

  trains.filter(t=>t.direction===currentDirection).forEach(t=>{
    const st = t.stops;
    for(let i=0;i<st.length;i++){
      const s = st[i];
      const a = toMinutes(s.arrive);
      const d = toMinutes(s.depart);

      if(a!==null && nowMin>=a && nowMin<a+1){
        map[s.station].push({type:t.type,number:t.number,dest:t.destination,between:false});
        return;
      }
      if(d!==null && nowMin>=d && nowMin<d+1){
        map[s.station].push({type:t.type,number:t.number,dest:t.destination,between:false});
        return;
      }

      if(i<st.length-1){
        const n = st[i+1];
        const na = toMinutes(n.arrive);
        if(d!==null && na!==null && nowMin>d && nowMin<na){
          const r = (nowMin-d)/(na-d);
          map[s.station].push({type:t.type,number:t.number,dest:t.destination,between:true,ratio:r});
          return;
        }
      }
    }
  });

  const box = document.getElementById("line-container");
  box.innerHTML = "";

  order.forEach((s,i)=>{
    const b = document.createElement("div");
    b.className = "station-block";
    b.innerHTML = `
      <div class="station-node"></div>
      <div class="station-name">${s}</div>
      <div class="train-list" id="tl-${i}"></div>`;
    box.appendChild(b);

    if(i<order.length-1){
      const seg = document.createElement("div");
      seg.className = "line-segment";
      box.appendChild(seg);
    }
  });

  order.forEach((s,i)=>{
    const list = document.getElementById(`tl-${i}`);
    map[s].forEach(info=>{
      if(!info.between){
        const card = document.createElement("div");
        card.className = "train-card";
        card.innerHTML = `
          <div class="train-number">${info.number}</div>
          <div class="train-type ${getTypeClass(info.type)}">${info.type} ${info.dest}</div>`;
        list.appendChild(card);
      } else {
        const bar = document.createElement("div");
        bar.className = "track-bar";
        const mk = document.createElement("div");
        mk.className = "train-marker";
        mk.style.left = `calc(${info.ratio*100}% - 7px)`;
        bar.appendChild(mk);
        list.appendChild(bar);
      }
    });
  });
}

document.getElementById("btn-up").onclick = () => {
  currentDirection = "up";
  updateLocation();
};
document.getElementById("btn-down").onclick = () => {
  currentDirection = "down";
  updateLocation();
};

setInterval(updateLocation, 30000);

/* ========================== クラウド保存 ========================== */
document.getElementById("btn-save-cloud").onclick = () => {
  db.collection("trainData").doc("main").set({
    trains, stations
  }).then(()=>alert("保存しました"));
};

/* ========================== クラウド受信 ========================== */
document.getElementById("btn-load-cloud").onclick = () => {
  db.collection("trainData").doc("main").get().then(doc=>{
    if(doc.exists){
      trains = doc.data().trains ?? [];
      stations = doc.data().stations ?? stations;
      renderTrainTable();
      updateLocation();
      alert("受信しました");
    } else {
      alert("データなし");
    }
  });
};

/* ========================== 管理者ログイン ========================== */
document.getElementById("btn-login").onclick = () => {
  const pass = document.getElementById("login-password").value;
  if(pass==="0829"){
    isAdmin = true;
    document.getElementById("login-status").textContent = "管理者モード：ON";
    document.querySelectorAll(".admin-only").forEach(e=>e.style.display="block");
  } else {
    alert("パスワードが違います");
  }
};

document.getElementById("toggle-pass").onclick = () => {
  const p = document.getElementById("login-password");
  p.type = (p.type==="password") ? "text" : "password";
};

/* ========================== 初期ロード ========================== */
window.onload = () => {
  renderTrainTable();
  updateLocation();
};
</script>

</body>
</html>
