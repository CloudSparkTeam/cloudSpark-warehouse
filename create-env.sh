#!/bin/bash

# Cria o arquivo .env com o conteúdo
cat <<EOT > .env
DATABASE_URL="postgresql://postgres:cloudSpark@localhost:5432/cloudspark?schema=public"
EOT

# Depois que o arquivo .env foi criado, inicia o aplicativo
npm start
