import Data.Char
import Data.Maybe

-- asso list
lookup' _ [] = Nothing
lookup' t ((k,v):xs)
                 | t == k    = Just v
                 | otherwise = lookup' t xs


evalWord :: String -> Int
evalWord word = sum [ fromJust $ value $ toLower c | c<-word ]
    where value c = lookup' c $ zip ['a'..'z'] $ [1..26] 


main = do
    print $ [(word, evalWord word) | word <- ["attitude", "workhard", "knowledge", "skill", "selfish"]]
