-- LIST MONAD
comprehensive xs ys = [(x,y) | x <- xs, y <- ys]
-- EQUAL TO:
monadic xs ys = do { x <- xs; y <- ys; return (x,y) }
