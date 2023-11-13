// App.js

import "./App.css";
import Home from "./pages/Home";
import Voting from "./pages/Voting";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import constants from "./contract/constants";
import {
  Flex,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import Requests from "./pages/Requests";
import { MdQueryStats } from "react-icons/md";
import StatisticsModal from "./components/StatisticsModal";

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [contractInstance, setContractInstance] = useState(null);
  const toast = useToast();
  const [isOwner, setIsOwner] = useState(false);
  const [isVoter, setIsVoter] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [requested, setRequested] = useState(false);

  const [daoMembers, setDaoMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatisticsChanged, setIsStatisticsChanged] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    if (contractInstance) {
      const fetchDaoMembers = async () => {
        try {
          const members = await contractInstance.getAllDAOMembers();
          setDaoMembers(members);
          setIsVoter(currentAccount && members.includes(currentAccount));
        } catch (error) {
          console.error("Error fetching DAO members: ", error);
        }
      };
      fetchDaoMembers();
    }
  }, [contractInstance, currentAccount]);

  const handleRequest = () => {
    setRequested(true);
  };

  const handleStatistics = () => {
    setIsStatisticsChanged((prev) => !prev);
  };

  useEffect(() => {
    const loadBlockchainData = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          // Requesting access to user accounts from MetaMask
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            constants.contractAddress,
            constants.contractAbi,
            signer
          );
          setContractInstance(contract);

          const accounts = await provider.listAccounts();
          setCurrentAccount(accounts[0]);
          setIsOwner(
            accounts[0].toLowerCase() === constants.ownerAddress.toLowerCase()
          );
          setInitialLoad(false);
        } catch (error) {
          console.error("Error loading blockchain data:", error);
        }
      } else {
        window.alert("Please install MetaMask");
      }
    };

    loadBlockchainData();
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      const updateAccounts = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        setCurrentAccount(accounts[0]);
        setIsOwner(
          accounts[0].toLowerCase() === constants.ownerAddress.toLowerCase()
        );
        setIsVoter(daoMembers.includes(accounts[0]));
      };

      window.ethereum.on("accountsChanged", updateAccounts);
    }
  }, [initialLoad, daoMembers]);

  useEffect(() => {
    if (!initialLoad && contractInstance) {
      let message = "";
      if (isOwner) {
        message = "You are the owner!";
      } else if (isVoter) {
        message = "You are a DAO member!";
      } else {
        message = "You are a client!";
      }

      if (message && currentAccount) {
        const showToast = (message) => {
          toast({
            title: message,
            status: "info",
            position: "top",
            isClosable: true,
          });
        };
        toast.closeAll();
        showToast(message);
      }
    }
  }, [isOwner, isVoter, initialLoad, contractInstance, currentAccount, toast]);

  return (
    <>
      <Tabs variant="enclosed" size="md" className="align-middle p-10">
        <Flex justifyContent="space-between" alignItems="center">
          <TabList>
            {currentAccount === constants.ownerAddress ? (
              <>
                <Tab className="w-52">Home</Tab>
                <Tab className="w-52">Voting</Tab>
                <Tab className="w-52">Requests</Tab>
              </>
            ) : isVoter ? (
              <>
                <Tab className="w-52">Voting</Tab>
                <Tab className="w-52">Requests</Tab>
              </>
            ) : (
              <>
                <Tab className="w-52">Home</Tab>
                <Tab className="w-52">Requests</Tab>
              </>
            )}
          </TabList>
          {(currentAccount === constants.ownerAddress || isVoter) && (
            <Flex alignItems="center" onClick={toggleModal} cursor="pointer">
              <Icon as={MdQueryStats} color="blue.600" boxSize={8} />
              <Text ml="2" className="text-gray-500 text-lg">
                Statistics
              </Text>
            </Flex>
          )}
        </Flex>

        {currentAccount === constants.ownerAddress ? (
          <TabPanels>
            <TabPanel>
              <Home
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                setRequest={handleRequest}
                isVoter={isVoter}
              />
            </TabPanel>
            <TabPanel>
              <Voting
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                owner={constants.ownerAddress}
                requested={requested}
                isVoter={isVoter}
              />
            </TabPanel>
            <TabPanel>
              <Requests
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                requested={requested}
                isVoter={isVoter}
                setStatistics={handleStatistics}
              />
            </TabPanel>
          </TabPanels>
        ) : isVoter ? (
          <TabPanels>
            <TabPanel>
              <Voting
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                owner={constants.ownerAddress}
                isVoter={isVoter}
                requested={requested}
              />
            </TabPanel>
            <TabPanel>
              <Requests
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                requested={requested}
                isVoter={isVoter}
                setStatistics={handleStatistics}
              />
            </TabPanel>
          </TabPanels>
        ) : (
          <TabPanels>
            <TabPanel>
              <Home
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                setRequest={handleRequest}
                isVoter={isVoter}
              />
            </TabPanel>
            <TabPanel>
              <Requests
                contractInstance={contractInstance}
                currentAccount={currentAccount}
                requested={requested}
                isVoter={isVoter}
                setStatistics={handleStatistics}
              />
            </TabPanel>
          </TabPanels>
        )}
      </Tabs>
      <StatisticsModal
        isOpen={isModalOpen}
        onClose={toggleModal}
        contractInstance={contractInstance}
        currentAccount={currentAccount}
        isStatisticsChanged={isStatisticsChanged}
      />
    </>
  );
}

export default App;
