1.isPrime :: Integral a => a -> Bool
isPrime 1 = False
isPrime 2 = True
isPrime 3 = True
isPrime n = null [ x | x <- [2..(floor $ sqrt(fromIntegral $ n))], (n `mod` x) == 0 ]

main :: IO ()
main = do
  print $ [x | x<-[1..10000], isPrime x]
