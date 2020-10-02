# Real Time Chat Application [Backend]

Sample project for real time chat application using node js, react js, mongodb, redis technologies.

There are two different project for the backend and frontend.

## Available Scripts Run BackEnd

First need to create a `.env` file in project base path and add following environment variables in the file.

`MONGO_INITDB_ROOT_USERNAME=`

`MONGO_INITDB_ROOT_PASSWORD=`

`MONGO_INITDB_DATABASE=`

`MONGO_HOST=`

`MONGO_PORT=`

`REDIS_HOST=`

`REDIS_PORT=`

For run application, go the project base directory run the docker compose file.

### `docker-compose up -d`

Three containers ( nodejs / mongo / redis ) will be up and running.

To run the node application, go the nodejs container terminal execute `npm start`.

Use following command for access nodejs terminal.

`docker ps` : get the container id

`docker exec -it [container_id] /bin/bash`: go the nodejs container terminal

`npm start`: start the backend application


