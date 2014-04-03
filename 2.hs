import Prelude hiding (gcd)

gcd Integral a => a -> a -> a
gcd m 0       = m
gcd m n
  | m > n     = gcd n $ m `mod` n
  | otherwise = gcd m $ n `mod` m
