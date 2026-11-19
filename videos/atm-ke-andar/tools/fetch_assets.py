"""Download CC0 assets from Poly Haven (polyhaven.com): models as .blend + textures, PBR texture maps, HDRIs."""
import json, os, urllib.request
op = urllib.request.build_opener(); op.addheaders = [("User-Agent", "atm-short-asset-fetch/1.0")]; urllib.request.install_opener(op)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "assets/ph")
def get(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    urllib.request.urlretrieve(url, path); print("got", path)
def files(i): return json.load(urllib.request.urlopen(f"https://api.polyhaven.com/files/{i}"))
MODELS = ["circuit_board", "security_camera_01", "potted_plant_01", "metal_trash_can"]
TEXTURES = ["marble_tiles", "painted_plaster_wall", "metal_plate", "granite_tile_02"]
HDRIS = ["bank_vault", "cinema_lobby"]
for m in MODELS:
    b = files(m)["blend"]["1k"]["blend"]
    get(b["url"], f"{A}/models/{m}/{m}.blend")
    for rel, f in b["include"].items(): get(f["url"], f"{A}/models/{m}/{rel}")
for t in TEXTURES:
    f = files(t)
    for k in ["Diffuse", "Rough", "nor_gl"]:
        if k in f: get(f[k]["1k"]["jpg"]["url"], f"{A}/tex/{t}/{t}_{k}.jpg")
for h in HDRIS:
    get(files(h)["hdri"]["1k"]["hdr"]["url"], f"{A}/hdri/{h}_1k.hdr")
