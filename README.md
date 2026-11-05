# 🖐 Hanndy — Browser Hand Gesture Controller

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0097A7?logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Hanndy turns webcam hand gestures into browser controls, air drawing, and playful on-screen actions.

## Features

- ✊ **Fist** — trigger a confetti burst in the demo and undo the current drawing.
- ✋ **OpenHand** — reset the demo likes counter and stop its music.
- 👍 **ThumbsUp** — add a like.
- 👎 **ThumbsDown** — remove a like (the counter never goes below zero).
- ✌️ **Peace** — toggle looping background music.
- ☝️ **Pointing** — move the demo cursor with your index fingertip.
- 👌 **OK** — recognize and display the gesture.
- 🤏 **Pinch** — draw in the air.
- 🤟 **ThreeFingers** — recognize and display the gesture.
- 🤘 **SpiderMan** — recognize and display the gesture.
- Live gesture confidence, two-hand tracking, landmark smoothing, and gesture debouncing.
- Gesture history, runtime performance stats, dark/light themes, and installable PWA support.

## Tech stack

- React 18+ (this repository currently uses React 19)
- TypeScript
- MediaPipe Hands
- CSS Modules
- Vite

## Getting started

```bash
git clone https://github.com/IvanDjumbishliev/Hanndy.git
cd Hanndy/hand-gesture-app
npm install
npm run dev
```

Open the local URL printed by Vite and choose **Start Camera**. Grant camera access when prompted. Camera access requires a secure context: use `localhost` for local development or HTTPS when deployed.
An internet connection is required to load MediaPipe runtime and model assets from jsDelivr.

Other useful commands:

```bash
npm test          # run tests
npm run lint      # lint the project
npx tsc --noEmit  # type-check
npm run build     # create the production/PWA build
npm run preview   # preview the production build
```

## Project structure

```text
hand-gesture-app/
├── public/
│   ├── icons/                    # PWA install icons (192px and 512px)
│   └── vite.svg                  # Vite starter asset
├── src/
│   ├── App.css                   # Global application overlay styles
│   ├── App.tsx                   # App composition, theme, history, and gesture wiring
│   ├── index.css                 # Global reset and theme custom properties
│   ├── main.tsx                  # React application entry point
│   ├── assets/
│   │   └── react.svg             # React starter asset
│   ├── components/
│   │   ├── ControlPanel.tsx      # Drawing and visualization settings
│   │   ├── DrawingControls.tsx   # Brush, tool, and drawing mode controls
│   │   ├── GestureDemo.tsx       # Gesture-triggered demo actions and legend
│   │   ├── GestureDemo.module.css # Gesture demo panel styles
│   │   ├── GestureDisplay.tsx    # Live gesture cards and confidence
│   │   ├── GestureDisplay.module.css # Gesture card styles
│   │   ├── GestureHistory.tsx    # Scrollable recent-gesture strip
│   │   ├── GestureHistory.module.css # Gesture history styles
│   │   ├── LandmarkOverlay.tsx   # Mirrored, glowing two-hand skeleton overlay
│   │   ├── PerformanceStats.tsx  # Collapsible live runtime metrics
│   │   ├── PerformanceStats.module.css # Performance panel styles
│   │   ├── Scene3D.tsx           # Three-dimensional drawing scene
│   │   ├── SplashScreen.tsx      # Start screen shown before camera access
│   │   ├── SplashScreen.module.css # Splash screen styles and animations
│   │   ├── VisualizationControls.tsx # Visualization and export controls
│   │   └── WebcamFeed.tsx        # Camera video element
│   ├── gestures/
│   │   ├── emojiMap.ts           # Gesture-to-emoji mapping
│   │   ├── recognizer.ts         # Rule-based 21-landmark gesture recognizer
│   │   └── recognizer.test.ts    # Gesture recognition tests
│   ├── hooks/
│   │   ├── useAirDrawing.ts      # Gesture-controlled 2D/3D drawing
│   │   ├── useHandGesture.ts     # Camera, MediaPipe inference, smoothing, and debounce
│   │   └── useHandGesture.test.ts # Hook initial-state test
│   ├── styles/
│   │   ├── ControlPanel.css      # Control panel and button styles
│   │   └── DrawingSurface.css    # Video, canvas, and app view layout
│   ├── types/
│   │   ├── gestures.ts           # Gesture and landmark types
│   │   ├── mediapipe-globals.d.ts # MediaPipe browser globals
│   │   └── tracking.ts           # Tracking, rendering, and history types
│   └── utils/
│       ├── drawingUtils.ts       # Canvas drawing and skeleton helpers
│       └── gestureUtils.ts       # Drawn-shape detection helpers
├── index.html                    # HTML shell and PWA manifest link
├── vite.config.ts                # Vite, React, and PWA configuration
└── package.json                  # Dependencies and project scripts
```

## How it works

MediaPipe Hands processes webcam frames in the `useHandGesture` hook, which smooths landmarks, recognizes gestures, and debounces results for each hand. The app passes confirmed gestures and smoothed landmarks to React components for the overlay, display, history, and demo actions. Camera inference runs locally in the browser, and video is not uploaded by Hanndy.

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feat/your-change`.
2. Install dependencies from `hand-gesture-app/` and make a focused change.
3. Run `npm test`, `npm run lint`, and `npx tsc --noEmit` from `hand-gesture-app/`.
4. Commit your changes and push the branch to your fork.
5. Open a pull request against the upstream `main` branch with a clear summary and testing notes.
