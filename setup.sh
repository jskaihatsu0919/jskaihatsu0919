#!/usr/bin/env bash
# =============================================================================
#  算命学 帳票キット セットアップ
#  リポジトリのファイルを取得し、実行できる形に並べ直して動作確認まで行う。
#  （リポジトリ側はファイルが平らに並んでいる前提。フォルダ分けは不要）
#
#  使い方（Claude に頼む）:
#    curl -sSL https://raw.githubusercontent.com/jskaihatsu0919/jskaihatsu0919/main/setup.sh | bash
# =============================================================================
set -euo pipefail

# ---- ここだけ自分のものに書き換える -----------------------------------------
REPO="jskaihatsu0919/jskaihatsu0919"   # <ユーザー名>/<リポジトリ名>
BRANCH="main"                          # デフォルトブランチが master なら master に
# -----------------------------------------------------------------------------

DEST="${1:-/home/claude/sanmei-kit}"
TMP="$(mktemp -d)"

echo "▶ 依存パッケージを導入"
pip install sxtwl --break-system-packages -q

echo "▶ ${REPO}@${BRANCH} を取得"
SRC="$TMP"
if ! curl -sSL "https://codeload.github.com/${REPO}/tar.gz/refs/heads/${BRANCH}" \
  | tar xz -C "$TMP" --strip-components=1 2>/dev/null; then
  # 一部の実行環境ではアーカイブ取得（codeload）が 403 になるため、git clone で代替する
  echo "  （アーカイブ取得に失敗 → git clone で代替）"
  git clone --depth 1 --quiet "https://github.com/${REPO}" "$TMP/repo"
  SRC="$TMP/repo"
fi

echo "▶ 実行できる形に配置 → ${DEST}"
rm -rf "$DEST"
mkdir -p "$DEST/engine/data" "$DEST/lib" "$DEST/docs"
# リポジトリ内のどこにあっても拾えるよう find で探す
place() { local f; f="$(find "$SRC" -type f -name "$1" | head -1)";
  if [ -n "$f" ]; then cp "$f" "$2/"; else echo "  !! 見つかりません: $1"; fi; }
for f in core.py compat.py report.py test_charts.py test_tables.py; do place "$f" "$DEST/engine"; done
place tables.json      "$DEST/engine/data"
for f in deck_kit.js deck_kit_casual.js casual_parts_29p.js example_build.js; do place "$f" "$DEST/lib"; done
place qa.py            "$DEST"
find "$SRC" -type f -name "*.md" -exec cp {} "$DEST/docs/" \; 2>/dev/null || true
rm -rf "$TMP"

echo "▶ 照合テスト"
cd "$DEST/engine" && python3 test_charts.py | tail -2
python3 "$DEST/engine/test_tables.py"

cat <<EOS

────────────────────────────────────────────
 セットアップ完了

 命式の算出:
   import sys; sys.path.insert(0, "${DEST}/engine")
   from core import build
   r = build("お名前", 1980, 8, 22, male=True)

 テキスト出力:
   python3 ${DEST}/engine/report.py 1980 8 22 M "お名前"

 相性・組織診断:
   ${DEST}/engine/compat.py の P を書き換えて実行

 帳票のビルド:
   ${DEST}/lib/example_build.js を複製して data を差し替える
   node build.js && python3 ${DEST}/qa.py 出力.pptx
────────────────────────────────────────────
EOS
