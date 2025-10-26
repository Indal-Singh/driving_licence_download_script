FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install playwright dependencies
RUN npx playwright install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]