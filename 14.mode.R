mode("hello world")
mode(1)
mode(1.0)
mode('a')
mode(1:5)

# 基本统计
xs <- c(0,5,9,14)
ys <- c(5,6,8,9)
zs <- c(5,5,5,5)
## 平均值
mean(xs)
mean(ys)
mean(zs)
## 标准差, 值越大, 表明数据与平均值的差异较大
sd(xs)
sd(ys)
sd(zs)
## 中位数
median(xs)
median(ys)
median(zs)
## 方差
var(xs)
var(ys)
var(zs)
