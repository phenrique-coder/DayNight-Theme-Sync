import GLib from "gi://GLib";
import Gio from "gi://Gio";

export class BrightnessAccentSync {
  constructor(settings, interfaceSettings) {
    this._settings = settings;
    this._interfaceSettings = interfaceSettings;
    this._powerProxy = null;

    try {
      this._powerProxy = Gio.DBusProxy.new_for_bus_sync(
        Gio.BusType.SESSION,
        Gio.DBusProxyFlags.NONE,
        null,
        "org.gnome.SettingsDaemon.Power",
        "/org/gnome/SettingsDaemon/Power",
        "org.gnome.SettingsDaemon.Power.Screen",
        null
      );
    } catch (e) {
      console.error(`[DayNight Theme Sync] Could not connect to Power Screen DBus proxy: ${e.message}`);
    }
  }

  sync(isDm) {
    this._syncAccentColor(isDm);
    this._syncBrightness(isDm);
  }

  _syncAccentColor(isDm) {
    if (!this._settings.get_boolean("sync-accent-color") || !this._interfaceSettings) return;

    const accent = isDm
      ? this._settings.get_string("accent-color-dark")
      : this._settings.get_string("accent-color-light");

    if (!accent || accent.trim() === "") return;

    try {
      this._interfaceSettings.set_string("accent-color", accent);
    } catch (e) {
      // accent-color key only available in GNOME 47+
      console.log(`[DayNight Theme Sync] accent-color setting not available: ${e.message}`);
    }
  }

  _syncBrightness(isDm) {
    if (!this._settings.get_boolean("sync-brightness") || !this._powerProxy) return;

    const targetPercentage = isDm
      ? this._settings.get_int("brightness-dark")
      : this._settings.get_int("brightness-light");

    const clamped = Math.max(1, Math.min(100, targetPercentage));

    try {
      this._powerProxy.set_cached_property("Brightness", new GLib.Variant("i", clamped));
      this._powerProxy.call(
        "org.freedesktop.DBus.Properties.Set",
        new GLib.Variant("(ssv)", [
          "org.gnome.SettingsDaemon.Power.Screen",
          "Brightness",
          new GLib.Variant("i", clamped),
        ]),
        Gio.DBusCallFlags.NONE,
        -1,
        null,
        null
      );
    } catch (e) {
      console.error(`[DayNight Theme Sync] Error setting brightness via DBus: ${e.message}`);
    }
  }

  destroy() {
    this._powerProxy = null;
    this._settings = null;
    this._interfaceSettings = null;
  }
}
