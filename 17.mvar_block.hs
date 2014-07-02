import Control.Concurrent
import Control.Monad

main = do
  m <- newEmptyMVar
  takeMVar m
