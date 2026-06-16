<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>京王線 全列車 時刻表ビューア</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #e5e7eb;
    }
    h1 { margin: 0 0 8px; font-size: 20px; }
    h2 { margin: 16px 0 8px; font-size: 16px; }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
    }
    .card {
      background: #020617;
      border-radius: 12px;
      padding: 12px;
      border: 1px solid #1f2937;
    }
    label {
      font-size: 12px;
      color: #9ca3af;
      display: block;
      margin-bottom: 4px;
    }
    input, select, button {
      font-size: 13px;
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid #374151;
      background: #020617;
      color: #e5e7eb;
      outline: none;
    }
    button {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border: none;
      cursor: pointer;
      font-weight: 600;
      color: #022c22;
    }
    table {
      border-collapse: collapse;
      font-size: 12px;
      width: max-content;
    }
    th, td {
      border: 1px solid #1f2937;
      padding: 4px 6px;
      white-space: nowrap;
      text-align: center;
    }
    th {
      background: #0b1220;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .scroll-x { overflow-x: auto; max-height: 80vh; }
    .muted { color: #9ca3af; font-size: 11px; }
  </style>
</head>
<body>
  <h1>京王線 全列車 時刻表ビューア</h1>
  <div class="muted">Googleシート（駅×列車）を自動読み込み</div>

  <div class="layout">
    <div class="card">
      <h2>検索・表示</h2>

      <label for="viewSelect">表示形式</label>
      <select id="viewSelect">
        <option value="horizontal">横（駅 × 列車）</option>
        <option value="vertical">縦（1列車ずつ）</option>
      </select>

      <h2>列車番号検索</h2>
      <label for="trainNoInput">列車番号</label>
      <input id="trainNoInput" placeholder="例: 5600">
      <button id="searchTrainBtn">検索</button>

      <div id="trainDetail" class="muted" style="margin-top:8px;">
        列車番号を入力してください。
      </div>

      <h2>駅別発車時刻</h2>
      <label for="stationSelect">駅を選択</label>
      <select id="stationSelect"></select>
      <button id="showStationBtn">表示</button>

      <div id="stationDepartures" style="margin-top:8px;"></div>
    </div>

    <div class="card">
      <h2>全列車一覧</h2>
      <div id="timetableArea" class="scroll-x">読み込み中…</div>
    </div>
  </div>

  <script>
    // ★ あなたの新しい横表CSV（駅×列車）
   const CSV_URL =
  "https://docs.google.com/spreadsheets/d/1EyCyghvrLeOQJcP6LINLvR95v0WOsv29oCXbPe3-L-g/export?format=csv&gid=1879850608";

    let TRAINS = {};   // 列車番号 → { stops:{} }
    let STATIONS = []; // 駅一覧

    // 横表CSVパーサー（駅×列車）
    function parseHorizontalCsv(text) {
      const rows = text.split(/\r?\n/).map(r => r.split(","));
      const header = rows[0];

      // 列車番号一覧（1列目以外）
      const trainNos = header.slice(1).map(h => h.trim());

      // 駅一覧
      STATIONS = rows.slice(1).map(r => r[0].trim());

      // 列車データ初期化
      trainNos.forEach(no => {
        TRAINS[no] = { stops: {} };
      });

      // 時刻を読み込む
      for (let r = 1; r < rows.length; r++) {
        const station = rows[r][0].trim();
        for (let c = 1; c < rows[r].length; c++) {
          const no = trainNos[c - 1];
          const time = rows[r][c].trim();
          if (time && time !== "ﾚ" && time !== "||") {
            TRAINS[no].stops[station] = time;
          }
        }
      }
    }

    // 横表表示
    function renderHorizontal() {
      const area = document.getElementById("timetableArea");
      const trainNos = Object.keys(TRAINS);

      let html = "<table><thead><tr><th>駅</th>";
      trainNos.forEach(no => html += `<th>${no}</th>`);
      html += "</tr></thead><tbody>";

      STATIONS.forEach(st => {
        html += `<tr><td>${st}</td>`;
        trainNos.forEach(no => {
          html += `<td>${TRAINS[no].stops[st] || ""}</td>`;
        });
        html += "</tr>";
      });

      html += "</tbody></table>";
      area.innerHTML = html;
    }

    // 縦カード表示
    function renderVertical() {
      const area = document.getElementById("timetableArea");
      const trainNos = Object.keys(TRAINS);

      let html = "";
      trainNos.forEach(no => {
        html += `<div style="border:1px solid #1f2937; padding:10px; margin-bottom:10px;">`;
        html += `<strong>列車 ${no}</strong><br>`;
        html += "<table><tr><th>駅</th><th>時刻</th></tr>";
        STATIONS.forEach(st => {
          if (TRAINS[no].stops[st]) {
            html += `<tr><td>${st}</td><td>${TRAINS[no].stops[st]}</td></tr>`;
          }
        });
        html += "</table></div>";
      });

      area.innerHTML = html;
    }

    // 列車番号検索
    function renderTrainDetail(no) {
      const box = document.getElementById("trainDetail");
      const t = TRAINS[no];

      if (!t) {
        box.innerHTML = "見つかりませんでした。";
        return;
      }

      let html = `<strong>列車 ${no}</strong>`;
      html += "<table><tr><th>駅</th><th>時刻</th></tr>";
      STATIONS.forEach(st => {
        if (t.stops[st]) html += `<tr><td>${st}</td><td>${t.stops[st]}</td></tr>`;
      });
      html += "</table>";

      box.innerHTML = html;
    }

    // 駅別発車時刻
    function renderStationDepartures(st) {
      const box = document.getElementById("stationDepartures");
      const rows = [];

      Object.entries(TRAINS).forEach(([no, t]) => {
        if (t.stops[st]) rows.push({ no, time: t.stops[st] });
      });

      rows.sort((a,b) => a.time.localeCompare(b.time));

      let html = `<strong>${st} 発車時刻</strong>`;
      html += "<table><tr><th>時刻</th><th>列車</th></tr>";
      rows.forEach(r => html += `<tr><td>${r.time}</td><td>${r.no}</td></tr>`);
      html += "</table>";

      box.innerHTML = html;
    }

    // イベント
    document.getElementById("viewSelect").addEventListener("change", e => {
      if (e.target.value === "horizontal") renderHorizontal();
      else renderVertical();
    });

    document.getElementById("searchTrainBtn").addEventListener("click", () => {
      const no = document.getElementById("trainNoInput").value.trim();
      renderTrainDetail(no);
    });

    document.getElementById("showStationBtn").addEventListener("click", () => {
      const st =
