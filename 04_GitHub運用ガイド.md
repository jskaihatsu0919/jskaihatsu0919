# 04 GitHub 運用ガイド

ナレッジに直接アップロードすると、Claude は毎回ファイルの中身をコンテナに書き出す必要があります。
`core.py` は約400行あるため、鑑定のたびにトークンを消費します。

GitHub に置けば、**1コマンドで全ファイルが揃い**、書き出しが不要になります。

---

## 結論：使える通信先と使えない通信先

Claude のコード実行環境は、限られたドメインにしか通信できません。実測結果です。

| 通信先 | 可否 | 用途 |
|---|---|---|
| `codeload.github.com` | ○ | **リポジトリを丸ごと取得（推奨）** |
| `raw.githubusercontent.com` | ○ | 個別ファイルの取得 |
| `github.com/…/archive/…` | ○ | 上の codeload へ自動転送される |
| `api.github.com` | ○ | User-Agent を付ければ可 |
| `gist.githubusercontent.com` | **×** | プロキシが `host_not_allowed` で拒否 |

**Gist は使えません。** 必ずリポジトリを作ってください。

---

## 手順

### 1. リポジトリを作る

GitHub で新規リポジトリを作成します。

- 名前の例：`sanmei-kit`
- 公開設定：**Public**（Private だと認証が必要で、この環境からは取得できません）
- 個人情報は入れないでください。生年月日はリポジトリに置かず、会話のなかで都度伝えます

### 2. ファイルを置く

このプロジェクト一式を、そのままの構成でアップロードします。

```
sanmei-kit/
├── setup.sh
├── README.md
├── 00_プロジェクト手順.md
├── 01_デザイン仕様.md
├── 02_解釈リファレンス.md
├── 03_帳票構成テンプレート.md
├── 04_GitHub運用ガイド.md
├── qa.py
├── engine/
│   ├── core.py
│   ├── compat.py
│   ├── report.py
│   ├── test_charts.py
│   ├── README.md
│   └── data/tables.json
└── lib/
    ├── deck_kit.js
    └── example_build.js
```

Web からなら「Add file → Upload files」でフォルダごとドラッグできます。

### 3. setup.sh の1行を書き換える

同梱の `setup.sh` の冒頭にある `REPO` を、ご自身のものに変えてください。

```bash
REPO="ishihara/sanmei-kit"      # ← ここを <ユーザー名>/<リポジトリ名> に
```

デフォルトブランチが `master` の場合は `BRANCH` も変更します。

### 4. 動作を確認する

Claude に次のように頼みます。

> 下記を実行して、テストが196件一致するか確認してください
> ```
> curl -sSL https://raw.githubusercontent.com/<ユーザー名>/sanmei-kit/main/setup.sh | bash
> ```

`一致 196 件 / 不一致 0 件` と出れば成功です。

---

## プロジェクトの「手順」欄の書き換え

GitHub 運用に切り替えたら、手順欄の「算出の絶対ルール」を次に差し替えます。

```
# 算出の絶対ルール
- 命式・大運・年運・五行エネルギー・守護神は、必ず算出エンジンで計算する。
  記憶や一般知識から干支・星を推測して答えることを禁じる。
- セッションの最初に一度だけ、次を実行して環境を用意する：
    curl -sSL https://raw.githubusercontent.com/<ユーザー名>/sanmei-kit/main/setup.sh | bash
  「一致 196 件 / 不一致 0 件」を確認してから本題に入る。
- 以後は sys.path.insert(0,"/home/claude/sanmei-kit/engine") してから
  from core import build で命式を得る。
- 出力は必ず build() の戻り値のみを根拠にする。
- 生年月日と性別が不明なら、推測せず必ず確認する。
```

**ナレッジには `00`〜`04` のマークダウン5点だけを残す**のが良い構成です。
Claude が「どう書くか」を判断するための文書はナレッジに、
「実行するコード」は GitHub に、という切り分けになります。

---

## 個別ファイルだけ取りたいとき

一部だけ更新した、部品を1つ確認したい、という場合は raw で直接取れます。

```bash
curl -sSL https://raw.githubusercontent.com/<ユーザー名>/sanmei-kit/main/engine/core.py \
     -o /home/claude/sanmei-kit/engine/core.py
```

URL の形は `https://raw.githubusercontent.com/<ユーザー>/<リポジトリ>/<ブランチ>/<パス>` です。
GitHub の画面でファイルを開き、右上の「Raw」ボタンから同じ URL がコピーできます。

---

## 更新の流れ

新しい帳票を入手して守護神テーブルを追加したときなど、精度を上げたら次のようにします。

1. GitHub 上でファイルを編集（Web の鉛筆アイコンで直接編集できます）
2. 次のセッションで `setup.sh` を実行すれば、自動的に最新版が入ります

`setup.sh` は毎回リポジトリを取り直すため、キャッシュの心配はありません。

---

## 注意点

- **Public リポジトリの中身は誰でも閲覧できます。** 鑑定対象者の生年月日や氏名は絶対に置かないでください
- リポジトリ名にも個人名を使わないほうが無難です
- Private にすると、この環境からは取得できません（認証トークンが必要になり、トークンを会話に貼るのは避けるべきです）
- `curl | bash` は取得したスクリプトをそのまま実行します。自分のリポジトリのみに対して使ってください
