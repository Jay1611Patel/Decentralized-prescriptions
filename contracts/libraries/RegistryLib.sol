// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IMedicalAccess.sol";

library RegistryLib {
    struct DoctorRegistry {
        mapping(address => IMedicalAccess.DoctorProfile) doctorRegistry;
        mapping(address => uint256) doctorIndex;
        address[] doctorList;
    }

    struct PharmacistRegistry {
        mapping(address => IMedicalAccess.PharmacistProfile) pharmacistRegistry;
        mapping(address => uint256) pharmacistIndex;
        address[] pharmacistList;
    }

    function registerDoctor(
        DoctorRegistry storage self,
        address doctorAddress,
        string memory licenseHash,
        uint256 licenseExpiry,
        string memory name,
        string memory specialization
    ) external {
        self.doctorRegistry[doctorAddress] = IMedicalAccess.DoctorProfile({
            licenseHash: licenseHash,
            expiryDate: licenseExpiry,
            name: name,
            specialization: specialization,
            isActive: true
        });
        self.doctorList.push(doctorAddress);
        self.doctorIndex[doctorAddress] = self.doctorList.length;
    }

    function revokeDoctor(
        DoctorRegistry storage self,
        address doctorAddress
    ) external {
        uint256 index = self.doctorIndex[doctorAddress];
        require(index > 0, "Not an active doctor");
        require(
            self.doctorRegistry[doctorAddress].isActive,
            "Not an active doctor"
        );

        self.doctorList[index - 1] = self.doctorList[
            self.doctorList.length - 1
        ];
        self.doctorIndex[self.doctorList[index - 1]] = index;
        self.doctorList.pop();
        self.doctorIndex[doctorAddress] = 0;

        self.doctorRegistry[doctorAddress].isActive = false;
    }

    function registerPharmacist(
        PharmacistRegistry storage self,
        address pharmacistAddress,
        string memory pharmacyId,
        string memory pharmacyName
    ) external {
        self.pharmacistRegistry[pharmacistAddress] = IMedicalAccess
            .PharmacistProfile({
                pharmacyId: pharmacyId,
                pharmacyName: pharmacyName,
                isVerified: true
            });
        self.pharmacistList.push(pharmacistAddress);
        self.pharmacistIndex[pharmacistAddress] = self.pharmacistList.length;
    }

    function revokePharmacist(
        PharmacistRegistry storage self,
        address pharmacistAddress
    ) external {
        uint256 index = self.pharmacistIndex[pharmacistAddress];
        require(index > 0, "Pharmacist not registered");
        require(
            self.pharmacistRegistry[pharmacistAddress].isVerified,
            "Pharmacist not verified"
        );

        self.pharmacistList[index - 1] = self.pharmacistList[
            self.pharmacistList.length - 1
        ];
        self.pharmacistIndex[self.pharmacistList[index - 1]] = index;
        self.pharmacistList.pop();
        self.pharmacistIndex[pharmacistAddress] = 0;
    }

    function getDoctor(
        DoctorRegistry storage self,
        address doctorAddress
    ) external view returns (IMedicalAccess.DoctorProfile memory) {
        return self.doctorRegistry[doctorAddress];
    }

    function getPharmacist(
        PharmacistRegistry storage self,
        address pharmacistAddress
    ) external view returns (IMedicalAccess.PharmacistProfile memory) {
        return self.pharmacistRegistry[pharmacistAddress];
    }

    function getAllDoctors(
        DoctorRegistry storage self
    ) external view returns (address[] memory) {
        return self.doctorList;
    }

    function getAllPharmacists(
        PharmacistRegistry storage self
    ) external view returns (address[] memory) {
        return self.pharmacistList;
    }

    function getDoctorCount(
        DoctorRegistry storage self
    ) external view returns (uint256) {
        return self.doctorList.length;
    }

    function getPharmacistCount(
        PharmacistRegistry storage self
    ) external view returns (uint256) {
        return self.pharmacistList.length;
    }
}
