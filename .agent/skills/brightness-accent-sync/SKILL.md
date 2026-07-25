---
name: brightness-accent-sync
description: Instruções para implementar a sincronização de cores de destaque (Accent Color) e níveis de brilho de tela/teclado no GNOME.
---

# Skill: Brightness & Accent Sync

Use esta skill para gerenciar as configurações da cor de destaque do sistema e controle de brilho via DBus.

## Passo a Passo de Implementação

### 1. Atualização dos Schemas GSettings
Adicionar as chaves para `sync-accent-color`, `accent-color-light`, `accent-color-dark`, `sync-brightness`, `brightness-light`, `brightness-dark` e recompilar:
```bash
glib-compile-schemas ./schemas
```

### 2. Manipulação da Cor de Destaque no GNOME 47+
- A cor de destaque é controlada pela chave `accent-color` no schema `org.gnome.desktop.interface`.
- Exemplo de alteração segura:
  ```javascript
  if (this._settings.get_boolean('sync-accent-color')) {
    const accent = isDm ? this._settings.get_string('accent-color-dark') : this._settings.get_string('accent-color-light');
    this._interfaceSettings.set_string('accent-color', accent);
  }
  ```

### 3. Chamadas DBus para Ajuste de Brilho
- Usar `Gio.DBusProxy` para comunicar com `org.gnome.SettingsDaemon.Power`.
- Obter o proxy de `org.gnome.SettingsDaemon.Power.Screen` e chamar a propriedade ou método de alteração de brilho (`Brightness`).
- Tratar cenários onde o dispositivo não possui tela integrada ou controle de brilho via hardware.

### 4. Validação
- Testar em um ambiente GNOME 47+ com suporte a cores de destaque.
- Verificar que computadores sem controle de brilho não geram exceções não tratadas.
