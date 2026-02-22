{-# LANGUAGE DataKinds           #-}
{-# LANGUAGE FlexibleContexts    #-}
{-# LANGUAGE NoImplicitPrelude   #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE TemplateHaskell     #-}
{-# LANGUAGE TypeApplications    #-}
{-# LANGUAGE TypeFamilies        #-}
{-# LANGUAGE TypeOperators       #-}

module KoraVault where

import           Plutus.V2.Ledger.Api
import           Plutus.V2.Ledger.Contexts (txSignedBy, findOwnInput)
import           PlutusTx.Prelude
import qualified PlutusTx

-- | The Vault State
-- Target is in Lovelace (1 ADA = 1,000,000 Lovelace)
data VaultDatum = VaultDatum
    { vaultOwner  :: PubKeyHash
    , vaultTarget :: Integer
    }
PlutusTx.makeIsDataIndexed ''VaultDatum [('VaultDatum, 0)]

{-# INLINABLE mkValidator #-}
-- | Core logic for the savings vault.
-- Allows withdrawal only if the owner signs AND the current balance in the script is >= target.
mkValidator :: VaultDatum -> () -> ScriptContext -> Bool
mkValidator datum _ ctx = 
    traceIfFalse "Signature missing: Only the owner can withdraw" (txSignedBy info (vaultOwner datum)) &&
    traceIfFalse "Target not reached: You must save more ADA" targetReached
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    -- Get the value currently locked in this specific script input
    ownInput :: TxOut
    ownInput = case findOwnInput ctx of
        Nothing -> traceError "No script input found"
        Just i  -> txInInfoResolved i

    currentValue :: Integer
    currentValue = getLovelace (fromValue (txOutValue ownInput))

    targetReached :: Bool
    targetReached = currentValue >= vaultTarget datum

-- Boilerplate to compile the Haskell code to Plutus Core
validator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> ())
validator = $$(PlutusTx.compile [|| \d r c -> if mkValidator (PlutusTx.unsafeFromBuiltinData d) (PlutusTx.unsafeFromBuiltinData r) (PlutusTx.unsafeFromBuiltinData c) then () else error () ||])