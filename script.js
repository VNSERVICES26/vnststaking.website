// Replace these with your actual contract details
const vnstTokenAddress = "YOUR_VNST_TOKEN_ADDRESS";
const stakingContractAddress = "YOUR_STAKING_CONTRACT_ADDRESS";
const vnstAbi = [ /* Your VNST Token ABI */ ];
const stakingAbi = [ /* Your Staking Contract ABI */ ];

let provider, signer, vnstToken, stakingContract, userAddress;

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("walletAddress").innerText = userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
    document.getElementById("connectWallet").classList.add("connected");

    vnstToken = new ethers.Contract(vnstTokenAddress, vnstAbi, signer);
    stakingContract = new ethers.Contract(stakingContractAddress, stakingAbi, signer);

    loadData();
  } else {
    alert("Please install MetaMask or a compatible wallet!");
  }
}

async function loadData() {
  const [totalUsers, totalStake, totalWithdraw] = await Promise.all([
    stakingContract.totalUsers(),
    stakingContract.totalStaked(),
    stakingContract.totalWithdraw(),
  ]);

  document.getElementById("totalUsers").innerText = totalUsers.toString();
  document.getElementById("totalStake").innerText = ethers.utils.formatUnits(totalStake, 18);
  document.getElementById("totalWithdraw").innerText = ethers.utils.formatUnits(totalWithdraw, 18);

  const vnstBalance = await vnstToken.balanceOf(userAddress);
  document.getElementById("userVNST").innerText = ethers.utils.formatUnits(vnstBalance, 18);

  const userInfo = await stakingContract.users(userAddress);
  document.getElementById("myStake").innerText = ethers.utils.formatUnits(userInfo.totalStaked, 18);
  document.getElementById("stakingLimit").innerText = ethers.utils.formatUnits(await stakingContract.stakeLimit(userAddress), 18);
  document.getElementById("teamSize").innerText = userInfo.teamSize.toString();
  document.getElementById("teamStake").innerText = ethers.utils.formatUnits(userInfo.teamStake, 18);

  const rewards = await stakingContract.viewRewards(userAddress);
  document.getElementById("directIncome").innerText = ethers.utils.formatUnits(rewards.directIncome, 18);
  document.getElementById("stakingReward").innerText = ethers.utils.formatUnits(rewards.stakingReward, 18);
  document.getElementById("levelIncome").innerText = ethers.utils.formatUnits(rewards.levelIncome, 18);
  document.getElementById("roiIncome").innerText = ethers.utils.formatUnits(rewards.roiIncome, 18);
  document.getElementById("withdrawLimit").innerText = ethers.utils.formatUnits(rewards.withdrawable, 18);
}

async function approveMax() {
  const maxAmount = ethers.constants.MaxUint256;
  const tx = await vnstToken.approve(stakingContractAddress, maxAmount);
  await tx.wait();
  alert("Approved successfully!");
}

async function stake() {
  const amount = document.getElementById("stakeAmount").value;
  const uplineAddress = document.getElementById("referralAddress").value.trim();

  if (!amount || Number(amount) <= 0) return alert("Enter a valid amount");
  if (!ethers.utils.isAddress(uplineAddress)) return alert("Enter a valid referral address");

  const tx = await stakingContract.stakeWithReferral(
    ethers.utils.parseUnits(amount, 18),
    uplineAddress
  );
  await tx.wait();
  alert("Staked successfully!");
  loadData();
}

async function claimAll() {
  const tx = await stakingContract.claimAllRewards();
  await tx.wait();
  alert("Rewards claimed!");
  loadData();
}

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("approveMaxBtn").addEventListener("click", approveMax);
document.getElementById("stakeBtn").addEventListener("click", stake);
document.getElementById("claimAllBtn").addEventListener("click", claimAll);
