import GLib from "gi://GLib";
import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

export class BrightnessAccentSync {
  constructor(settings, interfaceSettings) {
    this._settings = settings;
    this._interfaceSettings = interfaceSettings;
  }

  sync(isDm) {
    this._syncAccentColor(isDm);
    this._syncBrightness(isDm);
  }

  _syncAccentColor(isDm) {
    if (!this._settings?.get_boolean("sync-accent-color") || !this._interfaceSettings) return;

    const accent = isDm
      ? this._settings.get_string("accent-color-dark")
      : this._settings.get_string("accent-color-light");

    if (!accent || accent.trim() === "") return;

    try {
      this._interfaceSettings.set_string("accent-color", accent);
    } catch (e) {
      // accent-color key only available in GNOME 47+
    }
  }

  _syncBrightness(isDm) {
    if (!this._settings?.get_boolean("sync-brightness")) return;

    const targetPercentage = isDm
      ? this._settings.get_int("brightness-dark")
      : this._settings.get_int("brightness-light");

    const clamped = Math.max(1, Math.min(100, targetPercentage));
    const normValue = clamped / 100.0;

    let success = false;

    // Strategy 1: Main.brightnessManager.globalScale.value (GNOME 49+)
    // globalScale is a BrightnessScale GObject; its 'value' property (0.0-1.0)
    // controls brightness. Setting it triggers _sync() which updates the hardware backlight.
    try {
      const bm = Main.brightnessManager;
      if (bm?.globalScale && typeof bm.globalScale.value !== "undefined") {
        bm.globalScale.value = normValue;
        success = true;
      }
    } catch (e) {
      // brightnessManager not available on this GNOME version
    }

    // Strategy 2: Quick Settings _brightness slider (GNOME 46-48)
    if (!success) {
      try {
        const qs = Main.panel?.statusArea?.quickSettings;
        if (qs?._brightness) {
          const brightnessItem = qs._brightness;
          const slider = brightnessItem._slider || brightnessItem.slider;
          if (slider && typeof slider.value !== "undefined") {
            slider.value = normValue;
            success = true;
          }
        }
      } catch (e) {
        // QuickSettings brightness slider not available
      }
    }

    // Strategy 3: gsd-power DBus (legacy GNOME < 46)
    if (!success) {
      try {
        Gio.DBus.session.call(
          "org.gnome.SettingsDaemon.Power",
          "/org/gnome/SettingsDaemon/Power",
          "org.freedesktop.DBus.Properties",
          "Set",
          new GLib.Variant("(ssv)", [
            "org.gnome.SettingsDaemon.Power.Screen",
            "Brightness",
            new GLib.Variant("i", clamped),
          ]),
          null,
          Gio.DBusCallFlags.NONE,
          -1,
          null,
          (connection, res) => {
            try {
              connection.call_finish(res);
            } catch (e) {
              // gsd-power Screen interface not available
            }
          }
        );
      } catch (e) {
        // Ignore DBus errors
      }
    }
  }

  destroy() {
    this._settings = null;
    this._interfaceSettings = null;
  }
}




