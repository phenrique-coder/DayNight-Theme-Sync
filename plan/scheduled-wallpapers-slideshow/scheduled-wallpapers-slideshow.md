# Plano de Implementação: Rodízio Dinâmico de Papéis de Parede (Scheduled Wallpapers Slideshow)

## Visão Geral
Atualmente, o DayNight Theme Sync permite selecionar uma imagem de fundo fixa para o modo Claro e outra para o modo Escuro. Esta funcionalidade expande essa capacidade permitindo a escolha de **pastas de wallpapers** para dia e noite, alternando automaticamente entre as imagens da pasta selecionada em intervalos configuráveis (slideshow diurno e noturno).

## Requisitos e Critérios de Aceite
1. Permitir selecionar uma pasta de imagens para o modo Claro e uma pasta para o modo Escuro.
2. Permitir definir o intervalo de alternância (ex: a cada 15 min, 30 min, 1h, 2h).
3. Ao estar no modo Claro, alternar apenas entre as imagens da pasta do modo Claro.
4. Ao estar no modo Escuro, alternar apenas entre as imagens da pasta do modo Escuro.
5. Suportar sincronização opcional dessa imagem sorteada/sequencial com o papel de parede da tela de bloqueio (`lockscreen`).
6. Garantir cancelamento de timers `GLib.timeout_add_seconds` no método `disable()` da extensão.

## Alterações Propostas

### 1. Schemas GSettings (`schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml`)
- `wallpaper-slideshow-enabled` (boolean, default: `false`)
- `wallpaper-folder-light` (string, default: `""`)
- `wallpaper-folder-dark` (string, default: `""`)
- `wallpaper-slideshow-interval` (integer, default: `1800`) // em segundos (30 min)
- `wallpaper-slideshow-random` (boolean, default: `true`) // aleatório ou sequencial

### 2. Gerenciador de Slideshow (`src/others/wallpaperSlideshow.js`)
- Criar classe para varrer diretórios via `Gio.File.enumerate_children_async`.
- Filtrar arquivos de imagem suportados (`.jpg`, `.jpeg`, `.png`, `.webp`, `.jxl`).
- Manter o timer ativo e atualizar `org.gnome.desktop.background picture-uri` / `picture-uri-dark`.

### 3. Interface de Preferências (`src/prefs.js`)
- Adicionar seletores de diretório (`Gtk.FileChooserNative` ou botão de escolha de pasta) na aba de Wallpapers.
- Adicionar `Adw.SpinRow` / `Adw.ComboRow` para o intervalo e botão de alternância aleatória.

## Plano de Verificação

### Testes Automatizados e Build
- Compilar schemas com `glib-compile-schemas ./schemas`.
- Testar build com `npm run build`.

### Testes Manuais
1. Criar duas pastas com imagens de teste (uma com papéis de parede claros e outra com escuros).
2. Configurar o slideshow com intervalo curto (ex: 10 segundos para testes).
3. Verificar a troca automática das imagens enquanto no modo Claro.
4. Mudar para o modo Escuro e verificar se as imagens passam a ser sorteadas da pasta noturna.
5. Desativar a extensão e verificar se não restam timers ativos em segundo plano.
