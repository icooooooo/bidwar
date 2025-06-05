# BIDWAR/bidwar-backend/frontend/Dockerfile
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Cette ligne est cruciale : elle copie le dossier 'build' QUI DOIT ÊTRE PRÉSENT
# DANS BIDWAR/bidwar-backend/frontend/build/
COPY ./build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]