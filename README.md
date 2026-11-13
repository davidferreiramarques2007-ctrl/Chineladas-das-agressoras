# Chinelos na Mira — Arena Online (v2.1)

Jogo de pontaria inspirado no universo das havaianas/chinelos, feito para partidas rápidas entre amigos. Projeto de fã, sem vínculo oficial com a marca Havaianas.

## O que tem nesta versão

- Partidas online por sala com código e QR Code.
- Até 50 jogadores por sala.
- Lista de jogadores e estado de prontidão. O anfitrião inicia quando todos estiverem prontos.
- Placar ao vivo e resultado da rodada.
- Convite por link (compartilhamento nativo em celulares compatíveis ou cópia do link).
- Treino solo, quatro cenários, personalização de cores, formatos, estampas e pingentes.
- Efeitos, sons, recordes locais, tutorial e tela cheia.
- Servidor Node.js sem dependências externas.

## Rodar no computador

1. Instale Node.js 18 ou superior.
2. Extraia o ZIP.
3. Abra o terminal na pasta que contém `server.js` e `package.json`.
4. Execute `npm start`.
5. Abra `http://localhost:3000`.

## Jogar no mesmo Wi-Fi

- Descubra o IPv4 do computador que está rodando o servidor (`ipconfig` no Windows).
- Nos celulares conectados ao mesmo Wi-Fi, abra `http://IP-DO-COMPUTADOR:3000`.
- Libere o Node.js no firewall do computador, se for solicitado.
- O anfitrião cria/entra numa sala e compartilha o QR Code ou link com os outros.

## Jogar pela internet

Para amigos fora da mesma rede, publique a pasta do projeto em um serviço de hospedagem que execute aplicações Node.js e mantenha o processo ativo. Configure a variável de ambiente `PORT` conforme o provedor. O QR Code e os convites usam automaticamente o endereço público aberto no navegador. O servidor mantém as salas em memória: reiniciar a aplicação encerra as salas ativas.

## Observações

- O servidor aceita até 50 participantes por sala e usa eventos HTTP em tempo real (SSE).
- As salas ficam em memória e desaparecem quando todos saem ou o servidor reinicia.
- Recordes e histórico do modo solo ficam salvos no navegador de cada jogador.

## Atualização visual e desempenho
- Cenários com camadas de ambiente, iluminação, materiais e detalhes próprios para praia, selva, clube e bairro.
- Cenário renderizado em uma camada estática reutilizada, evitando redesenhar os mesmos detalhes em todos os quadros.
- Efeitos de desfoque e sombras CSS pesados reduzidos em telas menores.
- Animação suspensa enquanto a página está em segundo plano.
- Mantido o limite configurado de até 50 participantes por sala; o desempenho multiplayer ainda depende do servidor e da rede utilizados.
