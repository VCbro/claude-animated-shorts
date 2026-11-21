"""Chromium-rendered textures (Hindi needs real shaping): a made-up generic banknote (not a copy of any
real note), its fake twin and UV mask, a generic bank card, ATM screens and fascia."""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NM = "file://" + ROOT + "/node_modules/@fontsource/baloo-2/files/"
FONT = f"""@font-face{{font-family:B;font-weight:800;src:url({NM}baloo-2-devanagari-800-normal.woff2);unicode-range:U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}}
@font-face{{font-family:B;font-weight:800;src:url({NM}baloo-2-latin-800-normal.woff2);unicode-range:U+0000-00FF,U+2022,U+00D7,U+2026}}
@font-face{{font-family:B;font-weight:600;src:url({NM}baloo-2-devanagari-600-normal.woff2);unicode-range:U+0900-097F,U+1CD0-1CFF,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}}
@font-face{{font-family:B;font-weight:600;src:url({NM}baloo-2-latin-600-normal.woff2);unicode-range:U+0000-00FF,U+2022,U+00D7,U+2026}}
*{{margin:0;box-sizing:border-box}} body{{font-family:B,sans-serif;overflow:hidden}}"""

def note(kind):
    real = kind != "fake"; uv = kind == "uv"
    bg = "#000" if uv else ("linear-gradient(90deg,#b9a6c4,#d8cbd6 45%,#c7b6cc)" if real else "linear-gradient(90deg,#c4b4c0,#dcd2d6 45%,#cfc2c8)")
    ink = "#4b2f5e" if real else "#6f5a72"
    guil = "".join(f'<div style="position:absolute;left:{380+i*9}px;top:{40+i*3}px;width:{360-i*12}px;height:{360-i*12}px;border:2px solid {ink};opacity:.18;border-radius:50%"></div>' for i in range(16))
    lines = "".join(f'<div style="position:absolute;left:0;right:0;top:{i*12}px;height:1px;background:{ink};opacity:.06"></div>' for i in range(40))
    fib = "".join(f'<div style="position:absolute;left:{(i*137)%1200}px;top:{(i*71)%500}px;width:{10+(i*7)%18}px;height:3px;background:#7fffd4;transform:rotate({(i*53)%180}deg);opacity:.95"></div>' for i in range(90))
    if uv:
        inner = (fib + '<div style="position:absolute;left:300px;top:380px;width:140px;height:60px;background:#62f0ff;border-radius:8px"></div>'
                 '<div style="position:absolute;left:520px;top:0;bottom:0;width:22px;background:repeating-linear-gradient(#5affc0 0 22px,transparent 22px 40px)"></div>')
    else:
        thread = f'<div style="position:absolute;left:520px;top:0;bottom:0;width:22px;background:repeating-linear-gradient(#2fa98c 0 22px,#aeb6c2 22px 40px);box-shadow:0 0 0 1px #0003"></div>' if real else \
                 '<div style="position:absolute;left:520px;top:0;bottom:0;width:10px;background:#9a8fa0;opacity:.6"></div>'
        inner = f"""{lines}{guil}{thread}
        <div style="position:absolute;left:40px;top:28px;font-weight:800;font-size:150px;color:{ink};line-height:1">500</div>
        <div style="position:absolute;right:46px;bottom:20px;font-weight:800;font-size:110px;color:{ink};line-height:1">500</div>
        <div style="position:absolute;left:44px;bottom:40px;font-weight:600;font-size:46px;color:{ink}">पाँच सौ · नमूना</div>
        <div style="position:absolute;right:60px;top:48px;width:230px;height:230px;border-radius:50%;background:radial-gradient(#fff8 0,#fff3 60%,transparent 70%)"></div>
        <div style="position:absolute;left:44px;top:210px;font-weight:600;font-size:34px;color:{ink};letter-spacing:6px">SPECIMEN 7AB 204518</div>
        <div style="position:absolute;inset:14px;border:6px solid {ink};opacity:.35;border-radius:10px"></div>"""
    return f'<div style="width:1200px;height:500px;position:relative;overflow:hidden;background:{bg}">{inner}</div>', (1200, 500)

def card():
    return ("""<div style="width:856px;height:540px;border-radius:40px;position:relative;overflow:hidden;
      background:linear-gradient(130deg,#0d3b66 0,#1565a8 55%,#0b2a4a);color:#fff">
      <div style="position:absolute;right:-120px;top:-160px;width:560px;height:560px;border-radius:50%;background:#ffffff14"></div>
      <div style="position:absolute;left:56px;top:40px;font-weight:800;font-size:58px">आपका बैंक</div>
      <div style="position:absolute;left:70px;top:178px;width:120px;height:92px;border-radius:14px;background:linear-gradient(135deg,#f6d77c,#c9a13e);box-shadow:inset 0 0 0 3px #a8842e"></div>
      <div style="position:absolute;left:60px;top:320px;font-weight:600;font-size:56px;letter-spacing:8px">4532 •••• •••• 1290</div>
      <div style="position:absolute;left:60px;top:430px;font-weight:600;font-size:34px;opacity:.85">DEBIT</div>
      <div style="position:absolute;right:56px;bottom:40px;font-weight:800;font-size:44px;opacity:.9">ATM · RuPay-style</div></div>""".replace("RuPay-style", "DEBIT"), (856, 540))

def screen(title, sub, accent="#1e88e5", extra=""):
    return (f"""<div style="width:800px;height:600px;background:linear-gradient(#0f2740,#0a1a2c);color:#fff;position:relative;overflow:hidden">
      <div style="height:90px;background:{accent};display:flex;align-items:center;padding-left:36px;font-weight:800;font-size:46px">आपका बैंक ATM</div>
      <div style="padding:70px 50px 0;text-align:center;font-weight:800;font-size:68px;line-height:1.2">{title}</div>
      <div style="padding:26px 50px 0;text-align:center;font-weight:600;font-size:40px;color:#bcd6ef">{sub}</div>{extra}</div>""", (800, 600))

def fascia():
    return ("""<div style="width:1000px;height:200px;background:linear-gradient(#e53935,#b71c1c);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 50px">
      <div style="font-weight:800;font-size:120px;letter-spacing:6px">ATM</div><div style="font-weight:800;font-size:64px">२४×७ नकद</div></div>""", (1000, 200))

def sign(txt, w, h, bg, fg, fs):
    return (f'<div style="width:{w}px;height:{h}px;background:{bg};color:{fg};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:{fs}px">{txt}</div>', (w, h))

JOBS = {"bank_sign": sign("आपका बैंक", 1000, 220, "#1b2433", "#ffd479", 130), "reject": sign("रिजेक्ट", 600, 200, "#7a1414", "#fff", 110),
        "cass": sign("₹500", 400, 200, "#d9dde2", "#2b2f36", 120), "secure": sign("सुरक्षित चिप", 600, 200, "#111", "#d7b24a", 90),"note_real": note("real"), "note_fake": note("fake"), "note_uv": note("uv"), "card": card(), "fascia": fascia(),
        "scr_insert": screen("कृपया कार्ड डालें", "Please insert your card"),
        "scr_pin": screen("अपना PIN डालें", "", extra='<div style="margin:40px auto 0;width:420px;height:90px;border-radius:14px;background:#ffffff1a;text-align:center;font-weight:800;font-size:70px;letter-spacing:22px">••••</div>'),
        "scr_wait": screen("कृपया प्रतीक्षा करें…", "बैंक से जुड़ रहे हैं", "#f9a825"),
        "scr_ok": screen("नकद लें", "धन्यवाद!", "#43a047")}
with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")
    for name, (html, (w, h)) in JOBS.items():
        pg = b.new_page(viewport={"width": w, "height": h})
        pg.set_content(f"<style>{FONT}</style>{html}"); pg.evaluate("document.fonts.ready.then(()=>1)")
        pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(ROOT, f"assets/tex/{name}.png"), omit_background=True); pg.close()
    b.close()
print("ok")
