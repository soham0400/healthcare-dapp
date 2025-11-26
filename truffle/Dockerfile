FROM node:18

WORKDIR /app

# Copy truffle config and contracts
COPY truffle-config.js /app/
COPY contracts /app/contracts
COPY migrations /app/migrations
COPY truffle/copy-artifacts.js /app/
COPY truffle/entry.sh /app/

# Install Truffle globally
RUN npm install -g truffle

# Make entry script executable
RUN chmod +x /app/entry.sh

CMD ["sh", "/app/entry.sh"]