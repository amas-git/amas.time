mean(1:10)
sqrt(1:10)

m <- matrix(1:16,ncol=4)
m

m <- matrix(1:16,ncol=3)
m

m <- 1:10
# %% 2
m %% 2

# odd numbers
m[c(TRUE,FALSE)]
m[m %% 2 == 1]

# even numbers
m[c(FALSE,TRUE)]
m[m %% 2 == 0]

# NA   :
# NULL :
m <- c(1,2,NA,5)
mean(m)
mean(m,na.rm=T)

m[m>0]              # with NA
subset(m,m>0)       # without NA

# find the position of 'a' in m
m <- c('a','b','c')
which(m == 'a')

# ifelse(c,if,else)
oddeven <- function(n) {
   return(ifelse(n%%2 == 0,"偶", "奇"))
}

oddeven(3)
oddeven(0)


diff(1:10)
diff(seq(1,10,2))
diff(seq(1,10,3))
diff(seq(1,10,4))
diff(seq(1,10,5))

xs       <- c(1,2,3,4,5,6)
names(xs) <- c("一","二","三","四","五","六")
xs
xs["三"]