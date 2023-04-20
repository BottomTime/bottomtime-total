FROM node:lts-bullseye-slim AS base

WORKDIR /app

COPY src/ ./src/
COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .

RUN yarn install
RUN ls src/
RUN npx tsc

FROM node:lts-bullseye-slim AS compiled

COPY --from=base /app/dist /app/dist/
COPY --from=base /app/package.json /app
COPY --from=base /app/yarn.lock /app

WORKDIR /app
RUN yarn install --production

FROM node:lts-bullseye-slim AS exec

COPY --from=compiled /app/dist /app/dist/
COPY --from=compiled /app/node_modules /app/node_modules
COPY --from=compiled /app/package.json /app

WORKDIR /app
ENTRYPOINT ["node", "dist/index.js"]
EXPOSE 4800
