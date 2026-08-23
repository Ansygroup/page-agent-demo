# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app

# Copy only what's needed to run/serve
COPY index.html loader.js serve.mjs build.mjs package.json ./
COPY vendor ./vendor

# Runtime injection reads OPENROUTER_API_KEY from the environment (set in
# the host dashboard). For static hosts, build with: node build.mjs
EXPOSE 4178
ENV PORT=4178
CMD ["node", "serve.mjs"]
