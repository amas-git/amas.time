import System.Environment
import System.IO

-- 1. readFile & writeFile are lazy
-- 2. It's not necessary to loaded all contens of file into the memory, think
-- the lazy io as pipe, the writer function do write until the data comes and
-- they DO NOT keep any writed data as well
main = do
    (src:dst:[]) <- getArgs
    contents <- readFile src
    writeFile dst contents
