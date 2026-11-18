"""Gera public/img/fundos a partir de assets-src/fundos (uso: python3 scripts/build-skins.py)."""
import json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
P={'azul-selo':(16,15,22.6,22.8),'azul-toile':(21,20,26.8,34),'vinho-barroco':(25,22,31,27.5),
'vinho-lirios':(8,7,28.5,37.7),'azul-estrelas':(16.5,16,27,22),'verde-orquideas':(20,24,25,22.5),
'natal-xadrez':(11.5,11,16.5,28),'papel-verde':(8,8,18,15),'papel-vinho':(10,10,20,17),
'xadrez-trico':(15,6,15,15),'vinho-cartucho':(21,21,29,23),'verde-lirios':(24.5,14.4,34.4,22.8)}
BACK={'azul-toile':'#1f2d52','natal-xadrez':'#2b3b34','xadrez-trico':'#6b4a3a','verde-lirios':'#4b5a2b'}
out={}
for n,(l,r,t,b) in P.items():
    im=Image.open(f'assets-src/fundos/{n}.jpg').convert('RGB'); w,h=im.size
    big=im.resize((900,round(900*h/w)),Image.LANCZOS); big.save(f'public/img/fundos/{n}.jpg',quality=82,optimize=True,progressive=True)
    th=im.resize((220,round(220*h/w)),Image.LANCZOS); th.save(f'public/img/fundos/{n}-t.jpg',quality=80,optimize=True)
    px=im.getpixel((6,6)); back=BACK.get(n,'#%02x%02x%02x'%px)
    out[n]=dict(w=900,h=round(900*h/w),paper=dict(left=l,right=r,top=t,bottom=b),backdrop=back)
# papel grande: textura do papel + selo recortado
def seal(n,box,pad=6):
    im=Image.open(f'assets-src/fundos/{n}.jpg').convert('RGB'); bg=np.array(im.getpixel((10,10)),float)
    c=im.crop(box); a=np.asarray(c).astype(float)
    d=np.sqrt(((a-bg)**2).sum(axis=2)); alpha=np.clip((d-25)/40,0,1)
    h,w=alpha.shape; m=Image.new('L',(w,h),0); ImageDraw.Draw(m).ellipse([pad,pad,w-pad,h-pad],fill=255)
    alpha=alpha*np.asarray(m.filter(ImageFilter.GaussianBlur(1.5)))/255
    rgba=np.dstack([a,alpha*255]).astype(np.uint8); Image.fromarray(rgba,'RGBA').resize((w*2,h*2),Image.LANCZOS).save(f'public/img/fundos/{n}-selo.png',optimize=True)
seal('papel-verde',(285,100,395,210)); seal('papel-vinho',(308,148,425,260))
def tex(n,box):
    im=Image.open(f'assets-src/fundos/{n}.jpg').convert('RGB').crop(box); im.save(f'public/img/fundos/{n}-papel.jpg',quality=80,optimize=True)
tex('papel-verde',(70,240,600,1000)); tex('papel-vinho',(90,300,650,1080))
json.dump(out,open('/tmp/work/skins.json','w'),indent=1)
print(json.dumps(out))
