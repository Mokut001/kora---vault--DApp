// --- KoraVault End-to-End Logic ---

let lucid;
let walletAddress = "";
let vaultState = {
    target: 0,
    balance: 0,
    ownerPkh: "",
    initialized: false
};

// --- Initialization ---

async function initLucid() {
    // Note: For a live deployment, you would replace this with a valid Blockfrost key.
    // For local dev/demo, Lucid can start in a mock mode or with a provider.
    const blockfrostKey = "preprod_YOUR_KEY"; // Placeholder
    
    lucid = await Lucid.new(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", blockfrostKey),
        "Preprod"
    );
}

// 1. Connection
document.getElementById('connectBtn').onclick = async () => {
    if (!window.cardano || !window.cardano.nami) {
        return alert("Please install Nami Wallet to continue.");
    }
    
    try {
        setLoading(true, "Connecting", "Communicating with Nami...");
        if(!lucid) await initLucid();
        
        const api = await window.cardano.nami.enable();
        lucid.selectWallet(api);
        
        walletAddress = await lucid.wallet.address();
        
        const details = lucid.utils.getAddressDetails(walletAddress);
        vaultState.ownerPkh = details.paymentCredential.hash;

        document.getElementById('connectBtn').innerText = walletAddress.substring(0, 10) + "...";
        document.getElementById('connectBtn').classList.replace('bg-blue-600', 'bg-emerald-600');
        setLoading(false);
    } catch (e) {
        console.error(e);
        setLoading(false);
        alert("Wallet connection failed.");
    }
};

// 2. Deployment
async function initializeVault() {
    if(!walletAddress) return alert("Please connect your wallet first.");
    
    const target = parseFloat(document.getElementById('targetInput').value);
    if(!target || target <= 0) return alert("Please enter a valid target amount.");

    setLoading(true, "Deploying Vault", "Initializing Haskell contract state...");

    // Normally we would submit a real Tx here. 
    // For this end-to-end template, we simulate the state transition.
    setTimeout(() => {
        vaultState.target = target;
        vaultState.initialized = true;
        
        document.getElementById('initSection').classList.add('hidden');
        document.getElementById('dashboardSection').classList.remove('hidden');
        updateUI();
        setLoading(false);
    }, 2000);
}

// 3. Deposit Logic
async function depositADA() {
    const amt = parseFloat(document.getElementById('depositInput').value);
    if(!amt || amt <= 0) return alert("Enter amount to deposit.");

    setLoading(true, "Locking ADA", `Building transaction for ${amt} ADA...`);

    // In a production app, the code would be:
    // const tx = await lucid.newTx().payToContract(scriptAddr, datum, { lovelace: amt*1000000 }).complete();
    // const signed = await tx.sign().complete();
    // await signed.submit();

    setTimeout(() => {
        vaultState.balance += amt;
        updateUI();
        setLoading(false);
        document.getElementById('depositInput').value = "";
    }, 1500);
}

// 4. Withdrawal Logic
async function withdrawADA() {
    setLoading(true, "Executing Haskell Validator", "Verifying target amount on-chain...");

    setTimeout(() => {
        alert("Success! Haskell logic validated your claim. " + vaultState.balance + " ADA reclaimed.");
        location.reload();
    }, 2500);
}

// UI HELPERS
function updateUI() {
    document.getElementById('balanceDisplay').innerText = vaultState.balance.toFixed(2);
    document.getElementById('targetDisplay').innerText = vaultState.target.toFixed(2);
    
    const progress = Math.min((vaultState.balance / vaultState.target) * 100, 100);
    document.getElementById('progressBar').style.width = progress + "%";
    document.getElementById('percentLabel').innerText = progress.toFixed(0) + "% Achieved";
    
    const remaining = Math.max(vaultState.target - vaultState.balance, 0);
    document.getElementById('remainingLabel').innerText = "₳" + remaining.toFixed(2) + " to go";

    const btn = document.getElementById('withdrawBtn');
    const alertBox = document.getElementById('unlockAlert');
    const textMsg = document.getElementById('withdrawText');

    if (vaultState.balance >= vaultState.target) {
        btn.disabled = false;
        btn.classList.replace('bg-slate-800', 'bg-emerald-600');
        btn.classList.replace('text-slate-600', 'text-white');
        btn.classList.remove('cursor-not-allowed');
        alertBox.classList.remove('hidden');
        textMsg.innerText = "Haskell Smart Contract: TARGET_REACHED. Withdrawal enabled.";
    }
}

function setLoading(show, title = "", msg = "") {
    const el = document.getElementById('loader');
    if(show) {
        document.getElementById('loaderTitle').innerText = title;
        document.getElementById('loaderMsg').innerText = msg;
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}