<p align="center">
  <img src="main.png" alt="Feathershot Logo" width="120">
</p>

<h1 align="center">Feathershot</h1>

<p align="center">
  <b>Premium, feature-rich screenshot tool for Windows inspired by Greenshot!</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows-blue?style=flat-square&logo=windows" alt="Windows">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/made%20with-Electron-47848F?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/made%20in-Brazil%20🇧🇷-009c3b?style=flat-square" alt="Made in Brazil">
</p>

---

## 📸 About

**Feathershot** is a comprehensive and modern screenshot tool for Windows, inspired by [Greenshot](https://getgreenshot.org/) but built with a premium visual interface, fluid animations, and advanced image editing capabilities.

Created with care, Feathershot aims to be a lightweight, beautiful, and highly functional alternative for anyone who needs professional-grade screenshots and annotations instantly.

## ✨ Features

### 📷 Capture
- **Region Capture** — Select any area of your screen with sub-pixel precision.
- **DPI & Multi-Monitor Support** — Multi-monitor support tracks mouse position to capture the correct display natively.
- **Scroll to Zoom** — Adjust zoom magnification dynamically using the mouse scroll wheel while selecting an area.
- **Magnifier with Pixel Grid** — View individual pixels around the crosshair for pixel-perfect cropping.
- **Dimension Indicators** — Real-time display of crop width × height.

### 🎨 Annotation & Editing
- **Freehand Drawing** — Annotate naturally with customizable brush sizes and colors.
- **Geometric Shapes** — Easily draw perfect rectangles, ellipses, and lines.
- **Arrows** — Point out and emphasize specific elements.
- **Text Tool** — Add customizable text blocks with adjustable styling.
- **Speech Bubble** — Greenshot-style text bubble with drag-to-aim pointer.
- **Blur/Obfuscate** — Protect sensitive user data by blurring regions.
- **Highlighter** — Highlight text or key sections with semi-transparent markers.
- **Crop & Resize** — Crop down selections or resize the entire canvas dynamically.
- **Resize Handles** — Paint-style canvas borders to adjust your workspace.
- **Drag and Drop** — Drag images from your computer directly into the editor.

### ⚡ Quick Actions
- **Copy directly to clipboard**
- **Open inside the visual editor**
- **Save directly to folders**
- **Direct printing**

### ⚙️ Configurations
- **Global Hotkey** — Customize the shortcut to capture screens (default: `PrtSc` or `Ctrl+Shift+S`).
- **Startup Integration** — Run automatically on system startup to reside silently in the system tray.
- **Output Formats** — Select between lossless PNG or compressed JPEG.
- **Custom Naming Patterns** — Save files using timestamp templates.

## 🚀 Getting Started

### Quick Download
Get the latest build directly from the [**Releases**](../../releases) page:
1. Open the repository's **Releases** tab.
2. Download the installer/installer bundle.
3. Run and launch! 

### For Developers
To run the app from source code:

```bash
# Clone the repository
git clone https://github.com/aeeryin/Feathershot.git
cd feathershot

# Install dependencies
npm install

# Run the app
npm start
```

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Electron** | Cross-platform desktop environment |
| **HTML/CSS/JS** | User interface, styling, and editor logic |
| **Canvas API** | Annotation engine and rendering |
| **Electron Builder** | Packaging and auto-updater distribution |

## 📋 Shortcuts

| Hotkey | Action |
|---|---|
| `Ctrl+Shift+S` | Trigger screen capture (default) |
| `Ctrl+S` | Save current workspace to disk (in editor) |
| `Ctrl+C` | Copy workspace to clipboard (in editor) |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Feathershot</b> — Light as a feather, powerful as a professional studio. 🪶
</p>
