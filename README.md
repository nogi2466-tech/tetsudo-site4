<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>京王運行管理システム</title>
<link rel="stylesheet" href="style.css">

<!-- Firebase v8 -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
    authDomain: "train-system-9622f.firebaseapp.com",
    projectId: "train-system-9622f",
    storageBucket: "train-system-9622f.firebasestorage.app",
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
  <h1>京王運行管理システム</h1>
  <div id="now-time">現在時刻: --:--</div>
</header>

<nav>
  <a data-target="train-list" class="active">列車一覧</a>
  <a data-target="train-detail">列車詳細</a>
  <a data-target="location">現在位置</a>
  <a data-target="timetable">各駅時刻表</a>
  <a data-target="settings">設定</a>
</nav>

<main>

<!-- ============================
     列車一覧
============================ -->
<section id="train-list" class="page active">
  <h2>列車一覧</h2>

  <input id="search-number" placeholder="列車番号検索">

  <table id="train-table">
    <thead>
      <tr>
        <th>番号</th><th>種別</th><th>行先</th>
        <th>始発</th><th>発</th><th>終着</th><th>着</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</section>

<!-- ============================
     列車詳細（表示専用）
============================ -->
<section id="train-detail" class="page">
  <h2>列車詳細</h2>
  <div id="train-detail-box">列車を選択してください</div>
</section>

<!-- ============================
     現在位置
============================ -->
<section id="location" class="page">
  <h2>現在位置</h2>
  <div id="line-main-body" class="vertical-line-body"></div>
</section>

<!-- ============================
     各駅時刻表
============================ -->
<section id="timetable" class="page">
  <h2>各駅時刻表</h2>
  <select id="timetable-station"></select>
  <div id="timetable-body"></div>
</section>

<!-- ============================
     設定（ログイン＋列車追加）
============================ -->
<section id="settings" class="page">
  <h2>設定</h2>

  <div class="form-row">
    <label>パスワード</label>
    <input id="login-password" type="password">
    <button id="toggle-pass">表示</button>
  </div>

  <button id="btn-login" class="big-btn">ログイン</button>

  <h3>クラウド</h3>
  <button id="btn-save-cloud" class="big-btn admin-only" style="display:none;">クラウド保存</button>
  <button id="btn-load-cloud" class="big-btn">クラウド受信</button>

  <h3 class="admin-only" style="display:none;">列車追加</h3>

  <div id="train-add-area" class="admin-only" style="display:none;">

    <div class="form-row">
      <label>列車番号</label>
      <input id="add-number">
    </div>

    <div class="form-row">
      <label>種別</label>
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
      <label>行き先</label>
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
</body>
</html>
