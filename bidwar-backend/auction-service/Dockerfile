FROM node:18-alpine
WORKDIR /usr/src/app-auction # Nom de dossier interne différent pour éviter confusion si on inspecte
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE ${PORT_AUCTION:-3002}
CMD [ "node", "server.js" ]