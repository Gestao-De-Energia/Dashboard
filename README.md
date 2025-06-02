# Dashboard

## Introdução 
Este repositório contém o dashboard para visualização dos dados gerados após a execução do algoritmo C-DEEPSO sobre uma simulação de microrrede. O objetivo é apoiar a tomada de decisão do pesquisador através da interpretação rápida, intuitiva e interativa que os gráficos fornecem aos leitores.

## Organização

### /.github/workflows
Faz a comunicação com o Firebase para atualizar a página quando algum merge na branch main é feito.

### /documentos
Contém documentos relevantes para a estruturação do projeto.

### /public
Contém todos os arquivos que o serviço do Firebase Hosting possui acesso e disponibiliza no site:

- **/assets**: Contém as imagens estáticas usadas na plataforma

- **/dados**: Contém os dados em .json para os gráficos estáticos

- **/db**: Contém os arquivos para comunicação com o serviço do Firestore Database:
  - **firebase.js**: Configura as chaves públicas para identificação do projeto
    
  - **getters.js**: Resgata o usuário no login, checa se o e-mail existe (na hora do cadastro) e resgata os comentários para mostrar no site
    
  - **setters.js**: Salva e atualiza usuários e salva e deleta comentários

- **/js**: Contém os arquivos em JavaScript do algoritmo da simulação

- **/pages**: São as páginas do site. Contém os HTMLs para estruturação, CSS para estilização e JS para funcionalidades.
  - **/conta**
    - **cadastro.html**: Parte inicial do cadastro com inserção de nome, e-mail, senha e tipo de perfil.
    - **cadastroConsPesq.html**: Parte final do cadastro com dados de consumidor e pesquisador.
    - **cadastroacCons.html**: O mesmo, mas com dados apenas de consumidor
    - **cadastroacPesq.html**: Dados apenas de pesquisador.
    - **conta.css**: Estilização para as páginas
    - **scriptCadastro.js**: Funcionalidade para mostrar/esconder senha, validar os dados inseridos, cadastrar a conta no Firebase e mudar de página para completar o cadastro.
    - **scriptLogin.js**: Mostrar/esconder senha, redirecionar para a página correta após login com sucesso e funcionalidade de "esqueci a senha". (Página login na raiz do projeto, arquivo index.html)
      
  - **/dashboard**: Contém styles.css para estilização dos dashboards do consumidor e do pesquisador, além das seguintes pastas:
    - **/consumidor**: Dashboard do consumidor, no momento inativo.
    - **/pesquisador**: Dashboard do pesquisador. Funcionalidades estão comentadas no código.
       
  - **/home**: Página para escolher o tipo de perfil para o dashboard caso o usuário queira entrar como convidado. 

- **/pyhon**: Contém os arquivos originais, em Python, do código do algoritmo. Não são usados no site.

- **404.html**: Página padrão "not found"

- **firebaseindex.html**: Arquivo automático do firebase

- **index.html**: Tela inicial do site (login).

- **styles.css**: Estilos gerais do site. 

