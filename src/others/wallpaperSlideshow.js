import GLib from "gi://GLib";
import Gio from "gi://Gio";

export class WallpaperSlideshow {
  constructor(settings) {
    this._settings = settings;
    this._bgSettings = new Gio.Settings({
      schema: "org.gnome.desktop.background",
    });
    this._timeoutId = 0;
    this._currentIndex = 0;
  }

  update(isDm) {
    this.stop();

    if (!this._settings.get_boolean("wallpaper-slideshow-enabled")) {
      return;
    }

    this._cycleWallpaper(isDm);

    const interval = Math.max(10, this._settings.get_int("wallpaper-slideshow-interval"));
    this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
      this._cycleWallpaper(isDm);
      return GLib.SOURCE_CONTINUE;
    });
  }

  stop() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = 0;
    }
  }

  _cycleWallpaper(isDm) {
    const folderUri = isDm
      ? this._settings.get_string("wallpaper-folder-dark")
      : this._settings.get_string("wallpaper-folder-light");

    if (!folderUri || folderUri.trim() === "") return;

    let file = folderUri.startsWith("file://")
      ? Gio.File.new_for_uri(folderUri)
      : Gio.File.new_for_path(folderUri);

    if (!file.query_exists(null)) return;

    file.enumerate_children_async(
      "standard::name,standard::content-type",
      Gio.FileQueryInfoFlags.NONE,
      GLib.PRIORITY_DEFAULT,
      null,
      (obj, res) => {
        try {
          const enumerator = obj.enumerate_children_finish(res);
          const imageFiles = [];
          let info;

          while ((info = enumerator.next_file(null)) !== null) {
            const name = info.get_name();
            const lower = name.toLowerCase();
            if (
              lower.endsWith(".jpg") ||
              lower.endsWith(".jpeg") ||
              lower.endsWith(".png") ||
              lower.endsWith(".webp") ||
              lower.endsWith(".svg") ||
              lower.endsWith(".jxl")
            ) {
              imageFiles.push(file.get_child(name).get_uri());
            }
          }
          enumerator.close(null);

          if (imageFiles.length === 0) return;

          const isRandom = this._settings.get_boolean("wallpaper-slideshow-random");
          let selectedUri = "";

          if (isRandom) {
            const randomIndex = Math.floor(Math.random() * imageFiles.length);
            selectedUri = imageFiles[randomIndex];
          } else {
            this._currentIndex = this._currentIndex % imageFiles.length;
            selectedUri = imageFiles[this._currentIndex];
            this._currentIndex = (this._currentIndex + 1) % imageFiles.length;
          }

          if (selectedUri) {
            if (isDm) {
              this._bgSettings.set_string("picture-uri-dark", selectedUri);
            } else {
              this._bgSettings.set_string("picture-uri", selectedUri);
            }
          }
        } catch (e) {
          console.error(`[DayNight Theme Sync] Error reading wallpaper folder: ${e.message}`);
        }
      }
    );
  }
}
