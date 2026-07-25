---
name: scheduled-wallpapers-slideshow
description: Instruções para implementar e manter o sistema de rodízio de papéis de parede por pasta para modos dia e noite.
---

# Skill: Scheduled Wallpapers Slideshow

Use esta skill ao gerenciar a lógica de varredura de diretórios de wallpapers e alternância periódica de imagens no GNOME Desktop Background.

## Passo a Passo de Implementação

### 1. Atualização dos Schemas
Adicionar as chaves de diretório e intervalo no arquivo schema GSettings e recompilar:
```bash
glib-compile-schemas ./schemas
```

### 2. Leitura Assíncrona de Diretórios via Gio
Para evitar travamentos de I/O na UI:
- Usar `Gio.File.new_for_path(folderPath)` e `enumerate_children_async`.
- Validar tipos MIME ou extensões de arquivo (`png`, `jpg`, `jpeg`, `webp`).

### 3. Gerenciamento de Timers
- Armazenar o `timeoutId` em `this._timeouts.wallpaperSlideshow`.
- Utilizar `GLib.timeout_add_seconds(interval, ...)` para economia de energia.
- Sempre cancelar o timer com `GLib.source_remove()` ao alterar configurações ou desativar a extensão em `disable()`.

### 4. Validação
- Testar com pastas contendo grande número de imagens (>100 imagens).
- Verificar que a troca de wallpaper atualiza `picture-uri` (para modo claro) e `picture-uri-dark` (para modo escuro).
