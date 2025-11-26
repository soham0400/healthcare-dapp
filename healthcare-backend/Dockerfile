FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install
RUN npm ci || npm install

COPY . .

# Expose port
EXPOSE 5000

CMD ["node", "index.js"]