import styled from "styled-components"

export const HistoryContainer = styled.div`
    max-width: 1000px;
    margin: 0 auto;
`

export const FilterControls = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: center;

    & > div {
        display: flex;
        align-items: center;
        gap: 10px;
    }

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
    color: black;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const HistoryList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`

export const HistoryItem = styled.div`
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;

    & > div {
        flex: 1;
    }

    h4 {
        margin-top: 0;
        color: #2c3e50;
    }

    p {
        margin: 8px 0;
        color: #34495e;
    }
`

export const PaginationControls = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 30px;

    button {
        padding: 8px 16px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
            background: #2980b9;
        }

        &:disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }
    }

    span {
        color: #7f8c8d;
    }
`

export const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
    font-size: 1.1em;
`
