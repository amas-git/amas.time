import Control.Concurrent
import Control.Monad
import System.IO

main = do
    m <- newEmptyMVar
    forkIO $ do putMVar m "HELLO"; putMVar m "WORLD"
    a <- takeMVar m
    b <- takeMVar m
    print (a, b)
