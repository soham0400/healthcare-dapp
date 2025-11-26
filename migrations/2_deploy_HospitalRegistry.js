const HospitalRegistry = artifacts.require("HospitalRegistry");

module.exports = function (deployer) {
  deployer.deploy(HospitalRegistry);
};
