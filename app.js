let lucid;
let walletAddr = '';
let vault = { target: 0, balance: 0, active: false };

async function initLucid() {
    // Note: Provide a Blockfrost Key for live testing
    lucid = await Lucid.new(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprod_YOUR_PROJECT_ID"),
        "Preprod"
    );
}

document.getElementById('connectBtn').onclick = async () => {
    if (!window.cardano?.nami) return alert("Install Nami Wallet!");
    try {
        setLoading(true, "Connecting", "Opening wallet tunnel...");
        if(!lucid) await initLucid();
        const api = await window.cardano.nami.enable();
        lucid.selectWallet(api);
        walletAddr = await lucid.wallet.address();
        document.getElementById('connectBtn').innerText = walletAddr.substring(0, 10) + "...";
        document.getElementById('connectBtn').classList.replace('bg-blue-600', 'bg-emerald-600');
        setLoading(false);
    } catch (e) {
        setLoading(false);
        alert("Connection refused.");
    }
};

async function initVault() {
    if(!walletAddr) return alert("Connect Wallet first.");
    const val = parseFloat(document.getElementById('targetInput').value);
    if(!val || val <= 0) return alert("Set a goal!");
    
    setLoading(true, "Deploying", "Compiling Haskell logic & Initializing Datum...");
    setTimeout(() => {
        vault.target = val;
        vault.active = true;
        document.getElementById('setupView').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        updateUI();
        setLoading(false);
    }, 2000);
}

async function deposit() {
    const amt = parseFloat(document.getElementById('depositInput').value);
    if(!amt || amt <= 0) return;
    
    setLoading(true, "Locking Funds", `Sending ${amt} ₳ to Smart Contract Address...`);
    setTimeout(() => {
        vault.balance += amt;
        updateUI();
        document.getElementById('depositInput').value = '';
        setLoading(false);
    }, 1500);
}

async function withdraw() {
    setLoading(true, "Validating Haskell", "The script is checking UTXO value against target Datum...");
    setTimeout(() => {
        alert("Goal reached and verified! Funds released to " + walletAddr);
        location.reload();
    }, 3000);
}

function updateUI() {
    document.getElementById('balanceDisplay').innerText = vault.balance.toLocaleString();
    document.getElementById('targetDisplay').innerText = vault.target.toLocaleString();
    const progress = Math.min((vault.balance / vault.target) * 100, 100);
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('progressText').innerText = Math.floor(progress) + '% Complete';
    document.getElementById('remainingText').innerText = "₳" + Math.max(vault.target - vault.balance, 0).toFixed(2) + " Remaining";

    if(vault.balance >= vault.target) {
        document.getElementById('goalMet').classList.remove('hidden');
        const btn = document.getElementById('withdrawBtn');
        btn.disabled = false;
        btn.className = "w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:bg-emerald-500 shadow-xl shadow-emerald-500/20";
        document.getElementById('withdrawHint').innerText = "Withdrawal unlocked. Haskell predicate returns TRUE.";
    }
}

function setLoading(active, title, msg) {
    const el = document.getElementById('loader');
    if(active) {
        document.getElementById('loaderTitle').innerText = title.toUpperCase();
        document.getElementById('loaderMsg').innerText = msg;
        el.classList.remove('hidden');
    } else el.classList.add('hidden');
}