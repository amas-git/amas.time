# MATRIX
m <- matrix(1:20,nrow = 5)
m
m[1,3:4]

# dimnames(m)
dimnames(m) <- list(c('a','b','c','d','e'), c('p','q','r','s'))
m


list <- read.csv("dir.csv", sep=" ")
list[1]
