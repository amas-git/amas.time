#!/bin/zsh
# @author: amas
# @date: 2018-07-25
# @desc:
#
#
#
# 配置文件: ~/.irrc:
# 1. 数据库定义:
# RDS[xxx.host]=exchange.cmvznimubfkb.ap-southeast-1.rds.amazonaws.com
# RDS[xxx.user]=username
# RDS[xxx.port]=3306
# RDS[xxx.password]=password
# RDS[xxx.main]=exchange
#
# $ rds_exec xxx "show databases;"
#-----------------------------------------------------------------------------------[ 加载配置文件 ]
typeset -gA RDS ETH BTC ETC XRP
[[ -f ~/.irrc ]] && source ~/.irrc

#-----------------------------------------------------------------------------------[ 数据库相关 ]
# @note: install awscli by :
# $ suudo pip install awscli
# @region: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html
function genAwsToken() {
    local host=${1}
    local port=${2}
    local region=${3}
    local user=${4}


    aws rds generate-db-auth-token \
       --hostname $host            \
       --port $port                \
       --region $region            \
       --username $user
}



function main() {
    local command=${1:=help}; shift

    (( $+functions[ir_$command] )) && {
        ir_$command "${(@)*}"
    }

}

function ir_help() {
    print "======== TEST ========="
    bitrue.db.describe symbol_rate
    ir.rds
}

function rds.exec() {
    local target=${1:=bitrue}; shift;
    print "$argv" | mysql -h $RDS[$target.host] -P $RDS[$target.port] -u $RDS[$target.user] -p$RDS[$target.password]
}

function rds.login() {
    local target=${1:=bitrue}; shift;
    mysql -h $RDS[$target.host] -P $RDS[$target.port] -u $RDS[$target.user] -p$RDS[$target.password]
}

# 打印表定义
function rds.tables.show() {
    [[ -z $argv ]] && {
        print "$ rds.tables.show <id> <database> <table-name>"
        return -1
    }

    [[ -z $3 ]] && {
        rds.exec $1 "USE ${2:=$RDS[$1.main]}; SHOW TABLES;"
        return
    }
    rds.exec "$1" "USE $2; SHOW FULL COLUMNS FROM $3;" | column -t
}

# 打印本地
function rds.list() {
    for x in bitrue ir; do;
        print "[$x]"
        print "  - user: $RDS[$x.user]"
        print "  - host: $RDS[$x.host]"
        print "  - port: $RDS[$x.port]"
        print "  - pass: $RDS[$x.password]"
        print ""
    done
}

#-----------------------------------------------------------------------------------[ bitrue交易所 ]
alias bitrue.tables.show=rds.tables.show bitrue
# 在交易所exchange数据库上执行SQL
function bitrue.db.exec() {
    local script
    local sql="$argv"
    local dbname="exchange"

    script="use ${dbname}; pager less -SFX; ${(e)sql}";
    #print -u2 $script
    rds.exec bitrue "$script"
}

# 打印交易所数据库中的所有表名
function bitrue.db.tables() {
    bitrue.db.exec "show tables;"
}

# 打印表结构
function bitrue.db.describe() {
    local tbname=$1
    [[ -z $tbname ]] && {
        return -1
    }
    bitrue.db.exec 'describe ${tbname};' | column -t
}



#-----------------------------------------------------------------------------------[ ETH ]
ETH_JSON_RPC=http://127.0.0.1:8545
ETH_JSON_RPC_ID=1
ETH_JSON_RPC_REQ='{"jsonrpc":"2.0","method":"$method","params":[$params],"id":$id}'

# ETH JSONRPC QUANTITY DATA TYPE TO HUMAN READABLE
function QUANTITY() {
    [[ $1 =~ (0x)(.*) ]] && {
        print $((16#$match[2]))
    }
}


function eth.jsonrpc.post() {
    local API=$ETH_JSON_RPC
    [[ -z $API ]] && { print "ETH_JSON_RPC can not be empty!" && exit 1 }
    local method=$1
    local params=$2
    local id=${3:=$ETH_JSON_RPC_ID}
    (( ETH_JSON_RPC_ID+= 1))
    local request=${(e)ETH_JSON_RPC_REQ}

    print "$request TO $API"
    curl -X POST -H "Content-Type: application/json" --data "$request" $API
}

function eth.jsonrpc() {

    function buildParams() {

    }

    local method=$1; shift
    local params=$(buildParams)

    eth.jsonrpc.post $method "$params"
}

function eth.jsonrpc.rpc_modules() {
    eth.jsonrpc.post rpc_modules
}

function eth.jsonrpc.miner_start() {
    eth.jsonrpc.post miner_start $1
}

function eth.jsonrpc.admin_datadir() {
    eth.jsonrpc.post admin_datadir
}

function eth.jsonrpc.admin_peers() {
    eth.jsonrpc.post admin_peers
}

function eth.jsonrpc.web3_sha3() {
    eth.jsonrpc.post web3_sha3 ${(qqq)*}
}

function eth.jsonrpc.net_version() {
    eth.jsonrpc.post net_version
}

function eth.jsonrpc.eth_getBalance() {
    local tag="${2:=latest}"
    eth.jsonrpc.post eth_getBalance ${(qqq)1},${(qqq)tag}
}

# $1 : address
# $2 : tag latest | earliest | pending
function eth.jsonrpc.eth_getTransactionCount() {
    local tag="${2:=latest}"
    eth.jsonrpc.post eth_getTransactionCount ${(qqq)1},${(qqq)tag}
}

# http.post_json $url $json
function http.post_json() {
    local http=$1 && shift
    [[ $http =~ '^http(.*)' ]] || {
        print "'$http' is not validate http address"
        return 1
    }
    local json="$@"

    curl -X POST -H "Content-Type: application/json" --data $json $http
}

#-----------------------------------------------------------------------------------[ BTC ]
BLOCK_INFO_API='https://blockchain.info/q'
function btc.getdifficulty() {
    curl $BLOCK_INFO_API/getdifficulty
}

function btc.getblockcount() {
    curl $BLOCK_INFO_API/getblockcount
}

function btc.latesthash() {
    curl $BLOCK_INFO_API/getblockcount
}

function btc.latesthash() {
    curl $BLOCK_INFO_API/latesthash
}

function btc.blockReword() {
    curl $BLOCK_INFO_API/bcperblock
}

# 总共有多少比特币
function btc.total() {
    curl $BLOCK_INFO_API/totalbc
}

# 计算出一个区块的概率
function btc.probability() {
    curl $BLOCK_INFO_API/probability
}

# hashestowin - Average number of hash attempts needed to solve a block
function btc.hashestowin() {
    curl $BLOCK_INFO_API/hashestowin
}

#nextretarget - Block height of the next difficulty retarget
#avgtxsize - Average transaction size for the past 1000 blocks. Change the number of blocks by passing an integer as the second argument e.g. avgtxsize/2000
#avgtxvalue - Average transaction value (1000 Default)
#interval - average time between blocks in seconds
#eta - estimated time until the next block (in seconds)
#avgtxnumber -