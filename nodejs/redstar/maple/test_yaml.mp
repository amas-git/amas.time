#---------------------------------------------| @func hello
HELLO WORD!!!
#-------------------------| @foreach _.range(1,10)
<${$}>
#---------------------------------------------| @yaml | @upper a b c
name:
 - xiaoming
 - lizhe
#--------------------| @foreach _.range(1,30)
 - "${$}"
#---------------------------------------------|
${JSON.stringify($src.main)}

${hello()}


handler(env, section);

maple: apply(env, params, args)


proxy???

上下文切换发生在1st cmd中,之后就没有上下文了