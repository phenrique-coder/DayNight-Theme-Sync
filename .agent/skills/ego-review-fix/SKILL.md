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
