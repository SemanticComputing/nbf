# Dockerfile for production

FROM node:9

RUN npm install -g bower grunt-cli serve

RUN mkdir /app && chown node:node /app

WORKDIR /app

USER node

COPY *.json ./


RUN npm install
RUN bower install

EXPOSE 9000

COPY Gruntfile.js ./
COPY src ./src

RUN grunt build

COPY serve.json docs

CMD serve -l 9000 docs
