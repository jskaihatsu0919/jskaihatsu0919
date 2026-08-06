/* =========================================================================
   算命学 帳票デザインキット（カジュアル版）  deck_kit_casual.js
   -------------------------------------------------------------------------
   deck_kit.js（正式版・墨紺／明朝）とは別系統。
   本人や同僚に直接渡す「読み物」向けの、やわらかい体裁。

   使い方：
     const { newCasualDeck } = require("./deck_kit_casual");
     const { p, G, B, K, X, save } = newCasualDeck();
     const s = K.light("スライド見出し", "その1");
     K.lead(s, "リード文");
     X.gyoIntro(s);
     await save("/mnt/user-data/outputs/出力名.pptx");

   K = 土台（表紙・見出し・カード・本文・締め）
   X = 部品（五行解説／場面ブロック／数字カード／比較 など）
   G = 五行カラー、B = ベース（淡い黄色）
   ========================================================================= */
const pptxgen = require("pptxgenjs");

/* ---------- 五行カラー（01_デザイン仕様の値をそのまま使用） ----------
   c＝主色、t＝淡い地色、d＝濃い面の上で使う明るめ                        */
const G = {
  木: { c: "4A7C59", t: "EDF3EE", d: "6FA46F" },
  火: { c: "9C3B2E", t: "F8EBE8", d: "C15A46" },
  土: { c: "B08D3F", t: "F7F0DF", d: "C9A45C" },
  金: { c: "7C8794", t: "EFF1F3", d: "9AA5B1" },
  水: { c: "2F4B6E", t: "E9EEF4", d: "5A7DA8" },
};
/* ---------- ベース（五行に関係しない内容はすべてこれ） ---------- */
const B = { c: "9A8757", t: "FCF4E2", d: "D8C48A", chip: "F2E7C9" };

const C = {
  BG: "FBF8F3", INK: "3B3A3A", SUB: "8A857E", DARK: "2F3E46",
  LINE: "E4DED4", WHITE: "FFFFFF", SOFT: "F2EDE5", DARK2: "3A4C55",
};
const F = "游ゴシック";
const L = 0.8, W = 11.73;

/* 五行 → その五行の色セットを返す。null/undefined ならベース */
const pal = (el) => (el && G[el] ? G[el] : B);

function newCasualDeck() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";

  /* ===================== K：土台 ===================== */
  const K = {};

  K.box = (s, x, y, w, h, fill, line) =>
    s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.1,
      fill: { color: fill }, line: line ? { color: line, width: 1 } : { type: "none" } });

  K.t = (s, str, x, y, w, h, o = {}) =>
    s.addText(str, { x, y, w, h, fontFace: F, fontSize: o.sz || 12, bold: !!o.b,
      color: o.c || C.INK, align: o.a || "left", valign: o.v || "top",
      lineSpacing: o.ls || (o.sz ? o.sz * 1.65 : 20), margin: 0, breakLine: true });

  K.chip = (s, str, x, y, w, bg, fg) => {
    s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.36, rectRadius: 0.18,
      fill: { color: bg || B.chip }, line: { type: "none" } });
    K.t(s, str, x, y + 0.02, w, 0.32,
      { sz: 11.5, b: true, c: fg || B.c, a: "center", v: "middle" });
  };

  /* カード左端の縦アクセントバー（五行を示すときに使う） */
  K.accent = (s, x, y, h, color) =>
    s.addShape(p.ShapeType.roundRect, { x, y, w: 0.11, h, rectRadius: 0.055,
      fill: { color }, line: { type: "none" } });

  /* カード上端の横アクセントバー */
  K.topBar = (s, x, y, w, color) =>
    s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.14, rectRadius: 0.07,
      fill: { color }, line: { type: "none" } });

  K.light = (title, kicker) => {
    const s = p.addSlide();
    s.background = { color: C.BG };
    if (kicker) {
      s.addShape(p.ShapeType.roundRect, { x: L, y: 0.42, w: 1.5, h: 0.34, rectRadius: 0.17,
        fill: { color: B.chip }, line: { type: "none" } });
      K.t(s, kicker, L, 0.45, 1.5, 0.3, { sz: 10.5, b: true, c: B.c, a: "center", v: "middle" });
    }
    K.t(s, title, L, kicker ? 0.92 : 0.6, W, 0.62, { sz: 27, b: true, c: C.DARK, v: "middle" });
    return s;
  };

  K.lead = (s, str, y) => K.t(s, str, L, y || 1.62, W, 0.62, { sz: 12.5, c: C.SUB, ls: 21 });

  K.dark = (title, sub) => {
    const s = p.addSlide();
    s.background = { color: C.DARK };
    s.addShape(p.ShapeType.roundRect, { x: 10.4, y: -0.7, w: 3.6, h: 3.6, rectRadius: 1.8,
      fill: { color: C.DARK2 }, line: { type: "none" } });
    K.t(s, title, L, 2.9, 10.0, 0.9, { sz: 34, b: true, c: C.WHITE, v: "middle" });
    if (sub) K.t(s, sub, L, 3.95, 10.0, 0.6, { sz: 13, c: "A9BBC0" });
    return s;
  };

  K.cover = (d) => {
    const s = p.addSlide();
    s.background = { color: C.DARK };
    s.addShape(p.ShapeType.roundRect, { x: 9.6, y: -1.2, w: 5.2, h: 5.2, rectRadius: 2.6,
      fill: { color: C.DARK2 }, line: { type: "none" } });
    s.addShape(p.ShapeType.roundRect, { x: -1.0, y: 5.0, w: 3.4, h: 3.4, rectRadius: 1.7,
      fill: { color: "364750" }, line: { type: "none" } });
    if (d.kicker) K.chip(s, d.kicker, L, 1.55, d.kickerW || 2.3);
    K.t(s, d.title, L, 2.15, 9.5, 1.9, { sz: 38, b: true, c: C.WHITE, ls: 52 });
    if (d.sub) K.t(s, d.sub, L, 4.25, 9.5, 0.4, { sz: 14, c: "A9BBC0" });
    if (d.meta) K.t(s, d.meta, L, 5.5, 9.5, 0.4, { sz: 11.5, c: "8A9BA2" });
    return s;
  };

  /* 締め（濃い面＋番号つき3項目）。各項目に el を付けるとその五行色 */
  K.closing = (d) => {
    const s = p.addSlide();
    s.background = { color: C.DARK };
    s.addShape(p.ShapeType.roundRect, { x: 10.2, y: -0.9, w: 4.2, h: 4.2, rectRadius: 2.1,
      fill: { color: C.DARK2 }, line: { type: "none" } });
    if (d.kicker) K.chip(s, d.kicker, L, 0.85, 1.5);
    K.t(s, d.title, L, 1.45, 10.0, 0.7, { sz: 30, b: true, c: C.WHITE });
    (d.items || []).slice(0, 3).forEach((it, i) => {
      const col = it.el ? G[it.el].d : B.d;
      const y = 2.55 + i * 1.45;
      s.addShape(p.ShapeType.roundRect, { x: L, y: y + 0.05, w: 0.46, h: 0.46, rectRadius: 0.23,
        fill: { color: col }, line: { type: "none" } });
      K.t(s, String(i + 1), L, y + 0.07, 0.46, 0.42,
        { sz: 13, b: true, c: C.DARK, a: "center", v: "middle" });
      K.t(s, it.title, L + 0.7, y, 4.4, 0.5, { sz: 16.5, b: true, c: C.WHITE });
      if (it.el) K.t(s, "五行：" + it.el, L + 0.7, y + 0.52, 4.4, 0.3, { sz: 10, b: true, c: col });
      K.t(s, it.body, L + 5.3, y + 0.02, 6.4, 1.1, { sz: 11.5, c: "BFCED3", ls: 19 });
    });
    return s;
  };

  /* ===================== X：部品 ===================== */
  const X = {};

  /* 五行の説明①：木火土金水を5枚のカードで（必須の1枚目） */
  X.gyoIntro = (s, o = {}) => {
    const rows = [
      ["木", "甲・乙", "寅・卯", "春／東", "守備本能", "「守りたい」"],
      ["火", "丙・丁", "巳・午", "夏／南", "伝達本能", "「伝えたい」"],
      ["土", "戊・己", "辰戌丑未", "土用／中央", "魅力本能", "「惹きつけたい」"],
      ["金", "庚・辛", "申・酉", "秋／西", "攻撃本能", "「勝ちとりたい」"],
      ["水", "壬・癸", "亥・子", "冬／北", "習得本能", "「学びたい」"],
    ];
    const y = o.y || 2.3;
    rows.forEach(([el, kan, shi, kis, hon, sub], i) => {
      const g = G[el], x = L + i * 2.395;
      K.box(s, x, y, 2.15, 3.3, g.t);
      K.topBar(s, x, y, 2.15, g.c);
      K.t(s, el, x, y + 0.18, 2.15, 0.72, { sz: 28, b: true, c: g.c, a: "center", v: "middle" });
      K.t(s, "十干　" + kan, x + 0.25, y + 0.95, 1.7, 0.3, { sz: 10.5 });
      K.t(s, "十二支　" + shi, x + 0.25, y + 1.3, 1.7, 0.3, { sz: 10.5 });
      K.t(s, "季節／方向　" + kis, x + 0.25, y + 1.65, 1.7, 0.5, { sz: 10.5, ls: 15 });
      K.t(s, hon, x + 0.25, y + 2.32, 1.7, 0.3, { sz: 12, b: true, c: g.c });
      K.t(s, sub, x + 0.25, y + 2.65, 1.7, 0.3, { sz: 11 });
    });
    K.box(s, L, y + 3.55, W, 0.95, B.t);
    K.t(s, o.note || "この5色が、この資料で使っている色です。話している内容がどの五行にあたるかで色を変えています。五行の話ではないところは、この淡い黄色で組んでいます。",
      L + 0.3, y + 3.78, W - 0.6, 0.55, { sz: 11.5, ls: 18 });
  };

  /* 五行の説明②：相生・相剋（必須の2枚目）
     o.selfEl / o.otherEl / o.note を渡すと、下段に当事者の関係カードを出す */
  X.gyoRelation = (s, o = {}) => {
    K.box(s, L, 2.25, 5.6, 2.85, B.t);
    K.t(s, "相生（そうじょう）― 生む・助ける", L + 0.35, 2.45, 4.9, 0.35, { sz: 13.5, b: true, c: C.DARK });
    K.t(s, "木生火　木は燃料となって火を作る\n火生土　火は灰を生んで土を作る\n土生金　土の中に金（鉱石）が生まれる\n金生水　金は水を清らかにして生み出す\n水生木　水は木を育てる",
      L + 0.35, 2.9, 4.9, 1.5, { sz: 11, ls: 18 });
    K.t(s, "意味：相手を活かす、助ける、与える。ただし与える側は減ります。",
      L + 0.35, 4.5, 4.9, 0.5, { sz: 11, b: true, c: B.c, ls: 17 });
    K.box(s, L + 5.95, 2.25, 5.6, 2.85, B.t);
    K.t(s, "相剋（そうこく）― 鍛える・争う", L + 6.3, 2.45, 4.9, 0.35, { sz: 13.5, b: true, c: C.DARK });
    K.t(s, "木剋土　木は土に根を伸ばす\n土剋水　土は水を汚す、治水する\n水剋火　水は火を消す\n火剋金　火は金を溶かす、鍛える\n金剋木　金は木を切り刻む、剪定する",
      L + 6.3, 2.9, 4.9, 1.5, { sz: 11, ls: 18 });
    K.t(s, "意味：相手を鍛える、弱める、争う。悪いという意味ではありません。",
      L + 6.3, 4.5, 4.9, 0.5, { sz: 11, b: true, c: B.c, ls: 17 });
    if (o.note) {
      const g = pal(o.selfEl);
      K.box(s, L, 5.35, W, 1.55, g.t);
      K.accent(s, L, 5.35, 1.55, g.c);
      K.t(s, o.title || "この二人でいうと", L + 0.38, 5.55, 10.9, 0.3, { sz: 11, b: true, c: g.c });
      K.t(s, o.note, L + 0.38, 5.9, 10.9, 0.85, { sz: 12, ls: 20 });
    }
  };

  /* 場面ブロック（1列ぶん）。この体裁の中心になる部品 */
  X.scene = (s, x, w, d) => {
    const g = pal(d.el);
    K.chip(s, d.tag, x, 1.9, Math.min(w, 3.2), g.c, C.WHITE);
    if (d.el) K.t(s, "五行：" + d.el, x + Math.min(w, 3.2) + 0.2, 1.94, 1.4, 0.3,
      { sz: 10, b: true, c: g.c, v: "middle" });
    K.t(s, d.title, x, 2.4, w, 0.5, { sz: 15, b: true, c: C.DARK });
    K.box(s, x, 2.95, w, 1.15, C.SOFT);
    K.t(s, d.badLabel || "ありがちなやつ", x + 0.25, 3.08, w - 0.5, 0.24, { sz: 10, b: true, c: C.SUB });
    K.t(s, d.bad, x + 0.25, 3.34, w - 0.5, 0.68, { sz: 11.5, ls: 17 });
    K.box(s, x, 4.22, w, 1.5, g.t);
    K.t(s, d.goodLabel || "こう言ってみると届きやすい", x + 0.25, 4.35, w - 0.5, 0.24, { sz: 10, b: true, c: g.c });
    K.t(s, d.good, x + 0.25, 4.62, w - 0.5, 0.98, { sz: 12, b: true, c: C.DARK, ls: 19 });
    K.t(s, "なんで？", x + 0.25, 5.86, w - 0.5, 0.24, { sz: 10, b: true, c: C.SUB });
    K.t(s, d.why, x + 0.25, 6.12, w - 0.5, 0.7, { sz: 11, ls: 17 });
  };

  /* 場面ブロックを左右に2つ（1枚に2場面が標準） */
  X.scenePair = (s, left, right) => {
    X.scene(s, L, 5.6, left);
    X.scene(s, L + 5.95, 5.6, right);
  };

  /* 数字カード（最大4枚）。el を省くとベース色 */
  X.statCards = (s, items, o = {}) => {
    const y = o.y || 2.45;
    items.slice(0, 4).forEach((it, i) => {
      const g = pal(it.el), x = L + i * 3.0;
      K.box(s, x, y, 2.75, 3.5, g.t);
      K.topBar(s, x, y, 2.75, g.c);
      K.t(s, it.num, x + 0.28, y + 0.33, 2.2, 0.6, { sz: 24, b: true, c: g.c, v: "middle" });
      K.t(s, it.label, x + 0.28, y + 1.05, 2.2, 0.34, { sz: 12.5, b: true, c: C.DARK });
      K.t(s, it.body, x + 0.28, y + 1.5, 2.2, 1.35, { sz: 11, ls: 18 });
      if (it.src) K.t(s, it.src, x + 0.28, y + 2.93, 2.2, 0.45, { sz: 9.5, b: true, c: g.c, ls: 13 });
    });
  };

  /* 説明カード 2×2（性格の傾向など）。el で五行色、src に根拠を小さく */
  X.pointCards = (s, items, o = {}) => {
    const y0 = o.y || 2.45, h = o.h || 1.9;
    items.slice(0, 4).forEach((it, i) => {
      const g = pal(it.el);
      const x = L + (i % 2) * 5.95, y = y0 + Math.floor(i / 2) * (h + 0.25);
      K.box(s, x, y, 5.6, h, g.t);
      K.accent(s, x, y, h, g.c);
      K.t(s, it.title, x + 0.38, y + 0.24, 5.0, 0.36, { sz: 14, b: true, c: C.DARK });
      K.t(s, it.body, x + 0.38, y + 0.68, 4.9, h - 1.1, { sz: 11.5, ls: 18 });
      if (it.src) K.t(s, it.src, x + 0.38, y + h - 0.4, 4.9, 0.26, { sz: 10, b: true, c: g.c });
    });
  };

  /* ×リスト（やらないほうがいいこと）。el を付けると五行色＋右端に五行名 */
  X.ngList = (s, items, o = {}) => {
    const y0 = o.y || 2.5;
    items.slice(0, 6).forEach((it, i) => {
      const g = pal(it.el);
      const x = L + (i % 2) * 5.95, y = y0 + Math.floor(i / 2) * 1.25;
      K.box(s, x, y, 5.6, 1.05, g.t);
      s.addShape(p.ShapeType.roundRect, { x: x + 0.3, y: y + 0.33, w: 0.38, h: 0.38, rectRadius: 0.19,
        fill: { color: g.c }, line: { type: "none" } });
      K.t(s, "×", x + 0.3, y + 0.35, 0.38, 0.34, { sz: 13, b: true, c: C.WHITE, a: "center", v: "middle" });
      K.t(s, it.text, x + 0.85, y + 0.3, 4.0, 0.5, { sz: 12.5, v: "middle", ls: 19 });
      if (it.el) K.t(s, it.el, x + 4.95, y + 0.3, 0.5, 0.45, { sz: 13, b: true, c: g.c, a: "center", v: "middle" });
    });
  };

  /* 二人（二案）の比較。左右に大きめのカード、下に結論帯 */
  X.compare = (s, left, right, concl) => {
    [[left, L], [right, L + 5.95]].forEach(([d, x]) => {
      const g = pal(d.el);
      K.box(s, x, 2.35, 5.6, 2.9, g.t);
      K.accent(s, x, 2.35, 2.9, g.c);
      K.chip(s, d.who, x + 0.38, 2.58, 1.3, g.c, C.WHITE);
      K.t(s, d.title, x + 0.38, 3.08, 5.0, 0.4, { sz: 17, b: true, c: C.DARK });
      K.t(s, d.body, x + 0.38, 3.55, 4.9, 1.55, { sz: 11.5, ls: 19 });
    });
    if (concl) {
      K.box(s, L, 5.45, W, 1.6, "FFFFFF", C.LINE);
      K.t(s, concl.title || "つまり", L + 0.35, 5.65, 10.9, 0.3, { sz: 11, b: true, c: C.SUB });
      K.t(s, concl.body, L + 0.35, 6.0, 10.9, 0.85, { sz: 12.5, ls: 21 });
    }
  };

  /* 根拠の行（おまけページ用） */
  X.sourceRows = (s, rows, o = {}) => {
    const y0 = o.y || 2.3, step = o.step || 0.92;
    rows.slice(0, 5).forEach(([ti, bd], i) => {
      const y = y0 + i * step;
      K.t(s, ti, L, y, 2.3, 0.4, { sz: 12, b: true, c: B.c });
      K.t(s, bd, L + 2.5, y, 9.2, 0.8, { sz: 10.5, ls: 16 });
    });
  };

  const save = (path) => p.writeFile({ fileName: path });

  return { p, G, B, C, L, W, K, X, save };
}

module.exports = { newCasualDeck, G, B, C, L, W };
