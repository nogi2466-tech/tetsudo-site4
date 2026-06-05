// ==========================================
// 1. 初期データの設定
// ==========================================
const defaultData = [
    { id: 1, title: "京王電鉄 公式サイト", url: "https://keio.co.jp", category: "keio", detail: "運行情報や時刻表の確認はこちらから。" },
    { id: 2, title: "JR東日本 公式サイト", url: "https://jreast.co.jp", category: "jr", detail: "新幹線や在来線の予約・運行状況。" },
    { id: 3, title: "東急電鉄 公式サイト", url: "https://tokyu.co.jp", category: "shitetsu", detail: "東横線、田園都市線などの運行案内。" },
    { id: 4, title: "鉄道安全報告書 (資料)", url: "#", category: "documents", detail: "本年度の安全管理に関する資料PDFデータです。" }
];

let links = JSON.parse(localStorage.getItem('tetsudo_links')) || defaultData;
let isLocked = true;

// ==========================================
// 2. 画面の表示・更新処理
// ==========================================
function renderLinks() {
    const containers = {
        all: document.querySelector('#all .link-list'),
        keio: document.querySelector('#keio .link-list'),
        jr: document.querySelector('#jr .link-list'),
        shitetsu: document.querySelector('#shitetsu .link-list'),
        documents: document.querySelector('#documents .link-list'),
        other: document.querySelector('#other .link-list')
    };

    Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

    links.forEach(item => {
        // パスワード解除時のみ、編集と削除のボタンを表示する
        let actionButtons = '';
        if (!isLocked) {
            actionButtons = `
                <div class="item-actions">
                    <button class="btn-edit" onclick="editLink(${item.id})">編集</button>
                    <button class="btn-delete" onclick="deleteLink(${item.id})">削除</button>
                </div>
            `;
        }
        
        const detailHtml = item.detail ? `<div class="link-detail">${item.detail}</div>` : '';

        const html = `<li class="link-item" data-id="${item.id}">
            <div class="link-row">
                <a href="${item.url}" target="_blank">${item.title}</a>
                ${actionButtons}
            </div>
            ${detailHtml}
        </li>`;

        // 「資料(documents)」以外のデータを「すべて」に表示する
        if (item.category !== 'documents') {
            if (containers.all) containers.all.insertAdjacentHTML('beforeend', html);
        }

        // 各割り当てタブに表示
        if (containers[item.category]) {
            containers[item.category].insertAdjacentHTML('beforeend', html);
        }
    });

    Object.keys(containers).forEach(key => {
        if (containers[key] && containers[key].children.length === 0) {
            containers[key].innerHTML = '<p style="text-align: center; color: #999; padding: 20px 0;">登録されているリンクはありません。</p>';
        }
    });
}

// ==========================================
// 3. タブ（メニュー）切り替え処理
// ==========================================
function openTab(evt, categoryName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
        tabContents[i].classList.remove('active');
    }

    const tabButtons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    const targetContent = document.getElementById(categoryName);
    if (targetContent) {
        targetContent.style.display = "block";
        targetContent.classList.add('active');
    }
    evt.currentTarget.classList.add('active');

    document.getElementById('menu-tabs').classList.remove('open');
    document.getElementById('hamburger-btn').classList.remove('open');

    renderLinks();
}

document.getElementById('hamburger-btn').addEventListener('click', function() {
    this.classList.toggle('open');
    document.getElementById('menu-tabs').classList.toggle('open');
});

// ==========================================
// 4. 設定・編集機能（直接編集ロジック追加）
// ==========================================

// パスワード入力によるロック解除
document.getElementById('auth-btn').addEventListener('click', function() {
    if (!isLocked) {
        isLocked = true;
        this.textContent = "パスワード入力で解除";
        document.getElementById('lock-status').textContent = "ステータス: ロック中（閲覧専用）";
        document.getElementById('lock-status').style.color = "#ff4d4d";
        document.getElementById('add-form-wrapper').style.display = "none";
        renderLinks();
        return;
    }

    const password = prompt("管理用パスワードを入力してください:");
    if (password === "0829") {
        isLocked = false;
        this.textContent = "再びロックする";
        document.getElementById('lock-status').textContent = "ステータス: 解除済み（編集可能）";
        document.getElementById('lock-status').style.color = "#009933";
        document.getElementById('add-form-wrapper').style.display = "block";
        alert("認証に成功しました。各メニュー画面から直接「編集・削除」が行えます。");
        renderLinks();
    } else if (password !== null) {
        alert("パスワードが違います。");
    }
});

// メニュー画面から直接呼び出せる編集処理
function editLink(id) {
    if (isLocked) return;

    // 対象のデータをIDで探す
    const targetItem = links.find(item => item.id === id);
    if (!targetItem) return;

    // 現在の値を初期値としてポップアップで入力を促す
    const newTitle = prompt("新しいタイトルを入力してください:", targetItem.title);
    if (newTitle === null) return; // キャンセルされたら処理中断
    
    const newUrl = prompt("新しいURLを入力してください:", targetItem.url);
    if (newUrl === null) return;

    const newDetail = prompt("新しい詳細（説明文）を入力してください:", targetItem.detail || "");
    if (newDetail === null) return;

    // データの書き換え
    targetItem.title = newTitle.trim() || targetItem.title;
    targetItem.url = newUrl.trim() || targetItem.url;
    targetItem.detail = newDetail.trim();

    alert("リンク情報を変更しました！設定から「クラウドに保存」を忘れずに行ってください。");
    renderLinks(); // 画面を再描写して変更を反映
}

// 入力フォームからURLリストへの追加
document.getElementById('add-btn').addEventListener('click', () => {
    if (isLocked) return;

    const category = document.getElementById('form-category').value;
    const title = document.getElementById('form-title').value.trim();
    const url = document.getElementById('form-url').value.trim();
    const detail = document.getElementById('form-detail').value.trim();

    if (!title || !url) {
        alert("タイトルとURLは必ず入力してください。");
        return;
    }

    const newLink = {
        id: Date.now(),
        title: title,
        url: url,
        category: category,
        detail: detail
    };

    links.push(newLink);
    renderLinks();

    document.getElementById('form-title').value = '';
    document.getElementById('form-url').value = '';
    document.getElementById('form-detail').value = '';

    alert("リストに追加しました！");
});

// 削除処理
function deleteLink(id) {
    if (isLocked) return;
    if (confirm("このリンクを削除してもよろしいですか？")) {
        links = links.filter(item => item.id !== id);
        renderLinks();
    }
}

// 保存ボタン（送信）
document.querySelector('.btn-save').addEventListener('click', () => {
    localStorage.setItem('tetsudo_links', JSON.stringify(links));
    alert("ローカルストレージにデータを保存しました！");
});

// 読込ボタン（受信）
document.querySelector('.btn-load').addEventListener('click', () => {
    const savedData = localStorage.getItem('tetsudo_links');
    if (savedData) {
        links = JSON.parse(savedData);
        renderLinks();
        alert("ローカルストレージからデータを読み込みました！");
    } else {
        alert("保存されたデータがありません。");
    }
});

window.onload = () => {
    renderLinks();
};

