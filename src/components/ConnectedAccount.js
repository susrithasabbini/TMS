import {
  Box,
  Card,
  CardBody,
  Flex,
  Icon,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import React from "react";
import { SiBlockchaindotcom } from "react-icons/si";
import constants from "../contract/constants";

const ConnectedAccount = ({ currentAccount, contractInstance, isVoter }) => {
  const toast = useToast();

  const handleBecomeDAO = async () => {
    if (contractInstance && currentAccount) {
      // Create a promise that resolves when the transaction is done
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.becomeDAO({
            value: ethers.utils.parseEther("0.001"),
          });
          await tx.wait();
          resolve("Became a DAO member successfully!");
        } catch (error) {
          console.error("Error becoming a member: ", error);
          reject("Error becoming a member!");
        }
      });

      // Show loading toast until the promise is resolved or rejected
      toast.promise(promise, {
        loading: { title: "Please wait...", position: "top" }, // Add position here
        success: {
          title: "Success",
          description: "You are a DAO member now!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to become a DAO member",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      // Reload the page on success
      promise.then(() => {
        window.location.reload();
      });
    }
  };

  const handleExitDAO = async () => {
    if (contractInstance && currentAccount) {
      // Create a promise that resolves when the transaction is done
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.exitDAO();
          await tx.wait();
          resolve("Exited DAO successfully!");
        } catch (error) {
          console.error("Error exiting DAO: ", error);
          reject("Error exiting DAO!");
        }
      });

      // Show loading toast until the promise is resolved or rejected
      toast.promise(promise, {
        loading: { title: "Please wait...", position: "top" }, // Add position here
        success: {
          title: "Success",
          description: "You exited the DAO!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to exit the DAO",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      // Reload the page on success
      promise.then(() => {
        window.location.reload();
      });
    }
  };

  return (
    <Card className="w-full">
      <CardBody>
        <Flex alignItems="center" justify="space-between">
          <div className="flex items-center gap-3">
            <Icon as={SiBlockchaindotcom} color="blue.600" boxSize={10} />
            <Text className="text-gray-500 text-lg font-semibold">
              Connected Account: {currentAccount}
            </Text>
          </div>
          {!isVoter ? (
            <Text
              className="text-sm font-thin cursor-pointer"
              onClick={handleBecomeDAO}
            >
              Want to become a DAO member?
            </Text>
          ) : (
            <Text
              className="text-sm font-thin cursor-pointer"
              onClick={handleExitDAO}
            >
              Exit DAO?
            </Text>
          )}
          {currentAccount === constants.ownerAddress ? (
            <Box className="text-base w-fit font-semibold text-green-500 border border-green-500 p-2 rounded">
              Owner
            </Box>
          ) : isVoter ? (
            <Box className="text-base w-fit font-semibold text-blue-500 border border-blue-500 p-2 rounded">
              DAO Member
            </Box>
          ) : (
            <Box className="text-base w-fit font-semibold text-rose-500 border border-rose-500 p-2 rounded">
              Client
            </Box>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default ConnectedAccount;
