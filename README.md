<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>京王線・高尾線 時刻表（土休日）</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      padding: 16px;
      background: #0f172a;
      color: #e5e7eb;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 20px;
    }
    h2 {
      margin: 16px 0 8px;
      font-size: 16px;
    }
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
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
    input:focus, select:focus {
      border-color: #22c55e;
    }
    button {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border: none;
      cursor: pointer;
      font-weight: 600;
      color: #022c22;
    }
    button:active {
      transform: translateY(1px);
    }
    .field-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .field {
      min-width: 140px;
    }
    .scroll-x {
      overflow-y: auto;
      max-height: 80vh;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 10px;
      background: #1d4ed8;
      color: #e5e7eb;
    }
    .type-local { background:#4b5563; }
    .type-exp { background:#16a34a; }
    .type-ltd { background:#eab308; color:#111827; }
    .muted {
      color: #9ca3af;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <h1>京王線・高尾線 時刻表（土休日）</h1>
  <div class="muted">Googleシートから自動読み込み / 列車番号検索 / 駅別発車時刻 / 全列車一覧（縦）</div>

  <div class="layout">
    <div class="card">
      <h2>検索・条件</h2>

      <label for="directionSelect">方向</label>
      <select id="directionSelect">
        <option value="down">下り（土休日）</option>
        <option value="up">上り（土休日）</option>
      </select>

      <h2>列車番号で検索</h2>
      <div class="field-row">
        <div class="field">
          <label for="trainNoInput">列車番号</label>
          <input id="trainNoInput" placeholder="例: 5119">
        </div>
        <button id="searchTrainBtn">検索</button>
      </div>
      <div id="trainDetail" class="muted" style="margin-top:8px;">列車番号を入力して検索してください。</div>

      <h2 style="margin-top:20px;">駅別発車時刻</h2>
      <div class="field-row">
        <div class="field">
          <label for="stationSelect">駅を選択</label>
          <select id="stationSelect"></select>
        </div>
        <button id="showStationBtn">表示</button>
      </div>
      <div id="stationDepartures" style="margin-top:8px;"></div>
    </div>

    <div class="card">
      <h2>全列車一覧（縦）</h2>
      <div class="scroll-x" id="timetableArea">
        読み込み中…
      </div>
    </div>
  </div>

  <script>
    const CSV_URL =
      "https://docs.google.com/spreadsheets/d/1EyCyghvrLeOQJcP6LINLvR95v0WOsv29oCXbPe3-L-g/export?format=csv&gid=1457124033";

    const STATIONS = [
      "新宿","初台","幡ヶ谷","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
      "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布","西調布","飛田給",
      "武蔵野台","多磨霊園","東府中","府中","分倍河原","中河原","聖蹟桜ヶ丘","百草園","高幡不動",
      "南平","平山城址公園","長沼","北野","京王八王子",
      "京王片倉","山田","めじろ台","狭間","高尾","高尾山口"
    ];

    let TRAINS = { down: {}, up: {} };
    let currentDirection = "down";

    function typeClass(type) {
      if (!type) return "badge";
      if (type.includes("各停")) return "badge type-local";
      if (type.includes("特急")) return "badge type-ltd";
      if (type.includes("急行") || type.includes("区急") || type.includes("快速")) return "badge type-exp";
      return "badge";
    }

    function parseCsv(text, mode) {
      const rows = text.split(/\r?\n/).map(r => r.split(","));
      const headerIndexes = [];

      rows.forEach((r, i) => {
        if (r[0] === "線名" && r[1] === "列車番号") headerIndexes.push(i);
      });

      const headerIndex = mode === "up"
        ? (headerIndexes[1] ?? headerIndexes[0])
        : headerIndexes[0];

      const trainNoRow = rows[headerIndex];
      const typeRow = rows[headerIndex + 1] || [];

      const trainCols = [];
      for (let c = 0; c < trainNoRow.length; c++) {
        const no = (trainNoRow[c] || "").trim();
        if (/^\d+$/.test(no)) trainCols.push({ col: c, no });
      }

      const trains = {};
      trainCols.forEach(t => {
        trains[t.no] = {
          type: (typeRow[t.col] || "").trim(),
          stops: {}
        };
      });

      for (let r = headerIndex + 2; r < rows.length; r++) {
        const row = rows[r];
        const station = row[1] && row[1].trim();
        if (!STATIONS.includes(station)) continue;

        trainCols.forEach(t => {
          const raw = row[t.col] ? row[t.col].trim() : "";
          if (!raw || raw === "ﾚ" || raw === "||" || raw.includes("以下")) return;
          trains[t.no].stops[station] = raw;
        });
      }

      return trains;
    }

    function renderTimetableVertical() {
      const area = document.getElementById("timetableArea");
      const trainsObj = TRAINS[currentDirection];
      const trainNos = Object.keys(trainsObj).sort((a,b) => a.localeCompare(b, "ja"));

      let html = "";
      trainNos.forEach(no => {
        const t = trainsObj[no];
        html += `
          <div style="border:1px solid #1f2937; padding:10px; margin-bottom:10px; border-radius:8px; background:#0b1220;">
            <div style="font-size:14px; font-weight:bold; margin-bottom:4px;">
              列車 ${no}　
              <span class="${typeClass(t.type)}">${t.type}</span>
            </div>
            <table style="width:100%; font-size:12px;">
              <tr><th>駅</th><th>時刻</th></tr>
        `;
        STATIONS.forEach(st => {
          if (t.stops[st]) {
            html += `<tr><td>${st}</td><td>${t.stops[st]}</td></tr>`;
          }
        });
        html += `</table></div>`;
      });

      area.innerHTML = html;
    }

    function renderTrainDetail(trainNo) {
      const box = document.getElementById("trainDetail");
      const t = TRAINS[currentDirection][trainNo];
      if (!t) {
        box.innerHTML = `<span class="muted">列車 ${trainNo} は見つかりませんでした。</span>`;
        return;
      }
      let html = `<div><strong>列車番号：</strong>${trainNo}</div>`;
      html += `<div><strong>種別：</strong>${t.type || ""}</div>`;
      html += "<table style='margin-top:8px;'><tr><th>駅</th><th>時刻</th></tr>";
      STATIONS.forEach(st => {
        if (t.stops[st]) html += `<tr><td>${st}</td><td>${t.stops[st]}</td></tr>`;
      });
      html += "</table>";
      box.innerHTML = html;
    }

    function renderStationDepartures(station) {
      const box = document.getElementById("stationDepartures");
      const trainsObj = TRAINS[currentDirection];
      const rows = [];

      Object.entries(trainsObj).forEach(([no, t]) => {
        const time = t.stops[station];
        if (time) rows.push({ no, type: t.type, time });
      });

      rows.sort((a,b) => a.time.localeCompare(b.time));

      let html = `<div><strong>${station}</strong> 発車時刻（${currentDirection === "down" ? "下り" : "上り"}）</div>`;
      html += "<table style='margin-top:4px;'><tr><th>時刻</th><th>列車</th><th>種別</th></tr>";
      rows.forEach(r => {
        html += `<tr><td>${r.time}</td><td>${r.no}</td><td>${r.type}</td></tr>`;
      });
      html += "</table>";
      box.innerHTML = html;
    }

    document.getElementById("searchTrainBtn").addEventListener("click", () => {
      const no = document.getElementById("trainNoInput").value.trim();
      if (!no) return;
      renderTrainDetail(no);
    });

    document.getElementById("showStationBtn").addEventListener("click", () => {
      const st = document.getElementById("stationSelect").value;
      renderStationDepartures(st);
    });

    document.getElementById("directionSelect").addEventListener("change", (e) => {
      currentDirection = e.target.value;
      renderTimetableVertical();
      document.getElementById("trainDetail").textContent =
        "列車番号を入力して検索してください。";
      document.getElementById("stationDepartures").textContent = "";
    });

    const stationSelect = document.getElementById("stationSelect");
    STATIONS.forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st;
      stationSelect.appendChild(opt);
    });

    (async () => {
      const res = await fetch(CSV_URL);
      const text = await res.text();
      TRAINS.down = parseCsv(text, "down");
      TRAINS.up   = parseCsv(text, "up");
      renderTimetableVertical();
    })();
  </script>
</body>
</html>
