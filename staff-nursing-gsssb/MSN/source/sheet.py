# Dev helper: stack PNGs into one preview image. Usage: python3 sheet.py out.png a.png b.png ...
import sys
from PIL import Image
ims=[Image.open(f) for f in sys.argv[2:]]
W=max(i.width for i in ims); H=sum(i.height for i in ims)
c=Image.new('RGB',(W,H),'white'); y=0
for i in ims: c.paste(i,(0,y)); y+=i.height
c.thumbnail((1000,4000)); c.save(sys.argv[1])
