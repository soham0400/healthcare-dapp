export const CONTRACT_ABI = [
  // View functions
  "function role(address) view returns (uint8)",
  "function owner() view returns (address)",
  "function accessGranted(address, address) view returns (bool)",
  "function assignedDoctor(address) view returns (address)",
  "function insuranceBalances(address) view returns (uint256)",
  
  // Registration
  "function registerRole(uint8 _role) external",
  
  // Medical Records
  "function addMedicalRecord(address patient, string ipfsHash) external",
  "function getMedicalRecordCount(address patient) view returns (uint256)",
  "function getMedicalRecord(address patient, uint256 idx) view returns (string, address, uint256)",
  
  // Access Management
  "function grantAccess(address grantee) external",
  "function revokeAccess(address grantee) external",
  
  // Doctor Management
  "function addDoctorToHospital(address doctor) external",
  "function assignDoctor(address patient, address doctor) external",
  
  // Prescriptions
  "function addPrescription(address patient, string ipfsHash) external",
  "function getPrescriptionCount(address patient) view returns (uint256)",
  "function getPrescription(address patient, uint256 index) view returns (string, address, uint256, bool)",
  "function fillPrescription(address patient, uint256 index) external",
  
  // Appointments
  "function bookAppointment(address doctor, uint256 when) external returns (uint256)",
  "function approveAppointment(uint256 appointmentId) external",
  "function cancelAppointment(uint256 appointmentId) external",
  
  // Insurance
  "function depositInsurance() external payable",
  "function createClaim(address patient, uint256 amount, address insurer) external returns (uint256)",
  "function approveClaim(uint256 claimId) external",
  "function rejectClaim(uint256 claimId) external",
  
  // Events
  "event RoleRegistered(address indexed who, uint8 role)",
  "event MedicalRecordAdded(address indexed patient, address indexed uploader, string ipfsHash, uint256 timestamp)",
  "event PrescriptionAdded(address indexed patient, address indexed doctor, string ipfsHash, uint256 timestamp)",
  "event PrescriptionFilled(address indexed patient, uint256 indexed index, address indexed pharmacy)",
  "event AccessChanged(address indexed patient, address indexed grantee, bool allowed)",
  "event DoctorAddedToHospital(address indexed hospital, address indexed doctor)",
  "event DoctorAssigned(address indexed patient, address indexed doctor, address indexed hospital)",
  "event AppointmentCreated(uint256 indexed appointmentId, address indexed patient, address indexed doctor, uint256 when)",
  "event AppointmentApproved(uint256 indexed appointmentId, address indexed doctor)",
  "event AppointmentCancelled(uint256 indexed appointmentId, address indexed cancelledBy)",
  "event InsuranceDeposited(address indexed insurer, uint256 amount)",
  "event ClaimCreated(uint256 indexed claimId, address indexed hospital, address indexed patient, uint256 amount)",
  "event ClaimApproved(uint256 indexed claimId, address indexed insurer, address indexed hospital, uint256 amount)",
  "event ClaimRejected(uint256 indexed claimId, address indexed insurer, address indexed hospital)"
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const BACKEND_URL = "http://localhost:4000";

export const ROLES = {
  NONE: 0,
  PATIENT: 1,
  DOCTOR: 2,
  HOSPITAL: 3,
  PHARMACY: 4,
  INSURANCE: 5
};

export const ROLE_NAMES = {
  0: "None",
  1: "Patient",
  2: "Doctor",
  3: "Hospital",
  4: "Pharmacy",
  5: "Insurance"
};