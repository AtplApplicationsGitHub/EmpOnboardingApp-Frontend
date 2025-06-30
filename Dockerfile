FROM nginx:1.23.4-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY out/ .
CMD ["nginx", "-g", "daemon off;"]
