import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { ethers } from "ethers";
import Multisignature from './Multisignature.json';


const Multisig =() => {

    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

    let [blockchainProvider, setBlockchainProvider] = useState(undefined);
    let [metamask, setMetamask] = useState(undefined);
    let [metamaskNetwork, setMetamaskNetwork] = useState(undefined);
    let [metamaskSigner, setMetamaskSigner] = useState(undefined);
    const [networkId, setNetworkId] = useState(undefined);
    const [loggedInAccount, setAccounts] = useState(undefined);
    const [etherBalance, setEtherBalance] = useState(undefined);
    const [isError, setError] = useState(false);

    const[contract, setReadContract] = useState(null);
    const[writeContract, setWriteContract] = useState(null);
    const[execute, getExecute] = useState(null);

    const [connectWallet, setConnectWallet] = useState("Connect Wallet")
    const[owners, getOwners] = useState(undefined);
    const[contractBalance, getContractBalance] = useState(undefined);
    const[ownerBal, getOwnerBal] = useState(undefined);
    const[addrReceiver, setAddrReceiver] = useState(undefined);
    const[amtReceiver, setAmtReceiver] = useState(undefined);
    const[transferReq, getTransferReq] = useState(undefined);

    let alertMessage ;

    const connect = async () => {
        try {
            let provider, network, metamaskProvider, signer, accounts;

            if (typeof window.ethereum !== 'undefined') {
                try {
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await handleAccountsChanged(accounts);
                } catch (err) {
                    if (err.code === 4001) {
                        console.log('Please connect to MetaMask.');
                    } else {
                        console.error(err);
                    }
                }
                //provider = new ethers.providers.JsonRpcProvider(`https://kovan.infura.io/v3/09dc2ddad4014a219f84c8125b0ab7cc`)
                const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
                setBlockchainProvider(provider);
                network = await provider.getNetwork()
                console.log(network.chainId);
                setNetworkId(network.chainId);

                // Connect to Metamask  
                metamaskProvider = new ethers.providers.Web3Provider(window.ethereum)
                setMetamask(metamaskProvider)

                signer = await metamaskProvider.getSigner(accounts[0])
                setMetamaskSigner(signer)

                metamaskNetwork = await metamaskProvider.getNetwork();
                setMetamaskNetwork(metamaskNetwork.chainId);

                console.log(network);

                if (network.chainId !== metamaskNetwork.chainId) {
                    alert("Your Metamask wallet is not connected to " + network.name);

                    setError("Metamask not connected to RPC network");
                }
                let  tempContract = new ethers.Contract(contractAddress,Multisignature,provider);
                setReadContract(tempContract);
                let tempContract2 = new ethers.Contract(contractAddress,Multisignature,signer);
                setWriteContract(tempContract2);

            } else setError("Could not connect to any blockchain!!");

            return {
                provider, metamaskProvider, signer,
                network: network.chainId
            }

        } catch (e) {
            console.error(e);
            setError(e);
        }

    }


    const handleAccountsChanged = async (accounts) => {
        if (typeof accounts !== "string" || accounts.length < 1) {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        console.log("t1", accounts);
        if (accounts.length === 0) {
            // MetaMask is locked or the user has not connected any accounts
            alert('Please connect to MetaMask.');
        } else if (accounts[0] !== loggedInAccount) {
            setAccounts(accounts[0]);
            setConnectWallet("Wallet Connected");
        }
    }

    useEffect(() => {
        const init = async () => {

            const { provider, metamaskProvider, signer, network } = await connect();

            const accounts = await metamaskProvider.listAccounts();
            console.log(accounts[0]);
            setAccounts(accounts[0]);

            if (typeof accounts[0] == "string") {
                setEtherBalance(ethers.utils.formatEther(
                    String(await metamaskProvider.getBalance(accounts[0]))
                ));
            }
        }

        init();

        window.ethereum.on('accountsChanged', handleAccountsChanged);

        window.ethereum.on('chainChanged', function (networkId) {
            // Time to reload your interface with the new networkId
            //window.location.reload();
            unsetStates();
        })

    }, []);

    useEffect(() => {
        (async () => {
            if (typeof metamask == 'object' && typeof metamask.getBalance == 'function'
                && typeof loggedInAccount == "string") {
                    console.log(ethers.utils.formatEther(String(await metamask.getBalance(loggedInAccount))));
                setEtherBalance(ethers.utils.formatEther(String(await metamask.getBalance(loggedInAccount))));
                
            }
        })()
    }, [loggedInAccount]);

    const unsetStates = useCallback(() => {
        setBlockchainProvider(undefined);
        setMetamask(undefined);
        setMetamaskNetwork(undefined);
        setMetamaskSigner(undefined);
        setNetworkId(undefined);
        setAccounts(undefined);
        setEtherBalance(undefined);
        connectWallet(undefined);
        owners(undefined);
        contractBalance(undefined);
        ownerBal(undefined);
        addrReceiver(undefined);
        amtReceiver(undefined);
        setWriteContract(undefined);
        setReadContract(undefined);

    }, []);


    const isReady = useCallback(() => {

        return (
            typeof blockchainProvider !== 'undefined'
            && typeof metamask !== 'undefined'
            && typeof metamaskNetwork !== 'undefined'
            && typeof metamaskSigner !== 'undefined'
            && typeof networkId !== 'undefined'
            && typeof loggedInAccount !== 'undefined'
            && typeof etherBalance !== 'undefined'
            && typeof writeContract !== 'undefined'
            && typeof contractBalance !== 'undefined'
            && typeof ownerBal !== 'undefined'
            && typeof addrReceiver !== 'undefined'
            && typeof amtReceiver !== 'undefined'

        );
    }, [
        blockchainProvider,
        metamask,
        metamaskNetwork,
        metamaskSigner,
        networkId,
        loggedInAccount,
    ]);   

    const getWalletOwn =async() =>{
        let val = await contract.getWalletOwners();
        console.log(val);
        getOwners(val);
    }

    const getContrBalance =async() =>{
        let val = ethers.utils.formatEther(String(await contract.getWalletBalance()));
        getContractBalance(val);
    }

    const getOwnerBalance =async() =>{
        let val = ethers.utils.formatEther(String(await writeContract.getBalance()));
        console.log(val);
        getOwnerBal(val);
        console.log(val);
    }

    const addNewOwner = async(event) => {
        event.preventDefault();
        let addr = event.target.addOwner.value;
        await writeContract.addWalletOwner(addr);    
    }

    const removeOwner = async(event) => {
        event.preventDefault();
        let addr = event.target.remOwner.value;
        await writeContract.removeWalletOwner(addr);    
    }

    const depositFund = async(event) => {
        event.preventDefault();
        let amount = event.target.deposit.value;
        if (amount < 0){
            throw new Error("Amount less than 0");
        }
        amount = String(ethers.utils.parseEther(String(amount)));
        //console.log(amount);
        await writeContract.deposit({value: amount});    
    }

    const createTransferReq = async(addrReceiver,amtReceiver) =>{
        console.log(addrReceiver,amtReceiver);
        await writeContract.createTransferRequest(addrReceiver,amtReceiver)
    }

    const cancelTransferReq = async(event) => {
        event.preventDefault();
        let val = event.target.ID.value;
        await writeContract.cancelTransfer(val);    
    }

    const ApproveTransferReq = async(event) => {
        event.preventDefault();
        let val = event.target.ID.value;
        await writeContract.approveTransfer(val);    
    }
    
    const getTransferReqst =async() =>{
        let val = await contract.getTransferRequests();
        getTransferReq(val);
    }

    const withdrawFunds = async(event) => {
        event.preventDefault();
        let amount = event.target.amounts.value;
        if (amount < 0){
            throw new Error("Amount less than 0");
        }
        amount = String(ethers.utils.parseEther(String(amount)));
        //console.log(amount);
        await writeContract.withdraw(amount);    
    }

    return(
        <>
            <h4> Multi-Signature Project</h4>
            <button  type="button" className="button" onClick = {()=>connect()}> {connectWallet} </button>
            {loggedInAccount}
            <br />
            <button onClick ={getWalletOwn}>Owners List</button>
            {owners}
            <br />
            <button onClick ={getContrBalance}>Wallet Balance</button>
            {contractBalance}
            <br />

            <button className = "button-73" onClick={()=>getOwnerBalance()} type = "button"> Submit</button>
            {ownerBal}

            <form className = "input" onSubmit={addNewOwner}>
                    <input id ='addOwner' type='text' placeholder ="Enter Address to add"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>

            <form className = "input" onSubmit={removeOwner}>
                    <input id ='remOwner' type='text' placeholder ="Enter address to remove"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>

            <form className = "input" onSubmit={depositFund}>
                    <input id ='deposit' type='text' placeholder ="Deposit fund"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>

            <br />
            <h8>Create transfer request</h8>
            <form className = "input" onSubmit={createTransferReq}>
                    <input id ='createTransfer' value= {addrReceiver} onChange={(event)=>setAddrReceiver(event.target.value)} type='text' placeholder ="Address of Receiver"/>
                    <input id ='createTransfer2' value= {amtReceiver} onChange={(event)=>setAmtReceiver(event.target.value)}type='number' placeholder ="Amount"/>
                    <button className = "button-73" onClick={()=>createTransferReq(addrReceiver,amtReceiver)} type = "button"> Submit</button>
            </form>

            <br />
            <h8>Cancel transfer request</h8>
            <form className = "input" onSubmit={cancelTransferReq}>
                    <input id ='ID' type='text' placeholder ="Enter Id"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>

            <br />
            <h8>Approve Transfer</h8>
            <form className = "input" onSubmit={ApproveTransferReq}>
                    <input id ='ID' type='text' placeholder ="Enter Id"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>
            <br />
            <button onClick ={getTransferReqst}>Get Transfer Requests</button>
            {transferReq}

            <br />
            <h8>Withdraw</h8>
            <form className = "input" onSubmit={withdrawFunds}>
                    <input id ='amounts' type='text' placeholder ="Enter amount"/>
                    <button className = "button-73" type ={"submit"}> Submit</button>
            </form>
        </>
    )
}
export default Multisig;