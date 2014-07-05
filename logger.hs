import Control.Concurrent
import Control.Monad
import System.IO

data Logger     = Logger (MVar LogContent)
data LogContent = Message String | Stop (MVar ())
    
loop :: Logger -> IO () 
loop (Logger m) = do
    c <- takeMVar m       -- 阻塞直到有新的消息到来
    case c of
        Message message -> do 
                            putStrLn $ "> " ++ (show message)
                            loop (Logger m)
        Stop s          -> do
                            putMVar s ()
                            return () 

stopLogger :: Logger -> IO ()
stopLogger (Logger m) = do
    s <- newEmptyMVar
    putMVar m (Stop s)
    takeMVar s

-- 初始化一个日志线程, 返回与之通讯的MVar
newLogger :: IO Logger 
newLogger = do
    m <- newEmptyMVar
    forkIO $ do loop (Logger m)
    return (Logger m)


-- 记录一条日志, 只是向MVar中写入一条消息
logMessage :: Logger -> String -> IO ()
logMessage (Logger m) message = do
    putMVar m (Message message)

main = do 
    m <- newLogger
    forkIO $ do id <- myThreadId ; logMessage m ("message from " ++ (show id))
    forkIO $ do id <- myThreadId ; logMessage m ("message from " ++ (show id))
    stopLogger m
    forkIO $ do id <- myThreadId ; logMessage m ("message from " ++ (show id))
    forkIO $ do id <- myThreadId ; logMessage m ("message from " ++ (show id))
    id <- myThreadId ; logMessage m ("message from " ++ (show id))
