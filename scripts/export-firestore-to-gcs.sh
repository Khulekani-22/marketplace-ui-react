#!/usr/bin/env bash
set -euo pipefail

# Edit these if your project or key path differ
PROJECT_ID="sloane-hub"
SA_KEY="secrets/sloane-hub-service-account.json"
BUCKET_LOCATION="US"  # change to your preferred location e.g. us-central1

if [ ! -f "$SA_KEY" ]; then
  echo "Service account key not found at $SA_KEY"
  echo "Place the JSON key at $SA_KEY or update SA_KEY in this script."
  exit 1
fi

echo "Authenticating with service account: $SA_KEY"
gcloud auth activate-service-account --key-file="$SA_KEY"

echo "Setting project: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "Enabling Firestore Admin API (if not already enabled)"
gcloud services enable firestore.googleapis.com

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
if [ -z "$PROJECT_NUMBER" ]; then
  echo "Failed to determine project number for $PROJECT_ID"
  exit 1
fi

BUCKET_NAME="${PROJECT_ID}-firestore-backups-$(date +%Y%m%d-%H%M%S)-$RANDOM"

echo "Creating bucket: gs://$BUCKET_NAME (location: $BUCKET_LOCATION)"
gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$BUCKET_LOCATION" "gs://$BUCKET_NAME"

echo "Granting Firestore service account storage.admin role on gs://$BUCKET_NAME"
gsutil iam ch "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-firestore.iam.gserviceaccount.com:roles/storage.admin" "gs://$BUCKET_NAME"

EXPORT_PATH="gs://$BUCKET_NAME/exports/$(date +%Y%m%d_%H%M%S)"

echo "Starting Firestore export to: $EXPORT_PATH"
gcloud firestore export "$EXPORT_PATH"

echo "Export command submitted. Check Cloud Console or use 'gcloud firestore operations list' to monitor."

# End of script
