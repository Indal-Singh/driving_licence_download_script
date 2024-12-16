# Use official Node.js image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy only package.json and install dependencies
COPY package*.json ./
RUN npm install
# browser Installations
RUN npx playwright install
RUN npx playwright install-deps

# Copy the project files to the working directory
COPY . .

# Expose the port (Express default is 3000)
EXPOSE 3001

# Run your app
CMD ["npm", "start"]
