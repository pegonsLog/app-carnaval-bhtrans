# Configuração de Environment

Esta pasta contém as configurações de ambiente para o projeto.

## Setup Inicial

1. Copie os arquivos template:
   ```bash
   cp environment.template.ts environment.ts
   cp environment.prod.template.ts environment.prod.ts
   ```

2. Edite os arquivos copiados e substitua os valores placeholder pelas suas credenciais reais do Firebase:
   - `YOUR_API_KEY_HERE`
   - `YOUR_PROJECT_ID`
   - `YOUR_MESSAGING_SENDER_ID`
   - `YOUR_APP_ID`

## Arquivos

- `environment.template.ts` - Template para desenvolvimento
- `environment.prod.template.ts` - Template para produção
- `environment.ts` - Configuração de desenvolvimento (não versionado)
- `environment.prod.ts` - Configuração de produção (não versionado)

## Importante

⚠️ **Nunca commite os arquivos `environment.ts` e `environment.prod.ts`** - eles contêm credenciais sensíveis e estão no .gitignore por segurança.