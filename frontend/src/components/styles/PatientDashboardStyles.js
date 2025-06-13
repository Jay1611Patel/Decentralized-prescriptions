// styles/PatientDashboardStyles.js
import styled from "styled-components"

export const DashboardContainer = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
`

export const TabContainer = styled.div`
    display: flex;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;
`

export const TabButton = styled.button`
    padding: 10px 20px;
    background: ${(props) => (props.active ? "#f0f7ff" : "transparent")};
    border: none;
    border-bottom: ${(props) => (props.active ? "2px solid #1976d2" : "none")};
    color: ${(props) => (props.active ? "#1976d2" : "#666")};
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #f5f5f5;
    }
`

export const ContentArea = styled.div`
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

export const ActionButton = styled.button`
    background: #1976d2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 8px;

    &:hover {
        background: #1565c0;
    }
`

export const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`

export const ModalContainer = styled.div`
    background: white;
    border-radius: 8px;
    width: 500px;
    max-width: 90%;
    max-height: 90vh;
    overflow-y: auto;
`

export const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    color: #333;
`

export const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;

    &:hover {
        color: #333;
    }
`

export const Form = styled.form`
    padding: 20px;
`

export const FormGroup = styled.div`
    margin-bottom: 20px;
`

export const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
`

export const Select = styled.select`
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
`

export const OptionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: #333;
`

export const OptionItem = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`

export const Checkbox = styled.input`
    width: 18px;
    height: 18px;
`

export const OptionLabel = styled.label`
    cursor: pointer;
`

export const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 30px;
`

export const CancelButton = styled.button`
    background: #f5f5f5;
    color: #333;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        background: #e0e0e0;
    }
`

export const SubmitButton = styled.button`
    background: #1976d2;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        background: #1565c0;
    }

    &:disabled {
        background: #b0bec5;
        cursor: not-allowed;
    }
`

export const ErrorMessage = styled.div`
    color: #d32f2f;
    background: #fde7e7;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 20px;
`

export const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #666;
`

export const PermissionsContainer = styled.div``

export const PermissionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`

export const PermissionItem = styled.div`
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
`

export const PermissionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
`

export const DoctorName = styled.div`
    font-weight: 500;
    color: #1976d2;
`

export const PermissionStatus = styled.div`
    color: #666;
    font-size: 14px;
`

export const PermissionDetails = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`

export const DataFields = styled.div`
    color: #333;
    font-size: 14px;
`

export const ActionButtons = styled.div`
    display: flex;
    gap: 10px;
`

export const ExtendButton = styled.button`
    background: #4caf50;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
        background: #388e3c;
    }

    &:disabled {
        background: #a5d6a7;
        cursor: not-allowed;
    }
`

export const RevokeButton = styled.button`
    background: #f44336;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;

    &:hover {
        background: #d32f2f;
    }

    &:disabled {
        background: #ef9a9a;
        cursor: not-allowed;
    }
`
