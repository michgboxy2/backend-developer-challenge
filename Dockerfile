FROM node:10.15.1

WORKDIR /usr/src/backend_challenge

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]