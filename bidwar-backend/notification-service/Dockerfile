FROM node:18-alpine

WORKDIR /usr/src/app-notification

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE ${PORT_NOTIFICATION:-3003} 
CMD [ "node", "server.js" ]