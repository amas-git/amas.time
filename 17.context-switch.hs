import Control.Concurrent
import Control.Monad
import System.IO

main = do
  let n = 50
  hSetBuffering stdout NoBuffering         -- no buffering io
  tid1 <- forkIO (replicateM_ n (putChar 'A'))   -- output 100000 'A'
  tid2 <- forkIO (replicateM_ n (putChar 'B'))   -- output 100000 'A'
  tid3 <- forkIO (replicateM_ n (putChar 'C'))   -- output 100000 'A'
  replicateM_ n (putChar 'D')
  print (tid1, tid2, tid3)

{-
n = 5  -> AAAAABBBBBCCCCCDDDDD
n = 50 -> AABACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBACDBCDBC 
-}
