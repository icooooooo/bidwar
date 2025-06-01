FROM node:18-alpine

# Créez le répertoire de l'application
WORKDIR /usr/src/app-notification

# Copiez package.json et package-lock.json (si vous en avez)
# S'il n'y a pas encore de package.json, cette étape peut être omise ou adaptée
COPY package*.json ./

# Installez les dépendances (s'il y a un package.json)
# Si pas de package.json, vous pouvez omettre cette ligne ou l'adapter
# RUN npm install --only=production # Ou juste npm install

# Copiez le reste du code de l'application
COPY . .

# Le port sur lequel votre service de notification écoutera (s'il en a un, sinon pas besoin d'EXPOSE)
# EXPOSE ${PORT_NOTIFICATION:-3003}

# La commande pour démarrer votre application
# Si vous n'avez pas encore de server.js, vous pouvez mettre une commande temporaire
# ou commenter CMD jusqu'à ce que vous ayez le code.
# CMD [ "node", "server.js" ]
CMD ["tail", "-f", "/dev/null"]