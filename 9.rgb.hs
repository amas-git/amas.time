
data KFC = KFC {k::Int, f::Int, c::Int} 
    deriving (Show)

data RGB = Red Int| Green Int| Blue Int


instance Show RGB where
    show (Red   x) = "R:" ++ (show x)
    show (Green x) = "G:" ++ (show x)
    show (Blue  x) = "B:" ++ (show x)

