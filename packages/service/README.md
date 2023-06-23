## Configuration

These are the environment variables needed to configure the application.

| Variable                  | Description                                                                                                                                                                                                |                Default Value                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------: |
| `BT_LOG_LEVEL`            | The level of detail at which log data will be written to the event log. Must be one of `trace`, `debug`, `info`, `warn`, `error`, or `fatal`.                                                              |                    `info`                    |
| `BT_MONGO_URI`            | The MongoDB connection string needed to access the MongoDB database.                                                                                                                                       | `mongodb://127.0.0.1:27017/bottomtime-local` |
| `BT_PASSWORD_SALT_ROUNDS` | The number of rounds to use when hashing/salting passwords using the bcrypt algorithm. This number may need to be increased periodically as hardware gets faster to ensure passwords remain hard to crack. |                     `15`                     |
| `BT_PORT`                 | The TCP port number on which the service will listen for requests. This should only set when testing locally. When running the service in a Docker conatier, only the default port (4800) will work.       |                    `4800`                    |
| `NODE_ENV`                | Used to indicate the environment in which the application is running. Setting this to `production` might have implications for how the application is built and runs.                                      |                   `local`                    |
