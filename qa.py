import zipfile, re, sys, math
from defusedxml import minidom
EMU=914400.0
def check(path):
    z=zipfile.ZipFile(path)
    names=sorted([n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$',n)],
                 key=lambda n:int(re.findall(r'\d+',n)[-1]))
    issues=[]
    for idx,n in enumerate(names,1):
        d=minidom.parseString(z.read(n))
        for sp in d.getElementsByTagName('p:sp'):
            off=sp.getElementsByTagName('a:off'); ext=sp.getElementsByTagName('a:ext')
            if not off or not ext: continue
            x=int(off[0].getAttribute('x'))/EMU; y=int(off[0].getAttribute('y'))/EMU
            w=int(ext[0].getAttribute('cx'))/EMU; h=int(ext[0].getAttribute('cy'))/EMU
            if x<-0.05 or y<-0.05 or x+w>13.39 or y+h>7.56:
                issues.append(f"S{idx} はみ出し x={x:.2f} y={y:.2f} w={w:.2f} h={h:.2f}")
            # テキスト量の概算
            txt=''.join(t.firstChild.data for t in sp.getElementsByTagName('a:t') if t.firstChild)
            if not txt.strip(): continue
            szs=[int(r.getAttribute('sz'))/100 for r in sp.getElementsByTagName('a:rPr') if r.getAttribute('sz')]
            sz=max(szs) if szs else 18
            ls=[int(l.getAttribute('val'))/100 for l in sp.getElementsByTagName('a:spcPts')]
            line=(ls[0] if ls else sz*1.2)/72.0
            # 全角=1em, 半角=0.5em で概算
            em=sum(1.0 if ord(c)>0x2000 else 0.5 for c in txt)
            cpl=max(1,(w-0.1)*72/sz)
            nl=txt.count('\n')
            lines=sum(math.ceil(max(1,sum(1.0 if ord(c)>0x2000 else 0.5 for c in seg))/cpl) for seg in txt.split('\n'))
            need=lines*line
            if need>h*1.06:
                issues.append(f"S{idx} 溢れ懸念 need={need:.2f} h={h:.2f} sz={sz} 「{txt[:26]}…」")
    return issues
for f in sys.argv[1:]:
    print("=====",f)
    r=check(f)
    print("\n".join(r) if r else "  問題なし")
