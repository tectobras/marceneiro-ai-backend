FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

ENV PORT 8080

CMD ["node", "index.js"]

