one :: [Int]
one = 1:one

main = do
    print $ take 10 one

-- CALL BY VALUE:
-- take 10 one
-- take 10 (1:one)
-- take 10 (1:(1:one))
-- take 10 (1:(1:(1:one)))
-- ...


-- CALL BY NAME: (OR LAZY EVALUATION)
-- take 10 one
-- take 10 (1:one)
-- take 9  (1:(1:one))
-- ...
-- take 0  (1:(1:(1:(1:(1:(1:(1:(1:(1:[] (one)))))))))))
-- [1,1,1,1,1,1,1,1,1,1]

square :: Int -> Int
square x = x * x
-- CALL BY VALUE:
-- square (1 + 1)
-- square (2)
-- 2 * 2
-- 4

-- CALL BY NAME:
-- square (1 + 1)
-- (1 + 1) * (1 + 1)
-- 2 * (1 + 1)
-- 2 * 2
-- 4
