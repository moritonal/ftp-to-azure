FROM node:12-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache make gcc g++ python && \
  npm install --production --silent && \
  apk del make gcc g++ python

EXPOSE 21 30000-30009 80

ENTRYPOINT [ "node", "index.js" ]