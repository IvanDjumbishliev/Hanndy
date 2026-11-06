# 🖐 Hanndy — Browser Hand Gesture Controller

[![Build](https://img.shields.io/github/actions/workflow/status/IvanDjumbishliev/Hanndy/ci.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/IvanDjumbishliev/Hanndy/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0097A7?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://opensource.org/licenses/MIT)

> Control your browser with nothing but your hands. No plugins. No hardware.
> All ML runs on-device in real time.

<!-- Replace with a screen recording GIF -->

## ✨ Features

### Ten recognized gestures

| Gesture | Action |
|---|---|
| ✊ Fist | Undo the current drawing; triggers a confetti burst in the gesture demo |
| ✋ Open Hand | Reset demo likes and stop demo music |
| 👍 Thumbs Up | Add a demo like |
| 👎 Thumbs Down | Remove a demo like |
| ✌️ Peace | Toggle demo music |
| ☝️ Pointing | Move the demo cursor with the index fingertip |
| 👌 OK | Recognized and displayed; usable in gesture combos |
| 🤏 Pinch | Draw in the air |
| 🤟 Three Fingers | Recognized and displayed |
| 🤘 Spider-Man | Recognized and displayed |

### Stark-inspired HUD and creative controls

- Full-screen mirrored camera feed with floating glass HUD panels and theme toggle.
- Live gesture cards, confidence meters, hand skeleton, glowing fingertip particle trails, and wrist-mounted radar sweep.
- Air drawing in 2D and 3D, with adjustable brush, drawing tools, undo, clear, image save, and 3D export.
- Real-time 3D wireframe hand model with a rotating standby visualization.
- Gesture history, performance stats, and a gesture-action demo panel.
- Animated terminal boot sequence, plus voice feedback with adjustable volume.
- Gesture combo sequences trigger confetti, glitch, Matrix rain, or fireworks.
- Claude-powered natural-language gesture interpretation.
- Installable PWA support.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| ML / Vision | MediaPipe Hands (WASM, on-device) |
| 3D Rendering | Three.js |
| AI | Claude API (`claude-sonnet-4-6`) |
| Styling | CSS Modules and CSS |
| Build | Vite |
| Deploy | Vercel |

## 🚀 Getting Started

```bash
git clone https://github.com/IvanDjumbishliev/Hanndy.git
cd Hanndy/hand-gesture-app
npm ci
npm start
```

Open the local URL printed by Vite and allow camera access. Camera access requires a secure context: `localhost` is supported for development, and Vercel serves the app over HTTPS. The MediaPipe runtime and model are loaded from jsDelivr, so an internet connection is required.

Useful project commands:

```bash
npm test          # run tests
npm run lint      # lint source
npx tsc --noEmit  # type-check
npm run build     # type-check and create production/PWA build
npm run preview   # preview the production build
```

## 🎮 Gesture Combos

| Sequence | Combo | Effect |
|---|---|---|
| Thumbs Up → Peace | 🏆 Victory Salute | Confetti |
| Thumbs Down → Fist | 💥 Danger Mode | Glitch effect |
| Peace → Peace → Peace | 🟢 Matrix Mode | Matrix rain |
| OK → Thumbs Up → Open Hand | 🎆 Fireworks | Six fireworks bursts |

## 📁 Project Structure

```text
hand-gesture-app/
├── public/
│   ├── icons/                         # PWA install icons
│   └── vite.svg                       # Vite starter icon
├── src/
│   ├── api/
│   │   └── interpretGestures.ts       # Claude gesture-sequence interpretation
│   ├── assets/
│   │   └── react.svg                  # React starter asset
│   ├── components/
│   │   ├── AIInterpretation.tsx       # JARVIS-style AI interpretation panel
│   │   ├── AIInterpretation.module.css # AI panel glass styling and loading animation
│   │   ├── BootSequence.tsx           # Animated terminal boot display
│   │   ├── BootSequence.module.css    # CRT boot screen and scanlines
│   │   ├── ControlPanel.tsx           # Main drawing and visualization controls
│   │   ├── DrawingControls.tsx         # Brush, tool, and drawing-mode controls
│   │   ├── GestureDemo.tsx             # Gesture-triggered demo actions
│   │   ├── GestureDemo.module.css      # Demo panel styling
│   │   ├── GestureDisplay.tsx           # Live gestures and confidence cards
│   │   ├── GestureDisplay.module.css   # Gesture card styling
│   │   ├── GestureHistory.tsx           # Recent gesture history strip
│   │   ├── GestureHistory.module.css   # History strip styling
│   │   ├── HandModel3D.tsx              # Live Three.js wireframe hand
│   │   ├── HandModel3D.module.css      # Floating 3D model panel
│   │   ├── LandmarkOverlay.tsx          # Landmark skeleton and particle trails
│   │   ├── PerformanceStats.tsx          # FPS and inference metrics
│   │   ├── PerformanceStats.module.css # Performance panel styling
│   │   ├── RadarSweep.tsx               # Animated wrist radar canvases
│   │   ├── RadarSweep.module.css       # Radar overlay styling
│   │   ├── Scene3D.tsx                  # Interactive 3D drawing scene
│   │   ├── VisualizationControls.tsx   # Skeleton and scene action controls
│   │   └── WebcamFeed.tsx               # Webcam video element
│   ├── effects/
│   │   ├── confetti.ts                 # Confetti combo effect
│   │   ├── fireworks.ts                # Staggered fireworks bursts
│   │   ├── glitch.ts                   # Temporary HUD glitch effect
│   │   └── matrix.ts                   # Animated Matrix rain canvas
│   ├── gestures/
│   │   ├── combos.ts                   # Gesture combo definitions
│   │   ├── emojiMap.ts                 # Gesture emoji lookup
│   │   ├── recognizer.ts               # Landmark-based gesture classifier
│   │   └── recognizer.test.ts          # Gesture recognizer tests
│   ├── hooks/
│   │   ├── useAirDrawing.ts            # 2D and 3D air-drawing behavior
│   │   ├── useGestureCombo.ts          # Gesture-sequence combo matching
│   │   ├── useHandGesture.ts           # Camera, MediaPipe, smoothing, debounce
│   │   ├── useHandGesture.test.ts      # Hand-tracking hook tests
│   │   ├── useParticleTrail.ts         # Ref-based fingertip particle system
│   │   └── useVoiceFeedback.ts         # Browser speech synthesis
│   ├── styles/
│   │   ├── ControlPanel.css            # Control panel and button styling
│   │   └── DrawingSurface.css          # Fullscreen video and canvas layers
│   ├── types/
│   │   ├── gestures.ts                 # Gesture and landmark types
│   │   ├── mediapipe-globals.d.ts      # MediaPipe browser global declarations
│   │   └── tracking.ts                 # Hand tracking and rendering types
│   ├── utils/
│   │   ├── drawingUtils.ts             # Canvas drawing helpers
│   │   └── gestureUtils.ts             # Drawing gesture and shape helpers
│   ├── App.css                         # HUD, toast, and loading styles
│   ├── App.tsx                         # App composition and feature wiring
│   ├── index.css                       # Theme tokens and global viewport reset
│   └── main.tsx                        # React entry point
├── index.html                          # App HTML shell
├── package.json                        # Dependencies and commands
├── tsconfig.json                       # TypeScript configuration
├── vercel.json                         # Vercel build configuration
└── vite.config.ts                      # Vite and PWA configuration
```

## 🔭 How It Works

The browser requests camera permission using `getUserMedia`, then sends video frames to MediaPipe Hands. Hand landmark inference runs on-device in the browser; camera video is not uploaded by Hanndy. An internet connection is used to retrieve the MediaPipe runtime and model assets.

`useHandGesture` smooths the 21 landmarks for each hand, classifies candidate poses, and confirms gestures only after repeated matching frames. The confirmed hand data drives the gesture cards, history, voice feedback, combo matching, AI interpretation, fingertip trails, radar, and 3D wireframe.

The HUD layers the mirrored video with canvas visualizations and floating controls. Pinching draws on the canvas or into the 3D scene, while other gestures can control demo actions or trigger a combo effect. The app builds as a Vite PWA and can be deployed to Vercel, whose HTTPS origin supports camera access.

## 📄 License

MIT
