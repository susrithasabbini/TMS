import React, { useEffect, useState } from "react";
import ConnectedAccount from "../components/ConnectedAccount";
import {
  Box,
  Text,
  useToast,
  Button,
  Flex,
  Heading,
  CardBody,
  Stack,
  CardHeader,
  Card,
  Divider,
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Select } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

var TIME = 90;

const Voting = ({
  contractInstance,
  currentAccount,
  owner,
  isVoter,
  requested,
}) => {
  const [paymentId, setPaymentId] = useState(-1);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [payment, setPayment] = useState(null);
  const [remainingTime, setRemainingTime] = useState(TIME); // Using the global variable
  const toast = useToast();
  const [allRequestedOrders, setAllRequestedOrders] = useState([]);
  const [isVoted, setIsVoted] = useState(false);
  const [justNowVoted, setJustNowVoted] = useState(false);

  useEffect(() => {
    const fetchRemainingVotingTime = async () => {
      if (contractInstance && currentAccount) {
        try {
          const remainingTime = await contractInstance.getRemainingVotingTime();
          setRemainingTime(remainingTime.toNumber());
          if (remainingTime.toNumber() === 0) {
            setIsVotingOpen(false);
          } else {
            setIsVotingOpen(true);
          }
          const intervalId = setInterval(() => {
            setRemainingTime((prevTime) => {
              if (prevTime > 0) {
                return prevTime - 1;
              } else {
                clearInterval(intervalId);
                return 0;
              }
            });
          }, 1000);
        } catch (error) {
          console.error("Error fetching remaining voting time: ", error);
        }
      }
    };

    fetchRemainingVotingTime();
  }, [contractInstance, currentAccount]);

  useEffect(() => {
    const fetchIsVoted = async () => {
      if (payment && contractInstance && currentAccount) {
        try {
          const isVoted = await contractInstance.hasAlreadyVoted(
            payment,
            currentAccount
          );
          setIsVoted(isVoted);
        } catch (error) {
          console.error("Error fetching is voted: ", error);
        }
      }
    };
    fetchIsVoted();
  }, [contractInstance, currentAccount, payment, isVoted]);

  useEffect(() => {
    const fetchCurrentVotingPaymentId = async () => {
      if (contractInstance && currentAccount) {
        try {
          const paymentId = await contractInstance.getCurrentVotingPaymentId();
          const payments = await contractInstance.getAllPayments();
          if (payments[paymentId.toNumber()].isVotingTime === true) {
            setPaymentId(paymentId.toNumber());
            setPayment(payments[paymentId.toNumber()]);
          }
        } catch (error) {
          console.error("Error fetching current voting payment ID: ", error);
        }
      }
    };
    const fetchIsVotingOpen = async () => {
      if (contractInstance && currentAccount) {
        try {
          const isVotingOpen = await contractInstance.isVotingOpen();
          setIsVotingOpen(isVotingOpen);
        } catch (error) {
          console.error("Error fetching is voting open: ", error);
        }
      }
    };
    const fetchAllRequestedOrders = async () => {
      if (contractInstance && currentAccount) {
        try {
          const allRequestedOrders =
            await contractInstance.getAllRequestedOrders();
          setAllRequestedOrders(allRequestedOrders);
        } catch (error) {
          console.error("Error fetching all requested orders: ", error);
        }
      }
    };
    fetchCurrentVotingPaymentId();
    fetchIsVotingOpen();
    fetchAllRequestedOrders();
  }, [contractInstance, currentAccount, requested]);

  const startVoting = async (paymentId) => {
    if (contractInstance && currentAccount) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.startVoting(paymentId);
          await tx.wait();
          const payments = await contractInstance.getAllPayments();
          if (payments[paymentId].isVotingTime === true) {
            setPayment(payments[paymentId]);
          }
          resolve("Voting started successfully!");
        } catch (error) {
          console.error("Error starting voting: ", error);
          reject("Failed to start voting");
        }
      });

      toast.promise(promise, {
        loading: { title: "Starting Voting...", position: "top" },
        success: {
          title: "Success",
          description: "Voting started successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to start voting",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      promise.then(() => {
        setIsVotingOpen(true);
        setRemainingTime(TIME);
        const intervalId = setInterval(() => {
          setRemainingTime((prevTime) => {
            if (prevTime > 0) {
              return prevTime - 1;
            } else {
              clearInterval(intervalId);
              return 0;
            }
          });
        }, 1000);
      });
    }
  };

  const endVoting = async () => {
    if (contractInstance && currentAccount) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.endVoting();
          await tx.wait();
          resolve("Voting ended successfully!");
        } catch (error) {
          console.error("Error ending voting: ", error);
          reject("Failed to end voting");
        }
      });

      toast.promise(promise, {
        loading: { title: " Voting...", position: "top" },
        success: {
          title: "Success",
          description: "Voting ended successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to end voting",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      promise.then(() => {
        setIsVotingOpen(false);
        setRemainingTime(TIME);
      });
    }
  };

  const vote = async (vote) => {
    if (contractInstance && currentAccount) {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const tx = await contractInstance.vote(vote);
          await tx.wait();
          setIsVoted(true);
          resolve("Voted successfully!");
        } catch (error) {
          if (error.message.includes("Voting period has ended")) {
            toast({
              title: "Error",
              description: "Voting period has ended",
              status: "error",
              position: "top",
              isClosable: true,
            });
          } else if (error.message.includes("Already voted")) {
            toast({
              title: "Error",
              description: "Already voted",
              status: "error",
              position: "top",
              isClosable: true,
            });
          }
          console.error("Error voting: ", error);
          setIsVoted(false);
          reject("Failed to vote");
        }
      });

      toast.promise(promise, {
        loading: { title: "Voting...", position: "top" },
        success: {
          title: "Success",
          description: "Voted successfully!",
          status: "success",
          position: "top",
        },
        error: {
          title: "Error",
          description: "Failed to vote",
          status: "error",
          position: "top",
        },
        isClosable: true,
      });

      promise.then((data) => {
        console.log(data);
        setIsVoted(true);
        setJustNowVoted(true);
      });
    }
  };

  return (
    <div className="flex flex-col items-center w-[95vw]">
      <ConnectedAccount
        currentAccount={currentAccount}
        contractInstance={contractInstance}
        isVoter={isVoter}
      />

      {currentAccount === owner && !isVotingOpen && (
        <Flex direction="column" alignItems="center" mt="4">
          <Select
            placeholder="Select order ID"
            onChange={(e) => setPaymentId(e.target.value)}
            mb="4"
          >
            {allRequestedOrders.map((order) => (
              <option key={order.id} value={order.id.toString()}>
                Order ID: {order.id.toString()} - Value:{" "}
                {ethers.utils.formatEther(order.value.toString())} ETH
              </option>
            ))}
          </Select>
          <Button onClick={() => startVoting(paymentId)} colorScheme="blue">
            Start Voting
          </Button>
        </Flex>
      )}

      {currentAccount === owner && isVotingOpen && (
        <Button
          alignItems="center"
          textAlign="center"
          rightIcon={<CloseIcon className="w-2 h-2 ml-2" boxSize="3" />}
          color="white"
          backgroundColor="red.400"
          isDisabled={remainingTime !== 0}
          mt="4"
          onClick={() => endVoting()}
          _hover={{ backgroundColor: "red.500" }}
        >
          End Voting
        </Button>
      )}

      {isVotingOpen && payment && (
        <Card className="mt-6 w-[40vw]">
          <CardHeader>
            <Heading size="md" color="blue.600">
              Voting Section
            </Heading>
          </CardHeader>

          <CardBody>
            <Stack spacing="4">
              <Box>
                <Heading
                  size="sm"
                  textTransform="uppercase"
                  className="text-gray-700"
                >
                  Voting Details
                </Heading>
                <Text pt="2" fontSize="sm" className="text-gray-600">
                  Voting is open for Request Order ID: {paymentId}
                </Text>
              </Box>
              <Divider />
              <Box>
                <Heading
                  size="sm"
                  textTransform="uppercase"
                  className="py-3 text-gray-700"
                >
                  Request Order Information
                </Heading>
                <Text className="text-gray-500 text-sm">
                  <strong className="text-gray-600 font-semibold text-base">
                    Order:
                  </strong>{" "}
                  {payment && ethers.utils.formatEther(payment.value)} ETH
                </Text>
                <Text className="text-gray-500 text-sm">
                  <strong className="text-gray-600 font-semibold text-base">
                    From:
                  </strong>{" "}
                  {payment && payment.from}
                </Text>
                <Text className="text-gray-500 text-sm">
                  <strong className="text-gray-600 font-semibold text-base">
                    To:
                  </strong>{" "}
                  {payment && payment.to}
                </Text>
                <Text className="text-gray-500 text-sm">
                  <strong className="text-gray-600 font-semibold text-base">
                    Description:
                  </strong>{" "}
                  {payment && payment.description}
                </Text>
                <Text mt="2" className="text-gray-500 text-sm">
                  <strong className="text-gray-600 font-semibold text-base">
                    Remaining Time:
                  </strong>{" "}
                  <Flex align="center" justify="center">
                    <CircularProgress
                      size="60px"
                      value={100 - (remainingTime / TIME) * 100}
                      color="yellow.400"
                    >
                      <CircularProgressLabel>
                        {remainingTime}s
                      </CircularProgressLabel>
                    </CircularProgress>
                  </Flex>
                </Text>
                {currentAccount === owner && (
                  <>
                    <Text mt="2" className="text-gray-500 text-sm">
                      <strong className="text-gray-600 font-semibold text-base">
                        Yes Votes:
                      </strong>{" "}
                      {payment && payment.votedYes.length}
                    </Text>
                    <Text mt="2" className="text-gray-500 text-sm">
                      <strong className="text-gray-600 font-semibold text-base">
                        No Votes:
                      </strong>{" "}
                      {payment && payment.votedNo.length}
                    </Text>
                    <Text mt="2" className="text-gray-500 text-sm">
                      <strong className="text-gray-600 font-semibold text-base">
                        Can accept order:
                      </strong>{" "}
                      {payment &&
                      payment.votedYes.length > payment.votedNo.length ? (
                        <span className="text-green-600 font-bold text-lg">
                          Yes (Risk:{" "}
                          {(payment.votedYes.length /
                            (payment.votedYes.length +
                              payment.votedNo.length)) *
                            100}
                          {"%"})
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold text-lg">
                          No (Risk:{" "}
                          {(payment.votedYes.length /
                            (payment.votedYes.length +
                              payment.votedNo.length)) *
                            100}
                          {"%"})
                        </span>
                      )}
                    </Text>
                  </>
                )}
              </Box>

              {isVoter && (
                <Flex mt="4" justify="space-around">
                  <Button
                    colorScheme="blue"
                    onClick={() => vote(true)}
                    className="w-1/3"
                    isDisabled={isVoted || justNowVoted}
                  >
                    Yes
                  </Button>
                  <Button
                    colorScheme="gray"
                    className="w-1/3"
                    onClick={() => vote(false)}
                    isDisabled={isVoted || justNowVoted}
                  >
                    No
                  </Button>
                </Flex>
              )}
            </Stack>
          </CardBody>
        </Card>
      )}

      {isVoter && !isVotingOpen && <Text mt="4">Voting not yet open</Text>}
    </div>
  );
};

export default Voting;
