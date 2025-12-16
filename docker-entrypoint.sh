#!/bin/sh
set -e

urlencode() {
  printf '%s' "$1" | awk 'BEGIN {
    for(n=0;n<256;++n) ord[sprintf("%c",n)]=n
  }
  {
    for(i=1;i<=length($0);i++) {
      c=substr($0,i,1)
      if(c~/[a-zA-Z0-9.~_-]/) printf "%s",c
      else printf "%%%02X",ord[c]
    }
  }'
}

encoded_password=$(urlencode "$DB_PASSWORD")

export DATABASE_URL="postgresql://${DB_USER}:${encoded_password}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting app..."
exec "$@"