FROM node:lts-alpine3.10

ARG imageName="pentaho-to-elasticsearch-worker"
ARG imageDescription="ETL from Pentaho metadata and Data Lake packages to Elasticsearch"
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
COPY constants.json constants.json
COPY package.json package.json
COPY job.js job.js

RUN npm install

ENTRYPOINT ["node", "job.js"]
