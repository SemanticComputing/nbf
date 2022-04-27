# Dockerfile for production

FROM node:9

RUN npm install -g bower@1.8.14 grunt-cli@1.4.3 serve@12.0.1

WORKDIR /app

COPY *.json ./
COPY Gruntfile.js ./
COPY src ./src

RUN chown -R node:node .

USER node

RUN npm install
RUN bower install

RUN grunt build

COPY serve.json ./docs

EXPOSE 9000

CMD serve -l 9000 docs