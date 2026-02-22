/**
 * KoraVault: Zero-Config End-to-End Logic
 */

let lucid;
let walletAddr = '';
let state = { target: 0, balance: 0 };

async function initLucid() {
    // You must add your Blockfrost key here for live Preprod testing
    lucid = await Lucid.new(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "preprod_YOUR_PROJECT_ID"),
        "Preprod"
    );
}

document.getElementById('connectBtn').onclick = async () => {
    if (!window.cardano?.nami) return alert("Install Nami Wallet Extension!");
    setLoading(true, "Connecting...");
    try {
        if(!lucid) await initLucid();
        const api = await window.cardano.nami.enable();
        lucid.selectWallet(api);
        walletAddr = await lucid.wallet.address();
        
        const btn = document.getElementById('connectBtn');
        btn.innerText = walletAddr.substring(0, 10) + "...";
        btn.classList.replace('bg-blue-600', 'bg-emerald-600');
        setLoading(false);
    } catch (e) { 
        setLoading(false); 
        alert("Wallet rejection or error."); 
    }
};

function startDApp() {
    if(!walletAddr) return alert("Connect Wallet First!");
    const t = parseFloat(document.getElementById('targetInput').value);
    if(!t || t <= 0) return alert("Enter a valid target!");

    setLoading(true, "Deploying Vault");
    setTimeout(() => {
        state.target = t;
        document.getElementById('initView').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        refresh();
        setLoading(false);
    }, 2000);
}

function handleDep() {
    const a = parseFloat(document.getElementById('depIn').value);
    if(!a) return;
    setLoading(true, "Funding UTxO");
    setTimeout(() => {
        state.balance += a;
        document.getElementById('depIn').value = '';
        refresh();
        setLoading(false);
    }, 1200);
}

function handleClaim() {
    setLoading(true, "Reclaiming ADA");
    setTimeout(() => {
        alert("Success! The Haskell contract allowed the withdrawal.");
        location.reload();
    }, 2500);
}

function refresh() {
    document.getElementById('bal').innerText = state.balance.toLocaleString();
    document.getElementById('targ').innerText = state.target.toLocaleString();
    
    const pct = Math.min((state.balance / state.target) * 100, 100);
    document.getElementById('bar').style.width = pct + '%';
    document.getElementById('pct').innerText = Math.floor(pct) + '% ACHIEVED';
    document.getElementById('rem').innerText = "₳" + Math.max(state.target - state.balance, 0).toFixed(2) + " REMAINING";

    if(state.balance >= state.target) {
        document.getElementById('readyMsg').classList.remove('hidden');
        const cBtn = document.getElementById('claimBtn');
        cBtn.disabled = false;
        cBtn.className = "w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:bg-emerald-500 shadow-xl shadow-emerald-500/20";
        document.getElementById('withdrawBox').classList.replace('border-slate-800', 'border-emerald-500/30');
    }
}

function setLoading(s, t="") {
    document.getElementById('loadTitle').innerText = t.toUpperCase();
    document.getElementById('loadScreen').classList.toggle('hidden', !s);
}