import styled from "styled-components"

export const PrescriptionContainer = styled.div`
    max-width: 800px;
    margin: 0 auto;
`

export const PrescriptionList = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`

export const PrescriptionItem = styled.div`
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h4 {
        margin-top: 0;
        color: #2c3e50;
    }

    p {
        margin: 8px 0;
        color: #34495e;
    }
`

export const NewPrescriptionForm = styled.form`
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    h3 {
        margin-top: 0;
        color: #2c3e50;
        text-align: center;
        margin-bottom: 25px;
    }
`

export const FormGroup = styled.div`
    margin-bottom: 20px;
`

export const Label = styled.label`
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #2c3e50;
`

export const Input = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const TextArea = styled.textarea`
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    min-height: 80px;
    resize: vertical;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const Select = styled.select`
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    background: white;

    &:focus {
        outline: none;
        border-color: #3498db;
    }
`

export const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
`

export const SubmitButton = styled.button`
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background-color: #2980b9;
    }
`

export const CancelButton = styled.button`
    background-color: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;

    &:hover {
        background-color: #c0392b;
    }
`

export const EmptyState = styled.div`
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
    font-size: 1.1em;
`
