<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>列車運行シミュレータ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background:#111; color:#eee; }
    header { padding: 8px 12px; background:#222; display:flex; gap:8px; align-items:center; }
    header h1 { font-size:18px; margin:0 8px 0 0; }
    button, input, select { font-size:14px; }
    main { display:flex; height:calc(100vh - 40px); }
    nav { width:180px; background:#181818; border-right:1px solid #333; padding:8px; box-sizing:border-box; }
    nav button { width:100%; margin-bottom:6px; padding:6px; background:#333; color:#eee; border:1px solid #555; cursor:pointer; }
    nav button.active { background:#0a84ff; border-color:#0a84ff; }
    section.view { flex:1; padding:8px; box-sizing:border-box; display:none; overflow:auto; }
    section.view.active { display:block; }
    h2 { font-size:16px; margin:4px 0 8px; }
    h3 { font-size:14px; margin:10px 0 4px; }
    .panel { border:1px solid #333; padding:8px; margin-bottom:8px; border-radius:4px; background:#151515; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th, td { border:1px solid #333; padding:4px 6px; text-align:left; }
    th { background:#222; }
    .flex { display:flex; gap:8px; flex-wrap:wrap; }
    .field-row { margin-bottom:6px; }
    .field-row label { display:inline-block; width:90px; }
    input[type="text"], input[type="number"] { padding:3px 4px; width:180px; background:#111; border:1px solid #555; color:#eee; }
    #timelineCanvas { width:100%; height:400px; background:#000; border:1px solid #333; }
    small { color:#aaa; }
  </style>
</head>
<body>
  <header>
    <h1>列車運行シミュレータ</h1>
    <button id="btn-now">現在時刻にジャンプ</button>
    <span id="clock"></span>
  </header>

  <main>
    <nav>
      <button data-view="view-trains" class="active">列車一覧</button>
      <button data-view="view-map">現在位置</button>
      <button data-view="view-timetable">各駅時刻表</button>
      <button data-view="view-settings">設定</button>
    </nav>

    <!-- 列車一覧 -->
    <section id="view-trains" class="view active">
      <h2>列車一覧</h2>
      <div class="panel">
        <table id="train-table">
          <thead>
            <tr>
              <th>列車番号</th>
              <th>種別</th>
              <th>行先</th>
              <th>路線</th>
              <th>方向</th>
              <th>現在位置</th>
            </tr>
          </thead>
          <tbody id="train-table-body">
            <!-- JSで埋める -->
          </tbody>
        </table>
      </div>
    </section>

    <!-- 現在位置（縦線ダイヤ） -->
    <section id="view-map" class="view">
      <h2>現在位置</h2>
      <div class="panel">
        <canvas id="timelineCanvas"></canvas>
      </div>
    </section>

    <!-- 各駅時刻表 -->
    <section id="view-timetable" class="view">
      <h2>各駅時刻表</h2>
      <div class="panel">
        <div class="field-row">
          <label for="station-select">駅：</label>
          <select id="station-select"></select>
        </div>
        <table id="station-table">
          <thead>
            <tr>
              <th>時刻</th>
              <th>列車</th>
              <th>種別</th>
              <th>行先</th>
              <th>番線</th>
            </tr>
          </thead>
          <tbody id="station-table-body">
          </tbody>
        </table>
      </div>
    </section>

    <!-- 設定 -->
    <section id="view-settings" class="view">
      <h2>設定・データ管理</h2>

      <div class="panel">
        <h3>ローカル保存</h3>
        <button id="btn-save-local">ブラウザに保存</button>
        <button id="btn-load-local">保存データを読み込み</button>
        <button id="btn-clear-local">保存データ削除</button>
      </div>

      <div class="panel">
        <h3>JSONインポート / エクスポート</h3>
        <div class="field-row">
          <input type="file" id="json-input" accept=".json">
          <button id="btn-load-json">JSON読み込み</button>
        </div>
        <div class="field-row">
          <button id="btn-export-json">JSONとしてダウンロード</button>
        </div>
      </div>

      <div class="panel">
        <h3>Googleスプレッドシート読み込み</h3>
        <div class="field-row">
          <label for="sheet-id">シートID</label>
          <input id="sheet-id" type="text" placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890">
        </div>
        <div class="field-row">
          <label for="api-key">APIキー</label>
          <input id="api-key" type="text" placeholder="AIza...">
        </div>
        <div class="field-row">
          <button id="btn-load-sheet">スプレッドシートから読み込む</button>
        </div>
        <small>
          シートは「列車番号,種別,行先,路線,方向,駅名,到着,発車,番線,通過(0/1)」の列で作成してください。<br>
          Google Cloud Console で Google Sheets API を有効化し、この APIキーを使用します。
        </small>
      </div>

      <div class="panel">
        <h3>デバッグ</h3>
        <button id="btn-log-trains">trains をコンソールに表示</button>
      </div>
    </section>
  </main>

  <script src="app.js"></script>
  <script>
    // タブ切り替え
    document.querySelectorAll('nav button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('section.view').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.view).classList.add('active');
      });
    });

    // 簡易時計
    function updateClock() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      document.getElementById("clock").textContent = `${hh}:${mm}:${ss}`;
    }
    setInterval(updateClock, 1000);
    updateClock();
  </script>
</body>
</html>
