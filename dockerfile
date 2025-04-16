# Dependencias
FROM node:21-alpine3.19 as deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install




# Builder - Construye la aplicación
FROM node:21-alpine3.19 as build
WORKDIR /usr/src/app

# Copiar de deps, los módulos de node
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package*.json ./

# Copiar todo el codigo fuente de la aplicación
COPY . .

# Generar cliente de prisma
RUN npx prisma generate

# RUN npm run test
RUN npm run build
RUN npm ci -f --only=production && npm cache clean --force




# Crear la imagen final de Docker
FROM node:21-alpine3.19 as prod
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist


ENV NODE_ENV=production
USER node