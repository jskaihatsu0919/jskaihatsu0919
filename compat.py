import sys, os, json, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import build, isou, relation, shusei, jyusei, S_EL, S_POL, SHENG, KE, all_hidden, tenchusatsu

P = {
 "石原さん":(1980,8,22,True), "社長":(1976,6,26,True),
 "奥さま":(1980,9,19,False), "長女":(2010,8,16,False), "長男":(2014,12,18,True),
}
M = {k: build(k,*v) for k,v in P.items()}

def three(m): return [m.pillars['日'][1], m.pillars['月'][1], m.pillars['年'][1]]
def stems(m):
    b=[m.pillars['年'][0], m.pillars['月'][0], m.pillars['日'][0]]
    for x in three(m): b += all_hidden(x)
    return b

def pair(a,b):
    A,B=M[a],M[b]
    da,db = A.pillars['日'][0], B.pillars['日'][0]
    out={"a":a,"b":b,
      "日柱":[A.pillars['日'],B.pillars['日']],
      "aから見たb": shusei(da,db), "bから見たa": shusei(db,da)}
    # 三支総当たりの位相法
    names=["日支","月支","年支"]
    rel=[]
    for i,x in enumerate(three(A)):
        for j,y in enumerate(three(B)):
            r=isou(x,y)
            if r: rel.append(f"{names[i]}{x}－{names[j]}{y}：{'·'.join(r)}")
    out["位相法"]=rel
    # 干合
    kk=[["甲","己"],["乙","庚"],["丙","辛"],["丁","壬"],["戊","癸"]]
    out["日干干合"]= [da,db] in kk or [db,da] in kk
    # 守護神の補完
    sa,sb=set(S_EL[x] for x in A.meta['守護神']), set(S_EL[x] for x in B.meta['守護神'])
    out["bがaの守護神五行を持つ"]=sorted(sa & set(S_EL[x] for x in stems(B)))
    out["aがbの守護神五行を持つ"]=sorted(sb & set(S_EL[x] for x in stems(A)))
    # 天中殺
    ta=A.meta['天中殺_日']; tb=B.meta['天中殺_日']
    out["bの支がaの天中殺に入る"]=[x for x in three(B) if x in ta]
    out["aの支がbの天中殺に入る"]=[x for x in three(A) if x in tb]
    out["共通天中殺"] = (ta==tb) or (A.meta['天中殺_年']==B.meta['天中殺_年'])
    out["従星"]=[sum(v[1] for v in A.jyusei.values()), sum(v[1] for v in B.jyusei.values())]
    return out

res={"命式":{}, "ペア":[]}
for k,m in M.items():
    res["命式"][k]={"三柱":[m.pillars['日'],m.pillars['月'],m.pillars['年']],
      "日干":m.pillars['日'][0],
      "主星":{kk:vv for kk,vv in m.jinzu.items()},
      "従星":m.jyusei, "従星計":sum(v[1] for v in m.jyusei.values()),
      "五行":m.gogyo, "守護神":m.meta['守護神'],
      "天中殺":[m.meta['天中殺_日'],m.meta['天中殺_月'],m.meta['天中殺_年']],
      "大運現在":[d for d in m.daiun]}
fam=["石原さん","奥さま","長女","長男"]
for a,b in itertools.combinations(fam,2): res["ペア"].append(pair(a,b))
res["ペア"].append(pair("石原さん","社長"))
# 家族五行合算
tot={"木":0,"火":0,"土":0,"金":0,"水":0}
keymap={"上(印)":None}
for k in fam:
    m=M[k]; de=S_EL[m.pillars['日'][0]]
    g=m.gogyo
    inv={SHENG[x]:x for x in tot}          # x生de
    tot[de]+=g["中央(自)"]
    tot[[x for x in tot if SHENG[x]==de][0]]+=g["上(印)"]
    tot[[x for x in tot if KE[x]==de][0]]+=g["左(官)"]
    tot[KE[de]]+=g["右(財)"]
    tot[SHENG[de]]+=g["下(食傷)"]
res["家族五行合算"]=tot

json.dump(res,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'compat.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1,default=str)
