# Image asset folder

Drop client-supplied images here. The components reference these expected paths:

```
public/images/
├── hero/
│   └── hero-video.mp4         # 16:9 hero video
│   └── hero-poster.jpg        # video poster image
├── team/
│   ├── dr-aditya.jpg          # 4:3 portrait of Dr. Aditya
│   └── akhila.jpg             # 4:3 portrait of Akhila
└── results/
    ├── result-1.jpg           # 4:3 — The Shift-Worker Case
    ├── result-2.jpg           # 4:3 — The Lean PCOS Case
    ├── result-3.jpg           # 4:3 — The Metabolic Plateau Case
    └── result-4.jpg           # 4:3 — The Fertility Concern Case
```

## How to swap a placeholder with a real image

1. Drop the file into the matching subfolder.
2. Open the component that uses it (e.g. `src/components/landing/Team.tsx`).
3. Replace the `<ImagePlaceholder ... />` with:

```tsx
import Image from "next/image";

<Image
  src="/images/team/dr-aditya.jpg"
  alt="Dr. Aditya, family physician"
  width={1200}
  height={900}
  priority   // only for above-the-fold images (hero)
  className="rounded-3xl shadow-premium-lg"
/>
```

For the hero video, replace `<ImagePlaceholder>` with:

```tsx
<video
  src="/images/hero/hero-video.mp4"
  poster="/images/hero/hero-poster.jpg"
  controls
  playsInline
  preload="metadata"
  className="aspect-video w-full rounded-3xl shadow-premium-xl"
/>
```
