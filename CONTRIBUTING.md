# Guia de contribuição — Move AS

## Antes de editar

1. Entre no GitHub Desktop com **sua própria conta**.
2. Faça **Fetch origin** e **Pull origin**, se houver atualizações.
3. Crie uma branch para sua tarefa, por exemplo `feature/login-joao` ou `ajuste/home-legibilidade`.
4. Abra o projeto no Visual Studio Code e faça **somente as alterações da tarefa combinada**.
5. Teste a tela no navegador e confira se não quebrou a Home.

## Para registrar o trabalho

1. No GitHub Desktop, confira a aba **Changes** e revise o que você realmente alterou.
2. Faça um commit descritivo, como `feat: criar formulário de login` ou `fix: melhorar contraste da agenda do aluno`.
3. Use **Push origin** para enviar a branch ao GitHub.
4. Abra um **Pull Request (PR)** no GitHub para que outro integrante confira e aprove as alterações.
5. Anote a contribuição em `docs/EVIDENCIAS.md`, com link do commit ou PR e, se necessário, uma captura da tela.

## Exemplos de tarefas separadas

- Home: ajustes de layout responsivo e conteúdo existente.
- Login e Cadastro: formulários e mensagens de validação.
- Área do aluno: agenda, agendamento, alteração e cancelamento.
- Área do administrador: grade de horários e gerenciamento de agendamentos.
- UX e testes: legibilidade, botões Voltar/Cancelar, estados de erro e acessibilidade.
- Documentação: requisitos RF/RNF, capturas, descrições, vídeo e evidências.

**São exemplos para combinar com o grupo**, não declarações de que alguém já realizou essas tarefas.

## Padrão de código

- Nomeie os arquivos em minúsculas, sem espaços e com extensão adequada (`login.html`, `agenda-aluno.html`).
- Prefira usar `styles.css` e as variáveis em `:root` para manter a identidade visual.
- Evite substituir os recursos de imagem do projeto sem alinhamento com o grupo.
- Use classes CSS semânticas e garanta o uso pelo teclado nos controles.
- Nunca publique senhas, chaves privadas, tokens, dados pessoais reais ou arquivos temporários.
- Não façam commits na conta de outra pessoa para criar evidências artificiais.

## Sobre IA

Caso usem IA para apoiar a programação, registrem o uso de modo transparente e contem como contribuição individual apenas as atividades realmente desenvolvidas, revisadas ou modificadas por cada integrante.
