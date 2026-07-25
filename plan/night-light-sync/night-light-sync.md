# Plano de Implementação: Sincronização com Luz Noturna do Sistema (Night Light Sync)

## Visão Geral
Esta funcionalidade permite que a extensão **DayNight Theme Sync** alterne automaticamente o tema do sistema entre Claro (Light) e Escuro (Dark) com base no estado da **Luz Noturna (Night Light)** nativa do GNOME Shell, sincronizada com os horários de nascer e pôr do sol ou agendamento personalizado do sistema.

## Requisitos e Critérios de Aceite
1. Adicionar a opção de alternar/habilitar a funcionalidade de sincronização com a Luz Noturna no painel de preferências (`prefs.js`).
2. Monitorar em tempo real as alterações da chave `night-light-active` da interface DBus / GSettings `org.gnome.settings-daemon.plugins.color`.
3. Quando a Luz Noturna for ativada (pôr do sol ou horário agendado), alterar o `color-scheme` para `prefer-dark`.
4. Quando a Luz Noturna for desativada (nascer do sol ou horário agendado), alterar o `color-scheme` para `default`.
5. Permitir ativar/desativar essa sincronização sem interferir na troca manual ou por atalho de teclado (`<Super>y`).
6. Garantir desconexão limpa de sinais e remoção de timers ao desativar a extensão no GNOME (`disable()`).

## Alterações Propostas

### 1. Schema GSettings (`schemas/org.gnome.shell.extensions.daynightthemesync.gschema.xml`)
Adicionar novas chaves de configuração:
- `night-light-sync-enabled` (boolean, default: `false`): Habilita/desabilita a sincronização com a Luz Noturna.

### 2. Lógica Principal (`src/extension.js`)
- Criar listener para o schema `org.gnome.settings-daemon.plugins.color`.
- Escutar a propriedade `night-light-active`.
- Atualizar a preferência de esquema de cores `org.gnome.desktop.interface color-scheme` automaticamente quando `night-light-sync-enabled` estiver ativo.
- Realizar a limpeza dos listeners no método `disable()`.

### 3. Interface de Preferências (`src/prefs.js`)
- Adicionar um novo `Adw.SwitchRow` na aba de configurações gerais para "Sincronizar com Luz Noturna (Night Light)".
- Adicionar subtítulo explicativo informando que o tema mudará junto com o nascer e pôr do sol do GNOME.

## Plano de Verificação

### Testes Automatizados e Build
- Compilar o schema GSettings com `glib-compile-schemas ./schemas`.
- Executar `npm run build` para garantir ausência de erros de sintaxe ou bundling.

### Testes Manuais
1. Habilitar a opção "Sincronizar com Luz Noturna" nas preferências.
2. Ativar a Luz Noturna nas Configurações do GNOME (Configurações -> Telas -> Luz Noturna).
3. Verificar se o tema do sistema transiciona para escuro imediatamente ao ativar a Luz Noturna.
4. Desativar a Luz Noturna e verificar se o tema retorna ao modo claro.
5. Desabilitar a opção nas preferências e testar que a Luz Noturna deixa de afetar a troca de tema.
