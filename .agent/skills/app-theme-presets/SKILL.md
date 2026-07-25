---
name: app-theme-presets
description: Instruções para implementar e manter a sincronização de temas para aplicativos terceiros (VS Code, Alacritty, Kitty, Ghostty).
---

# Skill: App Theme Presets

Use esta skill para expandir ou solucionar problemas na integração de temas com aplicativos externos e emuladores de terminal.

## Passo a Passo de Implementação

### 1. Extensão de Schemas
Adicionar as chaves necessárias em `schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml` e compilar:
```bash
glib-compile-schemas ./schemas
```

### 2. Implementação Assíncrona via `Gio.Subprocess` ou manipulação de arquivo com GLib
Ao alterar configurações de arquivos locais em `~/.config/`:
- Utilizar `Gio.File.new_for_path()` para leitura e gravação segura.
- Ou utilizar `Gio.Subprocess.new()` com tratamento de exceções assíncrono para scripts helpers.
- **NUNCA** usar chamadas bloqueantes síncronas (`execSync` ou APIs síncronas pesadas) no thread do GNOME Shell.

### 3. Interface Visual em `prefs.js`
- Organizar os seletores de aplicativos em um `Adw.PreferencesGroup` dedicado na aba de Aplicativos.
- Fornecer campos de texto (`Adw.EntryRow`) para temas do VS Code e seletores de arquivos para temas de terminal.

### 4. Validação
- Testar a alteração com arquivos existentes em `~/.config/Code/User/settings.json` e `~/.config/alacritty/alacritty.toml`.
- Garantir que a falha na atualização de um app não impeça a troca dos outros temas do sistema.
