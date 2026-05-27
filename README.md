<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>列車運行システム</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- CSS -->
  <link rel="stylesheet" href="style.css">

  <!-- Firebase CDN（Realtime Database が動く唯一の方法） -->
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>
</head>

<body>

<header>
  <h1>列車運行システム</h1>

  <!-- 右上の時計 -->
  <div id="clock" style="margin-left:auto; font-size:14px;"></div>

  <nav>
    <div id="hamburger">
      <span></span><span></span><span></span>
    </div>
    <div id="navLinks">
      <a href="javascript:void(0)" data-page="page-list" class="active">列車番号一覧</a>
      <a href="javascript:void(0)" data-page="page-position">現在位置</a>
      <a href="javascript:void(0)" data-page="page-stations">各駅時刻表</a>
      <a href="javascript:void(0)" data-page="page-settings">設定</a>
    </div>
  </nav>
</header>

<main>

  <!-- 列車番号一覧 -->
  <section id="page-list">
    <h2>列車番号一覧</h2>
    <div class="card">
      <input id="searchInput" placeholder="列車番号・行き先・駅名などで検索">
      <div style="overflow-x:auto;">
        <table>
          <thead>
          <tr>
            <th>列車番号</th>
            <th>種別</th>
            <th>行き先</th>
            <th>始発</th>
            <th>発車</th>
            <th>終着</th>
            <th>到着</th>
          </tr>
          </thead>
          <tbody id="trainListBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 現在位置 -->
  <section id="page-position" class="hidden">
    <h2>現在位置</h2>

    <!-- 上り下り切替 -->
    <div style="margin-bottom:10px;">
      <button id="posUp" class="active">上り</button>
      <button id="posDown">下り</button>
    </div>

    <!-- 時刻入力 -->
    <div style="margin-bottom:8px;">
      <input type="time" id="nowTimeInput">
      <button id="nowTimeSetBtn">現在時刻を反映</button>
    </div>

    <div id="positionLayout">
      <div id="positionStationList"></div>
      <div id="positionTrainList"></div>
    </div>
  </section>

  <!-- 各駅時刻表 -->
  <section id="page-stations" class="hidden">
    <h2>各駅時刻表</h2>
    <div class="card">
      <div style="margin-bottom:8px;">
        <select id="stationSelect"></select>
        <span id="directionToggle">
          <button id="dirUp" class="active">上り</button>
          <button id="dirDown">下り</button>
        </span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
          <tr>
            <th>列車番号</th>
            <th>種別</th>
            <th>行き先</th>
            <th>到着</th>
            <th>発車</th>
          </tr>
          </thead>
          <tbody id="stationTableBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 設定 -->
  <section id="page-settings" class="hidden">
    <h2>設定</h2>

    <div class="card">
      <h3>クラウド保存 / 受信</h3>
      <button id="btnSaveCloud">保存</button>
      <button id="btnLoadCloud">受信</button>
      <p style="font-size:12px;color:#6b7280;">
        Firebase Realtime Database を使用します。
      </p>
    </div>

    <div class="card">
      <h3>管理者モード</h3>
      <input type="password" id="adminPassword" placeholder="パスワード">
      <button id="btnLogin">ログイン</button>
      <div id="loginStatus" style="font-size:12px;margin-top:4px;"></div>

      <div id="adminArea" class="hidden" style="margin-top:10px;">
        <h3>列車追加 / 編集 / 削除</h3>
        <input id="admTrainNumber" placeholder="列車番号">
        <input id="admType" placeholder="種別">
        <input id="admOrigin" placeholder="始発駅">
        <input id="admDeparture" placeholder="発車 (HH:MM)">
        <input id="admDestination" placeholder="終着駅">
        <input id="admArrival" placeholder="到着 (HH:MM)">
        <div style="margin-top:6px;">
          <button id="btnAddTrain">追加</button>
          <button id="btnUpdateTrain">編集</button>
          <button id="btnDeleteTrain">削除</button>
        </div>
      </div>
    </div>
  </section>

</main>

<!-- ナビゲーション -->
<script>
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });

  navLinks.addEventListener("click", (e) => {
    const pageId = e.target.getAttribute("data-page");
    if (!pageId) return;
    e.preventDefault();
    document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
    document.getElementById(pageId).classList.remove("hidden");
    navLinks.querySelectorAll("a").forEach(a => a.classList.remove("active"));
    e.target.classList.add("active");
    navLinks.classList.remove("show");
  });
</script>

<!-- 時計 -->
<script>
  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,"0");
    const mm = String(now.getMinutes()).padStart(2,"0");
    const ss = String(now.getSeconds()).padStart(2,"0");
    document.getElementById("clock").textContent = `${hh}:${mm}:${ss}`;
  }
  setInterval(updateClock, 1000);
  updateClock();
</script>

<!-- メインロジック -->
<script src="app.js"></script>

</body>
</html>
