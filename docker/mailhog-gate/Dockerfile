FROM node:20-alpine

WORKDIR /app
COPY server.js /app/server.js

ENV PORT=8080
ENV MAILHOG_TARGET=http://mailhog:8025
ENV MAILHOG_GATE_USERNAME=admin
ENV MAILHOG_GATE_PASSWORD=MailUAO2026!

EXPOSE 8080
CMD ["node", "server.js"]
