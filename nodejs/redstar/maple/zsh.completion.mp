#--------------------------------------------------------------------------| @src
cmd: "hexo",
ops: [
    {name: "-config", desc:"Specify config file instead of using _config.yml"},
    {name: "-debug",  desc:"Display all verbose messages in the terminal"},
    {name: "-silent", desc:"Hide output on console"},
    {name: "-draft",  desc:"Display draft posts"},
    {name: "-safe",   desc:"Disable all plugins and scripts"},
    {name: "-cwd",    desc:"Specify the CWD"}
],
// 字命令
commands: [
    {name: "clean",     desc: "Remove generated files and cache"},
    {name: "config",    desc: "Get or set configurations"},
    {name: "generate",  desc: "Generate static files"},
    {name: "init",      desc: "Create a new Hexo folder"},
    {name: "list",      desc: "List the information of the site"},
    {name: "migrate",   desc: "Migrate your site from other system to Hexo"},
    {name: "publish",   desc: "Moves a draft post from _drafts to _posts folder"},
    {name: "server",    desc: "Start the server"},
    {name: "render",    desc: "Render files with renderer plugins"},
    {name: "version",   desc: "Display version information"},
    {name: "new",       desc: "Create a new post"},
    {name: "help",      desc: "Get help on a command"},
    {name: "deploy",    desc: "Deploy your website"},
]

/*
commands: [
    {name: "create",  desc: "create a new project powered by vue-cli-service"},
    {name: "add",     desc: "install a plugin and invoke its generator in an already created project"},
    {name: "invoke",  desc: "invoke the generator of a plugin in an already created project"},
    {name: "inspect", desc: "inspect the webpack config in a project with vue-cli-service"},
    {name: "serve",   desc: "serve a .js or .vue file in development mode with zero config"},
    {name: "build",   desc: "build a .js or .vue file in production mode with zero config"},
    {name: "ui",      desc: "start and open the vue-cli ui"},
    {name: "init",    desc: "generate a project from a remote template (legacy)"},
]
  Usage: vue <command> [options]

  Options:

    -V, --version                         output the version number
    -h, --help                            output usage information

  Commands:

    create [options] <app-name>           create a new project powered by vue-cli-service
    add <plugin> [pluginOptions]          install a plugin and invoke its generator in an already created project
    invoke <plugin> [pluginOptions]       invoke the generator of a plugin in an already created project
    inspect [options] [paths...]          inspect the webpack config in a project with vue-cli-service
    serve [options] [entry]               serve a .js or .vue file in development mode with zero config
    build [options] [entry]               build a .js or .vue file in production mode with zero config
    ui [options]                          start and open the vue-cli ui
    init [options] <template> <app-name>  generate a project from a remote template (legacy API, requires @vue/cli-init)

*/
#--------------------------------------------------------------------------|
#compdef ${cmd}

_${cmd}() {
    ops=(
#------------------------------------------| @foreach ops
        '-${$.name}[${$.desc}]'
#------------------------------------------|
    )

    _arguments -s $ops[@] '*::${cmd} command:_${cmd}_command'
}

(( $+functions[_${cmd}_command] )) ||
_${cmd}_command() {
    local ret

    # subcommand list
    cmds=(
#------------------------------------------| @foreach commands
        '${name}: ${desc}'
#------------------------------------------|
    )


    # dispatch function
    if (( CURRENT == 1 )); then
        _describe -t ${cmd}-command '${cmd} command' cmds
    else
        local cmd=\${words[1]}
        local curcontext="$curcontext"
        curcontext="\${curcontext%:*:*}:${cmd}-$cmd"
        _call_function ret _${cmd}_command_$cmd || _message "no more arguments after $cmd"
    fi

    return ret
}

#-------------------------------------------| @foreach commands
## ${cmd} ${name}
_${cmd}_command_${name}() {
    ops=(
    )
    _arguments -s \\
        $ops[@] \\
        '*:no args:_files -g \\*'
}

#-------------------------------------------|

# init
_${cmd} "$@"