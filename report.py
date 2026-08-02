# -*- coding: utf-8 -*-
"""命式を帳票レイアウトに近い形で出力する CLI

  python3 -m sanmei.report 1980 8 22 M "石原さん"
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import build


def render(r):
    L = []
    A = L.append
    A(f"■ {r.name}  {r.birth:%Y/%m/%d}  {'男性' if r.male else '女性'}")
    A(f"  節入 {r.meta['節入']} / 経過 {r.meta['経過日数']}日 / "
      f"{'順行' if r.meta['順行'] else '逆行'} / 立運 {r.meta['立運']}歳")
    A("")
    A("【陰占】三柱")
    A(f"  日柱 {r.pillars['日']}({r.pillars['番号'][0]})  "
      f"月柱 {r.pillars['月']}({r.pillars['番号'][1]})  "
      f"年柱 {r.pillars['年']}({r.pillars['番号'][2]})")
    A(f"  蔵干  日支→{r.hidden['日支']}  月支→{r.hidden['月支']}  年支→{r.hidden['年支']}")
    A(f"  天中殺  日柱{r.meta['天中殺_日']} / 月柱{r.meta['天中殺_月']} / 年柱{r.meta['天中殺_年']}")
    A("")
    A("【陽占】人体星図")
    j, s = r.jinzu, r.jyusei
    A(f"            {j['北_頭(哲学/価値観)'][0]}{j['北_頭(哲学/価値観)'][1]:>3}   {s['右肩_初年(社会人なるまで)'][0]}{s['右肩_初年(社会人なるまで)'][1]:>3}")
    A(f"   {j['西_右手(家庭の接し方)'][0]}{j['西_右手(家庭の接し方)'][1]:>3}   {j['中央_胸(生き方の中心)'][0]}{j['中央_胸(生き方の中心)'][1]:>3}   {j['東_左手(仕事の仕方)'][0]}{j['東_左手(仕事の仕方)'][1]:>3}")
    A(f"   {s['左足_中年(生涯通じて)'][0]}{s['左足_中年(生涯通じて)'][1]:>3}   {j['南_腹(未来/心の充実)'][0]}{j['南_腹(未来/心の充実)'][1]:>3}   {s['右足_晩年(社会人時代)'][0]}{s['右足_晩年(社会人時代)'][1]:>3}")
    A("")
    A("  ※ 上図は位置の確認用。解釈には必ず下の一覧を使うこと")
    _src = {"北_頭(哲学/価値観)": "年干",
            "西_右手(家庭の接し方)": "日支の蔵干",
            "中央_胸(生き方の中心)": "月支の蔵干",
            "東_左手(仕事の仕方)": "年支の蔵干",
            "南_腹(未来/心の充実)": "月干"}
    for k, v in j.items():
        A(f"    {k:<24} {v[0]}{v[1]:>3}   （導出元：{_src[k]}）")
    A("")
    _js = {"右肩_初年(社会人なるまで)": "年支", "左足_中年(生涯通じて)": "日支",
           "右足_晩年(社会人時代)": "月支"}
    for k, v in s.items():
        A(f"    {k:<24} {v[0]}{v[1]:>3}   （導出元：日干×{_js[k]}）")
    A("")
    g = r.gogyo
    A("【五行エネルギー】")
    A(f"            {g['上(印)']:>3}")
    A(f"     {g['左(官)']:>3} →×  {g['中央(自)']:>3}  →× {g['右(財)']:>3}      T.{g['総和']}")
    A(f"            {g['下(食傷)']:>3}")
    A("")
    A(f"【守護神】第1〜 {' / '.join(r.meta['守護神'])}"
      f"  ({'★帳票実証済' if r.meta['守護神_実証済'] else '△窮通宝鑑ベースの推定'})")
    A("")
    A("【大運】")
    for d in r.daiun:
        A(f"  {d['age']:>3}~ {d['kanshi']} {d['主星']} {d['従星']} | "
          f"{'·'.join(d['位相_日']) or '':<14}|{'·'.join(d['位相_月']) or '':<14}|"
          f"{'·'.join(d['位相_年']) or '':<14}| {d['気']:<4}"
          f"{d['守護神']:<8}"
          + " ".join([f"{a}-{b}" for a, b in d['三合方位']] + d['格']))
    return "\n".join(L)


def nenun_table(r, lo, hi):
    out = ["【年運】"]
    for n in r.nenun:
        if lo <= n["age"] <= hi:
            out.append(f"  {n['age']:>3}歳 ({n['year']}) {n['kanshi']} {n['主星']} {n['従星']} | "
                       f"{'·'.join(n['位相_日']) or '':<14}|{'·'.join(n['位相_月']) or '':<14}|"
                       f"{'·'.join(n['位相_年']) or '':<14}| {n['気']}")
    return "\n".join(out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 4:
        print(__doc__); sys.exit(1)
    y, m, d = int(a[0]), int(a[1]), int(a[2])
    male = a[3].upper().startswith("M")
    name = a[4] if len(a) > 4 else "無名"
    r = build(name, y, m, d, male)
    print(render(r))
    print()
    from datetime import date
    age = date.today().year - y
    print(nenun_table(r, max(0, age - 4), age + 5))
