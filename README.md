# cloudSpark-warehouse
# Serviço Backend

Este serviço é responsável por operações de backend, armazenamento de imagens, acesso a elas, etc.

**Primeiramente, certifique-se de ter o Node.js e o npm instalados no seu ambiente de desenvolvimento.**

Se ainda não tiver, acesse [Node.js](https://nodejs.org/pt) e faça o download da versão mais recente.

## Como Rodar

Siga os passos abaixo para rodar o backend localmente:

1. **Clone o repositório:**

    Clone o projeto utilizando o comando:

    ```bash
    git clone https://github.com/CloudSparkTeam/cloudSpark-warehouse.git
    ```

2. **Navegue até a pasta do projeto:**

    Vá até o diretório onde o repositório foi clonado:

    ```cmd
    cd cloud-spark-warehouse
    ```

3. **Instale as dependências:**

    Execute o seguinte comando para instalar todas as dependências necessárias:

    ```cmd
    npm install
    ```

4. **Configurar o banco de dados PostgreSQL:**

    Você pode usar o PostgreSQL localmente ou via Docker. Siga as instruções de acordo com sua escolha.

    ### Usando Docker:

    1. **Inicie um container PostgreSQL:**

       Execute o seguinte comando para rodar o PostgreSQL usando Docker:

       ```bash
       docker run --name cloudSpark-postgres -e POSTGRES_PASSWORD=<SENHA> -p 5432:5432 -d postgres
       ```

    2. **Crie o banco de dados `cloudSpark`:**

       Acesse o container para criar o banco de dados:

       ```bash
       docker exec -it cloudSpark-postgres psql -U postgres
       ```

       Em seguida, dentro do shell do PostgreSQL, execute:

       ```sql
       CREATE DATABASE cloudSpark;
       ```

    ### Usando um servidor PostgreSQL local:

    1. **Instale o PostgreSQL:**

       Siga as instruções do site oficial [PostgreSQL](https://www.postgresql.org/download/) para instalar o PostgreSQL no seu sistema.

    2. **Crie o banco de dados `cloudSpark`:**

       Após instalar, crie o banco de dados com o seguinte comando no terminal:

       ```bash
       createdb cloudSpark
       ```

5. **Configure o arquivo `.env`:**

    Crie um arquivo `.env` na raiz do projeto e adicione a seguinte linha, substituindo `<NOME_USER>` e `<SENHA>` pelas credenciais do seu banco de dados:

    ```env
    DATABASE_URL="postgresql://<NOME_USER>:<SENHA>@localhost:5432/cloudSpark?schema=public"
    ```

6. **Rodar as migrações e gerar o cliente Prisma:**

    Execute os seguintes comandos para rodar as migrações e gerar o cliente Prisma:

    ```bash
    npx prisma migrate dev --name init
    ```

    Depois, execute:

    ```bash
    npx prisma generate
    ```

7. **Inicie o servidor:**

    Finalmente, execute o comando para iniciar o servidor:

    ```cmd
    npm start
    ```

    O servidor será iniciado na porta `3002`. Você verá a seguinte mensagem confirmando que o servidor está rodando:

    ```cmd
    Servidor está rodando em http://localhost:3002
    ```