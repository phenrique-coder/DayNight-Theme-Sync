---
name: changelog-update
description: Instruções para atualizar e manter os arquivos de Changelog (multi-idioma) sempre que novas funcionalidades, correções de bugs ou alterações relevantes forem adicionadas à extensão DayNight Theme Sync.
---

# Skill: Atualização do Changelog (Changelog Update)

Use esta skill sempre que adicionar uma nova funcionalidade (*feature*), correção de bug (*fix*), refatoração relevante ou alteração de configurações na extensão **DayNight Theme Sync**.

## Regras de Manutenção do Changelog (Múltiplos Idiomas)

### 1. Localização dos Arquivos
Os arquivos de histórico estão localizados na raiz do projeto:
- **`CHANGELOG.md`**: Versão em **Inglês** (idioma padrão e *fallback* global).
- **`CHANGELOG_pt.md`**: Versão em **Português** (carregada automaticamente se a localidade do sistema for `pt` ou `pt_BR`).
- Novas traduções podem ser adicionadas no formato `CHANGELOG_<codigo_idioma>.md` (ex: `CHANGELOG_es.md`).

### 2. Estrutura e Formatação Padrão
Seguir a convenção *Keep a Changelog*:
- **Cabeçalho da Versão**: `## [X.Y.Z] - YYYY-MM-DD`
- **Seções Principais**:
  - `### Added` / `### Adicionado`: Para novos recursos.
  - `### Changed` / `### Modificado`: Para alterações em recursos existentes.
  - `### Fixed` / `### Corrigido`: Para correções de bugs (*fixes*).
  - `### Removed` / `### Removido`: Para recursos descontinuados.

### 3. Padrão de Formatação dos Itens
Para garantir que a aba de Changelog nas preferências (`src/prefs.js`) renderize as entradas corretamente em widgets Libadwaita (`Adw.ActionRow`):
- Use marcadores no formato: `- **Nome do Recurso**: Descrição clara da alteração.`
- Sub-itens (detalhes) devem ser identados com 2 espaços e hífen: `  - Detalhe secundário`.

Exemplo (`CHANGELOG_pt.md`):
```markdown
## [1.1.0] - 2026-08-01

### Adicionado
- **Novo Suporte a Terminal**:
  - Adicionada sincronização automática para o terminal Foot.

### Corrigido
- **Ajuste na Luz Noturna**:
  - Sincronização corrigida ao alterar manualmente a Luz Noturna do GNOME.
```

### 4. Sincronia com Release e Version Bump
Ao preparar um novo lançamento:
1. Atualizar o `CHANGELOG.md` e o `CHANGELOG_pt.md` registrando as mudanças da versão.
2. Seguir o processo da skill `version-bump` para atualizar `metadata.json` e `package.json`.
3. Executar o comando `bash ./install.sh` ou `npm run build` para empacotar os arquivos de changelog e compilar os esquemas.
