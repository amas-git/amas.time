-- fmap :: (a -> b) -> f a -> f b
main = do 
    -- reverse :: String -> String
    -- getLine :: IO String
    -- IO String
    line <- fmap (reverse) getLine
    putStrLn line
