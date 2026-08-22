# Production Dockerfile for Backend Service (meets.infiplus.in)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy server code
COPY . .

# Expose backend port
EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

# Start Node.js API Server
CMD ["node", "app.js"]
