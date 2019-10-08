# Contenerizar una aplicación de Node.js con servidor Nginx y Docker Compose

Hay varias formas de mejorar la flexibilidad y la seguridad de su aplicación Node.js. El uso de un reverse proxy como Nginx le ofrece la capacidad de cargar solicitudes de equilibrio, almacenar en caché contenido estático e implementar Transport Layer Security (TLS). Habilitar HTTPS encriptado en su servidor asegura que la comunicación hacia y desde su aplicación permanezca segura.

La implementación de un reverse proxy con TLS / SSL en contenedores implica un conjunto diferente de procedimientos de trabajar directamente en un sistema operativo host. Por ejemplo, si estaba obteniendo certificados de Let’s Encrypt para una aplicación que se ejecuta en un servidor, instalaría el software requerido directamente en su host. Los contenedores le permiten adoptar un enfoque diferente. Con Docker Compose, puede crear contenedores para su aplicación, su servidor web y el cliente Certbot que le permitirán obtener sus certificados. Siguiendo estos pasos, puede aprovechar la modularidad y la portabilidad de un flujo de trabajo en contenedores.

## Dockerfile

En el archivo a continuación contiene instrucciones para construir una aplicación Node usando el nodo Docker: imagen 10 y el contenido de su directorio de proyecto actual.

``` Dockerfile
FROM node:10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8080

CMD [ "node", "app.js" ]

```

## Definiendo configuración de servidor web
Con nuestra aplicación Dockerfile en su lugar, podemos crear un archivo de configuración para ejecutar nuestro contenedor Nginx. Comenzaremos con una configuración mínima que incluirá nuestro nombre de dominio, raíz del documento, información de proxy y un bloque de ubicación para dirigir las solicitudes de Certbot al directorio .well-known, donde colocará un archivo temporal para validar que el DNS para nuestro El dominio se resuelve en nuestro servidor.

``` nginx
upstream atecnologias {
  server 127.0.0.1:8080;
}

server {
  listen 80;
  listen [::]:80;

  root /var/www/html;
  index index.html index.htm index.nginx-debian.html;

  server_name atecnologias.localhost;

  location / {
    proxy_pass http://atecnologias;
  }

  location ~ /.well-known/acme-challenge {
    allow all;
    root /var/www/html;
  }
}
```

## Cambiar host
``` bash
sudo vim /etc/hosts
```

