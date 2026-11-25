import sys, glob, os
from PIL import Image, ImageDraw
ts=[float(x) for x in sys.argv[2].split(",")]; out=sys.argv[1]
w,h=200,356; cols=8
rows=(len(ts)+cols-1)//cols
im=Image.new("RGB",(w*cols,h*rows),"black"); d=ImageDraw.Draw(im)
for i,t in enumerate(ts):
    f="out/stills/t%06.2f.jpg"%t
    if not os.path.exists(f): continue
    x=Image.open(f).resize((w,h)); im.paste(x,((i%cols)*w,(i//cols)*h)); d.text(((i%cols)*w+4,(i//cols)*h+4),"%.1f"%t,fill="yellow")
im.save(out)
