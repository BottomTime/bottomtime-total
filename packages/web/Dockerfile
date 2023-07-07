FROM node:lts-bullseye-slim AS base

WORKDIR /app

COPY src/ ./src/
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY vue.config.js .

RUN yarn install && yarn build

FROM nginx AS exec

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=base /app/dist /usr/share/nginx/html

EXPOSE 3000
