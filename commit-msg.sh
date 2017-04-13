#!/bin/sh

exec < /dev/tty
node index.js $1
exec <&-