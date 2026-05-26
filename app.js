//------------------------------------------------------
// 列車データ
//------------------------------------------------------
let trains = [];

//------------------------------------------------------
// Google スプレッドシートから読み込む関数
//------------------------------------------------------
async function loadFromGoogleSheet(sheetId, apiKey) {
  try {
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      alert("スプレッドシートの読み込みに失敗しました");
      return;
    }

    const data = await res.json();
    const rows = data.values;

    if (!rows || rows.length < 2) {
      alert("シートにデータがありません");
      return;
    }

    // 1行目はヘッダー
    const body = rows.slice(1);

    trains = body.map(r => ({
      number: r[0] || "",
      type: r[1] || "",
      destination: r[2] || "",
      line: r[3] || "",
      direction: r[4] || "",
      station: r[5] || "",
      arrival: r[6] || "",
      departure: r[7] || "",
      platform: r[8] || "",
      pass: r[9] === "1"
    }));

    alert("スプレッドシートを読み込みました！");
    renderTrainTable();
    renderStationList();
  } catch (e) {
    console.error(e);
    alert("読み込み中にエラーが発生しました");
  }
}

//------------------------------------------------------
// 列車一覧を表示
//------------------------------------------------------
function renderTrainTable() {
  const tbody = document.getElementById("train-table-body");
  tbody.innerHTML = "";

  trains.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.number}</td>
      <td>${t.type}</td>
      <td>${t.destination}</td>
      <td>${t.line}</td>
      <td>${t.direction}</td>
      <td>${t.station}</td>
    `;
    tbody.appendChild(tr);
  });
}

//------------------------------------------------------
// 駅リストを作成
//------------------------------------------------------
function renderStationList() {
  const select = document.getElementById("station-select");
  select.innerHTML = "";

  const stations = [...new Set(trains.map(t => t.station))];

  stations.forEach(st => {
    const op = document.createElement("option");
    op.value = st;
    op.textContent = st;
    select.appendChild(op);
  });

  renderStationTable();
}

//------------------------------------------------------
// 駅別時刻表
//------------------------------------------------------
function renderStationTable() {
  const station = document.getElementById("station-select").value;
  const tbody = document.getElementById("station-table-body");
  tbody.innerHTML = "";

  const list = trains.filter(t => t.station === station);

  list.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.arrival || t.departure}</td>
      <td>${t.number}</td>
      <td>${t.type}</td>
      <td>${t.destination}</td>
      <td>${t.platform}</td>
    `;
    tbody.appendChild(tr);
  });
}

//------------------------------------------------------
// ローカル保存
//------------------------------------------------------
document.getElementById("btn-save-local").onclick = () => {
  localStorage.setItem("trains", JSON.stringify(trains));
  alert("保存しました");
};

document.getElementById("btn-load-local").onclick = () => {
  const data = localStorage.getItem("trains");
  if (!data) return alert("保存データがありません");
  trains = JSON.parse(data);
  renderTrainTable();
  renderStationList();
  alert("読み込みました");
};

document.getElementById("btn-clear-local").onclick = () => {
  localStorage.removeItem("trains");
  alert("削除しました");
};

//------------------------------------------------------
// JSON 読み込み
//------------------------------------------------------
document.getElementById("btn-load-json").onclick = () => {
  const file = document.getElementById("json-input").files[0];
  if (!file) return alert("ファイルを選択してください");

  const reader = new FileReader();
  reader.onload = () => {
    trains = JSON.parse(reader.result);
    renderTrainTable();
    renderStationList();
  };
  reader.readAsText(file);
};

//------------------------------------------------------
// JSON エクスポート
//------------------------------------------------------
document.getElementById("btn-export-json").onclick = () => {
  const blob = new Blob([JSON.stringify(trains, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "trains.json";
  a.click();
};

//------------------------------------------------------
// Google Sheets 読み込みボタン
//------------------------------------------------------
document.getElementById("btn-load-sheet").onclick = () => {
  const sheetId = document.getElementById("sheet-id").value.trim();
  const apiKey = document.getElementById("api-key").value.trim();

  if (!sheetId || !apiKey) {
    alert("シートIDとAPIキーを入力してください");
    return;
  }

  loadFromGoogleSheet(sheetId, apiKey);
};

//------------------------------------------------------
// デバッグ
//------------------------------------------------------
document.getElementById("btn-log-trains").onclick = () => {
  console.log(trains);
};

//------------------------------------------------------
// 駅選択変更
//------------------------------------------------------
document.getElementById("station-select").onchange = renderStationTable;
