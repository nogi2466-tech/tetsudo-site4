<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>列車運行シミュレータ</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>

<body>

  <header class="top-bar">
    <div class="top-bar-inner">

      <div class="top-bar-left">
        <button id="menu-toggle" class="menu-toggle">&#9776;</button>
        <span class="app-title">列車運行シミュレータ</span>
      </div>

      <nav class="top-nav" id="top-nav">
        <button class="nav-item active" data-view="view-train-list">列車一覧</button>
        <button class="nav-item" data-view="view-current">現在位置</button>
        <button class="nav-item" data-view="view-timetable">時刻表</button>
        <button class="nav-item need-auth" data-view="view-add-train" disabled>列車追加</button>
        <button class="nav-item" data-view="view-settings">設定</button>
      </nav>

      <div class="top-bar-right">
        <button id="btn-now" class="btn-now">現在時刻</button>
        <span id="clock" class="clock"></span>
      </div>

    </div>
  </header>

  <main>

    <!-- ① 列車一覧 -->
    <section id="view-train-list" class="view active">
      <h2>列車一覧</h2>
      <table>
        <thead>
          <tr>
            <th>番号</th>
            <th>種別</th>
            <th>行き先</th>
            <th>発車</th>
            <th>到着</th>
            <th>番線</th>
          </tr>
        </thead>
        <tbody id="train-list-body"></tbody>
      </table>
    </section>

    <!-- ② 現在位置 -->
    <section id="view-current" class="view">
      <h2>現在位置</h2>
      <div id="station-list"></div>
    </section>

    <!-- ③ 時刻表 -->
    <section id="view-timetable" class="view">
      <h2>時刻表</h2>
      <select id="timetable-station-select"></select>
      <table>
        <thead>
          <tr>
            <th>時刻</th>
            <th>番号</th>
            <th>種別</th>
            <th>行き先</th>
            <th>番線</th>
          </tr>
        </thead>
        <tbody id="timetable-body"></tbody>
      </table>
    </section>

    <!-- ④ 列車追加（パスワード認証後に解禁） -->
    <section id="view-add-train" class="view">
      <h2>列車追加</h2>

      <div class="panel">
        <div class="field-row">
          <label>列車番号：</label>
          <input type="text" id="add-number">
        </div>

        <div class="field-row">
          <label>種別：</label>
          <select id="add-type">
            <option>各停</option>
            <option>快速</option>
            <option>区急</option>
            <option>急行</option>
            <option>特急</option>
          </select>
        </div>

        <div class="field-row">
          <label>行き先：</label>
          <input type="text" id="add-dest">
        </div>

        <div class="field-row">
          <label>発車時刻：</label>
          <input type="time" id="add-startTime">
        </div>

        <div class="field-row">
          <label>到着時刻：</label>
          <input type="time" id="add-endTime">
        </div>

        <div class="field-row">
          <label>番線：</label>
          <select id="add-platform">
            <option value="1">1番線</option>
            <option value="2">2番線</option>
            <option value="3">3番線</option>
            <option value="4">4番線</option>
          </select>
        </div>

        <button id="btn-add-train">追加</button>
      </div>
    </section>

    <!-- ⑤ 設定 -->
    <section id="view-settings" class="view">
      <h2>設定</h2>

      <div class="panel">
        <label>パスワード：</label>
        <input type="password" id="admin-password">
        <button id="btn-auth">認証</button>
        <p id="auth-status">列車追加は認証後に有効になります。</p>
      </div>

      <div class="panel">
        <button id="btn-save-local">保存（ローカル）</button>
        <button id="btn-load-local">読み込み（ローカル）</button>
      </div>

    </section>

  </main>

  <script src="app.js"></script>
</body>
</html>

