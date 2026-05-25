<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>列車管理システム（縦路線図版）</title>

<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<!-- CSS は Part B で読み込む -->
<link rel="stylesheet" href="style.css">

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
        <th>列車番号</th>
        <th>種別</th>
        <th>方向</th>
        <th>始発</th>
        <th>発車</th>
        <th>終着</th>
        <th>到着</th>
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
      <tr>
        <th>駅名</th>
        <th>到着</th>
        <th>発車</th>
        <th>番線</th>
      </tr>
    </thead>
    <tbody id="detail-stops"></tbody>
  </table>
</section>

<!-- 現在位置（縦路線図 UI） -->
<section id="location">
  <h2>現在位置（縦路線図）</h2>

  <button id="btn-up" class="cloud-btn cloud-load">上り</button>
  <button id="btn-down" class="cloud-btn cloud-load">下り</button>

  <p id="now-time"></p>

  <!-- ★ 縦路線図のコンテナ -->
  <div id="line-container"></div>
</section>

<!-- 設定 -->
<section id="settings">
  <h2>設定</h2>

  <div style="margin-bottom:16px;">
    <button id="btn-save-cloud" class="cloud-btn cloud-save">☁ クラウドに保存</button>
    <button id="btn-load-cloud" class="cloud-btn cloud-load">⬇ クラウドから受信</button>
  </div>

  <h3>管理者ログイン</h3>

  <div style="display:flex; gap:8px; max-width:320px;">
    <input id="login-password" class="big-input" type="password" inputmode="numeric" placeholder="パスワード">
    <button id="toggle-pass">👁</button>
  </div>

  <button id="btn-login" class="cloud-btn cloud-load">ログイン</button>
  <button id="btn-logout" class="cloud-btn cloud-save admin-only">ログアウト</button>

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

<!-- JS は Part C で読み込む -->
<script src="script.js"></script>

</body>
</html>
