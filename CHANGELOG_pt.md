# Histórico de Mudanças

Todas as mudanças relevantes no projeto **DayNight Theme Sync** serão documentadas neste arquivo.

## [1.0.0] - 2026-07-25

### Adicionado
- **Sincronização de Temas do Sistema**:
  - Alternância automática de temas de Ponteiro (Cursor), Ícones, GNOME Shell e Aplicações Legadas (GTK3) ao mudar entre Modo Claro e Modo Escuro.
- **Comandos Customizados**:
  - Execução de comandos shell customizados ao alternar para Modo Claro ou Modo Escuro.
- **Sincronização com Aplicativos e Terminais**:
  - VS Code: Atualização automática do tema no `settings.json`.
  - Alacritty: Troca automática de esquemas de cores.
  - Kitty: Sincronização de tema do terminal.
  - Ghostty: Sincronização de tema do terminal.
- **Papéis de Parede & Rodízio (Slideshow)**:
  - Configuração de papéis de parede individuais para Modo Claro e Modo Escuro.
  - Rodízio agendado (slideshow) de papéis de parede a partir de pastas selecionadas com temporizador personalizável.
- **Integração com Luz Noturna (Night Light)**:
  - Alternância de tema integrada automaticamente com o estado da Luz Noturna do GNOME.
- **Cores de Destaque (Accent Color) & Níveis de Brilho**:
  - Sincronização da Cor de Destaque (Accent Color) por modo.
  - Ajuste e controle automático do nível de brilho da tela e do teclado.
- **Aba de Changelog do Sistema**:
  - Visualizador integrado de histórico de mudanças nas preferências da extensão com suporte a múltiplos idiomas.

### Corrigido
- **Alternância de Tema pelo Botão do Sistema**:
  - Corrigida falha no botão do sistema (Quick Settings) que impedia a troca entre Modo Claro e Modo Escuro devido a sobreposição de sinais e bloqueio na transição.

