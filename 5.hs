import System.IO

cat file = do
    content <- readFile file
    putStr content

main = do
    cat "5.hs"