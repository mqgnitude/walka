# Walka: Mathematical Constant Random Walk

Walka is a modern, static web tool that visualizes mathematical constants (like Pi, e, and Phi) as a 2D "random" walk. Each digit determines the direction of the next step, creating unique, mesmerizing patterns.

## Features

* **Visualizations:** Includes π, e, and φ (Golden Ratio).
* **Modes:** * **Fade:** Creates a motion-blur ghostly effect.
    * **Persistent:** Draws an infinite path.
* **Customization:** Upload your own digit files or use the "I'm Feeling Lucky" generator.
* **Styling:** Angle-based gradients, rainbow modes, and single-color themes.
* **Performance:** Built with p5.js using off-screen buffering for smooth performance even with long trails.

## Quick Start

1.  Clone this repository.
2.  Open `index.html` in a modern web browser.
3.  Click "Play" or use the Spacebar.

## Testing Instructions

1.  **Angle Verification:** * Select **Angle Gradient** in the color dropdown.
    * Set **Speed** to the lowest setting.
    * Watch the line color. Red/Orange corresponds to low digits (0, 1), while purple/pink corresponds to high digits (8, 9).
    * Verify that digit '0' moves horizontally right (0°) and digit '5' moves left (180°).
2.  **Performance:**
    * Increase **Max Steps** to 50,000.
    * Set **Speed** to max.
    * Switch between Fade and Persistent modes to ensure no lag.
3.  **Lucky Button:**
    * Click the "Lucky" die button.
    * Confirm the path resets and draws a new shape based on the square root of a random number.

## Deployment to GitHub Pages

1.  Push this code to a GitHub repository.
2.  Go to **Settings > Pages**.
3.  Under **Build and deployment > Branch**, select `main` (or `master`) and `/root`.
4.  Click **Save**. GitHub will provide your live URL shortly.

## Known Limitations

* **Precision:** The "I'm Feeling Lucky" feature uses JavaScript's `Math.sqrt()`, which is limited to double-precision floating-point numbers (~15-17 decimal places). The walk will repeat or end quickly compared to the static files.
* **Memory:** "Persistent" mode draws to an image buffer. On extremely high-resolution 4K/8K screens, this may consume significant RAM.
* **Data Files:** The included text files in `/data` are truncated samples (approx 800 digits). For longer visualization loops, please replace them with larger files from [OEIS](https://oeis.org/) or similar math repositories.

## License

MIT License. See LICENSE file.