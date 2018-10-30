#---------------------------------------------| @func hello
HELLO WORD!!!

#---------------------------------------------| @md_block
${section.content]

#-------------------------| @foreach _.range(1,10)
<${$}>
#---------------------------------------------| @yaml
name:
 - xiaoming
 - lizhe
#--------------------| @foreach _.range(1,30)
 - "${$}"
#---------------------------------------------| @echo | @hello $ ooo |
${JSON.stringify($src.main)}

${hello()}


handler(env, section);

maple: apply(env, params, args)