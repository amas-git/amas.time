data Tree a = EmptyTree | Node a (Tree a) (Tree a)
            deriving (Show)

toNode x = Node x EmptyTree EmptyTree

infixr 5 <+>
(<+>) x EmptyTree = toNode x
(<+>) x n@(Node _ _ _) = Node x n EmptyTree

fromList [] = EmptyTree
fromList (x:xs) = x <+> (fromList xs)

toList EmptyTree = []
toList (Node n EmptyTree r@(_)) = n : (toList r)
toList (Node n l@(_) EmptyTree) = n : (toList l)
toList (Node n l@(_) r@(_)) = n : ((toList l) ++ (toList r))


showTree t = draw 0 t
  where
    draw n EmptyTree = (indent n) ++ "+\n"
    draw n (Node x l@(_) r@(_)) = (indent n) ++ "+--:" ++ (show x) ++ "\n" ++ (draw (n+1) l) ++ (draw (n+1) r)
    indent n = take (n*3) (repeat ' ')
