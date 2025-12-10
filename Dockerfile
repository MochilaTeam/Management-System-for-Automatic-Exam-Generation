FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 5000

ENV LOG_LEVEL=debug

CMD ["npm", "run", "dev"]
