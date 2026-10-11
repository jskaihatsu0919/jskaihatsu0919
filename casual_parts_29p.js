/* =========================================================================
   カジュアル版 29ページ標準構成の補助部品集  casual_parts_29p.js
   -------------------------------------------------------------------------
   06_カジュアル版デザイン仕様.md「標準構成（29ページ版）」のうち、
   deck_kit_casual.js に無い「(K組み)」ページを組むための部品です。
   基準実装（1980/8/22 版・1977/6/7 版 v2）のレイアウトをそのまま関数化したもの。
   個々のビルドで図形を描き直さず、必ず本部品を使います。

   使い方：
     const { newCasualDeck } = require("./deck_kit_casual");
     const { attach29 } = require("./casual_parts_29p");
     const deck = newCasualDeck();
     const P29 = attach29(deck);          // deck の K / G / B / C を共有する
     const s = deck.K.light("いちばん大事なことは2つ", "結論");
     P29.bigCard(s, 0.8, 1.95, 5.6, 4.0, "土", "見出し", "本文…", "根拠：…", 1);
   ========================================================================= */

function attach29(deck) {
  const { p, K, G, B, C, L, W } = deck;
  const F = "游ゴシック";
  const pal = (el) => (el && G[el] ? G[el] : B);
  const P29 = {};

  /* ---- 6ページ「いちばん大事なこと」用：番号バッジ付き大カード ---- */
  P29.bigCard = (s, x, y, w, h, el, title, body, src, nBadge) => {
    const g = pal(el);
    K.box(s, x, y, w, h, g.t); K.accent(s, x, y, h, g.c);
    let ty = y + 0.3;
    if (nBadge) {
      s.addShape(p.ShapeType.roundRect, { x: x + 0.38, y: ty, w: 0.5, h: 0.36,
        rectRadius: 0.18, fill: { color: g.c }, line: { type: "none" } });
      K.t(s, String(nBadge), x + 0.38, ty + 0.02, 0.5, 0.32,
        { sz: 12, b: true, c: "FFFFFF", a: "center", v: "middle" });
      ty += 0.5;
    }
    K.t(s, title, x + 0.38, ty, w - 0.76, 0.85, { sz: 17, b: true, c: C.DARK, ls: 26 });
    K.t(s, body, x + 0.38, ty + 0.98, w - 0.76, h - (ty - y) - 1.6, { sz: 11.5, ls: 19 });
    if (src) K.t(s, src, x + 0.38, y + h - 0.5, w - 0.76, 0.3, { sz: 10, b: true, c: g.c });
  };

  /* ---- ページ下部のメモ帯（二定義・伝承注記など。ベース色） ---- */
  P29.memo = (s, y, txt, h) => {
    K.box(s, L, y, W, h || 0.8, B.t);
    K.t(s, txt, L + 0.3, y + 0.16, W - 0.6, (h || 0.8) - 0.3, { sz: 10.5, ls: 17, c: C.INK });
  };

  /* ---- 9ページ「あなたの質の、表と裏」：列ラベル＋質の行×N＋下2枠 ---- */
  /* rows = [[五行, 質の名前, 星名, 強みの文, 弱みの文], ...]（4行が標準） */
  P29.omoteUra = (s, rows, signText, backText) => {
    K.t(s, "持っている質", L + 0.3, 1.78, 2.6, 0.3, { sz: 10.5, b: true, c: C.SUB });
    K.t(s, "うまく使えているとき（強み）", L + 3.1, 1.78, 4.0, 0.3, { sz: 10.5, b: true, c: C.SUB });
    K.t(s, "弱みに変わるとき ― どんな状況で", L + 7.3, 1.78, 4.2, 0.3, { sz: 10.5, b: true, c: C.SUB });
    rows.forEach(([el, t, star, good, bad], i) => {
      const g = pal(el), y = 2.15 + i * 0.95;
      K.box(s, L, y, W, 0.82, g.t); K.accent(s, L, y, 0.82, g.c);
      K.t(s, t, L + 0.3, y + 0.12, 2.6, 0.32, { sz: 12.5, b: true, c: C.DARK });
      K.t(s, star, L + 0.3, y + 0.46, 2.6, 0.26, { sz: 9.5, b: true, c: g.c });
      K.t(s, good, L + 3.1, y + 0.1, 4.0, 0.62, { sz: 11, v: "middle", ls: 17 });
      K.t(s, bad, L + 7.3, y + 0.1, 4.2, 0.62, { sz: 11, v: "middle", ls: 17 });
    });
    K.box(s, L, 6.05, 5.6, 1.0, "FFFFFF", C.LINE);
    K.t(s, "弱み使いの合図", L + 0.3, 6.2, 5.0, 0.26, { sz: 10.5, b: true, c: B.c });
    K.t(s, signText, L + 0.3, 6.5, 5.0, 0.45, { sz: 11, ls: 17 });
    K.box(s, L + 5.95, 6.05, 5.6, 1.0, "FFFFFF", C.LINE);
    K.t(s, "強み使いに戻すコツ", L + 6.25, 6.2, 5.0, 0.26, { sz: 10.5, b: true, c: B.c });
    K.t(s, backText, L + 6.25, 6.5, 5.0, 0.45, { sz: 11, ls: 17 });
  };

  /* ---- 19ページ「1年ずつ」：年カード（i=0..3、色＝その年の主星の五行） ---- */
  P29.yearCard = (s, i, el, year, sub, title, body, src) => {
    const g = G[el], x = L + i * 3.0;
    K.box(s, x, 2.3, 2.75, 3.95, g.t); K.topBar(s, x, 2.3, 2.75, g.c);
    K.t(s, year, x + 0.26, 2.58, 2.2, 0.58, { sz: 24, b: true, c: g.c });   // 年号は高さ0.56以上（qa）
    K.t(s, sub, x + 0.26, 3.18, 2.2, 0.28, { sz: 10.5, c: C.SUB });
    K.t(s, title, x + 0.26, 3.5, 2.25, 0.62, { sz: 13, b: true, c: C.DARK, ls: 19 });
    K.t(s, body, x + 0.26, 4.2, 2.25, 1.3, { sz: 10.5, ls: 17 });
    K.t(s, src, x + 0.26, 5.75, 2.25, 0.4, { sz: 9.5, b: true, c: g.c, ls: 13 });
  };

  /* ---- 22ページ「答え合わせしたいこと」：Q1〜Q5 の行（淡黄と白枠を交互） ---- */
  P29.qList = (s, questions) => {
    questions.slice(0, 5).forEach((q, i) => {
      const y = 2.3 + i * 0.88;
      if (i % 2 === 0) K.box(s, L, y, W, 0.7, B.t);
      else K.box(s, L, y, W, 0.7, "FFFFFF", C.LINE);
      s.addShape(p.ShapeType.roundRect, { x: L + 0.25, y: y + 0.17, w: 0.7, h: 0.36,
        rectRadius: 0.18, fill: { color: B.d }, line: { type: "none" } });
      K.t(s, "Q" + (i + 1), L + 0.25, y + 0.19, 0.7, 0.32,
        { sz: 11, b: true, c: C.DARK, a: "center", v: "middle" });
      K.t(s, q, L + 1.2, y + 0.1, 10.2, 0.5, { sz: 12, v: "middle" });
    });
  };

  /* ---- 24〜28ページの表：ヘッダセルと本文セル（高さ0.38・本文1行厳守） ---- */
  P29.tHead = (s, x, y, w, t, a) => {
    K.box(s, x, y, w, 0.38, "EFE6CB", C.LINE);
    K.t(s, t, x + 0.08, y + 0.04, w - 0.16, 0.3,
      { sz: 9.5, b: true, c: B.c, a: a || "center", v: "middle" });
  };
  P29.tCell = (s, x, y, w, t, o = {}) => {
    K.box(s, x, y, w, 0.38, o.bg || "FFFFFF", C.LINE);
    K.t(s, t, x + 0.08, y + 0.04, w - 0.16, 0.3,
      { sz: o.sz || 9.5, b: !!o.b, c: o.c || C.INK, a: o.a || "center", v: "middle" });
  };
  /* 行をまとめて描くとき： P29.tRow(s, x, y, widths, cells)。cells は文字列か {t, ...opt} */
  P29.tRow = (s, x, y, widths, cells) => {
    let xx = x;
    cells.forEach((c, j) => {
      const cell = (typeof c === "object") ? c : { t: c };
      P29.tCell(s, xx, y, widths[j], cell.t, cell);
      xx += widths[j];
    });
  };

  /* ---- 25ページ「根拠② 人体星図」：3×3セル＋右の読み方カード ---- */
  /* cells = [{r:1..3, c:0..2, cap:"北・頭｜価値観", star:"○○星  33",
               drv:"年干 ○：自分が生む・陰陽が同じ", el:"火"|null }]  左上(r1,c0)は置かない */
  P29.starGrid = (s, cells, guideBody) => {
    const cw = 2.3, ch = 1.32, gx = 0.06;
    cells.forEach(({ r, c, cap, star, drv, el }) => {
      const g = pal(el), x = L + c * (cw + gx), y = 1.8 + (r - 1) * (ch + 0.06);
      K.box(s, x, y, cw, ch, g.t);
      K.t(s, cap, x, y + 0.12, cw, 0.24, { sz: 8.5, c: C.SUB, a: "center" });
      K.t(s, star, x, y + 0.4, cw, 0.36, { sz: 14, b: true, c: el ? g.c : B.c, a: "center" });
      K.t(s, drv, x + 0.12, y + 0.82, cw - 0.24, 0.44, { sz: 8, c: C.INK, a: "center", ls: 11.5 });
    });
    K.box(s, L + 7.3, 1.8, 4.43, 4.08, B.t);
    K.t(s, "読み方", L + 7.6, 2.05, 3.9, 0.3, { sz: 12, b: true, c: B.c });
    K.t(s, guideBody, L + 7.6, 2.4, 3.85, 3.2, { sz: 10.5, ls: 17 });
  };

  return P29;
}

module.exports = { attach29 };

/* -------------------------------------------------------------------------
   使用例（ダミー値。実データは必ず算出エンジンの出力から渡す）：

   P29.bigCard(s, L, 1.95, 5.6, 4.0, "土",
     "人の輪の真ん中で、\n与えて回す人",
     "（ここに結論の本文。2〜4行）",
     "根拠：中心＝○○星 nn／…", 1);

   P29.omoteUra(s, [
     ["土", "与えて回す",     "○○星", "（強みの一文）", "（弱みの一文 ― どんな状況で）"],
     ["火", "自然体で伝える", "○○星", "…", "…"],
     ["火", "きちんと仕上げる","○○星", "…", "…"],
     ["土", "コツコツ堅実",   "○○星", "…", "…"],
   ], "（弱み使いの合図）", "（強み使いに戻すコツ）");

   P29.yearCard(s, 0, "火", "20XX", "nn歳・○○", "（その年の主題）",
     "（本文。3行まで）", "○○星・○○星／（位相メモ）");

   P29.qList(s, ["（確認の質問1）", "…", "…", "…", "…"]);

   const widths = [1.3, 1.5, 1.3, 1.5, 6.13];
   ["柱","干支","干支番号","蔵干（元命）","この柱が表すもの"]
     .forEach((h, j, a) => P29.tHead(s, L + a.slice(0, j).reduce((p, w) => p + w, 0), 1.85, widths[j], h));
   P29.tRow(s, L, 2.23, widths, ["日柱", {t:"○○", b:true, sz:11}, "nn", "○", {t:"自分自身・配偶者", a:"left"}]);
   ------------------------------------------------------------------------- */
