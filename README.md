<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>tetsudo-site</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <!-- サイトのメインタイトル -->
    <header class="site-header">
        <h1>tetsudo-site</h1>
    </header>

    <!-- スマホ用：3本線メニューボタン -->
    <button class="hamburger" id="hamburger-btn">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <!-- タブナビゲーション（メニューバー：個別色分け） -->
    <div class="tabs" id="menu-tabs">
        <button class="tab-btn tab-all active" onclick="openTab(event, 'all')">すべて</button>
        <button class="tab-btn tab-keio" onclick="openTab(event, 'keio')">京王</button>
        <button class="tab-btn tab-jr" onclick="openTab(event, 'jr')">JR</button>
        <button class="tab-btn tab-shitetsu" onclick="openTab(event, 'shitetsu')">大手私鉄</button>
        <button class="tab-btn tab-documents" onclick="openTab(event, 'documents')">資料</button>
        <button class="tab-btn tab-other" onclick="openTab(event, 'other')">その他</button>
        <button class="tab-btn tab-settings" onclick="openTab(event, 'settings')">設定</button>
    </div>

    <!-- リンク一覧を表示するコンテナ -->
    <div class="link-container">
        
        <!-- すべて -->
        <div id="all" class="tab-content active">
            <ul class="link-list"></ul>
        </div>

        <!-- 京王 -->
        <div id="keio" class="tab-content">
            <ul class="link-list"></ul>
        </div>

        <!-- JR -->
        <div id="jr" class="tab-content">
            <ul class="link-list"></ul>
        </div>

        <!-- 大手私鉄 -->
        <div id="shitetsu" class="tab-content">
            <ul class="link-list"></ul>
        </div>

        <!-- 資料 -->
        <div id="documents" class="tab-content">
            <ul class="link-list"></ul>
        </div>

        <!-- その他 -->
        <div id="other" class="tab-content">
            <ul class="link-list"></ul>
        </div>

        <!-- 設定タブ -->
        <div id="settings" class="tab-content">
            <div class="settings-panel">
                <h3>同期と管理</h3>
                
                <div class="settings-section">
                    <div class="admin-actions-vertical">
                        <!-- クラウドから読込ボタン -->
                        <button class="btn btn-load btn-green-cloud">クラウドから読込 (受信)</button>
                        
                        <!-- 変更点：元サイトと同じスタイルのPassword入力欄 -->
                        <div class="password-box-wrapper" id="password-wrapper">
                            <input type="password" id="admin-password-input" placeholder="Password">
                        </div>
                        
                        <!-- ロック解除ボタン -->
                        <button class="btn btn-primary btn-blue-lock" id="auth-btn">ロック解除</button>
                    </div>
                </div>

                <div class="settings-section" style="border-top: none; padding-top: 0;">
                    <p id="lock-status" style="text-align: center; margin-bottom: 10px;">ステータス: ロック中（閲覧専用）</p>
                    <div class="admin-actions-vertical">
                        <button class="btn btn-primary btn-save" style="background-color: #6c757d;">クラウドに保存 (送信)</button>
                    </div>
                </div>

                <!-- URL追加フォーム -->
                <div class="settings-section" id="add-form-wrapper" style="display: none;">
                    <h4>URLの追加フォーム</h4>
                    <div class="form-group">
                        <label for="form-category">メニューバー選択 (カテゴリ)</label>
                        <select id="form-category">
                            <option value="keio">京王</option>
                            <option value="jr">JR</option>
                            <option value="shitetsu">大手私鉄</option>
                            <option value="documents">資料</option>
                            <option value="other">その他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="form-title">タイトル</label>
                        <input type="text" id="form-title" placeholder="例: 京王電鉄 公式サイト">
                    </div>
                    <div class="form-group">
                        <label for="form-url">URL</label>
                        <input type="text" id="form-url" placeholder="例: https://keio.co.jp">
                    </div>
                    <div class="form-group">
                        <label for="form-detail">詳細（説明文）</label>
                        <textarea id="form-detail" rows="3" placeholder="サイトの説明やメモを入力してください（省略可）"></textarea>
                    </div>
                    <button class="btn btn-primary" id="add-btn" style="width: 100%; margin-top: 10px;">この内容でリストに追加</button>
                </div>
            </div>
        </div>

    </div>

    <!-- Firebase SDK の読み込み -->
    <script src="https://gstatic.com"></script>
    <script src="https://gstatic.com"></script>
    <!-- メインプログラム -->
    <script src="app.js"></script>
</body>
</html>

