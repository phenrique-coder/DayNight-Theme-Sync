---
name: ego-review-fix
description: Guidelines and patterns for fixing EGO (extensions.gnome.org) code review issues and adhering to official GNOME extension guidelines.
---

# GNOME Extension EGO Review Fixes

Use this skill when processing review feedback from extensions.gnome.org (EGO) reviewers or performing code quality audits before submitting a GNOME Shell Extension.

## Key Guidelines & Rules

### 1. Main Loop Sources (Timeouts and Intervals)
- **Always clear existing timeouts before creating a new one**:
  ```javascript
  if (this._timeoutId) {
    GLib.source_remove(this._timeoutId);
    this._timeoutId = 0;
  }
  this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, () => {
    // task logic
    this._timeoutId = 0;
    return GLib.SOURCE_REMOVE;
  });
  ```
- **Track timeouts in a property and remove explicitly + loop on `disable()` (EGO-L-004)**:
  Shexli (the automated EGO linter) parses AST for literal property names passed to `GLib.source_remove()`. Always provide explicit removals for named timeout properties AND a loop for complete safety:
  ```javascript
  disable() {
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
  }
  ```

### 2. Selective Disable (Forbidden)
- **Do NOT use early return guards in `disable()`**:
  Never write `if (!this.enabled) return;` or check state flags inside `disable()`.
  GNOME Shell expects `disable()` to execute all cleanup logic unconditionally to prevent desynchronization or lingering resources.

### 3. Signal Connections (`connectObject` & `disconnectObject`)
- **Use GObject signal tracking**:
  Always use `connectObject()` to bind GObject signals (e.g. `Settings`, `extensionManager`) to `this`:
  ```javascript
  this._settings.connectObject(
    'changed',
    this._onSettingsChanged.bind(this),
    this
  );
  ```
- Clean them up in `disable()` with a single call per object:
  ```javascript
  this._settings?.disconnectObject(this);
  ```

### 4. Settings Access & Third-Party Code
- Never instantiate settings from schemas owned by other extensions or unowned schemas directly without proper schema verification.
- Always cleanly restore monkey-patched functions, prototype overrides, or panel toggles on `disable()`.

## Shexli Automated Linter (Experimental Warnings)

Shexli is the static AST linter executed automatically when uploading a `.zip` package to [extensions.gnome.org](https://extensions.gnome.org/upload/).

### Common Shexli Rule Warnings & Resolution Checklist

| Rule ID | Shexli Warning Message | Cause | Resolution Pattern |
|---|---|---|---|
| **EGO-L-004** | `main loop sources should be removed in disable()` | AST parser cannot infer dynamic loops; requires explicit literal property names passed to `GLib.source_remove()`. | Add explicit `GLib.source_remove(this._timeouts.propertyName)` calls for all property names in `disable()`, alongside dynamic loop iteration. |
| **EGO-L-007** | `Main loop sources assigned in enable() are missing matching removals before reassignment` | Re-assigning a timeout ID without clearing the existing source first. | Always check and call `if (this._timeoutId) { GLib.source_remove(this._timeoutId); this._timeoutId = 0; }` BEFORE `GLib.timeout_add()`. |
| **EGO-L-001** | `Signal handler missing disconnect in disable()` | Connecting signals via `.connect()` without saving ID or disconnecting. | Use `connectObject()` and disconnect with `this._settings?.disconnectObject(this)` in `disable()`. |
| **EGO-L-003** | `Selective disable guard detected` | Guarding `disable()` with `if (!this.enabled) return;`. | Remove all conditional early-returns inside `disable()`. |

