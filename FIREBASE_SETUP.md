# Instruções para Configurar o Firebase

> [!IMPORTANT]
> O arquivo `environment.ts` foi criado com valores placeholder. Você precisa substituir pelos dados reais do seu projeto Firebase.

## Passo 1: Obter Configurações do Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/)
2. Selecione o projeto `app-carnaval-bhtrans`
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Role até **Seus aplicativos** e clique em **</> (Web)**
5. Copie o objeto de configuração `firebaseConfig`

## Passo 2: Atualizar environment.ts

Abra o arquivo `/home/pegons/apps/app-carnaval/src/environments/environment.ts` e substitua os valores:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "app-carnaval-bhtrans.firebaseapp.com",
    projectId: "app-carnaval-bhtrans",
    storageBucket: "app-carnaval-bhtrans.firebasestorage.app",
    messagingSenderId: "SEU_SENDER_ID_AQUI",
    appId: "SEU_APP_ID_AQUI"
  }
};
```

## Passo 3: Criar Índice no Firestore

Para otimizar as consultas por nome do bloco:

1. No Console do Firebase, vá para **Firestore Database**
2. Clique na aba **Índices**
3. Crie um índice para a coleção `blocos` no campo `nomeDoBloco`

## Funcionalidade Implementada

✅ Upload de arquivo Excel
✅ Visualização dos dados em tabela
✅ Botão "Salvar no Firestore"
✅ Lógica de upsert: atualiza se o bloco já existir (mesmo nome), cria se não existir
✅ Feedback visual com mensagens de sucesso/erro
✅ Contador de registros novos vs atualizados
