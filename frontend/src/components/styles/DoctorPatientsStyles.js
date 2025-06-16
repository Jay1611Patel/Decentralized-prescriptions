import styled from "styled-components"

export const PatientListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`

export const PatientCard = styled.div`
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
`

export const PatientHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h3 {
        margin: 0;
        color: #2c3e50;
    }

    small {
        color: #7f8c8d;
        font-size: 0.8em;
    }
`

export const PatientDetails = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 15px;

    & > div {
        flex: 1;
    }

    p {
        margin: 5px 0;
        color: #34495e;
    }
`

export const AccessInfo = styled.div`
    background: #f8f9fa;
    padding: 10px;
    border-radius: 4px;

    p {
        margin: 5px 0;
        color: #7f8c8d;
        font-size: 0.9em;
    }
`

export const DataFields = styled.div`
    margin-bottom: 10px;
`

export const SearchBar = styled.input`
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 500px;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
    font-size: 1.1em;
`

export const ActionButton = styled.button`
    background-color: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background-color: #2980b9;
    }

    &:disabled {
        background-color: #95a5a6;
        cursor: not-allowed;
    }
`
