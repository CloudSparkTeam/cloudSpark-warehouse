# Dockerfile

# Use uma imagem base do Node.js
FROM node:16

# Defina o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie o package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante dos arquivos da aplicação
COPY . .

# Adicione o script para criar o .env
COPY create-env.sh ./create-env.sh
RUN chmod +x create-env.sh

# Exponha a porta que o app vai rodar (caso necessário)
EXPOSE 3002

# Comando para rodar a aplicação
CMD ["bash", "create-env.sh"]
