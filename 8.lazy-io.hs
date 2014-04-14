import System.Environment
import System.IO

-- runhaskell 8.lazy-io.hs <file> n
-- runhaskell /etc/passwd 100
main = do
  (target:limit:_) <- getArgs
  h <- openFile target ReadMode
  content <- hGetContents h
  putStr $ take (read limit :: Int) content
  hClose h -- not necessary, the hGetContents do for you, but a good practice
