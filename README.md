<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>列車管理システム（京王＋相模原 Y字）</title>

  <!-- Firebase -->
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
  <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

  <style>
    body{margin:0;font-family:system-ui,sans-serif;background:#f5f5f5;}
    header{background:#1f2933;color:#fff;padding:10px 16px;font-size:18px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;}
    #menu-btn{font-size:24px;cursor:pointer;display:none;}
    nav{background:#111827;display:flex;gap:16px;padding:8px 20px;flex-wrap:wrap;}
    nav a{color:#d1d5db;text-decoration:none;padding:6px 10px;border-radius:4px;}
    nav a.active{background:#2563eb;color:#fff;}
    main{padding:20px;}
    section{display:none;background:#fff;padding:20px;border-radius:8px;}
    section.active{display:block;}
    table{width:100%;border-collapse:collapse;margin-top:10px;}
    th,td{padding:8px;border-bottom:1px solid #ddd;}
    th{background:#2563eb;color:#fff;}
    .admin-only{display:none;}

    /* 入力 */
    .big-input,.big-select{
      width:100%;padding:10px;font-size:16px;margin:4px 0;
      border-radius:8px;border:1px solid #ccc;
    }

    /* ボタン */
    .cloud-btn{
      display:inline-block;padding:10px 16px;margin:6px 4px;
      font-size:15px;font-weight:bold;border-radius:8px;
      border:none;cursor:pointer;color:#fff;
    }
    .cloud-save{background:#16a34a;}
    .cloud-load{background:#2563eb;}

    /* 路線図 */
    #lines-wrapper{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;}
    .line-box{
      flex:1 1 260px;border:1px solid #ddd;border-radius:8px;
      background:#fafafa;padding:8px;
    }
    .line-title{font-weight:bold;margin-bottom:4px;font-size:14px;}
    .station-block{
      display:flex;align-items:flex-start;margin:8px 0;
      gap:8px;
    }
    .station-node{
      width:16px;height:16px;background:#d0006f;border-radius:50%;
      margin-top:4px;
    }
    .station-name{width:90px;font-weight:bold;font-size:13px;}

    /* カード（現在位置） */
    .train-card{
      background:#fff;border-radius:6px;padding:6px 8px;
      font-size:12px;min-width:140px;
      border:2px solid #9ca3af;margin-bottom:4px;
      cursor:pointer;
    }
    .train-number{font-weight:bold;font-size:13px;}
    .train-type{font-size:11px;opacity:.9;margin-bottom:4px;}
    .train-status{font-size:12px;}

    /* 種別色 */
    .type-local{border-color:#6b7280;color:#374151;}
    .type-rapid{border-color:#2563eb;color:#1d4ed8;}
    .type-semi-exp{border-color:#facc15;color:#ca8a04;}
    .type-exp{border-color:#22c55e;color:#15803d;}
    .type-ltd-exp{border-color:#ef4444;color:#b91c1c;}

    .line-segment{
      width:3px;height:32px;background:#d0006f;margin-left:7px;
    }

    @media(max-width:600px){
      #menu-btn{display:block;}
      nav{display:none;flex-direction:column;}
      .station-name{width:70px;font-size:12px;}
      .train-card{min-width:120px;}
    }
  </style>
</head>

<body>
<header>
  <span>列車管理システム（京王＋相模原 Y字）</span>
  <div id="menu-btn">☰</div>
</header>

<nav id="menu">
  <a href="#" class="active" data-target="train-list">列車一覧</a>
  <a href="#" data-target="train-detail">列車詳細</a>
  <a href="#" data-target="location">現在位置</a>
  <a href="#" data-target="settings">設定</a>
</nav>

<main>
<section id="train-list" class="active">
  <h2>列車一覧</h2>
  <input id="search-number" class="big-input" placeholder="列車番号で検索">
  <table id="train-table">
    <thead>
      <tr>
        <th>列車番号</th><th>種別</th><th>路線</th><th>方向</th>
        <th>始発</th><th>発車</th><th>終着</th><th>到着</th>
        <th class="admin-only">操作</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</section>

