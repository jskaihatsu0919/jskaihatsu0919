/* =========================================================================
   算命学 帳票デザインキット  deck_kit.js
   -------------------------------------------------------------------------
   使い方：
     const { newDeck } = require("./deck_kit");
     const { p, K, C, save } = newDeck();
     const s = K.light("スライド見出し", "一");
     C.cardsRow(s, [{title:"…", body:"…"}, …], { y:1.9, h:2.5 });
     await save("/mnt/user-data/outputs/出力名.pptx");
   -------------------------------------------------------------------------
   K = 土台（背景・見出し・カード・本文）
   C = 部品（人体星図／五行クロス／表／棒／年表／二欄比較 など）
   ========================================================================= */
const pptxgen = require("pptxgenjs");

/* ---------- パレット ---------- */
const P = {
  NAVY: "1C2B3A",   // 主色（60〜70%）。表紙・扉・締めの背景、見出し文字
  INK:  "24303D",   // 本文
  CREAM:"F4F1E8",   // 明スライドの地
  GOLD: "B79A5B",   // 差し色。ラベル・円相・強調
  VERM: "9C3B2E",   // 注意・反発
  GRAY: "6E7681",   // 補足
  WHITE:"FFFFFF",
  LINE: "D8D2C2",   // 罫・カード枠
  TINT: "FBF9F3",   // 補足カードの地
  TINT_W:"FBF3F1",  // 注意カードの地（赤み）
  TINT_G:"F1F4F1",  // 良好カードの地（緑み）
  BAR:  "E6E1D4",   // 棒グラフの下地
};
/* 五行カラー */
const GOGYO = { 木:"4A7C59", 火:"9C3B2E", 土:"B08D3F", 金:"7C8794", 水:"2F4B6E" };

/* ---------- フォント ----------
   見出し＝游明朝（和の格調）／本文＝游ゴシック（可読性）
   游書体は Windows・Mac の PowerPoint 双方に標準搭載。       */
const MIN = "游明朝", GO = "游ゴシック";

const SZ = { title: 26, lead: 12.5, h2: 16, h3: 13.5, body: 12, small: 11, tiny: 10, cap: 9.5 };

function newDeck(layout) {
  const p = new pptxgen();
  p.layout = layout || "LAYOUT_WIDE";           // 13.333 × 7.5 inch
  const W = 13.333, H = 7.5;

  /* ===================== K：土台 ===================== */
  const K = {};

  /** 円相（唯一の装飾モチーフ。罫やストライプは使わない） */
  K.enso = (s, x, y, d, col, tr) => s.addShape(p.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { type: "solid", color: col || P.GOLD, transparency: 100 },
    line: { color: col || P.GOLD, width: 1.25, transparency: tr === undefined ? 84 : tr } });

  /** 濃紺スライド（表紙・章扉・締め） */
  K.dark = (title, kicker) => {
    const s = p.addSlide(); s.background = { color: P.NAVY };
    K.enso(s, 9.6, -1.5, 5.6, P.GOLD, 78); K.enso(s, 10.9, 3.4, 3.6, P.GOLD, 88);
    if (kicker) s.addText(kicker, { x: 0.9, y: 2.55, w: 8.6, h: 0.4, fontFace: GO,
      fontSize: 13, color: P.GOLD, charSpacing: 4, margin: 0 });
    s.addText(title, { x: 0.9, y: 3.0, w: 9.6, h: 1.3, fontFace: MIN, fontSize: 38,
      bold: true, color: P.WHITE, margin: 0 });
    return s; };

  /** 生成りスライド（本文）。num は右上の章番号（一・二・附 など） */
  K.light = (title, num) => {
    const s = p.addSlide(); s.background = { color: P.CREAM };
    K.enso(s, 11.55, 5.85, 2.6, P.GOLD, 88);
    s.addText(title, { x: 0.75, y: 0.46, w: 10.5, h: 0.62, fontFace: MIN,
      fontSize: SZ.title, bold: true, color: P.NAVY, margin: 0 });
    if (num) s.addText(num, { x: 11.4, y: 0.46, w: 1.2, h: 0.55, fontFace: MIN,
      fontSize: 21, color: P.GOLD, align: "right", margin: 0 });
    return s; };

  K.card = (s, x, y, w, h, fill) => s.addShape(p.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.05, fill: { color: fill || P.WHITE },
    line: { color: P.LINE, width: 0.75 } });

  K.body = (s, t, x, y, w, h, sz, col) => s.addText(t, { x, y, w, h, fontFace: GO,
    fontSize: sz || SZ.body, color: col || P.INK,
    lineSpacing: (sz || SZ.body) * 1.75, margin: 0, valign: "top" });

  K.label = (s, t, x, y, w, col) => s.addText(t, { x, y, w, h: 0.32, fontFace: GO,
    fontSize: SZ.small, bold: true, color: col || P.GOLD, charSpacing: 1.5, margin: 0 });

  /** 見出し直下のリード文。高さ 0.72 は 2 行ぶん確保済み */
  K.lead = (s, t) => K.body(s, t, 0.85, 1.12, 11.6, 0.72, SZ.lead);

  /** 締めの一文（金色） */
  K.pull = (s, t, y) => s.addText(t, { x: 0.85, y: y || 6.55, w: 11.6, h: 0.55,
    fontFace: MIN, fontSize: 13, color: P.GOLD, margin: 0 });

  K.line = (s, x, y, w) => s.addShape(p.ShapeType.line, { x, y, w, h: 0,
    line: { color: P.LINE, width: 0.5 } });

  /** 丸数字バッジ */
  K.badge = (s, n, x, y, d, col) => {
    const dd = d || 0.4;
    s.addShape(p.ShapeType.ellipse, { x, y, w: dd, h: dd, fill: { color: col || P.GOLD },
      line: { color: col || P.GOLD, width: 0 } });
    s.addText(String(n), { x, y, w: dd, h: dd, fontFace: MIN, fontSize: dd * 32,
      bold: true, color: P.WHITE, align: "center", valign: "middle", margin: 0 }); };

  /* ===================== C：部品 ===================== */
  const C = {};

  /** 表紙 */
  C.cover = ({ kicker, title, sub, name, meta, note }) => {
    const s = p.addSlide(); s.background = { color: P.NAVY };
    K.enso(s, 8.4, 0.5, 6.5, P.GOLD, 72); K.enso(s, 9.8, 2.25, 3.7, P.GOLD, 86);
    s.addText(kicker, { x: 1.0, y: 2.2, w: 8.4, h: 0.5, fontFace: GO, fontSize: 14,
      color: P.GOLD, charSpacing: 8, margin: 0 });
    s.addText(title, { x: 1.0, y: 2.8, w: 9.0, h: 1.15, fontFace: MIN, fontSize: 44,
      bold: true, color: P.WHITE, margin: 0 });
    if (sub) s.addText(sub, { x: 1.0, y: 4.0, w: 8.6, h: 0.4, fontFace: GO,
      fontSize: 15, color: "C7CEDB", margin: 0 });
    s.addShape(p.ShapeType.line, { x: 1.0, y: 4.7, w: 2.3, h: 0, line: { color: P.GOLD, width: 1.25 } });
    s.addText([{ text: name, options: { fontSize: 19, bold: true, color: P.WHITE, breakLine: true } },
      { text: meta, options: { fontSize: 12.5, color: "9FAAC0" } }],
      { x: 1.0, y: 5.0, w: 8.8, h: 0.9, fontFace: GO, lineSpacing: 24, margin: 0 });
    s.addText(note || "鑑定結果は何かを保証するものではありません。算命学をどのように生き方に活用するかはご本人次第です。",
      { x: 1.0, y: 6.72, w: 10.5, h: 0.3, fontFace: GO, fontSize: 9.5, color: "7C879B", margin: 0 });
    return s; };

  /** 締めスライド（濃紺＋一文＋箇条書き） */
  C.closing = ({ title, kicker, pull, points }) => {
    const s = K.dark(title, kicker);
    if (pull) s.addText(pull, { x: 0.9, y: 4.4, w: 10.4, h: 0.5, fontFace: GO,
      fontSize: 15.5, color: P.GOLD, margin: 0 });
    if (points) s.addText(points.map((v, i) => ({ text: v,
        options: { bullet: true, breakLine: i < points.length - 1 } })),
      { x: 0.95, y: 5.15, w: 10.8, h: 1.7, fontFace: GO, fontSize: 12.5,
        color: "D6DCE6", paraSpaceAfter: 9, lineSpacing: 20, margin: 0 });
    return s; };

  /** 目次 */
  C.toc = (s, items) => items.forEach(([n, t, d], i) => {
    const y = 1.5 + i * 0.72;
    s.addText(n, { x: 0.95, y, w: 0.6, h: 0.5, fontFace: MIN, fontSize: 20,
      color: P.GOLD, align: "center", margin: 0 });
    s.addText(t, { x: 1.7, y: y + 0.03, w: 3.3, h: 0.42, fontFace: MIN, fontSize: SZ.h2,
      bold: true, color: P.NAVY, margin: 0 });
    s.addText(d, { x: 5.1, y: y + 0.08, w: 7.2, h: 0.4, fontFace: GO, fontSize: SZ.body,
      color: P.GRAY, margin: 0 });
    K.line(s, 0.95, y + 0.58, 11.4); });

  /** 横並びカード（2〜4枚）。items = [{title, body, tag, color, dark}] */
  C.cardsRow = (s, items, o) => {
    o = o || {}; const y = o.y || 1.9, h = o.h || 4.4, n = items.length;
    const gap = o.gap === undefined ? 0.22 : o.gap;
    const w = (11.6 - gap * (n - 1)) / n;
    items.forEach((it, i) => {
      const x = 0.85 + i * (w + gap), col = it.color || P.GOLD;
      K.card(s, x, y, w, h, it.dark ? P.NAVY : P.WHITE);
      let ty = y + 0.2;
      if (it.badge !== undefined) { K.badge(s, it.badge, x + 0.3, ty + 0.02, 0.4, col); ty += 0.0; }
      if (it.head) { s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.6, rectRadius: 0.04,
          fill: { color: col }, line: { color: col, width: 0 } });
        s.addText(it.title, { x: x + 0.3, y, w: w - 0.6, h: 0.6, fontFace: MIN,
          fontSize: SZ.h2, bold: true, color: P.WHITE, valign: "middle", margin: 0 });
        ty = y + 0.8; }
      else { s.addText(it.title, { x: x + (it.badge !== undefined ? 0.8 : 0.3), y: ty,
          w: w - (it.badge !== undefined ? 1.1 : 0.6), h: 0.46, fontFace: MIN, fontSize: SZ.h3,
          bold: true, color: it.dark ? P.WHITE : P.NAVY, valign: "middle", margin: 0 });
        ty += 0.6; }
      if (it.tag) { s.addText(it.tag, { x: x + 0.3, y: ty - 0.12, w: w - 0.6, h: 0.3,
          fontFace: GO, fontSize: SZ.small, color: col, margin: 0 }); ty += 0.3; }
      K.body(s, it.body, x + 0.3, ty, w - 0.6, y + h - ty - 0.2,
        o.sz || SZ.small, it.dark ? "D6DCE6" : P.INK); });
  };

  /** 丸数字グリッド（2×2／2×3／3×2）。items = [{title, body}] */
  C.numberedGrid = (s, items, o) => {
    o = o || {}; const cols = o.cols || 3, y0 = o.y || 1.85, ch = o.h || 2.1;
    const gap = 0.2, cw = (11.6 - gap * (cols - 1)) / cols;
    items.forEach((it, i) => {
      const x = 0.85 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + 0.25);
      K.card(s, x, y, cw, ch);
      K.badge(s, i + 1, x + 0.3, y + 0.25, 0.4, o.color || P.NAVY);
      s.addText(it.title, { x: x + 0.82, y: y + 0.22, w: cw - 1.1, h: 0.48, fontFace: MIN,
        fontSize: SZ.h3, bold: true, color: P.NAVY, valign: "middle", margin: 0 });
      K.body(s, it.body, x + 0.3, y + 0.82, cw - 0.6, ch - 1.0, o.sz || SZ.small); });
  };

  /** 二欄比較（良い／悪い、Do／Don't） */
  C.twoPanel = (s, left, right, o) => {
    o = o || {}; const y = o.y || 1.35, h = o.h || 4.15;
    [[0.85, left], [6.75, right]].forEach(([x, d]) => {
      K.card(s, x, y, 5.7, h);
      s.addShape(p.ShapeType.roundRect, { x, y, w: 5.7, h: 0.62, rectRadius: 0.04,
        fill: { color: d.color }, line: { color: d.color, width: 0 } });
      s.addText(d.title, { x: x + 0.3, y, w: 5.1, h: 0.62, fontFace: MIN, fontSize: 17,
        bold: true, color: P.WHITE, valign: "middle", margin: 0 });
      if (Array.isArray(d.items))
        s.addText(d.items.map((v, i) => ({ text: v, options: { bullet: true,
            breakLine: i < d.items.length - 1 } })),
          { x: x + 0.4, y: y + 0.83, w: 4.95, h: h - 1.05, fontFace: GO, fontSize: SZ.body,
            color: P.INK, paraSpaceAfter: 11, lineSpacing: 19, margin: 0 });
      else K.body(s, d.body, x + 0.32, y + 0.8, 5.1, h - 1.0, SZ.small); });
  };

  /** 表。widths の合計は 11.6 にする */
  C.table = (s, headers, widths, rows, o) => {
    o = o || {}; const y0 = o.y || 1.8, rh = o.rh || 0.62;
    let x = 0.85;
    headers.forEach((t, i) => {
      s.addShape(p.ShapeType.rect, { x, y: y0, w: widths[i], h: 0.42,
        fill: { color: P.NAVY }, line: { color: P.NAVY, width: 0 } });
      s.addText(t, { x: x + 0.1, y: y0, w: widths[i] - 0.2, h: 0.42, fontFace: GO,
        fontSize: 10.5, bold: true, color: P.WHITE, valign: "middle", margin: 0 });
      x += widths[i]; });
    rows.forEach((r, i) => {
      const y = y0 + 0.42 + i * rh;
      if (i % 2 === 0) s.addShape(p.ShapeType.rect, { x: 0.85, y, w: 11.6, h: rh,
        fill: { color: P.WHITE }, line: { color: P.WHITE, width: 0 } });
      let xx = 0.85;
      r.forEach((c, j) => {
        const cell = (typeof c === "object") ? c : { t: c };
        s.addText(cell.t, { x: xx + 0.1, y, w: widths[j] - 0.2, h: rh,
          fontFace: j === 0 ? MIN : GO, fontSize: cell.sz || (j === 0 ? 12 : 10.5),
          color: cell.color || P.INK, bold: cell.bold !== undefined ? cell.bold : (j === 0),
          valign: "middle", lineSpacing: 15, margin: 0 });
        xx += widths[j]; });
      K.line(s, 0.85, y + rh, 11.6); });
  };

  /** 横棒の比較。items = [{name, value, note, color}] */
  C.barRows = (s, items, max, o) => {
    o = o || {}; const x0 = o.x || 0.95, y0 = o.y || 1.9, bw = o.w || 7.4,
      lw = o.labelW || 1.55, step = o.step || 0.62;
    if (o.caption) s.addText(o.caption, { x: x0, y: y0 - 0.4, w: 5.0, h: 0.3, fontFace: GO,
      fontSize: SZ.small, bold: true, color: P.GOLD, margin: 0 });
    items.forEach((it, i) => {
      const y = y0 + i * step;
      s.addText(it.name, { x: x0, y, w: lw, h: 0.42, fontFace: GO, fontSize: SZ.small,
        color: P.INK, valign: "middle", margin: 0 });
      s.addShape(p.ShapeType.roundRect, { x: x0 + lw, y: y + 0.06, w: bw, h: 0.3,
        rectRadius: 0.03, fill: { color: P.BAR }, line: { color: P.BAR, width: 0 } });
      s.addShape(p.ShapeType.roundRect, { x: x0 + lw, y: y + 0.06, w: bw * (it.value / max),
        h: 0.3, rectRadius: 0.03, fill: { color: it.color }, line: { color: it.color, width: 0 } });
      s.addText(it.note || String(it.value), { x: x0 + lw + bw + 0.15, y, w: 2.2, h: 0.42,
        fontFace: GO, fontSize: SZ.small, color: P.INK, valign: "middle", margin: 0 }); });
  };

  /** 人体星図（陽占）。3×3 のセル配置は固定 */
  C.humanStar = (s, g, o) => {
    o = o || {}; const X = o.x || 0.95, Y = o.y || 1.85,
      cw = o.cw || 2.15, ch = o.ch || 1.28, gx = 0.12, gy = 0.12;
    const cell = (col, row, name, num, cap, main) => {
      const x = X + col * (cw + gx), y = Y + row * (ch + gy);
      s.addShape(p.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.04,
        fill: { color: main ? P.NAVY : P.WHITE },
        line: { color: main ? P.NAVY : P.LINE, width: main ? 0 : 0.75 } });
      s.addText(name, { x, y: y + 0.16, w: cw, h: 0.42, fontFace: MIN, fontSize: 19,
        bold: true, color: main ? P.WHITE : P.NAVY, align: "center", margin: 0 });
      s.addText(String(num), { x, y: y + 0.6, w: cw, h: 0.3, fontFace: MIN, fontSize: 15,
        color: P.GOLD, align: "center", margin: 0 });
      s.addText(cap, { x, y: y + 0.93, w: cw, h: 0.28, fontFace: GO, fontSize: 9.5,
        color: main ? "B8C2D2" : P.GRAY, align: "center", margin: 0 }); };
    cell(1, 0, g.head[0],   g.head[1],   "哲学・価値観");
    cell(2, 0, g.early[0],  g.early[1],  "社会人になるまで");
    cell(0, 1, g.right[0],  g.right[1],  "家庭への接し方");
    cell(1, 1, g.center[0], g.center[1], "生き方の中心", true);
    cell(2, 1, g.left[0],   g.left[1],   "仕事の仕方");
    cell(0, 2, g.mid[0],    g.mid[1],    "生涯を通じて");
    cell(1, 2, g.belly[0],  g.belly[1],  "未来・心の充実");
    cell(2, 2, g.late[0],   g.late[1],   "社会人時代");
  };

  /** 五行エネルギーの十字図。d = {up,left,center,right,down,total,el:{up:"木",…}} */
  C.gogyoCross = (s, d, o) => {
    o = o || {}; const cx = o.cx || 3.6, cy = o.cy || 4.1, scale = o.scale || 1.0;
    const node = (x, y, v, el, tag) => {
      const dm = (0.7 + 0.9 * (v / Math.max(1, d.total) * 5 / 2)) * scale;
      const col = GOGYO[el];
      s.addShape(p.ShapeType.ellipse, { x: x - dm / 2, y: y - dm / 2, w: dm, h: dm,
        fill: { color: col }, line: { color: col, width: 0 } });
      s.addText(String(v), { x: x - dm / 2, y: y - dm / 2 + dm * 0.24, w: dm, h: dm * 0.4,
        fontFace: MIN, fontSize: 22, bold: true, color: P.WHITE, align: "center", margin: 0 });
      s.addText(el + "　" + tag, { x: x - 1.0, y: y + dm / 2 + 0.06, w: 2.0, h: 0.28,
        fontFace: GO, fontSize: 10.5, color: P.INK, align: "center", margin: 0 }); };
    node(cx, cy - 1.55, d.up,     d.el.up,     "印（守り）");
    node(cx - 2.15, cy, d.left,   d.el.left,   "官（責任）");
    node(cx, cy,        d.center, d.el.center, "自分");
    node(cx + 2.15, cy, d.right,  d.el.right,  "財（豊かさ）");
    node(cx, cy + 1.6,  d.down,   d.el.down,   "食傷（表現）");
    s.addText("総和  T." + d.total, { x: cx - 1.2, y: cy + 2.25, w: 2.4, h: 0.3,
      fontFace: MIN, fontSize: 13, color: P.GOLD, align: "center", margin: 0 });
  };

  /** 大運の年表（10コマ）。items=[{age,kanshi,shusei,jyusei,tag,mark,now,shade}] */
  C.timeline = (s, items, o) => {
    o = o || {}; const y = o.y || 1.9, h = o.h || 3.05, gx = 0.075;
    const bw = (11.6 - gx * (items.length - 1)) / items.length;
    items.forEach((it, i) => {
      const x = 0.85 + i * (bw + gx);
      s.addShape(p.ShapeType.roundRect, { x, y, w: bw, h, rectRadius: 0.04,
        fill: { color: it.now ? P.NAVY : (it.shade ? "E4DED0" : P.WHITE) },
        line: { color: it.now ? P.NAVY : P.LINE, width: it.now ? 0 : 0.75 } });
      s.addText(it.age + "歳", { x, y: y + 0.15, w: bw, h: 0.3, fontFace: GO, fontSize: 10.5,
        bold: true, color: it.now ? P.GOLD : P.GRAY, align: "center", margin: 0 });
      s.addText(it.kanshi, { x, y: y + 0.5, w: bw, h: 0.45, fontFace: MIN, fontSize: 19,
        bold: true, color: it.now ? P.WHITE : P.NAVY, align: "center", margin: 0 });
      s.addText(it.shusei + "\n" + it.jyusei, { x, y: y + 1.05, w: bw, h: 0.75,
        fontFace: GO, fontSize: 9.5, color: it.now ? "C7CEDB" : P.INK, align: "center",
        lineSpacing: 15, margin: 0 });
      if (it.mark) s.addText(it.mark, { x, y: y + 1.95, w: bw, h: 0.5, fontFace: GO,
        fontSize: 8.5, bold: true, color: P.GOLD, align: "center", lineSpacing: 12, margin: 0 });
      if (it.tag) s.addText(it.tag, { x, y: y + 2.6, w: bw, h: 0.3, fontFace: GO, fontSize: 9,
        bold: !!it.now, color: it.now ? P.GOLD : P.VERM, align: "center", margin: 0 }); });
  };

  /** 命式サマリーカード（三柱＋中心星＋従星計） */
  C.meishikiCard = (s, x, y, w, d) => {
    K.card(s, x, y, w, 2.5, d.dark ? P.NAVY : P.WHITE);
    const fg = d.dark ? P.WHITE : P.NAVY, mut = d.dark ? "B8C2D2" : P.GRAY;
    s.addText(d.name, { x: x + 0.28, y: y + 0.2, w: w - 0.56, h: 0.36, fontFace: MIN,
      fontSize: 17, bold: true, color: fg, margin: 0 });
    s.addText(d.sub, { x: x + 0.28, y: y + 0.56, w: w - 0.56, h: 0.28, fontFace: GO,
      fontSize: 10, color: mut, margin: 0 });
    d.pillars.forEach((k, i) => {
      const cw = (w - 0.56) / 3, cx = x + 0.28 + i * cw;
      s.addText(k, { x: cx, y: y + 0.9, w: cw, h: 0.45, fontFace: MIN, fontSize: 21,
        bold: true, color: fg, align: "center", margin: 0 });
      s.addText(["日柱", "月柱", "年柱"][i], { x: cx, y: y + 1.36, w: cw, h: 0.24,
        fontFace: GO, fontSize: 8.5, color: mut, align: "center", margin: 0 }); });
    s.addText("中心星 " + d.center + "　／　従星計 " + d.ju, { x: x + 0.28, y: y + 1.7,
      w: w - 0.56, h: 0.28, fontFace: GO, fontSize: 10.5,
      color: d.dark ? P.GOLD : P.INK, margin: 0 });
    s.addText(d.note, { x: x + 0.28, y: y + 2.0, w: w - 0.56, h: 0.28, fontFace: GO,
      fontSize: 10, color: mut, margin: 0 });
  };

  /** 大きな数字の訴求 */
  C.bigStat = (s, x, y, w, h, val, cap, sub, col) => {
    K.card(s, x, y, w, h);
    s.addText(String(val), { x, y: y + 0.25, w, h: 1.0, fontFace: MIN, fontSize: 62,
      bold: true, color: col || P.NAVY, align: "center", margin: 0 });
    s.addText(cap, { x, y: y + 1.3, w, h: 0.3, fontFace: GO, fontSize: SZ.small,
      color: P.INK, align: "center", margin: 0 });
    if (sub) s.addText(sub, { x, y: y + 1.65, w, h: 0.5, fontFace: GO, fontSize: SZ.cap,
      color: P.GRAY, align: "center", lineSpacing: 16, margin: 0 });
  };

  /** 付録の番号つき解説行 */
  C.stepRows = (s, items, o) => {
    o = o || {}; const y0 = o.y || 1.2, step = o.step || 1.12;
    items.forEach(([t, d], i) => {
      const y = y0 + i * step;
      s.addText(String(i + 1), { x: 0.9, y: y + 0.1, w: 0.4, h: 0.4, fontFace: MIN,
        fontSize: 16, color: P.GOLD, align: "center", margin: 0 });
      s.addText(t, { x: 1.4, y: y + 0.08, w: 2.4, h: 0.4, fontFace: MIN, fontSize: SZ.h3,
        bold: true, color: P.NAVY, valign: "middle", margin: 0 });
      K.body(s, d, 4.0, y + 0.04, 8.45, step - 0.17, o.sz || SZ.tiny);
      K.line(s, 0.9, y + step - 0.1, 11.55); });
  };

  const save = (path) => p.writeFile({ fileName: path });
  return { p, K, C, P, GOGYO, MIN, GO, SZ, save };
}

module.exports = { newDeck, P, GOGYO, MIN, GO, SZ };
