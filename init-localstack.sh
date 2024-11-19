#!/bin/bash

aws s3api create-bucket --endpoint-url http://localhost:4566 --bucket media
aws sqs create-queue --endpoint-url http://localhost:4566 --queue-name email
