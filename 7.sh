#!/bin/zsh
source='main() { puts("hello world"); }'

function cc_size() {
    local tag=$1
    local src
    local out=$1.out
    
    function size() {
        wc -c $out
    }

    src=$(<&0)
    <<< $src | gcc -xc -o $out - && size
    rm $out
}

<<< $source | cc_size "1"
