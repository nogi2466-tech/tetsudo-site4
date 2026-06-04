// ==========================================
// 1. 初期データの設定（データが空の時のサンプル）
// ==========================================
const defaultData = [
    { id: 1, title: "京王電鉄 公式サイト", url: "https://keio.co.jp", category: "keio" },
    { id: 2, title: "JR東日本 公式サイト", url: "https://jreast.co.jp", category: "jr" },
    { id: 3, title: "東急電鉄 公式サイト", url: "https://tokyu.co.jp", category: "shitetsu" }
];

// ローカルストレージからデータを読み込む（無ければ初期データを使用）
let links = JSON.parse(localStorage.getItem('tetsudo_links')) || defaultData;
let isLocked = true; // 初期状態はロック（編集不可）

// ==========================================
// 2. 画面の表示・更新処理
// ==========================================
function renderLinks() {
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1];
    
    // 各カテゴリのリスト要素を取得
    const containers = {
        all: document.querySelector('#all .link-list'),
        keio: document.querySelector('#keio .link-list'),
        jr: document.querySelector('#jr .link-list'),
        shitetsu: document.querySelector('#shitetsu .link-list'),
        other: document.querySelector('#other .link-list')
    };

    // 一旦すべてのリストを空にする
    Object.values(containers).forEach(el => { if(el) el.innerHTML = ''; });

    // データをループ処理して画面に生成
    links.forEach(item => {
        // 削除ボタン（ロック解除時のみ表示）
        const deleteBtn = !isLocked ? `<button class="btn-delete" onclick="deleteLink(${item.id})" style="margin-left:10px; background:#ff4d4d; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">削除</button>` : '';
        
        const html = `<li class="link-item" data-id="${item.id}">
            <a href="${item.url}" target="_blank">${item.title}</a>
            ${deleteBtn}
        </li>`;

        // 「すべて」タブに追加
        if (containers.all) containers.all.insertAdjacentHTML('beforeend', html);

        // 各カテゴリタブに追加
        if (containers[item.category]) {
            containers[item.category].insertAdjacentHTML('beforeend', html);
        }
    });

    // データが空の場合のメッセージ処理
    Object.keys(containers).forEach(key => {
        if (containers[key] && containers[key].children.length === 0) {
            containers[key].innerHTML = '<p style="text-align: center; color: #999;">登録されているリンクはありません。</p>';
        }
    });
}

// ==========================================
// 3. タブ切り替え処理
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
    targetContent.style.display = "block";
    targetContent.classList.add('active');
    evt.currentTarget.classList.add('active');

    // タブ切り替え時に表示をリフレッシュ
    renderLinks();
}

// ==========================================
// 4. ボタンのイベント・機能
// ==========================================

// [ロック解除] ボタンの処理
document.querySelector('.admin-actions button:nth-child(2)').addEventListener('click', (e) => {
    isLocked = !isLocked;
    e.target.textContent = isLocked ? "ロック解除" : "ロックする";
    e.target.style.backgroundColor = isLocked ? "#fff" : "#ffc107";
    renderLinks(); // 削除ボタンの表示・非表示を切り替えるため再描画
});

// [リストに追加] ボタンの処理
document.querySelector('.class-add').addEventListener('click', () => {
    if (isLocked) {
        alert("ロックを解除してから追加してください。");
        return;
    }

    const title = prompt("サイト名を入力してください:");
    if (!title) return;
    
    const url = prompt("URLを入力してください (http:// または https:// から):");
    if (!url) return;

    const category = prompt("カテゴリを入力してください\n(keio, jr, shitetsu, other のいずれか):");
    if (!['keio', 'jr', 'shitetsu', 'other'].includes(category)) {
        alert("正しいカテゴリ名を入力してください。other（その他）に分類します。");
    }

    const newLink = {
        id: Date.now(), // 重複しないIDを生成
        title: title,
        url: url,
        category: category || 'other'
    };

    links.push(newLink);
    renderLinks();
});

// [削除] ボタンの処理
function deleteLink(id) {
    if (isLocked) return;
    if (confirm("このリンクを削除してもよろしいですか？")) {
        links = links.filter(item => item.id !== id);
        renderLinks();
    }
}

// [クラウドに保存 (送信)] ボタンの処理
document.querySelector('.btn-primary').addEventListener('click', () => {
    localStorage.setItem('tetsudo_links', JSON.stringify(links));
    alert("ローカルストレージにデータを保存しました！");
});

// [クラウドから読込 (受信)] ボタンの処理
document.querySelector('.admin-actions button:nth-child(1)').addEventListener('click', () => {
    const savedData = localStorage.getItem('tetsudo_links');
    if (savedData) {
        links = JSON.parse(savedData);
        renderLinks();
        alert("ローカルストレージからデータを読み込みました！");
    } else {
        alert("保存されたデータがありません。");
    }
});

// ページを開いたときに最初の表示を実行
window.onload = () => {
    renderLinks();
};

