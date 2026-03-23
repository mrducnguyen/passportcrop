# Build Prompts

1. Create a React app to crop a photo to passport quality. Use React, use an SVG library. User uploads a photo, zooming/cropping with an overlay for the face, with dotted lines to mark the chin and the forehead per government guidance — check the Australia passport photo requirements. Allow user to download the cropped photo. May add background removal and auto face detection later using AI.

2. Implement US and AU photo requirements and allow user to pick which one. Operating in PowerShell 7 (pwsh).

3. Use TSX instead of JSX. Always use the latest version of packages. Use pnpm instead of npm, lock down the Node and pnpm versions. Add proper ESLint and Prettier config to the repo.

4. How can we implement auto face detection and crop/zoom the image after upload?

5. Create a production build script to create an offline/production app. Pre-download the models so dev and build both load from a local `/models` folder. Add a switch to either package the models with the app or disable face detection entirely. Face detection should be ON by default and only OFF when manually switched off.

6. Add a loading spinner to show whether face detection is in progress. Make the detect face button stand out more. Show a progress overlay on the whole photo while face detection is running — prevent zooming and dragging while it loads, otherwise it's awkward when it snaps into place.

7. Make AU the default option, not US. Configure Vite to open the browser automatically.

8. How can we implement background removal? Only show the background color option after the background has been removed. After removing the background, the last face detection result should be retained — not reset to the original zoom. Resetting the background should not re-trigger face detection.

9. Add a background color feature: a white-to-#a3a3a3 grayscale slider and a custom color input defaulting to light blue.

10. Run ESLint and fix all issues. Use the default ESLint recommendations for TypeScript.

11. Add light/dark theme support: auto-detect the system preference, add a toggle button. Fix the AU/US spec card text which appeared too dark in dark mode. Fix the face detection and background removal notification overlays not following the theme.

12. Add an eraser tool to clean up residual background pixels after removal. Circle brush with feathered edges, 20px default radius, 10px minimum. Cursor should be visible on any background color using an inverted effect. Add an undo button (Ctrl+Z shortcut) and keyboard shortcuts `[` / `]` to resize the brush. Add tooltips on the eraser controls and the Remove Background button.

13. Fix: erasing becomes very slow after the first undo.

14. Add pinch-to-zoom support for mobile devices. Show a GPU warning near the Remove Background button on machines without GPU acceleration.

15. Replace all "Upload" wording with "choose a file" since nothing is uploaded anywhere. Add a 2-line footer with a concise, slightly funny privacy note: photos stay on the local machine — unplug internet and it still works.

16. Split all CSS out to separate `.styles.ts` files (e.g. `PhotoCropper.styles.ts`) and import them in the component TSX files.
