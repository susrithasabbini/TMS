// StatisticsModal.js

import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { VscGraph } from "react-icons/vsc";

function StatisticsModal({
  isOpen,
  onClose,
  contractInstance,
  currentAccount,
  isStatisticsChanged,
}) {
  const [companyRating, setCompanyRating] = useState("");
  const [getCurrentInflows, setCurrentInflows] = useState("");
  const [getCurrentOutflows, setCurrentOutflows] = useState("");
  const [getFutureInflows, setFutureInflows] = useState("");
  const [getFutureOutflows, setFutureOutflows] = useState("");

  useEffect(() => {
    const statistics = async () => {
      if (contractInstance && currentAccount) {
        try {
          const companyRating = await contractInstance.calculateCompanyRating();
          setCompanyRating(companyRating);
          let getCurrentInflows = await contractInstance.getCurrentInflows();
          getCurrentInflows = ethers.utils.formatEther(getCurrentInflows);
          setCurrentInflows(getCurrentInflows);
          let getCurrentOutflows = await contractInstance.getCurrentOutflows();
          getCurrentOutflows = ethers.utils.formatEther(getCurrentOutflows);
          setCurrentOutflows(getCurrentOutflows);
          let getFutureInflows = await contractInstance.getFutureInflows();
          getFutureInflows = ethers.utils.formatEther(getFutureInflows);
          setFutureInflows(getFutureInflows);
          let getFutureOutflows = await contractInstance.getFutureOutflows();
          getFutureOutflows = ethers.utils.formatEther(getFutureOutflows);
          setFutureOutflows(getFutureOutflows);
        } catch (error) {
          console.error("Error fetching requests: ", error);
        }
      }
    };

    statistics();
  }, [contractInstance, currentAccount, isStatisticsChanged]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent className="p-4">
        <ModalHeader className="text-2xl font-bold">Statistics</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <td className="px-4 py-2 font-bold">Title</td>
                  <td className="px-4 py-2 font-bold">Value</td>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-100">
                  <td className="border px-4 py-2">Current Inflows</td>
                  <td className="border px-4 py-2">{getCurrentInflows} ETH</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border px-4 py-2">Current Outflows</td>
                  <td className="border px-4 py-2">{getCurrentOutflows} ETH</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border px-4 py-2">Future Inflows</td>
                  <td className="border px-4 py-2">{getFutureInflows} ETH</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border px-4 py-2">Future Outflows</td>
                  <td className="border px-4 py-2">{getFutureOutflows} ETH</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Flex className="justify-between p-4 mt-3">
            <div className="flex gap-2 items-center">
              <Icon as={VscGraph} color="blue.600" boxSize={7} />
              <Text color="blue.600" fontWeight="bold">
                {" "}
                {companyRating}
              </Text>
            </div>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default StatisticsModal;
