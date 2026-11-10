FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs game.mjs map.mjs ./
COPY public ./public
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "server.mjs"]
