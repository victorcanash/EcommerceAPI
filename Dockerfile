FROM node:18 AS base
RUN apk --no-cache add dumb-init
RUN mkdir -p /home/node/app && chown node:node /home/node/app
WORKDIR /home/node/app
USER node
RUN mkdir tmp

FROM base AS dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci
COPY --chown=node:node . .

FROM dependencies AS build
RUN node ace build --production

FROM base AS production
ENV NODE_ENV=development
ENV PORT=8080
ENV HOST=https://ecommercevcapi1-victorcanas972.b4a.run
COPY --chown=node:node ./package*.json ./
RUN npm ci --production
COPY --chown=node:node --from=build /home/node/app/build .
EXPOSE 8080
CMD [ "dumb-init", "node", "server.js" ]
