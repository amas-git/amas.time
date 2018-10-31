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
#---------------------------------------------| 0
${JSON.stringify($src.main)}

${hello()}


handler(env, section);

maple: apply(env, params, args)


proxy???

上下文切换发生在1st cmd中,之后就没有上下文了
#---------------------------------------------| @zsh
ls -al /
echo $(date)

for x in {1..100}; do
    <<< ${x}
done
#---------------------------------------------| @node
let x = 1;
console.log(`hello ${x}`);
#---------------------------------------------| @cat | @save /tmp/2.txt
print Hello $USER
print Xe
#---------------------------------------------| @cat /tmp/num.txt
#--------------------------------| @save /tmp/num.txt
#---------------------------| @zsh
print -l {1..100}
