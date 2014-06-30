import Control.Monad.State
import System.Random

-- getOne :: (Random a) => (a,a) -> State StdGen a
getOne bounds = do g       <- get
                   (x, g') <- return $ randomR bounds g
                   put g'
                   return x

makeRandomValue :: StdGen -> ((Int,Int,Char), StdGen)
makeRandomValue = runState (do n <- getOne (1, 100)
                               m <- getOne (100, 200)
                               c <- getOne ('a', 'z')
                               return (n,m,c))
                             

main = do
  g <- getStdGen
  return $ makeRandomValue g
