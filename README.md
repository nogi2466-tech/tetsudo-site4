<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>列車管理システム（縦路線図）</title>
  <link rel="stylesheet" href="style.css">

  <!-- Firebase -->
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

  <script>
    const firebaseConfig = {
      apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
      authDomain: "train-system-9622f.firebaseapp.com",
      projectId: "train-system-9622f",
      storageBucket: "train-system-9622f.appspot.com",
      messagingSenderId: "1066598708695",
      appId: "1:1066598708695:web:e682df702e58caaaedc792",
      measurementId: "G-CKP4Z2F65W"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  </script>
</head>

<body>

<header>
  <h1>列車管理システム（縦路線図）</h1>
  <div id="now-time">現在時刻: --:--</div>
</header>

<!-- スマホ用メニューボタン -->
<div id="menu-btn">☰ メニュー</div>

<nav>
  <a data-target="train-list" class="active">列車一覧</a>
  <a data-target="train-detail">列車詳細</a>
  <a data-target="location">現在位置</a>
  <a data-target="timetable">各駅時刻表</a>
  <a data-target="settings">設定</a>
</nav>

<main>

  <!-- 列車一覧 -->
  <section id="train-list" class="page active">
    <h2>列車一覧</h2>

    <input id="search-number" placeholder="列車番号で検索">

    <table id="train-table">
      <thead>
        <tr>
          <th>列車番号</th>
          <th>種別</th>
          <th>行き先</th>
          <th>始発駅</th>
          <th>発車</th>
          <th>終着駅</th>
          <th>到着</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </section>

  <!-- 列車詳細 -->
  <section id="train-detail" class="page">
    <h2>列車詳細</h2>
    <div id="train-detail-box">列車を選択してください</div>
  </section>

  <!-- 現在位置 -->
  <section id="location" class="page">
    <h2>現在位置</h2>

    <div id="direction-switch">
      <button id="btn-up" class="active">上り</button>
      <button id="btn-down">下り</button>
    </div>

    <div id="lines-wrapper">
      <div id="line-main-body"></div>
      <div id="line-sagami-body"></div>
      <div id="line-takao-body"></div>
    </div>
  </section>

  <!-- 各駅時刻表 -->
  <section id="timetable" class="page">
    <h2>各駅時刻表</h2>
    <select id="timetable-station"></select>
    <div id="timetable-body"></div>
  </section>

  <!-- 設定 -->
  <section id="settings" class="page">
    <h2>設定</h2>

    <h3>クラウド</h3>
    <button id="btn-save-cloud" class="admin-only" style="display:none;">クラウドに保存</button>
    <button id="btn-load-cloud">クラウドから受信</button>

    <h3>管理者ログイン</h3>
    <div class="form-row">
      <label>パスワード</label>
      <input id="login-password" type="password">
      <button id="toggle-pass">表示</button>
    </div>
    <button id="btn-login">ログイン</button>

    <h3 class="admin-only" style="display:none;">列車追加</h3>

    <div id="train-add-area" class="admin-only" style="display:none;">

      <div class="form-row">
        <label>列車番号</label>
        <input id="add-number">
      </div>

      <div class="form-row">
        <label>種類</label>
        <select id="add-type">
          <option>各停</option>
          <option>快速</option>
          <option>区急</option>
          <option>急行</option>
          <option>特急</option>
        </select>
      </div>

      <div class="form-row">
        <label>路線</label>
        <select id="add-line">
          <option value="main">京王線</option>
          <option value="sagami">相模原線</option>
        </select>
      </div>

      <div class="form-row">
        <label>方向</label>
        <select id="add-direction">
          <option value="up">上り</option>
          <option value="down">下り</option>
        </select>
      </div>

      <div class="form-row">
        <label>行先</label>
        <input id="add-dest">
      </div>

      <h3>停車駅</h3>
      <div id="stop-list"></div>
      <button id="btn-add-stop" class="admin-only" style="display:none;">＋ 停車駅追加</button>

      <button id="btn-save-train" class="admin-only" style="display:none;">保存</button>
    </div>
  </section>

</main>

<script src="app.js"></script>

<script>
  document.getElementById("menu-btn").onclick = () => {
    document.querySelector("nav").classList.toggle("show");
  };
</script>

</body>
</html>
