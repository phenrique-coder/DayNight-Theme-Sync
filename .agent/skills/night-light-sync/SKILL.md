---
name: night-light-sync
description: Instruções para implementar e manter a funcionalidade de Sincronização Automática de Tema com a Luz Noturna (Night Light) do GNOME.
---

# Skill: Night Light Sync

Use esta skill para implementar ou modificar a integração entre a extensão **DayNight Theme Sync** e o daemon de Luz Noturna (`org.gnome.settings-daemon.plugins.color`) do GNOME.

## Passo a Passo de Implementação

### 1. Atualização do Schema GSettings
No arquivo `schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml`:
- Adicionar a chave `<key name="night-light-sync-enabled" type="b">` com valor padrão `false`.
- Recompilar o schema:
  ```bash
  glib-compile-schemas ./schemas
  ```

### 2. Integração com GNOME Color Plugin em `src/extension.js`
- Inicializar `Gio.Settings` para o schema `org.gnome.settings-daemon.plugins.color`:
  ```javascript
  this._colorSettings = new Gio.Settings({ schema: "org.gnome.settings-daemon.plugins.color" });
  ```
- Conectar ao sinal `changed::night-light-active`:
  ```javascript
  this._colorSettings.connectObject('changed::night-light-active', () => {
    if (!this._settings.get_boolean('night-light-sync-enabled')) return;
    const active = this._colorSettings.get_boolean('night-light-active');
    this._interfaceSettings.set_string('color-scheme', active ? 'prefer-dark' : 'default');
  }, this);
  ```
- Garantir a desconexão no método `disable()` usando `this._colorSettings?.disconnectObject(this)`.

### 3. Adição da Configuração em `src/prefs.js`
- Adicionar um `Adw.SwitchRow` ligado à chave `night-light-sync-enabled` na página/grupo principal de configurações.

### 4. Validação
- Testar alternar a Luz Noturna no painel de controle do GNOME.
- Verificar logs do GNOME Shell com `journalctl -f -o cat /usr/bin/gnome-shell`.
