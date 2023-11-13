# Firstly, Deploy Smart contract on Ethereum testnet.

In the src/contract folder, you can find the smart contract code.

You can deploy it on Ethereum testnet, such as Sepolia, Rinkeby, Ropsten, Kovan, etc.

After deploying, you can get the contract address, ABI, owner address.
Then, you can paste them into the src/contract/constants.js file.

## Available Scripts

In the project directory, you can run:

### `npm install` to install all the dependencies.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Workflow

1. User can connect to the Ethereum network and get the account address.
2. Client can request the owner for their order.
3. Owner can accept the request if the order is less than 0.02 ETH.
4. If the order is more than 0.02 ETH, the owner must start the voting process.
5. If the voting result is yes, the owner can accept the request.
6. If the voting result is no, the owner cannot accept the request.
7. After the owner accepts the request, the client can pay the order.
8. Now owner can distribute the order to the company members.
9. For this he can start the voting process.
10. If the voting result is yes, the owner can distribute the order.
11. If the voting result is no, the owner cannot distribute the order.
12. Based on this, the company rating will be calculated.

## Livehosted website Link
[https://treasury-management-system.vercel.app/](https://treasury-management-system.vercel.app/)
