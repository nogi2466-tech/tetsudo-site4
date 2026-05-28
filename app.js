/* ===============================
   Firebase 初期化
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAxJVAx7CIK4U21Qxl20n4yxagcl9dfItE",
  authDomain: "train-system-9622f.firebaseapp.com",
  databaseURL: "https://train-system-9622f-default-rtdb.firebaseio.com",
  projectId: "train-system-9622f",
  storageBucket: "train-system-9622f.appspot.com",
  messagingSenderId: "1066598708695",
  appId: "1:1066598708695:web:e682df702e58caaaedc792",
  measurementId: "G-CKP4Z2F65W"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ===============================
   駅リスト（分岐構造）
================================ */
const MAIN = [
  "新宿","笹塚","代田橋","明大前","下高井戸","桜上水","上北沢","八幡山",
  "芦花公園","千歳烏山","仙川","つつじヶ丘","柴崎","国領","布田","調布",
  "西調布","飛田給","武蔵野台","多磨霊園","東府中","府中","分倍河原",
  "中河原","聖蹟桜ヶ丘","百草園","高幡不動","南平","平山城址公園",
  "長沼","北野","京王八王子"
];

const SAGAMI = [
  "調布","京王多摩川","京王稲田堤","京王よみうりランド","稲城","若葉台",
  "京王永山","京王多摩センター","京王堀之内","南大沢","多摩境","橋本"
];

const TAKAO = [
  "北野","京王片倉","山田","めじろ台","狭間","高尾","高尾山口"
];

const ALL_STATIONS = [
  ...MAIN,
  ...SAGAMI.filter(s => !MAIN.includes(s)),
  ...TAKAO.filter(s => !MAIN.includes(s))
];

let trains = {};
let currentDirection = "up";

/* ===============================
   時刻 → ミリ秒
================================ */
function timeToMs(t) {
  if (!t) return null;
  return new Date(`2000-01-01T${t}:00`).getTime();
}

/* ===============================
   現在位置：位置計算
================================ */
function getCurrentPositions(nowMs) {
  const result = [];

  Object.values(trains).forEach(t => {
    const tt = t.timetable || [];

    for (let i = 0; i < tt.length; i++) {
      const s = tt[i];
      const arrMs = timeToMs(s.arr);
      const depMs = timeToMs(s.dep);

      // 停車中
      if (arrMs && depMs && nowMs >= arrMs && nowMs < depMs) {
        result.push({
          station: s.station,
          platform: s.platform,
          between: false,
          trainNumber: t.trainNumber,
          type: t.type,
          destination: t.destination
        });
        return;
      }

      // 駅間走行
      if (depMs && i + 1 < tt.length) {
        const nextArrMs = timeToMs(tt[i + 1].arr);
        if (nextArrMs && nowMs > depMs && nowMs < nextArrMs) {
          result.push({
            station: s.station,
            nextStation: tt[i + 1].station,
            between: true,
            trainNumber: t.trainNumber,
            type: t.type,
            destination: t.destination
          });
          return;
        }
      }
    }
  });

  return result;
}
