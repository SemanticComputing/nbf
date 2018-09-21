#!/bin/bash

set -euo pipefail
D="$(readlink -f "$(dirname "$0")")"
while [ $# -gt 0 ] && [[ $1 =~ ^-.* ]]; do
    case $1 in
        --debug) set -x; shift;;
        -*) shift;;
    esac
done


# Variables
IMAGE="www-nbf"
CONTAINER_NAME="$IMAGE"
IP="172.30.20.50"
CONTAINER_PORT="9000"
PORT="9000"
NETWORK="seco"
NETWORK_CIDR="172.30.20.0/22"
CONTAINER_USER="$UID"
DOCKER_ENV_FILE=""
VOLUME_SOURCE_1="$(readlink -f "${1:-"$D/vol-1"}")"
VOLUME_TARGET_1=""
VOLUME_SOURCE_2="$(readlink -f "${2:-"$D/vol-2"}")"
VOLUME_TARGET_2=""
VOLUME_SOURCE_3="$(readlink -f "${3:-"$D/vol-3"}")"
VOLUME_TARGET_3=""




# Create the bind mount points if not exist
[ -z "$VOLUME_TARGET_1" ] || [ -d "$VOLUME_SOURCE_1" ] || mkdir -p "$VOLUME_SOURCE_1"
[ -z "$VOLUME_TARGET_2" ] || [ -d "$VOLUME_SOURCE_2" ] || mkdir -p "$VOLUME_SOURCE_2"
[ -z "$VOLUME_TARGET_3" ] || [ -d "$VOLUME_SOURCE_3" ] || mkdir -p "$VOLUME_SOURCE_3"

# Create docker network if it does not exist
[ -z "$NETWORK" ] || docker network inspect "$NETWORK" > /dev/null 2>&1 || docker network create --subnet $NETWORK_CIDR $NETWORK;

# Run the container
DOCKER_CMD=
DOCKER_CMD="docker run -it --rm"
DOCKER_CMD+=${CONTAINER_NAME:+' --name "$CONTAINER_NAME"'}
DOCKER_CMD+=${CONTAINER_USER:+' -u "$CONTAINER_USER"'}
DOCKER_CMD+=${NETWORK:+' --network "$NETWORK"'}
DOCKER_CMD+=${IP:+' --ip "$IP"'}
DOCKER_CMD+=${CONTAINER_PORT:+' --publish "$PORT:$CONTAINER_PORT"'}
DOCKER_CMD+=${CONTAINER_PORT:+' --expose "$CONTAINER_PORT"'}
DOCKER_CMD+=${DOCKER_ENV_FILE:+' --env-file="$DOCKER_ENV_FILE"'}
DOCKER_CMD+=${VOLUME_TARGET_1:+' --mount "type=bind,source=$VOLUME_SOURCE_1,target=$VOLUME_TARGET_1"'}
DOCKER_CMD+=${VOLUME_TARGET_2:+' --mount "type=bind,source=$VOLUME_SOURCE_2,target=$VOLUME_TARGET_2"'}
DOCKER_CMD+=${VOLUME_TARGET_3:+' --mount "type=bind,source=$VOLUME_SOURCE_3,target=$VOLUME_TARGET_3"'}
DOCKER_CMD+=' $IMAGE'
eval "$DOCKER_CMD"
{ set +x; } 2> /dev/null
