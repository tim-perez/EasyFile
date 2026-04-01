# STAGE 1: Build the React app using Node
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies cleanly
COPY package*.json ./
RUN npm ci

# Copy the rest of the frontend code and build it for production
COPY . .
RUN npm run build

# STAGE 2: Serve the app using Nginx
FROM nginx:alpine

# Copy the compiled React files from Stage 1 into the Nginx web directory
COPY --from=build /app/dist /usr/share/nginx/html

# CRITICAL FOR REACT ROUTER: Tell Nginx to redirect all 404s to index.html
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80