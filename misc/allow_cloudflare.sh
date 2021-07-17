#!/bin/bash

set -e

cf_ips() {
  echo "# https://www.cloudflare.com/ips"

  for type in v4 v6; do
    echo "# IP$type"
    curl -s "https://www.cloudflare.com/ips-$type" | sed "s|^|allow |g" | sed "s|\$|;|g"
    echo
  done

  echo "# Generated at $(LC_ALL=C date)"
}

cf_ips > allow-cloudflare.conf
(cf_ips && echo "deny all; # deny all remaining ips") > allow-cloudflare-only.conf
