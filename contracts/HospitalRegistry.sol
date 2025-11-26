// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * HospitalRegistry.sol
 * Updated: Prescriptions separated from general medical records.
 */
contract HospitalRegistry {
    enum Role { None, Patient, Doctor, Hospital, Pharmacy, Insurance }
    address public owner;

    mapping(address => Role) public role;

    constructor() {
        owner = msg.sender;
        role[msg.sender] = Role.Hospital;
    }

    // ------------ Events ------------
    event RoleRegistered(address indexed who, Role role);
    event MedicalRecordAdded(address indexed patient, address indexed uploader, string ipfsHash, uint256 timestamp);
    event PrescriptionAdded(address indexed patient, address indexed doctor, string ipfsHash, uint256 timestamp);
    event PrescriptionFilled(address indexed patient, uint256 indexed index, address indexed pharmacy);
    event AccessChanged(address indexed patient, address indexed grantee, bool allowed);
    event DoctorAddedToHospital(address indexed hospital, address indexed doctor);
    event DoctorAssigned(address indexed patient, address indexed doctor, address indexed hospital);
    event AppointmentCreated(uint256 indexed appointmentId, address indexed patient, address indexed doctor, uint256 when);
    event AppointmentApproved(uint256 indexed appointmentId, address indexed doctor);
    event AppointmentCancelled(uint256 indexed appointmentId, address indexed cancelledBy);
    event InsuranceDeposited(address indexed insurer, uint256 amount);
    event ClaimCreated(uint256 indexed claimId, address indexed hospital, address indexed patient, uint256 amount);
    event ClaimApproved(uint256 indexed claimId, address indexed insurer, address indexed hospital, uint256 amount);
    event ClaimRejected(uint256 indexed claimId, address indexed insurer, address indexed hospital);

    // ------------ Modifiers ------------
    modifier onlyRole(Role _r) {
        require(role[msg.sender] == _r, "caller not in role");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    // ------------ Records & Permissions ------------
    struct MedicalRecord {
        string ipfsHash;
        address uploader;
        uint256 timestamp;
    }

    struct Prescription {
        string ipfsHash;
        address doctor;
        uint256 timestamp;
        bool filled;
    }

    mapping(address => MedicalRecord[]) private medicalRecords;
    mapping(address => Prescription[]) private prescriptions;

    mapping(address => mapping(address => bool)) public accessGranted;

    function registerRole(uint8 _role) external {
        require(_role <= uint8(Role.Insurance), "invalid role");
        role[msg.sender] = Role(_role);
        emit RoleRegistered(msg.sender, Role(_role));
    }

    // ------------ Medical Records ------------
    function addMedicalRecord(address patient, string calldata ipfsHash) external {
        require(
            msg.sender == patient || role[msg.sender] == Role.Doctor || role[msg.sender] == Role.Hospital,
            "not allowed"
        );
        medicalRecords[patient].push(MedicalRecord(ipfsHash, msg.sender, block.timestamp));
        emit MedicalRecordAdded(patient, msg.sender, ipfsHash, block.timestamp);
    }

    function getMedicalRecordCount(address patient) external view returns (uint256) {
        return medicalRecords[patient].length;
    }

    function getMedicalRecord(address patient, uint256 idx)
        external
        view
        returns (string memory, address, uint256)
    {
        require(idx < medicalRecords[patient].length, "out of range");
        MedicalRecord storage r = medicalRecords[patient][idx];
        return (r.ipfsHash, r.uploader, r.timestamp);
    }

    function grantAccess(address grantee) external {
        accessGranted[msg.sender][grantee] = true;
        emit AccessChanged(msg.sender, grantee, true);
    }

    function revokeAccess(address grantee) external {
        accessGranted[msg.sender][grantee] = false;
        emit AccessChanged(msg.sender, grantee, false);
    }

    // ------------ Doctor Assignment ------------
    mapping(address => address) public assignedDoctor;
    mapping(address => address[]) public doctorsOfHospital;

    function addDoctorToHospital(address doctor) external onlyRole(Role.Hospital) {
        require(role[doctor] == Role.Doctor, "not doctor");
        doctorsOfHospital[msg.sender].push(doctor);
        emit DoctorAddedToHospital(msg.sender, doctor);
    }

    function assignDoctor(address patient, address doctor) external onlyRole(Role.Hospital) {
        require(role[doctor] == Role.Doctor, "not doctor");
        assignedDoctor[patient] = doctor;
        emit DoctorAssigned(patient, doctor, msg.sender);
    }

    // ------------ Appointments ------------
    struct Appointment {
        address patient;
        address doctor;
        uint256 when;
        bool approved;
        bool cancelled;
    }

    Appointment[] public appointments;

    function bookAppointment(address doctor, uint256 when)
        external
        onlyRole(Role.Patient)
        returns (uint256)
    {
        require(role[doctor] == Role.Doctor, "not doctor");
        appointments.push(Appointment(msg.sender, doctor, when, false, false));
        uint256 id = appointments.length - 1;
        emit AppointmentCreated(id, msg.sender, doctor, when);
        return id;
    }

    function approveAppointment(uint256 appointmentId) external onlyRole(Role.Doctor) {
        require(appointmentId < appointments.length, "invalid id");
        Appointment storage a = appointments[appointmentId];
        require(!a.cancelled, "cancelled");
        require(a.doctor == msg.sender, "not yours");
        a.approved = true;
        emit AppointmentApproved(appointmentId, msg.sender);
    }

    function cancelAppointment(uint256 appointmentId) external {
        require(appointmentId < appointments.length, "invalid id");
        Appointment storage a = appointments[appointmentId];
        require(!a.cancelled, "already cancelled");
        require(msg.sender == a.patient || msg.sender == a.doctor, "not allowed");
        a.cancelled = true;
        emit AppointmentCancelled(appointmentId, msg.sender);
    }

    // ------------ Prescriptions ------------

    function addPrescription(address patient, string calldata ipfsHash)
        external
        onlyRole(Role.Doctor)
    {
        require(accessGranted[patient][msg.sender] || assignedDoctor[patient] == msg.sender, "no access");
        prescriptions[patient].push(Prescription(ipfsHash, msg.sender, block.timestamp, false));
        emit PrescriptionAdded(patient, msg.sender, ipfsHash, block.timestamp);
    }

    function getPrescriptionCount(address patient) external view returns (uint256) {
        return prescriptions[patient].length;
    }

    function getPrescription(address patient, uint256 index)
        external
        view
        returns (string memory, address, uint256, bool)
    {
        require(index < prescriptions[patient].length, "invalid index");
        Prescription storage p = prescriptions[patient][index];
        return (p.ipfsHash, p.doctor, p.timestamp, p.filled);
    }

    function fillPrescription(address patient, uint256 index)
        external
        onlyRole(Role.Pharmacy)
    {
        require(index < prescriptions[patient].length, "invalid index");
        Prescription storage p = prescriptions[patient][index];
        require(!p.filled, "already filled");
        p.filled = true;
        emit PrescriptionFilled(patient, index, msg.sender);
    }

    // ------------ Insurance ------------
    mapping(address => uint256) public insuranceBalances;

    function depositInsurance() external payable onlyRole(Role.Insurance) {
        require(msg.value > 0, "no value");
        insuranceBalances[msg.sender] += msg.value;
        emit InsuranceDeposited(msg.sender, msg.value);
    }

    struct Claim {
        address hospital;
        address patient;
        uint256 amount;
        bool paid;
        address insurer;
    }

    Claim[] public claims;

    function createClaim(address patient, uint256 amount, address insurer)
        external
        onlyRole(Role.Hospital)
        returns (uint256)
    {
        require(role[insurer] == Role.Insurance, "not insurer");
        claims.push(Claim(msg.sender, patient, amount, false, insurer));
        uint256 id = claims.length - 1;
        emit ClaimCreated(id, msg.sender, patient, amount);
        return id;
    }

    function approveClaim(uint256 claimId) external onlyRole(Role.Insurance) {
        require(claimId < claims.length, "invalid id");
        Claim storage c = claims[claimId];
        require(c.insurer == msg.sender, "not insurer");
        require(!c.paid, "already paid");
        require(insuranceBalances[msg.sender] >= c.amount, "insufficient funds");

        insuranceBalances[msg.sender] -= c.amount;
        (bool sent, ) = payable(c.hospital).call{value: c.amount}("");
        require(sent, "payment failed");

        c.paid = true;
        emit ClaimApproved(claimId, msg.sender, c.hospital, c.amount);
    }
    function rejectClaim(uint256 claimId) external onlyRole(Role.Insurance) {
        require(claimId < claims.length, "invalid id");
        Claim storage c = claims[claimId];

        require(c.insurer == msg.sender, "not insurer");
        require(!c.paid, "already approved/paid");

        emit ClaimRejected(claimId, msg.sender, c.hospital);
    }

    // ------------ Utility / Admin ------------
    function withdraw(uint256 amount) external onlyOwner {
        payable(owner).transfer(amount);
    }
}
