#-------------------------------------------------| @json
#-------------------------------------------------| @src
sign: "99",
number: 128,
data: [
    { name: "a", age : 11},
    { name: "b", age : 11},
    { name: "c", age : 12},
    { name: "d", age : 99},
    { name: "e", age : 10},
],

keys: [
    { name: "aa", age : 11},
    { name: "bb", age : 11},
    { name: "cc", age : 12},
    { name: "dd", age : 99},
    { name: "ee", age : 10},
],

com: [
    {
        team: "a",
        people: [
            {name:"a", age:1},
            {name:"b", age:2},
            {name:"c", age:3}
        ]
    },
    {
        team: "B",
        people: [
            {name:"B1", age:11},
            {name:"B2", age:22},
            {name:"B3", age:33}
        ]
    }
],

id: [1,2,3,4,5,[3,3,3]]
#-------------------------------------------------| qq
${$}
#-------------------------------------------------| @e
This is good ${number} ${id} ${_("qq")(sign)}
#-------------------------------------------------| @foreach keys
${name}'s age is ${age}!
#-------------------------------------------------| @foreach com
We have team: '${team}' to success!!!
#-------------------------------------------------| @foreach com[0].people
${name} age of ${age}
#-------------------------------------------------| @echo n
Hello this is ${people.name}!
#-------------------------------------------------| @match  /id/*
The root number is : 1_${$}
#-------------------------------------------------| @foreach id
:${$}
#-------------------------------------------------| @echo
Hello World!
#-------------------------------------------------| @match  /**
${"    ".repeat(CONTEXT.level)} ${_("qq")(ID)} : ${JSON.stringify($)}