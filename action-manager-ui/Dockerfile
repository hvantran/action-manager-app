# Stage 1
FROM node:16-alpine as builder
WORKDIR /app
#COPY package.json .
#COPY yarn.lock .
COPY ./build ./build
#RUN yarn install
#RUN yarn build

# Stage 2
FROM nginx:1.23.4-alpine as production
ENV NODE_ENV production
WORKDIR /usr/share/nginx/html/
RUN rm -rf ./*
COPY --from=builder /app/build .
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY ./env.sh .
COPY .env .

# Add bash
RUN apk add --no-cache bash

# Make our shell script executable
RUN chmod +x env.sh

# Start Nginx server
CMD ["/bin/bash", "-c", "./env.sh && nginx -g \"daemon off;\""]