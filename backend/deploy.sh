#!/bin/bash

# Build the container image
echo "Building container image..."
gcloud builds submit --tag gcr.io/dev-projects-443423/cocktail-ai:latest

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy cocktail-ai --image gcr.io/dev-projects-443423/cocktail-ai:latest --project dev-projects-443423 --region us-east1

echo "Deployment complete."