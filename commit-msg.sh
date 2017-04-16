#!/bin/sh

# `commit-msg` hooks do not run in interactive mode.
# `exec < /dev/tty` returns keyboard input back to stdin.
# `exec <&-` puts it back.

exec < /dev/tty
node index.js $1
exec <&-
