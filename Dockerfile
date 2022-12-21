FROM node:19.2.0-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn add glob rimraf webpack

RUN yarn --only=development

COPY . .

RUN yarn run build

FROM node:19.2.0-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn --only=production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]



