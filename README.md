<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>列車管理システム</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body>

<header>
  <h1>列車管理</h1>
  <nav>
    <div id="hamburger">
      <span></span><span></span><span></span>
    </div>
    <div id="navLinks">
      <a data-page="list">列車番号一覧</a>
      <a data-page="stations">各駅時刻表</a>
      <a data-page="position">現在位置</a>
      <a data-page="settings">設定</a>
    </div>
  </nav>
</header>

<main>

  <!-- 列車番号一覧 -->
  <section id="page-list">
    <h2>列車番号一覧</h2>
    <input id="searchInput" placeholder="検索">
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
  </section>

  <!-- 列車詳細 -->
  <section id="page-detail" class="hidden">
    <div id="backToList">← 戻る</div>
    <div id="detailCard"></div>
    <table>
      <thead>
        <tr>
          <th>駅</th>
          <th>到着</th>
          <th>発車</th>
          <th>番線</th>
        </tr>
      </thead>
      <tbody id="detailTimetableBody"></tbody>
    </table>
  </section>

  <!-- 各駅時刻表 -->
  <section id="page-stations" class="hidden">
    <h2>各駅時刻表</h2>
    <select id="stationSelect"></select>
    <div id="directionToggle">
      <button id="dirUp">上り</button>
      <button id="dirDown">下り</button>
    </div>
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
  </section>

  <!-- 現在位置 -->
  <section id="page-position" class="hidden">
    <h2>現在位置</h2>

    <div>
      <input type="time" id="nowTimeInput">
      <button id="nowTimeSetBtn">現在時刻</button>
    </div>

    <div id="nowTimeLabel"></div>

    <div id="positionLayout">
      <div id="positionStationList"></div>
      <div id="positionTrainList"></div>
    </div>
  </section>

  <!-- 設定 -->
  <section id="page-settings" class="hidden">
    <h2>設定</h2>

    <div>
      <h3>クラウド保存 / 受信</h3>
      <button id="btnSaveCloud">保存</button>
      <button id="btnLoadCloud">受信</button>
    </div>

    <div>
      <h3>管理者モード</h3>
      <input type="password" id="adminPassword" placeholder="パスワード">
      <button id="btnLogin">ログイン</button>
      <div id="loginStatus"></div>
    </div>

    <div id="adminArea" class="hidden">
      <h3>列車追加 / 編集 / 削除</h3>

      <input id="admTrainNumber" placeholder="列車番号">
      <input id="admType" placeholder="種別">
      <input id="admOrigin" placeholder="始発駅">
      <input id="admDeparture" placeholder="発車">
      <input id="admDestination" placeholder="終着駅">
      <input id="admArrival" placeholder="到着">

      <button id="btnAddTrain">追加</button>
      <button id="btnUpdateTrain">編集</button>
      <button id="btnDeleteTrain">削除</button>
    </div>
  </section>

</main>

</body>
</html>

