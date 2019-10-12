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

## Configuración de Docker Compose

El archivo docker-compose.yml definirá nuestros servicios, incluida la aplicación Node y el servidor web. Especificará detalles como volúmenes con nombre, que serán críticos para compartir credenciales SSL entre contenedores, así como información de red y puerto. También nos permitirá especificar comandos específicos para ejecutar cuando se crean nuestros contenedores. Este archivo es el recurso central que definirá cómo nuestros servicios funcionarán juntos.

El archivo va de la siguiente manera, definiendo cada uno de los servicios que este contendrá.

``` docker-compose 
version: '3'

services:
  nodejs:
    build:
      context: .
      dockerfile: Dockerfile
    image: nodejs
    container_name: nodejs
    restart: unless-stopped
    networks:
      - app-network

  webserver:
    image: nginx:mainline-alpine
    container_name: webserver
    restart: unless-stopped
    ports:
      - "8008:8008"
    environment:
      VIRTUAL_HOST: david.localhost
    volumes:
      - web-root:/var/www/html
      - ./nginx-conf:/etc/nginx/conf.d
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    depends_on:
      - nodejs
    networks:
      - app-network

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - web-root:/var/www/html
    depends_on:
      - webserver
    command: certonly --webroot --webroot-path=/var/www/html --email sammy@example.com --agree-tos --no-eff-email --force-renewal -d david.localhost

volumes:
  certbot-etc:
  certbot-var:
  web-root:
    driver: local
    driver_opts:
      type: none
      device: /Users/davidlecodes/Develop/nginx/node_project/views/
      o: bind

networks:
  app-network:
    driver: bridge 
```


## Configurar dominio personalizado

Para esto es necesario entrar a las configuraciónes del sistema en la dirección `/etc/hosts/`y modificar la siguiente linea:

``` bash
127.0.0.1       localhost
```
cambiar por dominio personalizado, ejemplo: 

``` bash
127.0.0.1       atecnologias.localhost
```

``` bash
sudo vim /etc/hosts
```

Una vez hecho eso volvemos a las configuraciones de nuestro `docker-compose.yml` y configuramos nuestro Virtual Host seteando el entrono dentro de nuestro contenedor.

``` Dockerfile
environment:
      VIRTUAL_HOST: atecnologias.localhost
```

## Levantar el servidor Nginx con Docker Compose

Este comando crea los servicios con `docker-compose up` y `-d`para que corra los contenedores de `nodejs y webserver` por detras.
``` bash
docker-compose up -d
```

``` bash
Output
Creating nodejs ... done
Creating webserver ... done
Creating certbot   ... done
```

`docker-compose ps` para poder revisar el status de los servicios.
``` bash
Output
  Name                 Command               State          Ports
------------------------------------------------------------------------
certbot     certbot certonly --webroot ...   Exit 0
nodejs      node app.js                      Up       8080/tcp
webserver   nginx -g daemon off;             Up       0.0.0.0:80->80/tcp
```


Se recrea el `webserver`
``` bash
docker-compose up -d --force-recreate --no-deps webserver
```

Y queda de la siguiente manera en nuestra terminal.

``` bash
Davids-MacBook-Pro:node_project davidlecodes$ docker-compose up -d --force-recreate --no-deps webserver
Recreating webserver ... done
Davids-MacBook-Pro:node_project davidlecodes$ docker-compose ps
  Name                 Command               State                Ports             
------------------------------------------------------------------------------------
certbot     certbot certonly --webroot ...   Exit 1                                 
nodejs      docker-entrypoint.sh node  ...   Up       8080/tcp                      
webserver   nginx -g daemon off;             Up       80/tcp, 0.0.0.0:8008->8008/tcp
```



