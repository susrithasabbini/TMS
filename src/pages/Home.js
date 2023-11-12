import { Button, Input, Select, Textarea, useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import ConnectedAccount from "../components/ConnectedAccount";
import constants from "../contract/constants";

const Home = ({ contractInstance, currentAccount, setRequest, isVoter }) => {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const toast = useToast();
  const [daoMembers, setDaoMembers] = useState([]);
  const [toAddressFirst, setToAddressFirst] = useState(true);
  const [amountFirst, setAmountFirst] = useState(true);
  const [descriptionFirst, setDescriptionFirst] = useState(true);

  useEffect(() => {
    if (contractInstance && currentAccount !== constants.ownerAddress) {
      setToAddress(contractInstance.address);
    } else if (currentAccount === constants.ownerAddress && !contractInstance) {
      setToAddress("");
    } else {
      setToAddress("");
    }
  }, [contractInstance, currentAccount]);

  useEffect(() => {
    if (contractInstance && currentAccount) {
      const getAddresses = async () => {
        const addresses = await contractInstance.getAllDAOMembers();
        setDaoMembers(addresses);
      };
      getAddresses();
    }
  });

  const handlePayment = async () => {
    if (
      contractInstance &&
      currentAccount &&
      toAddress &&
      amount &&
      description
    ) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const parsedAmount = ethers.utils.parseEther(amount);
          const tx = await contractInstance.requestPayment(
            toAddress,
            parsedAmount,
            description
          );
          await tx.wait();
          resolve("Order requested successfully!");
        } catch (error) {
          console.error("Error requesting Order: ", error);
          reject("Error requesting Order!");
        }
      });

      toast.promise(promise, {
        loading: { title: "Processing Request...", position: "top" },
        success: {
          title: "Success",
          description: "Order requested successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to request Order",
          status: "error",
          position: "top-right",
        },
        isClosable: true,
      });

      // Reset form fields on success
      promise.then(() => {
        setToAddress("");
        setAmount("");
        setDescription("");
        setRequest(true);
      });
    }
  };

  return (
    <div className="bg-blue-100">
      <ConnectedAccount
        currentAccount={currentAccount}
        contractInstance={contractInstance}
        isVoter={isVoter}
      />

      <div className="flex items-center flex-col border rounded-full bg-white">
        {currentAccount === constants.ownerAddress && (
          <div className="mt-5 align-middle items-center w-96">
            <label className="text-gray-700 text-sm font-semibold">
              To Address:
            </label>
            <Select
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                setToAddressFirst(false);
              }}
              placeholder="Select an address"
            >
              {daoMembers.map((address) => (
                <option key={address} value={address}>
                  {address}
                </option>
              ))}
            </Select>
            {toAddress === "" && !toAddressFirst ? (
              <p className="text-red-500 text-xs">Address cannot be empty!</p>
            ) : null}
          </div>
        )}

        <div className="mt-5 align-middle items-center w-96">
          <label className="text-gray-700 text-sm font-semibold">
            Transaction Value in Ether:
          </label>
          <Input
            type="text"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setAmountFirst(false);
            }}
            placeholder="0.0"
          />
          {amount === "" && !amountFirst ? (
            <p className="text-red-500 text-xs">Amount cannot be empty!</p>
          ) : amount !== "" && isNaN(amount) ? (
            <p className="text-red-500 text-xs">Amount must be a number!</p>
          ) : null}
        </div>

        <div className="mt-2 align-middle items-center w-96">
          <label className="text-gray-700 text-sm font-semibold">
            Description:
          </label>
          <Textarea
            type="text"
            value={description}
            height={300}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescriptionFirst(false);
            }}
            placeholder="Description"
          />
          {description === "" && !descriptionFirst ? (
            <p className="text-red-500 text-xs">Description cannot be empty!</p>
          ) : null}
        </div>
        <Button colorScheme="blue" onClick={handlePayment} mt={3}>
          Send Request
        </Button>
      </div>
    </div>
  );
};

export default Home;
