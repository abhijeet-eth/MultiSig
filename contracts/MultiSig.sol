//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.7;

import "hardhat/console.sol";
contract Multisig{

    address mainOwner;
    address[] walletowners;
    uint transferId;
    uint limit;

    constructor() {
        mainOwner = msg.sender;
        walletowners.push(mainOwner);
        limit = walletowners.length -1;
    }

    mapping(address => uint) balance;
    mapping(address => mapping(uint => bool)) approvals;

    struct Transfer{
        address sender;
        address payable receiver;
        uint amount;
        uint id;
        uint approvals;
        uint timeOfTransaction;
        }

    Transfer [] transferRequests;   
    event walletOwnerAdded(address addedBy, address added, uint timeOfTransaction);
    event walletOwnerRemoved(address removedBy, address ownerRemoved, uint timeOfTransaction);
    event fundsDeposited(address sender, uint amount, uint timeOfTransaction);
    event fundsWithdrawed(address sender, uint amount, uint timeOfTransaction);
    event transferCreated(address sender, address receiver, uint amount, uint id, uint approvals, uint timeOfTransaction) ;
    event transferCancelled(address sender, address receiver, uint amount, uint id, uint approvals, uint timeOfTransaction) ;
    event transferApproved(address sender, address receiver, uint amount, uint id, uint approvals, uint timeOfTransaction) ;
    event transferExecuted(address sender, address receiver, uint amount, uint id, uint approvals, uint timeOfTransaction) ;

    modifier onlyOwner(){
     bool isOwner =false;
     for (uint i=0 ; i< walletowners.length ;i++ ){
            if(walletowners[i] == msg.sender){
                isOwner =true;
                break;
            }
        }
        require(isOwner == true, "only wallet owners can call this funcytion");
        _;
    }

    function getWalletOwners() public view returns(address[] memory){
        return walletowners;
    }

    function addWalletOwner(address owner) public onlyOwner(){        
        
            for(uint i = 0 ; i<walletowners.length ; i++ ){
            if(walletowners[i] == owner){
                revert("cannot add duplicate owner");
                }           
        }
        walletowners.push(owner);
        limit = walletowners.length -1;
        emit walletOwnerAdded(msg.sender, owner, block.timestamp);
    }

    function removeWalletOwner(address owner) public onlyOwner{ 
        bool hasbeenFound = false;
        uint ownerIndex;

        for(uint i = 0;i<walletowners.length; i++){
            if(walletowners[i] == owner){
                hasbeenFound = true;
                ownerIndex=i;
                break;
            }
        }
        require(hasbeenFound == true, "wallet owner not detected");

        walletowners[ownerIndex] = walletowners[walletowners.length-1];
        walletowners.pop(); 
        limit = walletowners.length -1;
        emit walletOwnerRemoved(msg.sender, owner, block.timestamp);
    }

    function deposit() public payable onlyOwner{
        require(msg.value > 0,"cannot deposut value of 0");
        balance[msg.sender] = msg.value;

        emit fundsDeposited(msg.sender, msg.value, block.timestamp);
    } 

    function createTransferRequest(address payable receiver, uint amount) public onlyOwner{
        require(balance[msg.sender] >= amount, "Insufficient amount");
        for(uint i=0; i < transferRequests.length ; i++){
            require(walletowners[i] != msg.sender,"cannot send to yourself");
        }

        balance[msg.sender] -= amount;
        transferRequests.push(Transfer(msg.sender, receiver, amount, transferId, 0, block.timestamp));
        transferId++;

        emit transferCreated(msg.sender, receiver, amount, transferId, 0, block.timestamp);
    }

    function cancelTransfer(uint id) public onlyOwner{
        bool hasBeenFound = false;
        uint transferIndex =0;
        for(uint i=0; i< transferRequests.length; i++){
            if (transferRequests[i].id == id){
                hasBeenFound = true;
                break;
            }
            transferIndex++;
        }
        require(hasBeenFound, "transfer id not found");
        require(msg.sender == transferRequests[transferIndex].sender, "Only the creator can cancel");

        balance[msg.sender] += transferRequests[transferIndex].amount;
        transferRequests[transferIndex] = transferRequests[transferRequests.length-1];
        transferRequests.pop();

        emit transferCreated(msg.sender, transferRequests[transferIndex].receiver, transferRequests[transferIndex].amount, transferRequests[transferIndex].id, transferRequests[transferIndex].approvals,transferRequests[transferIndex].timeOfTransaction);
    }

    function approveTransfer(uint id) public onlyOwner{
        bool hasBeenFound = false;
        uint transferIndex =0;
        for(uint i=0; i< transferRequests.length; i++){
            if (transferRequests[i].id == id){
                hasBeenFound = true;
                break;
            }
            transferIndex++;
        }
        require(hasBeenFound,"only the transfer creator can cancel");
        require(transferRequests[transferIndex].sender != msg.sender,"cannot transfer your own transfer request");
        require(approvals[msg.sender][id] == false, "cannot approve the same transfer twice");

        transferRequests[transferIndex].approvals++;
        approvals[msg.sender][id] = true;
        emit transferApproved(msg.sender, transferRequests[transferIndex].receiver, transferRequests[transferIndex].amount, transferRequests[transferIndex].id, transferRequests[transferIndex].approvals,transferRequests[transferIndex].timeOfTransaction);
        if(transferRequests[transferIndex].approvals == limit){
            transferFunds(transferIndex);
        }
    }

    function transferFunds(uint id) private {
        balance[transferRequests[id].receiver] += transferRequests[id].amount;
        transferRequests[id].receiver.transfer(transferRequests[id].amount);

        transferRequests[id] = transferRequests[transferRequests.length - 1];
        emit transferExecuted(msg.sender, transferRequests[id].receiver, transferRequests[id].amount, transferRequests[id].id, transferRequests[id].approvals,transferRequests[id].timeOfTransaction);
        transferRequests.pop();

    }

    function getTransferRequests() public view returns(Transfer[] memory){
        return transferRequests;
    }

    function getNumOfApprovals(uint id) public view returns(uint){
        return transferRequests[id].approvals;
    }

    /*function getApprovals(uint id) public view returns(bool){
        return approvals[msg.sender][id];
    }*/

    function getLimit() public view returns(uint){
        return limit;
    }

    function getBalance() public view returns(uint){
        console.log("Sender of this contract is %s",msg.sender);
        return balance[msg.sender];
        
    }
    
    function getWalletBalance() public view returns(uint){
        return address(this).balance;
    }

    function withdraw(uint amount) public onlyOwner{
        require(amount >= balance[msg.sender], "Insufficient amount");
        balance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
 
        emit fundsWithdrawed(msg.sender, amount, block.timestamp);
    }

    function getBal(address user) public view returns(uint){
       uint val = user.balance;
       return val;
    }

}
