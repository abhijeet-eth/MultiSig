import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { ethers } from "ethers";
import Multisignature from './Multisignature.json';


const MultiSignature =() => {

    const contractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'; 

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

    const[addrBalance, getAddrBalance] = useState(undefined);
    const[ownerBal, getOwnerBal] = useState(undefined);
    const[bal , getBal] = useState(undefined);

    let alertMessage ;

    const connect = async () => {
        try {
            let provider, network, metamaskProvider, signer, accounts;

            if (typeof window.ethereum !== 'undefined') {
                // Connect to RPC  
                console.log('loadNetwork')
                try {

                    //console.log("acc", acc); 
                    //window.ethereum.enable();
                    //await handleAccountsChanged();
                    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    await handleAccountsChanged(accounts);
                } catch (err) {
                    if (err.code === 4001) {
                        // EIP-1193 userRejectedRequest error
                        // If this happens, the user rejected the connection request.
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
        }
    }

    useEffect(() => {
        const init = async () => {

            const { provider, metamaskProvider, signer, network } = await connect();

            const accounts = await metamaskProvider.listAccounts();
            console.log(accounts[0]);
            setAccounts(accounts[0]);

            if (typeof accounts[0] == "string") {
                setEtherBalance(String(ethers.utils.formatEther(await metamaskProvider.getBalance(accounts[0]))
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
                setEtherBalance(String(ethers.utils.formatEther(await metamask.getBalance(loggedInAccount))
                ));
                
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
    }, []);

    const isReady = useCallback(() => {

        return (
            typeof blockchainProvider !== 'undefined'
            && typeof metamask !== 'undefined'
            && typeof metamaskNetwork !== 'undefined'
            && typeof metamaskSigner !== 'undefined'
            && typeof networkId !== 'undefined'
            && typeof loggedInAccount !== 'undefined'
        );
    }, [
        blockchainProvider,
        metamask,
        metamaskNetwork,
        metamaskSigner,
        networkId,
        loggedInAccount,
    ]);    

    const getBalan = async(event) => {
        let val = String(ethers.utils.formatEther(await writeContract.getBal(addrBalance)));
        console.log(val)
        getBal(val);
    }





    return(
    <>
        <h1> Project</h1>

        <h4> Multi-Signature Project</h4>
            <button  type="button" className="button" onClick = {()=>connect()}> Connect </button>
            {loggedInAccount}
            <br />


            
            <form className = "input" onSubmit={getBalan}>
            <input id ='addr' value= {addrBalance} onChange={(event)=>getAddrBalance(event.target.value)} type='text' placeholder ="Address"/>
            <button className = "button-73" onClick={()=>getBalan(addrBalance)} type = "button"> Submit</button>
            {bal}
            </form>
    </>
    )
}
export default MultiSignature;