import Control.Concurrent
import Control.Monad
import System.IO

main = do
    m <- newEmptyMVar
    takeMVar m

{--
DeadLock.hs: thread blocked indefinitely in an MVar operation
--}
