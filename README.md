# App Carnaval BHTrans 🎭

Sistema de gestão de blocos de carnaval desenvolvido em Angular 21 com integração ao Firebase Firestore.

## 🚀 Funcionalidades

- **Importação de Excel**: Carregue arquivos `.xlsx` ou `.xls` com informações dos blocos
- **Visualização de Dados**: Exiba os dados importados em uma tabela responsiva
- **Firebase Integration**: Salve e sincronize dados no Firestore
- **Upsert Logic**: Atualiza blocos existentes ou cria novos automaticamente
- **Interface Moderna**: Design responsivo com gradientes e animações

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- Angular CLI 21
- Conta do Firebase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/pegonsLog/app-carnaval-bhtrans.git
cd app-carnaval-bhtrans
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Configure o Firebase:
   - Copie suas credenciais do Firebase Console
   - Edite `src/environments/environment.ts`
   - Substitua os valores placeholder pelas suas credenciais

4. Inicie o servidor de desenvolvimento:
```bash
ng serve
```

5. Acesse `http://localhost:4200`

## 📁 Estrutura do Projeto

```
src/app/
├── components/
│   ├── header/          # Cabeçalho com navegação
│   └── excel-upload/    # Componente de upload e importação
├── pages/
│   └── home/            # Página inicial
├── services/
│   └── blocos.ts        # Serviço Firebase para blocos
└── interfaces/
    └── blocos.interface.ts  # Interface TypeScript dos blocos
```

## 🎨 Tecnologias Utilizadas

- **Angular 21**: Framework frontend
- **Firebase Firestore**: Banco de dados NoSQL
- **XLSX**: Biblioteca para leitura de arquivos Excel
- **SCSS**: Pré-processador CSS
- **TypeScript**: Linguagem de programação
- **Montserrat**: Fonte tipográfica

## 📝 Configuração do Firebase

Veja o arquivo [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para instruções detalhadas de configuração.

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças importantes, abra uma issue primeiro para discutir o que você gostaria de mudar.

## 📄 Licença

MIT

## 👤 Autor

**PegonsLog**
- GitHub: [@pegonsLog](https://github.com/pegonsLog)

---

Desenvolvido com ❤️ usando Angular e Firebase
