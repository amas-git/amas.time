import Control.Concurrent
import Control.Monad
import System.IO

main = do
  hSetBuffering stdout NoBuffering         --  关闭输出缓冲
  forkIO (replicateM_ 100 (putChar 'A'))   --  打印100个A
  replicateM_ 100 (putChar 'B')            --  打印100个B
