# 3d-animator — ChatGPT / Codex / अपने PC पर इस्तेमाल करने की गाइड

## ये क्या है?
कोड से cinematic 3D वीडियो बनाने की skill: three.js सीन + headless Chrome में फ़्रेम-दर-फ़्रेम रेंडर
(motion blur, depth of field, soft shadows, film grade) + ffmpeg से MP4।
`examples/` में हमारे बनाए असली Shorts का कोड है (हिचकी, दशरथ मांझी, चिली) — यही "best" स्टाइल है।

## सबसे ज़रूरी बात (ईमानदारी से)
- **रेंडर हमेशा आपके PC पर होगा** (Node + Chrome + ffmpeg)। ChatGPT की वेबसाइट के अंदर Chrome/ffmpeg नहीं चलता,
  इसलिए ChatGPT वहाँ सिर्फ़ **कोड (film.js) लिखेगा** — वीडियो आप अपने PC पर एक कमांड से बनाएँगे।
- ChatGPT आउटपुट की क्वालिटी Claude जैसी ही हो, ये गारंटी नहीं — वो इन्हीं गाइड और examples को पढ़कर कोड लिखेगा।
- **Codex (OpenAI का कोडिंग एजेंट, आपके PC पर)** फ़ाइलें बनाकर ख़ुद कमांड भी चला सकता है — Claude Code जैसा सबसे करीबी अनुभव वही है।

---------------------------------------------------------------------------------------------------
## स्टेप 1 — PC तैयार करें (एक बार)  — PowerShell में
```
winget install OpenJS.NodeJS.LTS
winget install Gyan.FFmpeg
winget install Python.Python.3.12
```
(Node और FFmpeg आपने पहले ही install कर रखे हैं।) PowerShell बंद करके दोबारा खोलें।

## स्टेप 2 — zip निकालें
zip को `C:\3d-animator` में Extract करें।

## स्टेप 3 — नया वीडियो-प्रोजेक्ट बनाएँ
```
mkdir C:\shorts\mera-video
xcopy /E /I C:\3d-animator\examples\vertical-short-template C:\shorts\mera-video
cd C:\shorts\mera-video
npm install
npm install @fontsource/baloo-2
copy C:\3d-animator\examples\chile\film.js film.js     # शुरुआत के लिए एक तैयार film.js (बाद में ChatGPT/Codex वाला film.js इसकी जगह रखें)
mkdir voice, out, deliver, audio, img
pip install faster-whisper scipy numpy
```

## स्टेप 4 — आवाज़ और शब्दों की टाइमिंग
- अपनी ElevenLabs MP3 को `voice\source.mp3` में रखें, स्क्रिप्ट को `deliver\script_hi.txt` में।
- ChatGPT/Codex से कहें: "voice ko trim karke voice.wav, voice.mp3, v16.wav banao aur tools\patch_probe.py + tools\align.py chalao"
  (ये `out\words.json` बनाएगा — हर शब्द का समय, जिससे captions और सीन voice पर sync होते हैं)।

## स्टेप 5 — ChatGPT में
**तरीका A: ChatGPT Project (वेबसाइट/ऐप)**
1. ChatGPT → बाएँ "Projects" → New project → नाम "3D Shorts"।
2. Project files में ये अपलोड करें: `SKILL.md`, `references\*.md`, `kit\film.js`,
   `examples\vertical-short-template\cine.js`, `examples\chile\film.js`, `examples\manjhi\film.js`।
3. Project instructions में ये लिखें:
   "Tum 3d-animator skill follow karoge (SKILL.md). Vertical 1080x1920 Hindi Short ke liye cine.js toolkit use karke
    pura film.js likho — keys (camera), titles, pills, captions out/words.json se. Real photo sirf fact wale moment pe photoCard se."
4. फिर हर वीडियो के लिए: स्क्रिप्ट + `out\words.json` की content चिपकाएँ और कहें "is story ka film.js likho"।
5. मिला हुआ `film.js` अपने प्रोजेक्ट फ़ोल्डर में सेव करें।

**तरीका B: Codex (सबसे अच्छा)** — PowerShell में:
```
npm install -g @openai/codex
mkdir $HOME\.codex\skills -Force
xcopy /E /I C:\3d-animator $HOME\.codex\skills\3d-animator
cd C:\shorts\mera-video
codex
```
फिर Codex से कहें: "3d-animator skill (~/.codex/skills/3d-animator/SKILL.md) padho aur is MP3 se cinematic 3D Short banao".
(अगर आपके Codex वर्ज़न में skills फ़ोल्डर नहीं पढ़ा जाता, तो प्रोजेक्ट फ़ोल्डर में `AGENTS.md` बनाकर उसमें लिखें:
 "Follow C:\3d-animator\SKILL.md and examples\ for every video.")

## स्टेप 6 — रेंडर (आपके PC पर)
```
cd C:\shorts\mera-video
node render.mjs --stills=0.1,10,30 --n=8 --out=out\stills          # पहले कुछ फ़ोटो देखकर look चेक करें
node render.mjs --video --n=3 --crf=16 --out=out\video.mp4          # पूरा वीडियो
ffmpeg -i out\video.mp4 -i audio\mix.wav -map 0:v -map 1:a -c:v libx264 -crf 20 -c:a aac -b:a 256k -af loudnorm=I=-14 -shortest deliver\final.mp4
```
- आपके PC में ग्राफ़िक्स कार्ड है तो रेंडर cloud से **कई गुना तेज़** होगा (--n=8 या 16 भी चला सकते हैं = और smooth)।
- Windows पर `CHROME_ARGS` की ज़रूरत नहीं।

## फ़ोल्डर में क्या है
- `SKILL.md`, `references\` — skill के नियम (कैमरा, लाइट, मोशन, साउंड)
- `kit\` — ओरिजिनल स्टार्टर (16:9 डेस्क सीन)
- `examples\vertical-short-template\` — 1080x1920 Shorts टेम्पलेट: `cine.js` (cinematic toolkit), `render.mjs`, `tools\` (Whisper timing, sound effects)
- `examples\hichki|manjhi|chile\film.js` — हमारे बने Shorts का पूरा कोड (ChatGPT/Codex को उदाहरण के लिए दें)

## ध्यान दें
- `cine.js` वाले examples में `photoCard('img/xyz.jpg')` असली फ़ोटो लेता है — सिर्फ़ फ़्री-लाइसेंस (Wikimedia Commons आदि) फ़ोटो लें
  और description में credit दें।
- फ़ॉन्ट: `node_modules\@fontsource\baloo-2` चाहिए (स्टेप 3 में install होता है)।
