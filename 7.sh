#!/bin/zsh
source='main() { puts("hello world"); }'

function cc_size() {
    local tag=$1
    local out=$1.out
    
    function size() {
        wc -c $out
    }

    <<< $(<&0) | gcc -xc -o $out - && size && rm $out
}

<<< $source | cc_size "1"
