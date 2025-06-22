import styled from "styled-components"

export const RefillsContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
`

export const FilterControls = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;

    label {
        font-weight: 500;
        color: #2c3e50;
    }
`

export const Select = styled.select`
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background: white;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const RefillList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`

export const RefillItem = styled.div`
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 4px solid
        ${(props) =>
            props.status === "approved"
                ? "#2ecc71"
                : props.status === "denied"
                ? "#e74c3c"
                : "#f39c12"};
    display: flex;
    justify-content: space-between;
`

export const RefillDetails = styled.div`
    flex: 1;

    h4 {
        margin-top: 0;
        color: #2c3e50;
    }

    p {
        margin: 8px 0;
        color: #34495e;
    }
`

export const ActionButtons = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    min-width: 120px;
`

export const ApproveButton = styled.button`
    background-color: #2ecc71;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background-color: #27ae60;
    }

    &:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }
`

export const DenyButton = styled.button`
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background-color: #c0392b;
    }

    &:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }
`

export const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
    font-size: 1.1em;
`
