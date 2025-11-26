import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import {
    CONTRACT_ABI,
    CONTRACT_ADDRESS,
    BACKEND_URL,
} from "../config/constants";

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [userRole, setUserRole] = useState(0);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chainId, setChainId] = useState(null);

    // Check if wallet is already connected on mount
    useEffect(() => {
        if (window.ethereum && window.ethereum.selectedAddress) {
            connectWallet();
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        try {
            setLoading(true);

            // Step 1: Request accounts
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            await web3Provider.send("eth_requestAccounts", []);

            // Step 2: Get signer and address
            const web3Signer = await web3Provider.getSigner();
            const address = await web3Signer.getAddress();

            // Step 3: Get network info
            const network = await web3Provider.getNetwork();
            console.log(`Connected to Chain ID: ${network.chainId}`);

            // Step 4: Create contract instance
            const contractInstance = new ethers.Contract(
                CONTRACT_ADDRESS,
                CONTRACT_ABI,
                web3Signer
            );

            // Step 5: Update state
            setAccount(address);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(contractInstance);
            setChainId(network.chainId.toString());
            console.log(`Connected to wallet: ${address}`);

            // Step 6: Fetch user role and data
            await fetchUserRoleAndData(contractInstance, address);
            setLoading(false);
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Failed to connect wallet: " + error.message);
            setLoading(false);
        }
    };

    const fetchUserRoleAndData = async (contractInstance, walletAddress) => {
        try {
            // 1. Try to get role from contract
            console.log("Fetching role from contract...");
            let contractRole = 0;
            try {
                const roleResult = await contractInstance.role(walletAddress);
                contractRole = Number(roleResult);
                console.log("Role from contract:", contractRole);
                setUserRole(contractRole);
            } catch (contractError) {
                // If CONTRACT_ADDRESS is wrong, this triggers.
                console.error(
                    "CRITICAL: Failed to read contract. Check CONTRACT_ADDRESS and ABI."
                );
                console.error(contractError);
                // Do not return here, allow fallback to backend for now
            }

            // 2. Fetch from backend
            try {
                const response = await fetch(
                    `${BACKEND_URL}/api/users/${walletAddress}`
                );

                if (response.ok) {
                    const data = await response.json();
                    console.log("User data found:", data);
                    setUserData(data);
                    
                    // Sync role if contract failed or returned 0 but backend has data
                    if (contractRole === 0 && data.role) {
                        // In a real app, you'd map data.role (string/number) to the contract's expected role number
                        // For simplicity, we just keep the contract role for now unless logic dictates otherwise
                        // E.g., if data.role is "Hospital", you might setUserRole(1);
                        // The user's original logic was commented out, so we rely on contractRole primarily
                    }
                } else if (response.status === 404) {
                    // THIS IS EXPECTED FOR NEW USERS
                    console.log("User is new (not in database).");
                    setUserData(null);
                } else {
                    console.error("Backend API Error:", response.statusText);
                }
            } catch (backendError) {
                console.error("Backend connection failed:", backendError);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
        }
    };

    const refreshUserRole = async () => {
        if (!contract || !account) {
            console.error("Contract or account not available for refresh");
            return;
        }
        console.log("Refreshing user role...");
        await fetchUserRoleAndData(contract, account);
        // Note: The console log here will show the OLD state value of userRole
        // The value has been updated, but the state setter is asynchronous.
        // console.log("Refresh complete. Current role:", userRole);
    };

    const disconnect = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setUserRole(0);
        setUserData(null);
        setChainId(null);
        console.log("Wallet disconnected");
    };

    // Listen for account changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            console.log("Accounts changed:", accounts);
            if (accounts.length > 0) {
                // Reconnect with new account
                connectWallet();
            } else {
                disconnect();
            }
        };

        const handleChainChanged = (newChainId) => {
            console.log("Chain changed to:", newChainId);
            // Reload the page on chain change to ensure correct context
            window.location.reload();
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            if (window.ethereum.removeListener) {
                window.ethereum.removeListener(
                    "accountsChanged",
                    handleAccountsChanged
                );
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            }
        };
    }, []);

    return (
        <Web3Context.Provider
            value={{
                account,
                provider,
                signer,
                contract,
                userRole,
                userData,
                loading,
                chainId,
                connectWallet,
                disconnect,
                refreshUserRole,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error("useWeb3 must be used within Web3Provider");
    }
    return context;
};