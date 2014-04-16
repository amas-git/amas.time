-- Nature Numbers
data Nat = Zero | Succ Nat 
    deriving (Show)

instance Enum Nat where
  pred n        = Succ n
  succ Zero     = Zero
  succ (Succ n) = n
  fromEnum      = natToInt 
  toEnum        = intToNat 

one = Succ Zero
two = Succ (Succ Zero)

natToInt :: Nat -> Int
natToInt Zero = 0
natToInt (Succ n) = 1 + (natToInt n)

intToNat :: Int -> Nat
intToNat 0 = Zero
intToNat n = Succ (intToNat $ n-1) 

natAdd :: Nat -> Nat -> Nat
natAdd Zero n = n
natAdd n Zero = n
natAdd (Succ n) m = Succ (natAdd n m)
