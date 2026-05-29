<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>列車管理システム</title>
<style>
    body { font-family: sans-serif; margin: 0; background: #f4f4f4; }
    header {
        background: #005bac;
        padding: 10px;
        color: white;
        display: flex;
        gap: 20px;
    }
    header div { cursor: pointer; }
    .active { font-weight: bold; text-decoration: underline; }
    .page { display: none; padding: 20px; }
    .container { background: white; padding: 20px; border-radius: 10px; max-width: 900px; margin: auto; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
    th { background: #eee; }
    input, select, button { padding: 8px; margin: 5px 0; width: 100%; }
    button { background: #0078d7; color: white; border: none; cursor: pointer; }
    button:hover { background: #005fa3; }
    .station-box { border: 1px solid #ccc; padding: 10px; margin-top: 10px; border-radius: 5px; }
</style>
</head>
<body>

<header>
    <div onclick="showPage('list')" id="menu-list" class="active">列車番号一覧</div>
    <div onclick="showPage('detail')" id="menu-detail">列車詳細</div>
    <div onclick="showPage('location')" id="menu-location">現在位置</div>
    <div onclick="showPage('timetable')" id="menu-timetable">各駅時刻表</div>
    <div onclick="showPage('settings')" id="menu-settings">設定</div>
</header>

<!-- 列車番号一覧 -->
<div id="page-list" class="page" style="display:block;">
    <div class="container">
        <h2>列車番号一覧</h2>
        <table id="trainTable">
            <thead>
                <tr>
                    <th>列車番号</th>
                    <th>種別</th>
                    <th>行き先</th>
                    <th>始発駅</th>
                    <th>発車時間</th>
                    <th>終着駅</th>
                    <th>到着時間</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

<!-- 列車詳細 -->
<div id="page-detail" class="page">
    <div class="container">
        <h2>列車詳細</h2>
        <div id="detailContent">列車を選択してください</div>
    </div>
</div>

<!-- 現在位置 -->
<div id="page-location" class="page">
    <div class="container">
        <h2>現在位置</h2>
        <div id="locationContent">列車を選択してください</div>
    </div>
</div>

<!-- 各駅時刻表 -->
<div id="page-timetable" class="page">
    <div class="container">
        <h2>各駅時刻表</h2>
        <div id="timetableContent">列車を選択してください</div>
    </div>
</div>

<!-- 設定 -->
<div id="page-settings" class="page">
    <div class="container">
        <h2>設定</h2>

        <h3>クラウド保存（ローカル保存）</h3>
        <button onclick="saveData()">保存</button>
        <button onclick="loadData()">受信</button>

        <h3>列車追加（パスワード必要）</h3>
        <input id="passwordInput" placeholder="パスワードを入力">
        <button onclick="checkPassword()">送信</button>

        <div id="addTrainArea" style="display:none; margin-top:20px;">
            <h3>列車追加フォーム</h3>

            <input id="trainNo" placeholder="列車番号">
            <input id="trainType" placeholder="種別（例：快速）">
            <input id="destination" placeholder="行き先">
            <input id="startStation" placeholder="始発駅">
            <input id="startTime" placeholder="発車時間（例：10:30）">
            <input id="endStation" placeholder="終着駅">
            <input id="endTime" placeholder="到着時間（例：12:05）">

            <h3>各駅時刻・番線</h3>
            <div id="stationList"></div>
            <button onclick="addStation()">駅を追加</button>

            <button onclick="addTrain()">列車を追加</button>
        </div>
    </div>
</div>

<script>
let trains = [];
let selectedTrain = null;

// 初期ロード
window.onload = () => {
    loadData();
    renderTable();
};

// ページ切り替え
function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.querySelectorAll("header div").forEach(m => m.classList.remove("active"));

    document.getElementById("page-" + page).style.display = "block";
    document.getElementById("menu-" + page).classList.add("active");

    if (page === "list") renderTable();
    if (page === "detail") renderDetail();
    if (page === "location") renderLocation();
    if (page === "timetable") renderTimetable();
}

// パスワードチェック
function checkPassword() {
    const pw = document.getElementById("passwordInput").value;
    if (pw === "0829") {
        document.getElementById("addTrainArea").style.display = "block";
    } else {
        alert("パスワードが違います");
    }
}

// 駅追加
function addStation() {
    const box = document.createElement("div");
    box.className = "station-box";
    box.innerHTML = `
        <input placeholder="駅名" class="st-name">
        <input placeholder="到着時刻" class="st-arr">
        <input placeholder="発車時刻" class="st-dep">
        <input placeholder="番線" class="st-track">
    `;
    document.getElementById("stationList").appendChild(box);
}

// 列車追加
function addTrain() {
    const train = {
        no: document.getElementById("trainNo").value,
        type: document.getElementById("trainType").value,
        dest: document.getElementById("destination").value,
        start: document.getElementById("startStation").value,
        startTime: document.getElementById("startTime").value,
        end: document.getElementById("endStation").value,
        endTime: document.getElementById("endTime").value,
        stations: []
    };

    // 各駅データ取得
    document.querySelectorAll(".station-box").forEach(box => {
        train.stations.push({
            name: box.querySelector(".st-name").value,
            arr: box.querySelector(".st-arr").value,
            dep: box.querySelector(".st-dep").value,
            track: box.querySelector(".st-track").value
        });
    });

    trains.push(train);

    // 列車番号順にソート
    trains.sort((a, b) => a.no.localeCompare(b.no, "ja"));

    saveData();
    renderTable();
    showPage("list");
}

// 列車一覧表示
function renderTable() {
    const tbody = document.querySelector("#trainTable tbody");
    tbody.innerHTML = "";

    trains.forEach(train => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><a href="#" onclick="selectTrain('${train.no}')">${train.no}</a></td>
            <td>${train.type}</td>
            <td>${train.dest}</td>
            <td>${train.start}</td>
            <td>${train.startTime}</td>
            <td>${train.end}</td>
            <td>${train.endTime}</td>
        `;
        tbody.appendChild(row);
    });
}

// 列車選択
function selectTrain(no) {
    selectedTrain = trains.find(t => t.no === no);
    showPage("detail");
}

// 列車詳細
function renderDetail() {
    if (!selectedTrain) {
        document.getElementById("detailContent").innerText = "列車を選択してください";
        return;
    }

    let html = `
        <h3>${selectedTrain.no}（${selectedTrain.type}）</h3>
        <p>行き先：${selectedTrain.dest}</p>
        <p>始発駅：${selectedTrain.start}（${selectedTrain.startTime} 発）</p>
        <p>終着駅：${selectedTrain.end}（${selectedTrain.endTime} 着）</p>
        <h3>各駅時刻</h3>
        <table>
            <tr><th>駅名</th><th>到着</th><th>発車</th><th>番線</th></tr>
    `;

    selectedTrain.stations.forEach(s => {
        html += `
            <tr>
                <td>${s.name}</td>
                <td>${s.arr}</td>
                <td>${s.dep}</td>
                <td>${s.track}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById("detailContent").innerHTML = html;
}

// 現在位置（仮）
function renderLocation() {
    if (!selectedTrain) {
        document.getElementById("locationContent").innerText = "列車を選択してください";
        return;
    }
    document.getElementById("locationContent").innerText =
        `${selectedTrain.no} の現在位置は未設定です`;
}

// 各駅時刻表
function renderTimetable() {
    if (!selectedTrain) {
        document.getElementById("timetableContent").innerText = "列車を選択してください";
        return;
    }

    let html = `<h3>${selectedTrain.no} 各駅時刻表</h3><table>
        <tr><th>駅名</th><th>到着</th><th>発車</th><th>番線</th></tr>`;

    selectedTrain.stations.forEach(s => {
        html += `
            <tr>
                <td>${s.name}</td>
                <td>${s.arr}</td>
                <td>${s.dep}</td>
                <td>${s.track}</td>
            </tr>
        `;
    });

    html += "</table>";

    document.getElementById("timetableContent").innerHTML = html;
}

// 保存
function saveData() {
    localStorage.setItem("trainData", JSON.stringify(trains));
    alert("保存しました");
}

// 読み込み
function loadData() {
    const data = localStorage.getItem("trainData");
    if (data) trains = JSON.parse(data);
}
</script>

</body>
</html>
