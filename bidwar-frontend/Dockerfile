# frontend/Dockerfile
# Étape 1: Construire l'application React (si vous voulez builder dans Docker)
# FROM node:18-alpine as builder
# WORKDIR /app
# COPY package.json yarn.lock ./
# RUN yarn install
# COPY . .
# RUN yarn build

# Étape 2: Servir avec Nginx
FROM nginx:alpine
# COPY --from=builder /app/build /usr/share/nginx/html # Si build dans Docker
COPY ./build /usr/share/nginx/html 
COPY ./nginx.conf /etc/nginx/conf.d/default.conf 
CMD ["nginx", "-g", "daemon off;"]