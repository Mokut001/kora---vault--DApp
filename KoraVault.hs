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

-- | Vault State: Owner PKH and the Target ADA (in Lovelace)
data VaultDatum = VaultDatum
    { vaultOwner  :: PubKeyHash
    , vaultTarget :: Integer
    }
PlutusTx.makeIsDataIndexed ''VaultDatum [('VaultDatum, 0)]

{-# INLINABLE mkValidator #-}
-- | Only allows withdrawal if:
-- 1. The transaction is signed by the owner
-- 2. The amount of ADA in the script is greater than or equal to the target
mkValidator :: VaultDatum -> () -> ScriptContext -> Bool
mkValidator datum _ ctx = 
    traceIfFalse "Owner signature missing" (txSignedBy info (vaultOwner datum)) &&
    traceIfFalse "Target not yet reached" targetReached
  where
    info = scriptContextTxInfo ctx
    ownInput = case findOwnInput ctx of
        Nothing -> traceError "Script input not found"
        Just i  -> txInInfoResolved i
    
    currentLovelace = getLovelace (fromValue (txOutValue ownInput))
    targetReached   = currentLovelace >= vaultTarget datum

validator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> ())
validator = $$(PlutusTx.compile [|| \d r c -> 
    if mkValidator (PlutusTx.unsafeFromBuiltinData d) (PlutusTx.unsafeFromBuiltinData r) (PlutusTx.unsafeFromBuiltinData c) 
    then () 
    else error () ||])