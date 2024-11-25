#!/bin/bash

awslocal s3api create-bucket --bucket media
awslocal sqs create-queue --queue-name email
