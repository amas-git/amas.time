data List a = Nil | Cell a (List a)  
   deriving (Show,Eq)

infixr 5 -->
(-->) x Nil             = Cell x Nil
(-->) x cell@(Cell a _) = Cell x (cell) -- very fast operation

size Nil = 0
size (Cell x xs) = 1 + (size xs)

append Nil xs = xs
append xs Nil = xs
append (Cell y ys) xs = y --> (append ys xs)


infixr 5 |+|
(|+|) Nil xs = xs
(|+|) xs Nil = xs
(|+|) (Cell y ys) xs = y --> (append ys xs)


main :: IO ()
main = do
  print $ xs
    where
      ys = 1 --> 2 --> 3 --> Nil
      zs = 0 --> ys
      xs = ys |+| zs
