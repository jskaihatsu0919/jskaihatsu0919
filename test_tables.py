#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
講座資料（表テキスト レッスン4・5）とエンジンの照合テスト。

  1. 十二大従星 算出表 …… 10干 × 12支 = 120セル（星名＋点数）
  2. 運命天中殺 早見表 …… 六十干支 = 60セル

使い方:
  python3 /home/claude/sanmei-kit/engine/test_tables.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import jyusei, tenchusatsu  # noqa: E402

KAN = list("甲乙丙丁戊己庚辛壬癸")
SHI = list("子丑寅卯辰巳午未申酉戌亥")

# --- 1. 十二大従星 算出表（資料より転記。行＝星、値＝日干 甲→癸 の順の支） ---
JYUSEI_TABLE = {
    "天報星": "酉申子亥子亥卯寅午巳",
    "天印星": "戌未丑戌丑戌辰丑未辰",
    "天貴星": "亥午寅酉寅酉巳子申卯",
    "天恍星": "子巳卯申卯申午亥酉寅",
    "天南星": "丑辰辰未辰未未戌戌丑",
    "天禄星": "寅卯巳午巳午申酉亥子",
    "天将星": "卯寅午巳午巳酉申子亥",
    "天堂星": "辰丑未辰未辰戌未丑戌",
    "天胡星": "巳子申卯申卯亥午寅酉",
    "天極星": "午亥酉寅酉寅子巳卯申",
    "天庫星": "未戌戌丑戌丑丑辰辰未",
    "天馳星": "申酉亥子亥子寅卯巳午",
}
# 点数は 05_算出ルール解説.md と同じ対応
POINTS = {"天将星": 12, "天禄星": 11, "天南星": 10, "天貴星": 9, "天堂星": 8,
          "天恍星": 7, "天印星": 6, "天庫星": 5, "天胡星": 4, "天報星": 3,
          "天極星": 2, "天馳星": 1}

expected = {}
for star, row in JYUSEI_TABLE.items():
    for kan, shi in zip(KAN, row):
        expected[(kan, shi)] = star

ok1 = ng1 = 0
for kan in KAN:
    for shi in SHI:
        name, pt = jyusei(kan, shi)
        want = expected[(kan, shi)]
        if name == want and pt == POINTS[want]:
            ok1 += 1
        else:
            ng1 += 1
            print(f"  不一致: {kan}×{shi}  エンジン={name}({pt})  資料={want}({POINTS[want]})")
print(f"十二大従星 算出表  一致 {ok1} 件 / 不一致 {ng1} 件  （10干×12支=120、点数も照合）")

# --- 2. 運命天中殺 早見表（六十干支 → 天中殺。資料より転記） ---
#   干支番号 1-10→戌亥 / 11-20→申酉 / 21-30→午未 / 31-40→辰巳 / 41-50→寅卯 / 51-60→子丑
PAIRS = ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"]

ok2 = ng2 = 0
for i in range(60):
    kan, shi = KAN[i % 10], SHI[i % 12]
    want = PAIRS[i // 10]
    got = tenchusatsu(kan, shi)
    if got == want:
        ok2 += 1
    else:
        ng2 += 1
        print(f"  不一致: 干支番号{i + 1} {kan}{shi}  エンジン={got}  資料={want}")
print(f"運命天中殺 早見表  一致 {ok2} 件 / 不一致 {ng2} 件  （六十干支）")

sys.exit(0 if ng1 + ng2 == 0 else 1)
