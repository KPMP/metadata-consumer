FROM node:lts-alpine3.10

ARG imageName="files-json-to-mongo"
ARG imageDescription="Add files JSON to package in Mongo"
ARG imageType="worker"
ARG imageOS="alpine"
ARG version="1.0"

LABEL version=$version
LABEL description=$imageDescription
LABEL ImageName=$imageName
LABEL ImageType=$imageType
LABEL ImageOS=$imageOS
LABEL Version=$version

COPY common.js common.js
COPY package.json package.json
COPY job.js job.js

RUN npm install

ENTRYPOINT ["node", "job.js"]
