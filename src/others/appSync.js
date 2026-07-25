import GLib from "gi://GLib";
import Gio from "gi://Gio";

export class AppSync {
  constructor(settings) {
    this._settings = settings;
  }

  syncThemes(isDm) {
    if (!this._settings || !this._settings.get_boolean("enable-app-presets")) {
      return;
    }

    if (this._settings.get_boolean("zed-sync-enabled")) {
      const zedTheme = isDm
        ? this._settings.get_string("zed-theme-dark")
        : this._settings.get_string("zed-theme-light");
      this._updateZedTheme(zedTheme);
    }

    if (this._settings.get_boolean("vscode-sync-enabled")) {
      const vscodeTheme = isDm
        ? this._settings.get_string("vscode-theme-dark")
        : this._settings.get_string("vscode-theme-light");
      this._updateVSCodeTheme(vscodeTheme);
    }

    if (this._settings.get_boolean("alacritty-sync-enabled")) {
      const alacrittyTheme = isDm
        ? this._settings.get_string("alacritty-theme-dark")
        : this._settings.get_string("alacritty-theme-light");
      this._updateAlacrittyTheme(alacrittyTheme);
    }

    if (this._settings.get_boolean("kitty-sync-enabled")) {
      const kittyTheme = isDm
        ? this._settings.get_string("kitty-theme-dark")
        : this._settings.get_string("kitty-theme-light");
      this._updateKittyTheme(kittyTheme);
    }

    if (this._settings.get_boolean("ghostty-sync-enabled")) {
      const ghosttyTheme = isDm
        ? this._settings.get_string("ghostty-theme-dark")
        : this._settings.get_string("ghostty-theme-light");
      this._updateGhosttyTheme(ghosttyTheme);
    }
  }

  // --- ZED EDITOR ---
  _updateZedTheme(themeName) {
    if (!themeName || themeName.trim() === "") return;

    const zedPath = `${GLib.get_user_config_dir()}/zed/settings.json`;
    this._updateJsonFile(zedPath, (jsonObj) => {
      if (typeof jsonObj.theme === "object" && jsonObj.theme !== null) {
        jsonObj.theme.mode = "system";
      } else {
        jsonObj["theme"] = themeName;
      }
      return jsonObj;
    });
  }

  // --- VS CODE ---
  _updateVSCodeTheme(themeName) {
    if (!themeName || themeName.trim() === "") return;

    const paths = [
      `${GLib.get_user_config_dir()}/Code/User/settings.json`,
      `${GLib.get_user_config_dir()}/Code - Insiders/User/settings.json`,
      `${GLib.get_home_dir()}/.var/app/com.visualstudio.code/config/Code/User/settings.json`,
    ];

    paths.forEach((p) => {
      this._updateJsonFile(p, (jsonObj) => {
        jsonObj["workbench.colorTheme"] = themeName;
        return jsonObj;
      });
    });
  }

  // --- ALACRITTY ---
  _updateAlacrittyTheme(themeName) {
    if (!themeName || themeName.trim() === "") return;

    const configPath = `${GLib.get_user_config_dir()}/alacritty/alacritty.toml`;
    const file = Gio.File.new_for_path(configPath);
    if (!file.query_exists(null)) return;

    file.load_contents_async(null, (f, res) => {
      try {
        const [ok, contents] = f.load_contents_finish(res);
        if (!ok) return;
        let text = new TextDecoder().decode(contents);

        if (text.includes("import = [")) {
          text = text.replace(/import\s*=\s*\[.*?\]/s, `import = ["${themeName}"]`);
        } else {
          text = `import = ["${themeName}"]\n` + text;
        }

        const encoder = new TextEncoder();
        f.replace_contents_async(encoder.encode(text), null, false, Gio.FileCreateFlags.NONE, null, null);
      } catch (e) {
        console.error(`[DayNight Theme Sync] Failed updating Alacritty config: ${e.message}`);
      }
    });
  }

  // --- KITTY ---
  _updateKittyTheme(themeName) {
    if (!themeName || themeName.trim() === "") return;

    try {
      const proc = Gio.Subprocess.new(
        ["kitty", "@", "set-colors", "-a", `-c`, themeName],
        Gio.SubprocessFlags.NONE
      );
      proc.init(null);
    } catch (e) {
      // Kitty remote control might not be enabled or kitty is not running
    }
  }

  // --- GHOSTTY ---
  _updateGhosttyTheme(themeName) {
    if (!themeName || themeName.trim() === "") return;

    const configPath = `${GLib.get_user_config_dir()}/ghostty/config`;
    const file = Gio.File.new_for_path(configPath);
    if (!file.query_exists(null)) return;

    file.load_contents_async(null, (f, res) => {
      try {
        const [ok, contents] = f.load_contents_finish(res);
        if (!ok) return;
        let text = new TextDecoder().decode(contents);

        if (text.includes("theme =")) {
          text = text.replace(/^theme\s*=.*$/m, `theme = ${themeName}`);
        } else {
          text += `\ntheme = ${themeName}\n`;
        }

        const encoder = new TextEncoder();
        f.replace_contents_async(encoder.encode(text), null, false, Gio.FileCreateFlags.NONE, null, null);
      } catch (e) {
        console.error(`[DayNight Theme Sync] Failed updating Ghostty config: ${e.message}`);
      }
    });
  }

  // Utility to read, parse, modify, and rewrite JSON files asynchronously
  _updateJsonFile(filePath, updateFn) {
    const file = Gio.File.new_for_path(filePath);
    if (!file.query_exists(null)) return;

    file.load_contents_async(null, (f, res) => {
      try {
        const [ok, contents] = f.load_contents_finish(res);
        if (!ok) return;

        let text = new TextDecoder().decode(contents);
        let jsonObj = {};
        try {
          // Strip comments before JSON parsing if present
          const cleanText = text.replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*/g, (m, g1) => g1 || "");
          jsonObj = JSON.parse(cleanText);
        } catch (e) {
          jsonObj = {};
        }

        jsonObj = updateFn(jsonObj);
        const updatedText = JSON.stringify(jsonObj, null, 2);
        const encoder = new TextEncoder();
        f.replace_contents_async(encoder.encode(updatedText), null, false, Gio.FileCreateFlags.NONE, null, null);
      } catch (e) {
        console.error(`[DayNight Theme Sync] Failed updating JSON file ${filePath}: ${e.message}`);
      }
    });
  }
}
