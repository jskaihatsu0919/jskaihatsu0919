# -*- coding: utf-8 -*-
"""
算命学（高尾学派）命式算出エンジン
石原家4名の帳票を正解データとして逆解析・検証したロジックを実装。
"""
import json, os, datetime
from dataclasses import dataclass, field

import sxtwl

_DIR = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(_DIR, "data", "tables.json"), encoding="utf-8"))

STEMS = T["stems"]
BRANCHES = T["branches"]
S_EL = T["stem_element"]
S_POL = T["stem_polarity"]
B_EL = T["branch_element"]
SHENG = T["sheng"]
KE = T["ke"]
HIDDEN = {k: v for k, v in T["hidden_stems"].items() if not k.startswith("_")}
PHASE = T["twelve_phase_order"]
CS = {k: v for k, v in T["changsheng_branch"].items() if not k.startswith("_")}
TW = {k: v for k, v in T["twelve_stars"].items() if not k.startswith("_")}
TEN = {k: v for k, v in T["ten_stars"].items() if not k.startswith("_")}
SHUGO = T["shugojin"]["table"]
SHUGO_OK = set(T["shugojin"]["verified"])
SHENG_ORDER = ["木", "火", "土", "金", "水"]

JST = datetime.timezone(datetime.timedelta(hours=9))


# ---------------- 節気 ----------------
def _jd_to_jst(jd):
    """sxtwlのJDは中国標準時(UTC+8)基準。JSTは+1時間。"""
    dt = datetime.datetime(2000, 1, 1, 12) + datetime.timedelta(days=jd - 2451545.0)
    return (dt + datetime.timedelta(hours=1)).replace(tzinfo=JST)


def solar_terms(year):
    """その年の『節』(月の切替点) を [(節気index, datetime_jst)] で返す。奇数indexが節。"""
    out = []
    for m in range(1, 13):
        for d in range(1, 32):
            try:
                day = sxtwl.fromSolar(year, m, d)
            except Exception:
                break
            if day.hasJieQi():
                idx = day.getJieQi()
                if idx % 2 == 1:                      # 小寒/立春/啓蟄/... = 節
                    out.append((idx, _jd_to_jst(day.getJieQiJD())))
    return sorted(out, key=lambda x: x[1])


_TERM_CACHE = {}


def _terms_around(dt):
    y = dt.year
    key = y
    if key not in _TERM_CACHE:
        _TERM_CACHE[key] = solar_terms(y - 1) + solar_terms(y) + solar_terms(y + 1)
    return _TERM_CACHE[key]


def prev_next_setsu(dt):
    """dt直前の節と直後の節を返す。"""
    ts = _terms_around(dt)
    prev = max([t for t in ts if t[1] <= dt], key=lambda x: x[1])
    nxt = min([t for t in ts if t[1] > dt], key=lambda x: x[1])
    return prev, nxt


# 節気index(奇数) → 月支。小寒(1)=丑, 立春(3)=寅, 啓蟄(5)=卯 ...
_SETSU_TO_BRANCH = {1: "丑", 3: "寅", 5: "卯", 7: "辰", 9: "巳", 11: "午",
                    13: "未", 15: "申", 17: "酉", 19: "戌", 21: "亥", 23: "子"}


# ---------------- 干支 ----------------
def kanshi_no(stem, branch):
    """六十干支番号(1-60)"""
    si, bi = STEMS.index(stem), BRANCHES.index(branch)
    for n in range(60):
        if n % 10 == si and n % 12 == bi:
            return n + 1
    raise ValueError("invalid pair")


def no_to_kanshi(n):
    n = (n - 1) % 60
    return STEMS[n % 10], BRANCHES[n % 12]


def day_pillar(dt):
    """日柱。JDN基準。1984-02-02が甲子日。"""
    d = dt.date()
    a = (14 - d.month) // 12
    y = d.year + 4800 - a
    m = d.month + 12 * a - 3
    jdn = d.day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    n = (jdn + 49) % 60          # 較正済みオフセット
    return STEMS[n % 10], BRANCHES[n % 12]


def year_pillar(dt):
    """年柱。立春で切替。"""
    ts = _terms_around(dt)
    risshun = [t for t in ts if t[0] == 3]
    y = dt.year
    ry = [t[1] for t in risshun if t[1].year == y]
    if ry and dt < ry[0]:
        y -= 1
    n = (y - 4) % 60
    return STEMS[n % 10], BRANCHES[n % 12]


_GOKOTON = {"甲": "丙", "己": "丙", "乙": "戊", "庚": "戊", "丙": "庚", "辛": "庚",
            "丁": "壬", "壬": "壬", "戊": "甲", "癸": "甲"}


def month_pillar(dt, year_stem):
    """月柱。五虎遁で寅月の干を決め、月支まで進める。"""
    (setsu_idx, _), _ = prev_next_setsu(dt)
    mb = _SETSU_TO_BRANCH[setsu_idx]
    tora_stem = _GOKOTON[year_stem]
    offset = (BRANCHES.index(mb) - BRANCHES.index("寅")) % 12
    ms = STEMS[(STEMS.index(tora_stem) + offset) % 10]
    return ms, mb


def hidden_stem(branch, elapsed_days):
    """節入からの経過日数で蔵干(元命)を選ぶ。"""
    acc = 0
    tbl = HIDDEN[branch]
    for st, days in tbl:
        acc += days
        if elapsed_days < acc:
            return st
    return tbl[-1][0]


def all_hidden(branch):
    return [s for s, _ in HIDDEN[branch]]


# ---------------- 星 ----------------
def twelve_phase(stem, branch):
    start = BRANCHES.index(CS[stem])
    step = 1 if S_POL[stem] > 0 else -1
    idx = (BRANCHES.index(branch) - start) * step % 12
    return PHASE[idx]


def jyusei(stem, branch):
    p = twelve_phase(stem, branch)
    return TW[p]["name"], TW[p]["energy"]


def shusei(day_stem, target):
    de, te = S_EL[day_stem], S_EL[target]
    if de == te:
        rel = "same"
    elif SHENG[de] == te:
        rel = "i_sheng"
    elif KE[de] == te:
        rel = "i_ke"
    elif KE[te] == de:
        rel = "ke_me"
    else:
        rel = "sheng_me"
    pol = "same" if S_POL[day_stem] == S_POL[target] else "diff"
    return TEN[f"{rel}|{pol}"]


def stem_energy(stem, three_branches):
    """その干の、命式三支に対する十二大従星点数の合計。"""
    return sum(jyusei(stem, b)[1] for b in three_branches)


_OUKI = {}
for _hou, _tri in {"木": ["寅", "卯", "辰"], "火": ["巳", "午", "未"],
                   "金": ["申", "酉", "戌"], "水": ["亥", "子", "丑"]}.items():
    for _b in _tri:
        _OUKI[_b] = {_hou}
for _b in ("辰", "戌", "丑", "未", "巳", "午"):     # 土は四季末＋火土同根で巳午に旺じる
    _OUKI[_b].add("土")


def ouki(branch):
    """その支で旺じる五行（方三位の気＋土）。"""
    return _OUKI[branch]


def ki(stem, branch):
    """生気/逆気/専気。日干に依存せず、その柱の干支だけで決まる（7名70行で確認）。"""
    a, b = S_EL[stem], B_EL[branch]
    if a in ouki(branch):
        return "専気"
    if SHENG[a] == b or SHENG[b] == a:
        return "生気"
    return "逆気"


def tenchusatsu(stem, branch):
    n = kanshi_no(stem, branch)
    jun = (n - 1) // 10
    return ["戌亥", "申酉", "午未", "辰巳", "寅卯", "子丑"][jun]


# ---------------- 位相法 ----------------
_IS = T["isou_hou"]
_PAIR = {}
for name in ("支合", "冲", "害", "破"):
    for a, b in _IS[name]:
        _PAIR.setdefault(frozenset((a, b)), []).append(name)


def isou(b1, b2):
    """2支間の位相法。算命学の刑の名称（貴刑・庫気刑・旺気刑・自刑）を使う。"""
    r = list(_PAIR.get(frozenset((b1, b2)), []))
    if b1 != b2:
        for kyoku, tri in _IS["三合"].items():
            if b1 in tri and b2 in tri:
                r.append("半会")
                break
        # 方三位は3支揃って初めて成立するため、2支間では表示しない（帳票の挙動と一致）
        if b1 in ("寅", "巳", "申") and b2 in ("寅", "巳", "申"):
            r.append("貴刑")
        if b1 in ("丑", "戌", "未") and b2 in ("丑", "戌", "未"):
            r.append("庫気刑")
        if {b1, b2} == {"子", "卯"}:
            r.append("旺気刑")
    elif b1 in ("辰", "午", "酉", "亥"):
        r.append("自刑")
    return r


def relation(p1, p2):
    """干支2柱間の関係。干を絡めた大半会・納音・天剋地冲・律音を含む。"""
    (s1, b1), (s2, b2) = p1, p2
    r = isou(b1, b2)
    same_stem = (s1 == s2)
    if same_stem and b1 == b2:
        return ["律音"]
    if same_stem and "半会" in r:
        r = ["大半会" if x == "半会" else x for x in r]
    if same_stem and "冲" in r:
        r = ["納音" if x == "冲" else x for x in r]
    if "冲" in r and (KE[S_EL[s1]] == S_EL[s2] or KE[S_EL[s2]] == S_EL[s1]):
        r = ["天剋地冲" if x == "冲" else x for x in r]
    return r


def shugojin(day_stem, month_branch):
    """守護神（調候用神）。日干×月支の表引き。"""
    v = SHUGO[day_stem][month_branch]
    return v, (day_stem + month_branch) in SHUGO_OK


def star_numbers(sources):
    """主星の丸数字。主星を生んだ干の五行を相生順に並べた通し番号。"""
    els = []
    for st in sources:
        if S_EL[st] not in els:
            els.append(S_EL[st])
    # 相生の鎖として並べ替える（前の五行を生む五行が無いものを先頭に）
    start = next((e for e in els if not any(SHENG[x] == e for x in els)), els[0])
    order, cur = [], start
    while len(order) < len(els):
        if cur in els and cur not in order:
            order.append(cur)
        cur = SHENG[cur]
        if len(order) == 0:
            break
    for e in els:
        if e not in order:
            order.append(e)
    return {st: order.index(S_EL[st]) + 1 for st in set(sources)}


def kyoku(run_branch, three):
    """運支を加えて三合・方三位が揃うか。('火', '寅午戌') のように返す。"""
    hit = []
    ban = set(three) | {run_branch}
    for k, tri in _IS["三合"].items():
        if set(tri) <= ban:
            hit.append((k[0], "".join(tri)))
    for k, tri in _IS["方三位"].items():
        if set(tri) <= ban:
            hit.append({"北方": "北", "東方": "東", "南方": "南", "西方": "西"}[k], )
            hit[-1] = ({"北方": "北", "東方": "東", "南方": "南", "西方": "西"}[k], "".join(tri))
    return hit


_STAR_BY = {"木": ("貫索星", "石門星"), "火": ("鳳閣星", "調舒星"), "土": ("禄存星", "司禄星"),
            "金": ("車騎星", "牽牛星"), "水": ("龍高星", "玉堂星")}
_TRIPLES = []
for _e in ("木", "火", "土", "金", "水"):
    for _p in (0, 1):
        _t, _x, _q = [], _e, _p
        for _ in range(3):
            _t.append(_STAR_BY[_x][_q]); _x, _q = SHENG[_x], 1 - _q
        _TRIPLES.append(_t)


def gaisangyo(meishiki_stars, run_star):
    """外三業（外-○○○）。運の主星を加えて、五行が相生で連続し陰陽が交互になる
    3主星が揃った組み合わせを返す。"""
    have = set(meishiki_stars)
    if run_star in have:
        return []                      # 命式に既にある星では成立しない（「外」＝新たに出る星）
    have = have | {run_star}
    out = []
    for t in _TRIPLES:
        if run_star in t and all(x in have for x in t):
            out.append("外-" + "".join(x[0] for x in t))
    return out


def kaku(run, pillar):
    """運と1柱の間に成立する格（判明分のみ）。"""
    (s1, b1), (s2, b2) = run, pillar
    out = []
    if s1 == s2 and b1 == b2:
        out.append("律音")
    if [s1, s2] in T["kanko"]["pairs"] or [s2, s1] in T["kanko"]["pairs"]:
        if any(x.endswith("刑") for x in isou(b1, b2)):
            out.append("干合支刑格")
    return out


# ---------------- 命式 ----------------
@dataclass
class Meishiki:
    name: str
    birth: datetime.datetime
    male: bool
    pillars: dict = field(default_factory=dict)
    hidden: dict = field(default_factory=dict)
    jinzu: dict = field(default_factory=dict)
    jyusei: dict = field(default_factory=dict)
    gogyo: dict = field(default_factory=dict)
    daiun: list = field(default_factory=list)
    nenun: list = field(default_factory=list)
    meta: dict = field(default_factory=dict)


def build(name, y, m, d, male, hour=0, minute=0):
    dt = datetime.datetime(y, m, d, hour, minute, tzinfo=JST)
    ys, yb = year_pillar(dt)
    ms, mb = month_pillar(dt, ys)
    ds, db = day_pillar(dt)

    (si, sdt), (ni, ndt) = prev_next_setsu(dt)
    elapsed = (dt - sdt).total_seconds() / 86400.0     # 蔵干判定用（実数）
    to_next = (ndt - dt).total_seconds() / 86400.0
    # 立運は「暦日の差」で数える（帳票7件で確認）
    d_back = (dt.date() - sdt.date()).days
    d_fwd = (ndt.date() - dt.date()).days

    hy, hm, hd = hidden_stem(yb, elapsed), hidden_stem(mb, elapsed), hidden_stem(db, elapsed)
    three = [db, mb, yb]

    jz = {
        "北_頭(哲学/価値観)":     shusei(ds, ys),
        "西_右手(家庭の接し方)":  shusei(ds, hd),
        "中央_胸(生き方の中心)":  shusei(ds, hm),
        "東_左手(仕事の仕方)":    shusei(ds, hy),
        "南_腹(未来/心の充実)":   shusei(ds, ms),
    }
    jz_e = {
        "北_頭(哲学/価値観)":    stem_energy(ys, three),
        "西_右手(家庭の接し方)": stem_energy(hd, three),
        "中央_胸(生き方の中心)": stem_energy(hm, three),
        "東_左手(仕事の仕方)":   stem_energy(hy, three),
        "南_腹(未来/心の充実)":  stem_energy(ms, three),
    }
    js = {
        "右肩_初年(社会人なるまで)": jyusei(ds, yb),
        "左足_中年(生涯通じて)":     jyusei(ds, db),
        "右足_晩年(社会人時代)":     jyusei(ds, mb),
    }

    # 五行エネルギー：命式に現れる全ての干（天干3＋三支の全蔵干）
    stems_all = [ys, ms, ds] + all_hidden(yb) + all_hidden(mb) + all_hidden(db)
    go = {"木": 0, "火": 0, "土": 0, "金": 0, "水": 0}
    for st in stems_all:
        go[S_EL[st]] += stem_energy(st, three)
    de = S_EL[ds]
    cross = {
        "上(印)":   go[[k for k in SHENG if SHENG[k] == de][0]],
        "左(官)":   go[[k for k in KE if KE[k] == de][0]],
        "中央(自)": go[de],
        "右(財)":   go[KE[de]],
        "下(食傷)": go[SHENG[de]],
        "総和":     sum(go.values()),
    }

    # 大運
    yang_year = S_POL[ys] > 0
    forward = (yang_year and male) or ((not yang_year) and (not male))
    days = d_fwd if forward else d_back
    q, r = divmod(days, 3)
    ritsuun = max(1, q + (1 if r >= 2 else 0))   # 弓指さん(1日→1歳)より下限1

    sg, sg_ok = shugojin(ds, mb)
    mn = kanshi_no(ms, mb)
    du = []
    for i in range(1, 11):
        st, br = no_to_kanshi(mn + i if forward else mn - i)
        du.append({
            "age": ritsuun + (i - 1) * 10, "kanshi": st + br,
            "主星": shusei(ds, st), "従星": jyusei(ds, br)[0], "気": ki(st, br),
            "位相_日": relation((st, br), (ds, db)), "位相_月": relation((st, br), (ms, mb)),
            "位相_年": relation((st, br), (ys, yb)),
            "守護神": (f"第{sg.index(st)+1}守護神" if st in sg else ""),
            "三合方位": kyoku(br, three),
            "格": gaisangyo(jz.values(), shusei(ds, st)) + kaku((st, br), (ds, db)),
        })

    # 年運（第5欄＝その年の大運との位相法）
    def daiun_at(age):
        c = [d for d in du if d["age"] <= age]
        return c[-1]["kanshi"] if c else None

    nu = []
    for age in range(0, 101):
        yy = y + age
        n = (yy - 4) % 60
        st, br = STEMS[n % 10], BRANCHES[n % 12]
        nu.append({
            "age": age, "year": yy, "kanshi": st + br,
            "主星": shusei(ds, st), "従星": jyusei(ds, br)[0], "気": ki(st, br),
            "位相_日": relation((st, br), (ds, db)), "位相_月": relation((st, br), (ms, mb)),
            "位相_年": relation((st, br), (ys, yb)),
            "位相_大運": (relation((st, br), (daiun_at(age)[0], daiun_at(age)[1]))
                        if daiun_at(age) else []),
            "三合方位": kyoku(br, three),
            "格": gaisangyo(jz.values(), shusei(ds, st)) + kaku((st, br), (ds, db)),
        })

    return Meishiki(
        name=name, birth=dt, male=male,
        pillars={"年": ys + yb, "月": ms + mb, "日": ds + db,
                 "番号": [kanshi_no(ds, db), kanshi_no(ms, mb), kanshi_no(ys, yb)]},
        hidden={"年支": hy, "月支": hm, "日支": hd},
        jinzu={k: (v, jz_e[k]) for k, v in jz.items()},
        jyusei=js, gogyo=cross, daiun=du, nenun=nu,
        meta={"節入": sdt.strftime("%Y-%m-%d %H:%M"), "経過日数": round(elapsed, 3),
              "次節まで": round(to_next, 3), "順行": forward, "立運": ritsuun,
              "立運日数": days,
              "天中殺_日": tenchusatsu(ds, db), "天中殺_年": tenchusatsu(ys, yb),
              "天中殺_月": tenchusatsu(ms, mb),
              "守護神": sg, "守護神_実証済": sg_ok,
              "主星丸数字": star_numbers([ys, hd, hm, hy, ms])},
    )
