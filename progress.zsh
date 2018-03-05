#!/bin/zsh


function progress() {
    print -n $1'\r'
    sleep 1
}

for i in {1..100}; do
    progress $i
done
