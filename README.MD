Healthcare DApp

A full-stack decentralized healthcare management system built with Solidity, Truffle, Ganache, Node.js (Express), MongoDB, React (Vite), and Docker Compose.
The project demonstrates complete Web3 integration with persistent blockchain storage, automatic smart contract deployment, and real-time event syncing between blockchain and backend.

Features
Blockchain

Smart contract written in Solidity (0.8.17)

Truffle for compilation & migration

Ganache CLI with persistent blockchain state

Automatic ABI and contract address export to backend and frontend

Backend (Node.js / Express)

REST API for user, records, appointments, prescriptions, claims

Ethers.js for blockchain communication

Real-time contract event listeners

MongoDB for off-chain data storage

Frontend (React + Vite)

MetaMask wallet connection

Displays user role from smart contract

Integrates with backend API for off-chain data

Reads contract address from environment variables

Dockerized Architecture

All modules run in separate containers:

ganache

truffle

backend

frontend

mongodb

Contracts are automatically migrated before backend and frontend start.

Getting Started
1. Clone the repository
git clone https://github.com/yourusername/healthcare-dapp.git
cd healthcare-dapp

2. Build and start the entire stack
docker-compose up --build


This will:

Start MongoDB

Start Ganache with persistent storage

Run Truffle to compile & migrate contracts

Copy ABI and contract address to backend & frontend

Start backend (port 4000)

Start frontend (port 5173)

Access the Application

Frontend: http://localhost:5173

Backend API: http://localhost:4000

Ganache RPC: http://localhost:8545

MongoDB: mongodb://localhost:27017

Persistent Blockchain State

Ganache uses a Docker volume:

ganache_data:/data


This ensures:

Accounts

Balances

Contract deployments

Blocks & transactions

persist even after restarting Docker.
