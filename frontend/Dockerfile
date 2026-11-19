FROM node:20-alpine

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

# Any NEXT_PUBLIC_* values needed at build time must be provided as build
# args/env before `npm run build` (the current app has no known requirement).
CMD ["npm", "run", "start"]
