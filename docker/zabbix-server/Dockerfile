FROM zabbix/zabbix-server-pgsql:alpine-6.0-latest

LABEL org.opencontainers.image.title="Proyecto 7 Zabbix Server"
LABEL org.opencontainers.image.description="Imagen personalizada para el servidor Zabbix del proyecto de monitoreo de infraestructura"
LABEL org.opencontainers.image.authors="Juan Camilo Ballesteros Sierra, Luis Felipe Murillo Matallana, Juan Sebastian Delgado, Daniela Castro Quinones"

COPY zabbix_server.conf.d/proyecto7.conf /usr/share/proyecto7-zabbix/proyecto7.conf

