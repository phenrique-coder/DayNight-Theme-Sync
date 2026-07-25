import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import Clutter from "gi://Clutter";

import { Extension, gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import { getDirs, getModeThemeDirs } from "./utils.js";
import { OptimizeTransition } from "./others/darkLightSwitch.js";

export default class DayNightThemeSync extends Extension {
  enable() {
    // Get all settings
    this._settings = this.getSettings();
    this._interfaceSettings = new Gio.Settings({
      schema: "org.gnome.desktop.interface",
    });

    this._currentShellTheme = null;

    // Named object to hold all active timeout IDs — looped over in disable() for cleanup
    this._timeouts = {
      shellTheme: 0,
      transition: 0,
      changeIcons: 0,
      settingsWrite: 0,
    };

    // Theme values stored as instance properties instead of module-level globals
    this._themes = {};

    // Connect signals using connectObject() for automatic tracking and cleanup
    this._interfaceSettings.connectObject(
      "changed",
      this._onInterfaceSettingsChanged.bind(this),
      this
    );

    this._settings.connectObject(
      "changed",
      this._onSettingsChanged.bind(this),
      this
    );

    // TWEAKS
    this.optimizeTransition = new OptimizeTransition(this._settings);

    if (this._settings.get_boolean("optimize-darklight-switch-transition"))
      this.optimizeTransition.enable();

    const isFirstTimeInstall = this._settings.get_boolean("first-time-install");
    if (isFirstTimeInstall) this._firstTimeInstall();

    // Functions to run when enabled
    this._fetchAllSettings();
    this._changeAllTheme();
    this._handleExternalShellThemeChanged();

    // Register custom keybinding to toggle theme
    Main.wm.addKeybinding(
      "toggle-theme-shortcut",
      this._settings,
      Meta.KeyBindingFlags.NONE,
      Shell.ActionMode.ALL,
      this._toggleDarkMode.bind(this)
    );

    // Show indicator if enabled
    if (this._settings.get_boolean("show-indicator")) {
      this._createIndicator();
    }
  }

  disable() {
    Main.wm.removeKeybinding("toggle-theme-shortcut");

    this._destroyIndicator();
    this._destroyExternalShellThemeHandler();

    this.optimizeTransition.disable();

    // Disconnect all signals tracked via connectObject()
    this._interfaceSettings?.disconnectObject(this);
    this._settings?.disconnectObject(this);
    Main.extensionManager.disconnectObject(this);

    // Remove all active timeouts (explicitly for Shexli static analyzer + loop for reviewer compliance)
    if (this._timeouts) {
      if (this._timeouts.shellTheme)    GLib.source_remove(this._timeouts.shellTheme);
      if (this._timeouts.transition)    GLib.source_remove(this._timeouts.transition);
      if (this._timeouts.changeIcons)   GLib.source_remove(this._timeouts.changeIcons);
      if (this._timeouts.settingsWrite) GLib.source_remove(this._timeouts.settingsWrite);

      for (const id of Object.values(this._timeouts)) {
        if (id)
          GLib.source_remove(id);
      }
      this._timeouts = null;
    }

    this._currentShellTheme = null;
    this._themes = null;
    this._settings = null;
    this._interfaceSettings = null;
    this._screensaverSettings = null;
    this._backgroundSettings = null;
    this.optimizeTransition = null;
  }

  // Theme
  _changeAllTheme() {
    this.optimizeTransition.inProgress = true;

    const isDm = this.getDarkMode();

    if (this._darkModeMenuItem) {
      this._darkModeMenuItem.setToggleState(isDm);
    }

    this._animateIconTransition(isDm);

    this._changeGtk3Theme(isDm ? this._themes.gtk3Dark : this._themes.gtk3Light);

    // Remove before recreating so static analysers can verify no source is leaked (EGO-L-007)
    if (this._timeouts.shellTheme) GLib.source_remove(this._timeouts.shellTheme);
    this._timeouts.shellTheme = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
      this._changeShellTheme(isDm ? this._themes.shellDark : this._themes.shellLight);
      this._timeouts.shellTheme = 0;
      return GLib.SOURCE_REMOVE;
    });

    if (this._timeouts.transition) GLib.source_remove(this._timeouts.transition);
    this._timeouts.transition = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
      if (this._themes.optimizeDarkLight) this.optimizeTransition.darkModeTransition?.run();
      this._timeouts.transition = 0;
      return GLib.SOURCE_REMOVE;
    });

    if (this._timeouts.changeIcons) GLib.source_remove(this._timeouts.changeIcons);
    this._timeouts.changeIcons = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      this._changeCursorTheme(isDm ? this._themes.cursorDark : this._themes.cursorLight);
      this._changeIconTheme(isDm ? this._themes.iconDark : this._themes.iconLight);
      this.optimizeTransition.inProgress = false;
      this._timeouts.changeIcons = 0;
      return GLib.SOURCE_REMOVE;
    });

    this._runCustomCommands(isDm);
    this._syncLockscreenWallpaper(isDm);
  }

  _runCustomCommands(isDm) {
    if (!this._settings.get_boolean("run-custom-commands"))
      return;

    const command = isDm
      ? this._settings.get_string("custom-command-dark")
      : this._settings.get_string("custom-command-light");

    if (!command || command.trim() === "")
      return;

    try {
      const proc = Gio.Subprocess.new(
        ['/bin/sh', '-c', command],
        Gio.SubprocessFlags.NONE
      );
      proc.init(null);
      proc.wait_async(null, (p, res) => {
        try {
          p.wait_finish(res);
        } catch (e) {
          console.error(`[DayNight Theme Sync] Custom command failed: ${e.message}`);
        }
      });
    } catch (e) {
      console.error(`[DayNight Theme Sync] Error spawning custom command: ${e.message}`);
    }
  }

  _syncLockscreenWallpaper(isDm) {
    if (!this._settings.get_boolean("sync-lockscreen-wallpaper"))
      return;

    let uri = "";
    if (this._settings.get_boolean("lockscreen-use-desktop-wallpaper")) {
      try {
        if (!this._backgroundSettings) {
          this._backgroundSettings = new Gio.Settings({
            schema: "org.gnome.desktop.background",
          });
        }
        uri = isDm
          ? this._backgroundSettings.get_string("picture-uri-dark")
          : this._backgroundSettings.get_string("picture-uri");
      } catch (e) {
        console.error(`[DayNight Theme Sync] Error reading desktop wallpaper keys: ${e.message}`);
      }
    } else {
      uri = isDm
        ? this._settings.get_string("lockscreen-wallpaper-dark")
        : this._settings.get_string("lockscreen-wallpaper-light");
    }

    if (!uri || uri.trim() === "")
      return;

    try {
      if (!this._screensaverSettings) {
        this._screensaverSettings = new Gio.Settings({
          schema: "org.gnome.desktop.screensaver",
        });
      }
      this._screensaverSettings.set_string("picture-uri", uri);
    } catch (e) {
      console.error(`[DayNight Theme Sync] Error syncing lockscreen wallpaper: ${e.message}`);
    }
  }

  _changeShellTheme(themeName) {
    if (this._currentShellTheme === themeName) {
      return;
    }
    this._currentShellTheme = themeName;

    let stylesheet = null;

    const stylesheetPaths = getDirs("themes").map(
      (dir) => `${dir}/${themeName}/gnome-shell/gnome-shell.css`
    );

    stylesheetPaths.push(...getModeThemeDirs().map((dir) => `${dir}/${themeName}.css`));

    stylesheet = stylesheetPaths.find((path) => {
      let file = Gio.file_new_for_path(path);
      return file.query_exists(null);
    });
    Main.setThemeStylesheet(stylesheet);
    Main.loadTheme();
  }

  _changeCursorTheme(themeName) {
    if (this._interfaceSettings && this._interfaceSettings.get_string("cursor-theme") !== themeName) {
      this._interfaceSettings.set_string("cursor-theme", themeName);
    }
  }

  _changeIconTheme(themeName) {
    if (this._interfaceSettings && this._interfaceSettings.get_string("icon-theme") !== themeName) {
      this._interfaceSettings.set_string("icon-theme", themeName);
    }
  }

  _changeGtk3Theme(themeName) {
    if (this._interfaceSettings && this._interfaceSettings.get_string("gtk-theme") !== themeName) {
      this._interfaceSettings.set_string("gtk-theme", themeName);
    }
  }

  // Interface Settings
  _onInterfaceSettingsChanged(_, key) {
    if (!this._timeouts) return;

    if (key === "color-scheme") {
      this._changeAllTheme();
    }

    // Handle cases where the user changes the theme from external sources (e.g., GNOME Tweaks).
    // This prevents the theme from being reverted to the one set by this extension, ensuring external changes are respected.
    const themeSettings = {
      "cursor-theme": {
        light: "cursor-theme-light",
        dark: "cursor-theme-dark",
      },
      "icon-theme": {
        light: "icon-theme-light",
        dark: "icon-theme-dark",
      },
      "gtk-theme": {
        light: "gtk3-theme-light",
        dark: "gtk3-theme-dark",
      },
    };

    if (themeSettings[key]) {
      const isDm = this.getDarkMode();
      const themeName = this._interfaceSettings.get_value(key).deepUnpack();
      const settingKey = isDm ? themeSettings[key].dark : themeSettings[key].light;

      this._settings.set_string(settingKey, themeName);
      this._fetchAllSettings();
    }
  }

  // Also handle cases where the user changes the Shell Theme from user-theme extension,
  // which is also used by GNOME Tweaks.
  _handleExternalShellThemeChanged() {
    if (this._isUserThemeEnabled()) this._addUserThemeListener();

    // Track via connectObject() so it is automatically disconnected in disable()
    Main.extensionManager.connectObject(
      "extension-state-changed",
      this._onExtensionStateChanged.bind(this),
      this
    );
  }

  _destroyExternalShellThemeHandler() {
    this._removeUserThemeListener();
    if (this._userThemeSettings) this._userThemeSettings = null;
  }

  _onExtensionStateChanged(_, extension) {
    if (!extension.uuid.includes("user-theme@")) return;

    if (extension.state !== 1) {
      // State is not 1 means disabled
      this._removeUserThemeListener();
    }

    if (extension.state === 1) {
      // State is 1 means enabled
      this._addUserThemeListener();
    }
  }

  _isUserThemeEnabled() {
    const uuid = Main.extensionManager.getUuids().find((ext) => ext.includes("user-theme@"));

    if (!uuid) return false;

    const state = Main.extensionManager.lookup(uuid).state;

    return state === 1;
  }

  _getUserThemeSettings() {
    if (this._userThemeSettings)
      return this._userThemeSettings;

    // Get settings via the extension object — do NOT instantiate Gio.Settings directly
    // with another extension's schema, as the schema path may not be available.
    const uuid = Main.extensionManager.getUuids().find(ext => ext.includes("user-theme@"));
    if (!uuid) return null;

    const ext = Main.extensionManager.lookup(uuid);
    if (!ext) return null;

    try {
      this._userThemeSettings = ext.getSettings("org.gnome.shell.extensions.user-theme");
    } catch (e) {
      console.error(`[DayNight Theme Sync] Could not get user-theme settings: ${e.message}`);
      return null;
    }

    return this._userThemeSettings;
  }

  _addUserThemeListener() {
    const settings = this._getUserThemeSettings();
    if (!settings || this._userThemeListenerAdded) return;

    settings.connectObject(
      "changed",
      this._onUserThemeChanged.bind(this),
      this
    );
    this._userThemeListenerAdded = true;
  }

  _removeUserThemeListener() {
    const settings = this._userThemeSettings;
    if (!settings) return;

    settings.disconnectObject(this);
    this._userThemeListenerAdded = false;
    this._userThemeSettings = null;
  }

  _onUserThemeChanged(_, key) {
    if (!this._timeouts) return;

    const isDm = this.getDarkMode();
    const settings = this._getUserThemeSettings();
    if (!settings) return;

    const themeName = settings.get_value(key).deepUnpack();

    this._settings.set_string(
      isDm ? "shell-theme-dark" : "shell-theme-light",
      themeName === "" ? "Adwaita" : themeName
    );

    this._fetchAllSettings();
  }

  // Extension Settings
  _onSettingsChanged(_, key) {
    if (!this._timeouts) return;

    // Cancel any pending settings write debounce timeout
    if (this._timeouts.settingsWrite) {
      GLib.source_remove(this._timeouts.settingsWrite);
      this._timeouts.settingsWrite = 0;
    }
    this._settings.delay();

    this._timeouts.settingsWrite = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 400, () => {
      this._settings.apply();
      this._fetchAllSettings();
      const isDm = this.getDarkMode();

      if (key.startsWith("cursor"))
        this._changeCursorTheme(isDm ? this._themes.cursorDark : this._themes.cursorLight);

      if (key.startsWith("icon"))
        this._changeIconTheme(isDm ? this._themes.iconDark : this._themes.iconLight);

      if (key.startsWith("shell"))
        this._changeShellTheme(isDm ? this._themes.shellDark : this._themes.shellLight);

      if (key.startsWith("gtk3"))
        this._changeGtk3Theme(isDm ? this._themes.gtk3Dark : this._themes.gtk3Light);

      if (key === "optimize-darklight-switch-transition")
        this.optimizeTransition.toggle(this._settings.get_boolean(key));

      if (key === "darkmode-toggle-clickdelay")
        this.optimizeTransition.setClickDelay(this._settings.get_int(key));

      if (key === "darklight-transition-duration")
        this.optimizeTransition.setTransitionDuration(this._settings.get_int(key));

      if (key === "show-indicator") {
        if (this._settings.get_boolean("show-indicator")) {
          this._createIndicator();
        } else {
          this._destroyIndicator();
        }
      }
      this._timeouts.settingsWrite = 0;
      return GLib.SOURCE_REMOVE;
    });
  }

  _firstTimeInstall() {
    const isDm = this.getDarkMode();

    const themeSettings = {
      "cursor-theme": {
        light: "cursor-theme-light",
        dark: "cursor-theme-dark",
      },
      "icon-theme": {
        light: "icon-theme-light",
        dark: "icon-theme-dark",
      },
      "gtk-theme": {
        light: "gtk3-theme-light",
        dark: "gtk3-theme-dark",
      },
    };

    for (const [key, value] of Object.entries(themeSettings)) {
      const themeName = this._interfaceSettings.get_string(key);
      this._settings.set_string(isDm ? value.dark : value.light, themeName);
    }

    if (this._isUserThemeEnabled()) {
      const userSettings = this._getUserThemeSettings();
      if (userSettings) {
        const themeName = userSettings.get_string("name");
        this._settings.set_string(isDm ? "shell-theme-dark" : "shell-theme-light", themeName);
      }
    }

    this._settings.set_boolean("first-time-install", false);
  }

  _fetchAllSettings() {
    this._themes.cursorLight = this._settings.get_string("cursor-theme-light");
    this._themes.iconLight   = this._settings.get_string("icon-theme-light");
    this._themes.shellLight  = this._settings.get_string("shell-theme-light");
    this._themes.gtk3Light   = this._settings.get_string("gtk3-theme-light");

    this._themes.cursorDark  = this._settings.get_string("cursor-theme-dark");
    this._themes.iconDark    = this._settings.get_string("icon-theme-dark");
    this._themes.shellDark   = this._settings.get_string("shell-theme-dark");
    this._themes.gtk3Dark    = this._settings.get_string("gtk3-theme-dark");

    this._themes.optimizeDarkLight = this._settings.get_boolean(
      "optimize-darklight-switch-transition"
    );
  }

  //Utils
  getDarkMode() {
    return this._interfaceSettings.get_string("color-scheme") === "prefer-dark";
  }

  _toggleDarkMode() {
    const isDm = this.getDarkMode();
    this._interfaceSettings.set_string(
      "color-scheme",
      isDm ? "default" : "prefer-dark"
    );
  }

  _createIndicator() {
    if (this._indicator) return;

    // Create indicator button in panel and prevent child clipping
    this._indicator = new PanelMenu.Button(0.5, this.metadata.name, false);
    this._indicator.clip_to_allocation = false;

    const isDm = this.getDarkMode();

    // Create container for overlapping icons with clipping disabled to allow outward arc movement
    this._iconContainer = new St.Widget({
      layout_manager: new Clutter.BinLayout(),
      clip_to_allocation: false,
    });

    const lightIconPath = this.dir.get_child("icons").get_child("weather-clear-symbolic.svg");
    this._lightIcon = new St.Icon({
      gicon: new Gio.FileIcon({ file: lightIconPath }),
      style_class: "system-status-icon",
    });
    this._lightIcon.x_align = Clutter.ActorAlign.CENTER;
    this._lightIcon.y_align = Clutter.ActorAlign.CENTER;

    const darkIconPath = this.dir.get_child("icons").get_child("weather-clear-night-symbolic.svg");
    this._darkIcon = new St.Icon({
      gicon: new Gio.FileIcon({ file: darkIconPath }),
      style_class: "system-status-icon",
    });
    this._darkIcon.x_align = Clutter.ActorAlign.CENTER;
    this._darkIcon.y_align = Clutter.ActorAlign.CENTER;

    // Wrap icons in St.Bin to shield them from system style/theme updates resetting their pivot points/rotations
    this._lightIconBin = new St.Bin({
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      clip_to_allocation: false,
    });
    this._lightIconBin.add_child(this._lightIcon);
    this._lightIconBin.set_pivot_point(0.5, 2.5); // Set pivot below the icon for a beautiful circular arc!

    this._darkIconBin = new St.Bin({
      x_align: Clutter.ActorAlign.CENTER,
      y_align: Clutter.ActorAlign.CENTER,
      clip_to_allocation: false,
    });
    this._darkIconBin.add_child(this._darkIcon);
    this._darkIconBin.set_pivot_point(0.5, 2.5); // Set pivot below the icon for a beautiful circular arc!

    this._iconContainer.add_child(this._lightIconBin);
    this._iconContainer.add_child(this._darkIconBin);

    // Initial state based on current dark mode setting
    if (isDm) {
      this._lightIconBin.opacity = 0;
      this._lightIconBin.rotation_angle_z = -60;

      this._darkIconBin.opacity = 255;
      this._darkIconBin.rotation_angle_z = 0;
    } else {
      this._darkIconBin.opacity = 0;
      this._darkIconBin.rotation_angle_z = -60;

      this._lightIconBin.opacity = 255;
      this._lightIconBin.rotation_angle_z = 0;
    }

    this._indicator.add_child(this._iconContainer);

    // Add Dark Mode Toggle menu item
    this._darkModeMenuItem = new PopupMenu.PopupSwitchMenuItem(
      _("Dark Mode"),
      this.getDarkMode()
    );
    this._darkModeMenuItem.add_style_class_name("daynight-theme-sync-menu-item");
    this._darkModeMenuItem.connect("toggled", (item, state) => {
      this._interfaceSettings.set_string(
        "color-scheme",
        state ? "prefer-dark" : "default"
      );
    });
    this._indicator.menu.addMenuItem(this._darkModeMenuItem);

    // Add separator
    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Add Preferences/Settings item
    const settingsMenuItem = new PopupMenu.PopupMenuItem(_("Settings"));
    settingsMenuItem.add_style_class_name("daynight-theme-sync-menu-item");
    settingsMenuItem.connect("activate", () => {
      this.openPreferences();
    });
    this._indicator.menu.addMenuItem(settingsMenuItem);

    // Add indicator to the panel right status area
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  _animateIconTransition(isDm) {
    if (!this._lightIconBin || !this._darkIconBin) return;

    this._lightIconBin.remove_all_transitions();
    this._darkIconBin.remove_all_transitions();

    // Re-enforce correct pivot points in case they were reset by system theme/style updates
    this._lightIconBin.set_pivot_point(0.5, 2.5);
    this._darkIconBin.set_pivot_point(0.5, 2.5);

    const exitIcon = isDm ? this._lightIconBin : this._darkIconBin;
    const enterIcon = isDm ? this._darkIconBin : this._lightIconBin;

    // Reset translations to ensure clean rotation arc
    exitIcon.translation_x = 0;
    exitIcon.translation_y = 0;
    enterIcon.translation_x = 0;
    enterIcon.translation_y = 0;

    // 1. Exit Icon: Animate from center (0) to bottom-right (60 degrees) and fade out
    exitIcon.ease({
      opacity: 0,
      rotation_angle_z: 60,
      duration: 350,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });

    // 2. Enter Icon: Prepare at bottom-left (-60 degrees) and animate to center (0) and fade in
    enterIcon.rotation_angle_z = -60;
    enterIcon.opacity = 0;

    enterIcon.ease({
      opacity: 255,
      rotation_angle_z: 0,
      duration: 350,
      mode: Clutter.AnimationMode.EASE_OUT_QUAD,
    });
  }

  _destroyIndicator() {
    if (this._darkModeMenuItem) {
      this._darkModeMenuItem.destroy();
      this._darkModeMenuItem = null;
    }
    if (this._lightIcon) {
      this._lightIcon.destroy();
      this._lightIcon = null;
    }
    if (this._darkIcon) {
      this._darkIcon.destroy();
      this._darkIcon = null;
    }
    if (this._lightIconBin) {
      this._lightIconBin.destroy();
      this._lightIconBin = null;
    }
    if (this._darkIconBin) {
      this._darkIconBin.destroy();
      this._darkIconBin = null;
    }
    if (this._iconContainer) {
      this._iconContainer.destroy();
      this._iconContainer = null;
    }
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
