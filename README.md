<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>tetsudo-site風 URL一覧</title>
    <style>
        /* 全体のデザイン調整 */
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
            color: #333;
        }

        h1 {
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
        }

        /* 管理ボタンエリア */
        .admin-actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .btn {
            background-color: #fff;
            border: 1px solid #ccc;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        .btn:hover {
            background-color: #e0e0e0;
        }

        .btn-primary {
            background-color: #007bff;
            color: white;
            border: none;
        }

        .btn-primary:hover {
            background-color: #0056b3;
        }

        /* タブメニューのデザイン */
        .tabs {
            display: flex;
            justify-content: center;
            gap: 5px;
            border-bottom: 2px solid #ccc;
            margin-bottom: 20px;
            overflow-x: auto;
            white-space: nowrap;
        }

        .tab-btn {
            background: none;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            color: #666;
            border-bottom: 3px solid transparent;
        }

        .tab-btn:hover {
            color: #333;
        }

        /* アクティブなタブのスタイル */
        .tab-btn.active {
            color: #007bff;
            font-weight: bold;
            border-bottom: 3px solid #007bff;
        }

        /* リンクアイテムのリストデザイン */
        .link-container {
            max-width: 600px;
            margin: 0 auto;
        }

        .tab-content {
            display: none; /* 初期状態はすべて非表示 */
        }

        .tab-content.active {
            display: block; /* アクティブなカテゴリだけ表示 */
        }

        .link-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .link-item {
            background-color: #fff;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .link-item a {
            color: #333;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
        }

        .link-item a:hover {
            color: #007bff;
            text-decoration: underline;
        }
    </style>
</head>
<body>

    <h1>tetsudo-site</h1>

    <!-- 同期・管理ボタンエリア -->
    <div class="admin-actions">
        <button class="btn">クラウドから読込 (受信)</button>
        <button class="btn">ロック解除</button>
        <button class="btn class-add">リストに追加</button>
        <button class="btn btn-primary">クラウドに保存 (送信)</button>
    </div>

    <!-- タブナビゲーション -->
    <div class="tabs">
        <button class="tab-btn active" onclick="openTab(event, 'all')">すべて</button>
        <button class="tab-btn" onclick="openTab(event, 'keio')">京王</button>
        <button class="tab-btn" onclick="openTab(event, 'jr')">JR</button>
        <button class="tab-btn" onclick="openTab(event, 'shitetsu')">大手私鉄</button>
        <button class="tab-btn" onclick="openTab(event, 'other')">その他</button>
    </div>

    <!-- リンク一覧コンテンツ -->
    <div class="link-container">
        
        <!-- すべて -->
        <div id="all" class="tab-content active">
            <ul class="link-list">
                <li class="link-item"><a href="https://keio.co.jp" target="_blank">京王電鉄 公式サイト</a></li>
                <li class="link-item"><a href="https://jreast.co.jp" target="_blank">JR東日本 公式サイト</a></li>
                <li class="link-item"><a href="https://tokyu.co.jp" target="_blank">東急電鉄 公式サイト</a></li>
            </ul>
        </div>

        <!-- 京王 -->
        <div id="keio" class="tab-content">
            <ul class="link-list">
                <li class="link-item"><a href="https://keio.co.jp" target="_blank">京王電鉄 公式サイト</a></li>
            </ul>
        </div>

        <!-- JR -->
        <div id="jr" class="tab-content">
            <ul class="link-list">
                <li class="link-item"><a href="https://jreast.co.jp" target="_blank">JR東日本 公式サイト</a></li>
            </ul>
        </div>

        <!-- 大手私鉄 -->
        <div id="shitetsu" class="tab-content">
            <ul class="link-list">
                <li class="link-item"><a href="https://tokyu.co.jp" target="_blank">東急電鉄 公式サイト</a></li>
            </ul>
        </div>

        <!-- その他 -->
        <div id="other" class="tab-content">
            <ul class="link-list">
                <p style="text-align: center; color: #999;">登録されているリンクはありません。</p>
            </ul>
        </div>

    </div>

    <!-- タブ切り替え用のJavaScript -->
    <script>
        function openTab(evt, categoryName) {
            // すべてのコンテンツを非表示にする
            const tabContents = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].style.display = "none";
            }

            // すべてのタブボタンから「active」クラスを削除
            const tabButtons = document.getElementsByClassName("tab-btn");
            for (let i = 0; i < tabButtons.length; i++) {
                tabButtons[i].className = tabButtons[i].className.replace(" active", "");
            }

            // 指定されたカテゴリのコンテンツを表示し、ボタンをアクティブにする
            document.getElementById(categoryName).style.display = "block";
            evt.currentTarget.className += " active";
        }
    </script>

</body>
</html>

