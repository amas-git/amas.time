import Control.Parallel.Strategies

factor 1 = 1
factor n = n * (factor (n - 1))

rparEval = runEval $ do
    a <- rpar (factor 10000)
    b <- rpar (factor 15000)
    rseq a
    rseq b
    return (a, b)

rpar_rseq_Eval = runEval $ do
    a <- rpar (factor 10000)
    b <- rseq (factor 15000)
    return (a, b)

main = do
    print rparEval

