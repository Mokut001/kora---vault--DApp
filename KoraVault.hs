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

data VaultDatum = VaultDatum
    { vaultOwner  :: PubKeyHash
    , vaultTarget :: Integer
    }
PlutusTx.makeIsDataIndexed ''VaultDatum [('VaultDatum, 0)]

{-# INLINABLE mkValidator #-}
mkValidator :: VaultDatum -> () -> ScriptContext -> Bool
mkValidator datum _ ctx = 
    traceIfFalse "Signature missing" (txSignedBy info (vaultOwner datum)) &&
    traceIfFalse "Target not reached" targetReached
  where
    info = scriptContextTxInfo ctx
    ownInput = case findOwnInput ctx of
        Nothing -> traceError "No script input"
        Just i  -> txInInfoResolved i
    currentValue = getLovelace (fromValue (txOutValue ownInput))
    targetReached = currentValue >= vaultTarget datum

validator :: CompiledCode (BuiltinData -> BuiltinData -> BuiltinData -> ())
validator = $$(PlutusTx.compile [|| \d r c -> if mkValidator (PlutusTx.unsafeFromBuiltinData d) (PlutusTx.unsafeFromBuiltinData r) (PlutusTx.unsafeFromBuiltinData c) then () else error () ||])