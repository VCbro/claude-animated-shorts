"""A studio lighting panorama (equirectangular Radiance .hdr): dark cyclorama, a big overhead softbox, two tall strip
lights left and right, a warm kicker behind. Metal reflects these, which is what makes it read as metal.
usage: python3 -I tools/make_hdr.py assets/studio.hdr
"""
import sys
import numpy as np

W, H = 2048, 1024
lon = (np.arange(W) + 0.5) / W * 2 * np.pi - np.pi          # -pi..pi, 0 = looking down -z
lat = np.pi / 2 - (np.arange(H) + 0.5) / H * np.pi           # +pi/2 top
LON, LAT = np.meshgrid(lon, lat)
# direction: x = sin(lon) cos(lat), y = sin(lat), z = -cos(lon) cos(lat)
dx, dy, dz = np.sin(LON) * np.cos(LAT), np.sin(LAT), -np.cos(LON) * np.cos(LAT)

img = np.zeros((H, W, 3), np.float32)
# cyclorama: dark blue-grey, a little brighter toward the horizon, darker floor
base = 0.035 + 0.03 * np.exp(-(LAT / 0.35) ** 2)
base = np.where(LAT < 0, 0.018 + 0.012 * np.exp(-(LAT / 0.2) ** 2), base)
img += base[..., None] * np.array([0.85, 0.92, 1.05])


def soft_rect(cx, cy, cz, ux, uy, uz, vx, vy, vz, hu, hv, power, color, soft=0.08):
    """A rectangle light: centre direction c, its in-plane axes u, v (unit), half-sizes as angles-ish."""
    c = np.array([cx, cy, cz], float); c /= np.linalg.norm(c)
    u = np.array([ux, uy, uz], float); u /= np.linalg.norm(u)
    v = np.array([vx, vy, vz], float); v /= np.linalg.norm(v)
    d = np.stack([dx, dy, dz], -1)
    facing = d @ c
    pu, pv = d @ u, d @ v
    mu = 1 / (1 + np.exp((np.abs(pu) - hu) / (soft * hu)))
    mv = 1 / (1 + np.exp((np.abs(pv) - hv) / (soft * hv)))
    m = mu * mv * (facing > 0)
    # brighter centre, like a real softbox
    m *= 0.8 + 0.2 * np.exp(-((pu / hu) ** 2 + (pv / hv) ** 2))
    return m[..., None] * power * np.array(color, np.float32)


# overhead key softbox, tilted toward the front
img += soft_rect(0.15, 0.9, 0.35, 1, 0, 0, 0, -0.35, 0.9, 0.38, 0.26, 9.0, [1.0, 0.98, 0.95])
# tall strip lights, left (cool) and right (neutral), slightly in front
img += soft_rect(-0.92, 0.1, 0.35, 0, 0, 1, 0, 1, 0, 0.07, 0.55, 7.0, [0.80, 0.90, 1.0])
img += soft_rect(0.92, 0.1, 0.30, 0, 0, 1, 0, 1, 0, 0.07, 0.55, 6.0, [1.0, 0.97, 0.92])
# warm kicker behind, low
img += soft_rect(0.3, 0.15, -0.95, 1, 0, 0.3, 0, 1, 0, 0.25, 0.12, 4.0, [1.0, 0.72, 0.45])
# a small hot fill card front-right
img += soft_rect(0.55, 0.25, 0.8, 0.8, 0, -0.55, 0, 1, 0, 0.12, 0.12, 2.5, [1.0, 1.0, 1.0])


def write_hdr(path, rgb):
    h, w, _ = rgb.shape
    m = rgb.max(-1)
    e = np.ceil(np.log2(np.maximum(m, 1e-32)))
    scale = np.where(m > 1e-32, 256.0 / np.exp2(e), 0)
    rgbe = np.zeros((h, w, 4), np.uint8)
    rgbe[..., :3] = np.clip(rgb * scale[..., None], 0, 255).astype(np.uint8)
    rgbe[..., 3] = np.where(m > 1e-32, e + 128, 0).astype(np.uint8)
    with open(path, "wb") as f:
        f.write(b"#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n")
        f.write(f"-Y {h} +X {w}\n".encode())
        f.write(rgbe.tobytes())


write_hdr(sys.argv[1] if len(sys.argv) > 1 else "studio.hdr", img)
print("max", float(img.max()), "mean", float(img.mean()))
