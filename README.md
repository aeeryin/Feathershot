# Feathershot

Feathershot is a premium, feature-rich screenshot tool for Windows, macOS, and Linux, inspired by Greenshot and built with Electron.

## Platforms

- Windows: NSIS installer
- macOS: DMG and ZIP builds for x64 and arm64
- Linux: AppImage and Debian package for x64

## Features

- Region and fullscreen capture
- Multi-monitor aware crop overlay
- Pixel magnifier while selecting a region
- Visual editor with shapes, arrows, text, speech bubbles, highlighting, blur, pixelate, crop, and rotate tools
- Direct clipboard, desktop, file, and print actions
- Configurable default action, output folder, file naming pattern, language, and startup behavior
- GitHub Releases integration through `electron-updater`

## Download

Download packaged builds from the [GitHub Releases](https://github.com/aeeryin/Feathershot/releases) page.

Expected release assets:

- `Feathershot-<version>-windows.exe`
- `Feathershot-<version>-macos-x64.dmg`
- `Feathershot-<version>-macos-arm64.dmg`
- `Feathershot-<version>-linux-x64.AppImage`
- `Feathershot-<version>-linux-x64.deb`

## Development

```bash
npm install
npm start
```

## Build Locally

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

macOS builds should be produced on macOS. Linux builds are produced in CI on Ubuntu.

## Publish a GitHub Release

1. Update the version in `package.json`.
2. Commit the change.
3. Create and push a tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

The GitHub Actions workflow builds Windows, macOS, and Linux packages and publishes them to the matching GitHub Release.

## Shortcuts

| Hotkey | Action |
| --- | --- |
| `CommandOrControl+Shift+S` | Trigger region capture |
| `Ctrl+C` / `Command+C` | Copy workspace to clipboard in the editor |
| `Ctrl+S` / `Command+S` | Save workspace to disk in the editor |
| `Ctrl+Z` / `Command+Z` | Undo |
| `Ctrl+Y` / `Command+Shift+Z` | Redo |

## License

MIT
