# Regra de Deploy

## Deploy SEMPRE via GitHub

- **NUNCA** usar `npx vercel --prod` ou `vercel deploy` diretamente pela CLI.
- **SEMPRE** fazer deploy via push no GitHub, na branch **`main`**.
- O fluxo correto é:
  1. `git add .`
  2. `git commit -m "mensagem descritiva"`
  3. `git push origin main`
- A Vercel detecta o push automaticamente e faz o deploy via GitHub Integration.
- Deploys pela CLI criam deployments com Deployment Protection ativa, bloqueando visitantes externos.
