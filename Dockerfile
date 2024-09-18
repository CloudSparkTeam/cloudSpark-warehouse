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

# Exponha a porta que o app vai rodar (caso necessário)
EXPOSE 3002

# Comando para rodar a aplicação
CMD ["npm", "start"]
