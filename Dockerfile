FROM node:22.16.0-bookworm-slim AS build
WORKDIR /app
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

FROM node:22.16.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/src/data ./src/data
EXPOSE 3000
CMD ["npm", "start"]
