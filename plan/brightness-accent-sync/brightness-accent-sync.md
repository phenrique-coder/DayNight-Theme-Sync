# Plano de Implementação: Sincronização de Cor de Destaque e Brilho de Tela/Teclado (Brightness & Accent Sync)

## Visão Geral
Esta funcionalidade integra a troca de tema diurna/noturna com as preferências visuais e de conforto do GNOME 47+, adicionando suporte para alternar automaticamente a **Cor de Destaque do GNOME (Accent Color)** e redefinir/ajustar os níveis de **Brilho da Tela** e **Retroiluminação do Teclado** ao entrar no modo noturno ou diurno.

## Requisitos e Critérios de Aceite
1. Permitir escolher uma cor de destaque do GNOME para o modo Claro e outra para o modo Escuro (suportando as cores nativas do GNOME: blue, teal, green, yellow, orange, red, pink, purple, slate).
2. Permitir configurar o nível de brilho da tela para modo claro e modo escuro.
3. Ajustar o brilho da tela via DBus `org.gnome.SettingsDaemon.Power.Screen` ao alternar o tema.
4. Ajustar o brilho do teclado via DBus `org.gnome.SettingsDaemon.Power.Keyboard`.
5. Opção nas preferências para habilitar/desabilitar de forma independente a sincronização de Accent Color e Brilho.

## Alterações Propostas

### 1. Schemas GSettings (`schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml`)
- `sync-accent-color` (boolean, default: `false`)
- `accent-color-light` (string, default: `"blue"`)
- `accent-color-dark` (string, default: `"purple"`)
- `sync-brightness` (boolean, default: `false`)
- `brightness-light` (integer, default: `80`) // porcentagem 0-100
- `brightness-dark` (integer, default: `30`) // porcentagem 0-100

### 2. Sincronizador de Brilho e Cores (`src/others/brightnessAccentSync.js`)
- Ler e alterar `accent-color` na schema `org.gnome.desktop.interface`.
- Conectar aos serviços DBus de Energia do GNOME via `Gio.DBusProxy` para definir o brilho da tela.

### 3. Interface de Preferências (`src/prefs.js`)
- Adicionar `Adw.ComboRow` para a escolha das cores de destaque.
- Adicionar `Adw.SpinRow` / Sliders para definição da porcentagem de brilho no modo claro e escuro.

## Plano de Verificação

### Testes Automatizados e Build
- Compilar os schemas com `glib-compile-schemas ./schemas`.
- Testar build com `npm run build`.

### Testes Manuais
1. Escolher cores de destaque diferentes (ex: Azul de dia, Roxo de noite).
2. Alternar entre modo Claro e Escuro e observar a alteração dinâmica dos acentos do ambiente GNOME Shell / Libadwaita.
3. Testar a alteração do nível de brilho da tela no momento da transição.
