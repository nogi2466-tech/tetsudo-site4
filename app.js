/* Firebase */
const firebaseConfig={
  apiKey:"AIzaSyAxJVAX7CIK4U21QxL20n4yxagcI9dfItE",
  authDomain:"train-system-9622f.firebaseapp.com",
  projectId:"train-system-9622f",
  storageBucket:"train-system-9622f.firebasestorage.app",
  messagingSenderId:"1066598780695",
  appId:"1:1066598780695:web:e682df702e58caaaedc792"
};
firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();

/* 駅データ（上り＝新宿方面） */
const stationsMain=[
  {name:"京王八王子",tracks:3},
  {name:"北野",tracks:3},
  {name:"長沼",tracks:2},
  {name:"平山城址公園",tracks:2},
  {name:"南平",tracks:2},
  {name:"高幡不動",tracks:4},
  {name:"百草園",tracks:2},
  {name:"聖蹟桜ヶ丘",tracks:3},
  {name:"中河原",tracks:2},
  {name:"分倍河原",tracks:2},
  {name:"府中",tracks:4},
  {name:"東府中",tracks:3},
  {name:"多磨霊園",tracks:2},
  {name:"武蔵野台",tracks:2},
  {name:"飛田給",tracks:2},
  {name:"西調布",tracks:2},
  {name:"調布",tracks:4},
  {name:"布田",tracks:2},
  {name:"国領",tracks:2},
  {name:"柴崎",tracks:2},
  {name:"つつじヶ丘",tracks:3},
  {name:"仙川",tracks:2},
  {name:"千歳烏山",tracks:4},
  {name:"芦花公園",tracks:2},
  {name:"八幡山",tracks:3},
  {name:"上北沢",tracks:2},
  {name:"桜上水",tracks:2},
  {name:"下高井戸",tracks:2},
  {name:"明大前",tracks:4},
  {name:"代田橋",tracks:2},
  {name:"笹塚",tracks:2},
  {name:"新宿",tracks:4}
];

const stationsSagami=[
  {name:"橋本",tracks:3},
  {name:"多摩境",tracks:2},
  {name:"南大沢",tracks:2},
  {name:"京王堀之内",tracks:2},
  {name:"京王多摩センター",tracks:3},
  {name:"京王永山",tracks:2},
  {name:"若葉台",tracks:2},
  {name:"稲城",tracks:2},
  {name:"京王よみうりランド",tracks:2},
  {name:"京王稲田堤",tracks:2},
  {name:"京王多摩川",tracks:2},
  {name:"調布",tracks:4}
];

let trains=[];
let currentDirection="up";
let isAdmin=false;
let editingIndex=null;

/* 共通関数 */
function parseTimeToDate(hm){
  if(!hm)return null;
  const [h,m]=hm.split(":").map(Number);
  const d=new Date();
  d.setHours(h,m,0,0);
  return d;
}
function getTypeClass(type){
  switch(type){
    case "各停":return "type-local";
    case "快速":return "type-rapid";
    case "区急":return "type-semi-exp";
    case "急行":return "type-exp";
    case "特急":return "type-ltd-exp";
    default:return "";
  }
}

/* メニュー */
document.getElementById("menu-btn").onclick=()=>{
  const m=document.getElementById("menu");
  m.style.display=(m.style.display==="flex")?"none":"flex";
};
document.querySelectorAll("nav a").forEach(a=>{
  a.onclick=e=>{
    e.preventDefault();
    document.querySelectorAll("nav a").forEach(x=>x.classList.remove("active"));
    a.classList.add("active");
    const id=a.dataset.target;
    document.querySelectorAll("main section").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  };
});
/* ============================
   現在位置カード生成（新仕様）
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

  /* 駅ごとにブロックを作る */
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

  /* この路線の列車を抽出 */
  const listTrains = trains.filter(
    t => t.line === lineId && t.direction === currentDirection
  );

  /* 各列車の現在位置を判定してカードを配置 */
  listTrains.forEach(train => {
    const stops = train.stops;

    for(let i = 0; i < stops.length; i++){
      const status = getTrainStatusAtStation(train, i, now);
      if(!status) continue;

      /* ---- 停車中 ---- */
      if(status.type === "停車"){
        const idx = order.indexOf(status.station);
        if(idx >= 0){
          const list = document.getElementById(`${containerId}-tl-${idx}`);
          list.appendChild(createStatusCard(train, `${status.station} 停車中`));
        }
        return;
      }

      /* ---- 通過中 ---- */
      if(status.type === "通過"){
        const idx = order.indexOf(status.station);
        if(idx >= 0){
          const list = document.getElementById(`${containerId}-tl-${idx}`);
          list.appendChild(createStatusCard(train, `${status.station} 通過中`));
        }
        return;
      }

      /* ---- 駅間走行中 ---- */
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

/* 30秒ごとに更新 */
setInterval(updateLocation, 30000);

/* 初期ロード */
window.onload = () => {
  renderTrainTable();
  updateLocation();
};

