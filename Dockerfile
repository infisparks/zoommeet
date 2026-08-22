# Production Dockerfile for Coolify Deployment
FROM node:20-alpine AS runner

WORKDIR /app

# Install libc6-compat for alpine compatibility if needed
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Next.js static / standalone production bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose Next.js frontend (port 3000) and Node.js API server (port 5000)
EXPOSE 3000
EXPOSE 5000

# Start both Node.js API server (meets.infiplus.in) and Next.js frontend
CMD ["sh", "-c", "node server/app.js & npm run start -- -p 3000"]
