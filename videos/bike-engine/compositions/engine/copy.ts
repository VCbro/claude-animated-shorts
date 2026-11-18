// On-screen words for each language. The narration lives in lines.json.
import type { Lang } from "./kin";

type Copy = {
  title: string;
  subtitle: string;
  strokes: string[];
  strokeN: (n: number) => string;
  words: string[];
  labels: Record<string, string>;
};

export const COPY: Record<Lang, Copy> = {
  en: {
    title: "How a bike engine works",
    subtitle: "FOUR-STROKE · SINGLE CYLINDER",
    strokes: ["Intake", "Compression", "Power", "Exhaust"],
    strokeN: (n) => `STROKE ${n} OF 4`,
    words: ["Suck", "Squeeze", "Bang", "Blow"],
    labels: {
      piston: "Piston", rod: "Connecting rod", crank: "Crankshaft", valveIn: "Intake valve", valveEx: "Exhaust valve",
      plug: "Spark plug", mixture: "Air + petrol", silencer: "To the silencer", gearbox: "Gearbox", chain: "Chain",
      wheel: "Rear wheel",
    },
  },
  hi: {
    title: "बाइक का इंजन कैसे काम करता है",
    subtitle: "फोर-स्ट्रोक · सिंगल सिलेंडर",
    strokes: ["इनटेक", "कम्प्रेशन", "पावर", "एग्ज़ॉस्ट"],
    strokeN: (n) => `स्ट्रोक ${n} / 4`,
    words: ["खींचो", "दबाओ", "जलाओ", "निकालो"],
    labels: {
      piston: "पिस्टन", rod: "कनेक्टिंग रॉड", crank: "क्रैंकशाफ्ट", valveIn: "इनटेक वाल्व", valveEx: "एग्ज़ॉस्ट वाल्व",
      plug: "स्पार्क प्लग", mixture: "हवा + पेट्रोल", silencer: "साइलेंसर की ओर", gearbox: "गियरबॉक्स", chain: "चेन",
      wheel: "पिछला पहिया",
    },
  },
};
