import React, { useEffect, useState } from "react";
import ConnectedAccount from "../components/ConnectedAccount";
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  Center,
  UnorderedList,
  ListItem,
  Button,
  AccordionIcon,
  useToast,
} from "@chakra-ui/react";
import { MdCheckCircle, MdPending } from "react-icons/md";
import { ethers } from "ethers";
import constants from "../contract/constants";

const Requests = ({
  contractInstance,
  currentAccount,
  requested,
  isVoter,
  setStatistics,
}) => {
  const [requests, setRequests] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      if (contractInstance && currentAccount) {
        try {
          const payments = await contractInstance.getAllPayments();
          if (currentAccount === constants.ownerAddress) {
            setRequests(payments);
          } else {
            const filteredPayments = payments.filter(
              (payment) =>
                payment.to === currentAccount || payment.from === currentAccount
            );
            setRequests(filteredPayments);
          }
        } catch (error) {
          console.error("Error fetching requests: ", error);
        }
      }
    };

    fetchRequests();
  }, [contractInstance, currentAccount, requested]);

  const handleAcceptPayment = async (paymentId) => {
    if (contractInstance && currentAccount) {
      const request = requests.filter((request) => request.id === paymentId)[0];
      if (
        (request.value >= ethers.utils.parseEther("0.02") &&
          request.votedYes.length === 0) ||
        (request.from === constants.ownerAddress &&
          request.votedYes.length === 0)
      ) {
        // Show warning toast
        toast({
          title: "Attention",
          description: "Start voting to accept this order.",
          position: "top",
          status: "warning",
          duration: 2000,
          isClosable: true,
        });
        return;
      }

      // Create a promise that resolves when the transaction is done
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.acceptPayment(paymentId);
          await tx.wait();
          resolve("Order accepted successfully!");
        } catch (error) {
          console.error("Error accepting order: ", error);
          reject("Error accepting order");
          if (
            error.message.includes(
              "Start the voting process to accept this Payment"
            )
          ) {
            toast({
              title: "Attention",
              description: "Start voting to accept this order.",
              position: "top",
              status: "warning",
              duration: 2000,
              isClosable: true,
            });
            return;
          }
        }
      });

      // Show loading toast until the promise is resolved or rejected
      toast.promise(promise, {
        loading: { title: "Accepting order...", position: "top" },
        success: {
          title: "Success",
          description: "Order accepted successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to accept order",
          status: "error",
          position: "top",
          duration: 2000,
        },
        isClosable: true,
      });

      // Update state on success
      promise.then(() => {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === paymentId ? { ...request, accepted: true } : request
          )
        );
        setStatistics();
      });
    }
  };

  const handleSendAmount = async (paymentId) => {
    if (contractInstance && currentAccount) {
      // Create a promise that resolves when the transaction is done
      const promise = new Promise(async (resolve, reject) => {
        try {
          const request = requests.filter(
            (request) => request.id === paymentId
          )[0];
          let amount = ethers.utils.formatEther(request.value);

          amount = ethers.utils.parseEther(amount).toString();
          const tx = await contractInstance.payToContract(paymentId, {
            value: amount,
          });
          await tx.wait();
          resolve("Amount sent successfully!");
        } catch (error) {
          console.error("Error sending amount: ", error);
          reject("Error sending amount");
        }
      });

      // Show loading toast until the promise is resolved or rejected
      toast.promise(promise, {
        loading: { title: "Sending amount...", position: "top" },
        success: {
          title: "Success",
          description: "Amount sent successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to send amount",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      // Update state on success
      promise.then(() => {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.id === paymentId ? { ...request, paid: true } : request
          )
        );
        setStatistics();
      });
    }
  };

  return (
    <Box>
      <ConnectedAccount
        currentAccount={currentAccount}
        contractInstance={contractInstance}
        isVoter={isVoter}
      />
      <div className="bg-blue-100 my-20">
        <Center className="flex items-center justify-center flex-col border rounded-full bg-white">
          <Accordion allowToggle className="p-5 w-3/5">
            {requests.map((request) => (
              <AccordionItem key={request.id}>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      {request.accepted ? (
                        <MdCheckCircle
                          className="inline-block mr-2"
                          size={20}
                          color="green"
                        />
                      ) : (
                        <MdPending className="inline-block mr-2" size={20} />
                      )}
                      {`Order ${request.id}`}
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <UnorderedList>
                    <ListItem className="mb-2 text-sm font-semibold">
                      From: {request.from}
                    </ListItem>
                    <ListItem className="mb-2 text-sm font-semibold">
                      To: {request.to}
                    </ListItem>
                    <ListItem className="mb-2 text-sm font-semibold">
                      Value: {ethers.utils.formatEther(request.value)} Ether
                    </ListItem>
                    <ListItem className="mb-2 text-sm font-semibold">
                      Description: {request.description}
                    </ListItem>
                  </UnorderedList>
                  {!request.accepted &&
                    request.from === currentAccount &&
                    currentAccount !== constants.ownerAddress && (
                      <Box className="text-base w-fit font-semibold text-red-500 border border-red-500 p-2 rounded">
                        Order not yet accepted
                      </Box>
                    )}

                  {request.accepted &&
                    request.from === currentAccount &&
                    currentAccount !== constants.ownerAddress &&
                    !request.paid && (
                      <Button
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handleSendAmount(request.id)}
                        bgColor="blue.500"
                        _hover={{ bgColor: "blue.600" }}
                        color="white"
                      >
                        Send Amount
                      </Button>
                    )}

                  {request.accepted &&
                    request.from === currentAccount &&
                    currentAccount !== constants.ownerAddress &&
                    request.paid && (
                      <Box className="text-base w-fit font-semibold text-green-500 border border-green-500 p-2 rounded">
                        Amount Sent
                      </Box>
                    )}

                  {!request.accepted &&
                    currentAccount === constants.ownerAddress && (
                      <Button
                        className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
                        onClick={() => handleAcceptPayment(request.id)}
                        bgColor="green.500"
                        color="white"
                        _hover={{ bgColor: "green.600" }}
                      >
                        Accept Order
                      </Button>
                    )}

                  {request.accepted &&
                    currentAccount === constants.ownerAddress &&
                    request.from !== constants.ownerAddress &&
                    !request.paid && (
                      <Box className="text-base w-fit font-semibold text-teal-500 border border-teal-500 p-2 rounded">
                        Request Accepted
                      </Box>
                    )}

                  {request.accepted &&
                    currentAccount === constants.ownerAddress &&
                    request.from === constants.ownerAddress &&
                    !request.paid && (
                      <Button
                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={() => handleSendAmount(request.id)}
                        bgColor="blue.500"
                        color="white"
                        _hover={{ bgColor: "blue.600" }}
                      >
                        Send Amount
                      </Button>
                    )}

                  {request.accepted &&
                    currentAccount === constants.ownerAddress &&
                    request.from === constants.ownerAddress &&
                    request.paid && (
                      <Box className="text-base w-fit font-semibold text-teal-500 border border-teal-500 p-2 rounded">
                        Amount Sent
                      </Box>
                    )}

                  {request.accepted &&
                    currentAccount === request.to &&
                    request.paid && (
                      <Box className="text-base w-fit font-semibold text-teal-500 border border-teal-500 p-2 rounded">
                        Amount Received
                      </Box>
                    )}

                  {request.accepted &&
                    currentAccount === constants.ownerAddress &&
                    request.to === contractInstance.address &&
                    request.paid && (
                      <Box className="text-base w-fit font-semibold text-teal-500 border border-teal-500 p-2 rounded">
                        Amount Received
                      </Box>
                    )}

                  {request.accepted &&
                    currentAccount === request.to &&
                    !request.paid && (
                      <Box className="text-base w-fit font-semibold text-blue-500 border border-blue-500 p-2 rounded">
                        You need to take up this request order
                      </Box>
                    )}

                  {!request.accepted &&
                    currentAccount === request.to &&
                    !request.paid && (
                      <Box className="text-base font-semibold w-fit text-amber-500 border border-amber-500 p-2 rounded">
                        Received new order from the owner
                      </Box>
                    )}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Center>
      </div>
    </Box>
  );
};

export default Requests;
