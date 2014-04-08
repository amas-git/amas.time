import Data.List (genericLength)

f xs = (len, len)
    where
      len :: (Num a) => a
      len = genericLength xs

class Default a 
    where d :: a

instance Default Int    where d = 0
instance Default Bool   where d = False
instance Default (Int a, Bool b)  where d = (1::Int, False)
