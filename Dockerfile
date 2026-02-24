# Use official Node.js runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (including production ones)
# We need python/make/g++ for better-sqlite3 build if prebuilds miss, but alpine usually needs them
RUN apk add --no-cache python3 make g++ 
RUN npm install

# Copy source code
COPY server.js ./

# Create volume for database
VOLUME /data
ENV DB_PATH=/data/cuckoos.db
ENV PORT=8787

# Expose port
EXPOSE 8787

# Start server
CMD ["node", "server.js"]
