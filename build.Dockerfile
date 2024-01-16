FROM --platform=arm64 oven/bun:alpine as builder
WORKDIR /usr/src/app

COPY package.json ./

RUN apk add --update chromium
RUN apk -e info chromium

ENV CHROME_PATH='/usr/bin/chromium'
ENV HOST 'k8s'
RUN bun install

COPY . .
ENV TZ="America/Los_Angeles"