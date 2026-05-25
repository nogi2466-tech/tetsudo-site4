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
