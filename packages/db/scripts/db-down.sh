#!/usr/bin/env bash
# Stops the development instance and deletes its containers and volumes. The images stay.
source "$(dirname "$0")/lib.sh"
stop_instance
