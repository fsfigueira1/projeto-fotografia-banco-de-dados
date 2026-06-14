# Fauzi Eventos

Plataforma premium de fotografia para eventos com landing comercial, galeria privada por senha, seleção de fotos, checkout seguro e painel administrativo.

## Objetivo

Transformar eventos em uma experiência de compra organizada: o cliente entra com um código privado, escolhe as fotos, paga com segurança e libera o download após aprovação do pagamento.

## Funcionalidades

- Landing page pública com foco em conversão.
- Acesso à galeria por senha/código.
- Seleção de fotos e carrinho com total atualizado.
- Checkout integrado com Stripe.
- Download protegido após pagamento aprovado.
- Painel admin para criar galerias, gerar códigos, fazer upload e acompanhar pedidos.
- Fluxo de WhatsApp como alternativa opcional de contato.

## Tecnologias

- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion, GSAP, Lenis, Lucide React.
- Backend: Node.js, Express 5.
- Banco: MongoDB com Mongoose.
- Pagamentos: Stripe.
- Upload e mídia: local ou Cloudinary.

## Arquitetura

- `src/`: interface pública, galeria, checkout e admin.
- `routes/`: rotas HTTP do domínio.
- `server/`: configuração, segurança, serviços e middleware.
- `models/`: schemas do MongoDB.
- `public/`: páginas estáticas finais do app.

## Fluxo Do Cliente

1. Entra na landing page.
2. Abre a galeria com código privado.
3. Visualiza as fotos disponíveis.
4. Seleciona as favoritas.
5. Segue para checkout.
6. Recebe liberação do download após pagamento aprovado.

## Fluxo Do Admin

1. Faz login no modal de autenticação.
2. Abre o painel administrativo.
3. Cria ou edita galerias.
4. Gera códigos de acesso.
5. Faz upload de fotos.
6. Acompanha pedidos e status.

## Como Rodar Localmente

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run create-admin
npm.cmd run dev
npm.cmd run dev:server
```

Build e execução do servidor:

```powershell
npm.cmd run build
npm.cmd start
```

## Configuração De Ambiente

Copie `.env.example` para `.env` e ajuste as variáveis.

### Variáveis obrigatórias

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `STRIPE_SECRET_KEY` para checkout real
- `STRIPE_WEBHOOK_SECRET` para webhook real

### Variáveis recomendadas

- `PORT`
- `JWT_EXPIRES_IN`
- `GALLERY_SESSION_EXPIRES_IN`
- `VITE_API_URL`
- `WHATSAPP_PHONE`
- `VITE_WHATSAPP_PHONE`
- `MEDIA_STORAGE`
- `MAX_UPLOAD_MB`

### Observações

- `CLIENT_ORIGIN` pode aceitar mais de uma origem separada por vírgula.
- `VITE_API_URL` evita que o frontend fique preso em `localhost` na produção.
- `VITE_WHATSAPP_PHONE` é o espelho público do telefone usado no frontend.
- `MEDIA_STORAGE=cloudinary` é a configuração esperada para produção com mídia externa.

## Login De Desenvolvimento

O projeto suporta login administrativo local pelo fluxo normal de autenticação. Para criar um usuário admin de desenvolvimento, use:

```powershell
npm.cmd run create-admin
```

## Como Testar

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

## Preparação Para Produção

1. Troque `JWT_SECRET` por uma chave forte.
2. Configure `MONGODB_URI` de produção.
3. Configure `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
4. Ajuste `CLIENT_ORIGIN` para o domínio real.
5. Ajuste `VITE_API_URL` para o backend público.
6. Use Cloudinary com `MEDIA_STORAGE=cloudinary` quando a mídia não for local.
7. Rode `npm.cmd run build` antes de publicar.

## Segurança

- Não há segredo real versionado no repositório.
- As variáveis sensíveis ficam em `.env`.
- Fallbacks automáticos existem apenas para desenvolvimento.
- O checkout falha com mensagem clara se Stripe não estiver configurado.

## Status Do Projeto

Projeto pronto para portfólio e apresentação comercial. Ainda depende de ambiente real para validação final de Stripe, Cloudinary e banco de dados em produção.

## Próximas Melhorias

- Upload com progresso visual por arquivo.
- Filtros avançados de pedidos no admin.
- Página pública de prova social e depoimentos.
- Métricas operacionais no painel administrativo.
- Deploy final com domínio público e webhook de produção.
