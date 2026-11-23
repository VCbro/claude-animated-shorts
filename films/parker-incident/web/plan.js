// Shared timing plan. tools/audio.py reads the JSON between the markers, so keep it plain JSON.
// A time is a number, [lineId, offset] (line start + offset) or [lineId, word, offset].
export const PLAN = /*JSON*/{
  "walks": {
    "enter": { "t0": ["s1a", 0.1], "speed": 1.3, "step": 0.72,
               "path": [[2.9, 9.7], [2.9, 8.3], [0.6, 7.0], [0.15, -6.4], [0.15, -7.6]] },
    "leave": { "t0": ["s2g", 0.8], "speed": 1.5, "step": 0.75,
               "path": [[0.15, -7.6], [0.25, -6.4], [0.65, 7.0], [2.9, 8.3], [2.9, 9.8]] },
    "alley": { "t0": ["s3a", -0.5], "speed": 1.15, "step": 0.7,
               "path": [[0.2, 11.5], [0.15, 6.0], [-0.55, 2.8], [-1.18, 2.0]] }
  },
  "door_open": ["s1a", -0.3],
  "door_close": ["s1a", 3.0],
  "latch": ["s1e", "next", 0.0],
  "lid_lift": ["s1e", "four", 0.0],
  "spider_exit": ["s2b", 0.2],
  "contact": ["s2e", "contact", 0.0],
  "put_down": ["s2f", "once", 0.3],
  "lid_close": ["s2f", "closes", 0.0],
  "hand_right": ["s3d", "hand", -0.1],
  "hand_left": ["s3d", "other", -0.1],
  "climb_start": ["s3d", "other", 1.0],
  "climb_time": 8.2,
  "climb_height": 11.0
}/*END*/;
