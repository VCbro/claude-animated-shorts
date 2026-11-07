# How DNS works: brief

- **Spec:** 9:16, 1080×1920, 24 fps, 44.0 s, voice-led. Style: math. Hero: pi. Composed score at −12 dB under the voice.
- **Voice:** Kokoro-82M (local, Apache-2.0), voice `af_heart`, speed 0.95. One take per line in `voice/`. Word times come from faster-whisper `small.en` (110 of 115 words heard).
- **Format:** a morph chain timed by the voice: 3 scenes, 2 shape morphs, 0 hard cuts.
- **Device:** a name is read from right to left, and each server knows one label. The trailing `.` becomes the root server, and the end shows the opening frame answered from the cache.

## Colour code
`.` and root purple · `com` green · `example` red · the answer yellow · the resolver blue · the cache and TTL teal · the question white.

## Beats (cued from voice.json)
| # | line | picture | bridge |
|---|---|---|---|
| 1 | "You type example dot com. But computers find each other by number…" | the address bar is written on, `→ ?` | — |
| 2 | "So your device asks a resolver…" | the resolver is drawn, the query dot goes from device to resolver | — |
| 3 | "The trick? A name is read from right to left." | trailing `.`, underlines drawn right to left, the `.` flies and grows | morph 1: `.` → root |
| 4 | "First, a root server…" | hop 1, the referral "ask .com" | — |
| 5 | "The dot com server doesn't know either…" | hop 2, the referral "ask example" | — |
| 6 | "And example's own name server…" | hop 3, hold, **silence** | — |
| 7 | (pause) "…knows the answer." | **the hit**: the yellow address flashes up | — |
| 8 | "The resolver hands the number back…" | the answer goes to the resolver, then to the device, which connects (✓) | morph 2: the answer card → the cache record |
| 9 | "It also keeps a copy…time to live…" | the cache record, the TTL counts down 1 s per s | — |
| 10 | "So next time, the answer is already there." | asked again, answered from the cache, `hops = 0` | the loop |

## Sound
A quiet pad, a pluck per question and per referral, typing ticks. The pad stops before the silence (about 0.85 s). The loudest hit is a chime stab, plucks and a sub in the pause before "knows the answer", followed by a flat chord.

## Claims and sources
- A recursive resolver asks the root, then the TLD server, then the authoritative server. The root and the TLD server each answer with a referral, not the address. Source: [ManageEngine: how DNS works](https://www.manageengine.com/products/oputils/tech-topics/how-dns-works.html).
- Resolvers cache records for the record's TTL in seconds. Source: same as above.
- There are 13 root server identities, A–M. Source: [root-servers.org FAQ](https://root-servers.org/faq/).
- The address 203.0.113.7 is from the range reserved for documentation (RFC 5737) and is labelled "illustrative" on screen. The TTL of 3600 s is also labelled illustrative.
- Background, not on screen: DNS was designed by Paul Mockapetris in RFCs 882 and 883 (1983). Source: [Wikipedia](https://en.wikipedia.org/wiki/Paul_Mockapetris).
