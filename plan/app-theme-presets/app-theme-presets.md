# Plano de Implementação: Presets e Sincronização de Temas para Aplicativos Externos (App Theme Presets)

## Visão Geral
Atualmente a extensão aceita comandos customizados simples shell para modo claro e modo escuro. Esta nova feature expandirá essa capacidade criando um sistema dedicado de **App Theme Presets**, com modelos prontos para atualizar arquivos de configuração de editores (VS Code, Alacritty, Kitty, Ghostty, WezTerm) e perfis de terminais ao trocar de tema.

## Requisitos e Critérios de Aceite
1. Oferecer suporte nativo ou templates prontos de comando/integração para:
   - VS Code (`~/.config/Code/User/settings.json` `"workbench.colorTheme"`)
   - Alacritty (`~/.config/alacritty/alacritty.toml`)
   - Kitty Terminal (`~/.config/kitty/theme.conf`)
   - Ghostty Terminal (`~/.config/ghostty/config`)
2. Fornecer uma interface intuitiva em `prefs.js` para escolher presets rápidos com 1 clique ou definir caminhos customizados.
3. Executar as substituições/scripts de forma assíncrona usando `Gio.Subprocess` sem bloquear o thread principal da interface do GNOME Shell.
4. Manter total compatibilidade com as diretrizes de submissão da EGO (Extensions GNOME Org).

## Alterações Propostas

### 1. Schemas GSettings (`schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml`)
Adicionar chaves:
- `enable-app-presets` (boolean, default: `false`)
- `vscode-theme-light` (string, default: `"Default Light Modern"`)
- `vscode-theme-dark` (string, default: `"Default Dark Modern"`)
- `alacritty-sync-enabled` (boolean, default: `false`)
- `kitty-sync-enabled` (boolean, default: `false`)

### 2. Módulo Integrador de Apps (`src/others/appSync.js`)
- Criar classe auxiliar para manipular substituição em arquivos JSON/TOML/Conf de forma segura e não destrutiva via GLib/Gio.
- Disparar a sincronização dos apps no gancho `_changeAllTheme()`.

### 3. Interface de Preferências (`src/prefs.js`)
- Criar uma nova aba ou grupo de preferências "Aplicativos & Terminais" com seletores para VS Code, Alacritty, Kitty e Ghostty.

## Plano de Verificação

### Testes Automatizados e Build
- Compilar schemas com `glib-compile-schemas ./schemas`.
- Executar `npm run build`.

### Testes Manuais
1. Habilitar a sincronização do VS Code e Alacritty nas preferências.
2. Definir temas distintos para claro e escuro.
3. Alternar o tema do sistema e verificar se o VS Code e os terminais alteram o tema automaticamente sem falhas.
