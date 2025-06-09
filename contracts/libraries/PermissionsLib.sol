// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IMedicalAccess.sol";

library PermissionsLib {
    struct AccessPermissionStorage {
        mapping(address => IMedicalAccess.AccessPermission[]) patientPermissions;
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

        self.patientPermissions[patient].push(
            IMedicalAccess.AccessPermission({
                requestId: requestId,
                doctor: doctor,
                patient: patient,
                expiryTime: expiryTime,
                dataFields: dataFields,
                isActive: true
            })
        );
    }

    function extendAccess(
        AccessPermissionStorage storage self,
        address patient,
        uint256 requestId,
        uint256 additionalDuration
    ) external {
        IMedicalAccess.AccessPermission[] storage permissions = self
            .patientPermissions[patient];
        for (uint i = 0; i < permissions.length; i++) {
            if (permissions[i].requestId == requestId) {
                require(permissions[i].isActive, "Permission not active");
                permissions[i].expiryTime += additionalDuration;
                return;
            }
        }
        revert("Permission not found");
    }

    function revokeAccessEarly(
        AccessPermissionStorage storage self,
        address patient,
        uint256 requestId
    ) external {
        IMedicalAccess.AccessPermission[] storage permissions = self
            .patientPermissions[patient];
        for (uint i = 0; i < permissions.length; i++) {
            if (permissions[i].requestId == requestId) {
                require(permissions[i].isActive, "Permission not active");
                permissions[i].isActive = false;
                return;
            }
        }
        revert("Permission not found");
    }

    function getActivePermissions(
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
