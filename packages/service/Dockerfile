FROM node:lts-bullseye-slim AS base

WORKDIR /app

COPY src/ ./src/
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .

RUN yarn install && yarn build

FROM node:lts-bullseye-slim AS compiled

WORKDIR /app
COPY --from=base /app/dist ./dist/
COPY --from=base /app/package.json .
COPY --from=base /app/yarn.lock .

RUN yarn install --production

FROM node:lts-bullseye-slim AS exec

WORKDIR /app
COPY --from=compiled /app/dist ./dist/
COPY --from=compiled /app/node_modules ./node_modules
COPY --from=compiled /app/package.json .

ENTRYPOINT ["node", "dist/index.js"]
EXPOSE 4800
