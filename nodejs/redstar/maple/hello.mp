#-------------------------------------------------| @js
people={
    number: 1,
    data: [
        { name: "a", age : 11},
        { name: "b", age : 11},
        { name: "c", age : 12},
        { name: "d", age : 99},
        { name: "e", age : 10},
    ]
}
#-------------------------------------------------| @e people.data
This is good ${$.name} is ${$.age}
#-------------------------------------------------| @echo n
Hello this is ${people.name}!