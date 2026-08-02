/* =========================================================================
   帳票ビルドのサンプル  example_build.js
   deck_kit.js の部品を一通り使う最小構成。新しい帳票はこれを複製して
   data の中身を差し替えるところから始める。
   実行： node example_build.js
   ========================================================================= */
const { newDeck, P, GOGYO } = require("./deck_kit");

/* --- 算出エンジンから得た値をここに集約する（手打ちしない） --------------
   python3 -m sanmei.report 1980 8 22 M "石原さん" の出力を貼り付ける想定 */
const data = {
  name: "石原 さん", meta: "男性 ／ 1980年8月22日生",
  pillars: ["丁卯", "甲申", "庚申"],
  hidden: ["乙", "庚", "庚"],
  star: { head: ["司禄星", 25], right: ["龍高星", 17], center: ["司禄星", 25],
          left: ["司禄星", 25], belly: ["玉堂星", 14],
          early: ["天恍星", 7], mid: ["天胡星", 4], late: ["天恍星", 7] },
  gogyo: { up: 31, left: 40, center: 18, right: 75, down: 30, total: 194,
           el: { up: "木", left: "水", center: "火", right: "金", down: "土" } },
  shugo: ["甲", "庚", "丙"],
  daiun: [
    { age: 5,  kanshi: "乙酉", shusei: "龍高星", jyusei: "天貴星" },
    { age: 15, kanshi: "丙戌", shusei: "石門星", jyusei: "天印星", mark: "第三守護神", shade: 1, tag: "天中殺" },
    { age: 25, kanshi: "丁亥", shusei: "貫索星", jyusei: "天報星", shade: 1, tag: "天中殺" },
    { age: 35, kanshi: "戊子", shusei: "調舒星", jyusei: "天馳星" },
    { age: 45, kanshi: "己丑", shusei: "鳳閣星", jyusei: "天庫星", now: 1, tag: "現在地" },
    { age: 55, kanshi: "庚寅", shusei: "司禄星", jyusei: "天極星", mark: "第二守護神" },
    { age: 65, kanshi: "辛卯", shusei: "禄存星", jyusei: "天胡星" },
    { age: 75, kanshi: "壬辰", shusei: "牽牛星", jyusei: "天堂星" },
    { age: 85, kanshi: "癸巳", shusei: "車騎星", jyusei: "天将星" },
    { age: 95, kanshi: "甲午", shusei: "玉堂星", jyusei: "天禄星", mark: "第一守護神" },
  ],
};

(async () => {
  const { p, K, C, save } = newDeck();

  /* 1. 表紙 */
  C.cover({ kicker: "算 命 学 鑑 定 書", title: "宿 命 を 読 む",
    sub: "生まれ持った気質・才能・性格と、今年の流れ",
    name: data.name, meta: data.meta });

  /* 2. 目次 */
  C.toc(K.light("本書の構成"), [
    ["一", "命式を読む", "陰占の三柱、陽占の人体星図、五行エネルギー"],
    ["二", "宿命の全体像", "中心星・十二大従星・守護神から見る人物像"],
    ["附", "算出根拠と用語", "どの数値がどう導かれたかの付録"]]);

  /* 3. 陰占（カード横並び＋大きな干支） */
  {
    const s = K.light("命式 ― 陰占", "一");
    K.lead(s, "生年月日を干支に置き換えたものが「陰占」です。三本の柱と蔵干から、すべての星が導かれます。");
    C.cardsRow(s, ["日 柱", "月 柱", "年 柱"].map((t, i) => ({
      title: t, tag: "蔵干 " + data.hidden[i],
      body: data.pillars[i] + "\n" + ["自分自身・配偶者", "仕事・社会・両親", "生まれ・初年期"][i]
    })), { y: 1.9, h: 2.6 });
  }

  /* 4. 陽占（人体星図） */
  {
    const s = K.light("命式 ― 陽占（人体星図）", "一");
    K.lead(s, "五つの主星が人体の各部に配置され、生き方の五つの側面を表します。");
    C.humanStar(s, data.star);
    K.card(s, 7.9, 1.85, 4.55, 4.05);
    K.label(s, "この星図の要点", 8.2, 2.05, 4.0);
    K.body(s, "（ここに読み解きを書く）", 8.2, 2.45, 3.95, 3.3, 11.5);
  }

  /* 5. 五行エネルギー */
  {
    const s = K.light("五行のエネルギー配分", "一");
    K.lead(s, "命式に現れるすべての干を五行ごとに集計したものです。");
    C.gogyoCross(s, data.gogyo);
    K.card(s, 7.3, 1.85, 5.15, 4.4);
    K.label(s, "読み取れること", 7.6, 2.05, 4.6, P.VERM);
    K.body(s, "（ここに読み解きを書く）", 7.6, 2.45, 4.55, 3.6);
  }

  /* 6. 二欄比較 */
  {
    const s = K.light("活きる働き方 / 消耗する働き方", "二");
    C.twoPanel(s,
      { title: "活きる働き方", color: P.MOKU || GOGYO["木"], items: ["長く同じ領域を担当する", "判断材料を揃えてから決める"] },
      { title: "消耗する働き方", color: P.VERM, items: ["朝令暮改が続く環境", "情報不足のまま即断を求められる"] });
  }

  /* 7. 表 */
  {
    const s = K.light("身近な方との相性", "三");
    K.lead(s, "日干どうしの関係と、日支の位相法から見ます。");
    C.table(s, ["相手", "日柱", "自分から見た相手", "縁の質", "関係の要点"],
      [1.55, 1.15, 2.15, 1.5, 5.25],
      [["お父様", "甲戌", "玉堂星（学び）", "支合", "第一守護神そのもの。運を整えてくれる相手。"],
       ["社長", "己酉", "鳳閣星（自然体）", { t: "冲", color: P.VERM }, "判断基準が正面からぶつかる配置。"]]);
  }

  /* 8. 棒比較 */
  {
    const s = K.light("器の差", "三");
    K.lead(s, "従星の合計と、五行における自分自身の比率を並べます。");
    C.barRows(s, [{ name: "石原さん", value: 18, color: GOGYO["火"], note: "従星18／36" },
                  { name: "社長", value: 28, color: GOGYO["土"], note: "従星28／36" }],
      36, { caption: "従星の合計（最大36）", y: 1.95, step: 1.0 });
  }

  /* 9. 丸数字グリッド */
  {
    const s = K.light("今年の行動指針", "四");
    K.lead(s, "運の分かれ目になる行動を六つ挙げます。");
    C.numberedGrid(s, Array.from({ length: 6 }, (_, i) => ({
      title: "指針 " + (i + 1), body: "（ここに内容を書く）" })), { cols: 3, y: 1.85, h: 2.1 });
    K.pull(s, "（締めの一文）");
  }

  /* 10. 年表 */
  {
    const s = K.light("人生カレンダー ― 大運と天中殺", "四");
    K.lead(s, "十年ごとに巡る大運の流れです。網かけは天中殺の時期です。");
    C.timeline(s, data.daiun);
  }

  /* 11. 締め */
  C.closing({ title: "この命式を一言でいえば", kicker: "まとめ",
    pull: "（要約の一文）", points: ["要点1", "要点2", "要点3"] });

  /* 12. 付録 */
  {
    const s = K.light("付録 算出根拠", "附");
    C.stepRows(s, [["年柱を出す", "立春で切り替わる。……"],
                   ["月柱を出す", "節で切り替わる。五虎遁で……"],
                   ["日柱を出す", "ユリウス通日から……"]], { y: 1.3, step: 1.2 });
  }

  await save("/home/claude/tpl/_sample.pptx");
  console.log("ok");
})();
