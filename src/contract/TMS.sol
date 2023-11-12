// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TreasuryManagement {
    address public owner;
    uint256 public votingStartTime;
    uint256 public constant VOTING_DURATION = 90;

    struct Payment {
        uint256 id;
        address from;
        address to;
        uint256 value;
        bool accepted;
        bool isVotingTime;
        bool paid;
        string description;
        address[] votedYes;
        address[] votedNo;
    }

    Payment[] public payments;
    address[] public daoMembers;
    uint256 public noOfPayments = 0;
    int256 public currentVotingPaymentId = -1;

    bool public isVotingOpen;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyDuringVoting() {
        require(isVotingOpen, "Voting is not in progress");
        require(
            block.timestamp < votingStartTime + VOTING_DURATION,
            "Voting period has ended"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function requestPayment(
        address _to,
        uint256 _value,
        string memory _description
    ) external {
        require(_value > 0, "Payment value should be greater than 0 ETH");

        payments.push(
            Payment({
                id: noOfPayments,
                from: msg.sender,
                to: _to,
                value: _value,
                accepted: false,
                isVotingTime: false,
                paid: false,
                votedYes: new address[](0),
                votedNo: new address[](0),
                description: _description
            })
        );
        noOfPayments++;
    }

    function acceptPayment(uint256 _index) external onlyOwner {
        require(_index < payments.length, "Invalid Payment index");
        Payment storage p = payments[_index];
        require(!p.accepted, "Payment already accepted");
        if (p.from == owner) {
            if (p.votedYes.length > p.votedNo.length) {
                p.accepted = true;
            } else if (p.votedYes.length == 0 && p.votedNo.length == 0) {
                revert("You need to start voting process to accept this.");
            } else {
                revert("DAO has decided not to accept the offer.");
            }
        } else {
            if (p.value < 0.02 ether) {
                p.accepted = true;
            } else if (
                p.value >= 0.02 ether &&
                _index == uint256(currentVotingPaymentId) &&
                !isVotingOpen
            ) {
                if (p.votedYes.length > p.votedNo.length) {
                    p.accepted = true;
                } else {
                    revert("DAO has decided not to accept the offer.");
                }
            } else {
                revert("Start the voting process to accept this Payment");
            }
        }

        currentVotingPaymentId = -1;
    }

    function payToContract(uint256 _paymentId) external payable {
        require(_paymentId < payments.length, "Invalid Payment ID");
        Payment storage p = payments[_paymentId];
        require(p.from == msg.sender, "You are not the requested payment user");
        require(
            msg.value == p.value,
            "Entered amount is not equal to the requested payment amount"
        );
        p.paid = true;
    }

    function payToAccount(uint256 _paymentId, address _to) external onlyOwner {
        require(_paymentId < payments.length, "Invalid Payment ID");
        Payment storage p = payments[_paymentId];
        require(p.to == _to, "Recipient address did not match");
        require(p.value > 0, "Invalid payment value for this payment");

        require(
            address(this).balance >= p.value,
            "Insufficient contract balance"
        );

        (bool success, ) = payable(_to).call{value: p.value}("");
        require(success, "Transfer failed");
        p.paid = true;
    }

    function startVoting(uint256 _paymentId) external onlyOwner {
        require(_paymentId < payments.length, "Invalid Payment ID");

        Payment storage selectedPayment = payments[_paymentId];
        if (selectedPayment.from == owner) {
            isVotingOpen = true;
            selectedPayment.isVotingTime = true;
            currentVotingPaymentId = int256(_paymentId);
            votingStartTime = block.timestamp;
        } else {
            require(
                selectedPayment.value >= 0.02 ether,
                "Payment should be 0.02 ETH or more to start voting"
            );
            isVotingOpen = true;
            currentVotingPaymentId = int256(_paymentId);
            votingStartTime = block.timestamp;
            selectedPayment.isVotingTime = true;
        }
    }

    function getRemainingVotingTime() public view returns (uint256) {
        if (isVotingOpen) {
            uint256 elapsedTime = block.timestamp - votingStartTime;
            if (elapsedTime >= VOTING_DURATION) {
                return 0; // Voting period ended
            } else {
                return VOTING_DURATION - elapsedTime; // Calculate remaining time
            }
        } else {
            return 0; // Voting is not open
        }
    }

    function becomeDAO() external payable {
        require(
            msg.value >= 0.001 ether,
            "Minimum 0.001 ETH required to become DAO member"
        );
        daoMembers.push(msg.sender);
    }

    function exitDAO() external {
        for (uint256 i = 0; i < daoMembers.length; i++) {
            if (daoMembers[i] == msg.sender) {
                daoMembers[i] = daoMembers[daoMembers.length - 1];
                daoMembers.pop();
                break;
            }
        }
    }

    function vote(bool _choice) external payable onlyDuringVoting {
        bool isDaoMember = false;
        for (uint256 i = 0; i < daoMembers.length; i++) {
            if (daoMembers[i] == msg.sender) {
                isDaoMember = true;
                break;
            }
        }

        require(isDaoMember, "You have not joined the voting");

        Payment storage selectedPayment = payments[
            uint256(currentVotingPaymentId)
        ];

        // Check if the sender has already voted for the current payment
        require(
            !hasAlreadyVoted(selectedPayment, msg.sender),
            "You have already voted"
        );

        if (_choice) {
            selectedPayment.votedYes.push(msg.sender);
        } else {
            selectedPayment.votedNo.push(msg.sender);
        }
    }

    function hasAlreadyVoted(Payment memory _payment, address _voter)
        public
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < _payment.votedYes.length; i++) {
            if (_payment.votedYes[i] == _voter) {
                return true;
            }
        }

        for (uint256 i = 0; i < _payment.votedNo.length; i++) {
            if (_payment.votedNo[i] == _voter) {
                return true;
            }
        }

        return false;
    }

    function getCurrentVotingPaymentId() external view returns (int256) {
        return currentVotingPaymentId;
    }

    function isInVotingPeriod(uint256 _paymentId) external view returns (bool) {
        return (isVotingOpen && _paymentId == uint256(currentVotingPaymentId));
    }

    function endVoting() external onlyOwner {
        require(isVotingOpen, "Voting is not in progress");
        Payment storage selectedPayment = payments[
            uint256(currentVotingPaymentId)
        ];
        require(
            block.timestamp >= votingStartTime + VOTING_DURATION,
            "Voting period is not over yet"
        );
        isVotingOpen = false;
        selectedPayment.isVotingTime = false;
    }

    function getAllPayments() external view returns (Payment[] memory) {
        return payments;
    }

    function getAllDAOMembers() external view returns (address[] memory) {
        return daoMembers;
    }

    function getAllRequestedOrders() external view returns (Payment[] memory) {
        uint256 count = 0;

        // Count the number of requested orders
        for (uint256 i = 0; i < payments.length; i++) {
            if (
                (!payments[i].accepted &&
                    !payments[i].paid &&
                    payments[i].value >= 0.02 ether) ||
                (payments[i].from == owner && !payments[i].paid && !payments[i].accepted)
            ) {
                count++;
            }
        }

        // Create an array to store requested orders
        Payment[] memory requestedOrders = new Payment[](count);

        // Fill the array with requested orders
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            if (
                (!payments[i].accepted &&
                    !payments[i].paid &&
                    payments[i].value >= 0.02 ether) ||
                (payments[i].from == owner && !payments[i].paid && !payments[i].accepted)
            ) {
                requestedOrders[currentIndex] = payments[i];
                currentIndex++;
            }
        }

        return requestedOrders;
    }

    function getCurrentInflows() public view returns (uint256) {
        uint256 currentInflows = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (
                payments[i].to == address(this) &&
                payments[i].accepted &&
                payments[i].paid
            ) {
                currentInflows += payments[i].value;
            }
        }

        return currentInflows;
    }

    function getFutureInflows() public view returns (uint256) {
        uint256 futureInflows = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (
                payments[i].to == address(this) &&
                payments[i].accepted &&
                !payments[i].paid
            ) {
                futureInflows += payments[i].value;
            }
        }

        return futureInflows;
    }

    function getCurrentOutflows() public view returns (uint256) {
        uint256 currentOutflows = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (
                payments[i].from == owner &&
                payments[i].accepted &&
                payments[i].paid
            ) {
                currentOutflows += payments[i].value;
            }
        }

        return currentOutflows;
    }

    function getFutureOutflows() public view returns (uint256) {
        uint256 futureOutflows = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (
                payments[i].from == owner &&
                payments[i].accepted &&
                !payments[i].paid
            ) {
                futureOutflows += payments[i].value;
            }
        }

        return futureOutflows;
    }

    function calculateCompanyRating() external view returns (string memory) {
        uint256 futureInflows = getFutureInflows();
        uint256 currentInflows = getCurrentInflows();
        uint256 futureOutflows = getFutureOutflows();
        uint256 currentOutflows = getCurrentOutflows();

        if (
            currentInflows > futureInflows && currentOutflows > futureOutflows
        ) {
            return "Good"; // Indicates a healthy balance between inflows and outflows.
        } else if (
            currentInflows > futureInflows || currentOutflows > futureOutflows
        ) {
            return "Average"; // Indicates an imbalance between accepted and pending transactions in either inflows or outflows.
        } else {
            return "Bad"; // Implies a significant number of pending transactions compared to accepted ones, potentially signifying financial concerns or inefficiencies in management.
        }
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
