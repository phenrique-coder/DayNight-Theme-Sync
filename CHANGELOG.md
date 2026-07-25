# Changelog

All notable changes to the **DayNight Theme Sync** project will be documented in this file.

## [1.0.0] - 2026-07-25

### Added
- **System Theme Synchronization**:
  - Automatically switch Cursor, Icon, GNOME Shell, and Legacy (GTK3) themes when toggling Light and Dark modes.
- **Custom Shell Commands**:
  - Execute custom shell commands when switching to Light Mode or Dark Mode.
- **Third-Party App & Terminal Presets**:
  - VS Code: Automatically update theme setting in `settings.json`.
  - Alacritty: Automatically switch color schemes.
  - Kitty: Terminal theme synchronization.
  - Ghostty: Terminal theme synchronization.
- **Wallpapers & Folder Slideshow**:
  - Configure individual wallpapers for Light and Dark modes.
  - Scheduled wallpaper slideshow rotation from selected folders with customizable timers.
- **Night Light Integration**:
  - Automatically sync theme switching with GNOME's Night Light status.
- **Accent Color & Brightness Controls**:
  - Sync system Accent Color per mode.
  - Automatic screen and keyboard brightness adjustment.
- **System Changelog Tab**:
  - Built-in preferences tab to view release notes and updates in system locale.

### Fixed
- **System Dark/Light Mode Button**:
  - Fixed Quick Settings toggle button failure to switch themes caused by signal loop and transition lockup.

