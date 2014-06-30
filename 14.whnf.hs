length' []     = 0
length' (_:xs) = 1 + length' xs

-- try in GHCi:
-- > let x = [1..10]
-- > t
