#!/usr/bin/env bash

# Deploy the static assets for the front-end.
aws s3 sync ../packages/web/dist/client/ s3://$(terraform output -raw web_cf_bucket) --delete --exclude index.html
aws cloudfront create-invalidation \
    --distribution-id $(terraform output -raw web_cf_distribution) \
    --paths "/*"

echo "🎉 Static assets have been deployed and caches have been invalidated!! 🎉"
echo "     Note: It may take Cloudfront several minutes to invalidate the cache."
