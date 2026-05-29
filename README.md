<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>列車管理システム</title>
    <style>
        body {
            font-family: sans-serif;
            background: #f4f4f4;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        .container {
            max-width: 800px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
        }
        th {
            background: #eee;
        }
        .form-area {
            margin-top: 20px;
        }
        input, select, button {
            padding: 8px;
            margin: 5px 0;
            width: 100%;
        }
        button {
            background: #0078d7;
            color: white;
            border: none;
            cursor: pointer;
        }
        button:hover {
            background: #005fa3;
        }
    </style>
</head>
<body>

<div class="container">
    <h1>🚆 列車管理システム</h1>

    <table id="trainTable">
        <thead>
            <tr>
                <th>ID</th>
                <th>列車名</th>
                <th>状態</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

    <div class="form-area">
        <h2>列車を追加</h2>
        <input type="text" id="trainName" placeholder="列車名を入力">
        <select id="trainStatus">
            <option value="運行中">運行中</option>
            <option value="遅延">遅延</option>
            <option value="停止中">停止中</option>
        </select>
        <button onclick="addTrain()">追加</button>
    </div>
</div>

<script>
    let trains = [];
    let idCounter = 1;

    function renderTable() {
        const tbody = document.querySelector("#trainTable tbody");
        tbody.innerHTML = "";

        trains.forEach(train => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${train.id}</td>
                <td>${train.name}</td>
                <td>${train.status}</td>
                <td>
                    <select onchange="updateStatus(${train.id}, this.value)">
                        <option value="運行中" ${train.status === "運行中" ? "selected" : ""}>運行中</option>
                        <option value="遅延" ${train.status === "遅延" ? "selected" : ""}>遅延</option>
                        <option value="停止中" ${train.status === "停止中" ? "selected" : ""}>停止中</option>
                    </select>
                    <button onclick="deleteTrain(${train.id})">削除</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    function addTrain() {
        const name = document.getElementById("trainName").value;
        const status = document.getElementById("trainStatus").value;

        if (!name) {
            alert("列車名を入力してください");
            return;
        }

        trains.push({
            id: idCounter++,
            name,
            status
        });

        document.getElementById("trainName").value = "";
        renderTable();
    }

    function updateStatus(id, newStatus) {
        const train = trains.find(t => t.id === id);
        if (train) {
            train.status = newStatus;
            renderTable();
        }
    }

    function deleteTrain(id) {
        trains = trains.filter(t => t.id !== id);
        renderTable();
    }
</script>

</body>
</html>
