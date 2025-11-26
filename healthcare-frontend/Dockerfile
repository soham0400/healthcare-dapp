FROM node:22

WORKDIR /app

# Fix Vite+Rollup crash inside Docker
ENV ROLLUP_SKIP_NODE_BINS=1

COPY package.json package-lock.json ./

RUN npm install --legacy-peer-deps

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
