FROM node:20-alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat
WORKDIR /app
COPY backend/package.json ./
RUN npm install --ignore-scripts
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/src ./src
EXPOSE 3001
ENV NODE_ENV=production
CMD npx prisma db push --skip-generate && node prisma/seed.js; node src/index.js
