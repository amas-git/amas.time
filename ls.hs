import System.Directory
import System.FilePath
import System.Environment (getArgs)
import Control.Monad

ls target = do
    children <- getDirectoryContents target
    let xs = filter (\x -> not $ x `elem` [".",".."]) children
    paths <- forM xs $ \x -> do
            let isDir = doesDirectoryExist x
                    if isDir
    return xs

main = do
    (dir:_) <- getArgs
    ls dir
