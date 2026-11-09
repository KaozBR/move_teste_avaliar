# Move — Pilates & Bem-estar | AS — Projeto completo funcional

Este projeto implementa o front-end demonstrativo do estúdio Move, mantendo a Home aprovada e os fluxos definidos na AP2.

## Executar no Visual Studio Code

1. Abra esta pasta (`Move_AS_Final_Funcional`) no VS Code.
2. Instale a extensão **Live Server**.
3. Clique com o botão direito em `index.html` → **Open with Live Server**.
4. Navegue pela Home para Login, Cadastro, Contato e áreas autenticadas.

Também pode executar `python -m http.server 5500` na pasta e acessar http://localhost:5500.

## Demonstração rápida

**Aluno**: `aluno@move.com.br` / `Move@2026`.
**Administradora**: `admin@move.com.br` / `Move@2026`.

Ou cadastre uma conta nova: ela será criada como **Aluno**. No Login, expanda o bloco "Contas de demonstração" e use os botões de teste para preencher o formulário automaticamente.

## Fluxos completos

- **Home**: conhecer a Move, ampliar mapa, acessar contato e login, menu responsivo.
- **Contato**: informar nome, e-mail, assunto (Elogios, Reclamações, Dúvidas, Aula de pilates), canal de resposta (WhatsApp, E-mail, Ligação) e mensagem; sucesso e visualização pela administradora.
- **Cadastro**: campos e regras de validação, confirmação clara com CTA para Login.
- **Login**: diferenciar Aluno e Administradora, recusar credenciais inválidas.
- **Aluno**: visualizar horários e cartões de aulas, criar e alterar agendamento em **uma única janela com resumo**, cancelar com confirmação, regra das 24 horas, indisponibilidade/conflitos e sucesso.
- **Administradora**: selecionar dia, consultar agendamentos e horários livres, criar/alterar/cancelar para alunos, definir horários e consultar mensagens.
- **Logout**: encerrar a sessão e voltar ao Login.

## Estrutura

- `index.html`: Home aprovada.
- `cadastro.html`, `login.html`, `contato.html`, `aluno.html`, `admin.html`, `saida.html`: demais telas.
- `styles.css` e `app.css`: padrão visual branco, cinza, azul; responsividade e UX.
- `script.js`: interações da Home; `app.js`: telas internas.
- `store.js`: dados demonstrativos, sessões e regras de negócio.
- `data/dados-iniciais.json`: dados da simulação.
- `assets/`: logo e imagens reais do projeto, mapa e biblioteca Bootstrap local.
- `docs/AJUSTES_PROFESSORA_AS.md`: o que foi revisado após feedback da AP2.
- `tests/`: testes automatizados e roteiro.

## Limitações importantes

Este é um **front-end acadêmico simulado**. Usa `localStorage` e `sessionStorage`, sem servidor nem autenticação real. Dados de usuários, mensagens e agendamentos ficam apenas no navegador daquele computador e **não sincronizam entre visitantes**. Não use senhas nem dados pessoais reais. Pode publicar em GitHub Pages para demonstração, mas só como protótipo. O uso de JavaScript e dados locais atende ao formato front-end do trabalho, não constitui backend de produção.

Para limpar os dados do protótipo, remova os dados do site no navegador, ou rode no console do DevTools: `MoveStore.resetDemo()` e atualize a página.

## GitHub

Cada integrante deve registrar alterações **reais** com a própria conta, commits específicos e, se possível, Pull Requests. Não atribua contribuições que a pessoa não realizou. Os links dos commits podem servir de evidência para a ficha individual.
