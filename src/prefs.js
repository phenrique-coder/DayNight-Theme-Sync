import GObject from "gi://GObject";
import Gio from "gi://Gio";
import Adw from "gi://Adw";
import Gtk from "gi://Gtk";
import GLib from "gi://GLib";
import Gdk from "gi://Gdk";

import { collectAllThemes } from "./utils.js";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class DayNightThemeSyncPrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    this._settings = this.getSettings();

    const themesPage = new Adw.PreferencesPage({
      title: _("Themes & Commands"),
      icon_name: "preferences-desktop-theme-symbolic",
    });
    window.add(themesPage);

    const appsPage = new Adw.PreferencesPage({
      title: _("Applications & Terminals"),
      icon_name: "utilities-terminal-symbolic",
    });
    window.add(appsPage);

    const wallpapersPage = new Adw.PreferencesPage({
      title: _("Wallpapers"),
      icon_name: "folder-pictures-symbolic",
    });
    window.add(wallpapersPage);

    const changelogPage = new Adw.PreferencesPage({
      title: _("Changelog"),
      icon_name: "document-open-recent-symbolic",
    });
    window.add(changelogPage);

    collectAllThemes().then((themes) => {
      this._themes = themes;

      themesPage.add(this._lightModeGroup());
      themesPage.add(this._darkModeGroup());
      themesPage.add(this._otherGroup());
      themesPage.add(this._customCommandsGroup());

      this._setupAppsPage(appsPage);
      this._setupWallpapersPage(wallpapersPage, window);
      this._setupChangelogPage(changelogPage);
    });

    window.connect("close-request", () => {
      this._settings = null;
      this._themes = null;
    });
  }

  _lightModeGroup() {
    const group = new Adw.PreferencesGroup({
      title: _("Light Mode"),
      description: _("Configure the theme settings for light mode."),
    });

    const cursorDropDown = buildDropDown({
      title: _("Cursor"),
      items: this._themes.cursor,
      selected: this._settings.get_string("cursor-theme-light"),
      bind: [this._settings, "cursor-theme-light"],
    });

    const iconsDropDown = buildDropDown({
      title: _("Icons"),
      items: this._themes.icons,
      selected: this._settings.get_string("icon-theme-light"),
      bind: [this._settings, "icon-theme-light"],
    });

    const shellDropDown = buildDropDown({
      title: _("Shell"),
      items: this._themes.shell,
      selected: this._settings.get_string("shell-theme-light"),
      bind: [this._settings, "shell-theme-light"],
    });

    const gtk3DropDown = buildDropDown({
      title: _("Legacy Applications"),
      items: this._themes.gtk3,
      selected: this._settings.get_string("gtk3-theme-light"),
      bind: [this._settings, "gtk3-theme-light"],
    });

    group.add(cursorDropDown);
    group.add(iconsDropDown);
    group.add(shellDropDown);
    group.add(gtk3DropDown);
    return group;
  }

  _darkModeGroup() {
    const group = new Adw.PreferencesGroup({
      title: _("Dark Mode"),
      description: _("Configure the theme settings for dark mode."),
    });

    const cursorDropDown = buildDropDown({
      title: _("Cursor"),
      items: this._themes.cursor,
      selected: this._settings.get_string("cursor-theme-dark"),
      bind: [this._settings, "cursor-theme-dark"],
    });

    const iconsDropDown = buildDropDown({
      title: _("Icons"),
      items: this._themes.icons,
      selected: this._settings.get_string("icon-theme-dark"),
      bind: [this._settings, "icon-theme-dark"],
    });

    const shellDropDown = buildDropDown({
      title: _("Shell"),
      items: this._themes.shell,
      selected: this._settings.get_string("shell-theme-dark"),
      bind: [this._settings, "shell-theme-dark"],
    });

    const gtk3DropDown = buildDropDown({
      title: _("Legacy Applications"),
      items: this._themes.gtk3,
      selected: this._settings.get_string("gtk3-theme-dark"),
      bind: [this._settings, "gtk3-theme-dark"],
    });

    group.add(cursorDropDown);
    group.add(iconsDropDown);
    group.add(shellDropDown);
    group.add(gtk3DropDown);
    return group;
  }

  _otherGroup() {
    const group = new Adw.PreferencesGroup({
      title: _("Other Settings"),
      description: _("Additional configuration options"),
    });

    const optimzeTransition = buildExpanderRow({
      title: _("Optimize Dark-Light Transition"),
      subtitle: _("Optimize animation when toggling between light and dark modes"),
      active: this._settings.get_boolean("optimize-darklight-switch-transition"),
      show_switch: true,
      bind: [this._settings, "optimize-darklight-switch-transition"],
    });

    const transitionDuration = buildSpinRow({
      title: _("Transition Duration (ms)"),
      value: this._settings.get_int("darklight-transition-duration"),
      bind: [this._settings, "darklight-transition-duration"],
    });

    const clickDelay = buildSpinRow({
      title: _("Click Delay (ms)"),
      value: this._settings.get_int("darkmode-toggle-clickdelay"),
      bind: [this._settings, "darkmode-toggle-clickdelay"],
    });

    optimzeTransition.add_row(transitionDuration);
    optimzeTransition.add_row(clickDelay);
    group.add(optimzeTransition);

    const nightLightSync = buildSwitchRow({
      title: _("Sync with System Night Light"),
      subtitle: _("Automatically switch theme to dark mode when Night Light is activated (sunset/schedule)"),
      active: this._settings.get_boolean("night-light-sync-enabled"),
      bind: [this._settings, "night-light-sync-enabled"],
    });
    group.add(nightLightSync);

    const showIndicator = buildSwitchRow({
      title: _("Show System Bar Icon"),
      subtitle: _("Show a shortcut icon in the top system panel to easily toggle themes and open settings"),
      active: this._settings.get_boolean("show-indicator"),
      bind: [this._settings, "show-indicator"],
    });
    group.add(showIndicator);

    const toggleShortcut = buildShortcutRow({
      title: _("Keyboard Shortcut"),
      subtitle: _("Customize the keyboard shortcut to quickly toggle the theme"),
      bind: [this._settings, "toggle-theme-shortcut"],
    });
    group.add(toggleShortcut);

    // Accent Color Sync
    const accentColors = [
      { name: _("Blue"), value: "blue" },
      { name: _("Teal"), value: "teal" },
      { name: _("Green"), value: "green" },
      { name: _("Yellow"), value: "yellow" },
      { name: _("Orange"), value: "orange" },
      { name: _("Red"), value: "red" },
      { name: _("Pink"), value: "pink" },
      { name: _("Purple"), value: "purple" },
      { name: _("Slate"), value: "slate" },
    ];

    const accentExpander = buildExpanderRow({
      title: _("Sync GNOME Accent Color (47+)"),
      subtitle: _("Automatically change system accent color when theme toggles"),
      active: this._settings.get_boolean("sync-accent-color"),
      show_switch: true,
      bind: [this._settings, "sync-accent-color"],
    });

    const lightAccentCombo = buildDropDown({
      title: _("Light Mode Accent Color"),
      items: accentColors,
      selected: this._settings.get_string("accent-color-light"),
      bind: [this._settings, "accent-color-light"],
    });

    const darkAccentCombo = buildDropDown({
      title: _("Dark Mode Accent Color"),
      items: accentColors,
      selected: this._settings.get_string("accent-color-dark"),
      bind: [this._settings, "accent-color-dark"],
    });

    accentExpander.add_row(lightAccentCombo);
    accentExpander.add_row(darkAccentCombo);
    group.add(accentExpander);

    // Screen Brightness Sync
    const brightnessExpander = buildExpanderRow({
      title: _("Sync Screen Brightness"),
      subtitle: _("Automatically adjust display brightness percentage on theme switch"),
      active: this._settings.get_boolean("sync-brightness"),
      show_switch: true,
      bind: [this._settings, "sync-brightness"],
    });

    const lightBrightnessRow = buildSpinRow({
      title: _("Light Mode Brightness (%)"),
      value: this._settings.get_int("brightness-light"),
      step: 5,
      lower: 1,
      upper: 100,
      bind: [this._settings, "brightness-light"],
    });

    const darkBrightnessRow = buildSpinRow({
      title: _("Dark Mode Brightness (%)"),
      value: this._settings.get_int("brightness-dark"),
      step: 5,
      lower: 1,
      upper: 100,
      bind: [this._settings, "brightness-dark"],
    });

    brightnessExpander.add_row(lightBrightnessRow);
    brightnessExpander.add_row(darkBrightnessRow);
    group.add(brightnessExpander);

    return group;
  }

  _customCommandsGroup() {
    const group = new Adw.PreferencesGroup({
      title: _("Custom Commands"),
      description: _("Run custom shell commands when the theme switches. Perfect for syncing terminal, VS Code, Discord, or other application themes."),
    });

    const runCommandsSwitch = buildExpanderRow({
      title: _("Enable Custom Commands"),
      subtitle: _("Execute custom shell commands on theme changes"),
      active: this._settings.get_boolean("run-custom-commands"),
      show_switch: true,
      bind: [this._settings, "run-custom-commands"],
    });

    const lightCommandEntry = buildEntryRow({
      title: _("Light Mode Command"),
      bind: [this._settings, "custom-command-light"],
    });

    const darkCommandEntry = buildEntryRow({
      title: _("Dark Mode Command"),
      bind: [this._settings, "custom-command-dark"],
    });

    runCommandsSwitch.add_row(lightCommandEntry);
    runCommandsSwitch.add_row(darkCommandEntry);
    group.add(runCommandsSwitch);
    return group;
  }

  _setupAppsPage(page) {
    const mainGroup = new Adw.PreferencesGroup({
      title: _("Application Theme Sync"),
      description: _("Automatically update themes in popular external applications and terminals when the system theme changes."),
    });

    const enableSwitch = buildSwitchRow({
      title: _("Enable App Theme Presets"),
      subtitle: _("Master toggle to sync third-party application themes"),
      active: this._settings.get_boolean("enable-app-presets"),
      bind: [this._settings, "enable-app-presets"],
    });
    mainGroup.add(enableSwitch);
    page.add(mainGroup);

    // Zed Editor
    const zedGroup = new Adw.PreferencesGroup({
      title: _("Zed Editor"),
      description: _("Sync theme in ~/.config/zed/settings.json"),
    });
    const zedExpander = buildExpanderRow({
      title: _("Sync Zed Editor"),
      subtitle: _("Update Zed theme configuration automatically"),
      active: this._settings.get_boolean("zed-sync-enabled"),
      show_switch: true,
      bind: [this._settings, "zed-sync-enabled"],
    });
    zedExpander.add_row(buildEntryRow({
      title: _("Light Mode Theme"),
      bind: [this._settings, "zed-theme-light"],
    }));
    zedExpander.add_row(buildEntryRow({
      title: _("Dark Mode Theme"),
      bind: [this._settings, "zed-theme-dark"],
    }));
    zedGroup.add(zedExpander);
    page.add(zedGroup);

    // VS Code
    const vscodeGroup = new Adw.PreferencesGroup({
      title: _("Visual Studio Code"),
      description: _("Sync workbench.colorTheme in VS Code settings.json"),
    });
    const vscodeExpander = buildExpanderRow({
      title: _("Sync VS Code"),
      subtitle: _("Update VS Code colorTheme automatically"),
      active: this._settings.get_boolean("vscode-sync-enabled"),
      show_switch: true,
      bind: [this._settings, "vscode-sync-enabled"],
    });
    vscodeExpander.add_row(buildEntryRow({
      title: _("Light Mode Theme"),
      bind: [this._settings, "vscode-theme-light"],
    }));
    vscodeExpander.add_row(buildEntryRow({
      title: _("Dark Mode Theme"),
      bind: [this._settings, "vscode-theme-dark"],
    }));
    vscodeGroup.add(vscodeExpander);
    page.add(vscodeGroup);

    // Alacritty
    const alacrittyGroup = new Adw.PreferencesGroup({
      title: _("Alacritty Terminal"),
      description: _("Sync theme imports in ~/.config/alacritty/alacritty.toml"),
    });
    const alacrittyExpander = buildExpanderRow({
      title: _("Sync Alacritty"),
      subtitle: _("Import theme configuration for Alacritty"),
      active: this._settings.get_boolean("alacritty-sync-enabled"),
      show_switch: true,
      bind: [this._settings, "alacritty-sync-enabled"],
    });
    alacrittyExpander.add_row(buildEntryRow({
      title: _("Light Mode Theme / File Path"),
      bind: [this._settings, "alacritty-theme-light"],
    }));
    alacrittyExpander.add_row(buildEntryRow({
      title: _("Dark Mode Theme / File Path"),
      bind: [this._settings, "alacritty-theme-dark"],
    }));
    alacrittyGroup.add(alacrittyExpander);
    page.add(alacrittyGroup);

    // Kitty
    const kittyGroup = new Adw.PreferencesGroup({
      title: _("Kitty Terminal"),
      description: _("Sync colors in Kitty Terminal via remote control"),
    });
    const kittyExpander = buildExpanderRow({
      title: _("Sync Kitty"),
      subtitle: _("Change Kitty colors dynamically"),
      active: this._settings.get_boolean("kitty-sync-enabled"),
      show_switch: true,
      bind: [this._settings, "kitty-sync-enabled"],
    });
    kittyExpander.add_row(buildEntryRow({
      title: _("Light Mode Theme Name / File"),
      bind: [this._settings, "kitty-theme-light"],
    }));
    kittyExpander.add_row(buildEntryRow({
      title: _("Dark Mode Theme Name / File"),
      bind: [this._settings, "kitty-theme-dark"],
    }));
    kittyGroup.add(kittyExpander);
    page.add(kittyGroup);

    // Ghostty
    const ghosttyGroup = new Adw.PreferencesGroup({
      title: _("Ghostty Terminal"),
      description: _("Sync theme in ~/.config/ghostty/config"),
    });
    const ghosttyExpander = buildExpanderRow({
      title: _("Sync Ghostty"),
      subtitle: _("Update Ghostty theme key automatically"),
      active: this._settings.get_boolean("ghostty-sync-enabled"),
      show_switch: true,
      bind: [this._settings, "ghostty-sync-enabled"],
    });
    ghosttyExpander.add_row(buildEntryRow({
      title: _("Light Mode Theme"),
      bind: [this._settings, "ghostty-theme-light"],
    }));
    ghosttyExpander.add_row(buildEntryRow({
      title: _("Dark Mode Theme"),
      bind: [this._settings, "ghostty-theme-dark"],
    }));
    ghosttyGroup.add(ghosttyExpander);
    page.add(ghosttyGroup);
  }

  _setupWallpapersPage(page, window) {
    const bgSettings = new Gio.Settings({
      schema: "org.gnome.desktop.background",
    });

    // Group 1: Desktop Background
    const desktopGroup = new Adw.PreferencesGroup({
      title: _("Desktop Wallpaper"),
      description: _("Select separate custom wallpapers for light and dark modes."),
    });

    const lightDesktopRow = buildFileChooserRow({
      title: _("Light Mode Wallpaper"),
      bind: [bgSettings, "picture-uri"],
      window: window,
    });

    const darkDesktopRow = buildFileChooserRow({
      title: _("Dark Mode Wallpaper"),
      bind: [bgSettings, "picture-uri-dark"],
      window: window,
    });

    desktopGroup.add(lightDesktopRow);
    desktopGroup.add(darkDesktopRow);
    page.add(desktopGroup);

    // Group 2: Lockscreen Background
    const lockscreenGroup = new Adw.PreferencesGroup({
      title: _("Lockscreen Wallpaper"),
      description: _("Configure lockscreen wallpapers to sync with the theme."),
    });

    const syncLockscreenSwitch = buildExpanderRow({
      title: _("Sync Lockscreen Wallpaper"),
      subtitle: _("Automatically change lockscreen wallpaper on theme switch"),
      active: this._settings.get_boolean("sync-lockscreen-wallpaper"),
      show_switch: true,
      bind: [this._settings, "sync-lockscreen-wallpaper"],
    });

    const useDesktopWallpaperSwitch = buildSwitchRow({
      title: _("Use Desktop Wallpaper"),
      subtitle: _("Use the same wallpaper configured for the desktop on the lockscreen"),
      active: this._settings.get_boolean("lockscreen-use-desktop-wallpaper"),
      bind: [this._settings, "lockscreen-use-desktop-wallpaper"],
    });

    const lightLockscreenRow = buildFileChooserRow({
      title: _("Light Mode Lockscreen"),
      bind: [this._settings, "lockscreen-wallpaper-light"],
      window: window,
    });

    const darkLockscreenRow = buildFileChooserRow({
      title: _("Dark Mode Lockscreen"),
      bind: [this._settings, "lockscreen-wallpaper-dark"],
      window: window,
    });

    const updateSensitivity = () => {
      let useDesktop = this._settings.get_boolean("lockscreen-use-desktop-wallpaper");
      lightLockscreenRow.set_sensitive(!useDesktop);
      darkLockscreenRow.set_sensitive(!useDesktop);
    };
    this._settings.connect("changed::lockscreen-use-desktop-wallpaper", () => updateSensitivity());
    updateSensitivity();

    syncLockscreenSwitch.add_row(useDesktopWallpaperSwitch);
    syncLockscreenSwitch.add_row(lightLockscreenRow);
    syncLockscreenSwitch.add_row(darkLockscreenRow);
    lockscreenGroup.add(syncLockscreenSwitch);
    page.add(lockscreenGroup);

    // Group 3: Wallpaper Slideshow
    const slideshowGroup = new Adw.PreferencesGroup({
      title: _("Dynamic Wallpaper Slideshow"),
      description: _("Cycle wallpapers periodically from selected folders for light and dark modes."),
    });

    const slideshowExpander = buildExpanderRow({
      title: _("Enable Wallpaper Slideshow"),
      subtitle: _("Automatically rotate wallpapers from day/night folders"),
      active: this._settings.get_boolean("wallpaper-slideshow-enabled"),
      show_switch: true,
      bind: [this._settings, "wallpaper-slideshow-enabled"],
    });

    const lightFolderRow = buildFolderChooserRow({
      title: _("Light Mode Wallpaper Folder"),
      bind: [this._settings, "wallpaper-folder-light"],
      window: window,
    });

    const darkFolderRow = buildFolderChooserRow({
      title: _("Dark Mode Wallpaper Folder"),
      bind: [this._settings, "wallpaper-folder-dark"],
      window: window,
    });

    const intervalRow = buildSpinRow({
      title: _("Rotation Interval (seconds)"),
      subtitle: _("Time between wallpaper changes (e.g. 1800s = 30 minutes)"),
      value: this._settings.get_int("wallpaper-slideshow-interval"),
      step: 60,
      lower: 10,
      upper: 86400,
      bind: [this._settings, "wallpaper-slideshow-interval"],
    });

    const randomSwitch = buildSwitchRow({
      title: _("Random Selection"),
      subtitle: _("Randomly pick images instead of sequential order"),
      active: this._settings.get_boolean("wallpaper-slideshow-random"),
      bind: [this._settings, "wallpaper-slideshow-random"],
    });

    slideshowExpander.add_row(lightFolderRow);
    slideshowExpander.add_row(darkFolderRow);
    slideshowExpander.add_row(intervalRow);
    slideshowExpander.add_row(randomSwitch);
    slideshowGroup.add(slideshowExpander);
    page.add(slideshowGroup);
  }

  _setupChangelogPage(page) {
    let content = "";
    try {
      const languages = GLib.get_language_names() || [];
      let targetFileName = "CHANGELOG.md";

      for (const lang of languages) {
        if (!lang || lang === "C" || lang === "POSIX") continue;

        const candidates = [`CHANGELOG_${lang}.md`, `CHANGELOG_${lang.split("_")[0]}.md`].filter(
          (c, idx, arr) => arr.indexOf(c) === idx
        );

        let found = false;
        for (const cand of candidates) {
          const file = this.dir
            ? this.dir.get_child(cand)
            : Gio.File.new_for_path(GLib.build_filenamev([this.path, cand]));

          if (file && file.query_exists(null)) {
            targetFileName = cand;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      let file = null;
      if (this.dir) {
        file = this.dir.get_child(targetFileName);
      } else if (this.path) {
        file = Gio.File.new_for_path(GLib.build_filenamev([this.path, targetFileName]));
      }

      if (file && file.query_exists(null)) {
        const [ok, bytes] = file.load_contents(null);
        if (ok) {
          content = new TextDecoder("utf-8").decode(bytes);
        }
      }
    } catch (e) {
      console.error("Error reading CHANGELOG:", e);
    }

    if (!content) {
      const group = new Adw.PreferencesGroup({
        title: _("Changelog"),
      });
      const row = new Adw.ActionRow({
        title: _("Nenhum histórico de alterações encontrado."),
      });
      group.add(row);
      page.add(group);
      return;
    }

    const lines = content.split(/\r?\n/);
    let currentGroup = null;
    let currentSection = "";
    let currentRow = null;
    let subItems = [];

    const flushRow = () => {
      if (currentRow) {
        if (subItems.length > 0) {
          const subText = subItems.map((s) => `• ${s}`).join("\n");
          currentRow.subtitle = currentRow.subtitle
            ? `${currentRow.subtitle}\n${subText}`
            : subText;
        }
        if (currentGroup) {
          currentGroup.add(currentRow);
        }
        currentRow = null;
        subItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) continue;

      if (trimmed.startsWith("## ")) {
        flushRow();
        const verTitle = trimmed.replace(/^##\s*/, "");
        currentGroup = new Adw.PreferencesGroup({
          title: verTitle,
        });
        page.add(currentGroup);
        currentSection = "";
      } else if (trimmed.startsWith("### ")) {
        flushRow();
        currentSection = trimmed.replace(/^###\s*/, "");
      } else if (trimmed.startsWith("- ")) {
        const isIndented = rawLine.startsWith("  ") || rawLine.startsWith("\t");

        if (isIndented && currentRow) {
          const subContent = trimmed.replace(/^-\s*/, "");
          subItems.push(subContent);
        } else {
          flushRow();
          if (!currentGroup) {
            currentGroup = new Adw.PreferencesGroup({
              title: _("Changelog"),
            });
            page.add(currentGroup);
          }

          const itemText = trimmed.replace(/^-\s*/, "");
          let title = itemText;
          let subtitle = currentSection;

          const match = itemText.match(/^\*\*(.*?)\*\*:\s*(.*)$/);
          if (match) {
            title = match[1];
            subtitle = match[2]
              ? (currentSection ? `${currentSection} - ${match[2]}` : match[2])
              : currentSection;
          }

          currentRow = new Adw.ActionRow({
            title: title,
            subtitle: subtitle || undefined,
            subtitle_lines: 0,
          });
        }
      }
    }
    flushRow();
  }
}

export const DropdownItems = GObject.registerClass(
  {
    Properties: {
      name: GObject.ParamSpec.string("name", "name", "name", GObject.ParamFlags.READWRITE, null),
      value: GObject.ParamSpec.string(
        "value",
        "value",
        "value",
        GObject.ParamFlags.READWRITE,
        null
      ),
    },
  },
  class DropdownItems extends GObject.Object {
    _init(name, value) {
      super._init({ name, value });
    }
  }
);

function buildDropDown(
  opts = {
    title: "Untitled DropDown",
    subtitle: null,
    items: [],
    selected: null,
    bind: null,
  }
) {
  let liststore = new Gio.ListStore({ item_type: DropdownItems });
  for (const item of opts.items) {
    liststore.append(new DropdownItems(item.name, item.value));
  }

  let selected = null;
  for (let i = 0; i < liststore.get_n_items(); i++) {
    if (liststore.get_item(i).value === opts.selected) {
      selected = i;
      break;
    }
  }
  if (selected === null) selected = -1;

  const comboRow = new Adw.ComboRow({
    title: opts.title,
    subtitle: opts.subtitle || null,
    model: liststore,
    expression: new Gtk.PropertyExpression(DropdownItems, null, "name"),
    selected: selected,
  });

  if (opts.bind)
    comboRow.connect("notify::selected", () =>
      opts.bind[0].set_string(opts.bind[1], comboRow.selectedItem.value)
    );

  return comboRow;
}

function buildExpanderRow(
  opts = {
    title: "Untitled ExpanderRow",
    subtitle: null,
    show_switch: false,
    active: false,
    bind: null,
  }
) {
  const expanderRow = new Adw.ExpanderRow({
    title: opts.title,
    subtitle: opts.subtitle || null,
    show_enable_switch: opts.show_switch || false,
    enable_expansion: opts.active,
  });

  if (opts.bind)
    expanderRow.connect("notify::enable-expansion", () =>
      opts.bind[0].set_boolean(opts.bind[1], expanderRow.enable_expansion)
    );

  return expanderRow;
}

function buildSpinRow(
  opts = {
    title: "Untitled SpinRow",
    subtitle: null,
    step: 50,
    lower: 100,
    upper: 20000,
    value: false,
    bind: null,
  }
) {
  const adjustment = new Gtk.Adjustment({
    step_increment: opts.step || 50,
    lower: opts.lower || 100,
    upper: opts.upper || 20000,
    value: opts.value,
  });

  const spinRow = new Adw.SpinRow({
    title: opts.title,
    subtitle: opts.subtitle || null,
    adjustment,
  });

  if (opts.bind)
    opts.bind[0].bind(opts.bind[1], adjustment, "value", Gio.SettingsBindFlags.DEFAULT);

  return spinRow;
}

function buildEntryRow(
  opts = {
    title: "Untitled EntryRow",
    bind: null,
  }
) {
  const entryRow = new Adw.EntryRow({
    title: opts.title,
  });

  if (opts.bind)
    opts.bind[0].bind(opts.bind[1], entryRow, "text", Gio.SettingsBindFlags.DEFAULT);

  return entryRow;
}

function buildFileChooserRow(
  opts = {
    title: "Select File",
    bind: null,
    window: null,
  }
) {
  const row = new Adw.ActionRow({
    title: opts.title,
    subtitle: _("No file selected"),
  });

  const button = new Gtk.Button({
    icon_name: "document-open-symbolic",
    valign: Gtk.Align.CENTER,
  });
  row.add_suffix(button);

  const settings = opts.bind ? opts.bind[0] : null;
  const key = opts.bind ? opts.bind[1] : null;

  const updateSubtitle = () => {
    if (settings && key) {
      let val = settings.get_string(key);
      if (val && val.trim() !== "") {
        try {
          let displayPath = val.startsWith("file://")
            ? decodeURIComponent(val.substring(7))
            : val;
          row.set_subtitle(displayPath);
        } catch (e) {
          row.set_subtitle(val);
        }
      } else {
        row.set_subtitle(_("No file selected"));
      }
    }
  };

  updateSubtitle();

  if (settings && key) {
    settings.connect(`changed::${key}`, () => updateSubtitle());
  }

  button.connect("clicked", () => {
    const fileDialog = new Gtk.FileDialog({
      title: opts.title,
      modal: true,
    });

    const filter = new Gtk.FileFilter();
    filter.set_name(_("Images"));
    filter.add_mime_type("image/*");
    const filters = new Gio.ListStore({ item_type: Gtk.FileFilter });
    filters.append(filter);
    fileDialog.set_filters(filters);

    fileDialog.open(opts.window, null, (dialog, res) => {
      try {
        const file = dialog.open_finish(res);
        const uri = file.get_uri();
        if (settings && key) {
          settings.set_string(key, uri);
        }
      } catch (e) {
        // User cancelled or error
      }
    });
  });

  return row;
}

function buildFolderChooserRow(
  opts = {
    title: "Select Folder",
    bind: null,
    window: null,
  }
) {
  const row = new Adw.ActionRow({
    title: opts.title,
    subtitle: _("No folder selected"),
  });

  const button = new Gtk.Button({
    icon_name: "folder-open-symbolic",
    valign: Gtk.Align.CENTER,
  });
  row.add_suffix(button);

  const settings = opts.bind ? opts.bind[0] : null;
  const key = opts.bind ? opts.bind[1] : null;

  const updateSubtitle = () => {
    if (settings && key) {
      let val = settings.get_string(key);
      if (val && val.trim() !== "") {
        try {
          let displayPath = val.startsWith("file://")
            ? decodeURIComponent(val.substring(7))
            : val;
          row.set_subtitle(displayPath);
        } catch (e) {
          row.set_subtitle(val);
        }
      } else {
        row.set_subtitle(_("No folder selected"));
      }
    }
  };

  updateSubtitle();

  if (settings && key) {
    settings.connect(`changed::${key}`, () => updateSubtitle());
  }

  button.connect("clicked", () => {
    const fileDialog = new Gtk.FileDialog({
      title: opts.title,
      modal: true,
    });

    fileDialog.select_folder(opts.window, null, (dialog, res) => {
      try {
        const file = dialog.select_folder_finish(res);
        const uri = file.get_uri();
        if (settings && key) {
          settings.set_string(key, uri);
        }
      } catch (e) {
        // User cancelled or error
      }
    });
  });

  return row;
}

function buildSwitchRow(
  opts = {
    title: "Untitled SwitchRow",
    subtitle: null,
    active: false,
    bind: null,
  }
) {
  const switchRow = new Adw.SwitchRow({
    title: opts.title,
    subtitle: opts.subtitle || null,
    active: opts.active,
  });

  if (opts.bind)
    opts.bind[0].bind(opts.bind[1], switchRow, "active", Gio.SettingsBindFlags.DEFAULT);

  return switchRow;
}

function buildShortcutRow(
  opts = {
    title: "Keyboard Shortcut",
    subtitle: null,
    bind: null,
  }
) {
  const settings = opts.bind[0];
  const key = opts.bind[1];

  const row = new Adw.ActionRow({
    title: opts.title,
    subtitle: opts.subtitle || null,
  });

  const shortcutLabel = new Adw.ShortcutLabel({
    valign: Gtk.Align.CENTER,
  });

  const button = new Gtk.Button({
    valign: Gtk.Align.CENTER,
  });

  const clearButton = new Gtk.Button({
    icon_name: "edit-clear-symbolic",
    valign: Gtk.Align.CENTER,
    tooltip_text: _("Clear Shortcut"),
  });

  const box = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 6,
    valign: Gtk.Align.CENTER,
  });

  box.append(shortcutLabel);
  box.append(button);
  box.append(clearButton);
  row.add_suffix(box);

  const updateUI = () => {
    const shortcutArray = settings.get_strv(key);
    const shortcutStr = shortcutArray.length > 0 ? shortcutArray[0] : "";
    if (shortcutStr && shortcutStr !== "") {
      shortcutLabel.set_accelerator(shortcutStr);
      button.set_label(_("Edit"));
      clearButton.set_sensitive(true);
    } else {
      shortcutLabel.set_accelerator("");
      button.set_label(_("Set Shortcut"));
      clearButton.set_sensitive(false);
    }
  };

  updateUI();
  settings.connect(`changed::${key}`, () => updateUI());

  clearButton.connect("clicked", () => {
    settings.set_strv(key, []);
  });

  let controller = null;

  button.connect("clicked", () => {
    button.set_label(_("Press keys..."));
    button.set_sensitive(false);
    clearButton.set_sensitive(false);

    controller = Gtk.EventControllerKey.new();
    button.add_controller(controller);

    controller.connect("key-pressed", (ctrl, keyval, keycode, state) => {
      const mask = state & Gtk.accelerator_get_default_mod_mask();

      if (
        keyval === Gdk.KEY_Super_L || keyval === Gdk.KEY_Super_R ||
        keyval === Gdk.KEY_Control_L || keyval === Gdk.KEY_Control_R ||
        keyval === Gdk.KEY_Alt_L || keyval === Gdk.KEY_Alt_R ||
        keyval === Gdk.KEY_Shift_L || keyval === Gdk.KEY_Shift_R
      ) {
        return Gdk.EVENT_PROPAGATE;
      }

      const accelerator = Gtk.accelerator_name(keyval, mask);
      
      if (accelerator) {
        settings.set_strv(key, [accelerator]);
      }

      button.remove_controller(controller);
      controller = null;
      button.set_sensitive(true);
      updateUI();

      return Gdk.EVENT_STOP;
    });
  });

  return row;
}
