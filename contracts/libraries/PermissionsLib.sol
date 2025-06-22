// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IMedicalAccess.sol";

library PermissionsLib {
    struct AccessPermissionStorage {
        mapping(address => IMedicalAccess.AccessPermission[]) patientPermissions;
        mapping(address => IMedicalAccess.AccessPermission[]) doctorPermissions;
        uint256 nextRequestId;
    }

    function grantTemporaryAccess(
        AccessPermissionStorage storage self,
        address doctor,
        address patient,
        string[] calldata dataFields,
        uint256 duration
    ) external returns (uint256 requestId) {
        requestId = self.nextRequestId++;
        uint256 expiryTime = block.timestamp + duration;

        IMedicalAccess.AccessPermission memory permission = IMedicalAccess
            .AccessPermission({
                requestId: requestId,
                doctor: doctor,
                patient: patient,
                expiryTime: expiryTime,
                dataFields: dataFields,
                isActive: true
            });
        self.doctorPermissions[doctor].push(permission);
        self.patientPermissions[patient].push(permission);
    }

    function extendAccess(
        AccessPermissionStorage storage self,
        address doctor,
        address patient,
        uint256 requestId,
        uint256 additionalDuration
    ) external {
        bool found;
        IMedicalAccess.AccessPermission[] storage doctorPerms = self
            .doctorPermissions[doctor];
        for (uint i = 0; i < doctorPerms.length; i++) {
            if (
                doctorPerms[i].requestId == requestId &&
                doctorPerms[i].patient == patient
            ) {
                require(doctorPerms[i].isActive, "Permission not active");
                doctorPerms[i].expiryTime += additionalDuration;
                found = true;
                break;
            }
        }

        IMedicalAccess.AccessPermission[] storage patientPerms = self
            .patientPermissions[patient];
        for (uint i = 0; i < patientPerms.length; i++) {
            if (
                patientPerms[i].requestId == requestId &&
                patientPerms[i].doctor == doctor
            ) {
                require(patientPerms[i].isActive, "Permission not active");
                patientPerms[i].expiryTime += additionalDuration;
                break;
            }
        }

        if (!found) revert("Permission not found");
    }

    function revokeAccessEarly(
        AccessPermissionStorage storage self,
        address doctor,
        address patient,
        uint256 requestId
    ) external {
        bool found;

        // Doctor's permissions
        IMedicalAccess.AccessPermission[] storage doctorPerms = self
            .doctorPermissions[doctor];
        for (uint i = 0; i < doctorPerms.length; i++) {
            if (
                doctorPerms[i].requestId == requestId &&
                doctorPerms[i].patient == patient
            ) {
                require(doctorPerms[i].isActive, "Permission not active");
                doctorPerms[i].isActive = false;
                found = true;
                break;
            }
        }

        // Patient's permissions
        IMedicalAccess.AccessPermission[] storage patientPerms = self
            .patientPermissions[patient];
        for (uint i = 0; i < patientPerms.length; i++) {
            if (
                patientPerms[i].requestId == requestId &&
                patientPerms[i].doctor == doctor
            ) {
                require(patientPerms[i].isActive, "Permission not active");
                patientPerms[i].isActive = false;
                break;
            }
        }

        if (!found) revert("Permission not found");
    }

    function getDoctorAccess(
        AccessPermissionStorage storage self,
        address doctor
    ) external view returns (IMedicalAccess.AccessPermission[] memory) {
        IMedicalAccess.AccessPermission[] storage all = self.doctorPermissions[
            doctor
        ];
        uint256 activeCount = 0;

        for (uint i = 0; i < all.length; i++) {
            if (all[i].isActive && all[i].expiryTime > block.timestamp) {
                activeCount++;
            }
        }

        IMedicalAccess.AccessPermission[]
            memory result = new IMedicalAccess.AccessPermission[](activeCount);
        uint256 index = 0;

        for (uint i = 0; i < all.length; i++) {
            if (all[i].isActive && all[i].expiryTime > block.timestamp) {
                result[index] = all[i];
                index++;
            }
        }

        return result;
    }

    function getPatientPermissions(
        AccessPermissionStorage storage self,
        address patient
    ) external view returns (IMedicalAccess.AccessPermission[] memory) {
        IMedicalAccess.AccessPermission[] storage all = self.patientPermissions[
            patient
        ];
        uint256 activeCount = 0;

        for (uint i = 0; i < all.length; i++) {
            if (all[i].isActive && all[i].expiryTime > block.timestamp) {
                activeCount++;
            }
        }

        IMedicalAccess.AccessPermission[]
            memory result = new IMedicalAccess.AccessPermission[](activeCount);
        uint256 index = 0;

        for (uint i = 0; i < all.length; i++) {
            if (all[i].isActive && all[i].expiryTime > block.timestamp) {
                result[index] = all[i];
                index++;
            }
        }

        return result;
    }
}
