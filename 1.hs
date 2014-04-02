isPrime :: Integral a => a -> Bool
isPrime n = null [ x | x <- [2..(floor $ sqrt(fromIntegral $ n))], n > 3, (n `mod` x) == 0 ]

main :: IO ()
main = do
  print $ [x | x<-[1..10000], isPrime x]
