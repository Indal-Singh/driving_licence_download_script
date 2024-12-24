FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install playwright dependencies
RUN npx playwright install
RUN npx playwright install-deps

COPY . .

EXPOSE 3001

CMD ["npm", "start"]