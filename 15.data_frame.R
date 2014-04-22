姓名 <- c("amas","bonny","carly")
数学 <- c(100,60,78)
语文 <- c(70,100,98)

成绩单 <- data.frame(姓名,数学,语文)
print(成绩单)

# 重新命名
成绩单 <- data.frame(name=姓名,math=数学,literature=语文)
print(成绩单)


# name as 列
成绩单[1]
成绩单$name
成绩单["name"]
成绩单["name","math"]

# name as 行
成绩单[[1]]
成绩单[,1]

