FROM node:20-alpine

WORKDIR /app
COPY package*.json server.js ./
RUN npm ci --omit=dev
COPY html ./html

ENV PORT=80
ENV NODE_ENV=production

EXPOSE 80
CMD ["node", "server.js"]
