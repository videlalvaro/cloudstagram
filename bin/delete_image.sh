#!/bin/sh

HOST="http://cloudstagram.cloudfoundry.com"

while getopts d:i o
do
    case "$o" in
        i) IMAGE="$OPTARG";;
        d) HOST="http://localhost:3000";;
        ?) echo "Usage: $0 [-d] [-i image] "
            exit 1;;
    esac
done

curl -X POST $HOST/delete/image/$IMAGE
