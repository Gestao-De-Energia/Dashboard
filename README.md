# Dashboard

## Introdução 
O presente repositório é referente a confecção do dashboard interativo para a iniciação científica "Gestão de Fontes Renováveis de Energia".
Para isso, utilizou-se HTML,CSS e javascript para a montagem do dashboard. Os dados dos gráficos foram obtidos por meio dos códigos disponibilizados em python e octave. Ao serem extraídos em um arquivo txt, converteu-se para csv para no final ser utilizado pela biblioteca de plotagem de gráficos em javascript denominada Apex Chart.js.
Assim, utilizando o modelo não funcional prototipado no Figma como base construiu-se o dashboard para os diferentes perfis.

## Organização
Breve explicação sobre a organização desse projeto.

### DADOS
Pasta referente aos dados, no formato csv, que são necessários para plotar os gráficos dos dashboards
### SRC
Pasta que contém subpastas para o arquivo de estilização css e o arquivo javascript para iteração dos gráficos.
### Arquivos HTML
* O arquivo html home.html é referente a home do dashboard onde pode -se fazer a escolha de perfil de usuário visualizador do dashboard.
* O arquivo html cons.hmtl é referente ao perfil consumidor que disponibiliza os gráficos e as métricas vistas por este usuário
* O arquivo html pesq.html é referente ao perfil pesquisador que disponibiliza os gráficos e as métricas vistas por este perfil.

