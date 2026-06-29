# 🚀 eight — Etapa 1: rodar a rede no seu computador

Olá, Diego! Este pacote é o **esqueleto da rede eight** com as duas telas
(entrada/login + feed) já funcionando. Ainda **sem banco e sem login real** —
isso vem nas próximas etapas. O objetivo agora é simples: **ver a rede rodando
na sua máquina.**

---

## 📁 PASSO 1 — Colocar os arquivos na pasta

1. Extraia este ZIP (botão direito → "Extrair tudo")
2. Abra a pasta extraída
3. **Selecione tudo** (Ctrl+A) e **copie** (Ctrl+C)
4. Vá até a pasta que você já criou: `C:\Users\diego\Documents\eight`
5. **Cole** (Ctrl+V) lá dentro

No fim, dentro de `eight` você deve ver: `package.json`, `src`, `tsconfig.json`
e os outros arquivos — soltos na raiz da pasta (NÃO dentro de outra subpasta).

---

## ⚙️ PASSO 2 — Abrir o PowerShell na pasta

1. Abra a pasta `eight` no Windows Explorer
2. Clique na barra de endereço, apague o que tem, digite `powershell` e dê Enter
3. Vai abrir o PowerShell já dentro da pasta certa

---

## 📦 PASSO 3 — Instalar (uma vez só)

Cole **este comando sozinho** e dê Enter. Vai demorar 1-2 minutos:

```
npm install
```

Espere terminar (vai aparecer algo como "added X packages").

---

## ▶️ PASSO 4 — Rodar a rede

Agora cole **este comando sozinho** e dê Enter:

```
npm run dev
```

Quando aparecer **"Ready"** e um endereço `http://localhost:3000`,
abra o navegador e acesse:

- **http://localhost:3000** → a tela de entrada (login estilo X, com a sua marca)
- **http://localhost:3000/feed** → o feed da rede (dá pra publicar, curtir, seguir)

> 💡 Clicar em "Criar conta profissional" ou "Entrar" te leva direto pro feed
> (por enquanto é só navegação — o login de verdade entra na Etapa 3).

Pra **parar** o servidor: clique no PowerShell e aperte `Ctrl + C`.

---

## ✅ O que já está pronto nesta etapa

- Projeto Next.js 14 (App Router) + TypeScript + Tailwind — o mesmo stack do app
- Tela de entrada `/` com a identidade da eight
- Feed `/feed` interativo (publicar, curtir, repostar, seguir) — com dados de exemplo
- SEO básico e fontes da marca

## 🔜 Próximas etapas (a gente faz juntos)

- **Etapa 2:** banco de dados (Prisma + PostgreSQL) — posts e perfis de verdade
- **Etapa 3:** login real (Auth.js — Google, Apple, e-mail) + verificação do registro
- **Etapa 4:** subir pro ar no Railway e ligar no domínio `doctor8.com.br` (Cloudflare)

---

## ❓ Se algo der errado

- **"npm não é reconhecido"** → o Node.js não está instalado nessa máquina. Me avise.
- **Erro no `npm install`** → tire um print da tela do PowerShell e me mande.
- **A página abre sem as cores/fontes certas** → confira se você tem internet
  (as fontes carregam da web). Me mande um print do que apareceu.

Qualquer coisa, manda o print que a gente resolve. 💪
