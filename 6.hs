import System.Environment (getArgs)
import System.Directory (getDirectoryContents)
import Text.Regex.Posix

ls :: FilePath -> String -> IO [FilePath]
ls path pattern = do
    xs <- getDirectoryContents path
    return $ [x|x <- xs, (x =~ pattern :: Bool)]

main :: IO ()
main = do
    (target:pattern:_) <- getArgs
    contents   <- ls target pattern
    mapM_ putStrLn contents