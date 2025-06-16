import styled from "styled-components"

export const DashboardContainer = styled.div`
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
`

export const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
`

export const DoctorInfo = styled.div`
    h2 {
        margin: 0;
        color: #2c3e50;
    }

    p {
        margin: 5px 0 0;
        color: #7f8c8d;
        font-style: italic;
    }
`

export const TabContainer = styled.div`
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
`

export const TabButton = styled.button`
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid
        ${(props) => (props.active ? "#3498db" : "transparent")};
    color: ${(props) => (props.active ? "#3498db" : "#7f8c8d")};
    font-weight: ${(props) => (props.active ? "600" : "400")};
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: #3498db;
    }
`

export const ContentArea = styled.div`
    padding: 20px 0;
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
